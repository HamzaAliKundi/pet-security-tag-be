"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.validateDiscount = void 0;
const express_async_handler_1 = __importDefault(require("express-async-handler"));
const Discount_1 = __importDefault(require("../../models/Discount"));
// Validate discount code (public endpoint)
exports.validateDiscount = (0, express_async_handler_1.default)(async (req, res) => {
    try {
        const { code } = req.body;
        if (!code || typeof code !== 'string' || code.trim().length === 0) {
            res.status(400).json({
                message: 'Discount code is required',
                status: 400,
                valid: false
            });
            return;
        }
        // Find discount by code (case-sensitive - exact match)
        const discount = await Discount_1.default.findOne({
            code: code.trim()
        });
        if (!discount) {
            res.status(404).json({
                message: 'Invalid discount code',
                status: 404,
                valid: false
            });
            return;
        }
        if (!discount.isActive) {
            res.status(400).json({
                message: 'Discount code is not active.',
                status: 400,
                valid: false
            });
            return;
        }
        res.status(200).json({
            message: 'Discount code is valid',
            status: 200,
            valid: true,
            discount: {
                code: discount.code,
                isActive: discount.isActive
            }
        });
    }
    catch (error) {
        console.error('Error validating discount:', error);
        res.status(500).json({
            message: 'Failed to validate discount code',
            error: 'Internal server error',
            valid: false
        });
    }
});
