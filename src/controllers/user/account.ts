import { Request, Response } from 'express';
import asyncHandler from 'express-async-handler';
import User from '../../models/User';
import Pet from '../../models/Pet';
import UserPetTagOrder from '../../models/UserPetTagOrder';
import Subscription from '../../models/Subscription';
import QRCode from '../../models/QRCode';

// Get single user (Private)
export const getSingleUser = asyncHandler(async (req: Request, res: Response): Promise<void> => {
  // Assuming the user ID comes from the auth middleware (req.user.id)
  const userId = (req as any).user?.id;

  if (!userId) {
    res.status(401).json({ message: 'User not authenticated' });
    return;
  }

  const user = await User.findById(userId).select('firstName lastName email');

  if (!user) {
    res.status(404).json({ message: 'User not found' });
    return;
  }

  res.status(200).json({
    message: 'User retrieved successfully',
    status: 200,
    user: {
      _id: user._id,
      firstName: user.firstName,
      lastName: user.lastName,
      email: user.email
    }
  });
});

// Update single user (Private)
export const updateSingleUser = asyncHandler(async (req: Request, res: Response): Promise<void> => {
  // Assuming the user ID comes from the auth middleware (req.user.id)
  const userId = (req as any).user?.id;
  const { firstName, lastName, email } = req.body;

  if (!userId) {
    res.status(401).json({ message: 'User not authenticated' });
    return;
  }

  // Validate required fields
  if (!firstName || !lastName || !email) {
    res.status(400).json({ 
      message: 'All fields are required: firstName, lastName, email' 
    });
    return;
  }

  // Validate email format
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  if (!emailRegex.test(email)) {
    res.status(400).json({ message: 'Invalid email format' });
    return;
  }

  // Check if user exists
  const existingUser = await User.findById(userId);
  if (!existingUser) {
    res.status(404).json({ message: 'User not found' });
    return;
  }

  // Check if email is already taken by another user
  if (email !== existingUser.email) {
    const emailExists = await User.findOne({ email, _id: { $ne: userId } });
    if (emailExists) {
      res.status(400).json({ message: 'Email already exists' });
      return;
    }
  }

  // Update user
  const updatedUser = await User.findByIdAndUpdate(
    userId,
    {
      firstName: firstName.trim(),
      lastName: lastName.trim(), 
      email: email.toLowerCase().trim()
    },
    { 
      new: true,
      runValidators: true
    }
  ).select('firstName lastName email');

  if (!updatedUser) {
    res.status(404).json({ message: 'User not found' });
    return;
  }

  res.status(200).json({
    message: 'User updated successfully',
    status: 200,
    user: {
      _id: updatedUser._id,
      firstName: updatedUser.firstName,
      lastName: updatedUser.lastName,
      email: updatedUser.email
    }
  });
});

// Delete authenticated user's account (Private)
export const deleteAccount = asyncHandler(async (req: Request, res: Response): Promise<void> => {
  const userId = (req as any).user?.id;

  if (!userId) {
    res.status(401).json({ message: 'User not authenticated' });
    return;
  }

  const existingUser = await User.findById(userId);
  if (!existingUser) {
    res.status(404).json({ message: 'User not found' });
    return;
  }

  // Reset any QR codes linked to this user
  await QRCode.updateMany(
    { assignedUserId: userId },
    {
      $set: {
        assignedUserId: null,
        assignedOrderId: null,
        assignedPetId: null,
        hasGiven: false,
        hasVerified: false,
        status: 'unassigned',
        isDownloaded: false,
        downloadedAt: null,
        lastScannedAt: null,
        scannedCount: 0
      }
    }
  );

  // Remove user-related data
  await Promise.all([
    Pet.deleteMany({ userId }),
    UserPetTagOrder.deleteMany({ userId }),
    Subscription.deleteMany({ userId })
  ]);

  await User.findByIdAndDelete(userId);

  res.status(200).json({
    message: 'Account deleted successfully',
    status: 200
  });
});