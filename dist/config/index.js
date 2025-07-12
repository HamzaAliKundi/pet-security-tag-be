"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const mongoose_1 = __importDefault(require("mongoose"));
const env_1 = require("./env");
const connectDB = async () => {
    try {
        const mongoURI = env_1.env.MONGODB_URI;
        if (!mongoURI)
            throw new Error('MONGODB_URI is not defined in environment variables');
        const conn = await mongoose_1.default.connect(mongoURI);
        console.log(`MongoDB connected successfully: ${conn.connection.host}`);
    }
    catch (error) {
        console.error('MongoDB connection error:', error);
        process.exit(1);
    }
};
exports.default = connectDB;
