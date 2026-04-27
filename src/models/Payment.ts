import mongoose, { Document, Schema } from 'mongoose';

export interface IPayment extends Document {
  userId: mongoose.Types.ObjectId;
  subscriptionId?: mongoose.Types.ObjectId;
  qrCodeId?: mongoose.Types.ObjectId;
  status: 'succeeded' | 'failed';
  paymentType: 'subscription';
  source: 'api_confirm' | 'stripe_webhook';
  amount: number;
  currency: string;
  action?: 'renewal' | 'upgrade' | 'new_subscription';
  subscriptionType?: 'monthly' | 'yearly' | 'lifetime';
  paymentIntentId?: string;
  stripeSubscriptionId?: string;
  stripeInvoiceId?: string;
  stripeEventId?: string;
  attemptCount?: number;
  failureReason?: string;
  metadata?: Record<string, any>;
  createdAt: Date;
  updatedAt: Date;
}

const PaymentSchema: Schema = new Schema(
  {
    userId: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      index: true,
    },
    subscriptionId: {
      type: Schema.Types.ObjectId,
      ref: 'Subscription',
      required: false,
      index: true,
    },
    qrCodeId: {
      type: Schema.Types.ObjectId,
      ref: 'QRCode',
      required: false,
    },
    status: {
      type: String,
      enum: ['succeeded', 'failed'],
      required: true,
      index: true,
    },
    paymentType: {
      type: String,
      enum: ['subscription'],
      default: 'subscription',
      required: true,
    },
    source: {
      type: String,
      enum: ['api_confirm', 'stripe_webhook'],
      required: true,
      index: true,
    },
    amount: {
      type: Number,
      required: true,
      min: 0,
    },
    currency: {
      type: String,
      required: true,
      lowercase: true,
      trim: true,
    },
    action: {
      type: String,
      enum: ['renewal', 'upgrade', 'new_subscription'],
      required: false,
    },
    subscriptionType: {
      type: String,
      enum: ['monthly', 'yearly', 'lifetime'],
      required: false,
    },
    paymentIntentId: {
      type: String,
      trim: true,
      index: true,
    },
    stripeSubscriptionId: {
      type: String,
      trim: true,
      index: true,
    },
    stripeInvoiceId: {
      type: String,
      trim: true,
      index: true,
    },
    stripeEventId: {
      type: String,
      trim: true,
      index: true,
    },
    attemptCount: {
      type: Number,
      required: false,
      min: 0,
    },
    failureReason: {
      type: String,
      trim: true,
      required: false,
    },
    metadata: {
      type: Schema.Types.Mixed,
      required: false,
    },
  },
  {
    timestamps: true,
  }
);

PaymentSchema.index({ userId: 1, createdAt: -1 });
PaymentSchema.index({ subscriptionId: 1, createdAt: -1 });

export default mongoose.model<IPayment>('Payment', PaymentSchema);
