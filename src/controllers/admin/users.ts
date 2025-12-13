import { Request, Response } from 'express';
import asyncHandler from 'express-async-handler';
import mongoose from 'mongoose';
import User from '../../models/User';
import Pet from '../../models/Pet';
import RewardRedemption from '../../models/RewardRedemption';

// Get all users with search, filtering, and pagination
export const getUsers = asyncHandler(async (req: Request, res: Response): Promise<void> => {
  try {
    const {
      page = 1,
      limit = 10,
      search = '',
      status = 'all',
      rewardStatus = 'all',
      country = '',
      city = '',
      sortBy = 'createdAt',
      sortOrder = 'desc'
    } = req.query;

    const pageNum = parseInt(page as string);
    const limitNum = parseInt(limit as string);
    const skip = (pageNum - 1) * limitNum;

    // Build search query
    let searchQuery: any = {};
    
    if (search) {
      searchQuery.$or = [
        { firstName: { $regex: search, $options: 'i' } },
        { lastName: { $regex: search, $options: 'i' } },
        { email: { $regex: search, $options: 'i' } }
      ];
    }

    // Build status filter
    if (status && status !== 'all') {
      searchQuery.status = status;
    }

    // Build country and city filters first (will be combined with reward status filter later)
    const hasCountryFilter = country && (country as string).trim() !== '';
    const hasCityFilter = city && (city as string).trim() !== '';
    const countryStr = hasCountryFilter ? (country as string).trim() : '';
    const cityStr = hasCityFilter ? (city as string).trim() : '';

    // Build reward status filter
    // First, get user IDs that match the reward status filter
    let rewardStatusUserIds: string[] | null = null;
    if (rewardStatus && rewardStatus !== 'all') {
      if (rewardStatus === 'none') {
        // Users with no pending/shipped redemptions - exclude users with any pending/shipped rewards
        const usersWithRewards = await RewardRedemption.find({
          status: { $in: ['pending', 'shipped'] }
        }).distinct('userId');
        
        const rewardUserIds = usersWithRewards.map((id: any) => id.toString());
        if (rewardUserIds.length > 0) {
          // Exclude users with rewards
          if (searchQuery._id && searchQuery._id.$in) {
            // Already have _id filter, filter out reward users
            searchQuery._id.$in = searchQuery._id.$in.filter((id: any) => 
              !rewardUserIds.includes(id.toString())
            );
            if (searchQuery._id.$in.length === 0) {
              // No users match, return empty
              res.status(200).json({
                message: 'Users retrieved successfully',
                status: 200,
                users: [],
                pagination: {
                  currentPage: pageNum,
                  totalPages: 0,
                  totalUsers: 0,
                  usersPerPage: limitNum,
                  hasNextPage: false,
                  hasPrevPage: false
                }
              });
              return;
            }
          } else {
            searchQuery._id = { $nin: rewardUserIds };
          }
        }
        // Mark as handled, don't use rewardStatusUserIds
        rewardStatusUserIds = null;
      } else if (rewardStatus === 'voucher-pending') {
        const redemptions = await RewardRedemption.find({
          rewardTier: 1,
          status: 'pending'
        }).distinct('userId');
        rewardStatusUserIds = redemptions.map((id: any) => id.toString());
      } else if (rewardStatus === 'voucher-shipped') {
        const redemptions = await RewardRedemption.find({
          rewardTier: 1,
          status: 'shipped'
        }).distinct('userId');
        rewardStatusUserIds = redemptions.map((id: any) => id.toString());
      } else if (rewardStatus === 'gift-pending') {
        const redemptions = await RewardRedemption.find({
          rewardTier: 2,
          status: 'pending'
        }).distinct('userId');
        rewardStatusUserIds = redemptions.map((id: any) => id.toString());
      } else if (rewardStatus === 'gift-shipped') {
        const redemptions = await RewardRedemption.find({
          rewardTier: 2,
          status: 'shipped'
        }).distinct('userId');
        rewardStatusUserIds = redemptions.map((id: any) => id.toString());
      } else if (rewardStatus === 'pending') {
        // Any pending reward (voucher or gift)
        const redemptions = await RewardRedemption.find({
          status: 'pending'
        }).distinct('userId');
        rewardStatusUserIds = redemptions.map((id: any) => id.toString());
      } else if (rewardStatus === 'shipped') {
        // Any shipped reward (voucher or gift)
        const redemptions = await RewardRedemption.find({
          status: 'shipped'
        }).distinct('userId');
        rewardStatusUserIds = redemptions.map((id: any) => id.toString());
      }
      
      // Apply filter to search query (only if not handled above for 'none')
      if (rewardStatusUserIds !== null && rewardStatus !== 'none') {
        if (rewardStatusUserIds.length === 0) {
          // No users match the filter, return empty result
          res.status(200).json({
            message: 'Users retrieved successfully',
            status: 200,
            users: [],
            pagination: {
              currentPage: pageNum,
              totalPages: 0,
              totalUsers: 0,
              usersPerPage: limitNum,
              hasNextPage: false,
              hasPrevPage: false
            }
          });
          return;
        }
        // Convert string IDs to ObjectIds for proper querying
        // Note: distinct returns ObjectIds, but we converted to strings, so convert back
        const rewardStatusObjectIds = rewardStatusUserIds
          .filter(id => mongoose.Types.ObjectId.isValid(id))
          .map(id => new mongoose.Types.ObjectId(id));
        
        if (rewardStatusObjectIds.length === 0) {
          // No valid ObjectIds, return empty
          res.status(200).json({
            message: 'Users retrieved successfully',
            status: 200,
            users: [],
            pagination: {
              currentPage: pageNum,
              totalPages: 0,
              totalUsers: 0,
              usersPerPage: limitNum,
              hasNextPage: false,
              hasPrevPage: false
            }
          });
          return;
        }
        
        // Apply _id filter - MongoDB will AND this with country/city filters
        if (searchQuery._id && searchQuery._id.$nin) {
          // Handle edge case where 'none' was previously applied
          const existingExclusions = searchQuery._id.$nin.map((id: any) => id.toString());
          const filteredIds = rewardStatusObjectIds.filter((id: any) => 
            !existingExclusions.includes(id.toString())
          );
          searchQuery._id = filteredIds.length > 0 ? { $in: filteredIds } : { $in: [] };
        } else {
          searchQuery._id = { $in: rewardStatusObjectIds };
        }
      }
    }

    // Now apply country and city filters (after reward status filter is applied)
    // These will be ANDed with the _id filter from reward status
    // Regex on null/undefined fields will simply not match (which is correct behavior)
    if (hasCountryFilter) {
      searchQuery.country = { 
        $regex: countryStr, 
        $options: 'i' 
      };
    }

    if (hasCityFilter) {
      searchQuery.city = { 
        $regex: cityStr, 
        $options: 'i' 
      };
    }

    // Build sort object
    const sortObj: any = {};
    sortObj[sortBy as string] = sortOrder === 'desc' ? -1 : 1;

    // Execute query with pagination
    const users = await User.find(searchQuery)
      .select('firstName lastName email status createdAt lastLogin referralCode loyaltyPoints')
      .sort(sortObj)
      .skip(skip)
      .limit(limitNum)
      .lean();

    // Get total count for pagination
    const totalUsers = await User.countDocuments(searchQuery);

    // Get pet count, loyalty points, and reward status for each user
    const usersWithPets = await Promise.all(
      users.map(async (user: any) => {
        const petCount = await Pet.countDocuments({ userId: user._id });
        
        // Get latest pending or shipped reward redemption
        // Prioritize Tier 2 over Tier 1 if both exist
        const latestRewardTier2 = await RewardRedemption.findOne({
          userId: user._id,
          rewardTier: 2,
          status: { $in: ['pending', 'shipped'] }
        }).sort({ createdAt: -1 });
        
        const latestRewardTier1 = await RewardRedemption.findOne({
          userId: user._id,
          rewardTier: 1,
          status: { $in: ['pending', 'shipped'] }
        }).sort({ createdAt: -1 });
        
        // Prioritize Tier 2 if it exists, otherwise show Tier 1
        const latestReward = latestRewardTier2 || latestRewardTier1;
        
        let rewardStatus = null;
        if (latestReward) {
          if (latestReward.rewardTier === 1) {
            rewardStatus = latestReward.status === 'pending' ? 'Voucher Pending' : 'Voucher Shipped';
          } else if (latestReward.rewardTier === 2) {
            rewardStatus = latestReward.status === 'pending' ? 'Gift Pending' : 'Gift Shipped';
          }
        }
        
        return {
          ...user,
          id: user._id,
          name: `${user.firstName} ${user.lastName}`,
          pets: petCount,
          joinDate: user.createdAt,
          lastLogin: user.lastLogin || 'Never',
          loyaltyPoints: user.loyaltyPoints || 0,
          rewardStatus
        };
      })
    );

    res.status(200).json({
      message: 'Users retrieved successfully',
      status: 200,
      users: usersWithPets,
      pagination: {
        currentPage: pageNum,
        totalPages: Math.ceil(totalUsers / limitNum),
        totalUsers,
        usersPerPage: limitNum,
        hasNextPage: pageNum < Math.ceil(totalUsers / limitNum),
        hasPrevPage: pageNum > 1
      }
    });
  } catch (error) {
    console.error('Error getting users:', error);
    res.status(500).json({
      message: 'Failed to get users',
      error: 'Internal server error'
    });
  }
});

