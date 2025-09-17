import { Request, Response } from 'express';
import asyncHandler from 'express-async-handler';
import QRCode from '../../models/QRCode';
import Subscription from '../../models/Subscription';
import Pet from '../../models/Pet';
import User from '../../models/User';
import { createPaymentIntent, createSubscriptionPaymentIntent } from '../../utils/stripeService';

// Scan QR Code - Main entry point
export const scanQRCode = asyncHandler(async (req: Request, res: Response): Promise<void> => {
  try {
    const { code } = req.params;
    
    // Find QR code by code
    const qrCode = await QRCode.findOne({ code })
      .populate('assignedUserId', 'firstName lastName email')
      .populate('assignedPetId', 'petName breed age medication allergies notes hideName');

    if (!qrCode) {
      res.status(404).json({
        message: 'QR code not found',
        error: 'Invalid QR code',
        status: 404
      });
      return;
    }

    // Update scan count and last scanned date
    await QRCode.findByIdAndUpdate(qrCode._id, {
      $inc: { scannedCount: 1 },
      lastScannedAt: new Date()
    });

    // Check if QR is verified and has active subscription
    if (qrCode.hasVerified && qrCode.status === 'verified') {
      // Check for active subscription
      const activeSubscription = await Subscription.findOne({
        qrCodeId: qrCode._id,
        status: 'active',
        endDate: { $gt: new Date() }
      });

      if (activeSubscription) {
        let petId = (qrCode.assignedPetId as any)?._id;
        
        // If no direct pet link, try to find pet by order
        if (!petId && qrCode.assignedOrderId) {
          const pet = await Pet.findOne({ userPetTagOrderId: qrCode.assignedOrderId });
          if (pet) {
            petId = pet._id;
            // Update QR code to link to this pet for future scans
            await QRCode.findByIdAndUpdate(qrCode._id, { assignedPetId: pet._id });
          }
        }
        
        if (petId) {
          // Redirect to public profile page for finder
          res.status(200).json({
            message: 'QR code verified - redirect to pet profile',
            status: 200,
            action: 'redirect_to_profile',
            petId: petId,
            redirectUrl: `/profile/${petId}`
          });
          return;
        }
      }
    }

    // If not verified or no active subscription, redirect to verification flow
    res.status(200).json({
      message: 'QR code needs verification',
      status: 200,
      action: 'redirect_to_verification',
      qrCodeId: qrCode._id,
      code: qrCode.code,
      redirectUrl: `/qr/verify/${qrCode.code}`
    });

  } catch (error) {
    console.error('Error scanning QR code:', error);
    res.status(500).json({
      message: 'Failed to scan QR code',
      error: 'Internal server error'
    });
  }
});

