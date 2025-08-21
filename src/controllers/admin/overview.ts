import { Request, Response } from 'express';
import asyncHandler from 'express-async-handler';
import User from '../../models/User';
import Pet from '../../models/Pet';
import UserPetTagOrder from '../../models/UserPetTagOrder';

// Get admin overview statistics
export const getOverview = asyncHandler(async (req: Request, res: Response): Promise<void> => {
  try {
    // Check if user is admin (you can add role-based middleware later)
    const user = (req as any).user;
    
    // Get total count of users
    const totalUsers = await User.countDocuments();
    
    // Get count of active pets (pets that have been created after successful payment)
    const activePets = await Pet.countDocuments();
    
    // Get count of total orders
    const totalOrders = await UserPetTagOrder.countDocuments();
    
    // Get count of total revenue (sum of all successful payments)
    const revenueData = await UserPetTagOrder.aggregate([
      {
        $match: {
          paymentStatus: 'succeeded'
        }
      },
      {
        $group: {
          _id: null,
          totalRevenue: { $sum: '$totalCostEuro' }
        }
      }
    ]);
    
    const totalRevenue = revenueData.length > 0 ? revenueData[0].totalRevenue : 0;
    
    // Get count of successful orders
    const successfulOrders = await UserPetTagOrder.countDocuments({ paymentStatus: 'succeeded' });
    
    // Get count of pending orders
    const pendingOrders = await UserPetTagOrder.countDocuments({ paymentStatus: 'pending' });
    
    // Get count of failed orders
    const failedOrders = await UserPetTagOrder.countDocuments({ paymentStatus: 'failed' });

    res.status(200).json({
      message: 'Admin overview retrieved successfully',
      status: 200,
      overview: {
        users: {
          total: totalUsers
        },
        pets: {
          total: activePets
        },
        orders: {
          total: totalOrders,
          successful: successfulOrders,
          pending: pendingOrders,
          failed: failedOrders
        },
        revenue: {
          total: totalRevenue,
          currency: 'EUR'
        }
      }
    });
  } catch (error) {
    console.error('Error getting admin overview:', error);
    res.status(500).json({
      message: 'Failed to get admin overview',
      error: 'Internal server error'
    });
  }
});
