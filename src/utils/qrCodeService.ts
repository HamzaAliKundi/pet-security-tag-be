import QRCodeLib from 'qrcode';
import { v2 as cloudinary } from 'cloudinary';
import { env } from '../config/env';
import { ObjectId } from 'mongodb';
import QRCode from '../models/QRCode';

// Configure Cloudinary
cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
});

// Generate unique QR code string
const generateUniqueQRCode = (): string => {
  const timestamp = Date.now();
  const randomString = Math.random().toString(36).substring(2, 8).toUpperCase();
  return `QR-${timestamp}-${randomString}`;
};

// Generate QR code and upload to Cloudinary
export const generateQRCodeWithCloudinary = async (): Promise<{
  id: string;
  code: string;
  imageUrl: string;
  qrURL: string;
  cloudinaryPublicId: string;
  status: string;
}> => {
  try {
    // Generate unique code
    const uniqueCode = generateUniqueQRCode();
    
    // Create the URL that will be encoded in QR
    const qrURL = `${env.QR_URL}/qr/${uniqueCode}`;
    
    // Generate QR code as data URL
    const qrCodeDataURL = await QRCodeLib.toDataURL(qrURL, {
      errorCorrectionLevel: 'M',
      margin: 2,
      color: {
        dark: '#000000',
        light: '#FFFFFF'
      },
      width: 256
    });

    // Upload to Cloudinary
    const uploadResult = await cloudinary.uploader.upload(qrCodeDataURL, {
      folder: 'pet-security-tags/qr-codes',
      public_id: `qr-${uniqueCode}`,
      format: 'png',
      transformation: [
        { width: 256, height: 256, crop: 'fit' },
        { quality: 'auto' }
      ]
    });

    // Save to database
    const qrCodeRecord = await QRCode.create({
      code: uniqueCode,
      imageUrl: uploadResult.secure_url,
      hasGiven: false,
      hasVerified: false,
      status: 'unassigned',
      scannedCount: 0,
      isDownloaded: false
    });

    return {
      id: qrCodeRecord._id,
      code: uniqueCode,
      imageUrl: uploadResult.secure_url,
      qrURL,
      cloudinaryPublicId: uploadResult.public_id,
      status: 'unassigned'
    };

  } catch (error) {
    console.error('Error generating QR code with Cloudinary:', error);
    throw new Error('Failed to generate QR code');
  }
};

// Delete QR code from Cloudinary
export const deleteQRCodeFromCloudinary = async (code: string): Promise<boolean> => {
  try {
    const publicId = `pet-security-tags/qr-codes/qr-${code}`;
    const result = await cloudinary.uploader.destroy(publicId);
    return result.result === 'ok';
  } catch (error) {
    console.error('Error deleting QR code from Cloudinary:', error);
    return false;
  }
};

// Get QR code pricing
export const getQRCodePricing = () => {
  return {
    monthly: {
      price: 2.75,
      currency: 'GBP',
      duration: '1 month',
      description: 'Monthly subscription for QR code verification'
    },
    yearly: {
      price: 19.99,
      currency: 'GBP',
      duration: '12 months',
      description: 'Yearly subscription for QR code verification',
      savings: '13.01'
    },
    lifetime: {
      price: 99.00,
      currency: 'GBP',
      duration: 'Lifetime',
      description: 'One-time payment for lifetime QR code verification',
      savings: 'Maximum value'
    }
  };
};

// Validate QR code format
export const isValidQRCodeFormat = (code: string): boolean => {
  const qrRegex = /^QR-\d{13}-[A-Z0-9]{6}$/;
  return qrRegex.test(code);
};

// Check subscription status
export const checkSubscriptionStatus = async (userId: string, qrCodeId: string): Promise<{
  hasActiveSubscription: boolean;
  subscription?: any;
  daysRemaining?: number;
}> => {
  try {
    const Subscription = require('../models/Subscription').default;
    
    const subscription = await Subscription.findOne({
      userId,
      qrCodeId,
      status: 'active',
      endDate: { $gt: new Date() }
    }).lean();

    if (!subscription) {
      return { hasActiveSubscription: false };
    }

    const now = new Date();
    const endDate = new Date(subscription.endDate);
    const timeDiff = endDate.getTime() - now.getTime();
    const daysRemaining = Math.ceil(timeDiff / (1000 * 3600 * 24));

    return {
      hasActiveSubscription: true,
      subscription,
      daysRemaining: Math.max(0, daysRemaining)
    };

  } catch (error) {
    console.error('Error checking subscription status:', error);
    return { hasActiveSubscription: false };
  }
};

// Generate batch QR codes
export const generateBatchQRCodes = async (quantity: number): Promise<{
  successful: Array<{
    id: string;
    code: string;
    imageUrl: string;
    qrURL: string;
    cloudinaryPublicId: string;
    status: string;
  }>;
  failed: number;
  total: number;
}> => {
  const results: {
    successful: Array<{
      id: string;
      code: string;
      imageUrl: string;
      qrURL: string;
      cloudinaryPublicId: string;
      status: string;
    }>;
    failed: number;
    total: number;
  } = {
    successful: [],
    failed: 0,
    total: quantity
  };

  for (let i = 0; i < quantity; i++) {
    try {
      const qrCode = await generateQRCodeWithCloudinary();
      results.successful.push(qrCode);
    } catch (error) {
      results.failed++;
      console.error(`Failed to generate QR code ${i + 1}:`, error);
    }
  }

  return results;
};

