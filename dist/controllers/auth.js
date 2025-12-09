"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.resetPassword = exports.sendForgotPasswordEmail = exports.verifyEmail = exports.login = exports.register = void 0;
const bcryptjs_1 = __importDefault(require("bcryptjs"));
const User_1 = __importDefault(require("../models/User"));
const Referral_1 = __importDefault(require("../models/Referral"));
const env_1 = require("../config/env");
const express_async_handler_1 = __importDefault(require("express-async-handler"));
const emailService_1 = require("../utils/emailService");
const jwt_1 = require("../utils/jwt");
const referralCode_1 = require("../utils/referralCode");
const rewardRedemption_1 = require("../utils/rewardRedemption");
exports.register = (0, express_async_handler_1.default)(async (req, res) => {
    const { email, password, firstName, lastName, referralCode: incomingReferralCode } = req.body;
    const existingUser = await User_1.default.findOne({ email });
    if (existingUser) {
        res.status(400).json({ message: 'User already exists' });
        return;
    }
    const salt = await bcryptjs_1.default.genSalt(env_1.env.SALT_ROUNDS);
    const hashedPassword = await bcryptjs_1.default.hash(password, salt);
    // Generate unique referral code for new user
    let userReferralCode = (0, referralCode_1.generateReferralCode)();
    let isUniqueCode = false;
    while (!isUniqueCode) {
        const existingCode = await User_1.default.findOne({ referralCode: userReferralCode });
        if (!existingCode) {
            isUniqueCode = true;
        }
        else {
            userReferralCode = (0, referralCode_1.generateReferralCode)();
        }
    }
    // Handle referral code if provided
    let referredByUserId = null;
    if (incomingReferralCode) {
        const referrer = await User_1.default.findOne({ referralCode: incomingReferralCode });
        if (referrer && referrer._id) {
            referredByUserId = referrer._id;
        }
    }
    const user = await User_1.default.create({
        email,
        password: hashedPassword,
        firstName,
        lastName,
        isEmailVerified: false,
        referralCode: userReferralCode,
        loyaltyPoints: referredByUserId ? 100 : 0, // New user gets 100 points if referred
        referredBy: referredByUserId
    });
    // Award points to referrer and create referral record
    if (referredByUserId) {
        try {
            const referrer = await User_1.default.findById(referredByUserId);
            if (referrer) {
                // Award 100 points to referrer
                referrer.loyaltyPoints = (referrer.loyaltyPoints || 0) + 100;
                await referrer.save();
                // Check for reward redemptions after awarding points
                await (0, rewardRedemption_1.checkAndCreateRewardRedemption)(referrer._id.toString());
                // Create referral record
                await Referral_1.default.create({
                    referrerId: referrer._id,
                    referredUserId: user._id,
                    pointsAwarded: 100,
                    referralCodeUsed: incomingReferralCode
                });
            }
        }
        catch (referralError) {
            console.error('Error processing referral:', referralError);
            // Don't fail registration if referral processing fails
        }
    }
    const token = (0, jwt_1.generateVerificationToken)(user);
    // Send verification email (non-blocking)
    try {
        await (0, emailService_1.sendVerificationEmail)(email, firstName, token);
    }
    catch (emailError) {
        console.error('Failed to send verification email:', emailError);
        // Don't fail the registration if email fails
    }
    res.status(201).json({
        message: 'User registered successfully. Please check your email to verify your account.',
        status: 201,
        token,
        user: {
            _id: user._id,
            email: user.email,
            firstName: user.firstName,
            lastName: user.lastName,
            role: user.role,
            isEmailVerified: user.isEmailVerified
        }
    });
});
exports.login = (0, express_async_handler_1.default)(async (req, res) => {
    const { email, password } = req.body;
    const user = await User_1.default.findOne({ email });
    if (!user) {
        res.status(400).json({ message: 'Invalid credentials' });
        return;
    }
    if (!user.isEmailVerified) {
        res.status(400).json({ message: 'Email not verified' });
        return;
    }
    const isPasswordValid = await bcryptjs_1.default.compare(password, user.password);
    if (!isPasswordValid) {
        res.status(400).json({ message: 'Invalid credentials' });
        return;
    }
    const token = (0, jwt_1.generateToken)(user);
    res.status(200).json({
        message: 'Login successful',
        status: 200,
        token,
        user: {
            _id: user._id,
            email: user.email,
            firstName: user.firstName,
            lastName: user.lastName,
            role: user.role
        }
    });
});
exports.verifyEmail = (0, express_async_handler_1.default)(async (req, res) => {
    const { token } = req.body;
    try {
        const decoded = (0, jwt_1.verifyToken)(token);
        const user = await User_1.default.findById(decoded._id);
        if (!user) {
            res.status(400).json({ message: 'User not found' });
            return;
        }
        if (user.isEmailVerified) {
            res.status(400).json({ message: 'Email already verified' });
            return;
        }
        user.isEmailVerified = true;
        await user.save();
        res.status(200).json({
            message: 'Email verified successfully',
            status: 200
        });
    }
    catch (error) {
        res.status(400).json({ message: 'Token expired or invalid' });
        return;
    }
});
exports.sendForgotPasswordEmail = (0, express_async_handler_1.default)(async (req, res) => {
    const { email } = req.body;
    const user = await User_1.default.findOne({ email });
    if (!user) {
        res.status(400).json({ message: 'User not found' });
        return;
    }
    const token = (0, jwt_1.generateForgotPasswordToken)(user);
    // Send password reset email (non-blocking)
    try {
        await (0, emailService_1.sendPasswordResetEmail)(email, user === null || user === void 0 ? void 0 : user.firstName, token);
    }
    catch (emailError) {
        console.error('Failed to send password reset email:', emailError);
        // Don't fail the request if email fails
    }
    res.status(200).json({
        message: 'Forgot password email sent successfully',
        status: 200
    });
});
exports.resetPassword = (0, express_async_handler_1.default)(async (req, res) => {
    const { token, password } = req.body;
    try {
        const decoded = (0, jwt_1.verifyToken)(token);
        const user = await User_1.default.findById(decoded._id);
        if (!user) {
            res.status(400).json({ message: 'User not found' });
            return;
        }
        const salt = await bcryptjs_1.default.genSalt(env_1.env.SALT_ROUNDS);
        const hashedPassword = await bcryptjs_1.default.hash(password, salt);
        user.password = hashedPassword;
        await user.save();
        res.status(200).json({
            message: 'Password reset successfully',
            status: 200
        });
    }
    catch (error) {
        res.status(400).json({ message: 'Token expired or invalid' });
        return;
    }
});
