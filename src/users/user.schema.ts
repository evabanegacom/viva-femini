import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document } from 'mongoose';

export type UserDocument = User & Document;

@Schema({ timestamps: true })
export class User {
  @Prop({ required: true })
  name: string;

  @Prop({ required: true, unique: true })
  email: string;

  @Prop()
  avatarUrl?: string;

  /** Average cycle length in days */
  @Prop({ default: 28 })
  averageCycleLength: number;

  /** Average period length in days */
  @Prop({ default: 5 })
  averagePeriodLength: number;
}

export const UserSchema = SchemaFactory.createForClass(User);