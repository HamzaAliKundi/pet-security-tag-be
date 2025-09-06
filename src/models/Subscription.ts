import mongoose, { Document, Schema } from 'mongoose';

export interface ISubscription extends Document {
  userId: string;
  qrCodeId: string;
  type: 'monthly' | 'yearly';
  status: 'active' | 'expired' | 'cancelled';
  startDate: Date;
  endDate: Date;
  stripeSubscriptionId?: string;
  paymentIntentId?: string;
  amountPaid: number;
  currency: string;
  autoRenew: boolean;
  createdAt: Date;
  updatedAt: Date;
}

const SubscriptionSchema: Schema = new Schema({
  userId: {
    type: Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  qrCodeId: {
    type: Schema.Types.ObjectId,
    ref: 'QRCode',
    required: true
  },
  type: {
    type: String,
    enum: ['monthly', 'yearly'],
    required: true
  },
  status: {
    type: String,
    enum: ['active', 'expired', 'cancelled'],
    default: 'active'
  },
  startDate: {
    type: Date,
    required: true,
    default: Date.now
  },
  endDate: {
    type: Date,
    required: true
  },
  stripeSubscriptionId: {
    type: String,
    trim: true
  },
  paymentIntentId: {
    type: String,
    trim: true
  },
  amountPaid: {
    type: Number,
    required: true,
    min: 0
  },
  currency: {
    type: String,
    default: 'eur',
    lowercase: true
  },
  autoRenew: {
    type: Boolean,
    default: true
  }
}, {
  timestamps: true
});

// Index for efficient queries
SubscriptionSchema.index({ userId: 1, qrCodeId: 1 });
SubscriptionSchema.index({ endDate: 1, status: 1 });

export default mongoose.model<ISubscription>('Subscription', SubscriptionSchema);

