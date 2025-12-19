import { Request, Response } from 'express';
import asyncHandler from 'express-async-handler';
import Review from '../../models/Review';
import mongoose from 'mongoose';

// @desc    Get all reviews for admin
// @route   GET /api/admin/reviews
// @access  Private (Admin only)
export const getAllReviews = asyncHandler(async (req: Request, res: Response): Promise<void> => {
  try {
    const {
      page = 1,
      limit = 10,
      status = 'all',
      search = '',
      sortBy = 'createdAt',
      sortOrder = 'desc'
    } = req.query;

    const pageNum = parseInt(page as string);
    const limitNum = parseInt(limit as string);
    const skip = (pageNum - 1) * limitNum;

    let searchQuery: any = {};

    // Status filter
    if (status && status !== 'all') {
      searchQuery.status = status;
    }

    // Search filter
    if (search) {
      searchQuery.$or = [
        { name: { $regex: search as string, $options: 'i' } },
        { email: { $regex: search as string, $options: 'i' } },
        { title: { $regex: search as string, $options: 'i' } },
        { description: { $regex: search as string, $options: 'i' } }
      ];
    }

    const sortObj: any = {};
    sortObj[sortBy as string] = sortOrder === 'desc' ? -1 : 1;

    const reviews = await Review.find(searchQuery)
      .sort(sortObj)
      .skip(skip)
      .limit(limitNum)
      .lean();

    const totalReviews = await Review.countDocuments(searchQuery);

    // Get counts for each status
    const pendingCount = await Review.countDocuments({ status: 'pending' });
    const approvedCount = await Review.countDocuments({ status: 'approved' });
    const rejectedCount = await Review.countDocuments({ status: 'rejected' });

    res.status(200).json({
      message: 'Reviews retrieved successfully',
      status: 200,
      reviews,
      stats: {
        total: totalReviews,
        pending: pendingCount,
        approved: approvedCount,
        rejected: rejectedCount
      },
      pagination: {
        currentPage: pageNum,
        totalPages: Math.ceil(totalReviews / limitNum),
        totalReviews,
        reviewsPerPage: limitNum,
        hasNextPage: pageNum < Math.ceil(totalReviews / limitNum),
        hasPrevPage: pageNum > 1
      }
    });
  } catch (error) {
    console.error('Error getting reviews:', error);
    res.status(500).json({
      message: 'Failed to get reviews',
      error: 'Internal server error'
    });
  }
});

// @desc    Get single review
// @route   GET /api/admin/reviews/:reviewId
// @access  Private (Admin only)
export const getReviewById = asyncHandler(async (req: Request, res: Response): Promise<void> => {
  try {
    const { reviewId } = req.params;

    if (!mongoose.Types.ObjectId.isValid(reviewId)) {
      res.status(400).json({ message: 'Invalid review ID' });
      return;
    }

    const review = await Review.findById(reviewId).lean();

    if (!review) {
      res.status(404).json({ message: 'Review not found' });
      return;
    }

    res.status(200).json({
      message: 'Review retrieved successfully',
      status: 200,
      review
    });
  } catch (error) {
    console.error('Error getting review:', error);
    res.status(500).json({
      message: 'Failed to get review',
      error: 'Internal server error'
    });
  }
});

// @desc    Update review
// @route   PUT /api/admin/reviews/:reviewId
// @access  Private (Admin only)
export const updateReview = asyncHandler(async (req: Request, res: Response): Promise<void> => {
  try {
    const { reviewId } = req.params;
    const { name, email, phone, rating, title, description, status } = req.body;

    if (!mongoose.Types.ObjectId.isValid(reviewId)) {
      res.status(400).json({ message: 'Invalid review ID' });
      return;
    }

    const review = await Review.findById(reviewId);

    if (!review) {
      res.status(404).json({ message: 'Review not found' });
      return;
    }

    // Update fields if provided
    if (name) review.name = name;
    if (email) review.email = email;
    if (phone !== undefined) review.phone = phone;
    if (rating) {
      const ratingNum = Number(rating);
      if (ratingNum < 1 || ratingNum > 5) {
        res.status(400).json({ message: 'Rating must be between 1 and 5' });
        return;
      }
      review.rating = ratingNum;
    }
    if (title) review.title = title;
    if (description) review.description = description;
    if (status && ['pending', 'approved', 'rejected'].includes(status)) {
      review.status = status;
    }

    await review.save();

    res.status(200).json({
      message: 'Review updated successfully',
      status: 200,
      review
    });
  } catch (error) {
    console.error('Error updating review:', error);
    res.status(500).json({
      message: 'Failed to update review',
      error: 'Internal server error'
    });
  }
});

// @desc    Delete review
// @route   DELETE /api/admin/reviews/:reviewId
// @access  Private (Admin only)
export const deleteReview = asyncHandler(async (req: Request, res: Response): Promise<void> => {
  try {
    const { reviewId } = req.params;

    if (!mongoose.Types.ObjectId.isValid(reviewId)) {
      res.status(400).json({ message: 'Invalid review ID' });
      return;
    }

    const review = await Review.findByIdAndDelete(reviewId);

    if (!review) {
      res.status(404).json({ message: 'Review not found' });
      return;
    }

    res.status(200).json({
      message: 'Review deleted successfully',
      status: 200
    });
  } catch (error) {
    console.error('Error deleting review:', error);
    res.status(500).json({
      message: 'Failed to delete review',
      error: 'Internal server error'
    });
  }
});

