import { Request, Response } from 'express';
import asyncHandler from 'express-async-handler';
import UserPetTagOrder from '../../models/UserPetTagOrder';
import User from '../../models/User';

// Get all orders with search, filtering, and pagination
export const getOrders = asyncHandler(async (req: Request, res: Response): Promise<void> => {
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
        { petName: { $regex: search, $options: 'i' } },
        { paymentIntentId: { $regex: search, $options: 'i' } }
      ];
    }

    // Build status filter
    if (status && status !== 'all') {
      searchQuery.status = status;
    }

    // Build sort object
    const sortObj: any = {};
    sortObj[sortBy as string] = sortOrder === 'desc' ? -1 : 1;

    // Execute query with pagination and populate user info
    const orders = await UserPetTagOrder.find(searchQuery)
      .populate('userId', 'firstName lastName email')
      .sort(sortObj)
      .skip(skip)
      .limit(limitNum)
      .lean();

    // Get total count for pagination
    const totalOrders = await UserPetTagOrder.countDocuments(searchQuery);

    // Transform orders data to match frontend requirements
    const transformedOrders = orders.map((order) => {
      const user = order.userId as any;
      return {
        id: order._id,
        orderId: order.paymentIntentId || `ORD-${order._id.toString().slice(-6).toUpperCase()}`,
        customer: user ? `${user.firstName} ${user.lastName}` : 'Unknown Customer',
        email: user ? user.email : 'No Email',
        items: order.quantity,
        total: `€${order.totalCostEuro.toFixed(2)}`,
        status: order.status,
        date: new Date(order.createdAt).toISOString().split('T')[0],
        tracking: order.paymentIntentId || 'N/A',
        petName: order.petName,
        tagColor: order.tagColor,
        phone: order.phone,
        street: order.street,
        city: order.city,
        state: order.state,
        zipCode: order.zipCode,
        country: order.country,
        paymentStatus: order.paymentStatus,
        createdAt: order.createdAt,
        updatedAt: order.updatedAt
      };
    });

    res.status(200).json({
      message: 'Orders retrieved successfully',
      status: 200,
      orders: transformedOrders,
      pagination: {
        currentPage: pageNum,
        totalPages: Math.ceil(totalOrders / limitNum),
        totalOrders,
        ordersPerPage: limitNum,
        hasNextPage: pageNum < Math.ceil(totalOrders / limitNum),
        hasPrevPage: pageNum > 1
      }
    });
  } catch (error) {
    console.error('Error getting orders:', error);
    res.status(500).json({
      message: 'Failed to get orders',
      error: 'Internal server error'
    });
  }
});

// Get single order by ID
export const getOrderById = asyncHandler(async (req: Request, res: Response): Promise<void> => {
  try {
    const { orderId } = req.params;

    const order = await UserPetTagOrder.findById(orderId)
      .populate('userId', 'firstName lastName email')
      .lean();

    if (!order) {
      res.status(404).json({
        message: 'Order not found',
        error: 'Order does not exist'
      });
      return;
    }

    const user = order.userId as any;
    const transformedOrder = {
      id: order._id,
      orderId: order.paymentIntentId || `ORD-${order._id.toString().slice(-6).toUpperCase()}`,
      customer: user ? `${user.firstName} ${user.lastName}` : 'Unknown Customer',
      email: user ? user.email : 'No Email',
      items: order.quantity,
      total: `€${order.totalCostEuro.toFixed(2)}`,
      status: order.status,
      date: new Date(order.createdAt).toISOString().split('T')[0],
      tracking: order.paymentIntentId || 'N/A',
      petName: order.petName,
      tagColor: order.tagColor,
      phone: order.phone,
      street: order.street,
      city: order.city,
      state: order.state,
      zipCode: order.zipCode,
      country: order.country,
      paymentStatus: order.paymentStatus,
      createdAt: order.createdAt,
      updatedAt: order.updatedAt
    };

    res.status(200).json({
      message: 'Order retrieved successfully',
      status: 200,
      order: transformedOrder
    });
  } catch (error) {
    console.error('Error getting order:', error);
    res.status(500).json({
      message: 'Failed to get order',
      error: 'Internal server error'
    });
  }
});

