import { Request, Response } from 'express';
import asyncHandler from 'express-async-handler';
import UserPetTagOrder from '../../models/UserPetTagOrder';
import Pet from '../../models/Pet';
import QRCode from '../../models/QRCode';
import { createPaymentIntent, confirmPaymentIntent } from '../../utils/stripeService';
import { assignQRToOrder } from '../qrcode/qrManagement';
import { sendOrderConfirmationEmail } from '../../utils/emailService';
import User from '../../models/User';

// Get user's pet count for limit validation
export const getUserPetCount = asyncHandler(async (req: Request, res: Response): Promise<void> => {
  const userId = (req as any).user?._id;

  try {
    const petCount = await Pet.countDocuments({ userId });
    const maxAllowed = 5;
    const canOrderMore = petCount < maxAllowed;
    const remainingSlots = Math.max(0, maxAllowed - petCount);

    res.status(200).json({
      message: 'Pet count retrieved successfully',
      status: 200,
      data: {
        currentCount: petCount,
        maxAllowed,
        canOrderMore,
        remainingSlots
      }
    });
  } catch (error) {
    console.error('Error getting pet count:', error);
    res.status(500).json({
      message: 'Failed to get pet count',
      error: 'Internal server error'
    });
  }
});

// Create pet tag order (Private - requires authentication)
export const createUserPetTagOrder = asyncHandler(async (req: Request, res: Response): Promise<void> => {
  const userId = (req as any).user?._id;
  const { 
    quantity, 
    petName, 
    totalCostEuro, 
    tagColor, 
    phone, 
    street, 
    city, 
    state, 
    zipCode, 
    country,
    isReplacement = false
  } = req.body;

  // Validate required fields
  if (!quantity || !petName || !totalCostEuro || !tagColor || !phone || !street || !city || !state || !zipCode || !country) {
    res.status(400).json({ 
      message: 'All fields are required: quantity, petName, totalCostEuro, tagColor, phone, street, city, state, zipCode, country' 
    });
    return;
  }

  // Validate quantity
  if (quantity < 1) {
    res.status(400).json({ message: 'Quantity must be at least 1' });
    return;
  }

  // Validate total cost
  if (typeof totalCostEuro !== 'number' || totalCostEuro <= 0) {
    res.status(400).json({ message: 'Total cost must be a positive number' });
    return;
  }

  // Validate tag color
  if (typeof tagColor !== 'string' || tagColor.trim().length === 0) {
    res.status(400).json({ message: 'Tag color is required' });
    return;
  }

  // Validate phone number
  if (typeof phone !== 'string' || phone.trim().length === 0) {
    res.status(400).json({ message: 'Phone number is required' });
    return;
  }

  // Validate address fields
  if (!street.trim() || !city.trim() || !state.trim() || !zipCode.trim() || !country.trim()) {
    res.status(400).json({ message: 'All address fields are required' });
    return;
  }

  try {
    // Skip pet limit checks for replacement orders
    if (!isReplacement) {
      // Check if user already has 5 or more pets
      const existingPetsCount = await Pet.countDocuments({ userId });
      if (existingPetsCount >= 5) {
        res.status(400).json({ 
          message: 'Maximum limit reached. You can only have 5 pet tags per account.',
          error: 'PET_LIMIT_EXCEEDED',
          currentCount: existingPetsCount,
          maxAllowed: 5
        });
        return;
      }

      // Check if adding this order would exceed the limit
      if (existingPetsCount + quantity > 5) {
        res.status(400).json({ 
          message: `Cannot add ${quantity} pet tag(s). You currently have ${existingPetsCount} pets and can only have a maximum of 5 pets per account.`,
          error: 'PET_LIMIT_EXCEEDED',
          currentCount: existingPetsCount,
          requestedQuantity: quantity,
          maxAllowed: 5
        });
        return;
      }
    }
    // Create Stripe payment intent
    const amountInCents = Math.round(totalCostEuro * 100); // Convert euros to cents
    const paymentResult = await createPaymentIntent({
      amount: amountInCents,
      currency: 'eur',
      metadata: {
        userId: userId.toString(),
        petName: petName.trim(),
        quantity,
        tagColor: tagColor.trim(),
      },
    });

    if (!paymentResult.success) {
      res.status(500).json({ 
        message: 'Failed to create payment intent',
        error: paymentResult.error 
      });
      return;
    }

    // Create the order with payment information
    const order = await UserPetTagOrder.create({
      userId,
      quantity,
      petName: petName.trim(),
      totalCostEuro,
      tagColor: tagColor.trim(),
      phone: phone.trim(),
      street: street.trim(),
      city: city.trim(),
      state: state.trim(),
      zipCode: zipCode.trim(),
      country: country.trim(),
      status: 'pending',
      paymentIntentId: paymentResult.paymentIntentId,
      paymentStatus: 'pending',
      isReplacement: isReplacement
    });

    res.status(201).json({
      message: 'Pet tag order created successfully. Payment intent created.',
      status: 201,
      order: {
        _id: order._id,
        petName: order.petName,
        quantity: order.quantity,
        totalCostEuro: order.totalCostEuro,
        tagColor: order.tagColor,
        phone: order.phone,
        street: order.street,
        city: order.city,
        state: order.state,
        zipCode: order.zipCode,
        country: order.country,
        status: order.status,
        paymentStatus: order.paymentStatus,
        paymentIntentId: order.paymentIntentId,
        createdAt: order.createdAt
      },
      payment: {
        paymentIntentId: paymentResult.paymentIntentId,
        clientSecret: paymentResult.clientSecret,
        publishableKey: process.env.STRIPE_PUBLISH_KEY
      }
    });
  } catch (error) {
    console.error('Error creating order with payment:', error);
    res.status(500).json({ 
      message: 'Failed to create order',
      error: 'Internal server error'
    });
  }
});

