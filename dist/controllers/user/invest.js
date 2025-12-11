"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.updateInvestmentStatus = exports.getInvestmentById = exports.getAllInvestments = exports.submitInvestment = void 0;
const express_async_handler_1 = __importDefault(require("express-async-handler"));
const Investment_1 = __importDefault(require("../../models/Investment"));
// Submit an investment inquiry
exports.submitInvestment = (0, express_async_handler_1.default)(async (req, res) => {
    const { capitalAvailable, investorType, name, company, email, mobileNumber } = req.body;
    // Validate required fields
    if (!capitalAvailable || !investorType || !name || !email || !mobileNumber) {
        res.status(400).json({
            message: 'All required fields must be provided: capitalAvailable, investorType, name, email, mobileNumber'
        });
        return;
    }
    // Validate email format
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
        res.status(400).json({ message: 'Invalid email format' });
        return;
    }
    // Validate investor type
    if (!['individual', 'vc-company'].includes(investorType)) {
        res.status(400).json({ message: 'Invalid investor type. Must be "individual" or "vc-company"' });
        return;
    }
    // Validate capital available
    if (!['up-to-40000', 'up-to-100000', 'up-to-250000', 'over-250000'].includes(capitalAvailable)) {
        res.status(400).json({ message: 'Invalid capital range' });
        return;
    }
    // If VC company, company name should be provided
    if (investorType === 'vc-company' && !company) {
        res.status(400).json({ message: 'Company name is required for VC companies' });
        return;
    }
    // Create the investment submission
    const investment = await Investment_1.default.create({
        capitalAvailable,
        investorType,
        name,
        company: company || '',
        email,
        mobileNumber,
        isRead: false
    });
    res.status(201).json({
        message: 'Investment inquiry submitted successfully',
        status: 201,
        investment: {
            _id: investment._id,
            capitalAvailable: investment.capitalAvailable,
            investorType: investment.investorType,
            name: investment.name,
            company: investment.company,
            email: investment.email,
            mobileNumber: investment.mobileNumber,
            createdAt: investment.createdAt
        }
    });
});
// Get all investment inquiries (for admin use)
exports.getAllInvestments = (0, express_async_handler_1.default)(async (req, res) => {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 10;
    const search = req.query.search || '';
    const isRead = req.query.isRead;
    const skip = (page - 1) * limit;
    // Build query
    const query = {};
    const conditions = [];
    // Filter by isRead status
    if (isRead !== undefined && isRead !== 'all' && isRead !== '') {
        query.isRead = isRead === 'true';
    }
    // Add search functionality
    if (search && search.trim() !== '') {
        const searchConditions = [
            { name: { $regex: search, $options: 'i' } },
            { email: { $regex: search, $options: 'i' } },
            { company: { $regex: search, $options: 'i' } },
            { mobileNumber: { $regex: search, $options: 'i' } }
        ];
        // If we have both isRead filter and search, combine with $and
        if (query.isRead !== undefined) {
            conditions.push({ isRead: query.isRead });
            conditions.push({ $or: searchConditions });
            delete query.isRead;
            query.$and = conditions;
        }
        else {
            query.$or = searchConditions;
        }
    }
    // Get investments with pagination
    const investments = await Investment_1.default.find(query)
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(limit)
        .lean();
    const totalInvestments = await Investment_1.default.countDocuments(query);
    res.status(200).json({
        message: 'Investments retrieved successfully',
        status: 200,
        investments,
        pagination: {
            currentPage: page,
            totalPages: Math.ceil(totalInvestments / limit),
            totalInvestments,
            limit
        }
    });
});
// Get investment by ID
exports.getInvestmentById = (0, express_async_handler_1.default)(async (req, res) => {
    const { investmentId } = req.params;
    const investment = await Investment_1.default.findById(investmentId);
    if (!investment) {
        res.status(404).json({ message: 'Investment inquiry not found' });
        return;
    }
    res.status(200).json({
        message: 'Investment retrieved successfully',
        status: 200,
        investment
    });
});
// Update investment read status
exports.updateInvestmentStatus = (0, express_async_handler_1.default)(async (req, res) => {
    const { investmentId } = req.params;
    const { isRead } = req.body;
    const investment = await Investment_1.default.findById(investmentId);
    if (!investment) {
        res.status(404).json({ message: 'Investment inquiry not found' });
        return;
    }
    // Validate isRead - should be boolean
    if (typeof isRead !== 'boolean') {
        res.status(400).json({ message: 'isRead must be a boolean value' });
        return;
    }
    investment.isRead = isRead;
    await investment.save();
    res.status(200).json({
        message: 'Investment status updated successfully',
        status: 200,
        investment: {
            _id: investment._id,
            capitalAvailable: investment.capitalAvailable,
            investorType: investment.investorType,
            name: investment.name,
            company: investment.company,
            email: investment.email,
            mobileNumber: investment.mobileNumber,
            isRead: investment.isRead,
            createdAt: investment.createdAt,
            updatedAt: investment.updatedAt
        }
    });
});
