import { Injectable } from '@nestjs/common';
import { CyclesService } from '../cycles/cycles.service';
import { SymptomsService } from '../symptoms/symptoms.service';

/**
 * HealthReportService — produces data shaped exactly for the Health Report UI:
 *
 * ┌─────────────────────────────────────────────────────────┐
 * │ Cycle Summary – October 2025                            │
 * │  🌸 Cycle Length: 29 Days  💧 Period Duration: 4 Days   │
 * │  📅 Estimated Next Period: Nov 4  🔵 Ovulation: Oct17-22│
 * ├───────────────────────┬─────────────────────────────────┤
 * │ Period Length chart   │ Flow & Symptoms Summary         │
 * │ (flow intensity pts)  │ (narrative + tips)              │
 * ├───────────────────────┴─────────────────────────────────┤
 * │ Symptom Frequency donuts                                │
 * │  Physical Pain 55%  Mood & Mental 75%                   │
 * │  Digestion 82%      Sexual Health 33%  Digestion 20%    │
 * ├─────────────────────────────────────────────────────────┤
 * │ Historical Cycle Data table                             │
 * │  Date | Top Symptom | Total Symptoms Score | Note       │
 * └─────────────────────────────────────────────────────────┘
 */
@Injectable()
export class HealthReportService {
  constructor(
    private readonly cyclesService: CyclesService,
    private readonly symptomsService: SymptomsService,
  ) {}

