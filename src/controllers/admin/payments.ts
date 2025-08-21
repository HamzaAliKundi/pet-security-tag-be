import { Request, Response } from 'express';
import asyncHandler from 'express-async-handler';
import UserPetTagOrder from '../../models/UserPetTagOrder';
import User from '../../models/User';

// Get all payments with search, filtering, and pagination
export const getPayments = asyncHandler(async (req: Request, res: Response): Promise<void> => {
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
        { paymentIntentId: { $regex: search, $options: 'i' } },
        { petName: { $regex: search, $options: 'i' } }
      ];
    }

    // Build status filter
    if (status && status !== 'all') {
      if (status === 'Paid') {
        searchQuery.paymentStatus = 'succeeded';
      } else if (status === 'Pending') {
        searchQuery.paymentStatus = 'pending';
      } else if (status === 'Failed') {
        searchQuery.paymentStatus = 'failed';
      } else if (status === 'Refunded') {
        searchQuery.paymentStatus = 'cancelled';
      }
    }

    // Build sort object
    const sortObj: any = {};
    sortObj[sortBy as string] = sortOrder === 'desc' ? -1 : 1;

    // Execute query with pagination and populate user info
    const payments = await UserPetTagOrder.find(searchQuery)
      .populate('userId', 'firstName lastName email')
      .sort(sortObj)
      .skip(skip)
      .limit(limitNum)
      .lean();

    // Get total count for pagination
    const totalPayments = await UserPetTagOrder.countDocuments(searchQuery);

    // Transform payments data to match frontend requirements
    const transformedPayments = payments.map((payment) => {
      const user = payment.userId as any;
      return {
        id: payment._id,
        invoice: payment.paymentIntentId || `INV-${payment._id.toString().slice(-6).toUpperCase()}`,
        customer: user ? `${user.firstName} ${user.lastName}` : 'Unknown Customer',
        date: new Date(payment.createdAt).toLocaleDateString('en-GB'),
        amount: `€${payment.totalCostEuro.toFixed(2)}`,
        status: payment.paymentStatus === 'succeeded' ? 'Paid' : 
                payment.paymentStatus === 'pending' ? 'Pending' : 
                payment.paymentStatus === 'failed' ? 'Failed' : 'Refunded',
        method: 'Card',
        petName: payment.petName,
        tagColor: payment.tagColor,
        phone: payment.phone,
        street: payment.street,
        city: payment.city,
        state: payment.state,
        zipCode: payment.zipCode,
        country: payment.country,
        quantity: payment.quantity,
        paymentStatus: payment.paymentStatus,
        createdAt: payment.createdAt,
        updatedAt: payment.updatedAt
      };
    });

    res.status(200).json({
      message: 'Payments retrieved successfully',
      status: 200,
      payments: transformedPayments,
      pagination: {
        currentPage: pageNum,
        totalPages: Math.ceil(totalPayments / limitNum),
        totalPayments,
        paymentsPerPage: limitNum,
        hasNextPage: pageNum < Math.ceil(totalPayments / limitNum),
        hasPrevPage: pageNum > 1
      }
    });
  } catch (error) {
    console.error('Error getting payments:', error);
    res.status(500).json({
      message: 'Failed to get payments',
      error: 'Internal server error'
    });
  }
});

// Get single payment by ID
export const getPaymentById = asyncHandler(async (req: Request, res: Response): Promise<void> => {
  try {
    const { paymentId } = req.params;

    const payment = await UserPetTagOrder.findById(paymentId)
      .populate('userId', 'firstName lastName email')
      .lean();

    if (!payment) {
      res.status(404).json({
        message: 'Payment not found',
        error: 'Payment does not exist'
      });
      return;
    }

    const user = payment.userId as any;
    const transformedPayment = {
      id: payment._id,
      invoice: payment.paymentIntentId || `INV-${payment._id.toString().slice(-6).toUpperCase()}`,
      customer: user ? `${user.firstName} ${user.lastName}` : 'Unknown Customer',
      date: new Date(payment.createdAt).toLocaleDateString('en-GB'),
      amount: `€${payment.totalCostEuro.toFixed(2)}`,
      status: payment.paymentStatus === 'succeeded' ? 'Paid' : 
              payment.paymentStatus === 'pending' ? 'Pending' : 
              payment.paymentStatus === 'failed' ? 'Failed' : 'Refunded',
      method: 'Card',
      petName: payment.petName,
      tagColor: payment.tagColor,
      phone: payment.phone,
      street: payment.street,
      city: payment.city,
      state: payment.state,
      zipCode: payment.zipCode,
      country: payment.country,
      quantity: payment.quantity,
      paymentStatus: payment.paymentStatus,
      createdAt: payment.createdAt,
      updatedAt: payment.updatedAt
    };

    res.status(200).json({
      message: 'Payment retrieved successfully',
      status: 200,
      payment: transformedPayment
    });
  } catch (error) {
    console.error('Error getting payment:', error);
    res.status(500).json({
      message: 'Failed to get payment',
      error: 'Internal server error'
    });
  }
});

// Get payment statistics
export const getPaymentStats = asyncHandler(async (req: Request, res: Response): Promise<void> => {
  try {
    const totalTransactions = await UserPetTagOrder.countDocuments();
    
    // Calculate total revenue from successful payments (same approach as overview endpoint)
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
    
    // Calculate pending amount (same approach as overview endpoint)
    const pendingData = await UserPetTagOrder.aggregate([
      {
        $match: {
          paymentStatus: 'pending'
        }
      },
      {
        $group: {
          _id: null,
          pendingAmount: { $sum: '$totalCostEuro' }
        }
      }
    ]);
    
    const pendingAmount = pendingData.length > 0 ? pendingData[0].pendingAmount : 0;

    res.status(200).json({
      message: 'Payment statistics retrieved successfully',
      status: 200,
      stats: {
        totalTransactions,
        totalRevenue: parseFloat(totalRevenue.toFixed(2)),
        pendingAmount: parseFloat(pendingAmount.toFixed(2))
      }
    });
  } catch (error) {
    console.error('Error getting payment statistics:', error);
    res.status(500).json({
      message: 'Failed to get payment statistics',
      error: 'Internal server error'
    });
  }
});
