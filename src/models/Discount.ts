import mongoose, { Document, Schema } from 'mongoose';

export interface IDiscount extends Document {
  code: string;
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
}

const DiscountSchema: Schema = new Schema({
  code: {
    type: String,
    required: true,
    unique: true,
    trim: true
  },
  isActive: {
    type: Boolean,
    default: true
  }
}, {
  timestamps: true
});

export default mongoose.model<IDiscount>('Discount', DiscountSchema);

