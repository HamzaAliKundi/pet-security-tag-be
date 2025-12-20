import { Request, Response } from 'express';
import asyncHandler from 'express-async-handler';
import PetTagOrder from '../../models/PetTagOrder';
import UserPetTagOrder from '../../models/UserPetTagOrder';
import User from '../../models/User';
import Pet from '../../models/Pet';
import Referral from '../../models/Referral';
import { createPaymentIntent, confirmPaymentIntent } from '../../utils/stripeService';
// NOTE: assignQRToPublicOrder import removed - QR codes are now assigned when user scans the tag, not at order confirmation
import { sendOrderConfirmationEmail, sendCredentialsEmail } from '../../utils/emailService';
import bcrypt from 'bcryptjs';
import { env } from '../../config/env';
import { generateReferralCode } from '../../utils/referralCode';
import { checkAndCreateRewardRedemption } from '../../utils/rewardRedemption';

export const createOrder = asyncHandler(async (req: Request, res: Response): Promise<void> => {
  const { email, name, petName, quantity, subscriptionType, tagColor, tagColors, totalCostEuro, phone, shippingAddress, paymentMethodId, termsAccepted } = req.body;

  if (!email || !name || !petName || !quantity || !subscriptionType) {
    res.status(400).json({ 
      message: 'All fields are required: email, name, petName, quantity, subscriptionType' 
    });
    return;
  }

  if (!termsAccepted) {
    res.status(400).json({ 
      message: 'You must accept the Terms and Privacy policies to proceed' 
    });
    return;
  }

  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  if (!emailRegex.test(email)) {
    res.status(400).json({ message: 'Invalid email format' });
    return;
  }

  if (quantity < 1) {
    res.status(400).json({ message: 'Quantity must be at least 1' });
    return;
  }

  if (!['monthly', 'yearly'].includes(subscriptionType)) {
    res.status(400).json({ message: 'Subscription type must be either "monthly" or "yearly"' });
    return;
  }

  try {
    // For public orders, we'll check if the email already has 5 or more orders
    // This is a basic check - in a real scenario, you might want to link this to user accounts
    const existingOrdersCount = await PetTagOrder.countDocuments({ email: email.toLowerCase() });
    if (existingOrdersCount >= 5) {
      res.status(400).json({ 
        message: 'Maximum limit reached. You can only have 5 pet tags per account.',
        error: 'PET_LIMIT_EXCEEDED',
        currentCount: existingOrdersCount,
        maxAllowed: 5
      });
      return;
    }

    // Check if adding this order would exceed the limit
    if (existingOrdersCount + quantity > 5) {
      res.status(400).json({ 
        message: `Cannot add ${quantity} pet tag(s). You currently have ${existingOrdersCount} orders and can only have a maximum of 5 pets per account.`,
        error: 'PET_LIMIT_EXCEEDED',
        currentCount: existingOrdersCount,
        requestedQuantity: quantity,
        maxAllowed: 5
      });
      return;
    }
    // Process tag colors - use tagColors array if provided, otherwise fallback to tagColor or default
    let colorsArray: string[];
    if (tagColors && Array.isArray(tagColors) && tagColors.length > 0) {
      // If tagColors is provided, use it (trim to quantity if longer, pad with 'blue' if shorter)
      if (tagColors.length >= quantity) {
        colorsArray = tagColors.slice(0, quantity);
      } else {
        // If fewer colors than quantity, pad with 'blue'
        colorsArray = [...tagColors, ...Array(quantity - tagColors.length).fill('blue')];
      }
    } else if (tagColor) {
      colorsArray = Array(quantity).fill(tagColor);
    } else {
      colorsArray = Array(quantity).fill('blue');
    }

    // Create Stripe payment intent
    const amountInCents = Math.round((totalCostEuro || 0) * 100); // Convert to cents
    const paymentResult = await createPaymentIntent({
      amount: amountInCents,
      currency: 'eur',
      metadata: {
        userId: email, // Using email as userId for now
        petName,
        quantity: quantity.toString(),
        tagColor: colorsArray.join(',') // Store all colors as comma-separated string in metadata
      }
    });

    if (!paymentResult.success) {
      res.status(400).json({ 
        message: 'Failed to create payment intent: ' + (paymentResult.error || 'Unknown error') 
      });
      return;
    }

    // Create the order with payment intent ID
    const order = await PetTagOrder.create({
      email,
      name,
      petName,
      quantity,
      subscriptionType,
      tagColor: quantity === 1 ? colorsArray[0] : undefined, // Keep for backward compatibility
      tagColors: colorsArray, // Store array of colors
      totalCostEuro,
      phone,
      shippingAddress,
      paymentIntentId: paymentResult.paymentIntentId,
      status: 'pending',
      termsAccepted: termsAccepted || false
    });

    res.status(201).json({
      message: 'Order created successfully',
      status: 201,
      order: {
        _id: order._id,
        email: order.email,
        name: order.name,
        petName: order.petName,
        quantity: order.quantity,
        subscriptionType: order.subscriptionType,
        status: order.status,
        tagColor: order.tagColor,
        totalCostEuro: order.totalCostEuro,
        phone: order.phone,
        shippingAddress: order.shippingAddress,
        paymentIntentId: order.paymentIntentId,
        createdAt: order.createdAt
      },
      payment: {
        clientSecret: paymentResult.clientSecret,
        paymentIntentId: paymentResult.paymentIntentId
      }
    });
  } catch (error) {
    console.error('Error creating order:', error);
    res.status(500).json({ 
      message: 'Internal server error while creating order' 
    });
  }
});

