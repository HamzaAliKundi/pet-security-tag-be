"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.env = void 0;
const dotenv_1 = __importDefault(require("dotenv"));
const chalk_1 = __importDefault(require("chalk"));
dotenv_1.default.config();
const validateEnv = () => {
    const requiredEnvVars = [
        'PORT',
        'NODE_ENV',
        'MONGODB_URI',
        'JWT_SECRET',
        'SALT_ROUNDS',
        'SENDGRID_API_KEY',
        'SENDGRID_FROM_EMAIL',
        'SENDGRID_FROM_NAME',
        'FRONTEND_URL',
        'STRIPE_PUBLISH_KEY',
        'STRIPE_SECRET_KEY'
    ];
    for (const envVar of requiredEnvVars) {
        if (!process.env[envVar]) {
            console.error(chalk_1.default.red(`Missing required environment variable: ${envVar}`));
            process.exit(1);
        }
    }
    return {
        PORT: Number(process.env.PORT),
        NODE_ENV: process.env.NODE_ENV,
        MONGODB_URI: process.env.MONGODB_URI,
        JWT_SECRET: process.env.JWT_SECRET,
        SALT_ROUNDS: Number(process.env.SALT_ROUNDS),
        SENDGRID_API_KEY: process.env.SENDGRID_API_KEY,
        SENDGRID_FROM_EMAIL: process.env.SENDGRID_FROM_EMAIL,
        SENDGRID_FROM_NAME: process.env.SENDGRID_FROM_NAME,
        FRONTEND_URL: process.env.FRONTEND_URL,
        STRIPE_PUBLISH_KEY: process.env.STRIPE_PUBLISH_KEY,
        STRIPE_SECRET_KEY: process.env.STRIPE_SECRET_KEY
    };
};
exports.env = validateEnv();
