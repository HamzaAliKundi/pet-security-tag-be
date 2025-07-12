import jwt, { SignOptions } from 'jsonwebtoken';
import { IUser } from '../models/User';
import { env } from '../config/env';
import chalk from 'chalk';

if (!env.JWT_SECRET) {
  console.error(chalk.red('JWT_SECRET is not defined in environment variables'));
  process.exit(1);
}

export const generateToken = (user: IUser): string => {
  const payload = { _id: user._id, role: user.role };
  const options: SignOptions = { 
    expiresIn: '30d'
  };
  
  return jwt.sign(payload, env.JWT_SECRET, options);
};

export const generateVerificationToken = (user: IUser): string => {
  const payload = { _id: user._id };
  const options: SignOptions = { 
    expiresIn: '1h'
  };
  
  return jwt.sign(payload, env.JWT_SECRET, options);
};

export const generateForgotPasswordToken = (user: IUser): string => {
  const payload = { _id: user._id };
  const options: SignOptions = { 
    expiresIn: '1h'
  };
  
  return jwt.sign(payload, env.JWT_SECRET, options);
};

export const verifyToken = (token: string): { _id: string } => {
  return jwt.verify(token, env.JWT_SECRET) as unknown as { _id: string } ?? { _id: '' };
};
