import { Request, Response } from 'express';
import asyncHandler from 'express-async-handler';
import QRCode from '../../models/QRCode';
import Subscription from '../../models/Subscription';
import Pet from '../../models/Pet';
import User from '../../models/User';
import UserPetTagOrder from '../../models/UserPetTagOrder';
import { generateQRCodeWithCloudinary, getQRCodePricing } from '../../utils/qrCodeService';

// Generate bulk QR codes (Admin only)
export const generateBulkQRCodes = asyncHandler(async (req: Request, res: Response): Promise<void> => {
  try {
    const { quantity = 10 } = req.body;
    
    if (quantity > 100) {
      res.status(400).json({
        message: 'Maximum 100 QR codes can be generated at once',
        status: 400
      });
      return;
    }

    const generatedCodes = [];
    
    for (let i = 0; i < quantity; i++) {
      try {
        const result = await generateQRCodeWithCloudinary();
        generatedCodes.push(result);
      } catch (error) {
        console.error(`Failed to generate QR code ${i + 1}:`, error);
        // Continue with other codes even if one fails
      }
    }

    res.status(201).json({
      message: `Successfully generated ${generatedCodes.length} QR codes`,
      status: 201,
      codes: generatedCodes,
      failed: quantity - generatedCodes.length
    });
  } catch (error) {
    console.error('Error generating bulk QR codes:', error);
    res.status(500).json({
      message: 'Failed to generate QR codes',
      error: 'Internal server error'
    });
  }
});

// Get all QR codes with filters (Admin only)
export const getAllQRCodes = asyncHandler(async (req: Request, res: Response): Promise<void> => {
  try {
    const {
      page = 1,
      limit = 10,
      status = 'all',
      hasGiven,
      hasVerified,
      search = '',
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
        { code: { $regex: search, $options: 'i' } }
      ];
    }

    if (status && status !== 'all') {
      searchQuery.status = status;
    }

    if (hasGiven !== undefined) {
      searchQuery.hasGiven = hasGiven === 'true';
    }

    if (hasVerified !== undefined) {
      searchQuery.hasVerified = hasVerified === 'true';
    }

    // Build sort object
    const sortObj: any = {};
    sortObj[sortBy as string] = sortOrder === 'desc' ? -1 : 1;

    // Get QR codes with populated data
    const qrCodes = await QRCode.find(searchQuery)
      .populate('assignedUserId', 'firstName lastName email')
      .populate('assignedOrderId', 'petName totalCostEuro status')
      .populate('assignedPetId', 'petName breed age')
      .sort(sortObj)
      .skip(skip)
      .limit(limitNum)
      .lean();

    const totalQRCodes = await QRCode.countDocuments(searchQuery);

    res.status(200).json({
      message: 'QR codes retrieved successfully',
      status: 200,
      qrCodes,
      pagination: {
        currentPage: pageNum,
        totalPages: Math.ceil(totalQRCodes / limitNum),
        totalQRCodes,
        qrCodesPerPage: limitNum,
        hasNextPage: pageNum < Math.ceil(totalQRCodes / limitNum),
        hasPrevPage: pageNum > 1
      }
    });
  } catch (error) {
    console.error('Error getting QR codes:', error);
    res.status(500).json({
      message: 'Failed to get QR codes',
      error: 'Internal server error'
    });
  }
});

// Assign QR codes to orders (Automatic when order is placed)
export const assignQRToOrder = async (orderId: string): Promise<string | null> => {
  try {
    // Find available QR code
    const availableQR = await QRCode.findOne({
      hasGiven: false,
      status: 'unassigned'
    });

    if (!availableQR) {
      console.error('No available QR codes found');
      return null;
    }

    // Get order details
    const order = await UserPetTagOrder.findById(orderId);
    if (!order) {
      console.error('Order not found');
      return null;
    }

    // Update QR code assignment
    availableQR.hasGiven = true;
    availableQR.assignedUserId = order.userId as any; // userId is already an ObjectId
    availableQR.assignedOrderId = orderId;
    availableQR.status = 'assigned';
    
    await availableQR.save();

    return availableQR._id.toString();
  } catch (error) {
    console.error('Error assigning QR to order:', error);
    return null;
  }
};

// Get QR code details by ID
export const getQRCodeById = asyncHandler(async (req: Request, res: Response): Promise<void> => {
  try {
    const { qrId } = req.params;

    const qrCode = await QRCode.findById(qrId)
      .populate('assignedUserId', 'firstName lastName email phone')
      .populate('assignedOrderId', 'petName totalCostEuro status createdAt')
      .populate('assignedPetId', 'petName breed age medication allergies notes hideName')
      .lean();

    if (!qrCode) {
      res.status(404).json({
        message: 'QR code not found',
        error: 'QR code does not exist'
      });
      return;
    }

    res.status(200).json({
      message: 'QR code retrieved successfully',
      status: 200,
      qrCode
    });
  } catch (error) {
    console.error('Error getting QR code:', error);
    res.status(500).json({
      message: 'Failed to get QR code',
      error: 'Internal server error'
    });
  }
});

// Get QR statistics for admin dashboard
export const getQRStats = asyncHandler(async (req: Request, res: Response): Promise<void> => {
  try {
    const [
      totalQRs,
      unassignedQRs,
      assignedQRs,
      verifiedQRs,
      lostQRs,
      activeSubscriptions
    ] = await Promise.all([
      QRCode.countDocuments(),
      QRCode.countDocuments({ status: 'unassigned' }),
      QRCode.countDocuments({ status: 'assigned' }),
      QRCode.countDocuments({ status: 'verified' }),
      QRCode.countDocuments({ status: 'lost' }),
      Subscription.countDocuments({ status: 'active' })
    ]);

    res.status(200).json({
      message: 'QR statistics retrieved successfully',
      status: 200,
      stats: {
        total: totalQRs,
        unassigned: unassignedQRs,
        assigned: assignedQRs,
        verified: verifiedQRs,
        lost: lostQRs,
        activeSubscriptions
      }
    });
  } catch (error) {
    console.error('Error getting QR statistics:', error);
    res.status(500).json({
      message: 'Failed to get QR statistics',
      error: 'Internal server error'
    });
  }
});

// Delete QR code (Admin only - only if unassigned)
export const deleteQRCode = asyncHandler(async (req: Request, res: Response): Promise<void> => {
  try {
    const { qrId } = req.params;

    const qrCode = await QRCode.findById(qrId);
    if (!qrCode) {
      res.status(404).json({
        message: 'QR code not found',
        error: 'QR code does not exist'
      });
      return;
    }

    if (qrCode.status !== 'unassigned') {
      res.status(400).json({
        message: 'Cannot delete assigned QR code',
        error: 'QR code is already assigned to an order'
      });
      return;
    }

    await QRCode.findByIdAndDelete(qrId);

    res.status(200).json({
      message: 'QR code deleted successfully',
      status: 200
    });
  } catch (error) {
    console.error('Error deleting QR code:', error);
    res.status(500).json({
      message: 'Failed to delete QR code',
      error: 'Internal server error'
    });
  }
});

