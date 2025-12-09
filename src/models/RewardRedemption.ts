import mongoose, { Document, Schema } from 'mongoose';

export interface IRewardRedemption extends Document {
  userId: mongoose.Types.ObjectId;
  rewardTier: 1 | 2; // 1 = 1000 points (Amazon voucher), 2 = 2000 points (Pet Gift Box)
  pointsAtRedemption: number;
  status: 'pending' | 'shipped' | 'completed';
  adminNotes?: string;
  redeemedAt: Date;
  shippedAt?: Date;
  completedAt?: Date;
  createdAt: Date;
  updatedAt: Date;
}

const RewardRedemptionSchema: Schema = new Schema({
  userId: {
    type: Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  rewardTier: {
    type: Number,
    enum: [1, 2],
    required: true
  },
  pointsAtRedemption: {
    type: Number,
    required: true
  },
  status: {
    type: String,
    enum: ['pending', 'shipped', 'completed'],
    default: 'pending'
  },
  adminNotes: {
    type: String,
    trim: true
  },
  redeemedAt: {
    type: Date,
    default: Date.now
  },
  shippedAt: {
    type: Date
  },
  completedAt: {
    type: Date
  }
}, {
  timestamps: true
});

// Index to ensure one pending redemption per tier per user
RewardRedemptionSchema.index({ userId: 1, rewardTier: 1, status: 1 });

export default mongoose.model<IRewardRedemption>('RewardRedemption', RewardRedemptionSchema);


