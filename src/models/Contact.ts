import mongoose, { Document, Schema } from 'mongoose';

export interface IContact extends Document {
  fullName: string;
  email: string;
  purpose: string;
  message: string;
  status: 'unread' | 'read' | 'replied';
  createdAt: Date;
  updatedAt: Date;
}

const ContactSchema: Schema = new Schema({
  fullName: {
    type: String,
    required: true,
    trim: true
  },
  email: {
    type: String,
    required: true,
    trim: true,
    lowercase: true
  },
  purpose: {
    type: String,
    required: true,
    trim: true
  },
  message: {
    type: String,
    required: true,
    trim: true
  },
  status: {
    type: String,
    required: true,
    enum: ['unread', 'read', 'replied'],
    default: 'unread'
  }
}, {
  timestamps: true
});

export default mongoose.model<IContact>('Contact', ContactSchema); 