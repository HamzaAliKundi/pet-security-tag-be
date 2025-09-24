"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.generateBatchQRCodes = exports.checkSubscriptionStatus = exports.isValidQRCodeFormat = exports.getQRCodePricing = exports.deleteQRCodeFromCloudinary = exports.generateQRCodeWithCloudinary = void 0;
const qrcode_1 = __importDefault(require("qrcode"));
const cloudinary_1 = require("cloudinary");
const env_1 = require("../config/env");
const QRCode_1 = __importDefault(require("../models/QRCode"));
// Configure Cloudinary
cloudinary_1.v2.config({
    cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
    api_key: process.env.CLOUDINARY_API_KEY,
    api_secret: process.env.CLOUDINARY_API_SECRET,
});
// Generate unique QR code string
const generateUniqueQRCode = () => {
    const timestamp = Date.now();
    const randomString = Math.random().toString(36).substring(2, 8).toUpperCase();
    return `QR-${timestamp}-${randomString}`;
};
// Generate QR code and upload to Cloudinary
const generateQRCodeWithCloudinary = async () => {
    try {
        // Generate unique code
        const uniqueCode = generateUniqueQRCode();
        // Create the URL that will be encoded in QR
        const qrURL = `${env_1.env.QR_URL}/qr/${uniqueCode}`;
        // Generate QR code as data URL
        const qrCodeDataURL = await qrcode_1.default.toDataURL(qrURL, {
            errorCorrectionLevel: 'M',
            margin: 2,
            color: {
                dark: '#000000',
                light: '#FFFFFF'
            },
            width: 256
        });
        // Upload to Cloudinary
        const uploadResult = await cloudinary_1.v2.uploader.upload(qrCodeDataURL, {
            folder: 'pet-security-tags/qr-codes',
            public_id: `qr-${uniqueCode}`,
            format: 'png',
            transformation: [
                { width: 256, height: 256, crop: 'fit' },
                { quality: 'auto' }
            ]
        });
        // Save to database
        const qrCodeRecord = await QRCode_1.default.create({
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
    }
    catch (error) {
        console.error('Error generating QR code with Cloudinary:', error);
        throw new Error('Failed to generate QR code');
    }
};
exports.generateQRCodeWithCloudinary = generateQRCodeWithCloudinary;
// Delete QR code from Cloudinary
const deleteQRCodeFromCloudinary = async (code) => {
    try {
        const publicId = `pet-security-tags/qr-codes/qr-${code}`;
        const result = await cloudinary_1.v2.uploader.destroy(publicId);
        return result.result === 'ok';
    }
    catch (error) {
        console.error('Error deleting QR code from Cloudinary:', error);
        return false;
    }
};
exports.deleteQRCodeFromCloudinary = deleteQRCodeFromCloudinary;
// Get QR code pricing
const getQRCodePricing = () => {
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
exports.getQRCodePricing = getQRCodePricing;
// Validate QR code format
const isValidQRCodeFormat = (code) => {
    const qrRegex = /^QR-\d{13}-[A-Z0-9]{6}$/;
    return qrRegex.test(code);
};
exports.isValidQRCodeFormat = isValidQRCodeFormat;
// Check subscription status
const checkSubscriptionStatus = async (userId, qrCodeId) => {
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
    }
    catch (error) {
        console.error('Error checking subscription status:', error);
        return { hasActiveSubscription: false };
    }
};
exports.checkSubscriptionStatus = checkSubscriptionStatus;
// Generate batch QR codes
const generateBatchQRCodes = async (quantity) => {
    const results = {
        successful: [],
        failed: 0,
        total: quantity
    };
    for (let i = 0; i < quantity; i++) {
        try {
            const qrCode = await (0, exports.generateQRCodeWithCloudinary)();
            results.successful.push(qrCode);
        }
        catch (error) {
            results.failed++;
            console.error(`Failed to generate QR code ${i + 1}:`, error);
        }
    }
    return results;
};
exports.generateBatchQRCodes = generateBatchQRCodes;
