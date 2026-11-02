import mongoose, { Schema, Document } from 'mongoose';

export interface IConsultationPlan extends Document {
  key: string;
  name: string;
  description?: string;
  amount: number;
  currency: 'NGN';
  durationMinutes: number;
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
}

const ConsultationPlanSchema = new Schema<IConsultationPlan>(
  {
    key: { type: String, required: true, unique: true, default: 'strategic-plan' },
    name: { type: String, default: 'Strategic Business Consultation' },
    description: { type: String },
    amount: { type: Number, required: true, default: 150000 },
    currency: { type: String, enum: ['NGN'], default: 'NGN' },
    durationMinutes: { type: Number, default: 30 },
    isActive: { type: Boolean, default: true },
  },
  { timestamps: true }
);

export const ConsultationPlan = mongoose.model<IConsultationPlan>(
  'ConsultationPlan',
  ConsultationPlanSchema
);
