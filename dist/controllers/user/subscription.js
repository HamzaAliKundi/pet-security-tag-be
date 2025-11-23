"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.confirmSubscriptionPayment = exports.upgradeSubscription = exports.renewSubscription = exports.getSubscriptionStats = exports.getUserSubscriptions = void 0;
const express_async_handler_1 = __importDefault(require("express-async-handler"));
const Subscription_1 = __importDefault(require("../../models/Subscription"));
const User_1 = __importDefault(require("../../models/User"));
const stripeService_1 = require("../../utils/stripeService");
const emailService_1 = require("../../utils/emailService");
// Get user's subscriptions
exports.getUserSubscriptions = (0, express_async_handler_1.default)(async (req, res) => {
    var _a;
    try {
        const userId = (_a = req.user) === null || _a === void 0 ? void 0 : _a._id;
        const { includeAll } = req.query; // Query parameter to get all subscriptions (for payment history)
        if (!userId) {
            res.status(401).json({
                message: 'Authentication required',
                error: 'User not authenticated'
            });
            return;
        }
        // Build query - if includeAll is true, get all subscriptions; otherwise only active ones
        const query = { userId };
        if (includeAll !== 'true') {
            query.status = 'active';
            query.endDate = { $gt: new Date() }; // Only active subscriptions
        }
        // Get subscriptions based on query
        const subscriptions = await Subscription_1.default.find(query)
            .populate('qrCodeId', 'code imageUrl')
            .sort({ createdAt: -1 })
            .lean();
        // Calculate days remaining for each subscription
        const subscriptionsWithDaysRemaining = subscriptions.map(subscription => {
            const now = new Date();
            const endDate = new Date(subscription.endDate);
            const timeDiff = endDate.getTime() - now.getTime();
            const daysRemaining = Math.ceil(timeDiff / (1000 * 3600 * 24));
            return {
                ...subscription,
                daysRemaining: Math.max(0, daysRemaining),
                isExpiringSoon: daysRemaining <= 7 && daysRemaining > 0,
                isExpired: daysRemaining <= 0
            };
        });
        // Get the primary subscription (the most recent one)
        const primarySubscription = subscriptionsWithDaysRemaining[0] || null;
        res.status(200).json({
            message: 'User subscriptions retrieved successfully',
            status: 200,
            subscriptions: subscriptionsWithDaysRemaining,
            primarySubscription,
            hasActiveSubscription: subscriptionsWithDaysRemaining.length > 0
        });
    }
    catch (error) {
        console.error('Error getting user subscriptions:', error);
        res.status(500).json({
            message: 'Failed to get user subscriptions',
            error: 'Internal server error'
        });
    }
});
// Get subscription statistics
exports.getSubscriptionStats = (0, express_async_handler_1.default)(async (req, res) => {
    var _a;
    try {
        const userId = (_a = req.user) === null || _a === void 0 ? void 0 : _a._id;
        if (!userId) {
            res.status(401).json({
                message: 'Authentication required',
                error: 'User not authenticated'
            });
            return;
        }
        const now = new Date();
        // Get subscription counts
        const [activeSubscriptions, expiredSubscriptions, totalSubscriptions] = await Promise.all([
            Subscription_1.default.countDocuments({
                userId,
                status: 'active',
                endDate: { $gt: now }
            }),
            Subscription_1.default.countDocuments({
                userId,
                status: 'expired',
                endDate: { $lte: now }
            }),
            Subscription_1.default.countDocuments({ userId })
        ]);
        // Get total amount spent
        const totalSpentResult = await Subscription_1.default.aggregate([
            { $match: { userId: userId } },
            { $group: { _id: null, totalSpent: { $sum: '$amountPaid' } } }
        ]);
        const totalSpent = totalSpentResult.length > 0 ? totalSpentResult[0].totalSpent : 0;
        res.status(200).json({
            message: 'Subscription statistics retrieved successfully',
            status: 200,
            stats: {
                activeSubscriptions,
                expiredSubscriptions,
                totalSubscriptions,
                totalSpent
            }
        });
    }
    catch (error) {
        console.error('Error getting subscription statistics:', error);
        res.status(500).json({
            message: 'Failed to get subscription statistics',
            error: 'Internal server error'
        });
    }
});
// Renew subscription
exports.renewSubscription = (0, express_async_handler_1.default)(async (req, res) => {
    var _a;
    try {
        const userId = (_a = req.user) === null || _a === void 0 ? void 0 : _a._id;
        const { subscriptionId } = req.body;
        if (!userId) {
            res.status(401).json({
                message: 'Authentication required',
                error: 'User not authenticated'
            });
            return;
        }
        if (!subscriptionId) {
            res.status(400).json({
                message: 'Subscription ID is required',
                error: 'Invalid request body'
            });
            return;
        }
        // Find the subscription
        const subscription = await Subscription_1.default.findOne({
            _id: subscriptionId,
            userId,
            status: 'active'
        });
        if (!subscription) {
            res.status(404).json({
                message: 'Active subscription not found',
                error: 'Subscription does not exist or is not active'
            });
            return;
        }
        // Check if it's a lifetime subscription
        if (subscription.type === 'lifetime') {
            res.status(400).json({
                message: 'Lifetime subscriptions do not need renewal',
                error: 'Invalid operation'
            });
            return;
        }
        // Calculate renewal amount
        const pricing = {
            monthly: 2.75,
            yearly: 19.99
        };
        const amount = pricing[subscription.type];
        const amountInCents = Math.round(amount * 100);
        // Create Stripe payment intent
        const paymentResult = await (0, stripeService_1.createSubscriptionPaymentIntent)({
            amount: amountInCents,
            currency: 'gbp',
            metadata: {
                userId: userId.toString(),
                subscriptionType: subscription.type,
                action: 'renewal',
                originalSubscriptionId: subscription._id.toString()
            }
        });
        if (!paymentResult.success) {
            res.status(500).json({
                message: 'Failed to create payment intent',
                error: paymentResult.error
            });
            return;
        }
        res.status(200).json({
            message: 'Renewal payment intent created successfully',
            status: 200,
            payment: {
                paymentIntentId: paymentResult.paymentIntentId,
                clientSecret: paymentResult.clientSecret,
                publishableKey: process.env.STRIPE_PUBLISH_KEY
            },
            subscription: {
                id: subscription._id,
                type: subscription.type,
                amount,
                currency: 'GBP'
            }
        });
    }
    catch (error) {
        console.error('Error creating renewal payment intent:', error);
        res.status(500).json({
            message: 'Failed to create renewal payment intent',
            error: 'Internal server error'
        });
    }
});
// Upgrade subscription
exports.upgradeSubscription = (0, express_async_handler_1.default)(async (req, res) => {
    var _a;
    try {
        const userId = (_a = req.user) === null || _a === void 0 ? void 0 : _a._id;
        const { subscriptionId, newType } = req.body;
        if (!userId) {
            res.status(401).json({
                message: 'Authentication required',
                error: 'User not authenticated'
            });
            return;
        }
        if (!subscriptionId || !newType) {
            res.status(400).json({
                message: 'Subscription ID and new type are required',
                error: 'Invalid request body'
            });
            return;
        }
        // Validate new type
        if (!['monthly', 'yearly', 'lifetime'].includes(newType)) {
            res.status(400).json({
                message: 'Invalid subscription type',
                error: 'Type must be monthly, yearly, or lifetime'
            });
            return;
        }
        // Find the subscription
        const subscription = await Subscription_1.default.findOne({
            _id: subscriptionId,
            userId,
            status: 'active'
        });
        if (!subscription) {
            res.status(404).json({
                message: 'Active subscription not found',
                error: 'Subscription does not exist or is not active'
            });
            return;
        }
        // Check if it's already the same type
        if (subscription.type === newType) {
            res.status(400).json({
                message: 'Subscription is already of this type',
                error: 'No upgrade needed'
            });
            return;
        }
        // Check if trying to downgrade from lifetime
        if (subscription.type === 'lifetime') {
            res.status(400).json({
                message: 'Cannot downgrade from lifetime subscription',
                error: 'Invalid operation'
            });
            return;
        }
        // Calculate upgrade amount
        const pricing = {
            monthly: 2.75,
            yearly: 19.99,
            lifetime: 99.00
        };
        const amount = pricing[newType];
        const amountInCents = Math.round(amount * 100);
        // If upgrading to lifetime, use Payment Intent (one-time payment)
        // If upgrading monthly/yearly and original has auto-renewal, we should update Stripe Subscription
        // For now, we'll use Payment Intent for upgrades (user pays difference)
        // The new subscription will inherit auto-renewal preference from original
        const paymentResult = await (0, stripeService_1.createSubscriptionPaymentIntent)({
            amount: amountInCents,
            currency: 'gbp',
            metadata: {
                userId: userId.toString(),
                subscriptionType: newType,
                action: 'upgrade',
                originalSubscriptionId: subscription._id.toString()
            }
        });
        if (!paymentResult.success) {
            res.status(500).json({
                message: 'Failed to create payment intent',
                error: paymentResult.error
            });
            return;
        }
        res.status(200).json({
            message: 'Upgrade payment intent created successfully',
            status: 200,
            payment: {
                paymentIntentId: paymentResult.paymentIntentId,
                clientSecret: paymentResult.clientSecret,
                publishableKey: process.env.STRIPE_PUBLISH_KEY
            },
            subscription: {
                id: subscription._id,
                currentType: subscription.type,
                newType,
                amount,
                currency: 'GBP',
                // Preserve auto-renewal status for monthly/yearly upgrades
                preserveAutoRenew: subscription.autoRenew && (newType === 'monthly' || newType === 'yearly')
            }
        });
    }
    catch (error) {
        console.error('Error creating upgrade payment intent:', error);
        res.status(500).json({
            message: 'Failed to create upgrade payment intent',
            error: 'Internal server error'
        });
    }
});
// Confirm subscription renewal/upgrade payment
exports.confirmSubscriptionPayment = (0, express_async_handler_1.default)(async (req, res) => {
    var _a;
    try {
        const userId = (_a = req.user) === null || _a === void 0 ? void 0 : _a._id;
        const { subscriptionId, paymentIntentId, action, newType, amount, paymentMethodId } = req.body;
        if (!userId) {
            res.status(401).json({
                message: 'Authentication required',
                error: 'User not authenticated'
            });
            return;
        }
        if (!subscriptionId || !paymentIntentId || !action || amount === undefined) {
            res.status(400).json({
                message: 'Subscription ID, payment intent ID, action, and amount are required',
                error: 'Invalid request body'
            });
            return;
        }
        // Find the subscription
        const subscription = await Subscription_1.default.findOne({
            _id: subscriptionId,
            userId,
            status: 'active'
        });
        if (!subscription) {
            res.status(404).json({
                message: 'Active subscription not found',
                error: 'Subscription does not exist or is not active'
            });
            return;
        }
        // Calculate new end date using amount from frontend
        const startDate = new Date();
        const endDate = new Date();
        const amountPaid = amount; // Use amount from frontend request
        const subscriptionType = action === 'upgrade' && newType ? newType : subscription.type;
        if (action === 'renewal') {
            // Extend current subscription
            if (subscription.type === 'monthly') {
                endDate.setMonth(endDate.getMonth() + 1);
            }
            else if (subscription.type === 'yearly') {
                endDate.setFullYear(endDate.getFullYear() + 1);
            }
        }
        else if (action === 'upgrade' && newType) {
            // Upgrade to new type
            if (newType === 'monthly') {
                endDate.setMonth(endDate.getMonth() + 1);
            }
            else if (newType === 'yearly') {
                endDate.setFullYear(endDate.getFullYear() + 1);
            }
            else if (newType === 'lifetime') {
                endDate.setFullYear(endDate.getFullYear() + 100);
            }
        }
        // Save payment method to customer if provided (for future auto-renewals)
        if (paymentMethodId && (subscriptionType === 'monthly' || subscriptionType === 'yearly')) {
            try {
                const user = await User_1.default.findById(userId);
                if (user && user.email) {
                    // Get or create Stripe customer
                    const customerResult = await (0, stripeService_1.getOrCreateCustomer)(user.email, user.firstName || user.email);
                    if (!('error' in customerResult)) {
                        // Save payment method to customer
                        await (0, stripeService_1.savePaymentMethodToCustomer)(paymentMethodId, customerResult.customerId);
                        console.log(`Payment method ${paymentMethodId} saved to customer ${customerResult.customerId} for future auto-renewals`);
                    }
                }
            }
            catch (pmError) {
                console.error('Error saving payment method to customer:', pmError);
                // Don't fail the subscription if saving payment method fails
            }
        }
        // Determine auto-renewal status
        let autoRenewStatus = subscription.autoRenew;
        if (action === 'upgrade' && subscriptionType === 'lifetime') {
            autoRenewStatus = false; // Lifetime doesn't auto-renew
        }
        // Create a new subscription record for this payment (preserve previous payment history)
        const newSubscription = await Subscription_1.default.create({
            userId: subscription.userId,
            qrCodeId: subscription.qrCodeId,
            type: subscriptionType,
            status: 'active',
            startDate,
            endDate,
            paymentIntentId,
            stripeSubscriptionId: subscription.stripeSubscriptionId, // Preserve Stripe subscription ID if exists
            amountPaid,
            currency: subscription.currency,
            autoRenew: autoRenewStatus
        });
        // Mark the old subscription as expired (but keep it for payment history)
        subscription.status = 'expired';
        await subscription.save();
        // Send subscription notification email (non-blocking)
        try {
            const user = await User_1.default.findById(userId);
            if (user && user.email) {
                await (0, emailService_1.sendSubscriptionNotificationEmail)(user.email, {
                    customerName: user.firstName || 'Valued Customer',
                    action: action,
                    planType: action === 'upgrade' && newType ? newType : subscription.type,
                    amount: amountPaid,
                    validUntil: endDate.toLocaleDateString('en-GB'),
                    paymentDate: new Date().toLocaleDateString('en-GB')
                });
            }
        }
        catch (emailError) {
            console.error('Failed to send subscription notification email:', emailError);
            // Don't fail the subscription if email fails
        }
        res.status(200).json({
            message: `Subscription ${action} confirmed successfully`,
            status: 200,
            subscription: {
                id: newSubscription._id,
                type: newSubscription.type,
                endDate: newSubscription.endDate,
                status: newSubscription.status
            }
        });
    }
    catch (error) {
        console.error('Error confirming subscription payment:', error);
        res.status(500).json({
            message: 'Failed to confirm subscription payment',
            error: 'Internal server error'
        });
    }
});
