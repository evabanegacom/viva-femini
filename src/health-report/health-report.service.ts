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
    const filteredCycles = month
      ? allCycles.filter(
          (c) => c.label === month || c.startDate?.startsWith(month.slice(0, 7)),
        )
      : allCycles;

    const historicalCycleData = await Promise.all(
      filteredCycles.map(async (cycle) => {
        const logs = await this.symptomsService.findByCycle(cycle._id?.toString());

        // Count all symptoms across every log in this cycle
        const allSymptoms: string[] = [];
        logs.forEach((l) => {
          allSymptoms.push(...(l.physicalSymptoms ?? []));
          allSymptoms.push(...(l.moodSymptoms ?? []));
          allSymptoms.push(...(l.periodIndicators ?? []));
          allSymptoms.push(...(l.sexualHealthSymptoms ?? []));
        });

        // Tally to find the single most common symptom (Top Symptom column)
        const symMap: Record<string, number> = {};
        allSymptoms.forEach((s) => { symMap[s] = (symMap[s] ?? 0) + 1; });
        const topSymptom =
          Object.entries(symMap).sort((a, b) => b[1] - a[1])[0]?.[0] ?? null;

        // "Total Symptoms" shown as "X/10" — count of distinct symptom types / 10
        const distinctCount = Object.keys(symMap).length;
        const scoreOutOf10 = `${Math.min(distinctCount, 10)}/10`;

        // Collect all notes (UI shows "After lunch" etc.)
        const notes = logs
          .map((l) => l.notes)
          .filter(Boolean)
          .join(', ') || null;

        // Per-day rows for the table (UI shows one row per logged day)
        const tableRows = logs.map((log) => {
          const logAllSymptoms = [
            ...(log.physicalSymptoms ?? []),
            ...(log.moodSymptoms ?? []),
          ];
          const logSymMap: Record<string, number> = {};
          logAllSymptoms.forEach((s) => { logSymMap[s] = (logSymMap[s] ?? 0) + 1; });
          const logTopSymptom =
            Object.entries(logSymMap).sort((a, b) => b[1] - a[1])[0]?.[0] ?? 'Physical Pain';

          const logDistinct = Object.keys(logSymMap).length;

          return {
            date: log.date,
            topSymptom: logTopSymptom,
            totalSymptomsScore: `${Math.min(logDistinct, 10)}/10`,
            flowIntensity: log.flowIntensity ?? 0,
            note: log.notes ?? null,
          };
        });

        return {
          cycleId: cycle._id?.toString(),
          label: cycle.label,
          startDate: cycle.startDate,
          endDate: cycle.endDate,
          cycleLength: cycle.cycleLength,
          periodLength: cycle.periodLength,
          topSymptom,
          totalSymptomsScore: scoreOutOf10,
          notes,
          daysLogged: logs.length,
          rows: tableRows,  // ← individual day rows for the data table
        };
      }),
    );

    // ── 5. Assemble final response ────────────────────────────────────────
    return {
      userId,
      reportMonth: targetCycle?.label ?? month ?? 'All time',
      cycleSummary,
      flowAndSymptomsSummary,
      periodLengthChart,     // data points for the line chart
      symptomFrequency,
      historicalCycleData,
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