// Confirm payment and update order status (Private - requires authentication)
export const confirmPayment = asyncHandler(async (req: Request, res: Response): Promise<void> => {
  const userId = (req as any).user?._id;
  const { orderId } = req.params;
  const { paymentIntentId } = req.body;

  if (!paymentIntentId) {
    res.status(400).json({ message: 'Payment intent ID is required' });
    return;
  }

  // Check if order exists and belongs to user
  const order = await UserPetTagOrder.findOne({ _id: orderId, userId });
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
      order.paymentStatus = 'succeeded';
      order.status = 'paid';
      await order.save();

      // Handle replacement orders differently
      if (order.isReplacement) {
        // For replacement orders, find the existing pet and revoke its QR code
        const existingPet = await Pet.findOne({ 
          userId: order.userId, 
          petName: order.petName 
        });

        if (existingPet) {
          // Revoke the existing QR code
          const QRCodeModel = (await import('../../models/QRCode')).default;
          await QRCodeModel.findOneAndUpdate(
            { assignedPetId: existingPet._id },
            { 
              status: 'revoked',
              revokedAt: new Date(),
              revokedReason: 'replacement_order'
            }
          );

          // Assign new QR code to the existing pet
          const qrCodeId = await assignQRToOrder(order._id.toString());
          
          if (qrCodeId) {
            await QRCodeModel.findByIdAndUpdate(qrCodeId, {
              assignedPetId: existingPet._id
            });
          }

          // Update the existing pet's order reference to the new replacement order
          existingPet.userPetTagOrderId = order._id;
          existingPet.orderType = 'UserPetTagOrder';
          await existingPet.save();

          res.status(200).json({
            message: 'Replacement order confirmed successfully. Existing QR code revoked and new QR code assigned.',
            status: 200,
            order: {
              _id: order._id,
              petName: order.petName,
              quantity: order.quantity,
              totalCostEuro: order.totalCostEuro,
              tagColor: order.tagColor,
              phone: order.phone,
              street: order.street,
              city: order.city,
              state: order.state,
              zipCode: order.zipCode,
              country: order.country,
              status: order.status,
              paymentStatus: order.paymentStatus,
              paymentIntentId: order.paymentIntentId,
              createdAt: order.createdAt,
              updatedAt: order.updatedAt,
              isReplacement: order.isReplacement
            },
            pet: {
              _id: existingPet._id,
              petName: existingPet.petName,
              hideName: existingPet.hideName,
              age: existingPet.age,
              breed: existingPet.breed,
              medication: existingPet.medication,
              allergies: existingPet.allergies,
              notes: existingPet.notes
            }
          });
          return;
        } else {
          // If no existing pet found, return error
          res.status(404).json({
            message: 'No existing pet found for replacement order',
            status: 404
          });
          return;
        }
      }

      // Create pet record automatically when payment succeeds (for new orders)
      try {
        const pet = await Pet.create({
          userId: order.userId,
          userPetTagOrderId: order._id,
          orderType: 'UserPetTagOrder',
          petName: order.petName,
          hideName: false,
          age: undefined,
          breed: '',
          medication: '',
          allergies: '',
          notes: ''
        });

        // Assign QR code to this order
        const qrCodeId = await assignQRToOrder(order._id.toString());
        
        // Link the QR code to the pet
        if (qrCodeId) {
          const QRCodeModel = (await import('../../models/QRCode')).default;
          await QRCodeModel.findByIdAndUpdate(qrCodeId, {
            assignedPetId: pet._id
          });
        }

        // Send order confirmation email (non-blocking)
        try {
          const user = await User.findById(userId);
          if (user && user.email) {
            await sendOrderConfirmationEmail(user.email, {
              customerName: user.firstName || 'Valued Customer',
              orderNumber: order.paymentIntentId || order._id.toString(),
              petName: order.petName,
              quantity: order.quantity,
              orderDate: new Date().toLocaleDateString('en-GB'),
              totalAmount: order.totalCostEuro
            });
          }
        } catch (emailError) {
          console.error('Failed to send order confirmation email:', emailError);
          // Don't fail the order if email fails
        }

        res.status(200).json({
          message: 'Payment confirmed successfully and pet record created',
          status: 200,
          order: {
            _id: order._id,
            petName: order.petName,
            quantity: order.quantity,
            totalCostEuro: order.totalCostEuro,
            tagColor: order.tagColor,
            phone: order.phone,
            street: order.street,
            city: order.city,
            state: order.state,
            zipCode: order.zipCode,
            country: order.country,
            status: order.status,
            paymentStatus: order.paymentStatus,
            paymentIntentId: order.paymentIntentId,
            createdAt: order.createdAt,
            updatedAt: order.updatedAt
          },
          pet: {
            _id: pet._id,
            petName: pet.petName,
            hideName: pet.hideName,
            age: pet.age,
            breed: pet.breed,
            medication: pet.medication,
            allergies: pet.allergies,
            notes: pet.notes
          },
          qrCodeAssigned: !!qrCodeId,
          qrCodeId: qrCodeId
        });
      } catch (petError) {
        console.error('Error creating pet record:', petError);
        
        // Try to assign QR code even if pet creation failed
        const qrCodeId = await assignQRToOrder(order._id.toString());
        
        // Note: Can't link to pet since pet creation failed
        
        // Still return success for payment, but log pet creation error
        res.status(200).json({
          message: 'Payment confirmed successfully but failed to create pet record',
          status: 200,
          order: {
            _id: order._id,
            petName: order.petName,
            quantity: order.quantity,
            totalCostEuro: order.totalCostEuro,
            tagColor: order.tagColor,
            phone: order.phone,
            street: order.street,
            city: order.city,
            state: order.state,
            zipCode: order.zipCode,
            country: order.country,
            status: order.status,
            paymentStatus: order.paymentStatus,
            paymentIntentId: order.paymentIntentId,
            createdAt: order.createdAt,
            updatedAt: order.updatedAt
          },
          qrCodeAssigned: !!qrCodeId,
          qrCodeId: qrCodeId
        });
      }
    } else {
      // Payment failed
      order.paymentStatus = 'failed';
      await order.save();

      res.status(400).json({
        message: 'Payment confirmation failed',
        status: 400,
        order: {
          _id: order._id,
          paymentStatus: order.paymentStatus,
          status: order.status
        }
      });
    }
  } catch (error) {
    console.error('Error confirming payment:', error);
    res.status(500).json({ 
      message: 'Failed to confirm payment',
      error: 'Internal server error'
    });
  }
});

