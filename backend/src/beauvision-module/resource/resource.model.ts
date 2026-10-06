import mongoose, { Schema, Document } from 'mongoose';

export interface IDigitalResource extends Document {
  title: string;
  shortDescription: string;
  price: number; 
  fileFormat: string; 
  coverImageUrl: string;
  fileUrl: string; 
  category: string;
  isPublished: boolean;
  createdAt: Date;
  updatedAt: Date;
}

const DigitalResourceSchema = new Schema<IDigitalResource>(
  {
    title: { type: String, required: true },
    shortDescription: { type: String, required: true },
    price: { type: Number, required: true },
    fileFormat: { type: String, required: true },
    coverImageUrl: { type: String, required: true },
    fileUrl: { type: String, required: true },
    category: { type: String, required: true },
    isPublished: { type: Boolean, default: false },
  },
  { timestamps: true }
);

export const DigitalResource = mongoose.model<IDigitalResource>('DigitalResource', DigitalResourceSchema);
