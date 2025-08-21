"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.getAdminMe = void 0;
const express_async_handler_1 = __importDefault(require("express-async-handler"));
const User_1 = __importDefault(require("../../models/User"));
// Get current admin session information
exports.getAdminMe = (0, express_async_handler_1.default)(async (req, res) => {
    try {
        // Get user from auth middleware (JWT token data)
        const user = req.user;
        if (!user) {
            res.status(401).json({
                message: 'Unauthorized',
                error: 'No user found in session'
            });
            return;
        }
        // Debug: Log what we're getting from the auth middleware
        console.log('Auth middleware user:', user);
        console.log('User ID from auth:', user._id);
        // Since the JWT token contains _id and role, but we need email and name
        // Let's get the user details from the database using the JWT token _id
        const userDetails = await User_1.default.findById(user._id).select('firstName lastName email role');
        if (!userDetails) {
            res.status(404).json({
                message: 'User not found',
                error: 'User does not exist'
            });
            return;
        }
        // Debug: Log what we found in database
        console.log('Database user details:', userDetails);
        res.status(200).json({
            message: 'Admin session retrieved successfully',
            status: 200,
            admin: {
                id: userDetails._id,
                name: `${userDetails.firstName} ${userDetails.lastName}`,
                email: userDetails.email,
                role: userDetails.role
            }
        });
    }
    catch (error) {
        console.error('Error getting admin session:', error);
        res.status(500).json({
            message: 'Failed to get admin session',
            error: 'Internal server error'
        });
    }
});
