import mongoose, { Schema, Document } from 'mongoose';

export interface IServiceInquiry extends Document {
  name: string;
  email: string;
  phone?: string;
  companyName?: string;
  serviceRequested: string;
  message?: string;
  status: 'PENDING' | 'CONTACTED' | 'RESOLVED';
  type: 'GENERAL' | 'CONSULTATION';
  paymentStatus: 'NONE' | 'PENDING' | 'PAID' | 'FAILED';
  paymentReference?: string;
  amountDue?: number;
  amountPaid?: number;
  paidAt?: Date | null;
  createdAt: Date;
  updatedAt: Date;
}

const ServiceInquirySchema = new Schema<IServiceInquiry>(
  {
    name: { type: String, required: true },
    email: { type: String, required: true },
    phone: { type: String },
    companyName: { type: String },
    serviceRequested: { type: String, required: true },
    message: { type: String },
    status: { type: String, enum: ['PENDING', 'CONTACTED', 'RESOLVED'], default: 'PENDING' },
    type: { type: String, enum: ['GENERAL', 'CONSULTATION'], default: 'GENERAL' },
    paymentStatus: {
      type: String,
      enum: ['NONE', 'PENDING', 'PAID', 'FAILED'],
      default: 'NONE',
    },
    paymentReference: { type: String, index: true },
    amountDue: { type: Number },
    amountPaid: { type: Number },
    paidAt: { type: Date, default: null },
  },
  { timestamps: true }
);

export const ServiceInquiry = mongoose.model<IServiceInquiry>('ServiceInquiry', ServiceInquirySchema);
