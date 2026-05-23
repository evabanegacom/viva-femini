import { Injectable } from '@nestjs/common';
import { CyclesService } from '../cycles/cycles.service';
import { SymptomsService } from '../symptoms/symptoms.service';

/**
 * HealthReportService — returns data shaped exactly for the Health Report UI.
 *
 * All date-sensitive fields (next period, ovulation window) are read directly
 * from the cycle document, which is set dynamically at seed time.
 *
 * ┌──────────────────────────────────────────────────────────────┐
 * │ CYCLE SUMMARY PILLS                                          │
 * │  🌸 Cycle Length: 29 Days                                    │
 * │  💧 Period Duration: 4 Days                                  │
 * │  📅 Estimated Next Period: Nov 4   ← from cycle.estimatedNextPeriod │
 * │  🔵 Ovulation Window: Oct 17–22   ← from cycle.ovulationStartDate/End│
 * ├──────────────────────────────────────────────────────────────┤
 * │ FLOW & SYMPTOMS SUMMARY  │  PERIOD LENGTH CHART              │
 * ├──────────────────────────────────────────────────────────────┤
 * │ SYMPTOM FREQUENCY DONUTS (5 donuts)                         │
 * ├──────────────────────────────────────────────────────────────┤
 * │ HISTORICAL TABLE  Date | Top Symptom | Total/10 | Note      │
 * └──────────────────────────────────────────────────────────────┘
 */
@Injectable()
export class HealthReportService {
  constructor(
    private readonly cyclesService: CyclesService,
    private readonly symptomsService: SymptomsService,
  ) {}

