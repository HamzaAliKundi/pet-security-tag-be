"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.updateStripeSubscription = exports.paySubscriptionInvoice = exports.cancelStripeSubscription = exports.getStripeSubscription = exports.createStripeSubscription = exports.getOrCreateCustomer = exports.getStripePublishKey = exports.confirmPaymentIntent = exports.savePaymentMethodToCustomer = exports.createSubscriptionPaymentIntent = exports.createPaymentIntent = void 0;
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
        // For newer Stripe API versions, we need to create product and price first
        let priceId;
        if (params.priceId) {
            // Use existing price
            priceId = params.priceId;
        }
        else {
            // Create product first
            const product = await stripe.products.create({
                name: `Pet Security Tag ${params.interval === 'month' ? 'Monthly' : 'Yearly'} Subscription`,
                metadata: {
                    subscriptionType: params.metadata.subscriptionType || params.interval,
                },
            });
            // Create price for the product
            const price = await stripe.prices.create({
                currency: params.currency,
                unit_amount: params.amount,
                recurring: {
                    interval: params.interval,
                },
                product: product.id,
            });
            priceId = price.id;
        }
        // Create subscription
        const subscriptionParams = {
            customer: customerId,
            items: [{ price: priceId }],
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
        console.log(`✅ Stripe subscription created: ${subscription.id}, status: ${subscription.status}`);
        // Get the latest invoice
        const invoiceAny = subscription.latest_invoice;
        let clientSecret;
        if (invoiceAny) {
            console.log('Invoice found, extracting payment intent...');
            const invoiceId = typeof invoiceAny === 'string' ? invoiceAny : invoiceAny.id;
            // Try to get payment_intent from invoice
            let paymentIntentField = typeof invoiceAny === 'object' ? invoiceAny.payment_intent : null;
            // If payment method is provided and invoice doesn't have payment intent, 
            // retrieve the invoice to check its status and create a payment intent if needed
            if (!paymentIntentField && params.paymentMethodId && invoiceId) {
                try {
                    console.log(`Retrieving invoice ${invoiceId} to check status...`);
                    const invoice = await stripe.invoices.retrieve(invoiceId, {
                        expand: ['payment_intent'],
                    });
                    // Check if invoice has a payment intent now
                    paymentIntentField = invoice.payment_intent;
                    // If still no payment intent and invoice is open/unpaid, create one
                    if (!paymentIntentField && invoice.status === 'open') {
                        console.log(`Creating payment intent for open invoice amount: ${invoice.amount_due}`);
                        const paymentIntent = await stripe.paymentIntents.create({
                            amount: invoice.amount_due,
                            currency: invoice.currency,
                            customer: customerId,
                            payment_method: params.paymentMethodId,
                            confirmation_method: 'automatic', // Changed to 'automatic' so frontend can confirm
                            confirm: false,
                            metadata: {
                                invoice_id: invoiceId,
                                subscription_id: subscription.id,
                            },
                        });
                        paymentIntentField = paymentIntent.id;
                        clientSecret = paymentIntent.client_secret || undefined;
                        console.log('✅ Created payment intent for invoice:', paymentIntent.id);
                    }
                    else if (paymentIntentField) {
                        console.log('✅ Invoice has payment intent:', paymentIntentField);
                    }
                }
                catch (invoiceError) {
                    console.error('❌ Error retrieving invoice:', invoiceError);
                }
            }
            if (paymentIntentField) {
                if (typeof paymentIntentField === 'string') {
                    // If it's a string ID, retrieve the payment intent
                    try {
                        console.log(`Retrieving payment intent: ${paymentIntentField}`);
                        const paymentIntent = await stripe.paymentIntents.retrieve(paymentIntentField);
                        clientSecret = paymentIntent.client_secret || undefined;
                        console.log(`✅ Retrieved clientSecret from payment intent: ${paymentIntentField}`);
                    }
                    catch (error) {
                        console.error('❌ Error retrieving payment intent:', error);
                    }
                }
                else if (typeof paymentIntentField === 'object' && paymentIntentField.client_secret) {
                    // If it's already expanded PaymentIntent object
                    clientSecret = paymentIntentField.client_secret;
                    console.log('✅ Using expanded payment intent clientSecret');
                }
            }
            else {
                // If still no payment intent and we have invoice ID and payment method, create one
                if (invoiceId && params.paymentMethodId) {
                    try {
                        const invoice = await stripe.invoices.retrieve(invoiceId);
                        console.log(`Creating payment intent for invoice amount: ${invoice.amount_due}`);
                        const paymentIntent = await stripe.paymentIntents.create({
                            amount: invoice.amount_due,
                            currency: invoice.currency,
                            customer: customerId,
                            payment_method: params.paymentMethodId,
                            confirmation_method: 'automatic', // Changed to 'automatic' so frontend can confirm
                            confirm: false,
                            metadata: {
                                invoice_id: invoiceId,
                                subscription_id: subscription.id,
                            },
                        });
                        paymentIntentField = paymentIntent.id;
                        clientSecret = paymentIntent.client_secret || undefined;
                        console.log('✅ Created payment intent for invoice:', paymentIntent.id);
                    }
                    catch (createError) {
                        console.error('❌ Error creating payment intent:', createError);
                    }
                }
                else {
                    console.warn('⚠️  No payment_intent found in invoice and cannot create one');
                }
            }
        }
        else {
            console.warn('⚠️  No latest_invoice found in subscription');
        }
        if (!clientSecret) {
            console.error('❌ Failed to extract clientSecret from subscription. Subscription ID:', subscription.id);
            console.error('Subscription status:', subscription.status);
        }
        else {
            console.log('✅ ClientSecret extracted successfully');
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
 * Pay invoice for a subscription to mark it as active
 * This fixes the "Incomplete" status in Stripe dashboard
 */
const paySubscriptionInvoice = async (subscriptionId, paymentIntentId) => {
    var _a, _b, _c;
    try {
        // Retrieve the subscription to get the latest invoice
        const stripeSubscription = await stripe.subscriptions.retrieve(subscriptionId);
        const invoiceId = typeof stripeSubscription.latest_invoice === 'string'
            ? stripeSubscription.latest_invoice
            : (_a = stripeSubscription.latest_invoice) === null || _a === void 0 ? void 0 : _a.id;
        if (!invoiceId) {
            return {
                success: false,
                error: 'No invoice found for subscription'
            };
        }
        // Retrieve the invoice to check its status
        const invoice = await stripe.invoices.retrieve(invoiceId);
        // Check payment intent status
        const paymentIntent = await stripe.paymentIntents.retrieve(paymentIntentId);
        // Only proceed if payment intent succeeded
        if (paymentIntent.status !== 'succeeded') {
            return {
                success: false,
                error: `Payment intent ${paymentIntentId} has status ${paymentIntent.status}, expected succeeded`
            };
        }
        // Only pay if invoice is open/unpaid
        if (invoice.status === 'open' || invoice.status === 'draft') {
            // Finalize invoice if it's in draft status
            let finalInvoiceId = invoiceId;
            if (invoice.status === 'draft') {
                const finalizedInvoice = await stripe.invoices.finalizeInvoice(invoiceId);
                finalInvoiceId = finalizedInvoice.id || invoiceId;
            }
            // Since payment intent already succeeded, we need to mark the invoice as paid
            // We'll use the payment intent's payment method to pay the invoice
            try {
                // Pay the invoice - Stripe will attempt to collect payment
                // Since we already have a succeeded payment intent, we'll mark it manually
                await stripe.invoices.pay(finalInvoiceId);
                console.log(`✅ Invoice ${finalInvoiceId} paid successfully. Subscription ${subscriptionId} should now be active.`);
            }
            catch (payError) {
                // If invoice can't be paid (maybe already processing), that's okay
                // The subscription should still become active via webhook
                if (payError.code === 'invoice_already_paid' || ((_b = payError.message) === null || _b === void 0 ? void 0 : _b.includes('already paid'))) {
                    console.log(`ℹ️  Invoice ${finalInvoiceId} is already paid.`);
                }
                else {
                    // For other errors, log but don't fail - subscription is active in our DB
                    console.warn(`⚠️  Could not pay invoice ${finalInvoiceId}: ${payError.message}`);
                    console.log(`   Subscription ${subscriptionId} is active in our database. Stripe will sync via webhook.`);
                }
            }
            return { success: true };
        }
        else if (invoice.status === 'paid') {
            // Invoice is already paid, subscription should be active
            console.log(`ℹ️  Invoice ${invoiceId} is already paid. Subscription ${subscriptionId} should be active.`);
            return { success: true };
        }
        else {
            console.log(`ℹ️  Invoice ${invoiceId} is in status: ${invoice.status}. No action needed.`);
            return { success: true };
        }
    }
    catch (error) {
        // If invoice is already paid or subscription is already active, that's fine
        if (error.code === 'invoice_already_paid' || ((_c = error.message) === null || _c === void 0 ? void 0 : _c.includes('already paid'))) {
            console.log(`ℹ️  Invoice is already paid for subscription ${subscriptionId}.`);
            return { success: true };
        }
        console.error('Error paying subscription invoice:', error);
        return {
            success: false,
            error: error instanceof Error ? error.message : 'Unknown error occurred'
        };
    }
};
exports.paySubscriptionInvoice = paySubscriptionInvoice;
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
