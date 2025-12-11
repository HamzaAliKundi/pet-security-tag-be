import mongoose, { Document, Schema } from 'mongoose';

export interface IInvestment extends Document {
  capitalAvailable: string;
  investorType: 'individual' | 'vc-company';
  name: string;
  company?: string;
  email: string;
  mobileNumber: string;
  isRead: boolean;
  createdAt: Date;
  updatedAt: Date;
}

const InvestmentSchema: Schema = new Schema({
  capitalAvailable: {
    type: String,
    required: true,
    enum: ['up-to-40000', 'up-to-100000', 'up-to-250000', 'over-250000']
  },
  investorType: {
    type: String,
    required: true,
    enum: ['individual', 'vc-company']
  },
  name: {
    type: String,
    required: true,
    trim: true
  },
  company: {
    type: String,
    trim: true,
    default: ''
  },
  email: {
    type: String,
    required: true,
    trim: true,
    lowercase: true
  },
  mobileNumber: {
    type: String,
    required: true,
    trim: true
  },
  isRead: {
    type: Boolean,
    required: true,
    default: false
  }
}, {
  timestamps: true
});

export default mongoose.model<IInvestment>('Investment', InvestmentSchema);

