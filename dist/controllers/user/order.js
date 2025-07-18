"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.createOrder = void 0;
const express_async_handler_1 = __importDefault(require("express-async-handler"));
const PetTagOrder_1 = __importDefault(require("../../models/PetTagOrder"));
exports.createOrder = (0, express_async_handler_1.default)(async (req, res) => {
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
    const order = await PetTagOrder_1.default.create({
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
