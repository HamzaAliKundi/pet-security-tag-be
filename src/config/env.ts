import dotenv from 'dotenv';
import chalk from 'chalk';

dotenv.config();

interface EnvVars {
  PORT: number;
  NODE_ENV: string;
  MONGODB_URI: string;
  JWT_SECRET: string;
  SALT_ROUNDS: number;
  SMTP_USER: string;
  SMTP_PASS: string;
  FRONTEND_URL: string;
}

const validateEnv = (): EnvVars => {
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
    SMTP_USER: process.env.SMTP_USER!,
    SMTP_PASS: process.env.SMTP_PASS!,
    FRONTEND_URL: process.env.FRONTEND_URL!
  };
};

export const env = validateEnv(); 