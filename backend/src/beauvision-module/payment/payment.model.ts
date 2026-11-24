import mongoose, { Schema, Document } from 'mongoose';

export interface IPayment extends Document {
  reference: string;
  email: string;
  amount: number;
  couponCode?: string;
  discountAmount?: number;
  status: 'SUCCESS' | 'FAILED' | 'PENDING';
  resourceIds?: mongoose.Types.ObjectId[]; 
  metadata?: Record<string, any>;
  createdAt: Date;
  updatedAt: Date;
}

const PaymentSchema = new Schema<IPayment>(
  {
    reference: { type: String, required: true, unique: true },
    email: { type: String, required: true },
    amount: { type: Number, required: true },
    couponCode: { type: String },
    discountAmount: { type: Number, default: 0 },
    status: { type: String, enum: ['SUCCESS', 'FAILED', 'PENDING'], default: 'PENDING' },
    resourceIds: [{ type: Schema.Types.ObjectId, ref: 'DigitalResource' }],
    metadata: { type: Schema.Types.Mixed },
  },
  { timestamps: true }
);

export const Payment = mongoose.model<IPayment>('Payment', PaymentSchema);
