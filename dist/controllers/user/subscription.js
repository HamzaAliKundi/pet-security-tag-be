"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.getSubscriptionStats = exports.getUserSubscriptions = void 0;
const express_async_handler_1 = __importDefault(require("express-async-handler"));
const Subscription_1 = __importDefault(require("../../models/Subscription"));
// Get user's subscriptions
exports.getUserSubscriptions = (0, express_async_handler_1.default)(async (req, res) => {
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
        // Get all active subscriptions for the user
        const subscriptions = await Subscription_1.default.find({
            userId,
            status: 'active',
            endDate: { $gt: new Date() } // Only active subscriptions
        })
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
