import { Request, Response } from 'express';
import asyncHandler from 'express-async-handler';
import UserPetTagOrder from '../../models/UserPetTagOrder';
import PetTagOrder from '../../models/PetTagOrder';
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

    // Execute queries for both models
    const [userPayments, petPayments] = await Promise.all([
      UserPetTagOrder.find(searchQuery)
        .populate('userId', 'firstName lastName email')
        .sort(sortObj)
        .lean(),
      PetTagOrder.find(searchQuery)
        .sort(sortObj)
        .lean()
    ]);

    // Combine and sort all payments
    let allPayments: any[] = [...userPayments, ...petPayments];
    
    // Sort combined payments
    allPayments.sort((a, b) => {
      const aValue = a[sortBy as string];
      const bValue = b[sortBy as string];
      
      if (sortOrder === 'desc') {
        return new Date(bValue).getTime() - new Date(aValue).getTime();
      } else {
        return new Date(aValue).getTime() - new Date(bValue).getTime();
      }
    });

    // Get total count for pagination
    const totalPayments = allPayments.length;
    
    // Check if requested page is valid
    const totalPages = Math.ceil(totalPayments / limitNum);
    
    // Handle case when there are no payments
    if (totalPayments === 0) {
      res.status(200).json({
        message: 'No payments found',
        status: 200,
        payments: [],
        pagination: {
          currentPage: 1,
          totalPages: 0,
          totalPayments: 0,
          paymentsPerPage: limitNum,
          hasNextPage: false,
          hasPrevPage: false
        }
      });
      return;
    }
    
    // Check if requested page is valid
    if (pageNum > totalPages) {
      res.status(400).json({
        message: 'Invalid page number',
        error: `Page ${pageNum} does not exist. Total pages: ${totalPages}`,
        status: 400
      });
      return;
    }

    // Apply pagination to combined results
    const paginatedPayments = allPayments.slice(skip, skip + limitNum);

    // Transform payments data to match frontend requirements
    const transformedPayments = paginatedPayments.map((payment) => {
      // Check if it's a UserPetTagOrder (has userId) or PetTagOrder (has email/name)
      if (payment.userId) {
        // UserPetTagOrder
        const user = payment.userId as any;
        return {
          id: payment._id,
          invoice: payment.paymentIntentId || `INV-${payment._id.toString().slice(-6).toUpperCase()}`,
          customer: user ? `${user.firstName} ${user.lastName}` : 'Unknown Customer',
          date: new Date(payment.createdAt).toLocaleDateString('en-GB'),
          amount: `€${(payment.totalCostEuro || 0).toFixed(2)}`,
          status: payment.paymentStatus === 'succeeded' ? 'Paid' : 
                  payment.paymentStatus === 'pending' ? 'Pending' : 
                  payment.paymentStatus === 'failed' ? 'Failed' : 'Refunded',
          method: 'Card',
          petName: payment.petName || 'Unknown Pet',
          tagColor: payment.tagColor || 'Unknown',
          phone: payment.phone || 'No Phone',
          street: payment.street || '',
          city: payment.city || '',
          state: payment.state || '',
          zipCode: payment.zipCode || '',
          country: payment.country || '',
          quantity: payment.quantity || 1,
          paymentStatus: payment.paymentStatus || 'pending',
          paymentType: 'UserPetTagOrder',
          createdAt: payment.createdAt,
          updatedAt: payment.updatedAt
        };
      } else {
        // PetTagOrder
        return {
          id: payment._id,
          invoice: payment.paymentIntentId || `INV-${payment._id.toString().slice(-6).toUpperCase()}`,
          customer: payment.name || 'No Name',
          date: new Date(payment.createdAt).toLocaleDateString('en-GB'),
          amount: `€${(payment.totalCostEuro || 0).toFixed(2)}`,
          status: 'Paid', 
          method: 'Card',
          petName: payment.petName || 'Unknown Pet',
          tagColor: payment.tagColor || 'Unknown',
          phone: payment.phone || 'No Phone',
          street: payment.shippingAddress?.street || '',
          city: payment.shippingAddress?.city || '',
          state: payment.shippingAddress?.state || '',
          zipCode: payment.shippingAddress?.zipCode || '',
          country: payment.shippingAddress?.country || '',
          quantity: payment.quantity || 1,
          paymentStatus: 'pending', // PetTagOrder doesn't have paymentStatus
          paymentType: 'PetTagOrder',
          createdAt: payment.createdAt,
          updatedAt: payment.updatedAt
        };
      }
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

    // Search in both models
    let payment = await UserPetTagOrder.findById(paymentId)
      .populate('userId', 'firstName lastName email')
      .lean();

    let paymentType = 'UserPetTagOrder';

    if (!payment) {
      // If not found in UserPetTagOrder, search in PetTagOrder
      payment = await PetTagOrder.findById(paymentId).lean();
      paymentType = 'PetTagOrder';
    }

    if (!payment) {
      res.status(404).json({
        message: 'Payment not found',
        error: 'Payment does not exist'
      });
      return;
    }

    let transformedPayment;

    if (paymentType === 'UserPetTagOrder') {
      // UserPetTagOrder
      const user = payment.userId as any;
      transformedPayment = {
        id: payment._id,
        invoice: payment.paymentIntentId || `INV-${payment._id.toString().slice(-6).toUpperCase()}`,
        customer: user ? `${user.firstName} ${user.lastName}` : 'Unknown Customer',
        date: new Date(payment.createdAt).toLocaleDateString('en-GB'),
        amount: `€${(payment.totalCostEuro || 0).toFixed(2)}`,
        status: payment.paymentStatus === 'succeeded' ? 'Paid' : 
                payment.paymentStatus === 'pending' ? 'Pending' : 
                payment.paymentStatus === 'failed' ? 'Failed' : 'Refunded',
        method: 'Card',
        petName: payment.petName || 'Unknown Pet',
        tagColor: payment.tagColor || 'Unknown',
        phone: payment.phone || 'No Phone',
        street: payment.street || '',
        city: payment.city || '',
        state: payment.state || '',
        zipCode: payment.zipCode || '',
        country: payment.country || '',
        quantity: payment.quantity || 1,
        paymentStatus: payment.paymentStatus || 'pending',
        paymentType: 'UserPetTagOrder',
        createdAt: payment.createdAt,
        updatedAt: payment.updatedAt
      };
    } else {
      // PetTagOrder
      const petPayment = payment as any;
      transformedPayment = {
        id: petPayment._id,
        invoice: petPayment.paymentIntentId || `INV-${petPayment._id.toString().slice(-6).toUpperCase()}`,
        customer: petPayment.name || 'No Name',
        date: new Date(petPayment.createdAt).toLocaleDateString('en-GB'),
        amount: `€${(petPayment.totalCostEuro || 0).toFixed(2)}`,
                 status: 'Paid', // PetTagOrder orders are considered paid
        method: 'Card',
        petName: petPayment.petName || 'Unknown Pet',
        tagColor: petPayment.tagColor || 'Unknown',
        phone: petPayment.phone || 'No Phone',
        street: petPayment.shippingAddress?.street || '',
        city: petPayment.shippingAddress?.city || '',
        state: petPayment.shippingAddress?.state || '',
        zipCode: petPayment.shippingAddress?.zipCode || '',
        country: petPayment.shippingAddress?.country || '',
        quantity: petPayment.quantity || 1,
        paymentStatus: 'pending', // PetTagOrder doesn't have paymentStatus
        paymentType: 'PetTagOrder',
        createdAt: petPayment.createdAt,
        updatedAt: petPayment.updatedAt
      };
    }

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
    // Get counts from both models
    const [userTotalTransactions, petTotalTransactions] = await Promise.all([
      UserPetTagOrder.countDocuments(),
      PetTagOrder.countDocuments()
    ]);
    
    const totalTransactions = userTotalTransactions + petTotalTransactions;
    
    // Calculate total revenue from successful payments (UserPetTagOrder has paymentStatus)
    const userRevenueData = await UserPetTagOrder.aggregate([
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
    
    // PetTagOrder doesn't have paymentStatus, so we'll count all as potential revenue
    const petRevenueData = await PetTagOrder.aggregate([
      {
        $group: {
          _id: null,
          totalRevenue: { $sum: '$totalCostEuro' }
        }
      }
    ]);
    
    const userRevenue = userRevenueData.length > 0 ? userRevenueData[0].totalRevenue : 0;
    const petRevenue = petRevenueData.length > 0 ? petRevenueData[0].totalRevenue : 0;
    const totalRevenue = userRevenue + petRevenue;
    
    // Calculate pending amount (UserPetTagOrder has paymentStatus)
    const userPendingData = await UserPetTagOrder.aggregate([
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
    
    // PetTagOrder doesn't have paymentStatus, so we'll count all as pending
    const petPendingData = await PetTagOrder.aggregate([
      {
        $group: {
          _id: null,
          pendingAmount: { $sum: '$totalCostEuro' }
        }
      }
    ]);
    
    const userPendingAmount = userPendingData.length > 0 ? userPendingData[0].pendingAmount : 0;
    const petPendingAmount = petPendingData.length > 0 ? petPendingData[0].pendingAmount : 0;
    const pendingAmount = userPendingAmount + petPendingAmount;

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
