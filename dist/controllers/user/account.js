"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.deleteAccount = exports.updateSingleUser = exports.getSingleUser = void 0;
const express_async_handler_1 = __importDefault(require("express-async-handler"));
const User_1 = __importDefault(require("../../models/User"));
const Pet_1 = __importDefault(require("../../models/Pet"));
const UserPetTagOrder_1 = __importDefault(require("../../models/UserPetTagOrder"));
const Subscription_1 = __importDefault(require("../../models/Subscription"));
const QRCode_1 = __importDefault(require("../../models/QRCode"));
const emailService_1 = require("../../utils/emailService");
// Get single user (Private)
exports.getSingleUser = (0, express_async_handler_1.default)(async (req, res) => {
    var _a;
    // Assuming the user ID comes from the auth middleware (req.user.id)
    const userId = (_a = req.user) === null || _a === void 0 ? void 0 : _a.id;
    if (!userId) {
        res.status(401).json({ message: 'User not authenticated' });
        return;
    }
    const user = await User_1.default.findById(userId).select('firstName lastName email phone');
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
            email: user.email,
            phone: user.phone
        }
    });
});
// Update single user (Private)
exports.updateSingleUser = (0, express_async_handler_1.default)(async (req, res) => {
    var _a;
    // Assuming the user ID comes from the auth middleware (req.user.id)
    const userId = (_a = req.user) === null || _a === void 0 ? void 0 : _a.id;
    const { firstName, lastName, email, phone } = req.body;
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
    // Validate phone format if provided (should start with + and contain digits)
    if (phone && phone.trim() !== '') {
        const phoneRegex = /^\+[\d\s\-()]+$/;
        if (!phoneRegex.test(phone.trim())) {
            res.status(400).json({
                message: 'Invalid phone number format. Phone number must include country code (e.g., +1234567890)'
            });
            return;
        }
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
    // Prepare update object
    const updateData = {
        firstName: firstName.trim(),
        lastName: lastName.trim(),
        email: email.toLowerCase().trim()
    };
    // Add phone if provided, or set to undefined to clear it
    if (phone !== undefined) {
        updateData.phone = phone.trim() === '' ? undefined : phone.trim();
    }
    // Update user
    const updatedUser = await User_1.default.findByIdAndUpdate(userId, updateData, {
        new: true,
        runValidators: true
    }).select('firstName lastName email phone');
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
            email: updatedUser.email,
            phone: updatedUser.phone
        }
    });
});
// Delete authenticated user's account (Private)
exports.deleteAccount = (0, express_async_handler_1.default)(async (req, res) => {
    var _a;
    const userId = (_a = req.user) === null || _a === void 0 ? void 0 : _a.id;
    if (!userId) {
        res.status(401).json({ message: 'User not authenticated' });
        return;
    }
    const existingUser = await User_1.default.findById(userId);
    if (!existingUser) {
        res.status(404).json({ message: 'User not found' });
        return;
    }
    // Check for subscriptions before deletion
    const subscriptions = await Subscription_1.default.find({ userId });
    const hasSubscription = subscriptions.length > 0;
    const hasLifetimePlan = subscriptions.some(sub => sub.type === 'lifetime');
    // Prepare customer name
    const customerName = existingUser.firstName
        ? `${existingUser.firstName}${existingUser.lastName ? ' ' + existingUser.lastName : ''}`
        : existingUser.email.split('@')[0] || 'Customer';
    // Send account deletion email (non-blocking)
    if (existingUser.email) {
        try {
            await (0, emailService_1.sendAccountDeletedEmail)(existingUser.email, {
                customerName,
                hasSubscription,
                hasLifetimePlan
            });
        }
        catch (emailError) {
            console.error('Failed to send account deletion email:', emailError);
            // Don't fail the account deletion if email fails
        }
    }
    // Reset any QR codes linked to this user
    await QRCode_1.default.updateMany({ assignedUserId: userId }, {
        $set: {
            assignedUserId: null,
            assignedOrderId: null,
            assignedPetId: null,
            hasGiven: false,
            hasVerified: false,
            status: 'unassigned',
            isDownloaded: false,
            downloadedAt: null,
            lastScannedAt: null,
            scannedCount: 0
        }
    });
    // Remove user-related data
    await Promise.all([
        Pet_1.default.deleteMany({ userId }),
        UserPetTagOrder_1.default.deleteMany({ userId }),
        Subscription_1.default.deleteMany({ userId })
    ]);
    await User_1.default.findByIdAndDelete(userId);
    res.status(200).json({
        message: 'Account deleted successfully',
        status: 200
    });
});
