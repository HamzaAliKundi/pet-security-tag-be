"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
Object.defineProperty(exports, "__esModule", { value: true });
const mongoose_1 = __importStar(require("mongoose"));
const PaymentSchema = new mongoose_1.Schema({
    userId: {
        type: mongoose_1.Schema.Types.ObjectId,
        ref: 'User',
        required: true,
        index: true,
    },
    subscriptionId: {
        type: mongoose_1.Schema.Types.ObjectId,
        ref: 'Subscription',
        required: false,
        index: true,
    },
    qrCodeId: {
        type: mongoose_1.Schema.Types.ObjectId,
        ref: 'QRCode',
        required: false,
    },
    status: {
        type: String,
        enum: ['succeeded', 'failed'],
        required: true,
        index: true,
    },
    paymentType: {
        type: String,
        enum: ['subscription'],
        default: 'subscription',
        required: true,
    },
    source: {
        type: String,
        enum: ['api_confirm', 'stripe_webhook'],
        required: true,
        index: true,
    },
    amount: {
        type: Number,
        required: true,
        min: 0,
    },
    currency: {
        type: String,
        required: true,
        lowercase: true,
        trim: true,
    },
    action: {
        type: String,
        enum: ['renewal', 'upgrade', 'new_subscription'],
        required: false,
    },
    subscriptionType: {
        type: String,
        enum: ['monthly', 'yearly', 'lifetime'],
        required: false,
    },
    paymentIntentId: {
        type: String,
        trim: true,
        index: true,
    },
    stripeSubscriptionId: {
        type: String,
        trim: true,
        index: true,
    },
    stripeInvoiceId: {
        type: String,
        trim: true,
        index: true,
    },
    stripeEventId: {
        type: String,
        trim: true,
        index: true,
    },
    attemptCount: {
        type: Number,
        required: false,
        min: 0,
    },
    failureReason: {
        type: String,
        trim: true,
        required: false,
    },
    metadata: {
        type: mongoose_1.Schema.Types.Mixed,
        required: false,
    },
}, {
    timestamps: true,
});
PaymentSchema.index({ userId: 1, createdAt: -1 });
PaymentSchema.index({ subscriptionId: 1, createdAt: -1 });
exports.default = mongoose_1.default.model('Payment', PaymentSchema);
