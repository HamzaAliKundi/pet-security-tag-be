import { Request, Response } from 'express';
import asyncHandler from 'express-async-handler';
import Discount from '../../models/Discount';

// Get all discounts
export const getDiscounts = asyncHandler(async (req: Request, res: Response): Promise<void> => {
  try {
    const discounts = await Discount.find().sort({ createdAt: -1 });
    
    res.status(200).json({
      message: 'Discounts retrieved successfully',
      status: 200,
      discounts
    });
  } catch (error) {
    console.error('Error getting discounts:', error);
    res.status(500).json({
      message: 'Failed to get discounts',
      error: 'Internal server error'
    });
  }
});

// Get single discount by ID
export const getDiscountById = asyncHandler(async (req: Request, res: Response): Promise<void> => {
  try {
    const { discountId } = req.params;
    
    const discount = await Discount.findById(discountId);
    
    if (!discount) {
      res.status(404).json({
        message: 'Discount not found',
        status: 404
      });
      return;
    }
    
    res.status(200).json({
      message: 'Discount retrieved successfully',
      status: 200,
      discount
    });
  } catch (error) {
    console.error('Error getting discount:', error);
    res.status(500).json({
      message: 'Failed to get discount',
      error: 'Internal server error'
    });
  }
});

// Create new discount
export const createDiscount = asyncHandler(async (req: Request, res: Response): Promise<void> => {
  try {
    const { code } = req.body;
    
    if (!code || typeof code !== 'string' || code.trim().length === 0) {
      res.status(400).json({
        message: 'Discount code is required',
        status: 400
      });
      return;
    }
    
    // Check if discount code already exists
    const existingDiscount = await Discount.findOne({ 
      code: code.trim().toUpperCase() 
    });
    
    if (existingDiscount) {
      res.status(409).json({
        message: 'Discount code already exists',
        status: 409
      });
      return;
    }
    
    const discount = new Discount({
      code: code.trim().toUpperCase(),
      isActive: true
    });
    
    await discount.save();
    
    res.status(201).json({
      message: 'Discount created successfully',
      status: 201,
      discount
    });
  } catch (error: any) {
    console.error('Error creating discount:', error);
    if (error.code === 11000) {
      res.status(409).json({
        message: 'Discount code already exists',
        status: 409
      });
      return;
    }
    res.status(500).json({
      message: 'Failed to create discount',
      error: 'Internal server error'
    });
  }
});

// Update discount
export const updateDiscount = asyncHandler(async (req: Request, res: Response): Promise<void> => {
  try {
    const { discountId } = req.params;
    const { code, isActive } = req.body;
    
    const discount = await Discount.findById(discountId);
    
    if (!discount) {
      res.status(404).json({
        message: 'Discount not found',
        status: 404
      });
      return;
    }
    
    // If code is being updated, check for duplicates
    if (code && code.trim() !== discount.code) {
      const existingDiscount = await Discount.findOne({ 
        code: code.trim().toUpperCase(),
        _id: { $ne: discountId }
      });
      
      if (existingDiscount) {
        res.status(409).json({
          message: 'Discount code already exists',
          status: 409
        });
        return;
      }
      
      discount.code = code.trim().toUpperCase();
    }
    
    if (typeof isActive === 'boolean') {
      discount.isActive = isActive;
    }
    
    await discount.save();
    
    res.status(200).json({
      message: 'Discount updated successfully',
      status: 200,
      discount
    });
  } catch (error: any) {
    console.error('Error updating discount:', error);
    if (error.code === 11000) {
      res.status(409).json({
        message: 'Discount code already exists',
        status: 409
      });
      return;
    }
    res.status(500).json({
      message: 'Failed to update discount',
      error: 'Internal server error'
    });
  }
});

// Delete discount
export const deleteDiscount = asyncHandler(async (req: Request, res: Response): Promise<void> => {
  try {
    const { discountId } = req.params;
    
    const discount = await Discount.findByIdAndDelete(discountId);
    
    if (!discount) {
      res.status(404).json({
        message: 'Discount not found',
        status: 404
      });
      return;
    }
    
    res.status(200).json({
      message: 'Discount deleted successfully',
      status: 200
    });
  } catch (error) {
    console.error('Error deleting discount:', error);
    res.status(500).json({
      message: 'Failed to delete discount',
      error: 'Internal server error'
    });
  }
});

