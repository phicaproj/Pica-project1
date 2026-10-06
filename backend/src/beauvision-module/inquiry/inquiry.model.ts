import mongoose, { Schema, Document } from 'mongoose';

export interface IServiceInquiry extends Document {
  name: string;
  email: string;
  companyName?: string;
  serviceRequested: string;
  message?: string;
  status: 'PENDING' | 'CONTACTED' | 'RESOLVED';
  createdAt: Date;
  updatedAt: Date;
}

const ServiceInquirySchema = new Schema<IServiceInquiry>(
  {
    name: { type: String, required: true },
    email: { type: String, required: true },
    companyName: { type: String },
    serviceRequested: { type: String, required: true },
    message: { type: String },
    status: { type: String, enum: ['PENDING', 'CONTACTED', 'RESOLVED'], default: 'PENDING' },
  },
  { timestamps: true }
);

export const ServiceInquiry = mongoose.model<IServiceInquiry>('ServiceInquiry', ServiceInquirySchema);
