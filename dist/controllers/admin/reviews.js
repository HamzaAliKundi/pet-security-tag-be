"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.deleteReview = exports.updateReview = exports.getReviewById = exports.getAllReviews = void 0;
const express_async_handler_1 = __importDefault(require("express-async-handler"));
const Review_1 = __importDefault(require("../../models/Review"));
const mongoose_1 = __importDefault(require("mongoose"));
// @desc    Get all reviews for admin
// @route   GET /api/admin/reviews
// @access  Private (Admin only)
exports.getAllReviews = (0, express_async_handler_1.default)(async (req, res) => {
    try {
        const { page = 1, limit = 10, status = 'all', search = '', sortBy = 'createdAt', sortOrder = 'desc' } = req.query;
        const pageNum = parseInt(page);
        const limitNum = parseInt(limit);
        const skip = (pageNum - 1) * limitNum;
        let searchQuery = {};
        // Status filter
        if (status && status !== 'all') {
            searchQuery.status = status;
        }
        // Search filter
        if (search) {
            searchQuery.$or = [
                { name: { $regex: search, $options: 'i' } },
                { email: { $regex: search, $options: 'i' } },
                { title: { $regex: search, $options: 'i' } },
                { description: { $regex: search, $options: 'i' } }
            ];
        }
        const sortObj = {};
        sortObj[sortBy] = sortOrder === 'desc' ? -1 : 1;
        const reviews = await Review_1.default.find(searchQuery)
            .sort(sortObj)
            .skip(skip)
            .limit(limitNum)
            .lean();
        const totalReviews = await Review_1.default.countDocuments(searchQuery);
        // Get counts for each status
        const pendingCount = await Review_1.default.countDocuments({ status: 'pending' });
        const approvedCount = await Review_1.default.countDocuments({ status: 'approved' });
        const rejectedCount = await Review_1.default.countDocuments({ status: 'rejected' });
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
    }
    catch (error) {
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
exports.getReviewById = (0, express_async_handler_1.default)(async (req, res) => {
    try {
        const { reviewId } = req.params;
        if (!mongoose_1.default.Types.ObjectId.isValid(reviewId)) {
            res.status(400).json({ message: 'Invalid review ID' });
            return;
        }
        const review = await Review_1.default.findById(reviewId).lean();
        if (!review) {
            res.status(404).json({ message: 'Review not found' });
            return;
        }
        res.status(200).json({
            message: 'Review retrieved successfully',
            status: 200,
            review
        });
    }
    catch (error) {
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
exports.updateReview = (0, express_async_handler_1.default)(async (req, res) => {
    try {
        const { reviewId } = req.params;
        const { name, email, phone, rating, title, description, status } = req.body;
        if (!mongoose_1.default.Types.ObjectId.isValid(reviewId)) {
            res.status(400).json({ message: 'Invalid review ID' });
            return;
        }
        const review = await Review_1.default.findById(reviewId);
        if (!review) {
            res.status(404).json({ message: 'Review not found' });
            return;
        }
        // Update fields if provided
        if (name)
            review.name = name;
        if (email)
            review.email = email;
        if (phone !== undefined)
            review.phone = phone;
        if (rating) {
            const ratingNum = Number(rating);
            if (ratingNum < 1 || ratingNum > 5) {
                res.status(400).json({ message: 'Rating must be between 1 and 5' });
                return;
            }
            review.rating = ratingNum;
        }
        if (title)
            review.title = title;
        if (description)
            review.description = description;
        if (status && ['pending', 'approved', 'rejected'].includes(status)) {
            review.status = status;
        }
        await review.save();
        res.status(200).json({
            message: 'Review updated successfully',
            status: 200,
            review
        });
    }
    catch (error) {
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
exports.deleteReview = (0, express_async_handler_1.default)(async (req, res) => {
    try {
        const { reviewId } = req.params;
        if (!mongoose_1.default.Types.ObjectId.isValid(reviewId)) {
            res.status(400).json({ message: 'Invalid review ID' });
            return;
        }
        const review = await Review_1.default.findByIdAndDelete(reviewId);
        if (!review) {
            res.status(404).json({ message: 'Review not found' });
            return;
        }
        res.status(200).json({
            message: 'Review deleted successfully',
            status: 200
        });
    }
    catch (error) {
        console.error('Error deleting review:', error);
        res.status(500).json({
            message: 'Failed to delete review',
            error: 'Internal server error'
        });
    }
});