// Get single user by ID
export const getUserById = asyncHandler(async (req: Request, res: Response): Promise<void> => {
  try {
    const { userId } = req.params;

    const user = await User.findById(userId)
      .select('firstName lastName email role status createdAt lastLogin phone street city state zipCode country')
      .lean();

    if (!user) {
      res.status(404).json({
        message: 'User not found',
        error: 'User does not exist'
      });
      return;
    }

    // Get pet count
    const petCount = await Pet.countDocuments({ userId });

    const userWithPets = {
      ...user,
      id: user._id,
      name: `${user.firstName} ${user.lastName}`,
      pets: petCount,
      joinDate: user.createdAt,
      lastLogin: user.lastLogin || 'Never'
    };

    res.status(200).json({
      message: 'User retrieved successfully',
      status: 200,
      user: userWithPets
    });
  } catch (error) {
    console.error('Error getting user:', error);
    res.status(500).json({
      message: 'Failed to get user',
      error: 'Internal server error'
    });
  }
});

// Update user status
export const updateUserStatus = asyncHandler(async (req: Request, res: Response): Promise<void> => {
  try {
    const { userId } = req.params;
    const { status } = req.body;

    // Validate status
    const validStatuses = ['active', 'inactive', 'suspended'];
    if (!validStatuses.includes(status)) {
      res.status(400).json({
        message: 'Invalid status',
        error: 'Status must be one of: active, inactive, suspended'
      });
      return;
    }

    const user = await User.findByIdAndUpdate(
      userId,
      { status },
      { new: true, runValidators: true }
    ).select('firstName lastName email status createdAt lastLogin');

    if (!user) {
      res.status(404).json({
        message: 'User not found',
        error: 'User does not exist'
      });
      return;
    }

    // Get pet count
    const petCount = await Pet.countDocuments({ userId });

    const userWithPets = {
      ...user.toObject(),
      id: user._id,
      name: `${user.firstName} ${user.lastName}`,
      pets: petCount,
      joinDate: user.createdAt,
      lastLogin: user.lastLogin || 'Never'
    };

    res.status(200).json({
      message: 'User status updated successfully',
      status: 200,
      user: userWithPets
    });
  } catch (error) {
    console.error('Error updating user status:', error);
    res.status(500).json({
      message: 'Failed to update user status',
      error: 'Internal server error'
    });
  }
});

