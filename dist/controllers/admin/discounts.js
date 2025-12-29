"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.deleteDiscount = exports.updateDiscount = exports.createDiscount = exports.getDiscountById = exports.getDiscounts = void 0;
const express_async_handler_1 = __importDefault(require("express-async-handler"));
const Discount_1 = __importDefault(require("../../models/Discount"));
// Get all discounts
exports.getDiscounts = (0, express_async_handler_1.default)(async (req, res) => {
    try {
        const discounts = await Discount_1.default.find().sort({ createdAt: -1 });
        res.status(200).json({
            message: 'Discounts retrieved successfully',
            status: 200,
            discounts
        });
    }
    catch (error) {
        console.error('Error getting discounts:', error);
        res.status(500).json({
            message: 'Failed to get discounts',
            error: 'Internal server error'
        });
    }
});
// Get single discount by ID
exports.getDiscountById = (0, express_async_handler_1.default)(async (req, res) => {
    try {
        const { discountId } = req.params;
        const discount = await Discount_1.default.findById(discountId);
        if (!discount) {
            res.status(404).json({
                message: 'Discount not found',
                status: 404
            });
            return;
        }
        res.status(200).json({
            message: 'Discount retrieved successfully',
            status: 200,
            discount
        });
    }
    catch (error) {
        console.error('Error getting discount:', error);
        res.status(500).json({
            message: 'Failed to get discount',
            error: 'Internal server error'
        });
    }
});
// Create new discount
exports.createDiscount = (0, express_async_handler_1.default)(async (req, res) => {
    try {
        const { code } = req.body;
        if (!code || typeof code !== 'string' || code.trim().length === 0) {
            res.status(400).json({
                message: 'Discount code is required',
                status: 400
            });
            return;
        }
        // Check if discount code already exists
        const existingDiscount = await Discount_1.default.findOne({
            code: code.trim().toUpperCase()
        });
        if (existingDiscount) {
            res.status(409).json({
                message: 'Discount code already exists',
                status: 409
            });
            return;
        }
        const discount = new Discount_1.default({
            code: code.trim().toUpperCase(),
            isActive: true
        });
        await discount.save();
        res.status(201).json({
            message: 'Discount created successfully',
            status: 201,
            discount
        });
    }
    catch (error) {
        console.error('Error creating discount:', error);
        if (error.code === 11000) {
            res.status(409).json({
                message: 'Discount code already exists',
                status: 409
            });
            return;
        }
        res.status(500).json({
            message: 'Failed to create discount',
            error: 'Internal server error'
        });
    }
});
// Update discount
exports.updateDiscount = (0, express_async_handler_1.default)(async (req, res) => {
    try {
        const { discountId } = req.params;
        const { code, isActive } = req.body;
        const discount = await Discount_1.default.findById(discountId);
        if (!discount) {
            res.status(404).json({
                message: 'Discount not found',
                status: 404
            });
            return;
        }
        // If code is being updated, check for duplicates
        if (code && code.trim() !== discount.code) {
            const existingDiscount = await Discount_1.default.findOne({
                code: code.trim().toUpperCase(),
                _id: { $ne: discountId }
            });
            if (existingDiscount) {
                res.status(409).json({
                    message: 'Discount code already exists',
                    status: 409
                });
                return;
            }
            discount.code = code.trim().toUpperCase();
        }
        if (typeof isActive === 'boolean') {
            discount.isActive = isActive;
        }
        await discount.save();
        res.status(200).json({
            message: 'Discount updated successfully',
            status: 200,
            discount
        });
    }
    catch (error) {
        console.error('Error updating discount:', error);
        if (error.code === 11000) {
            res.status(409).json({
                message: 'Discount code already exists',
                status: 409
            });
            return;
        }
        res.status(500).json({
            message: 'Failed to update discount',
            error: 'Internal server error'
        });
    }
});
// Delete discount
exports.deleteDiscount = (0, express_async_handler_1.default)(async (req, res) => {
    try {
        const { discountId } = req.params;
        const discount = await Discount_1.default.findByIdAndDelete(discountId);
        if (!discount) {
            res.status(404).json({
                message: 'Discount not found',
                status: 404
            });
            return;
        }
        res.status(200).json({
            message: 'Discount deleted successfully',
            status: 200
        });
    }
    catch (error) {
        console.error('Error deleting discount:', error);
        res.status(500).json({
            message: 'Failed to delete discount',
            error: 'Internal server error'
        });
    }
});
