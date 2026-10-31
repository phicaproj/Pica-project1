import mongoose, { Schema, Document } from 'mongoose';
import {
  BEAUVISION_PERMISSION_KEYS,
  type BeauvisionAdminRole,
  type BeauvisionAdminStatus,
  type BeauvisionPermission,
} from './admin.types';

export interface IBeauvisionAdmin extends Document {
  name: string;
  email: string;
  password?: string;
  role: BeauvisionAdminRole;
  permissions: BeauvisionPermission[];
  status: BeauvisionAdminStatus;
  activatedAt?: Date | null;
  createdAt: Date;
  updatedAt: Date;
}

const BeauvisionAdminSchema = new Schema<IBeauvisionAdmin>(
  {
    name: { type: String, required: true },
    email: { type: String, required: true, unique: true },
    password: { type: String, required: false },
    role: { type: String, enum: ['OWNER', 'ADMIN'], default: 'ADMIN' },
    permissions: {
      type: [String],
      enum: BEAUVISION_PERMISSION_KEYS,
      default: [],
    },
    status: { type: String, enum: ['ACTIVE', 'DISABLED'], default: 'ACTIVE' },
    activatedAt: { type: Date, default: null },
  },
  { timestamps: true }
);

export const BeauvisionAdmin = mongoose.model<IBeauvisionAdmin>(
  'BeauvisionAdmin',
  BeauvisionAdminSchema
);
