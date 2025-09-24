import { Request, Response } from 'express';
import asyncHandler from 'express-async-handler';
import PetTagOrder from '../../models/PetTagOrder';
import User from '../../models/User';
import Pet from '../../models/Pet';
import { createPaymentIntent, confirmPaymentIntent } from '../../utils/stripeService';
import { assignQRToPublicOrder } from '../qrcode/qrManagement';
import { sendOrderConfirmationEmail, sendCredentialsEmail } from '../../utils/emailService';
import bcrypt from 'bcryptjs';
import { env } from '../../config/env';

export const createOrder = asyncHandler(async (req: Request, res: Response): Promise<void> => {
  const { email, name, petName, quantity, subscriptionType, tagColor, totalCostEuro, phone, shippingAddress, paymentMethodId } = req.body;

  if (!email || !name || !petName || !quantity || !subscriptionType) {
    res.status(400).json({ 
      message: 'All fields are required: email, name, petName, quantity, subscriptionType' 
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
    // Create Stripe payment intent
    const amountInCents = Math.round((totalCostEuro || 0) * 100); // Convert to cents
    const paymentResult = await createPaymentIntent({
      amount: amountInCents,
      currency: 'eur',
      metadata: {
        userId: email, // Using email as userId for now
        petName,
        quantity: quantity.toString(),
        tagColor: tagColor || 'blue'
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
      tagColor,
      totalCostEuro,
      phone,
      shippingAddress,
      paymentIntentId: paymentResult.paymentIntentId,
      status: 'pending'
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
  const lastName = nameParts.slice(1).join(' ') || '';
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
        
        user = await User.create({
          email: order.email.toLowerCase(),
          password: hashedPassword,
          firstName,
          lastName,
          isEmailVerified: true, // Auto-verify the account
          role: 'user',
          status: 'active'
        });

        // Send credentials email (non-blocking)
        try {
          await sendCredentialsEmail(user.email, {
            customerName: user.firstName || 'Valued Customer',
            email: user.email,
            password: generatedPassword,
            loginUrl: `${env.FRONTEND_URL}/login`
          });
        } catch (emailError) {
          console.error('Failed to send credentials email:', emailError);
          // Don't fail the order if email fails
        }
      }

      // Create pet records based on quantity
      const createdPets = [];
      const assignedQRCodes = [];
      
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

          // Assign QR code to this pet
          const qrCodeId = await assignQRToPublicOrder(order._id.toString(), user._id.toString());
          
          // Link the QR code to the pet
          if (qrCodeId) {
            const QRCodeModel = (await import('../../models/QRCode')).default;
            await QRCodeModel.findByIdAndUpdate(qrCodeId, {
              assignedPetId: pet._id
            });
            
            createdPets.push(pet);
            assignedQRCodes.push(qrCodeId);
          }
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
          message: 'Payment confirmed successfully and account created',
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
          })),
          qrCodesAssigned: assignedQRCodes.length,
          qrCodeIds: assignedQRCodes
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
          })),
          qrCodesAssigned: assignedQRCodes.length,
          qrCodeIds: assignedQRCodes
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