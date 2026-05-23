import { Injectable, Logger } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { User, UserDocument } from '../users/user.schema';
import { Cycle, CycleDocument } from '../cycles/cycle.schema';
import { SymptomLog, SymptomLogDocument } from '../symptoms/symptom-log.schema';

/**
 * SeedService — generates realistic demo data anchored to the CURRENT date.
 *
 * Key fix: current cycle ALWAYS starts on day 1 of the CURRENT month,
 * so the calendar label, startDate, and month all stay in sync.
 *
 * Cycle timeline (May 2026 example):
 *   startDate:           May  1  ← day 1 of current month
 *   period ends:         May  4  ← start + periodLength - 1
 *   ovulation starts:    May 12  ← start + 11
 *   ovulation ends:      May 17  ← start + 16
 *   next period:         May 30  ← start + cycleLength (29)
 */
@Injectable()
export class SeedService {
  private readonly logger = new Logger(SeedService.name);

  constructor(
    @InjectModel(User.name) private userModel: Model<UserDocument>,
    @InjectModel(Cycle.name) private cycleModel: Model<CycleDocument>,
    @InjectModel(SymptomLog.name) private logModel: Model<SymptomLogDocument>,
  ) {}

  // ── Date helpers ────────────────────────────────────────────────────────

  private addDays(d: Date, n: number): Date {
    const r = new Date(d);
    r.setDate(r.getDate() + n);
    return r;
  }

  /** Date → "YYYY-MM-DD" (local time, no UTC shift) */
  private toISO(d: Date): string {
    const y = d.getFullYear();
    const m = String(d.getMonth() + 1).padStart(2, '0');
    const day = String(d.getDate()).padStart(2, '0');
    return `${y}-${m}-${day}`;
  }

  /** "2026-05-01" → "May 2026" */
  private toMonthLabel(d: Date): string {
    return d.toLocaleDateString('en-US', { month: 'long', year: 'numeric' });
  }

  private pick<T>(arr: T[], n: number): T[] {
    return [...arr].sort(() => Math.random() - 0.5).slice(0, n);
  }

  // ── Symptom pools ───────────────────────────────────────────────────────

  private readonly PHYSICAL_HEAVY = [
    'Cramps', 'Fatigue', 'Lower back pain', 'Nausea',
    'Breast tenderness', 'Abdominal pain', 'Water retention', 'Headache',
  ];
  private readonly PHYSICAL_LIGHT = [
    'Fatigue', 'Headache', 'Abdominal pain', 'Nausea', 'Breast tenderness',
  ];
  private readonly MOOD_HEAVY = [
    'Irritability', 'Sad', 'Low Motivation', 'Mood swings',
    'Tearfulness', 'Difficulty Concentrating',
  ];
  private readonly MOOD_LIGHT = [
    'Neutral', 'Low Motivation', 'Difficulty Concentrating', 'Cravings',
  ];

  // ── Main seed ───────────────────────────────────────────────────────────

