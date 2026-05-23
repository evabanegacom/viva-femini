import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document, Types } from 'mongoose';

export type CycleDocument = Cycle & Document;

@Schema({ timestamps: true })
export class Cycle {
  @Prop({ type: Types.ObjectId, ref: 'User', required: true, index: true })
  userId: Types.ObjectId;

  @Prop({ required: true })
  startDate: string;

  @Prop({ default: null })
  endDate: string | null;

  @Prop()
  cycleLength?: number;

  @Prop()
  periodLength?: number;

  @Prop()
  label?: string;

  /** Predicted next period start date e.g. "2025-11-04" */
  @Prop()
  estimatedNextPeriod?: string;

  /** Ovulation start date e.g. "2025-10-17" */
  @Prop()
  ovulationStartDate?: string;

  /** Ovulation end date e.g. "2025-10-22" */
  @Prop()
  ovulationEndDate?: string;

  @Prop()
  notes?: string;
}

export const CycleSchema = SchemaFactory.createForClass(Cycle);