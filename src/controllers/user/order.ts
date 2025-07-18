import { Request, Response } from 'express';
import asyncHandler from 'express-async-handler';
import PetTagOrder from '../../models/PetTagOrder';



export const createOrder = asyncHandler(async (req: Request, res: Response): Promise<void> => {
  const { email, name, petName, quantity, subscriptionType, price, phone, shippingAddress } = req.body;

  if (!email || !name || !petName || !quantity || !subscriptionType || !price) {
    res.status(400).json({ 
      message: 'All fields are required: email, name, petName, quantity, subscriptionType, price' 
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

  if (typeof price !== 'number' || price <= 0) {
    res.status(400).json({ message: 'Price must be a positive number' });
    return;
  }

  const order = await PetTagOrder.create({
    email,
    name,
    petName,
    quantity,
    subscriptionType,
    price,
    phone,
    shippingAddress,
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
      price: order.price,
      status: order.status,
      phone: order.phone,
      shippingAddress: order.shippingAddress,
      createdAt: order.createdAt
    }
  });
});