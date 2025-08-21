import { Request, Response } from 'express';
import asyncHandler from 'express-async-handler';
import User from '../../models/User';
import Pet from '../../models/Pet';

// Get all users with search, filtering, and pagination
export const getUsers = asyncHandler(async (req: Request, res: Response): Promise<void> => {
  try {
    const {
      page = 1,
      limit = 10,
      search = '',
      status = 'all',
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

    // Build sort object
    const sortObj: any = {};
    sortObj[sortBy as string] = sortOrder === 'desc' ? -1 : 1;

    // Execute query with pagination
    const users = await User.find(searchQuery)
      .select('firstName lastName email status createdAt lastLogin')
      .sort(sortObj)
      .skip(skip)
      .limit(limitNum)
      .lean();

    // Get total count for pagination
    const totalUsers = await User.countDocuments(searchQuery);

    // Get pet count for each user
    const usersWithPets = await Promise.all(
      users.map(async (user) => {
        const petCount = await Pet.countDocuments({ userId: user._id });
        return {
          ...user,
          id: user._id,
          name: `${user.firstName} ${user.lastName}`,
          pets: petCount,
          joinDate: user.createdAt,
          lastLogin: user.lastLogin || 'Never'
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
      .select('firstName lastName email status createdAt lastLogin phone street city state zipCode country')
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
