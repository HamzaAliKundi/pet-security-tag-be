import { Request, Response } from 'express';
import asyncHandler from 'express-async-handler';
import UserPetTagOrder from '../../models/UserPetTagOrder';
import PetTagOrder from '../../models/PetTagOrder';

// Get recent order activity for admin
export const getRecentActivity = asyncHandler(async (req: Request, res: Response): Promise<void> => {
  try {
    // Get top 5 recent orders from both models based on creation time
    const [userRecentOrders, petRecentOrders] = await Promise.all([
      UserPetTagOrder.find()
        .sort({ createdAt: -1 })
        .limit(5)
        .populate('userId', 'firstName lastName email')
        .select('petName totalCostEuro status paymentStatus createdAt')
        .lean(),
      PetTagOrder.find()
        .sort({ createdAt: -1 })
        .limit(5)
        .select('petName totalCostEuro status createdAt name email')
        .lean()
    ]);

    // Combine and sort all orders by creation time
    let allOrders: any[] = [...userRecentOrders, ...petRecentOrders];
    allOrders.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());

    // Take top 5 from combined results
    const top5Orders = allOrders.slice(0, 5);

    // Transform the data for frontend display
    const recentActivity = top5Orders.map((order) => {
      if (order.userId) {
        // UserPetTagOrder
        const user = order.userId as any;
        const statusColor = order.paymentStatus === 'succeeded' ? 'success' : 
                           order.paymentStatus === 'pending' ? 'warning' : 'error';
        
        return {
          id: order._id,
          type: 'Order',
          message: `${user?.firstName || 'User'} ordered ${order.petName} tag`,
          time: getTimeAgo(order.createdAt),
          status: statusColor,
          orderType: 'UserPetTagOrder',
          orderDetails: {
            petName: order.petName,
            amount: order.totalCostEuro,
            status: order.status,
            paymentStatus: order.paymentStatus
          }
        };
      } else {
        // PetTagOrder
        const statusColor = 'success'; // PetTagOrder orders are considered successful
        
        return {
          id: order._id,
          type: 'Order',
          message: `${order.name || 'Guest User'} ordered ${order.petName} tag`,
          time: getTimeAgo(order.createdAt),
          status: statusColor,
          orderType: 'PetTagOrder',
          orderDetails: {
            petName: order.petName,
            amount: order.totalCostEuro,
            status: order.status,
            paymentStatus: 'succeeded' // PetTagOrder orders are considered successful
          }
        };
      }
    });

    res.status(200).json({
      message: 'Recent activity retrieved successfully',
      status: 200,
      recentActivity
    });
  } catch (error) {
    console.error('Error getting recent activity:', error);
    res.status(500).json({
      message: 'Failed to get recent activity',
      error: 'Internal server error'
    });
  }
});

// Helper function to get time ago
const getTimeAgo = (date: Date): string => {
  const now = new Date();
  const diffInSeconds = Math.floor((now.getTime() - new Date(date).getTime()) / 1000);
  
  if (diffInSeconds < 60) {
    return `${diffInSeconds} seconds ago`;
  } else if (diffInSeconds < 3600) {
    const minutes = Math.floor(diffInSeconds / 60);
    return `${minutes} minute${minutes > 1 ? 's' : ''} ago`;
  } else if (diffInSeconds < 86400) {
    const hours = Math.floor(diffInSeconds / 3600);
    return `${hours} hour${hours > 1 ? 's' : ''} ago`;
  } else {
    const days = Math.floor(diffInSeconds / 86400);
    return `${days} day${days > 1 ? 's' : ''} ago`;
  }
};
