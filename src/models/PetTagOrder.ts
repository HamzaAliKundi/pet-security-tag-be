import mongoose, { Document, Schema } from 'mongoose';

export interface IPetTagOrder extends Document {
  email: string;
  name: string;
  petName: string;
  quantity: number;
  subscriptionType: 'monthly' | 'yearly';
  status: 'pending' | 'paid' | 'shipped' | 'delivered' | 'cancelled';
  paymentIntentId?: string;
  tagColor?: string; // Keep for backward compatibility
  tagColors?: string[]; // Array of colors for each tag (length should match quantity)
  totalCostEuro?: number;
  shippingAddress?: {
    street: string;
    city: string;
    state: string;
    zipCode: string;  
    country: string;
  };
  phone?: string;
  trackingNumber?: string;
  deliveryCompany?: string;
  createdAt: Date;
  updatedAt: Date;
}

const PetTagOrderSchema: Schema = new Schema({
  email: {
    type: String,
    required: true,
    trim: true,
    lowercase: true
  },
  name: {
    type: String,
    required: true,
    trim: true
  },
  petName: {
    type: String,
    required: true,
    trim: true
  },
  quantity: {
    type: Number,
    required: true,
    min: 1,
    default: 1
  },
  subscriptionType: {
    type: String,
    required: true,
    enum: ['monthly', 'yearly'],
    default: 'monthly'
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
  shippingAddress: {
    street: {
      type: String,
      trim: true
    },
    city: {
      type: String,
      trim: true
    },
    state: {
      type: String,
      trim: true
    },
    zipCode: {
      type: String,
      trim: true
    },
    country: {
      type: String,
      trim: true
    }
  },
  phone: {
    type: String,
    trim: true
  },
  tagColor: {
    type: String,
    trim: true
  },
  tagColors: {
    type: [String],
    default: undefined
  },
  totalCostEuro: {
    type: Number,
    min: 0
  },
  trackingNumber: {
    type: String,
    trim: true
  },
  deliveryCompany: {
    type: String,
    trim: true
  }
}, {
  timestamps: true
});

export default mongoose.model<IPetTagOrder>('PetTagOrder', PetTagOrderSchema); 