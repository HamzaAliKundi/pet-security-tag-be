import mongoose, { Document, Schema } from 'mongoose';

export interface IQRCode extends Document {
  code: string;
  imageUrl: string;
  hasGiven: boolean;
  hasVerified: boolean;
  assignedUserId?: string;
  assignedOrderId?: string;
  assignedPetId?: string;
  status: 'unassigned' | 'assigned' | 'verified' | 'lost';
  scannedCount: number;
  lastScannedAt?: Date;
  createdAt: Date;
  updatedAt: Date;
}

const QRCodeSchema: Schema = new Schema({
  code: {
    type: String,
    required: true,
    unique: true,
    trim: true
  },
  imageUrl: {
    type: String,
    required: true,
    trim: true
  },
  hasGiven: {
    type: Boolean,
    default: false
  },
  hasVerified: {
    type: Boolean,
    default: false
  },
  assignedUserId: {
    type: Schema.Types.ObjectId,
    ref: 'User',
    default: null
  },
  assignedOrderId: {
    type: Schema.Types.ObjectId,
    ref: 'UserPetTagOrder',
    default: null
  },
  assignedPetId: {
    type: Schema.Types.ObjectId,
    ref: 'Pet',
    default: null
  },
  status: {
    type: String,
    enum: ['unassigned', 'assigned', 'verified', 'lost'],
    default: 'unassigned'
  },
  scannedCount: {
    type: Number,
    default: 0
  },
  lastScannedAt: {
    type: Date
  }
}, {
  timestamps: true
});

export default mongoose.model<IQRCode>('QRCode', QRCodeSchema);

