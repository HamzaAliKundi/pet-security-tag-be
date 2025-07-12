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
        'SMTP_USER',
        'SMTP_PASS',
        'FRONTEND_URL'
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
        SMTP_USER: process.env.SMTP_USER,
        SMTP_PASS: process.env.SMTP_PASS,
        FRONTEND_URL: process.env.FRONTEND_URL
    };
};
exports.env = validateEnv();
