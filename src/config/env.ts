import dotenv from 'dotenv';
import chalk from 'chalk';

dotenv.config();

interface EnvVars {
  PORT: number;
  NODE_ENV: string;
  MONGODB_URI: string;
  JWT_SECRET: string;
  SALT_ROUNDS: number;
  SENDGRID_API_KEY: string;
  SENDGRID_FROM_EMAIL: string;
  SENDGRID_FROM_NAME: string;
  FRONTEND_URL: string;
  QR_URL: string;
  STRIPE_PUBLISH_KEY: string;
  STRIPE_SECRET_KEY: string;
  CLOUDINARY_CLOUD_NAME: string;
  CLOUDINARY_API_KEY: string;
  CLOUDINARY_API_SECRET: string;
  TWILIO_ACCOUNT_SID: string;
  TWILIO_AUTH_TOKEN: string;
  TWILIO_PHONE_NUMBER: string;
  TWILIO_WHATSAPP_NUMBER: string;
  TWILIO_TEST_NUMBER?: string; // Optional: For testing with trial account
}

const validateEnv = (): EnvVars => {
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
    'STRIPE_SECRET_KEY',
    'CLOUDINARY_CLOUD_NAME',
    'CLOUDINARY_API_KEY',
    'CLOUDINARY_API_SECRET',
    'TWILIO_ACCOUNT_SID',
    'TWILIO_AUTH_TOKEN',
    'TWILIO_PHONE_NUMBER',
    'TWILIO_WHATSAPP_NUMBER'
  ];
  
  for (const envVar of requiredEnvVars) {
    if (!process.env[envVar]) {
      console.error(chalk.red(`Missing required environment variable: ${envVar}`));
      process.exit(1);
    }
  }

  return {
    PORT: Number(process.env.PORT),
    NODE_ENV: process.env.NODE_ENV!,
    MONGODB_URI: process.env.MONGODB_URI!,
    JWT_SECRET: process.env.JWT_SECRET!,
    SALT_ROUNDS: Number(process.env.SALT_ROUNDS),
    SENDGRID_API_KEY: process.env.SENDGRID_API_KEY!,
    SENDGRID_FROM_EMAIL: process.env.SENDGRID_FROM_EMAIL!,
    SENDGRID_FROM_NAME: process.env.SENDGRID_FROM_NAME!,
    FRONTEND_URL: process.env.FRONTEND_URL!,
    QR_URL: process.env.QR_URL!,
    STRIPE_PUBLISH_KEY: process.env.STRIPE_PUBLISH_KEY!,
    STRIPE_SECRET_KEY: process.env.STRIPE_SECRET_KEY!,
    CLOUDINARY_CLOUD_NAME: process.env.CLOUDINARY_CLOUD_NAME!,
    CLOUDINARY_API_KEY: process.env.CLOUDINARY_API_KEY!,
    CLOUDINARY_API_SECRET: process.env.CLOUDINARY_API_SECRET!,
    TWILIO_ACCOUNT_SID: process.env.TWILIO_ACCOUNT_SID!,
    TWILIO_AUTH_TOKEN: process.env.TWILIO_AUTH_TOKEN!,
    TWILIO_PHONE_NUMBER: process.env.TWILIO_PHONE_NUMBER!,
    TWILIO_WHATSAPP_NUMBER: process.env.TWILIO_WHATSAPP_NUMBER!,
    TWILIO_TEST_NUMBER: process.env.TWILIO_TEST_NUMBER
  };
};

export const env = validateEnv(); 