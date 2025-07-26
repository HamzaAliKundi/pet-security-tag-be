"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.updateSingleUser = exports.getSingleUser = void 0;
const express_async_handler_1 = __importDefault(require("express-async-handler"));
const User_1 = __importDefault(require("../../models/User"));
// Get single user (Private)
exports.getSingleUser = (0, express_async_handler_1.default)(async (req, res) => {
    var _a;
    // Assuming the user ID comes from the auth middleware (req.user.id)
    const userId = (_a = req.user) === null || _a === void 0 ? void 0 : _a.id;
    if (!userId) {
        res.status(401).json({ message: 'User not authenticated' });
        return;
    }
    const user = await User_1.default.findById(userId).select('firstName lastName email');
    if (!user) {
        res.status(404).json({ message: 'User not found' });
        return;
    }
    res.status(200).json({
        message: 'User retrieved successfully',
        status: 200,
        user: {
            _id: user._id,
            firstName: user.firstName,
            lastName: user.lastName,
            email: user.email
        }
    });
});
// Update single user (Private)
exports.updateSingleUser = (0, express_async_handler_1.default)(async (req, res) => {
    var _a;
    // Assuming the user ID comes from the auth middleware (req.user.id)
    const userId = (_a = req.user) === null || _a === void 0 ? void 0 : _a.id;
    const { firstName, lastName, email } = req.body;
    if (!userId) {
        res.status(401).json({ message: 'User not authenticated' });
        return;
    }
    // Validate required fields
    if (!firstName || !lastName || !email) {
        res.status(400).json({
            message: 'All fields are required: firstName, lastName, email'
        });
        return;
    }
    // Validate email format
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
        res.status(400).json({ message: 'Invalid email format' });
        return;
    }
    // Check if user exists
    const existingUser = await User_1.default.findById(userId);
    if (!existingUser) {
        res.status(404).json({ message: 'User not found' });
        return;
    }
    // Check if email is already taken by another user
    if (email !== existingUser.email) {
        const emailExists = await User_1.default.findOne({ email, _id: { $ne: userId } });
        if (emailExists) {
            res.status(400).json({ message: 'Email already exists' });
            return;
        }
    }
    // Update user
    const updatedUser = await User_1.default.findByIdAndUpdate(userId, {
        firstName: firstName.trim(),
        lastName: lastName.trim(),
        email: email.toLowerCase().trim()
    }, {
        new: true,
        runValidators: true
    }).select('firstName lastName email');
    if (!updatedUser) {
        res.status(404).json({ message: 'User not found' });
        return;
    }
    res.status(200).json({
        message: 'User updated successfully',
        status: 200,
        user: {
            _id: updatedUser._id,
            firstName: updatedUser.firstName,
            lastName: updatedUser.lastName,
            email: updatedUser.email
        }
    });
});
