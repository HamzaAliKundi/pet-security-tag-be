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
const PetTagOrder_1 = __importDefault(require("../../models/PetTagOrder"));
// Get admin overview statistics
exports.getOverview = (0, express_async_handler_1.default)(async (req, res) => {
    try {
        // Check if user is admin (you can add role-based middleware later)
        const user = req.user;
        // Get total count of users
        const totalUsers = await User_1.default.countDocuments();
        // Get count of active pets (pets that have been created after successful payment)
        const activePets = await Pet_1.default.countDocuments();
        // Get count of total orders from both models
        const [userTotalOrders, petTotalOrders] = await Promise.all([
            UserPetTagOrder_1.default.countDocuments(),
            PetTagOrder_1.default.countDocuments()
        ]);
        const totalOrders = userTotalOrders + petTotalOrders;
        // Get count of total revenue from both models
        const [userRevenueData, petRevenueData] = await Promise.all([
            UserPetTagOrder_1.default.aggregate([
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
            ]),
            PetTagOrder_1.default.aggregate([
                {
                    $group: {
                        _id: null,
                        totalRevenue: { $sum: '$totalCostEuro' }
                    }
                }
            ])
        ]);
        const userRevenue = userRevenueData.length > 0 ? userRevenueData[0].totalRevenue : 0;
        const petRevenue = petRevenueData.length > 0 ? petRevenueData[0].totalRevenue : 0;
        const totalRevenue = userRevenue + petRevenue;
        // Get count of successful orders from both models
        const [userSuccessfulOrders, petSuccessfulOrders] = await Promise.all([
            UserPetTagOrder_1.default.countDocuments({ paymentStatus: 'succeeded' }),
            PetTagOrder_1.default.countDocuments() // All PetTagOrder orders are considered successful
        ]);
        const successfulOrders = userSuccessfulOrders + petSuccessfulOrders;
        // Get count of pending orders (only from UserPetTagOrder since PetTagOrder doesn't have paymentStatus)
        const pendingOrders = await UserPetTagOrder_1.default.countDocuments({ paymentStatus: 'pending' });
        // Get count of failed orders (only from UserPetTagOrder since PetTagOrder doesn't have paymentStatus)
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
