import mongoose, { Schema, Document } from 'mongoose';

export interface IBeauvisionAdmin extends Document {
  name: string;
  email: string;
  password: string;
  role: 'OWNER' | 'ADMIN';
  createdAt: Date;
  updatedAt: Date;
}

const BeauvisionAdminSchema = new Schema<IBeauvisionAdmin>(
  {
    name: { type: String, required: true },
    email: { type: String, required: true, unique: true },
    password: { type: String, required: true },
    role: { type: String, enum: ['OWNER', 'ADMIN'], default: 'ADMIN' },
  },
  { timestamps: true }
);

export const BeauvisionAdmin = mongoose.model<IBeauvisionAdmin>(
  'BeauvisionAdmin',
  BeauvisionAdminSchema
);
