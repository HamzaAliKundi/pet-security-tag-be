import { Request, Response } from 'express';
import asyncHandler from 'express-async-handler';
import Review from '../../models/Review';

// @desc    Submit or update a review (one review per user)
// @route   POST /api/user/reviews
// @access  Private (authenticated users)
export const submitReview = asyncHandler(async (req: Request, res: Response): Promise<void> => {
  try {
    const userId = (req as any).user?.id;
    const { rating, title, description } = req.body;

    // Validation
    if (!rating || !title || !description) {
      res.status(400).json({
        message: 'Please provide all required fields: rating, title, and description'
      });
      return;
    }
    
    if (!userId) {
      res.status(401).json({
        message: 'User must be logged in to submit a review'
      });
      return;
    }

    if (rating < 1 || rating > 5) {
      res.status(400).json({
        message: 'Rating must be between 1 and 5'
      });
      return;
    }

    // Get user details
    const User = (await import('../../models/User')).default;
    const user = await User.findById(userId);
    
    if (!user) {
      res.status(404).json({
        message: 'User not found'
      });
      return;
    }

    // Check if user already has a review
    let review = await Review.findOne({ userId });

    if (review) {
      // Update existing review
      review.rating = Number(rating);
      review.title = title;
      review.description = description;
      review.name = `${user.firstName} ${user.lastName}`;
      review.email = user.email;
      review.phone = user.phone || '';
      await review.save();

      res.status(200).json({
        message: 'Review updated successfully!',
        status: 200,
        review: {
          _id: review._id,
          name: review.name,
          rating: review.rating,
          title: review.title,
          description: review.description,
          status: review.status,
          createdAt: review.createdAt,
          updatedAt: review.updatedAt
        }
      });
    } else {
      // Create new review
      review = await Review.create({
        userId,
        name: `${user.firstName} ${user.lastName}`,
        email: user.email,
        phone: user.phone || '',
        rating: Number(rating),
        title,
        description,
        status: 'approved'
      });

      res.status(201).json({
        message: 'Review submitted successfully!',
        status: 201,
        review: {
          _id: review._id,
          name: review.name,
          rating: review.rating,
          title: review.title,
          description: review.description,
          status: review.status,
          createdAt: review.createdAt
        }
      });
    }
  } catch (error) {
    console.error('Error submitting review:', error);
    res.status(500).json({
      message: 'Failed to submit review',
      error: 'Internal server error'
    });
  }
});

// @desc    Get user's own review
// @route   GET /api/user/reviews/my-review
// @access  Private (authenticated users)
export const getMyReview = asyncHandler(async (req: Request, res: Response): Promise<void> => {
  try {
    const userId = (req as any).user?.id;

    if (!userId) {
      res.status(401).json({
        message: 'User not authenticated'
      });
      return;
    }

    const review = await Review.findOne({ userId }).lean();

    if (!review) {
      res.status(404).json({
        message: 'No review found',
        status: 404,
        review: null
      });
      return;
    }

    res.status(200).json({
      message: 'Review retrieved successfully',
      status: 200,
      review: {
        _id: review._id,
        rating: review.rating,
        title: review.title,
        description: review.description,
        status: review.status,
        createdAt: review.createdAt,
        updatedAt: review.updatedAt
      }
    });
  } catch (error) {
    console.error('Error getting user review:', error);
    res.status(500).json({
      message: 'Failed to get review',
      error: 'Internal server error'
    });
  }
});

// @desc    Get approved reviews for public display
// @route   GET /api/reviews
// @access  Public
export const getApprovedReviews = asyncHandler(async (req: Request, res: Response): Promise<void> => {
  try {
    const { limit = 10, page = 1 } = req.query;

    const limitNum = parseInt(limit as string);
    const pageNum = parseInt(page as string);
    const skip = (pageNum - 1) * limitNum;

    const reviews = await Review.find({ status: 'approved' })
      .select('name rating title description createdAt')
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limitNum)
      .lean();

    const totalReviews = await Review.countDocuments({ status: 'approved' });

    res.status(200).json({
      message: 'Reviews retrieved successfully',
      status: 200,
      reviews,
      pagination: {
        currentPage: pageNum,
        totalPages: Math.ceil(totalReviews / limitNum),
        totalReviews,
        reviewsPerPage: limitNum
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