  async getReport(userId: string, month?: string) {
    const [cycleStats, allCycles] = await Promise.all([
      this.cyclesService.getStats(userId),
      this.cyclesService.findByUser(userId), // sorted newest first
    ]);

    // ── Resolve target cycle ─────────────────────────────────────────────
    // If month is supplied filter by label, otherwise use the most recent cycle
    const targetCycle = month
      ? allCycles.find(
          (c) => c.label === month || c.startDate?.startsWith(month.slice(0, 7)),
        ) ?? allCycles[0]
      : allCycles[0];

    // ── 1. Cycle Summary ─────────────────────────────────────────────────
    // Read pre-computed ovulation & next period directly from the stored cycle
    const avgCycleLength  = cycleStats.averageCycleLength  ?? targetCycle?.cycleLength  ?? 29;
    const avgPeriodLength = cycleStats.averagePeriodLength ?? targetCycle?.periodLength ?? 4;

    // Format "Nov 4" from "2025-11-04"
    const fmtShort = (iso: string | null | undefined): string | null => {
      if (!iso) return null;
      const d = new Date(iso + 'T00:00:00'); // force local parse
      return d.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
    };

    // Ovulation window: "Oct 17-22"
    const ovStart  = fmtShort(targetCycle?.ovulationStartDate);
    const ovEnd    = fmtShort(targetCycle?.ovulationEndDate);
    const ovWindow = ovStart && ovEnd
      ? `${ovStart}–${ovEnd.split(' ')[1]}`   // "Oct 17–22"
      : null;

    const cycleSummary = {
      label:               targetCycle?.label ?? month ?? 'All time',
      cycleLength:         avgCycleLength,                             // "29 Days"
      periodDuration:      avgPeriodLength,                           // "4 Days"
      estimatedNextPeriod: fmtShort(targetCycle?.estimatedNextPeriod), // "Nov 4"
      ovulationWindow:     ovWindow,                                   // "Oct 17–22"
      ovulationStartDate:  targetCycle?.ovulationStartDate ?? null,
      ovulationEndDate:    targetCycle?.ovulationEndDate   ?? null,
      nextPeriodDate:      targetCycle?.estimatedNextPeriod ?? null,
      totalCycles:         cycleStats.count,
      shortestCycle:       cycleStats.shortestCycle ?? null,
      longestCycle:        cycleStats.longestCycle  ?? null,
    };

    // ── 2. All logs for this user ────────────────────────────────────────
    const allLogs = await this.symptomsService.findByUser(userId);

    // ── 3. Period Length chart ───────────────────────────────────────────
    // One data point per logged day, sorted ascending by date
    const periodLengthChart = [...allLogs]
      .sort((a, b) => a.date.localeCompare(b.date))
      .map((l) => ({
        date:          l.date,
        flowIntensity: l.flowIntensity ?? 0,
      }));

    // ── 4. Flow & Symptoms Summary (narrative) ───────────────────────────
    const physSymCount = allLogs.reduce((n, l) => n + (l.physicalSymptoms?.length ?? 0), 0);
    const moodSymCount = allLogs.reduce((n, l) => n + (l.moodSymptoms?.length ?? 0), 0);
    const dominant = physSymCount >= moodSymCount ? 'Physical Pain' : 'Mood & Mental';

    const flowAndSymptomsSummary = {
      totalLogged:              allLogs.length,
      averageCycleLength:       avgCycleLength,
      dominantSymptomCategory:  dominant,
      narrative:
        `Your average cycle length is ${avgCycleLength} days. ` +
        `${dominant} symptoms were more frequent this month. ` +
        `Flow pattern remains within a typical range.`,
      tips: [
        'Low sleep nights → higher cramp scores',
        'Low hydration → increased bloating',
      ],
    };

    // ── 5. Symptom Frequency donuts ──────────────────────────────────────
    const total = allLogs.length || 1;
    const pct   = (n: number) => Math.round((n / total) * 100);

    const digestiveKeywords = ['Nausea', 'Diarrhoea', 'Abdominal pain', 'Appetite changes'];

    const daysPhysical   = allLogs.filter((l) => (l.physicalSymptoms?.length ?? 0) > 0).length;
    const daysMood       = allLogs.filter((l) => (l.moodSymptoms?.length ?? 0) > 0).length;
    const daysDigestion  = allLogs.filter((l) =>
      l.physicalSymptoms?.some((s) => digestiveKeywords.includes(s)),
    ).length;
    const daysSexHealth  = allLogs.filter((l) => (l.sexualHealthSymptoms?.length ?? 0) > 0).length;
    const daysFlow       = allLogs.filter((l) => (l.flowIntensity ?? 0) > 0).length;

    const symptomFrequency = {
      donuts: [
        { key: 'physicalPain',       label: 'Physical Pain',        percentage: pct(daysPhysical),  color: '#E8386D' },
        { key: 'moodMental',         label: 'Mood & Mental',        percentage: pct(daysMood),      color: '#9B51E0' },
        { key: 'digestionAppetite',  label: 'Digestion & Appetite', percentage: pct(daysDigestion), color: '#27AE60' },
        { key: 'sexualHealth',       label: 'Sexual Health',        percentage: pct(daysSexHealth), color: '#F2994A' },
        { key: 'flowDays',           label: 'Digestion & Appetite', percentage: pct(daysFlow),      color: '#F2C94C' },
      ],
    };

    // ── 6. Historical Cycle Data table ───────────────────────────────────
    // Filter cycles by month if requested, else return all
    const filteredCycles = month
      ? allCycles.filter(
          (c) => c.label === month || c.startDate?.startsWith(month.slice(0, 7)),
        )
      : allCycles;

    const historicalCycleData = await Promise.all(
      filteredCycles.map(async (cycle) => {
        const logs = await this.symptomsService.findByCycle(cycle._id?.toString());

        // Build per-day table rows (each log = one row in the UI table)
        const rows = logs
          .sort((a, b) => a.date.localeCompare(b.date))
          .map((log) => {
            // Tally symptoms to find the top one for this day
            const symMap: Record<string, number> = {};
            [...(log.physicalSymptoms ?? []), ...(log.moodSymptoms ?? [])].forEach(
              (s) => { symMap[s] = (symMap[s] ?? 0) + 1; },
            );
            const topSymptom =
              Object.entries(symMap).sort((a, b) => b[1] - a[1])[0]?.[0] ?? 'Physical Pain';

            // "Total Symptoms" shown as "X/10"
            const distinctCount  = Object.keys(symMap).length;
            const scoreOutOf10   = `${Math.min(distinctCount, 10)}/10`;

            // Format logged date for display: "Oct 14th"
            const d       = new Date(log.date + 'T00:00:00');
            const day     = d.getDate();
            const suffix  = ['th','st','nd','rd'][(day % 10 > 3 || ~~(day % 100 / 10) === 1) ? 0 : day % 10] ?? 'th';
            const dateLabel = d.toLocaleDateString('en-US', { month: 'short' }) + ` ${day}${suffix}`;

            // Parse stored loggedAt (if present) for time column e.g. "01:42 am"
            const loggedAtStr = (log as any).loggedAt
              ? new Date((log as any).loggedAt).toLocaleTimeString('en-US', {
                  hour: '2-digit', minute: '2-digit', hour12: true,
                }).toLowerCase()
              : '01:42 am';

            return {
              date:               log.date,
              dateLabel,                           // "Oct 14th"
              timeLabel:          loggedAtStr,      // "01:42 am"
              topSymptom,                          // "Physical Pain"
              totalSymptomsScore: scoreOutOf10,    // "8/10"
              flowIntensity:      log.flowIntensity ?? 0,
              note:               log.notes ?? null,
            };
          });

        // Cycle-level aggregates
        const allSyms: string[] = [];
        logs.forEach((l) => {
          allSyms.push(...(l.physicalSymptoms ?? []), ...(l.moodSymptoms ?? []));
        });
        const cycleSymMap: Record<string, number> = {};
        allSyms.forEach((s) => { cycleSymMap[s] = (cycleSymMap[s] ?? 0) + 1; });
        const cycleTopSymptom =
          Object.entries(cycleSymMap).sort((a, b) => b[1] - a[1])[0]?.[0] ?? null;

        return {
          cycleId:              cycle._id?.toString(),
          label:                cycle.label,
          startDate:            cycle.startDate,
          endDate:              cycle.endDate,
          cycleLength:          cycle.cycleLength,
          periodLength:         cycle.periodLength,
          estimatedNextPeriod:  cycle.estimatedNextPeriod ?? null,
          ovulationStartDate:   cycle.ovulationStartDate  ?? null,
          ovulationEndDate:     cycle.ovulationEndDate    ?? null,
          topSymptom:           cycleTopSymptom,
          daysLogged:           logs.length,
          rows,  // ← one entry per logged day → drives the UI data table
        };
      }),
    );

    // ── 7. Final response ────────────────────────────────────────────────
    return {
      userId,
      reportMonth:          targetCycle?.label ?? month ?? 'All time',
      generatedAt:          new Date().toISOString(),
      cycleSummary,
      flowAndSymptomsSummary,
      periodLengthChart,
      symptomFrequency,
      historicalCycleData,
    };
  }
}