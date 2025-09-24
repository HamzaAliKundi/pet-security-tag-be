"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.updateUserPetTagOrder = exports.getUserPetTagOrder = exports.getUserPetTagOrders = exports.confirmPayment = exports.createUserPetTagOrder = exports.getUserPetCount = void 0;
const express_async_handler_1 = __importDefault(require("express-async-handler"));
const UserPetTagOrder_1 = __importDefault(require("../../models/UserPetTagOrder"));
const Pet_1 = __importDefault(require("../../models/Pet"));
const stripeService_1 = require("../../utils/stripeService");
const qrManagement_1 = require("../qrcode/qrManagement");
const emailService_1 = require("../../utils/emailService");
const User_1 = __importDefault(require("../../models/User"));
// Get user's pet count for limit validation
exports.getUserPetCount = (0, express_async_handler_1.default)(async (req, res) => {
    var _a;
    const userId = (_a = req.user) === null || _a === void 0 ? void 0 : _a._id;
    try {
        const petCount = await Pet_1.default.countDocuments({ userId });
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
    }
    catch (error) {
        console.error('Error getting pet count:', error);
        res.status(500).json({
            message: 'Failed to get pet count',
            error: 'Internal server error'
        });
    }
});
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
        // Check if user already has 5 or more pets
        const existingPetsCount = await Pet_1.default.countDocuments({ userId });
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
                const qrCodeId = await (0, qrManagement_1.assignQRToOrder)(order._id.toString());
                // Link the QR code to the pet
                if (qrCodeId) {
                    const QRCodeModel = (await Promise.resolve().then(() => __importStar(require('../../models/QRCode')))).default;
                    await QRCodeModel.findByIdAndUpdate(qrCodeId, {
                        assignedPetId: pet._id
                    });
                }
                // Send order confirmation email (non-blocking)
                try {
                    const user = await User_1.default.findById(userId);
                    if (user && user.email) {
                        await (0, emailService_1.sendOrderConfirmationEmail)(user.email, {
                            customerName: user.firstName || 'Valued Customer',
                            orderNumber: order.paymentIntentId || order._id.toString(),
                            petName: order.petName,
                            quantity: order.quantity,
                            orderDate: new Date().toLocaleDateString('en-GB'),
                            totalAmount: order.totalCostEuro
                        });
                    }
                }
                catch (emailError) {
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
            }
            catch (petError) {
                console.error('Error creating pet record:', petError);
                // Try to assign QR code even if pet creation failed
                const qrCodeId = await (0, qrManagement_1.assignQRToOrder)(order._id.toString());
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
