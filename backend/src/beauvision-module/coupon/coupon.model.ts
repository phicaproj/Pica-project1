import mongoose, { Schema, Document } from 'mongoose';

export interface IBeauvisionCoupon extends Document {
  code: string;
  description?: string | null;
  email?: string | null;
  amountOff: number;
  percentOff: number;
  isActive: boolean;
  maxUses: number;
  usedCount: number;
  expiresAt?: Date | null;
  appliesTo: 'ALL';
  createdAt: Date;
  updatedAt: Date;
}

const BeauvisionCouponSchema = new Schema<IBeauvisionCoupon>(
  {
    code: { type: String, required: true, unique: true, uppercase: true, trim: true },
    description: { type: String, default: null },
    // Optional recipient. When set, the coupon is emailed to this address on
    // creation. It does NOT restrict redemption (no per-user tracking), so any
    // buyer can still redeem the code up to maxUses.
    email: { type: String, default: null, lowercase: true, trim: true },
    amountOff: { type: Number, default: 0, min: 0 },
    percentOff: { type: Number, default: 0, min: 0, max: 100 },
    isActive: { type: Boolean, default: true },
    maxUses: { type: Number, default: 1, min: 1 },
    usedCount: { type: Number, default: 0, min: 0 },
    expiresAt: { type: Date, default: null },
    // Coupons are valid across every paid Beauvision product.
    appliesTo: { type: String, enum: ['ALL'], default: 'ALL' },
  },
  { timestamps: true }
);

export const BeauvisionCoupon = mongoose.model<IBeauvisionCoupon>(
  'BeauvisionCoupon',
  BeauvisionCouponSchema
);
