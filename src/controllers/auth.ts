import { Request, Response } from 'express';
import bcrypt from 'bcryptjs';
import User from '../models/User';
import Referral from '../models/Referral';
import { env } from '../config/env';
import asyncHandler from 'express-async-handler';
import { sendPasswordResetEmail, sendVerificationEmail } from '../utils/emailService';
import { generateForgotPasswordToken, generateToken, generateVerificationToken, verifyToken } from '../utils/jwt';
import { generateReferralCode } from '../utils/referralCode';
import { checkAndCreateRewardRedemption } from '../utils/rewardRedemption';

export const register = asyncHandler(async (req: Request, res: Response): Promise<void> => {
  const { email, password, firstName, lastName, referralCode: incomingReferralCode } = req.body;

  const existingUser = await User.findOne({ email });
  if (existingUser) {
    res.status(400).json({ message: 'User already exists' });
    return;
  }

  const salt = await bcrypt.genSalt(env.SALT_ROUNDS);
  const hashedPassword = await bcrypt.hash(password, salt);

  // Generate unique referral code for new user
  let userReferralCode = generateReferralCode();
  let isUniqueCode = false;
  while (!isUniqueCode) {
    const existingCode = await User.findOne({ referralCode: userReferralCode });
    if (!existingCode) {
      isUniqueCode = true;
    } else {
      userReferralCode = generateReferralCode();
    }
  }

  // Handle referral code if provided
  let referredByUserId = null;
  if (incomingReferralCode) {
    const referrer = await User.findOne({ referralCode: incomingReferralCode });
    if (referrer && referrer._id) {
      referredByUserId = referrer._id;
    }
  }

  const user = await User.create({
    email,
    password: hashedPassword,
    firstName,
    lastName,
    isEmailVerified: false,
    referralCode: userReferralCode,
    loyaltyPoints: referredByUserId ? 100 : 0, // New user gets 100 points if referred
    referredBy: referredByUserId
  });

  // Award points to referrer and create referral record
  if (referredByUserId) {
    try {
      const referrer = await User.findById(referredByUserId);
      if (referrer) {
        // Award 100 points to referrer
        referrer.loyaltyPoints = (referrer.loyaltyPoints || 0) + 100;
        await referrer.save();

        // Check for reward redemptions after awarding points
        await checkAndCreateRewardRedemption(referrer._id.toString());

        // Create referral record
        await Referral.create({
          referrerId: referrer._id,
          referredUserId: user._id,
          pointsAwarded: 100,
          referralCodeUsed: incomingReferralCode
        });
      }
    } catch (referralError) {
      console.error('Error processing referral:', referralError);
      // Don't fail registration if referral processing fails
    }
  }

  const token = generateVerificationToken(user);
  
  // Send verification email (non-blocking)
  try {
    await sendVerificationEmail(email, firstName, token);
  } catch (emailError) {
    console.error('Failed to send verification email:', emailError);
    // Don't fail the registration if email fails
  }

  res.status(201).json({
    message: 'User registered successfully. Please check your email to verify your account.',
    status: 201,
    token,
    user: {
      _id: user._id,
      email: user.email,
      firstName: user.firstName,
      lastName: user.lastName,
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
      firstName: user.firstName,
      lastName: user.lastName,
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
  
  // Send password reset email (non-blocking)
  try {
    await sendPasswordResetEmail(email, user?.firstName, token);
  } catch (emailError) {
    console.error('Failed to send password reset email:', emailError);
    // Don't fail the request if email fails
  }

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