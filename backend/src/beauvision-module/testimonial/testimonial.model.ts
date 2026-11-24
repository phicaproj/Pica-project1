import mongoose, { Schema, Document } from 'mongoose';

export interface ITestimonial extends Document {
  name: string;
  role?: string;
  company?: string;
  quote: string;
  avatarUrl?: string;
  rating?: number;
  displayOrder: number;
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
}

const TestimonialSchema = new Schema<ITestimonial>(
  {
    name: { type: String, required: true, trim: true },
    role: { type: String, default: '', trim: true },
    company: { type: String, default: '', trim: true },
    quote: { type: String, required: true },
    avatarUrl: { type: String, default: '' },
    rating: { type: Number, min: 1, max: 5, default: null },
    displayOrder: { type: Number, default: 0 },
    isActive: { type: Boolean, default: true },
  },
  { timestamps: true }
);

export const Testimonial = mongoose.model<ITestimonial>(
  'BeauvisionTestimonial',
  TestimonialSchema
);
