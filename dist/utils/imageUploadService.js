"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.deleteImageFromCloudinary = exports.uploadImageToCloudinary = exports.upload = void 0;
const cloudinary_1 = require("cloudinary");
const env_1 = require("../config/env");
const multer_1 = __importDefault(require("multer"));
// Configure Cloudinary
cloudinary_1.v2.config({
    cloud_name: env_1.env.CLOUDINARY_CLOUD_NAME,
    api_key: env_1.env.CLOUDINARY_API_KEY,
    api_secret: env_1.env.CLOUDINARY_API_SECRET,
});
// Configure multer for memory storage
const storage = multer_1.default.memoryStorage();
// File filter to accept only images
const fileFilter = (req, file, cb) => {
    if (file.mimetype.startsWith('image/')) {
        cb(null, true);
    }
    else {
        cb(new Error('Only image files are allowed!'));
    }
};
// Multer configuration
exports.upload = (0, multer_1.default)({
    storage,
    fileFilter,
    limits: {
        fileSize: 5 * 1024 * 1024, // 5MB limit
    },
});
// Upload image to Cloudinary
const uploadImageToCloudinary = async (fileBuffer, fileName) => {
    return new Promise((resolve, reject) => {
        cloudinary_1.v2.uploader.upload_stream({
            resource_type: 'image',
            folder: 'pet-security-tags/pets',
            public_id: `pet-${Date.now()}-${fileName}`,
            format: 'jpg',
            transformation: [
                { width: 500, height: 500, crop: 'fill' },
                { quality: 'auto' }
            ]
        }, (error, result) => {
            if (error) {
                reject(error);
            }
            else if (result) {
                resolve({
                    url: result.secure_url,
                    publicId: result.public_id
                });
            }
            else {
                reject(new Error('Upload failed'));
            }
        }).end(fileBuffer);
    });
};
exports.uploadImageToCloudinary = uploadImageToCloudinary;
// Delete image from Cloudinary
const deleteImageFromCloudinary = async (publicId) => {
    try {
        const result = await cloudinary_1.v2.uploader.destroy(publicId);
        return result.result === 'ok';
    }
    catch (error) {
        console.error('Error deleting image from Cloudinary:', error);
        return false;
    }
};
exports.deleteImageFromCloudinary = deleteImageFromCloudinary;