  async getReport(userId: string, month?: string) {
    const [cycleStats, frequencyData, allCycles] = await Promise.all([
      this.cyclesService.getStats(userId),
      this.symptomsService.getFrequency(userId),
      this.cyclesService.findByUser(userId),
    ]);

    // ── 1. Cycle Summary card ────────────────────────────────────────────
    // Find the most recent (or month-matching) cycle for next-period prediction
    const targetCycle = month
      ? allCycles.find((c) => c.label === month || c.startDate?.startsWith(month.slice(0, 7)))
      : allCycles[0]; // findByUser returns newest first

    const avgCycleLength = cycleStats.averageCycleLength ?? 29;
    const avgPeriodLength = cycleStats.averagePeriodLength ?? 4;

    // Predict next period start from the latest cycle's start date
    let estimatedNextPeriod: string | null = null;
    let ovulationWindow: string | null = null;

    if (targetCycle?.startDate) {
      const start = new Date(targetCycle.startDate);
      // Next period = current cycle start + average cycle length
      const nextPeriodDate = new Date(start);
      nextPeriodDate.setDate(nextPeriodDate.getDate() + avgCycleLength);
      estimatedNextPeriod = this.formatDate(nextPeriodDate); // e.g. "Nov 4"

      // Ovulation ~ 14 days before next period (Ogino–Knaus rule)
      const ovStart = new Date(nextPeriodDate);
      ovStart.setDate(ovStart.getDate() - 16);
      const ovEnd = new Date(nextPeriodDate);
      ovEnd.setDate(ovEnd.getDate() - 12);
      ovulationWindow = `${this.formatShortDate(ovStart)}-${this.formatShortDate(ovEnd)}`; // "Oct 17-22"
    }

    const cycleSummary = {
      /** Shown in the top pill badges */
      cycleLength: avgCycleLength,           // "29 Days"
      periodDuration: avgPeriodLength,        // "4 Days"
      estimatedNextPeriod,                    // "Nov 4"
      ovulationWindow,                        // "Oct 17-22"
      /** Raw stats also available */
      totalCycles: cycleStats.count,
      shortestCycle: cycleStats.shortestCycle,
      longestCycle: cycleStats.longestCycle,
      label: targetCycle?.label ?? month ?? 'All time',
    };

    // ── 2. Flow & Symptoms Summary (narrative panel) ─────────────────────
    const allLogs = await this.symptomsService.findByUser(userId);

    // Flow intensity data points for the Period Length line chart (sorted by date)
    const periodLengthChart = allLogs
      .sort((a, b) => a.date.localeCompare(b.date))
      .map((l) => ({
        date: l.date,
        flowIntensity: l.flowIntensity ?? 0,
      }));

    // Determine which symptom category was most frequent
    const physSymCount = allLogs.reduce((n, l) => n + (l.physicalSymptoms?.length ?? 0), 0);
    const moodSymCount = allLogs.reduce((n, l) => n + (l.moodSymptoms?.length ?? 0), 0);
    const dominantCategory = physSymCount >= moodSymCount ? 'Physical Pain' : 'Mood & Mental';

    const flowAndSymptomsSummary = {
      totalLogged: allLogs.length,
      averageCycleLength: avgCycleLength,
      dominantSymptomCategory: dominantCategory,  // drives narrative sentence
      narrative: `Your average cycle length is ${avgCycleLength} days. ${dominantCategory} symptoms were more frequent this month. Flow pattern remains within a typical range.`,
      tips: [
        'Low sleep nights → higher cramp scores',
        'Low hydration → increased bloating',
      ],
    };

    // ── 3. Symptom Frequency donuts ──────────────────────────────────────
    // Each donut = percentage of logged days that included that category.
    // UI shows 5 donuts: Physical Pain, Mood & Mental, Digestion & Appetite,
    //                    Sexual Health, Digestion & Appetite (second instance)
    const totalDays = allLogs.length || 1;

    const daysWithPhysical  = allLogs.filter((l) => l.physicalSymptoms?.length > 0).length;
    const daysWithMood      = allLogs.filter((l) => l.moodSymptoms?.length > 0).length;
    const daysWithDigestion = allLogs.filter((l) =>
      l.physicalSymptoms?.some((s) =>
        ['Nausea', 'Diarrhoea', 'Abdominal pain', 'Appetite changes'].includes(s),
      ),
    ).length;
    const daysWithSexHealth = allLogs.filter((l) => l.sexualHealthSymptoms?.length > 0).length;
    const daysWithFlow      = allLogs.filter((l) => (l.flowIntensity ?? 0) > 0).length;

    const pct = (n: number) => Math.round((n / totalDays) * 100);

    const symptomFrequency = {
      /** Matches the 5 donut charts shown in the UI */
      donuts: [
        { key: 'physicalPain',       label: 'Physical Pain',       percentage: pct(daysWithPhysical),  color: '#E8386D' },
        { key: 'moodMental',         label: 'Mood & Mental',       percentage: pct(daysWithMood),      color: '#9B51E0' },
        { key: 'digestionAppetite',  label: 'Digestion & Appetite',percentage: pct(daysWithDigestion), color: '#27AE60' },
        { key: 'sexualHealth',       label: 'Sexual Health',       percentage: pct(daysWithSexHealth), color: '#F2994A' },
        { key: 'digestionAppetite2', label: 'Digestion & Appetite',percentage: pct(daysWithFlow),      color: '#F2C94C' },
      ],
      /** Flat breakdown for deeper analytics */
      breakdown: frequencyData.symptoms ?? [],
    };

    // ── 4. Historical Cycle Data table ───────────────────────────────────
    // UI shows: Date | Top Symptoms | Total Symptoms (score e.g. "8/10") | Note
    // Filtered by requested month if provided, otherwise all cycles
   // Inside getReport() method — replace the historicalCycleData block

// ── 4. Historical Cycle Data table ───────────────────────────────────
const filteredCycles = month
  ? allCycles.filter((c) => c.label === month || c.startDate?.startsWith(month.slice(0, 7)))
  : allCycles;

const historicalCycleData = [];

for (const cycle of filteredCycles) {
  const logs = await this.symptomsService.findByCycle(cycle._id?.toString());

  for (const log of logs) {
    const logAllSymptoms = [
      ...(log.physicalSymptoms ?? []),
      ...(log.moodSymptoms ?? []),
      ...(log.sexualHealthSymptoms ?? []),
    ];

    const symMap: Record<string, number> = {};
    logAllSymptoms.forEach((s) => {
      symMap[s] = (symMap[s] ?? 0) + 1;
    });

    const topSymptom =
      Object.entries(symMap).sort((a, b) => b[1] - a[1])[0]?.[0] ?? 'Physical Pain';

    const distinctCount = Object.keys(symMap).length;

    historicalCycleData.push({
      date: log.date,
      topSymptom,
      totalSymptoms: `${Math.min(distinctCount, 10)}/10`,
      note: log.notes ?? null,
    });
  }
}

// Sort by date descending (newest first, like in the screenshot)
historicalCycleData.sort((a, b) => b.date.localeCompare(a.date));
    // ── 5. Assemble final response ────────────────────────────────────────
    return {
  userId,
  reportMonth: targetCycle?.label ?? month ?? 'All time',
  cycleSummary,
  flowAndSymptomsSummary,
  periodLengthChart,           // for your line chart
  symptomFrequency,
  historicalCycleData,         // ← now flat array of rows
};
  }

  // ── Date formatting helpers ──────────────────────────────────────────────

  /** "Nov 4" */
  private formatDate(d: Date): string {
    return d.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
  }

  /** "Oct 17" */
  private formatShortDate(d: Date): string {
    return d.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
  }
}