// Get user's pet tag orders (Private - requires authentication)
export const getUserPetTagOrders = asyncHandler(async (req: Request, res: Response): Promise<void> => {
  const userId = (req as any).user?._id;
  const { page = 1, limit = 10, status } = req.query;

  const query: any = { userId };
  if (status && ['pending', 'paid', 'shipped', 'delivered', 'cancelled'].includes(status as string)) {
    query.status = status;
  }

  const skip = (Number(page) - 1) * Number(limit);
  
  const orders = await UserPetTagOrder.find(query)
    .sort({ createdAt: -1 })
    .skip(skip)
    .limit(Number(limit))
    .select('-__v');

  const total = await UserPetTagOrder.countDocuments(query);

  res.status(200).json({
    message: 'Orders retrieved successfully',
    status: 200,
    orders,
    pagination: {
      currentPage: Number(page),
      totalPages: Math.ceil(total / Number(limit)),
      totalOrders: total,
      hasNextPage: skip + orders.length < total,
      hasPrevPage: Number(page) > 1
    }
  });
});

// Get single user order by ID (Private - requires authentication)
export const getUserPetTagOrder = asyncHandler(async (req: Request, res: Response): Promise<void> => {
  const userId = (req as any).user?._id;
  const { orderId } = req.params;

  const order = await UserPetTagOrder.findOne({ _id: orderId, userId });
  
  if (!order) {
    res.status(404).json({ message: 'Order not found' });
    return;
  }

  res.status(200).json({
    message: 'Order retrieved successfully',
    status: 200,
    order: {
      _id: order._id,
      petName: order.petName,
      quantity: order.quantity,
      totalCostEuro: order.totalCostEuro,
      tagColor: order.tagColor,
      phone: order.phone,
      street: order.street,
      city: order.city,
      state: order.state,
      zipCode: order.zipCode,
      country: order.country,
      status: order.status,
      paymentStatus: order.paymentStatus,
      paymentIntentId: order.paymentIntentId,
      createdAt: order.createdAt,
      updatedAt: order.updatedAt
    }
  });
});

