import mongoose, { Schema, Document } from 'mongoose';
import { RESOURCE_CATEGORIES } from './resource.types';

export type PricingType = 'free' | 'paid';

export interface IDigitalResource extends Document {
  title: string;
  shortDescription: string;
  // Free resources carry price 0 and are delivered without Paystack.
  pricingType: PricingType;
  price: number;
  fileFormat?: string;
  coverImageUrl?: string;
  // R2-hosted downloadable file (document or short video). Optional for
  // link-only resources.
  fileUrl?: string;
  // External long-form video link (Google Drive, etc.) when the file is too
  // large to host on R2.
  videoUrl?: string;
  // YouTube embed link.
  youtubeUrl?: string;
  category: (typeof RESOURCE_CATEGORIES)[number];
  isPublished: boolean;
  createdAt: Date;
  updatedAt: Date;
}

const DigitalResourceSchema = new Schema<IDigitalResource>(
  {
    title: { type: String, required: true },
    shortDescription: { type: String, required: true },
    pricingType: { type: String, enum: ['free', 'paid'], default: 'paid' },
    price: { type: Number, required: true, default: 0, min: 0 },
    fileFormat: { type: String, default: '' },
    coverImageUrl: { type: String, default: '' },
    fileUrl: { type: String, default: '' },
    videoUrl: { type: String, default: '' },
    youtubeUrl: { type: String, default: '' },
    category: { type: String, enum: RESOURCE_CATEGORIES, required: true },
    isPublished: { type: Boolean, default: false },
  },
  { timestamps: true }
);

export const DigitalResource = mongoose.model<IDigitalResource>(
  'DigitalResource',
  DigitalResourceSchema
);
