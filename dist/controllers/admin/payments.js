"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.getPaymentStats = exports.getPaymentById = exports.getPayments = void 0;
const express_async_handler_1 = __importDefault(require("express-async-handler"));
const UserPetTagOrder_1 = __importDefault(require("../../models/UserPetTagOrder"));
// Get all payments with search, filtering, and pagination
exports.getPayments = (0, express_async_handler_1.default)(async (req, res) => {
    try {
        const { page = 1, limit = 10, search = '', status = 'all', sortBy = 'createdAt', sortOrder = 'desc' } = req.query;
        const pageNum = parseInt(page);
        const limitNum = parseInt(limit);
        const skip = (pageNum - 1) * limitNum;
        // Build search query
        let searchQuery = {};
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
            }
            else if (status === 'Pending') {
                searchQuery.paymentStatus = 'pending';
            }
            else if (status === 'Failed') {
                searchQuery.paymentStatus = 'failed';
            }
            else if (status === 'Refunded') {
                searchQuery.paymentStatus = 'cancelled';
            }
        }
        // Build sort object
        const sortObj = {};
        sortObj[sortBy] = sortOrder === 'desc' ? -1 : 1;
        // Execute query with pagination and populate user info
        const payments = await UserPetTagOrder_1.default.find(searchQuery)
            .populate('userId', 'firstName lastName email')
            .sort(sortObj)
            .skip(skip)
            .limit(limitNum)
            .lean();
        // Get total count for pagination
        const totalPayments = await UserPetTagOrder_1.default.countDocuments(searchQuery);
        // Transform payments data to match frontend requirements
        const transformedPayments = payments.map((payment) => {
            const user = payment.userId;
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
    }
    catch (error) {
        console.error('Error getting payments:', error);
        res.status(500).json({
            message: 'Failed to get payments',
            error: 'Internal server error'
        });
    }
});
// Get single payment by ID
exports.getPaymentById = (0, express_async_handler_1.default)(async (req, res) => {
    try {
        const { paymentId } = req.params;
        const payment = await UserPetTagOrder_1.default.findById(paymentId)
            .populate('userId', 'firstName lastName email')
            .lean();
        if (!payment) {
            res.status(404).json({
                message: 'Payment not found',
                error: 'Payment does not exist'
            });
            return;
        }
        const user = payment.userId;
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
    }
    catch (error) {
        console.error('Error getting payment:', error);
        res.status(500).json({
            message: 'Failed to get payment',
            error: 'Internal server error'
        });
    }
});
// Get payment statistics
exports.getPaymentStats = (0, express_async_handler_1.default)(async (req, res) => {
    try {
        const totalTransactions = await UserPetTagOrder_1.default.countDocuments();
        // Calculate total revenue from successful payments (same approach as overview endpoint)
        const revenueData = await UserPetTagOrder_1.default.aggregate([
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
        const pendingData = await UserPetTagOrder_1.default.aggregate([
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
    }
    catch (error) {
        console.error('Error getting payment statistics:', error);
        res.status(500).json({
            message: 'Failed to get payment statistics',
            error: 'Internal server error'
        });
    }
});