// Update user order (Private - requires authentication)
export const updateUserPetTagOrder = asyncHandler(async (req: Request, res: Response): Promise<void> => {
  const userId = (req as any).user?._id;
  const { orderId } = req.params;
  const { 
    quantity, 
    petName, 
    totalCostEuro, 
    tagColor, 
    phone, 
    street, 
    city, 
    state, 
    zipCode, 
    country 
  } = req.body;

  // Check if order exists and belongs to user
  const existingOrder = await UserPetTagOrder.findOne({ _id: orderId, userId });
  if (!existingOrder) {
    res.status(404).json({ message: 'Order not found' });
    return;
  }

  // Only allow updates if order is still pending
  if (existingOrder.status !== 'pending') {
    res.status(400).json({ message: 'Cannot update order that is not pending' });
    return;
  }

  // Validate required fields
  if (!quantity || !petName || !totalCostEuro || !tagColor || !phone || !street || !city || !state || !zipCode || !country) {
    res.status(400).json({ 
      message: 'All fields are required: quantity, petName, totalCostEuro, tagColor, phone, street, city, state, zipCode, country' 
    });
    return;
  }

  // Validate quantity
  if (quantity < 1) {
    res.status(400).json({ message: 'Quantity must be at least 1' });
    return;
  }

  // Validate total cost
  if (typeof totalCostEuro !== 'number' || totalCostEuro <= 0) {
    res.status(400).json({ message: 'Total cost must be a positive number' });
    return;
  }

  // Validate tag color
  if (typeof tagColor !== 'string' || tagColor.trim().length === 0) {
    res.status(400).json({ message: 'Tag color is required' });
    return;
  }

  // Validate phone number
  if (typeof phone !== 'string' || phone.trim().length === 0) {
    res.status(400).json({ message: 'Phone number is required' });
    return;
  }

  // Validate address fields
  if (!street.trim() || !city.trim() || !state.trim() || !zipCode.trim() || !country.trim()) {
    res.status(400).json({ message: 'All address fields are required' });
    return;
  }

  const updatedOrder = await UserPetTagOrder.findByIdAndUpdate(
    orderId,
    {
      quantity,
      petName: petName.trim(),
      totalCostEuro,
      tagColor: tagColor.trim(),
      phone: phone.trim(),
      street: street.trim(),
      city: city.trim(),
      state: state.trim(),
      zipCode: zipCode.trim(),
      country: country.trim()
    },
    { 
      new: true,
      runValidators: true
    }
  ).select('-__v');

  if (!updatedOrder) {
    res.status(404).json({ message: 'Order not found' });
    return;
  }

  res.status(200).json({
    message: 'Order updated successfully',
    status: 200,
    order: {
      _id: updatedOrder._id,
      petName: updatedOrder.petName,
      quantity: updatedOrder.quantity,
      totalCostEuro: updatedOrder.totalCostEuro,
      tagColor: updatedOrder.tagColor,
      phone: updatedOrder.phone,
      street: updatedOrder.street,
      city: updatedOrder.city,
      state: updatedOrder.state,
      zipCode: updatedOrder.zipCode,
      country: updatedOrder.country,
      status: updatedOrder.status,
      paymentStatus: updatedOrder.paymentStatus,
      paymentIntentId: updatedOrder.paymentIntentId,
      createdAt: updatedOrder.createdAt,
      updatedAt: updatedOrder.updatedAt
    }
  });
});

