"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.createOrder = void 0;
const express_async_handler_1 = __importDefault(require("express-async-handler"));
const PetTagOrder_1 = __importDefault(require("../../models/PetTagOrder"));
const stripeService_1 = require("../../utils/stripeService");
exports.createOrder = (0, express_async_handler_1.default)(async (req, res) => {
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
        const existingOrdersCount = await PetTagOrder_1.default.countDocuments({ email: email.toLowerCase() });
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
        const paymentResult = await (0, stripeService_1.createPaymentIntent)({
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
        const order = await PetTagOrder_1.default.create({
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
    }
    catch (error) {
        console.error('Error creating order:', error);
        res.status(500).json({
            message: 'Internal server error while creating order'
        });
    }
});