// Delete user
export const deleteUser = asyncHandler(async (req: Request, res: Response): Promise<void> => {
  try {
    const { userId } = req.params;

    // Check if user exists
    const user = await User.findById(userId);
    if (!user) {
      res.status(404).json({
        message: 'User not found',
        error: 'User does not exist'
      });
      return;
    }

    // Check if user has pets
    const petCount = await Pet.countDocuments({ userId });
    if (petCount > 0) {
      res.status(400).json({
        message: 'Cannot delete user',
        error: `User has ${petCount} pet(s). Please remove pets first.`
      });
      return;
    }

    // Delete user
    await User.findByIdAndDelete(userId);

    res.status(200).json({
      message: 'User deleted successfully',
      status: 200
    });
  } catch (error) {
    console.error('Error deleting user:', error);
    res.status(500).json({
      message: 'Failed to delete user',
      error: 'Internal server error'
    });
  }
});

// Get user statistics
export const getUserStats = asyncHandler(async (req: Request, res: Response): Promise<void> => {
  try {
    const totalUsers = await User.countDocuments();
    const activeUsers = await User.countDocuments({ status: 'active' });
    const inactiveUsers = await User.countDocuments({ status: 'inactive' });
    const suspendedUsers = await User.countDocuments({ status: 'suspended' });

    // Get users with pets
    const usersWithPets = await User.aggregate([
      {
        $lookup: {
          from: 'pets',
          localField: '_id',
          foreignField: 'userId',
          as: 'pets'
        }
      },
      {
        $match: {
          'pets.0': { $exists: true }
        }
      },
      {
        $count: 'count'
      }
    ]);

    const usersWithPetsCount = usersWithPets.length > 0 ? usersWithPets[0].count : 0;

    res.status(200).json({
      message: 'User statistics retrieved successfully',
      status: 200,
      stats: {
        total: totalUsers,
        active: activeUsers,
        inactive: inactiveUsers,
        suspended: suspendedUsers,
        withPets: usersWithPetsCount,
        withoutPets: totalUsers - usersWithPetsCount
      }
    });
  } catch (error) {
    console.error('Error getting user statistics:', error);
    res.status(500).json({
      message: 'Failed to get user statistics',
      error: 'Internal server error'
    });
  }
});