// Generate random password
const generateRandomPassword = (length: number = 12): string => {
  const charset = 'abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789!@#$%^&*';
  let password = '';
  for (let i = 0; i < length; i++) {
    password += charset.charAt(Math.floor(Math.random() * charset.length));
  }
  return password;
};

// Split name into firstName and lastName
const splitName = (name: string): { firstName: string; lastName: string } => {
  const nameParts = name.trim().split(' ');
  const firstName = nameParts[0] || '';
  const lastName = nameParts.slice(1).join(' ') || firstName; // Use firstName as lastName if not provided
  return { firstName, lastName };
};

export const confirmPayment = asyncHandler(async (req: Request, res: Response): Promise<void> => {
  const { orderId } = req.params;
  const { paymentIntentId } = req.body;

  if (!paymentIntentId) {
    res.status(400).json({ message: 'Payment intent ID is required' });
    return;
  }

  // Check if order exists
  const order = await PetTagOrder.findOne({ _id: orderId });
  if (!order) {
    res.status(404).json({ message: 'Order not found' });
    return;
  }

  // Verify payment intent matches the order
  if (order.paymentIntentId !== paymentIntentId) {
    res.status(400).json({ message: 'Payment intent ID does not match the order' });
    return;
  }

  try {
    // Confirm payment with Stripe
    const isPaymentSuccessful = await confirmPaymentIntent(paymentIntentId);
    
    if (isPaymentSuccessful) {
      // Update order status
      order.status = 'paid';
      await order.save();

      // Check if user already exists
      let user = await User.findOne({ email: order.email.toLowerCase() });
      let isNewUser = false;
      let generatedPassword = '';

      if (!user) {
        // Create new user account
        isNewUser = true;
        generatedPassword = generateRandomPassword();
        const salt = await bcrypt.genSalt(env.SALT_ROUNDS);
        const hashedPassword = await bcrypt.hash(generatedPassword, salt);
        
        const { firstName, lastName } = splitName(order.name);
        
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

        // Get referral code from query params if provided
        const referralCodeFromQuery = req.query.referralCode as string;
        let referredByUserId = null;
        if (referralCodeFromQuery) {
          const referrer = await User.findOne({ referralCode: referralCodeFromQuery });
          if (referrer && referrer._id) {
            referredByUserId = referrer._id;
          }
        }
        
        user = await User.create({
          email: order.email.toLowerCase(),
          password: hashedPassword,
          firstName,
          lastName,
          isEmailVerified: true, // Auto-verify the account
          role: 'user',
          status: 'active',
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
                referralCodeUsed: referralCodeFromQuery
              });
            }
          } catch (referralError) {
            console.error('Error processing referral:', referralError);
            // Don't fail order if referral processing fails
          }
        }

        // Send credentials email (non-blocking)
        try {
          await sendCredentialsEmail(user.email, {
            customerName: user.firstName || 'Valued Customer',
            email: user.email,
            password: generatedPassword,
            loginUrl: `${env.FRONTEND_URL}`
          });
        } catch (emailError) {
          console.error('Failed to send credentials email:', emailError);
          // Don't fail the order if email fails
        }
      }

      // Create pet records based on quantity
      // NOTE: QR codes are NOT assigned at this point - they will be assigned when the user scans the tag
      const createdPets = [];
      
      try {
        for (let i = 0; i < order.quantity; i++) {
          // Create pet record for each tag
          const pet = await Pet.create({
            userId: user._id,
            userPetTagOrderId: order._id,
            orderType: 'PetTagOrder',
            petName: order.quantity > 1 ? `${order.petName} #${i + 1}` : order.petName,
            hideName: false,
            age: undefined,
            breed: '',
            medication: '',
            allergies: '',
            notes: ''
          });

          // QR codes will be assigned when the user scans the tag and pays for subscription
          // This allows admin to send any physical tag without worrying about matching QR codes
          
          createdPets.push(pet);
        }

        // Send order confirmation email (non-blocking)
        try {
          await sendOrderConfirmationEmail(user.email, {
            customerName: user.firstName || 'Valued Customer',
            orderNumber: order.paymentIntentId || order._id.toString(),
            petName: order.petName,
            quantity: order.quantity,
            orderDate: new Date().toLocaleDateString('en-GB'),
            totalAmount: order.totalCostEuro || 0
          });
        } catch (emailError) {
          console.error('Failed to send order confirmation email:', emailError);
          // Don't fail the order if email fails
        }

        res.status(200).json({
          message: 'Payment confirmed successfully and account created. QR codes will be assigned when you scan your tags and activate subscriptions.',
          status: 200,
          isNewUser,
          order: {
            _id: order._id,
            email: order.email,
            name: order.name,
            petName: order.petName,
            quantity: order.quantity,
            subscriptionType: order.subscriptionType,
            status: order.status,
            tagColor: order.tagColor,
            tagColors: order.tagColors, // Include tagColors array
            totalCostEuro: order.totalCostEuro,
            phone: order.phone,
            shippingAddress: order.shippingAddress,
            paymentIntentId: order.paymentIntentId,
            createdAt: order.createdAt,
            updatedAt: order.updatedAt
          },
          user: {
            _id: user._id,
            email: user.email,
            firstName: user.firstName,
            lastName: user.lastName,
            isEmailVerified: user.isEmailVerified
          },
          pets: createdPets.map(pet => ({
            _id: pet._id,
            petName: pet.petName,
            hideName: pet.hideName,
            age: pet.age,
            breed: pet.breed,
            medication: pet.medication,
            allergies: pet.allergies,
            notes: pet.notes
          }))
        });
      } catch (petError) {
        console.error('Error creating pet records:', petError);
        
        // Still return success for payment, but log pet creation error
        res.status(200).json({
          message: 'Payment confirmed successfully but failed to create pet records',
          status: 200,
          isNewUser,
          order: {
            _id: order._id,
            email: order.email,
            name: order.name,
            petName: order.petName,
            quantity: order.quantity,
            subscriptionType: order.subscriptionType,
            status: order.status,
            tagColor: order.tagColor,
            totalCostEuro: order.totalCostEuro,
            phone: order.phone,
            shippingAddress: order.shippingAddress,
            paymentIntentId: order.paymentIntentId,
            createdAt: order.createdAt,
            updatedAt: order.updatedAt
          },
          user: {
            _id: user._id,
            email: user.email,
            firstName: user.firstName,
            lastName: user.lastName,
            isEmailVerified: user.isEmailVerified
          },
          pets: createdPets.map(pet => ({
            _id: pet._id,
            petName: pet.petName,
            hideName: pet.hideName,
            age: pet.age,
            breed: pet.breed,
            medication: pet.medication,
            allergies: pet.allergies,
            notes: pet.notes
          }))
        });
      }
    } else {
      // Payment failed
      res.status(400).json({
        message: 'Payment confirmation failed',
        status: 400,
        order: {
          _id: order._id,
          status: order.status
        }
      });
    }
  } catch (error) {
    console.error('Error confirming payment:', error);
    res.status(500).json({
      message: 'Internal server error while confirming payment',
      error: 'Internal server error'
    });
  }
});

