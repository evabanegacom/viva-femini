import { Injectable, Logger } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { User, UserDocument } from '../users/user.schema';
import { Cycle, CycleDocument } from '../cycles/cycle.schema';
import { SymptomLog, SymptomLogDocument } from '../symptoms/symptom-log.schema';

/**
 * SeedService — populates MongoDB with data that matches the UI screenshots exactly.
 *
 * Health Report screen shows:
 *  Cycle Summary: Cycle Length 29 Days | Period Duration 4 Days |
 *                 Estimated Next Period Nov 4 | Ovulation Window Oct 17–22
 *
 *  Historical table has 12 rows, Oct 9th–18th, all "Physical Pain" as top symptom,
 *  scores like 8/10, 5/10, 7/10, etc., note "After lunch"
 *
 *  Donut chart values approx: Physical 55%, Mood 75%, Digestion 82%, Sexual 33%, Flow 20%
 */
@Injectable()
export class SeedService {
  private readonly logger = new Logger(SeedService.name);

  constructor(
    @InjectModel(User.name) private userModel: Model<UserDocument>,
    @InjectModel(Cycle.name) private cycleModel: Model<CycleDocument>,
    @InjectModel(SymptomLog.name) private logModel: Model<SymptomLogDocument>,
  ) {}

  async seed() {
    this.logger.log('🌱 Starting database seed...');

    await Promise.all([
      this.userModel.deleteMany({}),
      this.cycleModel.deleteMany({}),
      this.logModel.deleteMany({}),
    ]);

    // ── 1. User: Emmanuelle ──────────────────────────────────────────────
    const user = await this.userModel.create({
      name: 'Emmanuelle',
      email: 'emmanuelle@vivafemme.app',
      averageCycleLength: 29,   // shown in Cycle Summary: "29 Days"
      averagePeriodLength: 4,   // shown in Cycle Summary: "4 Days"
    });
    this.logger.log(`✅ User: ${user.name} (${user._id?.toString()})`);

    // ── 2. Cycles: Aug, Sep, Oct 2025 ───────────────────────────────────
    // Oct cycle: started Oct 3, period ended Oct 7 (4 days)
    // Next period predicted: Oct 3 + 29 days = Nov 1 (shown as Nov 4 in UI, offset by +3)
    const cycleRows = [
      { start: '2025-08-05', end: '2025-08-09', length: 30, period: 4, label: 'Aug 2025' },
      { start: '2025-09-04', end: '2025-09-08', length: 29, period: 4, label: 'Sep 2025' },
      // Oct: startDate Oct 3 + 29 cycle = Nov 1; UI shows "Nov 4" so we use Oct 6 start
      { start: '2025-10-06', end: '2025-10-10', length: 29, period: 4, label: 'Oct 2025' },
    ];

    const cycles: CycleDocument[] = [];
    for (const c of cycleRows) {
      const cycle = await this.cycleModel.create({
        userId: user._id,
        startDate: c.start,
        endDate: c.end,
        cycleLength: c.length,
        periodLength: c.period,
        label: c.label,
      });
      cycles.push(cycle);
    }
    this.logger.log(`✅ Created ${cycles.length} cycles`);

    const octCycle = cycles[2];

    // ── 3. Symptom logs — 12 daily entries matching the UI table ─────────
    // UI table shows Oct 9th, 9th (x2), 9th, 9th, 9th, 9th, 9th, 9th, 9th, 10th, 10th
    // with times "01:42 am", "01:45 am", etc., all top symptom "Physical Pain"
    // scores: 8/10, 5/10, 7/10, 5/10, 8/10, 5/10, 7/10, 5/10, 4/10, 5/10, 5/10, 5/10
    // note: "After lunch" for all
    //
    // We map this to distinct dates (the UI collapses same-day entries into rows).
    const logs: Array<any> = [
      // Period days (Oct 6-10) — heavy physical symptoms → Physical Pain dominates
      {
        date: '2025-10-06',
        loggedAt: '2025-10-06T01:42:00.000Z',
        physicalSymptoms: ['Cramps', 'Fatigue', 'Lower back pain', 'Nausea',
                           'Breast tenderness', 'Abdominal pain', 'Water retention', 'Headache'],
        moodSymptoms: ['Irritability', 'Sad', 'Low Motivation', 'Mood swings',
                       'Tearfulness', 'Difficulty Concentrating'],
        periodIndicators: ['Heavier flow'],
        sexualHealthSymptoms: [],
        flowIntensity: 8,
        notes: 'After lunch',
      },
      {
        date: '2025-10-07',
        loggedAt: '2025-10-07T01:45:00.000Z',
        physicalSymptoms: ['Cramps', 'Fatigue', 'Lower back pain', 'Nausea', 'Headache'],
        moodSymptoms: ['Sad', 'Low Motivation', 'Mood swings'],
        periodIndicators: ['Heavier flow'],
        sexualHealthSymptoms: [],
        flowIntensity: 7,
        notes: 'After lunch',
      },
      {
        date: '2025-10-08',
        loggedAt: '2025-10-08T01:32:00.000Z',
        physicalSymptoms: ['Cramps', 'Fatigue', 'Breast tenderness', 'Abdominal pain',
                           'Nausea', 'Diarrhoea', 'Appetite changes'],
        moodSymptoms: ['Mood swings', 'Irritability', 'Cravings', 'Tearfulness'],
        periodIndicators: ['Lighter flow'],
        sexualHealthSymptoms: [],
        flowIntensity: 5,
        notes: 'After lunch',
      },
      {
        date: '2025-10-09',
        loggedAt: '2025-10-09T01:18:00.000Z',
        physicalSymptoms: ['Cramps', 'Fatigue', 'Lower back pain', 'Headache', 'Nausea'],
        moodSymptoms: ['Irritability', 'Sad', 'Low Motivation', 'Mood swings'],
        periodIndicators: ['Lighter flow'],
        sexualHealthSymptoms: [],
        flowIntensity: 5,
        notes: 'After lunch',
      },
      {
        date: '2025-10-10',
        loggedAt: '2025-10-10T01:55:00.000Z',
        physicalSymptoms: ['Breast tenderness', 'Fatigue', 'Abdominal pain',
                           'Water retention', 'Nausea', 'Headache', 'Cramps', 'Pelvic pain'],
        moodSymptoms: ['Mood swings', 'Irritability', 'Cravings'],
        periodIndicators: ['Spotting'],
        sexualHealthSymptoms: ['Decreased sex drive'],
        flowIntensity: 4,
        notes: 'After lunch',
      },
      // Post-period: lighter symptoms but Physical Pain still present
      {
        date: '2025-10-11',
        loggedAt: '2025-10-11T01:42:00.000Z',
        physicalSymptoms: ['Fatigue', 'Headache', 'Abdominal pain', 'Nausea', 'Cramps'],
        moodSymptoms: ['Neutral', 'Low Motivation', 'Difficulty Concentrating'],
        periodIndicators: [],
        sexualHealthSymptoms: [],
        flowIntensity: 0,
        notes: 'After lunch',
      },
      {
        date: '2025-10-12',
        loggedAt: '2025-10-12T01:30:00.000Z',
        physicalSymptoms: ['Fatigue', 'Lower back pain', 'Headache', 'Cramps',
                           'Nausea', 'Breast tenderness', 'Water retention'],
        moodSymptoms: ['Sad', 'Tearfulness', 'Mood swings', 'Low Motivation'],
        periodIndicators: [],
        sexualHealthSymptoms: ['Decreased sex drive'],
        flowIntensity: 0,
        notes: 'After lunch',
      },
      {
        date: '2025-10-13',
        loggedAt: '2025-10-13T01:42:00.000Z',
        physicalSymptoms: ['Cramps', 'Fatigue', 'Nausea', 'Breast tenderness'],
        moodSymptoms: ['Irritability', 'Cravings', 'Mood swings'],
        periodIndicators: [],
        sexualHealthSymptoms: [],
        flowIntensity: 0,
        notes: 'After lunch',
      },
      {
        date: '2025-10-14',
        loggedAt: '2025-10-14T01:55:00.000Z',
        physicalSymptoms: ['Water retention', 'Fatigue', 'Headache', 'Abdominal pain', 'Nausea'],
        moodSymptoms: ['Cravings', 'Difficulty Concentrating', 'Low Motivation'],
        periodIndicators: [],
        sexualHealthSymptoms: [],
        flowIntensity: 0,
        notes: 'After lunch',
      },
      {
        date: '2025-10-15',
        loggedAt: '2025-10-15T01:42:00.000Z',
        physicalSymptoms: ['Cramps', 'Fatigue', 'Breast tenderness', 'Nausea', 'Headache'],
        moodSymptoms: ['Mood swings', 'Irritability', 'Sad'],
        periodIndicators: [],
        sexualHealthSymptoms: ['Decreased sex drive'],
        flowIntensity: 0,
        notes: 'After lunch',
      },
      {
        date: '2025-10-16',
        loggedAt: '2025-10-16T01:15:00.000Z',
        physicalSymptoms: ['Abdominal pain', 'Fatigue', 'Lower back pain', 'Cramps', 'Nausea'],
        moodSymptoms: ['Difficulty Concentrating', 'Low Motivation', 'Tearfulness'],
        periodIndicators: [],
        sexualHealthSymptoms: [],
        flowIntensity: 0,
        notes: 'After lunch',
      },
      {
        date: '2025-10-17',
        loggedAt: '2025-10-17T01:42:00.000Z',
        physicalSymptoms: ['Breast tenderness', 'Fatigue', 'Headache', 'Cramps', 'Nausea'],
        moodSymptoms: ['Low Motivation', 'Tearfulness', 'Mood swings'],
        periodIndicators: [],
        sexualHealthSymptoms: ['Decreased sex drive'],
        flowIntensity: 0,
        notes: 'After lunch',
      },
    ];

    for (const entry of logs) {
      await this.logModel.create({
        userId: user._id,
        cycleId: octCycle._id,
        ...entry,
      });
    }
    this.logger.log(`✅ Created ${logs.length} symptom logs (Oct 2025)`);

    // Also add a couple of logs to earlier cycles so stats work
    const augCycle = cycles[0];
    const sepCycle = cycles[1];
    for (const [cycleDoc, date] of [[augCycle, '2025-08-06'], [sepCycle, '2025-09-05']] as const) {
      await this.logModel.create({
        userId: user._id,
        cycleId: cycleDoc._id,
        date,
        physicalSymptoms: ['Cramps', 'Fatigue'],
        moodSymptoms: ['Irritability'],
        periodIndicators: ['Heavier flow'],
        flowIntensity: 6,
        notes: 'After lunch',
      });
    }

    this.logger.log('🌱 Seed complete!');

    return {
      message: 'Database seeded successfully — matches Health Report UI',
      userId: user._id?.toString(),
      cycles: cycles.map((c) => ({ id: c._id?.toString(), label: c.label })),
      logCount: logs.length + 2,
    };
  }
}
