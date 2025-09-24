import mongoose, { Document, Schema } from 'mongoose';

export interface IPet extends Document {
  userId: string;
  userPetTagOrderId: string;
  orderType: 'UserPetTagOrder' | 'PetTagOrder';
  petName: string;
  hideName: boolean;
  age: number;
  breed: string;
  medication: string;
  allergies: string;
  notes: string;
  image?: string;
  createdAt: Date;
  updatedAt: Date;
}

const PetSchema: Schema = new Schema({
  userId: {
    type: Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  userPetTagOrderId: {
    type: Schema.Types.ObjectId,
    refPath: 'orderType',
    required: true
  },
  orderType: {
    type: String,
    enum: ['UserPetTagOrder', 'PetTagOrder'],
    required: true
  },
  petName: {
    type: String,
    required: true,
    trim: true
  },
  hideName: {
    type: Boolean,
    default: false
  },
  age: {
    type: Number,
    min: 0,
    max: 30
  },
  breed: {
    type: String,
    trim: true
  },
  medication: {
    type: String,
    trim: true
  },
  allergies: {
    type: String,
    trim: true
  },
  notes: {
    type: String,
    trim: true
  },
  image: {
    type: String,
    trim: true
  }
}, {
  timestamps: true
});

export default mongoose.model<IPet>('Pet', PetSchema);
