"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.updateUserPetTagOrder = exports.getUserPetTagOrder = exports.getUserPetTagOrders = exports.confirmPayment = exports.createUserPetTagOrder = void 0;
const express_async_handler_1 = __importDefault(require("express-async-handler"));
const UserPetTagOrder_1 = __importDefault(require("../../models/UserPetTagOrder"));
const Pet_1 = __importDefault(require("../../models/Pet"));
const stripeService_1 = require("../../utils/stripeService");
// Create pet tag order (Private - requires authentication)
exports.createUserPetTagOrder = (0, express_async_handler_1.default)(async (req, res) => {
    var _a;
    const userId = (_a = req.user) === null || _a === void 0 ? void 0 : _a._id;
    const { quantity, petName, totalCostEuro, tagColor, phone, street, city, state, zipCode, country } = req.body;
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
        // Create Stripe payment intent
        const amountInCents = Math.round(totalCostEuro * 100); // Convert euros to cents
        const paymentResult = await (0, stripeService_1.createPaymentIntent)({
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
        const order = await UserPetTagOrder_1.default.create({
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
            paymentStatus: 'pending'
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
    }
    catch (error) {
        console.error('Error creating order with payment:', error);
        res.status(500).json({
            message: 'Failed to create order',
            error: 'Internal server error'
        });
    }
});
// Confirm payment and update order status (Private - requires authentication)
exports.confirmPayment = (0, express_async_handler_1.default)(async (req, res) => {
    var _a;
    const userId = (_a = req.user) === null || _a === void 0 ? void 0 : _a._id;
    const { orderId } = req.params;
    const { paymentIntentId } = req.body;
    if (!paymentIntentId) {
        res.status(400).json({ message: 'Payment intent ID is required' });
        return;
    }
    // Check if order exists and belongs to user
    const order = await UserPetTagOrder_1.default.findOne({ _id: orderId, userId });
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
        const isPaymentSuccessful = await (0, stripeService_1.confirmPaymentIntent)(paymentIntentId);
        if (isPaymentSuccessful) {
            // Update order status
            order.paymentStatus = 'succeeded';
            order.status = 'paid';
            await order.save();
            // Create pet record automatically when payment succeeds
            try {
                const pet = await Pet_1.default.create({
                    userId: order.userId,
                    userPetTagOrderId: order._id,
                    petName: order.petName,
                    hideName: false,
                    age: undefined,
                    breed: '',
                    medication: '',
                    allergies: '',
                    notes: ''
                });
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
                    }
                });
            }
            catch (petError) {
                console.error('Error creating pet record:', petError);
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
                    }
                });
            }
        }
        else {
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
    }
    catch (error) {
        console.error('Error confirming payment:', error);
        res.status(500).json({
            message: 'Failed to confirm payment',
            error: 'Internal server error'
        });
    }
});
// Get user's pet tag orders (Private - requires authentication)
exports.getUserPetTagOrders = (0, express_async_handler_1.default)(async (req, res) => {
    var _a;
    const userId = (_a = req.user) === null || _a === void 0 ? void 0 : _a._id;
    const { page = 1, limit = 10, status } = req.query;
    const query = { userId };
    if (status && ['pending', 'paid', 'shipped', 'delivered', 'cancelled'].includes(status)) {
        query.status = status;
    }
    const skip = (Number(page) - 1) * Number(limit);
    const orders = await UserPetTagOrder_1.default.find(query)
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(Number(limit))
        .select('-__v');
    const total = await UserPetTagOrder_1.default.countDocuments(query);
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
exports.getUserPetTagOrder = (0, express_async_handler_1.default)(async (req, res) => {
    var _a;
    const userId = (_a = req.user) === null || _a === void 0 ? void 0 : _a._id;
    const { orderId } = req.params;
    const order = await UserPetTagOrder_1.default.findOne({ _id: orderId, userId });
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
exports.updateUserPetTagOrder = (0, express_async_handler_1.default)(async (req, res) => {
    var _a;
    const userId = (_a = req.user) === null || _a === void 0 ? void 0 : _a._id;
    const { orderId } = req.params;
    const { quantity, petName, totalCostEuro, tagColor, phone, street, city, state, zipCode, country } = req.body;
    // Check if order exists and belongs to user
    const existingOrder = await UserPetTagOrder_1.default.findOne({ _id: orderId, userId });
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
    const updatedOrder = await UserPetTagOrder_1.default.findByIdAndUpdate(orderId, {
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
    }, {
        new: true,
        runValidators: true
    }).select('-__v');
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
