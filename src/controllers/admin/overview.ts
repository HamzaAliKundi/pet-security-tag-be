import { Request, Response } from 'express';
import asyncHandler from 'express-async-handler';
import User from '../../models/User';
import Pet from '../../models/Pet';
import UserPetTagOrder from '../../models/UserPetTagOrder';
import PetTagOrder from '../../models/PetTagOrder';

// Get admin overview statistics
export const getOverview = asyncHandler(async (req: Request, res: Response): Promise<void> => {
  try {
    // Check if user is admin (you can add role-based middleware later)
    const user = (req as any).user;
    
    // Get total count of users
    const totalUsers = await User.countDocuments();
    
    // Get count of active pets (pets that have been created after successful payment)
    const activePets = await Pet.countDocuments();
    
    // Get count of total orders from both models
    const [userTotalOrders, petTotalOrders] = await Promise.all([
      UserPetTagOrder.countDocuments(),
      PetTagOrder.countDocuments()
    ]);
    
    const totalOrders = userTotalOrders + petTotalOrders;
    
    // Get count of total revenue from both models
    const [userRevenueData, petRevenueData] = await Promise.all([
      UserPetTagOrder.aggregate([
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
      ]),
      PetTagOrder.aggregate([
        {
          $group: {
            _id: null,
            totalRevenue: { $sum: '$totalCostEuro' }
          }
        }
      ])
    ]);
    
    const userRevenue = userRevenueData.length > 0 ? userRevenueData[0].totalRevenue : 0;
    const petRevenue = petRevenueData.length > 0 ? petRevenueData[0].totalRevenue : 0;
    const totalRevenue = userRevenue + petRevenue;
    
    // Get count of successful orders from both models
    const [userSuccessfulOrders, petSuccessfulOrders] = await Promise.all([
      UserPetTagOrder.countDocuments({ paymentStatus: 'succeeded' }),
      PetTagOrder.countDocuments() // All PetTagOrder orders are considered successful
    ]);
    
    const successfulOrders = userSuccessfulOrders + petSuccessfulOrders;
    
    // Get count of pending orders (only from UserPetTagOrder since PetTagOrder doesn't have paymentStatus)
    const pendingOrders = await UserPetTagOrder.countDocuments({ paymentStatus: 'pending' });
    
    // Get count of failed orders (only from UserPetTagOrder since PetTagOrder doesn't have paymentStatus)
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
