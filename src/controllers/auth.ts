import { Request, Response } from 'express';
import bcrypt from 'bcryptjs';
import User from '../models/User';
import { env } from '../config/env';
import asyncHandler from 'express-async-handler';
import { sendPasswordResetEmail, sendVerificationEmail } from '../utils/emailService';
import { generateForgotPasswordToken, generateToken, generateVerificationToken, verifyToken } from '../utils/jwt';

export const register = asyncHandler(async (req: Request, res: Response): Promise<void> => {
  const { email, password, name } = req.body;

  const existingUser = await User.findOne({ email });
  if (existingUser) res.status(400).json({ message: 'User already exists' });

  const salt = await bcrypt.genSalt(env.SALT_ROUNDS);
  const hashedPassword = await bcrypt.hash(password, salt);

  const user = await User.create({
    email,
    password: hashedPassword,
    name,
    isEmailVerified: false
  });

  const token = generateVerificationToken(user);
  await sendVerificationEmail(email, name, token);

  res.status(201).json({
    message: 'User registered successfully. Please check your email to verify your account.',
    status: 201,
    token,
    user: {
      _id: user._id,
      email: user.email,
      name: user.name,
      role: user.role,
      isEmailVerified: user.isEmailVerified
    }
  });
}); 

export const login = asyncHandler(async (req: Request, res: Response): Promise<void> => {
  const { email, password } = req.body;

  const user = await User.findOne({ email });
  if (!user) {
    res.status(400).json({ message: 'Invalid credentials' });
    return;
  }

  if(!user.isEmailVerified) {
    res.status(400).json({ message: 'Email not verified' });
    return;
  }

  const isPasswordValid = await bcrypt.compare(password, user.password);
  if (!isPasswordValid) {
    res.status(400).json({ message: 'Invalid credentials' });
    return;
  }

  const token = generateToken(user);

  res.status(200).json({
    message: 'Login successful',
    status: 200,
    token,
    user: {
      _id: user._id,
      email: user.email,
      name: user.name,
      role: user.role
    }
  });
});    

export const verifyEmail = asyncHandler(async (req: Request, res: Response): Promise<void> => {
  const { token } = req.body;

  try {
    const decoded = verifyToken(token);
    const user = await User.findById(decoded._id);

    if (!user) {
      res.status(400).json({ message: 'User not found' });
      return;
    }
    if (user.isEmailVerified) {
      res.status(400).json({ message: 'Email already verified' });
      return;
    }

    user.isEmailVerified = true;
    await user.save();  

    res.status(200).json({
      message: 'Email verified successfully',
      status: 200
    });
  } catch (error) {
    res.status(400).json({ message: 'Token expired or invalid' });
    return;
  }
});

export const sendForgotPasswordEmail = asyncHandler(async (req: Request, res: Response): Promise<void> => {
  const { email } = req.body;

  const user = await User.findOne({ email });
  if (!user) { 
    res.status(400).json({ message: 'User not found' });
    return;
  }

  const token = generateForgotPasswordToken(user);
  await sendPasswordResetEmail(email, user?.name, token);

  res.status(200).json({
    message: 'Forgot password email sent successfully',
    status: 200
  });
}); 

export const resetPassword = asyncHandler(async (req: Request, res: Response): Promise<void> => {
  const { token, password } = req.body;

  try {
    const decoded = verifyToken(token);
    const user = await User.findById(decoded._id);
    
    if (!user) {
      res.status(400).json({ message: 'User not found' });
      return;
    }

    const salt = await bcrypt.genSalt(env.SALT_ROUNDS);
    const hashedPassword = await bcrypt.hash(password, salt);
    
    user.password = hashedPassword;
    await user.save();
    
    res.status(200).json({
      message: 'Password reset successfully',
      status: 200
    });
  } catch (error) {
    res.status(400).json({ message: 'Token expired or invalid' });
    return;
  }
});