// Create replacement order for existing pet (Private - requires authentication)
export const createReplacementOrder = asyncHandler(async (req: Request, res: Response): Promise<void> => {
  const userId = (req as any).user?._id;
  const { petId } = req.params;
  const { 
    tagColor, 
    phone, 
    street, 
    city, 
    state, 
    zipCode, 
    country 
  } = req.body;

  // Validate required fields
  if (!tagColor || !phone || !street || !city || !state || !zipCode || !country) {
    res.status(400).json({ 
      message: 'All fields are required: tagColor, phone, street, city, state, zipCode, country' 
    });
    return;
  }

  try {
    // Find the existing pet
    const existingPet = await Pet.findOne({ _id: petId, userId });
    if (!existingPet) {
      res.status(404).json({ 
        message: 'Pet not found or does not belong to you' 
      });
      return;
    }

    // Fixed pricing for replacement: €2.95 (shipping only)
    const totalCostEuro = 2.95;

    // Create Stripe payment intent
    const amountInCents = Math.round(totalCostEuro * 100); // Convert euros to cents
    const paymentResult = await createPaymentIntent({
      amount: amountInCents,
      currency: 'eur',
      metadata: {
        userId: userId.toString(),
        petName: existingPet.petName,
        quantity: 1,
        tagColor: tagColor.trim(),
      },
    });

    if (!paymentResult.success) {
      res.status(500).json({ 
        message: 'Failed to create payment intent',
        error: paymentResult.error 
      });
      return;
    }

    // Create the replacement order
    const order = await UserPetTagOrder.create({
      userId,
      quantity: 1,
      petName: existingPet.petName,
      totalCostEuro,
      tagColor: tagColor.trim(),
      phone: phone.trim(),
      street: street.trim(),
      city: city.trim(),
      state: state.trim(),
      zipCode: zipCode.trim(),
      country: country.trim(),
      status: 'pending',
      paymentIntentId: paymentResult.paymentIntentId,
      paymentStatus: 'pending',
      isReplacement: true
    });

    res.status(201).json({
      message: 'Replacement order created successfully. Payment intent created.',
      status: 201,
      order: {
        _id: order._id,
        petName: order.petName,
        quantity: order.quantity,
        totalCostEuro: order.totalCostEuro,
        tagColor: order.tagColor,
        phone: order.phone,
        street: order.street,
        city: order.city,
        state: order.state,
        zipCode: order.zipCode,
        country: order.country,
        status: order.status,
        paymentStatus: order.paymentStatus,
        paymentIntentId: order.paymentIntentId,
        createdAt: order.createdAt,
        isReplacement: order.isReplacement
      },
      payment: {
        paymentIntentId: paymentResult.paymentIntentId,
        clientSecret: paymentResult.clientSecret,
        publishableKey: process.env.STRIPE_PUBLISH_KEY
      },
      pet: {
        _id: existingPet._id,
        petName: existingPet.petName
      }
    });
  } catch (error) {
    console.error('Error creating replacement order:', error);
    res.status(500).json({ 
      message: 'Failed to create replacement order',
      error: 'Internal server error'
    });
  }
});