// Update order status
export const updateOrderStatus = asyncHandler(async (req: Request, res: Response): Promise<void> => {
  try {
    const { orderId } = req.params;
    const { status } = req.body;

    if (!status || !['pending', 'paid', 'shipped', 'delivered', 'cancelled'].includes(status)) {
      res.status(400).json({
        message: 'Invalid status',
        error: 'Status must be one of: pending, paid, shipped, delivered, cancelled'
      });
      return;
    }

    // Check if order exists
    const order = await UserPetTagOrder.findById(orderId);
    if (!order) {
      res.status(404).json({
        message: 'Order not found',
        error: 'Order does not exist'
      });
      return;
    }

    // Update order status
    const updatedOrder = await UserPetTagOrder.findByIdAndUpdate(
      orderId,
      { status },
      { new: true }
    ).populate('userId', 'firstName lastName email');

    if (!updatedOrder) {
      res.status(500).json({
        message: 'Failed to update order',
        error: 'Order update failed'
      });
      return;
    }

    const user = updatedOrder.userId as any;
    const transformedOrder = {
      id: updatedOrder._id,
      orderId: updatedOrder.paymentIntentId || `ORD-${updatedOrder._id.toString().slice(-6).toUpperCase()}`,
      customer: user ? `${user.firstName} ${user.lastName}` : 'Unknown Customer',
      email: user ? user.email : 'No Email',
      items: updatedOrder.quantity,
      total: `€${updatedOrder.totalCostEuro.toFixed(2)}`,
      status: updatedOrder.status,
      date: new Date(updatedOrder.createdAt).toISOString().split('T')[0],
      tracking: updatedOrder.paymentIntentId || 'N/A',
      petName: updatedOrder.petName,
      tagColor: updatedOrder.tagColor,
      phone: updatedOrder.phone,
      street: updatedOrder.street,
      city: updatedOrder.city,
      state: updatedOrder.state,
      zipCode: updatedOrder.zipCode,
      country: updatedOrder.country,
      paymentStatus: updatedOrder.paymentStatus,
      createdAt: updatedOrder.createdAt,
      updatedAt: updatedOrder.updatedAt
    };

    res.status(200).json({
      message: 'Order status updated successfully',
      status: 200,
      order: transformedOrder
    });
  } catch (error) {
    console.error('Error updating order status:', error);
    res.status(500).json({
      message: 'Failed to update order status',
      error: 'Internal server error'
    });
  }
});

// Get order statistics
export const getOrderStats = asyncHandler(async (req: Request, res: Response): Promise<void> => {
  try {
    const totalOrders = await UserPetTagOrder.countDocuments();
    
    // Get status breakdown
    const statusStats = await UserPetTagOrder.aggregate([
      {
        $group: {
          _id: '$status',
          count: { $sum: 1 }
        }
      }
    ]);

    // Calculate total revenue from successful payments
    const revenueStats = await UserPetTagOrder.aggregate([
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

    const totalRevenue = revenueStats.length > 0 ? revenueStats[0].totalRevenue : 0;

    // Transform status stats to object
    const statusBreakdown: any = {};
    statusStats.forEach((stat: any) => {
      statusBreakdown[stat._id] = stat.count;
    });

    res.status(200).json({
      message: 'Order statistics retrieved successfully',
      status: 200,
      stats: {
        total: totalOrders,
        statusBreakdown,
        totalRevenue: parseFloat(totalRevenue.toFixed(2))
      }
    });
  } catch (error) {
    console.error('Error getting order statistics:', error);
    res.status(500).json({
      message: 'Failed to get order statistics',
      error: 'Internal server error'
    });
  }
});
