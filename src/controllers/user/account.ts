import { Request, Response } from 'express';
import asyncHandler from 'express-async-handler';
import User from '../../models/User';
import Pet from '../../models/Pet';
import UserPetTagOrder from '../../models/UserPetTagOrder';
import PetTagOrder from '../../models/PetTagOrder';
import Subscription from '../../models/Subscription';
import QRCode from '../../models/QRCode';
import { sendAccountDeletedEmail } from '../../utils/emailService';

// Get single user (Private)
export const getSingleUser = asyncHandler(async (req: Request, res: Response): Promise<void> => {
  // Assuming the user ID comes from the auth middleware (req.user.id)
  const userId = (req as any).user?.id;

  if (!userId) {
    res.status(401).json({ message: 'User not authenticated' });
    return;
  }

  const user = await User.findById(userId).select('firstName lastName email phone street city state zipCode country');

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
      email: user.email,
      phone: user.phone,
      street: user.street,
      city: user.city,
      state: user.state,
      zipCode: user.zipCode,
      country: user.country
    }
  });
});

// Update single user (Private)
export const updateSingleUser = asyncHandler(async (req: Request, res: Response): Promise<void> => {
  // Assuming the user ID comes from the auth middleware (req.user.id)
  const userId = (req as any).user?.id;
  const { firstName, lastName, email, phone, street, city, state, zipCode, country } = req.body;

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

  // Validate phone format if provided (should start with + and contain digits)
  if (phone && phone.trim() !== '') {
    const phoneRegex = /^\+[\d\s\-()]+$/;
    if (!phoneRegex.test(phone.trim())) {
      res.status(400).json({ 
        message: 'Invalid phone number format. Phone number must include country code (e.g., +1234567890)' 
      });
      return;
    }
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

  // Prepare update object
  const updateData: any = {
    firstName: firstName.trim(),
    lastName: lastName.trim(), 
    email: email.toLowerCase().trim()
  };

  // Add phone if provided, or set to undefined to clear it
  if (phone !== undefined) {
    updateData.phone = phone.trim() === '' ? undefined : phone.trim();
  }

  // Add address fields if provided
  if (street !== undefined) {
    updateData.street = street.trim() === '' ? undefined : street.trim();
  }
  if (city !== undefined) {
    updateData.city = city.trim() === '' ? undefined : city.trim();
  }
  if (state !== undefined) {
    updateData.state = state.trim() === '' ? undefined : state.trim();
  }
  if (zipCode !== undefined) {
    updateData.zipCode = zipCode.trim() === '' ? undefined : zipCode.trim();
  }
  if (country !== undefined) {
    updateData.country = country.trim() === '' ? undefined : country.trim();
  }

  // Update user
  const updatedUser = await User.findByIdAndUpdate(
    userId,
    updateData,
    { 
      new: true,
      runValidators: true
    }
  ).select('firstName lastName email phone street city state zipCode country');

  if (!updatedUser) {
    res.status(404).json({ message: 'User not found' });
    return;
  }

  // Sync phone and address to all orders linked to this user (for location share / contact consistency)
  const orderUpdateFields: { phone?: string; street?: string; city?: string; state?: string; zipCode?: string; country?: string } = {};
  if (phone !== undefined && phone.trim() !== '') orderUpdateFields.phone = phone.trim();
  if (street !== undefined && street.trim() !== '') orderUpdateFields.street = street.trim();
  if (city !== undefined && city.trim() !== '') orderUpdateFields.city = city.trim();
  if (state !== undefined && state.trim() !== '') orderUpdateFields.state = state.trim();
  if (zipCode !== undefined && zipCode.trim() !== '') orderUpdateFields.zipCode = zipCode.trim();
  if (country !== undefined && country.trim() !== '') orderUpdateFields.country = country.trim();

  if (Object.keys(orderUpdateFields).length > 0) {
    // UserPetTagOrder: find by userId and update phone, street, city, state, zipCode, country
    await UserPetTagOrder.updateMany(
      { userId },
      { $set: orderUpdateFields }
    );

    // PetTagOrder: find by email and update phone + shippingAddress (only set provided fields)
    const petTagOrderSet: any = {};
    if (orderUpdateFields.phone !== undefined) petTagOrderSet.phone = orderUpdateFields.phone;
    if (orderUpdateFields.street !== undefined) petTagOrderSet['shippingAddress.street'] = orderUpdateFields.street;
    if (orderUpdateFields.city !== undefined) petTagOrderSet['shippingAddress.city'] = orderUpdateFields.city;
    if (orderUpdateFields.state !== undefined) petTagOrderSet['shippingAddress.state'] = orderUpdateFields.state;
    if (orderUpdateFields.zipCode !== undefined) petTagOrderSet['shippingAddress.zipCode'] = orderUpdateFields.zipCode;
    if (orderUpdateFields.country !== undefined) petTagOrderSet['shippingAddress.country'] = orderUpdateFields.country;
    if (Object.keys(petTagOrderSet).length > 0) {
      await PetTagOrder.updateMany(
        { email: updatedUser.email },
        { $set: petTagOrderSet }
      );
    }
  }

  res.status(200).json({
    message: 'User updated successfully',
    status: 200,
    user: {
      _id: updatedUser._id,
      firstName: updatedUser.firstName,
      lastName: updatedUser.lastName,
      email: updatedUser.email,
      phone: updatedUser.phone,
      street: updatedUser.street,
      city: updatedUser.city,
      state: updatedUser.state,
      zipCode: updatedUser.zipCode,
      country: updatedUser.country
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

  // Check for subscriptions before deletion
  const subscriptions = await Subscription.find({ userId });
  const hasSubscription = subscriptions.length > 0;
  const hasLifetimePlan = subscriptions.some(sub => sub.type === 'lifetime');

  // Prepare customer name
  const customerName = existingUser.firstName 
    ? `${existingUser.firstName}${existingUser.lastName ? ' ' + existingUser.lastName : ''}`
    : existingUser.email.split('@')[0] || 'Customer';

  // Send account deletion email (non-blocking)
  if (existingUser.email) {
    try {
      await sendAccountDeletedEmail(existingUser.email, {
        customerName,
        hasSubscription,
        hasLifetimePlan
      });
    } catch (emailError) {
      console.error('Failed to send account deletion email:', emailError);
      // Don't fail the account deletion if email fails
    }
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