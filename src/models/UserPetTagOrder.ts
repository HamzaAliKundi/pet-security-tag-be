import mongoose, { Document, Schema } from 'mongoose';

export interface IUserPetTagOrder extends Document {
  userId: string;
  quantity: number;
  petName: string;
  totalCostEuro: number;
  tagColor: string; // Keep for backward compatibility
  tagColors?: string[]; // Array of colors for each tag (length should match quantity)
  phone: string;
  street: string;
  city: string;
  state: string;
  zipCode: string;
  country: string;
  status: 'pending' | 'paid' | 'shipped' | 'delivered' | 'cancelled';
  paymentIntentId?: string;
  paymentStatus: 'pending' | 'succeeded' | 'failed' | 'cancelled';
  isReplacement?: boolean;
  createdAt: Date;
  updatedAt: Date;
}

const UserPetTagOrderSchema: Schema = new Schema({
  userId: {
    type: Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  quantity: {
    type: Number,
    required: true,
    min: 1,
    default: 1
  },
  petName: {
    type: String,
    required: true,
    trim: true
  },
  totalCostEuro: {
    type: Number,
    required: true,
    min: 0
  },
  tagColor: {
    type: String,
    required: true,
    trim: true
  },
  tagColors: {
    type: [String],
    default: undefined
  },
  phone: {
    type: String,
    required: true,
    trim: true
  },
  street: {
    type: String,
    required: true,
    trim: true
  },
  city: {
    type: String,
    required: true,
    trim: true
  },
  state: {
    type: String,
    required: true,
    trim: true
  },
  zipCode: {
    type: String,
    required: true,
    trim: true
  },
  country: {
    type: String,
    required: true,
    trim: true
  },
  status: {
    type: String,
    required: true,
    enum: ['pending', 'paid', 'shipped', 'delivered', 'cancelled'],
    default: 'pending'
  },
  paymentIntentId: {
    type: String,
    trim: true
  },
  paymentStatus: {
    type: String,
    required: true,
    enum: ['pending', 'succeeded', 'failed', 'cancelled'],
    default: 'pending'
  },
  isReplacement: {
    type: Boolean,
    default: false
  }
}, {
  timestamps: true
});

export default mongoose.model<IUserPetTagOrder>('UserPetTagOrder', UserPetTagOrderSchema);