// Get QR verification details for frontend
export const getQRVerificationDetails = asyncHandler(async (req: Request, res: Response): Promise<void> => {
  try {
    const { code } = req.params;
    const currentUserId = (req as any).user?._id; // Get current logged-in user from JWT token
    
    const qrCode = await QRCode.findOne({ code })
      .populate('assignedUserId', 'firstName lastName email')
      .populate('assignedOrderId', 'petName totalCostEuro')
      .populate('assignedPetId', 'petName');

    if (!qrCode) {
      res.status(404).json({
        message: 'QR code not found',
        error: 'Invalid QR code'
      });
      return;
    }

    // Check if already verified
    if (qrCode.hasVerified) {
      const activeSubscription = await Subscription.findOne({
        qrCodeId: qrCode._id,
        status: 'active',
        endDate: { $gt: new Date() }
      });

      res.status(200).json({
        message: 'QR code already verified',
        status: 200,
        isVerified: true,
        hasActiveSubscription: !!activeSubscription,
        qrCode: {
          id: qrCode._id,
          code: qrCode.code,
          status: qrCode.status,
          assignedPetName: (qrCode.assignedPetId as any)?.petName || (qrCode.assignedOrderId as any)?.petName,
          assignedUser: qrCode.assignedUserId
        },
        subscription: activeSubscription
      });
      return;
    }

    // For unverified QR codes, check if any user has active subscription
    let userHasActiveSubscription = false;
    let existingSubscription = null;
    let canAutoVerify = false;
    
    // First check if the QR code is assigned to a user and they have active subscription
    if (qrCode.assignedUserId) {
      existingSubscription = await Subscription.findOne({
        userId: qrCode.assignedUserId,
        status: 'active',
        endDate: { $gt: new Date() }
      });
      userHasActiveSubscription = !!existingSubscription;
      canAutoVerify = userHasActiveSubscription;
    }
    
    // If no assigned user or no active subscription for assigned user,
    // check if current logged-in user has active subscription
    if (!canAutoVerify && currentUserId) {
      const currentUserSubscription = await Subscription.findOne({
        userId: currentUserId,
        status: 'active',
        endDate: { $gt: new Date() }
      });
      
      if (currentUserSubscription) {
        userHasActiveSubscription = true;
        existingSubscription = currentUserSubscription;
        canAutoVerify = true;
      }
    }

    console.log('QR Verification Details Response:', {
      isVerified: false,
      hasActiveSubscription: userHasActiveSubscription,
      canAutoVerify: canAutoVerify,
      currentUserId: currentUserId,
      qrCodeAssignedUserId: qrCode.assignedUserId,
      requiresLogin: !qrCode.assignedUserId && !currentUserId
    });

    res.status(200).json({
      message: 'QR code verification details',
      status: 200,
      isVerified: false,
      hasActiveSubscription: userHasActiveSubscription,
      qrCode: {
        id: qrCode._id,
        code: qrCode.code,
        status: qrCode.status,
        assignedPetName: (qrCode.assignedPetId as any)?.petName || (qrCode.assignedOrderId as any)?.petName,
        assignedUser: qrCode.assignedUserId
      },
      subscription: existingSubscription,
      requiresLogin: !qrCode.assignedUserId && !currentUserId,
      canAutoVerify: canAutoVerify
    });

  } catch (error) {
    console.error('Error getting QR verification details:', error);
    res.status(500).json({
      message: 'Failed to get QR verification details',
      error: 'Internal server error'
    });
  }
});

// Auto-verify QR Code if user has active subscription
export const autoVerifyQRCode = asyncHandler(async (req: Request, res: Response): Promise<void> => {
  try {
    const userId = (req as any).user?._id;
    const { qrCodeId } = req.body;

    if (!userId) {
      res.status(401).json({
        message: 'Authentication required',
        error: 'User not authenticated'
      });
      return;
    }

    // Find QR code
    const qrCode = await QRCode.findById(qrCodeId);
    if (!qrCode) {
      res.status(404).json({
        message: 'QR code not found',
        error: 'Invalid QR code ID'
      });
      return;
    }

    // Check if user has any active subscription
    const existingActiveSubscription = await Subscription.findOne({
      userId,
      status: 'active',
      endDate: { $gt: new Date() }
    });

    if (!existingActiveSubscription) {
      res.status(400).json({
        message: 'No active subscription found',
        error: 'User does not have an active subscription'
      });
      return;
    }

    // Auto-verify the QR code
    qrCode.hasVerified = true;
    qrCode.status = 'verified';
    qrCode.assignedUserId = qrCode.assignedUserId || userId;
    await qrCode.save();

    // Create a new subscription record linking this QR to the user's active subscription
    const newSubscription = await Subscription.create({
      userId,
      qrCodeId: qrCode._id,
      type: existingActiveSubscription.type,
      status: 'active',
      startDate: new Date(),
      endDate: existingActiveSubscription.endDate,
      paymentIntentId: existingActiveSubscription.paymentIntentId,
      amountPaid: 0, // No additional payment required
      currency: existingActiveSubscription.currency,
      autoRenew: existingActiveSubscription.autoRenew
    });

    res.status(200).json({
      message: 'QR code auto-verified with existing subscription',
      status: 200,
      qrCode: {
        id: qrCode._id,
        code: qrCode.code,
        status: qrCode.status,
        hasVerified: qrCode.hasVerified
      },
      subscription: newSubscription,
      existingSubscription: existingActiveSubscription
    });

  } catch (error) {
    console.error('Error auto-verifying QR code:', error);
    res.status(500).json({
      message: 'Failed to auto-verify QR code',
      error: 'Internal server error'
    });
  }
});

