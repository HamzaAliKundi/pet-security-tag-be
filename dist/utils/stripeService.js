"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.getStripePublishKey = exports.confirmPaymentIntent = exports.createSubscriptionPaymentIntent = exports.createPaymentIntent = void 0;
const stripe_1 = __importDefault(require("stripe"));
const env_1 = require("../config/env");
// Initialize Stripe with secret key
const stripe = new stripe_1.default(env_1.env.STRIPE_SECRET_KEY, {
    apiVersion: '2025-07-30.basil', // Use latest stable API version
});
const createPaymentIntent = async (params) => {
    try {
        const paymentIntent = await stripe.paymentIntents.create({
            amount: params.amount,
            currency: params.currency,
            metadata: params.metadata,
            automatic_payment_methods: {
                enabled: true,
            },
        });
        return {
            success: true,
            paymentIntentId: paymentIntent.id,
            clientSecret: paymentIntent.client_secret || undefined,
        };
    }
    catch (error) {
        console.error('Error creating payment intent:', error);
        return {
            success: false,
            error: error instanceof Error ? error.message : 'Unknown error occurred',
        };
    }
};
exports.createPaymentIntent = createPaymentIntent;
const createSubscriptionPaymentIntent = async (params) => {
    try {
        const paymentIntent = await stripe.paymentIntents.create({
            amount: params.amount,
            currency: params.currency,
            metadata: params.metadata,
            automatic_payment_methods: {
                enabled: true,
            },
        });
        return {
            success: true,
            paymentIntentId: paymentIntent.id,
            clientSecret: paymentIntent.client_secret || undefined,
        };
    }
    catch (error) {
        console.error('Error creating subscription payment intent:', error);
        return {
            success: false,
            error: error instanceof Error ? error.message : 'Unknown error occurred',
        };
    }
};
exports.createSubscriptionPaymentIntent = createSubscriptionPaymentIntent;
const confirmPaymentIntent = async (paymentIntentId) => {
    try {
        const paymentIntent = await stripe.paymentIntents.retrieve(paymentIntentId);
        return paymentIntent.status === 'succeeded';
    }
    catch (error) {
        console.error('Error confirming payment intent:', error);
        return false;
    }
};
exports.confirmPaymentIntent = confirmPaymentIntent;
const getStripePublishKey = () => {
    return env_1.env.STRIPE_PUBLISH_KEY;
};
exports.getStripePublishKey = getStripePublishKey;
