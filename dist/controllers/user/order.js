"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.confirmPayment = exports.createOrder = void 0;
const express_async_handler_1 = __importDefault(require("express-async-handler"));
const PetTagOrder_1 = __importDefault(require("../../models/PetTagOrder"));
const User_1 = __importDefault(require("../../models/User"));
const Pet_1 = __importDefault(require("../../models/Pet"));
const Referral_1 = __importDefault(require("../../models/Referral"));
const stripeService_1 = require("../../utils/stripeService");
// NOTE: assignQRToPublicOrder import removed - QR codes are now assigned when user scans the tag, not at order confirmation
const emailService_1 = require("../../utils/emailService");
const bcryptjs_1 = __importDefault(require("bcryptjs"));
const env_1 = require("../../config/env");
const referralCode_1 = require("../../utils/referralCode");
const rewardRedemption_1 = require("../../utils/rewardRedemption");
exports.createOrder = (0, express_async_handler_1.default)(async (req, res) => {
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
        // Process tag colors - use tagColors array if provided, otherwise fallback to tagColor or default
        let colorsArray;
        if (tagColors && Array.isArray(tagColors) && tagColors.length > 0) {
            // If tagColors is provided, use it (trim to quantity if longer, pad with 'blue' if shorter)
            if (tagColors.length >= quantity) {
                colorsArray = tagColors.slice(0, quantity);
            }
            else {
                // If fewer colors than quantity, pad with 'blue'
                colorsArray = [...tagColors, ...Array(quantity - tagColors.length).fill('blue')];
            }
        }
        else if (tagColor) {
            colorsArray = Array(quantity).fill(tagColor);
        }
        else {
            colorsArray = Array(quantity).fill('blue');
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
        const order = await PetTagOrder_1.default.create({
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
    }
    catch (error) {
        console.error('Error creating order:', error);
        res.status(500).json({
            message: 'Internal server error while creating order'
        });
    }
});
// Generate random password
const generateRandomPassword = (length = 12) => {
    const charset = 'abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789!@#$%^&*';
    let password = '';
    for (let i = 0; i < length; i++) {
        password += charset.charAt(Math.floor(Math.random() * charset.length));
    }
    return password;
};
// Split name into firstName and lastName
const splitName = (name) => {
    const nameParts = name.trim().split(' ');
    const firstName = nameParts[0] || '';
    const lastName = nameParts.slice(1).join(' ') || firstName; // Use firstName as lastName if not provided
    return { firstName, lastName };
};
exports.confirmPayment = (0, express_async_handler_1.default)(async (req, res) => {
    const { orderId } = req.params;
    const { paymentIntentId } = req.body;
    if (!paymentIntentId) {
        res.status(400).json({ message: 'Payment intent ID is required' });
        return;
    }
    // Check if order exists
    const order = await PetTagOrder_1.default.findOne({ _id: orderId });
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
            order.status = 'paid';
            await order.save();
            // Check if user already exists
            let user = await User_1.default.findOne({ email: order.email.toLowerCase() });
            let isNewUser = false;
            let generatedPassword = '';
            if (!user) {
                // Create new user account
                isNewUser = true;
                generatedPassword = generateRandomPassword();
                const salt = await bcryptjs_1.default.genSalt(env_1.env.SALT_ROUNDS);
                const hashedPassword = await bcryptjs_1.default.hash(generatedPassword, salt);
                const { firstName, lastName } = splitName(order.name);
                // Generate unique referral code for new user
                let userReferralCode = (0, referralCode_1.generateReferralCode)();
                let isUniqueCode = false;
                while (!isUniqueCode) {
                    const existingCode = await User_1.default.findOne({ referralCode: userReferralCode });
                    if (!existingCode) {
                        isUniqueCode = true;
                    }
                    else {
                        userReferralCode = (0, referralCode_1.generateReferralCode)();
                    }
                }
                // Get referral code from query params if provided
                const referralCodeFromQuery = req.query.referralCode;
                let referredByUserId = null;
                if (referralCodeFromQuery) {
                    const referrer = await User_1.default.findOne({ referralCode: referralCodeFromQuery });
                    if (referrer && referrer._id) {
                        referredByUserId = referrer._id;
                    }
                }
                user = await User_1.default.create({
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
                        const referrer = await User_1.default.findById(referredByUserId);
                        if (referrer) {
                            // Award 100 points to referrer
                            referrer.loyaltyPoints = (referrer.loyaltyPoints || 0) + 100;
                            await referrer.save();
                            // Check for reward redemptions after awarding points
                            await (0, rewardRedemption_1.checkAndCreateRewardRedemption)(referrer._id.toString());
                            // Create referral record
                            await Referral_1.default.create({
                                referrerId: referrer._id,
                                referredUserId: user._id,
                                pointsAwarded: 100,
                                referralCodeUsed: referralCodeFromQuery
                            });
                        }
                    }
                    catch (referralError) {
                        console.error('Error processing referral:', referralError);
                        // Don't fail order if referral processing fails
                    }
                }
                // Send credentials email (non-blocking)
                try {
                    await (0, emailService_1.sendCredentialsEmail)(user.email, {
                        customerName: user.firstName || 'Valued Customer',
                        email: user.email,
                        password: generatedPassword,
                        loginUrl: `${env_1.env.FRONTEND_URL}`
                    });
                }
                catch (emailError) {
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
                    const pet = await Pet_1.default.create({
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
                    await (0, emailService_1.sendOrderConfirmationEmail)(user.email, {
                        customerName: user.firstName || 'Valued Customer',
                        orderNumber: order.paymentIntentId || order._id.toString(),
                        petName: order.petName,
                        quantity: order.quantity,
                        orderDate: new Date().toLocaleDateString('en-GB'),
                        totalAmount: order.totalCostEuro || 0
                    });
                }
                catch (emailError) {
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
            }
            catch (petError) {
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
        }
        else {
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
    }
    catch (error) {
        console.error('Error confirming payment:', error);
        res.status(500).json({
            message: 'Internal server error while confirming payment',
            error: 'Internal server error'
        });
    }
});
