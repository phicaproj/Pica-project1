import mongoose, { Schema, Document } from 'mongoose';

export type MediaType = 'IMAGE' | 'VIDEO';

export interface IMedia extends Document {
  title: string;
  description?: string;
  type: MediaType;
  // R2-hosted image (for IMAGE items).
  imageUrl?: string;
  // R2-hosted short video (<= 250MB) OR an external video link (e.g. Google
  // Drive) for long-form video.
  videoUrl?: string;
  // YouTube link.
  youtubeUrl?: string;
  eventDate?: Date | null;
  displayOrder: number;
  isPublished: boolean;
  createdAt: Date;
  updatedAt: Date;
}

const MediaSchema = new Schema<IMedia>(
  {
    title: { type: String, required: true, trim: true },
    description: { type: String, default: '' },
    type: { type: String, enum: ['IMAGE', 'VIDEO'], required: true },
    imageUrl: { type: String, default: '' },
    videoUrl: { type: String, default: '' },
    youtubeUrl: { type: String, default: '' },
    eventDate: { type: Date, default: null },
    displayOrder: { type: Number, default: 0 },
    isPublished: { type: Boolean, default: false },
  },
  { timestamps: true }
);

export const Media = mongoose.model<IMedia>('BeauvisionMedia', MediaSchema);