// Get latest orders for public display (notification widget)
export const getLatestOrders = asyncHandler(async (req: Request, res: Response): Promise<void> => {
  try {
    const limit = parseInt(req.query.limit as string) || 5;

    // Get latest orders from both collections
    const [userRecentOrders, petRecentOrders] = await Promise.all([
      // UserPetTagOrder - need to populate userId to get name
      UserPetTagOrder.find({ status: 'paid' })
        .sort({ createdAt: -1 })
        .limit(limit)
        .populate('userId', 'firstName lastName')
        .select('userId city country createdAt')
        .lean(),
      // PetTagOrder - has name directly
      PetTagOrder.find({ status: 'paid' })
        .sort({ createdAt: -1 })
        .limit(limit)
        .select('name shippingAddress createdAt')
        .lean()
    ]);

    // Transform and combine orders
    const allOrders = [];

    // Process UserPetTagOrder
    for (const order of userRecentOrders) {
      const user = order.userId as any;
      const name = user ? `${user.firstName || ''} ${user.lastName || ''}`.trim() : 'Customer';
      
      allOrders.push({
        name: name || 'Customer',
        city: order.city || null,
        country: order.country || null,
        createdAt: order.createdAt
      });
    }

    // Process PetTagOrder
    for (const order of petRecentOrders) {
      allOrders.push({
        name: order.name || 'Customer',
        city: order.shippingAddress?.city || null,
        country: order.shippingAddress?.country || null,
        createdAt: order.createdAt
      });
    }

    // Sort all orders by creation time (newest first)
    allOrders.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());

    // Take only the requested limit
    const latestOrders = allOrders.slice(0, limit);

    res.status(200).json({
      message: 'Latest orders retrieved successfully',
      status: 200,
      orders: latestOrders
    });
  } catch (error) {
    console.error('Error getting latest orders:', error);
    res.status(500).json({
      message: 'Failed to get latest orders',
      error: 'Internal server error'
    });
  }
});