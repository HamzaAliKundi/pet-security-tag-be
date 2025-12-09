import { Request, Response } from 'express';
import asyncHandler from 'express-async-handler';
import User from '../../models/User';
import Referral from '../../models/Referral';
import RewardRedemption from '../../models/RewardRedemption';
import { env } from '../../config/env';

/**
 * Get user's loyalty information
 * GET /api/v1/user/loyalty
 */
export const getLoyaltyInfo = asyncHandler(async (req: Request, res: Response): Promise<void> => {
  const userId = (req as any).user?._id;

  if (!userId) {
    res.status(401).json({ message: 'Unauthorized' });
    return;
  }

  const user = await User.findById(userId).select('referralCode loyaltyPoints firstName lastName email');
  if (!user) {
    res.status(404).json({ message: 'User not found' });
    return;
  }

  // Get referral statistics
  const referralCount = await Referral.countDocuments({ referrerId: userId });
  const referrals = await Referral.find({ referrerId: userId })
    .populate('referredUserId', 'firstName lastName email')
    .sort({ createdAt: -1 })
    .limit(50); // Limit to latest 50 referrals

  // Get all redemptions to find current cycle
  const allRedemptions = await RewardRedemption.find({ userId })
    .sort({ createdAt: -1 })
    .limit(20);
  
  // Find the most recent completed Tier 2 to determine current cycle
  const latestCompletedTier2 = allRedemptions.find(r => r.rewardTier === 2 && r.status === 'completed');
  
  // Get redemptions from current cycle (after latest completed Tier 2, or all if no completed Tier 2)
  let currentCycleRedemptions = allRedemptions;
  if (latestCompletedTier2) {
    currentCycleRedemptions = allRedemptions.filter(r => r.createdAt > latestCompletedTier2.createdAt);
  }
  
  // Get most recent redemption per tier from current cycle
  const currentCycleTier1 = currentCycleRedemptions.find(r => r.rewardTier === 1);
  const currentCycleTier2 = currentCycleRedemptions.find(r => r.rewardTier === 2);
  
  // For history display, show all recent redemptions (limit to 10)
  const rewardRedemptions = allRedemptions.slice(0, 10);

  // Determine current reward tier
  const points = user.loyaltyPoints || 0;
  let currentReward = null;
  let nextReward = null;
  let rewardStatus = null;
  
  // Check for reward redemptions by status in CURRENT CYCLE only
  const pendingTier1 = currentCycleTier1 && currentCycleTier1.status === 'pending' ? currentCycleTier1 : null;
  const pendingTier2 = currentCycleTier2 && currentCycleTier2.status === 'pending' ? currentCycleTier2 : null;
  const shippedTier1 = currentCycleTier1 && currentCycleTier1.status === 'shipped' ? currentCycleTier1 : null;
  const shippedTier2 = currentCycleTier2 && currentCycleTier2.status === 'shipped' ? currentCycleTier2 : null;
  const completedTier1 = currentCycleTier1 && currentCycleTier1.status === 'completed' ? currentCycleTier1 : null;
  const completedTier2 = currentCycleTier2 && currentCycleTier2.status === 'completed' ? currentCycleTier2 : null;
  
  // Only show rewards that are NOT completed - completed rewards should not appear as current reward
  // Check current cycle redemptions only
  const hasActiveTier2 = currentCycleTier2 && (currentCycleTier2.status === 'pending' || currentCycleTier2.status === 'shipped');
  const hasActiveTier1 = currentCycleTier1 && (currentCycleTier1.status === 'pending' || currentCycleTier1.status === 'shipped' || currentCycleTier1.status === 'completed');
  
  // Tier 2: Only show if pending or shipped (NOT if completed)
  // Check if there's an active Tier 2 (pending/shipped) in current cycle, OR points >= 2000 but no completed Tier 2
  const tier2Completed = currentCycleTier2 && currentCycleTier2.status === 'completed';
  if (hasActiveTier2 || (points >= 2000 && !tier2Completed)) {
    currentReward = {
      tier: 2,
      name: 'Pet Gift Box',
      description: 'Pet gift box with toys and treats',
      pointsRequired: 2000,
      achieved: true,
      status: pendingTier2 ? 'pending' : shippedTier2 ? 'shipped' : null,
      message: shippedTier2
        ? 'You will receive the gift soon' 
        : pendingTier2 
        ? 'We will send you the gift soon' 
        : points >= 2000 
        ? 'We will send you the gift soon' 
        : null
    };
  } 
  
  // Tier 1: Show if pending, shipped, or completed (but show "soon" message for shipped/completed)
  if (!currentReward && (points >= 1000 || hasActiveTier1)) {
    currentReward = {
      tier: 1,
      name: 'Amazon Voucher',
      description: '£20 / $20 USD / $20 CAD Amazon voucher',
      pointsRequired: 1000,
      achieved: true,
      status: pendingTier1 ? 'pending' : (shippedTier1 || completedTier1) ? 'shipped' : null,
      message: (shippedTier1 || completedTier1)
        ? 'You will receive the voucher code soon' 
        : pendingTier1 
        ? 'We will send you the voucher code' 
        : points >= 1000 
        ? 'We will send you the voucher code' 
        : null
    };
    nextReward = {
      tier: 2,
      name: 'Pet Gift Box',
      description: 'Pet gift box with toys and treats',
      pointsRequired: 2000,
      pointsNeeded: 2000 - points
    };
  } else {
    nextReward = {
      tier: 1,
      name: 'Amazon Voucher',
      description: '£20 / $20 USD / $20 CAD Amazon voucher',
      pointsRequired: 1000,
      pointsNeeded: 1000 - points
    };
  }

  // Generate referral link (for dashboard users, link to frontend signup)
  const referralLink = user.referralCode 
    ? `${env.FRONTEND_URL}/signup?ref=${user.referralCode}`
    : null;

  res.status(200).json({
    message: 'Loyalty information retrieved successfully',
    status: 200,
    loyaltyPoints: points,
    referralCode: user.referralCode,
    referralLink,
    referralCount,
    referrals,
    currentReward,
    nextReward,
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
 * Get referral link
 * GET /api/v1/user/loyalty/referral-link
 */
export const getReferralLink = asyncHandler(async (req: Request, res: Response): Promise<void> => {
  const userId = (req as any).user?._id;

  if (!userId) {
    res.status(401).json({ message: 'Unauthorized' });
    return;
  }

  const user = await User.findById(userId).select('referralCode');
  if (!user || !user.referralCode) {
    res.status(404).json({ message: 'Referral code not found' });
    return;
  }

  const referralLink = `${env.FRONTEND_URL}/signup?ref=${user.referralCode}`;

  res.status(200).json({
    message: 'Referral link retrieved successfully',
    status: 200,
    referralLink,
    referralCode: user.referralCode
  });
});

