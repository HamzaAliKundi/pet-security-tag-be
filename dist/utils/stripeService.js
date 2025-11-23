"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.updateStripeSubscription = exports.cancelStripeSubscription = exports.getStripeSubscription = exports.createStripeSubscription = exports.getOrCreateCustomer = exports.getStripePublishKey = exports.confirmPaymentIntent = exports.savePaymentMethodToCustomer = exports.createSubscriptionPaymentIntent = exports.createPaymentIntent = void 0;
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
        const paymentIntentParams = {
            amount: params.amount,
            currency: params.currency,
            metadata: params.metadata,
            automatic_payment_methods: {
                enabled: true,
            },
        };
        // If customer ID is provided in metadata and we want to save the card for future use
        // Note: setup_future_usage requires the payment method to be attached during confirmation
        // We'll handle this in the frontend by creating a payment method first
        const paymentIntent = await stripe.paymentIntents.create(paymentIntentParams);
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
/**
 * Attach payment method to customer and set as default
 * Use this for upgrades/renewals when you want to save the card
 */
const savePaymentMethodToCustomer = async (paymentMethodId, customerId) => {
    try {
        // Attach payment method to customer
        await stripe.paymentMethods.attach(paymentMethodId, {
            customer: customerId,
        });
        // Set as default payment method
        await stripe.customers.update(customerId, {
            invoice_settings: {
                default_payment_method: paymentMethodId,
            },
        });
        return { success: true };
    }
    catch (error) {
        console.error('Error saving payment method to customer:', error);
        return {
            success: false,
            error: error instanceof Error ? error.message : 'Unknown error occurred',
        };
    }
};
exports.savePaymentMethodToCustomer = savePaymentMethodToCustomer;
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
/**
 * Create or retrieve a Stripe customer
 */
const getOrCreateCustomer = async (email, name, metadata) => {
    try {
        // Check if customer already exists
        const existingCustomers = await stripe.customers.list({
            email: email,
            limit: 1,
        });
        if (existingCustomers.data.length > 0) {
            return { customerId: existingCustomers.data[0].id };
        }
        // Create new customer
        const customer = await stripe.customers.create({
            email,
            name,
            metadata,
        });
        return { customerId: customer.id };
    }
    catch (error) {
        console.error('Error creating/retrieving Stripe customer:', error);
        return {
            error: error instanceof Error ? error.message : 'Unknown error occurred',
        };
    }
};
exports.getOrCreateCustomer = getOrCreateCustomer;
/**
 * Create a Stripe Subscription for auto-renewal
 * This replaces the one-time Payment Intent approach
 */
