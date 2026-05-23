import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types } from 'mongoose';
import { SymptomLog, SymptomLogDocument } from './symptom-log.schema';
import { CreateSymptomLogDto, UpdateSymptomLogDto } from './symptom-log.dto';

@Injectable()
export class SymptomsService {
  constructor(
    @InjectModel(SymptomLog.name) private logModel: Model<SymptomLogDocument>,
  ) {}

  /**
   * Save or update a daily symptom log.
   * Upserts by userId + date so submitting the tracking form twice
   * (or seeding then logging manually) overwrites instead of throwing
   * a duplicate key error on the userId_1_date_1 unique index.
   */
  async create(dto: CreateSymptomLogDto): Promise<SymptomLogDocument> {
    const log = await this.logModel
      .findOneAndUpdate(
        {
          userId: new Types.ObjectId(dto.userId),
          date: dto.date,
        },
        {
          $set: {
            ...dto,
            userId: new Types.ObjectId(dto.userId),
            cycleId: new Types.ObjectId(dto.cycleId),
          },
        },
        {
          new: true,
          upsert: true,
          setDefaultsOnInsert: true,
        },
      )
      .exec();

    return log!;
  }

  /** Retrieve all logs for a user, sorted newest first */
  async findByUser(userId: string): Promise<SymptomLogDocument[]> {
    return this.logModel
      .find({ userId: new Types.ObjectId(userId) })
      .sort({ date: -1 })
      .exec();
  }

  /** Retrieve all logs for a specific cycle */
  async findByCycle(cycleId: string): Promise<SymptomLogDocument[]> {
    return this.logModel
      .find({ cycleId: new Types.ObjectId(cycleId) })
      .sort({ date: 1 })
      .exec();
  }

  /** Get the log for a specific date (for a user) */
  async findByDate(
    userId: string,
    date: string,
  ): Promise<SymptomLogDocument | null> {
    return this.logModel
      .findOne({ userId: new Types.ObjectId(userId), date })
      .exec();
  }

  /** Get a single log by its ID */
  async findOne(id: string): Promise<SymptomLogDocument> {
    const log = await this.logModel.findById(id).exec();
    if (!log) throw new NotFoundException(`SymptomLog ${id} not found`);
    return log;
  }

  /** Update an existing daily log */
  async update(
    id: string,
    dto: UpdateSymptomLogDto,
  ): Promise<SymptomLogDocument> {
    const log = await this.logModel
      .findByIdAndUpdate(id, dto, { new: true })
      .exec();
    if (!log) throw new NotFoundException(`SymptomLog ${id} not found`);
    return log;
  }

  /** Delete a log entry */
  async remove(id: string): Promise<void> {
    const result = await this.logModel.findByIdAndDelete(id).exec();
    if (!result) throw new NotFoundException(`SymptomLog ${id} not found`);
  }

  /**
   * Aggregate symptom frequency for a user across all their logs.
   * Returns each symptom with how many times it appeared and as a percentage.
   * Matches the "Symptom Frequency" donut charts in the Health Report screen.
   */
  async getFrequency(userId: string): Promise<Record<string, any>> {
    const logs = await this.findByUser(userId);
    const total = logs.length || 1;

    const countMap: Record<string, number> = {};

    const incrementSymptoms = (list: string[]) => {
      list.forEach((s) => {
        countMap[s] = (countMap[s] || 0) + 1;
      });
    };

    logs.forEach((log) => {
      incrementSymptoms(log.physicalSymptoms || []);
      incrementSymptoms(log.moodSymptoms || []);
      incrementSymptoms(log.periodIndicators || []);
      incrementSymptoms(log.sexualHealthSymptoms || []);
    });

    const symptoms = Object.entries(countMap)
      .map(([symptom, count]) => ({
        symptom,
        count,
        percentage: Math.round((count / total) * 100),
      }))
      .sort((a, b) => b.count - a.count);

    return { totalLogs: total, symptoms };
  }
}