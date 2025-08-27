"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.getPaymentStats = exports.getPaymentById = exports.getPayments = void 0;
const express_async_handler_1 = __importDefault(require("express-async-handler"));
const UserPetTagOrder_1 = __importDefault(require("../../models/UserPetTagOrder"));
const PetTagOrder_1 = __importDefault(require("../../models/PetTagOrder"));
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
        // Execute queries for both models
        const [userPayments, petPayments] = await Promise.all([
            UserPetTagOrder_1.default.find(searchQuery)
                .populate('userId', 'firstName lastName email')
                .sort(sortObj)
                .lean(),
            PetTagOrder_1.default.find(searchQuery)
                .sort(sortObj)
                .lean()
        ]);
        // Combine and sort all payments
        let allPayments = [...userPayments, ...petPayments];
        // Sort combined payments
        allPayments.sort((a, b) => {
            const aValue = a[sortBy];
            const bValue = b[sortBy];
            if (sortOrder === 'desc') {
                return new Date(bValue).getTime() - new Date(aValue).getTime();
            }
            else {
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
            var _a, _b, _c, _d, _e;
            // Check if it's a UserPetTagOrder (has userId) or PetTagOrder (has email/name)
            if (payment.userId) {
                // UserPetTagOrder
                const user = payment.userId;
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
            }
            else {
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
                    street: ((_a = payment.shippingAddress) === null || _a === void 0 ? void 0 : _a.street) || '',
                    city: ((_b = payment.shippingAddress) === null || _b === void 0 ? void 0 : _b.city) || '',
                    state: ((_c = payment.shippingAddress) === null || _c === void 0 ? void 0 : _c.state) || '',
                    zipCode: ((_d = payment.shippingAddress) === null || _d === void 0 ? void 0 : _d.zipCode) || '',
                    country: ((_e = payment.shippingAddress) === null || _e === void 0 ? void 0 : _e.country) || '',
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
    var _a, _b, _c, _d, _e;
    try {
        const { paymentId } = req.params;
        // Search in both models
        let payment = await UserPetTagOrder_1.default.findById(paymentId)
            .populate('userId', 'firstName lastName email')
            .lean();
        let paymentType = 'UserPetTagOrder';
        if (!payment) {
            // If not found in UserPetTagOrder, search in PetTagOrder
            payment = await PetTagOrder_1.default.findById(paymentId).lean();
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
            const user = payment.userId;
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
        }
        else {
            // PetTagOrder
            const petPayment = payment;
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
                street: ((_a = petPayment.shippingAddress) === null || _a === void 0 ? void 0 : _a.street) || '',
                city: ((_b = petPayment.shippingAddress) === null || _b === void 0 ? void 0 : _b.city) || '',
                state: ((_c = petPayment.shippingAddress) === null || _c === void 0 ? void 0 : _c.state) || '',
                zipCode: ((_d = petPayment.shippingAddress) === null || _d === void 0 ? void 0 : _d.zipCode) || '',
                country: ((_e = petPayment.shippingAddress) === null || _e === void 0 ? void 0 : _e.country) || '',
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
        // Get counts from both models
        const [userTotalTransactions, petTotalTransactions] = await Promise.all([
            UserPetTagOrder_1.default.countDocuments(),
            PetTagOrder_1.default.countDocuments()
        ]);
        const totalTransactions = userTotalTransactions + petTotalTransactions;
        // Calculate total revenue from successful payments (UserPetTagOrder has paymentStatus)
        const userRevenueData = await UserPetTagOrder_1.default.aggregate([
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
        const petRevenueData = await PetTagOrder_1.default.aggregate([
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
        const userPendingData = await UserPetTagOrder_1.default.aggregate([
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
        const petPendingData = await PetTagOrder_1.default.aggregate([
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
    }
    catch (error) {
        console.error('Error getting payment statistics:', error);
        res.status(500).json({
            message: 'Failed to get payment statistics',
            error: 'Internal server error'
        });
    }
});
