import { Request, Response } from 'express';
import asyncHandler from 'express-async-handler';
import User from '../../models/User';
import RewardRedemption from '../../models/RewardRedemption';
import { checkAndCreateRewardRedemption } from '../../utils/rewardRedemption';

/**
 * Update user's loyalty points
 * PUT /api/v1/admin/users/:userId/loyalty-points
 */
export const updateUserLoyaltyPoints = asyncHandler(async (req: Request, res: Response): Promise<void> => {
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

  const user = await User.findById(userId);
  if (!user) {
    res.status(404).json({ message: 'User not found' });
    return;
  }

  // Update points based on action
  if (action === 'add') {
    user.loyaltyPoints = (user.loyaltyPoints || 0) + points;
  } else {
    // Default to 'set'
    user.loyaltyPoints = points;
  }

  await user.save();

  // Check for reward redemptions after updating points
  await checkAndCreateRewardRedemption(userId);

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
export const getUserLoyaltyInfo = asyncHandler(async (req: Request, res: Response): Promise<void> => {
  const { userId } = req.params;

  if (!userId) {
    res.status(400).json({ message: 'User ID is required' });
    return;
  }

  const user = await User.findById(userId).select('referralCode loyaltyPoints firstName lastName email');
  if (!user) {
    res.status(404).json({ message: 'User not found' });
    return;
  }

  // Ensure reward redemptions are created if user has enough points
  // This ensures redemptions exist even if they weren't created when points were awarded
  await checkAndCreateRewardRedemption(userId);

  // Get referral count
  const Referral = (await import('../../models/Referral')).default;
  const referralCount = await Referral.countDocuments({ referrerId: userId });

  // Get all reward redemptions - don't limit initially so we can properly filter
  const allRedemptions = await RewardRedemption.find({ userId })
    .sort({ createdAt: -1 })
    .lean();
  
  // Find the most recent completed Tier 2 to determine cycle boundaries
  const latestCompletedTier2 = allRedemptions.find((r: any) => r.rewardTier === 2 && r.status === 'completed');
  
  // Filter to show redemptions:
  // 1. ALL pending and shipped redemptions (always show - these need admin attention)
  // 2. Completed redemptions only if they're from current cycle (after latest completed Tier 2)
  // This ensures new cycle redemptions (pending/shipped) always show, while hiding old completed ones
  let rewardRedemptions = allRedemptions.filter((r: any) => {
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
    .sort((a: any, b: any) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
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
export const updateRewardRedemptionStatus = asyncHandler(async (req: Request, res: Response): Promise<void> => {
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

  const redemption = await RewardRedemption.findById(redemptionId);
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
export const getPendingRewardRedemptions = asyncHandler(async (req: Request, res: Response): Promise<void> => {
  const redemptions = await RewardRedemption.find({ status: 'pending' })
    .populate('userId', 'firstName lastName email referralCode loyaltyPoints')
    .sort({ createdAt: -1 });

  res.status(200).json({
    message: 'Pending reward redemptions retrieved successfully',
    status: 200,
    redemptions
  });
});