const createStripeSubscription = async (params) => {
    try {
        // Get or create customer
        const customerResult = params.customerId
            ? { customerId: params.customerId }
            : await (0, exports.getOrCreateCustomer)(params.customerEmail, params.customerName, {
                userId: params.metadata.userId,
            });
        if ('error' in customerResult) {
            return {
                success: false,
                error: customerResult.error,
            };
        }
        const customerId = customerResult.customerId;
        // Determine price configuration
        let priceData;
        if (params.priceId) {
            // Use existing price
            priceData = { price: params.priceId };
        }
        else {
            // Create price on the fly
            priceData = {
                currency: params.currency,
                unit_amount: params.amount,
                recurring: {
                    interval: params.interval,
                },
                product_data: {
                    name: `Pet Security Tag ${params.interval === 'month' ? 'Monthly' : 'Yearly'} Subscription`,
                },
            };
        }
        // Create subscription
        const subscriptionParams = {
            customer: customerId,
            items: [{ price_data: priceData }],
            payment_behavior: 'default_incomplete',
            payment_settings: { save_default_payment_method: 'on_subscription' },
            expand: ['latest_invoice.payment_intent'],
            metadata: params.metadata,
        };
        // If payment method is provided, attach it
        if (params.paymentMethodId) {
            // Attach payment method to customer
            await stripe.paymentMethods.attach(params.paymentMethodId, {
                customer: customerId,
            });
            // Set as default payment method
            await stripe.customers.update(customerId, {
                invoice_settings: {
                    default_payment_method: params.paymentMethodId,
                },
            });
        }
        const subscription = await stripe.subscriptions.create(subscriptionParams);
        // Get the latest invoice and payment intent
        const invoice = subscription.latest_invoice;
        let clientSecret;
        if (invoice && typeof invoice === 'object' && 'payment_intent' in invoice) {
            const paymentIntentId = invoice.payment_intent;
            if (typeof paymentIntentId === 'string') {
                // If it's a string, retrieve the payment intent
                try {
                    const paymentIntent = await stripe.paymentIntents.retrieve(paymentIntentId);
                    clientSecret = paymentIntent.client_secret || undefined;
                }
                catch (error) {
                    console.error('Error retrieving payment intent:', error);
                }
            }
            else if (paymentIntentId && typeof paymentIntentId === 'object') {
                // If it's already expanded
                clientSecret = paymentIntentId.client_secret || undefined;
            }
        }
        return {
            success: true,
            subscriptionId: subscription.id,
            customerId: customerId,
            clientSecret: clientSecret,
        };
    }
    catch (error) {
        console.error('Error creating Stripe subscription:', error);
        return {
            success: false,
            error: error instanceof Error ? error.message : 'Unknown error occurred',
        };
    }
};
exports.createStripeSubscription = createStripeSubscription;
/**
 * Retrieve a Stripe subscription
 */
const getStripeSubscription = async (subscriptionId) => {
    try {
        return await stripe.subscriptions.retrieve(subscriptionId);
    }
    catch (error) {
        console.error('Error retrieving Stripe subscription:', error);
        return null;
    }
};
exports.getStripeSubscription = getStripeSubscription;
/**
 * Cancel a Stripe subscription
 */
const cancelStripeSubscription = async (subscriptionId, immediately = false) => {
    try {
        if (immediately) {
            await stripe.subscriptions.cancel(subscriptionId);
        }
        else {
            // Cancel at period end
            await stripe.subscriptions.update(subscriptionId, {
                cancel_at_period_end: true,
            });
        }
        return true;
    }
    catch (error) {
        console.error('Error canceling Stripe subscription:', error);
        return false;
    }
};
exports.cancelStripeSubscription = cancelStripeSubscription;
/**
 * Update a Stripe subscription (e.g., change plan)
 */
const updateStripeSubscription = async (subscriptionId, newPriceId, newAmount, newInterval) => {
    try {
        const subscription = await stripe.subscriptions.retrieve(subscriptionId);
        if (newPriceId) {
            // Update to new price
            await stripe.subscriptions.update(subscriptionId, {
                items: [{
                        id: subscription.items.data[0].id,
                        price: newPriceId,
                    }],
                proration_behavior: 'create_prorations',
            });
        }
        else if (newAmount && newInterval) {
            // Create new price and update
            const price = await stripe.prices.create({
                currency: subscription.currency,
                unit_amount: newAmount,
                recurring: {
                    interval: newInterval,
                },
                product_data: {
                    name: `Pet Security Tag ${newInterval === 'month' ? 'Monthly' : 'Yearly'} Subscription`,
                },
            });
            await stripe.subscriptions.update(subscriptionId, {
                items: [{
                        id: subscription.items.data[0].id,
                        price: price.id,
                    }],
                proration_behavior: 'create_prorations',
            });
        }
        return {
            success: true,
            subscriptionId: subscriptionId,
        };
    }
    catch (error) {
        console.error('Error updating Stripe subscription:', error);
        return {
            success: false,
            error: error instanceof Error ? error.message : 'Unknown error occurred',
        };
    }
};
exports.updateStripeSubscription = updateStripeSubscription;
