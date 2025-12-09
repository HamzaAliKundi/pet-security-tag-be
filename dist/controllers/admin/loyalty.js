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
exports.getPendingRewardRedemptions = exports.updateRewardRedemptionStatus = exports.getUserLoyaltyInfo = exports.updateUserLoyaltyPoints = void 0;
const express_async_handler_1 = __importDefault(require("express-async-handler"));
const User_1 = __importDefault(require("../../models/User"));
const RewardRedemption_1 = __importDefault(require("../../models/RewardRedemption"));
const rewardRedemption_1 = require("../../utils/rewardRedemption");
/**
 * Update user's loyalty points
 * PUT /api/v1/admin/users/:userId/loyalty-points
 */
exports.updateUserLoyaltyPoints = (0, express_async_handler_1.default)(async (req, res) => {
    const { userId } = req.params;
    const { points, action } = req.body; // action: 'set' or 'add'
    if (!userId) {
        res.status(400).json({ message: 'User ID is required' });
        return;
    }
    if (points === undefined || points === null || typeof points !== 'number') {
        res.status(400).json({ message: 'Valid points value is required' });
        return;
    }
    if (points < 0) {
        res.status(400).json({ message: 'Points cannot be negative' });
        return;
    }
    const user = await User_1.default.findById(userId);
    if (!user) {
        res.status(404).json({ message: 'User not found' });
        return;
    }
    // Update points based on action
    if (action === 'add') {
        user.loyaltyPoints = (user.loyaltyPoints || 0) + points;
    }
    else {
        // Default to 'set'
        user.loyaltyPoints = points;
    }
    await user.save();
    // Check for reward redemptions after updating points
    await (0, rewardRedemption_1.checkAndCreateRewardRedemption)(userId);
    res.status(200).json({
        message: `User loyalty points ${action === 'add' ? 'updated' : 'set'} successfully`,
        status: 200,
        user: {
            _id: user._id,
            email: user.email,
            firstName: user.firstName,
            lastName: user.lastName,
            loyaltyPoints: user.loyaltyPoints
        }
    });
});
/**
 * Get user's loyalty information (Admin view)
 * GET /api/v1/admin/users/:userId/loyalty
 */
exports.getUserLoyaltyInfo = (0, express_async_handler_1.default)(async (req, res) => {
    const { userId } = req.params;
    if (!userId) {
        res.status(400).json({ message: 'User ID is required' });
        return;
    }
    const user = await User_1.default.findById(userId).select('referralCode loyaltyPoints firstName lastName email');
    if (!user) {
        res.status(404).json({ message: 'User not found' });
        return;
    }
    // Ensure reward redemptions are created if user has enough points
    // This ensures redemptions exist even if they weren't created when points were awarded
    await (0, rewardRedemption_1.checkAndCreateRewardRedemption)(userId);
    // Get referral count
    const Referral = (await Promise.resolve().then(() => __importStar(require('../../models/Referral')))).default;
    const referralCount = await Referral.countDocuments({ referrerId: userId });
    // Get all reward redemptions - don't limit initially so we can properly filter
    const allRedemptions = await RewardRedemption_1.default.find({ userId })
        .sort({ createdAt: -1 })
        .lean();
    // Find the most recent completed Tier 2 to determine cycle boundaries
    const latestCompletedTier2 = allRedemptions.find((r) => r.rewardTier === 2 && r.status === 'completed');
    // Filter to show redemptions:
    // 1. ALL pending and shipped redemptions (always show - these need admin attention)
    // 2. Completed redemptions only if they're from current cycle (after latest completed Tier 2)
    // This ensures new cycle redemptions (pending/shipped) always show, while hiding old completed ones
    let rewardRedemptions = allRedemptions.filter((r) => {
        // Always show all pending and shipped redemptions - they're active and need admin attention
        if (r.status === 'pending' || r.status === 'shipped') {
            return true;
        }
        // For completed redemptions, only show if they're from current cycle
        // (i.e., created after the latest completed Tier 2)
        if (r.status === 'completed') {
            if (latestCompletedTier2 && new Date(r.createdAt) > new Date(latestCompletedTier2.createdAt)) {
                return true; // Part of current cycle
            }
            // Hide old completed redemptions from previous cycles
            return false;
        }
        return false;
    });
    // Sort by creation date (most recent first) and limit to 10 most recent
    rewardRedemptions = rewardRedemptions
        .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
        .slice(0, 10);
    res.status(200).json({
        message: 'User loyalty information retrieved successfully',
        status: 200,
        user: {
            _id: user._id,
            email: user.email,
            firstName: user.firstName,
            lastName: user.lastName,
            referralCode: user.referralCode,
            loyaltyPoints: user.loyaltyPoints || 0,
            referralCount
        },
        rewardRedemptions: rewardRedemptions.map(r => ({
            _id: r._id,
            rewardTier: r.rewardTier,
            pointsAtRedemption: r.pointsAtRedemption,
            status: r.status,
            adminNotes: r.adminNotes,
            redeemedAt: r.redeemedAt,
            shippedAt: r.shippedAt,
            completedAt: r.completedAt
        }))
    });
});
/**
 * Update reward redemption status
 * PUT /api/v1/admin/reward-redemptions/:redemptionId/status
 */
exports.updateRewardRedemptionStatus = (0, express_async_handler_1.default)(async (req, res) => {
    const { redemptionId } = req.params;
    const { status, adminNotes } = req.body;
    if (!redemptionId) {
        res.status(400).json({ message: 'Redemption ID is required' });
        return;
    }
    if (!['pending', 'shipped', 'completed'].includes(status)) {
        res.status(400).json({ message: 'Invalid status. Must be pending, shipped, or completed' });
        return;
    }
    const redemption = await RewardRedemption_1.default.findById(redemptionId);
    if (!redemption) {
        res.status(404).json({ message: 'Reward redemption not found' });
        return;
    }
    redemption.status = status;
    if (adminNotes) {
        redemption.adminNotes = adminNotes;
    }
    if (status === 'shipped' && !redemption.shippedAt) {
        redemption.shippedAt = new Date();
    }
    if (status === 'completed' && !redemption.completedAt) {
        redemption.completedAt = new Date();
    }
    await redemption.save();
    res.status(200).json({
        message: 'Reward redemption status updated successfully',
        status: 200,
        redemption: {
            _id: redemption._id,
            rewardTier: redemption.rewardTier,
            status: redemption.status,
            adminNotes: redemption.adminNotes,
            shippedAt: redemption.shippedAt,
            completedAt: redemption.completedAt
        }
    });
});
/**
 * Get all pending reward redemptions
 * GET /api/v1/admin/reward-redemptions/pending
 */
exports.getPendingRewardRedemptions = (0, express_async_handler_1.default)(async (req, res) => {
    const redemptions = await RewardRedemption_1.default.find({ status: 'pending' })
        .populate('userId', 'firstName lastName email referralCode loyaltyPoints')
        .sort({ createdAt: -1 });
    res.status(200).json({
        message: 'Pending reward redemptions retrieved successfully',
        status: 200,
        redemptions
    });
});