// Verify QR Code with subscription
export const verifyQRCodeWithSubscription = asyncHandler(async (req: Request, res: Response): Promise<void> => {
  try {
    const userId = (req as any).user?._id;
    const { qrCodeId, subscriptionType, petId } = req.body;

    if (!userId) {
      res.status(401).json({
        message: 'Authentication required',
        error: 'User not authenticated'
      });
      return;
    }

    if (!['monthly', 'yearly', 'lifetime'].includes(subscriptionType)) {
      res.status(400).json({
        message: 'Invalid subscription type',
        error: 'Subscription type must be monthly, yearly, or lifetime'
      });
      return;
    }

    // Find QR code
    const qrCode = await QRCode.findById(qrCodeId);
    if (!qrCode) {
      res.status(404).json({
        message: 'QR code not found',
        error: 'Invalid QR code ID'
      });
      return;
    }

    // Check if user has ANY existing active subscription (not just for this QR)
    const existingActiveSubscription = await Subscription.findOne({
      userId,
      status: 'active',
      endDate: { $gt: new Date() }
    });

    if (existingActiveSubscription) {
      // Auto-verify if user has any active subscription
      qrCode.hasVerified = true;
      qrCode.status = 'verified';
      qrCode.assignedPetId = petId || qrCode.assignedPetId;
      await qrCode.save();

      // Create a new subscription record linking this QR to the user's active subscription
      const newSubscription = await Subscription.create({
        userId,
        qrCodeId: qrCode._id,
        type: existingActiveSubscription.type,
        status: 'active',
        startDate: new Date(),
        endDate: existingActiveSubscription.endDate, // Use the same end date as existing subscription
        paymentIntentId: existingActiveSubscription.paymentIntentId,
        amountPaid: 0, // No additional payment required
        currency: existingActiveSubscription.currency,
        autoRenew: existingActiveSubscription.autoRenew
      });

      res.status(200).json({
        message: 'QR code verified with existing active subscription',
        status: 200,
        qrCode: {
          id: qrCode._id,
          code: qrCode.code,
          status: qrCode.status,
          hasVerified: qrCode.hasVerified
        },
        subscription: newSubscription,
        existingSubscription: existingActiveSubscription,
        note: 'Tag verified automatically using your existing subscription'
      });
      return;
    }

    // Calculate subscription pricing
    const pricing = {
      monthly: 2.75,
      yearly: 19.99,
      lifetime: 99.00
    };

    const amount = pricing[subscriptionType as keyof typeof pricing];
    const endDate = new Date();
    
    if (subscriptionType === 'monthly') {
      endDate.setMonth(endDate.getMonth() + 1);
    } else if (subscriptionType === 'yearly') {
      endDate.setFullYear(endDate.getFullYear() + 1);
    } else if (subscriptionType === 'lifetime') {
      // Set end date to 100 years from now for lifetime subscription
      endDate.setFullYear(endDate.getFullYear() + 100);
    }

    // Create Stripe payment intent for subscription
    const amountInCents = Math.round(amount * 100);
    const paymentResult = await createSubscriptionPaymentIntent({
      amount: amountInCents,
      currency: 'gbp',
      metadata: {
        userId: userId.toString(),
        subscriptionType,
        petName: (qrCode.assignedPetId as any)?.petName || 'Unknown Pet'
      }
    });

    if (!paymentResult.success) {
      res.status(500).json({
        message: 'Failed to create payment intent',
        error: paymentResult.error
      });
      return;
    }

    res.status(200).json({
      message: 'Subscription payment intent created',
      status: 200,
      payment: {
        paymentIntentId: paymentResult.paymentIntentId,
        clientSecret: paymentResult.clientSecret,
        publishableKey: process.env.STRIPE_PUBLISH_KEY
      },
      subscription: {
        type: subscriptionType,
        amount,
        currency: 'EUR',
        endDate
      },
      qrCode: {
        id: qrCode._id,
        code: qrCode.code
      }
    });

  } catch (error) {
    console.error('Error verifying QR code:', error);
    res.status(500).json({
      message: 'Failed to verify QR code',
      error: 'Internal server error'
    });
  }
});

