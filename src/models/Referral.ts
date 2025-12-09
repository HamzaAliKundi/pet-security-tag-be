import mongoose, { Document, Schema } from 'mongoose';

export interface IReferral extends Document {
  referrerId: mongoose.Types.ObjectId;
  referredUserId: mongoose.Types.ObjectId;
  pointsAwarded: number;
  referralCodeUsed: string;
  createdAt: Date;
}

const ReferralSchema: Schema = new Schema({
  referrerId: {
    type: Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  referredUserId: {
    type: Schema.Types.ObjectId,
    ref: 'User',
    required: true,
    unique: true // A user can only be referred once
  },
  pointsAwarded: {
    type: Number,
    required: true,
    default: 100
  },
  referralCodeUsed: {
    type: String,
    required: true
  }
}, {
  timestamps: true
});

export default mongoose.model<IReferral>('Referral', ReferralSchema);

