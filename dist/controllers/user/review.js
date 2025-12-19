"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.getApprovedReviews = exports.getMyReview = exports.submitReview = void 0;
const express_async_handler_1 = __importDefault(require("express-async-handler"));
const Review_1 = __importDefault(require("../../models/Review"));
// @desc    Submit or update a review (one review per user)
// @route   POST /api/user/reviews
// @access  Private (authenticated users)
exports.submitReview = (0, express_async_handler_1.default)(async (req, res) => {
    var _a;
    try {
        const userId = (_a = req.user) === null || _a === void 0 ? void 0 : _a.id;
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
        const User = (await Promise.resolve().then(() => __importStar(require('../../models/User')))).default;
        const user = await User.findById(userId);
        if (!user) {
            res.status(404).json({
                message: 'User not found'
            });
            return;
        }
        // Check if user already has a review
        let review = await Review_1.default.findOne({ userId });
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
        }
        else {
            // Create new review
            review = await Review_1.default.create({
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
    }
    catch (error) {
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
exports.getMyReview = (0, express_async_handler_1.default)(async (req, res) => {
    var _a;
    try {
        const userId = (_a = req.user) === null || _a === void 0 ? void 0 : _a.id;
        if (!userId) {
            res.status(401).json({
                message: 'User not authenticated'
            });
            return;
        }
        const review = await Review_1.default.findOne({ userId }).lean();
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
    }
    catch (error) {
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
exports.getApprovedReviews = (0, express_async_handler_1.default)(async (req, res) => {
    try {
        const { limit = 10, page = 1 } = req.query;
        const limitNum = parseInt(limit);
        const pageNum = parseInt(page);
        const skip = (pageNum - 1) * limitNum;
        const reviews = await Review_1.default.find({ status: 'approved' })
            .select('name rating title description createdAt')
            .sort({ createdAt: -1 })
            .skip(skip)
            .limit(limitNum)
            .lean();
        const totalReviews = await Review_1.default.countDocuments({ status: 'approved' });
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
    }
    catch (error) {
        console.error('Error getting reviews:', error);
        res.status(500).json({
            message: 'Failed to get reviews',
            error: 'Internal server error'
        });
    }
});