// Confirm replacement order payment (Private - requires authentication)
export const confirmReplacementPayment = asyncHandler(async (req: Request, res: Response): Promise<void> => {
  const userId = (req as any).user?._id;
  const { orderId } = req.params;
  const { paymentIntentId, petId } = req.body;

  if (!paymentIntentId || !petId) {
    res.status(400).json({ message: 'Payment intent ID and pet ID are required' });
    return;
  }

  // Check if order exists and belongs to user
  const order = await UserPetTagOrder.findOne({ _id: orderId, userId, isReplacement: true });
  if (!order) {
    res.status(404).json({ message: 'Replacement order not found' });
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
      order.paymentStatus = 'succeeded';
      order.status = 'paid';
      await order.save();

      // Find the existing pet
      const existingPet = await Pet.findOne({ _id: petId, userId });
      if (!existingPet) {
        res.status(404).json({ message: 'Pet not found' });
        return;
      }

      // Get the old QR code ID before revoking
      const oldQRCode = await QRCode.findOne({ assignedPetId: existingPet._id });
      const oldQRCodeId = oldQRCode?._id?.toString();

      console.log('Old QR Code found:', oldQRCodeId);

      // First, find a NEW available QR code (different from the old one)
      const newAvailableQR = await QRCode.findOne({
        hasGiven: false,
        status: 'unassigned',
        _id: { $ne: oldQRCodeId } // Make sure it's NOT the old QR code
      });

      if (!newAvailableQR) {
        console.error('No new available QR codes found for replacement');
        res.status(400).json({ 
          message: 'No available QR codes found for replacement order. Please contact support.' 
        });
        return;
      }

      console.log('New QR Code found:', newAvailableQR._id);

      // Now revoke the old QR code
      await QRCode.findByIdAndUpdate(oldQRCodeId, {
        status: 'unassigned',
        assignedPetId: null,
        assignedOrderId: null,
        hasGiven: false,
        hasVerified: false
      });

      console.log('Old QR Code revoked:', oldQRCodeId);

      // Assign the new QR code to the replacement order (same as new order - not verified yet)
      newAvailableQR.hasGiven = true;
      newAvailableQR.assignedUserId = order.userId as any;
      newAvailableQR.assignedOrderId = order._id as any;
      newAvailableQR.assignedPetId = existingPet._id as any;
      newAvailableQR.status = 'assigned'; // Initial status, not verified yet
      newAvailableQR.hasVerified = false; // User needs to verify like a new tag
      await newAvailableQR.save();

      console.log('New QR Code assigned to pet:', newAvailableQR._id, 'Status:', newAvailableQR.status, 'Verified:', newAvailableQR.hasVerified);

      // Update the existing pet's order reference to the new replacement order
      existingPet.userPetTagOrderId = order._id;
      await existingPet.save();

      res.status(200).json({
        message: 'Replacement order confirmed successfully. Old QR code revoked and new QR code assigned.',
        status: 200,
        order: {
          _id: order._id,
          petName: order.petName,
          quantity: order.quantity,
          totalCostEuro: order.totalCostEuro,
          tagColor: order.tagColor,
          phone: order.phone,
          street: order.street,
          city: order.city,
          state: order.state,
          zipCode: order.zipCode,
          country: order.country,
          status: order.status,
          paymentStatus: order.paymentStatus,
          paymentIntentId: order.paymentIntentId,
          createdAt: order.createdAt,
          updatedAt: order.updatedAt,
          isReplacement: order.isReplacement
        },
        pet: {
          _id: existingPet._id,
          petName: existingPet.petName,
          hideName: existingPet.hideName,
          age: existingPet.age,
          breed: existingPet.breed,
          medication: existingPet.medication,
          allergies: existingPet.allergies,
          notes: existingPet.notes
        }
      });
    } else {
      order.paymentStatus = 'failed';
      await order.save();
      res.status(400).json({ message: 'Payment confirmation failed' });
    }
  } catch (error) {
    console.error('Error confirming replacement payment:', error);
    res.status(500).json({ 
      message: 'Failed to confirm payment',
      error: 'Internal server error'
    });
  }
});
