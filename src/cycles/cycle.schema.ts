import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document, Types } from 'mongoose';

export type CycleDocument = Cycle & Document;

/** Represents one complete menstrual cycle for a user */
@Schema({ timestamps: true })
export class Cycle {
  /** Reference to the owning user */
  @Prop({ type: Types.ObjectId, ref: 'User', required: true, index: true })
  userId: Types.ObjectId;

  /** ISO date string when the period started (e.g. "2025-10-01") */
  @Prop({ required: true })
  startDate: string;

  /** ISO date string when the period ended — null if cycle is ongoing */
  @Prop({ default: null })
  endDate: string | null;

  /** Computed cycle length in days (distance from this start to next start) */
  @Prop()
  cycleLength?: number;

  /** Computed period (bleed) length in days */
  @Prop()
  periodLength?: number;

  /** Human-readable label such as "October 2025" */
  @Prop()
  label?: string;

  /** Any free-form user notes about the cycle */
  @Prop()
  notes?: string;
}

export const CycleSchema = SchemaFactory.createForClass(Cycle);