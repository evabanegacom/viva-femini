import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document, Types } from 'mongoose';

export type SymptomLogDocument = SymptomLog & Document;

/**
 * Physical pain symptoms visible on the Tracking screen.
 * Maps exactly to the pill buttons shown in the UI.
 */
export type PhysicalSymptom =
  | 'Cramps'
  | 'Diarrhoea'
  | 'Fatigue'
  | 'Headache'
  | 'Nausea'
  | 'Breast tenderness'
  | 'Abdominal pain'
  | 'Pelvic pain'
  | 'Water retention'
  | 'Lower back pain'
  | 'Appetite changes';

/** Mood & mental symptoms from the Tracking screen */
export type MoodSymptom =
  | 'Happy'
  | 'Neutral'
  | 'Sad'
  | 'Low Motivation'
  | 'Mood swings'
  | 'Irritability'
  | 'Cravings'
  | 'Tearfulness'
  | 'Difficulty Concentrating';

/** Period / flow indicators */
export type PeriodIndicator = 'Spotting' | 'Heavier flow' | 'Lighter flow' | 'Vaginal Dryness';
/** Sexual health symptoms */
export type SexualHealthSymptom =
  | 'Increased sex drive'
  | 'Decreased sex drive'
  | 'Vaginal discharge';

/** Flow intensity 0–10 matching the slider in the UI */
export type FlowIntensity = 0 | 1 | 2 | 3 | 4 | 5 | 6 | 7 | 8 | 9 | 10;

/**
 * One daily tracking log entry.
 * Each entry captures everything logged on a single day of a given cycle.
 */
@Schema({ timestamps: true })
export class SymptomLog {
  @Prop({ type: Types.ObjectId, ref: 'User', required: true, index: true })
  userId: Types.ObjectId;

  /** Links to the cycle this log belongs to */
  @Prop({ type: Types.ObjectId, ref: 'Cycle', required: true, index: true })
  cycleId: Types.ObjectId;

  /** ISO date string for the day being logged (YYYY-MM-DD) */
  @Prop({ required: true })
  date: string;

  /** Physical pain symptoms selected by the user */
  @Prop({ type: [String], default: [] })
  physicalSymptoms: PhysicalSymptom[];

  /** Mood & mental symptoms selected by the user */
  @Prop({ type: [String], default: [] })
  moodSymptoms: MoodSymptom[];

  /** Period / flow indicators */
  @Prop({ type: [String], default: [] })
  periodIndicators: PeriodIndicator[];

  /** Sexual health symptoms */
  @Prop({ type: [String], default: [] })
  sexualHealthSymptoms: SexualHealthSymptom[];

  /** Flow intensity on a 0–10 scale (Light → Medium → Heavy) */
  @Prop({ type: Number, min: 0, max: 10, default: 0 })
  flowIntensity: FlowIntensity;

  /** Optional free-text note for the day */
  @Prop()
  notes?: string;
}

export const SymptomLogSchema = SchemaFactory.createForClass(SymptomLog);

// Compound index ensures only one log per user per day
SymptomLogSchema.index({ userId: 1, date: 1 }, { unique: true });