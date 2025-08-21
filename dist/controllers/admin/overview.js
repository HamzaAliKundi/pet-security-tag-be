"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.getOverview = void 0;
const express_async_handler_1 = __importDefault(require("express-async-handler"));
const User_1 = __importDefault(require("../../models/User"));
const Pet_1 = __importDefault(require("../../models/Pet"));
const UserPetTagOrder_1 = __importDefault(require("../../models/UserPetTagOrder"));
// Get admin overview statistics
exports.getOverview = (0, express_async_handler_1.default)(async (req, res) => {
    try {
        // Check if user is admin (you can add role-based middleware later)
        const user = req.user;
        // Get total count of users
        const totalUsers = await User_1.default.countDocuments();
        // Get count of active pets (pets that have been created after successful payment)
        const activePets = await Pet_1.default.countDocuments();
        // Get count of total orders
        const totalOrders = await UserPetTagOrder_1.default.countDocuments();
        // Get count of total revenue (sum of all successful payments)
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
        // Get count of successful orders
        const successfulOrders = await UserPetTagOrder_1.default.countDocuments({ paymentStatus: 'succeeded' });
        // Get count of pending orders
        const pendingOrders = await UserPetTagOrder_1.default.countDocuments({ paymentStatus: 'pending' });
        // Get count of failed orders
        const failedOrders = await UserPetTagOrder_1.default.countDocuments({ paymentStatus: 'failed' });
        res.status(200).json({
            message: 'Admin overview retrieved successfully',
            status: 200,
            overview: {
                users: {
                    total: totalUsers
                },
                pets: {
                    total: activePets
                },
                orders: {
                    total: totalOrders,
                    successful: successfulOrders,
                    pending: pendingOrders,
                    failed: failedOrders
                },
                revenue: {
                    total: totalRevenue,
                    currency: 'EUR'
                }
            }
        });
    }
    catch (error) {
        console.error('Error getting admin overview:', error);
        res.status(500).json({
            message: 'Failed to get admin overview',
            error: 'Internal server error'
        });
    }
});