  async seed() {
    this.logger.log('🌱 Starting dynamic seed anchored to today...');

    await Promise.all([
      this.userModel.deleteMany({}),
      this.cycleModel.deleteMany({}),
      this.logModel.deleteMany({}),
    ]);

    const CYCLE_LENGTH    = 29;
    const PERIOD_LENGTH   = 4;
    const OV_START_OFFSET = 11;  // days after period start
    const OV_END_OFFSET   = 16;

    // ── Anchor dates ────────────────────────────────────────────────────
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    // Current cycle: ALWAYS starts on the 1st of the current month
    // This keeps startDate, label, and calendar month perfectly in sync
    const currentCycleStart = new Date(today.getFullYear(), today.getMonth(), 1);
    const currentPeriodEnd  = this.addDays(currentCycleStart, PERIOD_LENGTH - 1);
    const currentOvStart    = this.addDays(currentCycleStart, OV_START_OFFSET);
    const currentOvEnd      = this.addDays(currentCycleStart, OV_END_OFFSET);
    const nextPeriodStart   = this.addDays(currentCycleStart, CYCLE_LENGTH);

    // Previous cycle (one month back)
    const prevCycleStart   = this.addDays(currentCycleStart, -CYCLE_LENGTH);
    const prevPeriodEnd    = this.addDays(prevCycleStart, PERIOD_LENGTH - 1);
    const prevOvStart      = this.addDays(prevCycleStart, OV_START_OFFSET);
    const prevOvEnd        = this.addDays(prevCycleStart, OV_END_OFFSET);

    // Two cycles back
    const prev2CycleStart  = this.addDays(currentCycleStart, -CYCLE_LENGTH * 2);
    const prev2PeriodEnd   = this.addDays(prev2CycleStart, PERIOD_LENGTH - 1);
    const prev2OvStart     = this.addDays(prev2CycleStart, OV_START_OFFSET);
    const prev2OvEnd       = this.addDays(prev2CycleStart, OV_END_OFFSET);

    this.logger.log(`📅 Today:                ${this.toISO(today)}`);
    this.logger.log(`📅 Current cycle starts: ${this.toISO(currentCycleStart)} (${this.toMonthLabel(currentCycleStart)})`);
    this.logger.log(`💧 Period days:          ${this.toISO(currentCycleStart)} – ${this.toISO(currentPeriodEnd)}`);
    this.logger.log(`🔵 Ovulation window:     ${this.toISO(currentOvStart)} – ${this.toISO(currentOvEnd)}`);
    this.logger.log(`📅 Next period:          ${this.toISO(nextPeriodStart)}`);

    // ── 1. User ─────────────────────────────────────────────────────────
    const user = await this.userModel.create({
      name: 'Emmanuelle',
      email: 'emmanuelle@vivafemme.app',
      averageCycleLength: CYCLE_LENGTH,
      averagePeriodLength: PERIOD_LENGTH,
    });
    this.logger.log(`✅ User: ${user.name} (${user._id?.toString()})`);

    // ── 2. Cycles ────────────────────────────────────────────────────────
    const cycleDefs = [
      // Two cycles ago
      {
        startDate:           this.toISO(prev2CycleStart),
        endDate:             this.toISO(prev2PeriodEnd),
        cycleLength:         CYCLE_LENGTH,
        periodLength:        PERIOD_LENGTH,
        label:               this.toMonthLabel(prev2CycleStart),
        estimatedNextPeriod: this.toISO(prevCycleStart),
        ovulationStartDate:  this.toISO(prev2OvStart),
        ovulationEndDate:    this.toISO(prev2OvEnd),
      },
      // Previous cycle
      {
        startDate:           this.toISO(prevCycleStart),
        endDate:             this.toISO(prevPeriodEnd),
        cycleLength:         CYCLE_LENGTH,
        periodLength:        PERIOD_LENGTH,
        label:               this.toMonthLabel(prevCycleStart),
        estimatedNextPeriod: this.toISO(currentCycleStart),
        ovulationStartDate:  this.toISO(prevOvStart),
        ovulationEndDate:    this.toISO(prevOvEnd),
      },
      // Current cycle — no endDate (still ongoing)
      {
        startDate:           this.toISO(currentCycleStart),  // e.g. "2026-05-01"
        endDate:             null,
        cycleLength:         CYCLE_LENGTH,
        periodLength:        PERIOD_LENGTH,
        label:               this.toMonthLabel(currentCycleStart), // e.g. "May 2026"
        estimatedNextPeriod: this.toISO(nextPeriodStart),    // e.g. "2026-05-30"
        ovulationStartDate:  this.toISO(currentOvStart),     // e.g. "2026-05-12"
        ovulationEndDate:    this.toISO(currentOvEnd),       // e.g. "2026-05-17"
      },
    ];

    const cycles: CycleDocument[] = [];
    for (const def of cycleDefs) {
      const cycle = await this.cycleModel.create({ userId: user._id, ...def });
      cycles.push(cycle);
    }
    this.logger.log(`✅ Created ${cycles.length} cycles`);

    // ── 3. Current cycle logs (cycle start → today, one per day) ─────────
    const currentCycle = cycles[2];
    const dayCount = Math.floor(
      (today.getTime() - currentCycleStart.getTime()) / 86400000,
    ) + 1; // +1 includes today

    const flowMap: Record<number, number> = { 0: 8, 1: 7, 2: 5, 3: 3 };

    for (let i = 0; i < dayCount; i++) {
      const logDate     = this.addDays(currentCycleStart, i);
      const isPeriod    = i < PERIOD_LENGTH;
      const isOvulation = i >= OV_START_OFFSET && i <= OV_END_OFFSET;

      await this.logModel.create(<any>{
        userId:      user._id,
        cycleId:     currentCycle._id,
        date:        this.toISO(logDate),
        loggedAt:    new Date(logDate.getFullYear(), logDate.getMonth(), logDate.getDate(), 1, 42),

        physicalSymptoms: isPeriod
          ? this.pick(this.PHYSICAL_HEAVY, 5 + Math.floor(Math.random() * 3))
          : this.pick(this.PHYSICAL_LIGHT, 2 + Math.floor(Math.random() * 3)),

        moodSymptoms: isPeriod
          ? this.pick(this.MOOD_HEAVY, 3 + Math.floor(Math.random() * 3))
          : isOvulation
            ? ['Happy', 'Neutral']
            : this.pick(this.MOOD_LIGHT, 1 + Math.floor(Math.random() * 2)),

        periodIndicators: isPeriod
          ? [i <= 1 ? 'Heavier flow' : i <= 2 ? 'Lighter flow' : 'Spotting']
          : [],

        sexualHealthSymptoms: isPeriod
          ? ['Decreased sex drive']
          : Math.random() > 0.75 ? ['Decreased sex drive'] : [],

        flowIntensity: isPeriod ? (flowMap[i] ?? 2) : 0,
        notes: 'After lunch',
      });
    }
    this.logger.log(`✅ Created ${dayCount} logs for current cycle`);

    // ── 4. Period logs for previous cycles ────────────────────────────────
    for (const [cycleDoc, cycleStart] of [
      [cycles[1], prevCycleStart],
      [cycles[0], prev2CycleStart],
    ] as const) {
      for (let i = 0; i < PERIOD_LENGTH; i++) {
        const logDate = this.addDays(cycleStart, i);
        await this.logModel.create(<any>{
          userId:              user._id,
          cycleId:             cycleDoc._id,
          date:                this.toISO(logDate),
          loggedAt:            new Date(logDate.getFullYear(), logDate.getMonth(), logDate.getDate(), 1, 42),
          physicalSymptoms:    this.pick(this.PHYSICAL_HEAVY, 4 + Math.floor(Math.random() * 3)),
          moodSymptoms:        this.pick(this.MOOD_HEAVY, 2 + Math.floor(Math.random() * 3)),
          periodIndicators:    [i <= 1 ? 'Heavier flow' : 'Lighter flow'],
          sexualHealthSymptoms: i === 0 ? ['Decreased sex drive'] : [],
          flowIntensity:       [8, 7, 5, 3][i] ?? 2,
          notes:               'After lunch',
        });
      }
    }

    this.logger.log('🌸 Seed complete!');

    return {
      message: 'Database seeded successfully with dynamic dates',
      seedDate: this.toISO(today),
      userId: user._id?.toString(),
      cycles: cycles.map((c) => ({
        id:                  c._id?.toString(),
        label:               c.label,
        startDate:           c.startDate,
        endDate:             c.endDate,
        estimatedNextPeriod: c.estimatedNextPeriod,
        ovulationStartDate:  c.ovulationStartDate,
        ovulationEndDate:    c.ovulationEndDate,
      })),
      currentCycle: {
        label:             this.toMonthLabel(currentCycleStart),
        startDate:         this.toISO(currentCycleStart),
        periodEnds:        this.toISO(currentPeriodEnd),
        ovulationWindow:   `${this.toISO(currentOvStart)} – ${this.toISO(currentOvEnd)}`,
        nextPeriod:        this.toISO(nextPeriodStart),
        logsCreated:       dayCount,
      },
    };
  }
}