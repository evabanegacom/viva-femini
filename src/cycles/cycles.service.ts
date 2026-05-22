import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types } from 'mongoose';
import { Cycle, CycleDocument } from './cycle.schema';
import { CreateCycleDto, UpdateCycleDto } from './cycle.dto';

@Injectable()
export class CyclesService {
  constructor(@InjectModel(Cycle.name) private cycleModel: Model<CycleDocument>) {}

  /** Create a new cycle entry for a user */
  async create(dto: CreateCycleDto): Promise<CycleDocument> {
    const cycle = new this.cycleModel({
      ...dto,
      userId: new Types.ObjectId(dto.userId),
    });
    return cycle.save();
  }

  /** List all cycles for a specific user, sorted newest first */
  async findByUser(userId: string): Promise<CycleDocument[]> {
    return this.cycleModel
      .find({ userId: new Types.ObjectId(userId) })
      .sort({ startDate: -1 })
      .exec();
  }

  /** Retrieve a single cycle by its ID */
  async findOne(id: string): Promise<CycleDocument> {
    const cycle = await this.cycleModel.findById(id).exec();
    if (!cycle) throw new NotFoundException(`Cycle ${id} not found`);
    return cycle;
  }

  /** Update a cycle (e.g. set endDate when period finishes) */
  async update(id: string, dto: UpdateCycleDto): Promise<CycleDocument> {
    const cycle = await this.cycleModel
      .findByIdAndUpdate(id, dto, { new: true })
      .exec();
    if (!cycle) throw new NotFoundException(`Cycle ${id} not found`);
    return cycle;
  }

  /** Delete a cycle record */
  async remove(id: string): Promise<void> {
    const result = await this.cycleModel.findByIdAndDelete(id).exec();
    if (!result) throw new NotFoundException(`Cycle ${id} not found`);
  }

  /**
   * Compute cycle statistics for a user:
   * average cycle length, average period length, shortest/longest cycles
   */
  async getStats(userId: string): Promise<Record<string, number | null>> {
    const cycles = await this.findByUser(userId);
    const withLength = cycles.filter((c) => c.cycleLength != null);

    if (!withLength.length) {
      return { averageCycleLength: null, averagePeriodLength: null, count: 0 };
    }

    const avgCycle =
      withLength.reduce((sum, c) => sum + c.cycleLength, 0) / withLength.length;

    const withPeriod = cycles.filter((c) => c.periodLength != null);
    const avgPeriod = withPeriod.length
      ? withPeriod.reduce((sum, c) => sum + c.periodLength, 0) / withPeriod.length
      : null;

    return {
      count: cycles.length,
      averageCycleLength: Math.round(avgCycle),
      averagePeriodLength: avgPeriod ? Math.round(avgPeriod) : null,
      shortestCycle: Math.min(...withLength.map((c) => c.cycleLength)),
      longestCycle: Math.max(...withLength.map((c) => c.cycleLength)),
    };
  }
}