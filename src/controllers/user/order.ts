import { Request, Response } from 'express';
import asyncHandler from 'express-async-handler';
import PetTagOrder from '../../models/PetTagOrder';
import { createPaymentIntent } from '../../utils/stripeService';

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