// Confirm subscription payment
export const confirmSubscriptionPayment = asyncHandler(async (req: Request, res: Response): Promise<void> => {
  try {
    const userId = (req as any).user?._id;
    const { qrCodeId, paymentIntentId, subscriptionType, petId } = req.body;

    if (!userId) {
      res.status(401).json({
        message: 'Authentication required',
        error: 'User not authenticated'
      });
      return;
    }

    // Find QR code
    const qrCode = await QRCode.findById(qrCodeId);
    if (!qrCode) {
      res.status(404).json({
        message: 'QR code not found',
        error: 'Invalid QR code ID'
      });
      return;
    }

    // Verify payment with Stripe (you may need to implement this)
    // For now, we'll assume payment is successful

    // Calculate subscription end date
    const startDate = new Date();
    const endDate = new Date();
    
    if (subscriptionType === 'monthly') {
      endDate.setMonth(endDate.getMonth() + 1);
    } else if (subscriptionType === 'yearly') {
      endDate.setFullYear(endDate.getFullYear() + 1);
    } else if (subscriptionType === 'lifetime') {
      // Set end date to 100 years from now for lifetime subscription
      endDate.setFullYear(endDate.getFullYear() + 100);
    }

    const pricing = {
      monthly: 2.75,
      yearly: 19.99,
      lifetime: 99.00
    };

    // Create subscription record
    const subscription = await Subscription.create({
      userId,
      qrCodeId,
      type: subscriptionType,
      status: 'active',
      startDate,
      endDate,
      paymentIntentId,
      amountPaid: pricing[subscriptionType as keyof typeof pricing],
      currency: 'gbp',
      autoRenew: true
    });

    // Update QR code status
    qrCode.hasVerified = true;
    qrCode.status = 'verified';
    if (petId) {
      qrCode.assignedPetId = petId;
    }
    await qrCode.save();

    res.status(200).json({
      message: 'Subscription activated and QR code verified successfully',
      status: 200,
      qrCode: {
        id: qrCode._id,
        code: qrCode.code,
        status: qrCode.status,
        hasVerified: qrCode.hasVerified
      },
      subscription: {
        id: subscription._id,
        type: subscription.type,
        status: subscription.status,
        startDate: subscription.startDate,
        endDate: subscription.endDate,
        amountPaid: subscription.amountPaid
      }
    });

  } catch (error) {
    console.error('Error confirming subscription payment:', error);
    res.status(500).json({
      message: 'Failed to confirm subscription payment',
      error: 'Internal server error'
    });
  }
});

// Get pet profile for public view (when QR is scanned by finder)
export const getPetProfileByQR = asyncHandler(async (req: Request, res: Response): Promise<void> => {
  try {
    const { petId } = req.params;
    
    const pet = await Pet.findById(petId)
      .populate('userId', 'firstName lastName email phone street city state zipCode country')
      .populate('userPetTagOrderId', 'totalCostEuro tagColor');

    if (!pet) {
      res.status(404).json({
        message: 'Pet not found',
        error: 'Pet does not exist'
      });
      return;
    }

    // Check if pet has verified QR
    const qrCode = await QRCode.findOne({
      assignedPetId: petId,
      hasVerified: true,
      status: 'verified'
    });

    if (!qrCode) {
      res.status(404).json({
        message: 'Pet profile not accessible',
        error: 'QR code not verified or subscription inactive'
      });
      return;
    }

    // Check active subscription
    const activeSubscription = await Subscription.findOne({
      qrCodeId: qrCode._id,
      status: 'active',
      endDate: { $gt: new Date() }
    });

    if (!activeSubscription) {
      res.status(403).json({
        message: 'Pet profile not accessible',
        error: 'Subscription expired'
      });
      return;
    }

    const user = pet.userId as any;
    const order = pet.userPetTagOrderId as any;

    // Transform data for public profile
    const petProfile = {
      petName: pet.hideName ? 'Pet' : pet.petName,
      breed: pet.breed || 'Mixed Breed',
      age: pet.age,
      medication: pet.medication || 'None',
      allergies: pet.allergies || 'None',
      notes: pet.notes || 'None',
      tagColor: order?.tagColor || 'blue',
      owner: {
        name: `${user.firstName} ${user.lastName}`,
        // Hide full address for privacy
        address: {
          street: user.street ? `***${user.street.slice(-4)}` : 'Hidden',
          city: user.city || 'Unknown',
          state: user.state || 'Unknown',
          zipCode: user.zipCode || 'Unknown',
          country: user.country || 'UK'
        },
        // Don't expose full contact details directly
        hasContactInfo: !!(user.email || user.phone)
      }
    };

    res.status(200).json({
      message: 'Pet profile retrieved successfully',
      status: 200,
      pet: petProfile,
      isPublicView: true,
      lastScanned: qrCode.lastScannedAt,
      scannedCount: qrCode.scannedCount
    });

  } catch (error) {
    console.error('Error getting pet profile:', error);
    res.status(500).json({
      message: 'Failed to get pet profile',
      error: 'Internal server error'
    });
  }
});

