"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.checkAndCreateRewardRedemption = void 0;
const User_1 = __importDefault(require("../models/User"));
const RewardRedemption_1 = __importDefault(require("../models/RewardRedemption"));
/**
 * Check if user has reached a reward milestone and create redemption record
 * This function should be called after updating user's loyalty points
 */
const checkAndCreateRewardRedemption = async (userId) => {
    try {
        const user = await User_1.default.findById(userId);
        if (!user)
            return;
        const points = user.loyaltyPoints || 0;
        // Check for 2000 points reward (Tier 2) - check this first as it resets points
        if (points >= 2000) {
            // Get the most recent tier 2 redemption
            const latestTier2 = await RewardRedemption_1.default.findOne({
                userId: user._id,
                rewardTier: 2
            }).sort({ createdAt: -1 });
            // Only create if no tier 2 exists OR the latest tier 2 is completed (allowing new cycle)
            // This allows users to go through multiple cycles: Tier 1 → Tier 2 → reset → Tier 1 → Tier 2 → reset...
            const canCreateTier2 = !latestTier2 || latestTier2.status === 'completed';
            if (canCreateTier2) {
                // Create redemption record
                await RewardRedemption_1.default.create({
                    userId: user._id,
                    rewardTier: 2,
                    pointsAtRedemption: 2000,
                    status: 'pending'
                });
                // Reset points to 0 after reaching 2000
                user.loyaltyPoints = 0;
                await user.save();
            }
        }
        // Check for 1000 points reward (Tier 1) - only if user hasn't reached 2000 yet
        if (points >= 1000 && points < 2000) {
            // Get the most recent tier 1 and tier 2 redemptions
            const latestTier1 = await RewardRedemption_1.default.findOne({
                userId: user._id,
                rewardTier: 1
            }).sort({ createdAt: -1 });
            const latestTier2 = await RewardRedemption_1.default.findOne({
                userId: user._id,
                rewardTier: 2
            }).sort({ createdAt: -1 });
            // Allow creating new Tier 1 if:
            // 1. No Tier 1 exists, OR
            // 2. Latest Tier 2 is completed AND latest Tier 1 was created BEFORE that Tier 2
            //    (meaning user completed a cycle and can start a new Tier 1)
            let canCreateTier1 = false;
            if (!latestTier1) {
                // No Tier 1 exists at all - can create
                canCreateTier1 = true;
            }
            else if (latestTier2 && latestTier2.status === 'completed') {
                // There's a completed Tier 2 - check if Tier 1 is from before that Tier 2
                if (latestTier1.createdAt < latestTier2.createdAt) {
                    // Tier 1 is from a previous cycle (before Tier 2), can create new one
                    canCreateTier1 = true;
                }
                else {
                    // Tier 1 exists after Tier 2 was completed - check if it's already completed
                    // If it's pending or shipped, don't create another
                    // If it's completed and we're checking again, don't create
                    canCreateTier1 = false;
                }
            }
            else {
                // No completed Tier 2 exists - don't create duplicate Tier 1
                canCreateTier1 = false;
            }
            if (canCreateTier1) {
                await RewardRedemption_1.default.create({
                    userId: user._id,
                    rewardTier: 1,
                    pointsAtRedemption: 1000,
                    status: 'pending'
                });
            }
        }
    }
    catch (error) {
        console.error('Error checking reward redemption:', error);
        // Don't throw - this is a non-critical operation
    }
};
exports.checkAndCreateRewardRedemption = checkAndCreateRewardRedemption;
