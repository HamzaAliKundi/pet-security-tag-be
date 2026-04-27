"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.handleStripeWebhook = void 0;
const stripe_1 = __importDefault(require("stripe"));
const env_1 = require("../../config/env");
const Subscription_1 = __importDefault(require("../../models/Subscription"));
const Payment_1 = __importDefault(require("../../models/Payment"));
const User_1 = __importDefault(require("../../models/User"));
const emailService_1 = require("../../utils/emailService");
const stripe = new stripe_1.default(env_1.env.STRIPE_SECRET_KEY, {
    apiVersion: '2025-08-27.basil',
});
/** Resolves Stripe subscription id from invoice (including newer nested payload shapes). */
function getStripeSubscriptionIdFromInvoice(invoice) {
    var _a, _b, _c, _d, _e, _f, _g, _h, _j, _k;
    const invoiceAny = invoice;
    let subscriptionId = null;
    const subscriptionField = (_a = invoiceAny.subscription) !== null && _a !== void 0 ? _a : invoiceAny.subscription_id;
    if (subscriptionField) {
        if (typeof subscriptionField === 'string') {
            subscriptionId = subscriptionField;
        }
        else if (typeof subscriptionField === 'object' && subscriptionField.id) {
            subscriptionId = subscriptionField.id;
        }
    }
    if (!subscriptionId && ((_c = (_b = invoiceAny.lines) === null || _b === void 0 ? void 0 : _b.data) === null || _c === void 0 ? void 0 : _c[0])) {
        const line0 = invoiceAny.lines.data[0];
        const subFromLine = (_e = (_d = line0.subscription) !== null && _d !== void 0 ? _d : line0.subscription_id) !== null && _e !== void 0 ? _e : (_g = (_f = line0.parent) === null || _f === void 0 ? void 0 : _f.subscription_item_details) === null || _g === void 0 ? void 0 : _g.subscription;
        if (typeof subFromLine === 'string')
            subscriptionId = subFromLine;
        else if (subFromLine && typeof subFromLine === 'object' && subFromLine.id)
            subscriptionId = subFromLine.id;
    }
    if (!subscriptionId && ((_j = (_h = invoiceAny.parent) === null || _h === void 0 ? void 0 : _h.subscription_details) === null || _j === void 0 ? void 0 : _j.subscription)) {
        const s = invoiceAny.parent.subscription_details.subscription;
        subscriptionId = typeof s === 'string' ? s : (_k = s === null || s === void 0 ? void 0 : s.id) !== null && _k !== void 0 ? _k : null;
    }
    return subscriptionId;
}
/**
 * Stripe Webhook Handler
 * Handles subscription-related events from Stripe
 *
 * Important: Configure this endpoint in your Stripe Dashboard:
 * - Go to Developers > Webhooks
 * - Add endpoint: https://yourdomain.com/api/stripe/webhook
 * - Subscribe to these events:
 *   - invoice.payment_succeeded
 *   - invoice.payment_failed
 *   - customer.subscription.updated
 *   - customer.subscription.deleted
 *   - customer.subscription.created
 */
const handleStripeWebhook = async (req, res) => {
    const sig = req.headers['stripe-signature'];
    if (!sig) {
        res.status(400).json({ error: 'Missing stripe-signature header' });
        return;
    }
    if (!env_1.env.STRIPE_WEBHOOK_SECRET) {
        console.error('STRIPE_WEBHOOK_SECRET is not configured');
        res.status(500).json({ error: 'Webhook secret not configured' });
        return;
    }
    let event;
    try {
        // req.body is already raw buffer from express.raw() middleware
        const body = req.body;
        // Verify webhook signature
        event = stripe.webhooks.constructEvent(body, sig, env_1.env.STRIPE_WEBHOOK_SECRET);
    }
    catch (err) {
        console.error('Webhook signature verification failed:', err);
        res.status(400).json({ error: `Webhook Error: ${err instanceof Error ? err.message : 'Unknown error'}` });
        return;
    }
    // Handle the event
    try {
        console.log(`📥 Webhook received: ${event.type} (ID: ${event.id})`);
        switch (event.type) {
            case 'invoice.payment_succeeded':
                console.log('🔄 Processing invoice.payment_succeeded...');
                await handleInvoicePaymentSucceeded(event.data.object, event.id);
                console.log('✅ invoice.payment_succeeded processed successfully');
                break;
            case 'invoice.payment_failed':
                console.log('⚠️  Processing invoice.payment_failed...');
                await handleInvoicePaymentFailed(event.data.object, event.id);
                console.log('✅ invoice.payment_failed processed successfully');
                break;
            case 'customer.subscription.updated':
                console.log('🔄 Processing customer.subscription.updated...');
                await handleSubscriptionUpdated(event.data.object);
                console.log('✅ customer.subscription.updated processed successfully');
                break;
            case 'customer.subscription.deleted':
                console.log('🗑️  Processing customer.subscription.deleted...');
                await handleSubscriptionDeleted(event.data.object);
                console.log('✅ customer.subscription.deleted processed successfully');
                break;
            case 'customer.subscription.created':
                console.log('✨ Processing customer.subscription.created...');
                await handleSubscriptionCreated(event.data.object);
                console.log('✅ customer.subscription.created processed successfully');
                break;
            default:
                console.log(`ℹ️  Unhandled event type: ${event.type}`);
        }
        // Return a response to acknowledge receipt of the event
        res.json({ received: true, eventType: event.type });
    }
    catch (error) {
        console.error('❌ Error handling webhook event:', error);
        res.status(500).json({ error: 'Webhook handler failed' });
    }
};
exports.handleStripeWebhook = handleStripeWebhook;
/**
 * Handle successful invoice payment (auto-renewal)
 * This is the key event for auto-renewal
 */
async function handleInvoicePaymentSucceeded(invoice, eventId) {
    var _a, _b, _c, _d, _e, _f, _g, _h, _j, _k;
    try {
        // Type assertion to access properties that may not be in TypeScript definitions
        const invoiceAny = invoice;
        const subscriptionId = getStripeSubscriptionIdFromInvoice(invoice);
        if (!subscriptionId) {
            console.log('[invoice.payment_succeeded] Invoice does not have a subscription ID');
            return;
        }
        // Find subscription in database by stripeSubscriptionId
        const subscription = await Subscription_1.default.findOne({
            stripeSubscriptionId: subscriptionId,
        });
        if (!subscription) {
            console.log(`[invoice.payment_succeeded] Subscription not found in DB for Stripe sub: ${subscriptionId}`);
            return;
        }
        // Check invoice billing_reason to determine if this is initial payment or renewal
        const billingReason = invoiceAny.billing_reason;
        console.log(`[invoice.payment_succeeded] stripeSubId=${subscriptionId} billing_reason=${billingReason} dbSubId=${subscription._id} currentEndDate=${(_c = (_b = (_a = subscription.endDate) === null || _a === void 0 ? void 0 : _a.toISOString) === null || _b === void 0 ? void 0 : _b.call(_a)) !== null && _c !== void 0 ? _c : subscription.endDate}`);
        const invoiceAmount = invoice.amount_paid ? invoice.amount_paid / 100 : 0;
        // Skip if this is the initial subscription creation invoice
        // The subscription record is already created by confirmSubscriptionPayment
        if (billingReason === 'subscription_create' || billingReason === 'subscription_start') {
            console.log(`Skipping initial subscription invoice (billing_reason: ${billingReason}). Subscription already created by frontend confirmation.`);
            // Just update the existing subscription with payment intent ID if not set
            if (invoiceAny.payment_intent && !subscription.paymentIntentId) {
                const paymentIntentId = typeof invoiceAny.payment_intent === 'string'
                    ? invoiceAny.payment_intent
                    : invoiceAny.payment_intent.id;
                subscription.paymentIntentId = paymentIntentId;
                await subscription.save();
                console.log(`Updated subscription ${subscription._id} with payment intent ${paymentIntentId}`);
            }
            return;
        }
        // Skip if invoice amount is 0 (setup invoice, trial period, etc.)
        // Only process actual payment invoices
        if (invoiceAmount === 0) {
            console.log(`Skipping invoice with 0 amount (billing_reason: ${billingReason}). This is likely a setup or trial invoice.`);
            return;
        }
        // Check if there's already a subscription with the same paymentIntentId (duplicate prevention)
        if (invoiceAny.payment_intent) {
            const paymentIntentId = typeof invoiceAny.payment_intent === 'string'
                ? invoiceAny.payment_intent
                : invoiceAny.payment_intent.id;
            // Check for ANY subscription with this paymentIntentId (not just different IDs)
            const existingWithPaymentIntent = await Subscription_1.default.findOne({
                paymentIntentId: paymentIntentId
            });
            if (existingWithPaymentIntent) {
                console.log(`Subscription with payment intent ${paymentIntentId} already exists (ID: ${existingWithPaymentIntent._id}). Skipping duplicate creation.`);
                // If the existing subscription has 0 amount and this invoice has actual amount, update it
                if (existingWithPaymentIntent.amountPaid === 0 && invoiceAmount > 0) {
                    console.log(`Updating subscription ${existingWithPaymentIntent._id} with actual amount ${invoiceAmount}`);
                    existingWithPaymentIntent.amountPaid = invoiceAmount;
                    existingWithPaymentIntent.currency = invoice.currency || existingWithPaymentIntent.currency;
                    await existingWithPaymentIntent.save();
                }
                return;
            }
        }
        // Check if subscription was just created (within last 5 minutes) - likely initial payment
        const subscriptionAge = Date.now() - subscription.startDate.getTime();
        const fiveMinutes = 5 * 60 * 1000;
        if (subscriptionAge < fiveMinutes && subscription.status === 'active') {
            console.log(`Subscription ${subscription._id} was just created (${Math.round(subscriptionAge / 1000)}s ago). Skipping initial payment webhook.`);
            return;
        }
        // Renewal (subscription_cycle): always process so endDate is updated when Stripe charges. Do not skip.
        // Recovering after failed payments may use a different billing_reason — still process if we flagged payment failure.
        const isRenewal = billingReason === 'subscription_cycle';
        const recoverAfterPaymentFailure = !!subscription.endedDueToPaymentFailure && invoiceAmount > 0;
        if (!isRenewal && !recoverAfterPaymentFailure && subscription.status === 'active' && new Date(subscription.endDate) > new Date()) {
            console.log(`[invoice.payment_succeeded] Skipping: not renewal (billing_reason=${billingReason}), subscription already active`);
            return;
        }
        // Use period from invoice when present (Stripe's authoritative dates), else calculate from type
        let startDate;
        let endDate;
        const firstLine = (_e = (_d = invoiceAny.lines) === null || _d === void 0 ? void 0 : _d.data) === null || _e === void 0 ? void 0 : _e[0];
        const periodStart = (_f = firstLine === null || firstLine === void 0 ? void 0 : firstLine.period) === null || _f === void 0 ? void 0 : _f.start;
        const periodEnd = (_g = firstLine === null || firstLine === void 0 ? void 0 : firstLine.period) === null || _g === void 0 ? void 0 : _g.end;
        if (typeof periodStart === 'number' && typeof periodEnd === 'number') {
            startDate = new Date(periodStart * 1000);
            endDate = new Date(periodEnd * 1000);
        }
        else {
            startDate = new Date();
            endDate = new Date();
            if (subscription.type === 'monthly') {
                endDate.setMonth(endDate.getMonth() + 1);
            }
            else if (subscription.type === 'yearly') {
                endDate.setFullYear(endDate.getFullYear() + 1);
            }
            else if (subscription.type === 'lifetime') {
                endDate.setFullYear(endDate.getFullYear() + 100);
            }
        }
        // Get payment intent ID - can be string or expanded PaymentIntent object
        let paymentIntentId = undefined;
        const paymentIntentField = invoiceAny.payment_intent;
        if (paymentIntentField) {
            if (typeof paymentIntentField === 'string') {
                paymentIntentId = paymentIntentField;
            }
            else if (typeof paymentIntentField === 'object' && paymentIntentField.id) {
                paymentIntentId = paymentIntentField.id;
            }
        }
        const amountPaid = invoice.amount_paid ? invoice.amount_paid / 100 : subscription.amountPaid;
        const currency = invoice.currency || subscription.currency;
        // Update existing subscription in place (no new document). Keeps stripeSubscriptionId unique; pet profile and other flows unchanged.
        const previousEndDate = (_k = (_j = (_h = subscription.endDate) === null || _h === void 0 ? void 0 : _h.toISOString) === null || _j === void 0 ? void 0 : _j.call(_h)) !== null && _k !== void 0 ? _k : String(subscription.endDate);
        subscription.status = 'active';
        subscription.startDate = startDate;
        subscription.endDate = endDate;
        subscription.amountPaid = amountPaid;
        subscription.currency = currency;
        if (paymentIntentId)
            subscription.paymentIntentId = paymentIntentId;
        subscription.endedDueToPaymentFailure = false;
        await subscription.save();
        // Store payment history for successful subscription charge (non-blocking)
        try {
            await Payment_1.default.create({
                userId: subscription.userId,
                subscriptionId: subscription._id,
                qrCodeId: subscription.qrCodeId || undefined,
                status: 'succeeded',
                paymentType: 'subscription',
                source: 'stripe_webhook',
                amount: amountPaid,
                currency,
                action: billingReason === 'subscription_cycle' ? 'renewal' : 'new_subscription',
                subscriptionType: subscription.type,
                paymentIntentId: paymentIntentId || undefined,
                stripeSubscriptionId: subscriptionId,
                stripeInvoiceId: invoice.id,
                stripeEventId: eventId,
                attemptCount: typeof invoice.attempt_count === 'number' ? invoice.attempt_count : undefined,
            });
        }
        catch (paymentLogError) {
            console.error('[invoice.payment_succeeded] Failed to store payment history:', paymentLogError);
        }
        // Send notification email (unchanged behaviour)
        try {
            const user = await User_1.default.findById(subscription.userId);
            if (user && user.email) {
                await (0, emailService_1.sendSubscriptionNotificationEmail)(user.email, {
                    customerName: user.firstName || 'Valued Customer',
                    action: 'renewal',
                    planType: subscription.type,
                    amount: amountPaid,
                    validUntil: endDate.toLocaleDateString('en-GB'),
                    paymentDate: new Date().toLocaleDateString('en-GB'),
                });
            }
        }
        catch (emailError) {
            console.error('Failed to send renewal notification email:', emailError);
        }
        console.log(`[invoice.payment_succeeded] RENEWAL OK dbSubId=${subscription._id} previousEndDate=${previousEndDate} newEndDate=${endDate.toISOString()}`);
    }
    catch (error) {
        console.error('Error handling invoice.payment_succeeded:', error);
        throw error;
    }
}
/**
 * Handle failed invoice payment
 * attempt_count 1 → retry email; 2+ → final email + mark subscription inactive for pet profile
 */
async function handleInvoicePaymentFailed(invoice, eventId) {
    var _a, _b, _c, _d, _e, _f;
    try {
        const invoiceAny = invoice;
        const subscriptionId = getStripeSubscriptionIdFromInvoice(invoice);
        if (!subscriptionId) {
            console.log('[invoice.payment_failed] Invoice does not have a subscription ID');
            return;
        }
        const subscription = await Subscription_1.default.findOne({
            stripeSubscriptionId: subscriptionId,
        });
        if (!subscription) {
            console.log(`[invoice.payment_failed] Subscription not found in DB for Stripe sub: ${subscriptionId}`);
            return;
        }
        const attemptCount = typeof invoice.attempt_count === 'number' ? invoice.attempt_count : 1;
        const nextTs = invoiceAny.next_payment_attempt;
        const dashboardBase = (env_1.env.FRONTEND_URL || '').replace(/\/$/, '');
        const dashboardPaymentsUrl = `${dashboardBase}/payments`;
        const user = await User_1.default.findById(subscription.userId);
        const customerName = (user === null || user === void 0 ? void 0 : user.firstName) || 'Valued Customer';
        const nextRetrySummary = nextTs
            ? `on or after ${new Date(nextTs * 1000).toLocaleString('en-GB', { dateStyle: 'medium', timeStyle: 'short' })}`
            : undefined;
        // Store failed payment attempt in payment history (non-blocking)
        try {
            const failedAmount = ((_c = (_b = (_a = invoice.amount_due) !== null && _a !== void 0 ? _a : invoice.amount_remaining) !== null && _b !== void 0 ? _b : invoice.amount_paid) !== null && _c !== void 0 ? _c : 0) / 100;
            let failureReason;
            const failureMessage = ((_d = invoiceAny.last_finalization_error) === null || _d === void 0 ? void 0 : _d.message) || ((_e = invoiceAny.last_payment_error) === null || _e === void 0 ? void 0 : _e.message);
            if (typeof failureMessage === 'string' && failureMessage.trim()) {
                failureReason = failureMessage.trim();
            }
            await Payment_1.default.create({
                userId: subscription.userId,
                subscriptionId: subscription._id,
                qrCodeId: subscription.qrCodeId || undefined,
                status: 'failed',
                paymentType: 'subscription',
                source: 'stripe_webhook',
                amount: Math.max(0, failedAmount),
                currency: (invoice.currency || subscription.currency || 'gbp').toLowerCase(),
                action: 'renewal',
                subscriptionType: subscription.type,
                paymentIntentId: typeof invoiceAny.payment_intent === 'string'
                    ? invoiceAny.payment_intent
                    : (_f = invoiceAny.payment_intent) === null || _f === void 0 ? void 0 : _f.id,
                stripeSubscriptionId: subscriptionId,
                stripeInvoiceId: invoice.id,
                stripeEventId: eventId,
                attemptCount,
                failureReason,
                metadata: {
                    nextRetrySummary,
                },
            });
        }
        catch (paymentLogError) {
            console.error('[invoice.payment_failed] Failed to store payment history:', paymentLogError);
        }
        if (attemptCount < 2) {
            if (user === null || user === void 0 ? void 0 : user.email) {
                try {
                    await (0, emailService_1.sendSubscriptionPaymentFailedRetryEmail)(user.email, {
                        customerName,
                        dashboardPaymentsUrl,
                        nextRetrySummary,
                    });
                }
                catch (emailErr) {
                    console.error('[invoice.payment_failed] Retry notice email failed:', emailErr);
                }
            }
            console.log(`[invoice.payment_failed] attempt=${attemptCount} (retry notice) dbSubId=${subscription._id} stripeSubId=${subscriptionId}`);
            return;
        }
        subscription.status = 'expired';
        subscription.endedDueToPaymentFailure = true;
        await subscription.save();
        if (user === null || user === void 0 ? void 0 : user.email) {
            try {
                await (0, emailService_1.sendSubscriptionPaymentFailedFinalEmail)(user.email, {
                    customerName,
                    dashboardPaymentsUrl,
                });
            }
            catch (emailErr) {
                console.error('[invoice.payment_failed] Final failure email failed:', emailErr);
            }
        }
        console.log(`[invoice.payment_failed] attempt=${attemptCount} FINAL — subscription expired, pet profile disabled dbSubId=${subscription._id}`);
    }
    catch (error) {
        console.error('Error handling invoice.payment_failed:', error);
    }
}
/**
 * Handle subscription update (e.g., plan change, cancellation, incomplete -> active transition)
 */
async function handleSubscriptionUpdated(stripeSubscription) {
    try {
        // Find subscription by stripeSubscriptionId (don't filter by status - we need to handle all statuses)
        let subscription = await Subscription_1.default.findOne({
            stripeSubscriptionId: stripeSubscription.id,
        });
        // Type assertion to access properties that may not be in TypeScript definitions
        const subscriptionAny = stripeSubscription;
        const periodEnd = subscriptionAny.current_period_end;
        const periodStart = subscriptionAny.current_period_start;
        // Handle status transitions
        if (stripeSubscription.status === 'canceled' || stripeSubscription.status === 'unpaid') {
            if (subscription) {
                subscription.status = 'cancelled';
                if (stripeSubscription.status === 'unpaid') {
                    subscription.endedDueToPaymentFailure = true;
                }
                await subscription.save();
                console.log(`Subscription ${subscription._id} marked as cancelled`);
            }
            return;
        }
        // If subscription becomes active and we have metadata, we can create/update the record
        if (stripeSubscription.status === 'active') {
            if (subscription) {
                // Update existing subscription
                subscription.status = 'active';
                if (periodEnd) {
                    subscription.endDate = new Date(periodEnd * 1000);
                }
                if (periodStart) {
                    subscription.startDate = new Date(periodStart * 1000);
                }
                await subscription.save();
                console.log(`✅ Updated subscription ${subscription._id} to active status`);
            }
            else {
                // Subscription record doesn't exist - try to create it from metadata
                // This can happen if confirmSubscriptionPayment wasn't called or failed
                const metadata = stripeSubscription.metadata || {};
                const userId = metadata.userId;
                const qrCodeId = metadata.qrCodeId;
                const subscriptionType = metadata.subscriptionType || 'monthly';
                if (userId) {
                    // Calculate end date based on subscription type
                    const startDate = periodStart ? new Date(periodStart * 1000) : new Date();
                    const endDate = periodEnd ? new Date(periodEnd * 1000) : new Date();
                    // If we don't have period end, calculate based on type
                    if (!periodEnd) {
                        if (subscriptionType === 'monthly') {
                            endDate.setMonth(endDate.getMonth() + 1);
                        }
                        else if (subscriptionType === 'yearly') {
                            endDate.setFullYear(endDate.getFullYear() + 1);
                        }
                        else if (subscriptionType === 'lifetime') {
                            endDate.setFullYear(endDate.getFullYear() + 100);
                        }
                    }
                    try {
                        subscription = await Subscription_1.default.create({
                            userId,
                            qrCodeId: qrCodeId || undefined,
                            type: subscriptionType,
                            status: 'active',
                            startDate,
                            endDate,
                            stripeSubscriptionId: stripeSubscription.id,
                            amountPaid: 0, // Will be updated when invoice payment succeeds
                            currency: 'eur', // Default, will be updated from invoice
                            autoRenew: subscriptionType !== 'lifetime',
                        });
                        console.log(`✅ Created subscription record ${subscription._id} from webhook (incomplete -> active transition)`);
                    }
                    catch (createError) {
                        console.error('Error creating subscription from webhook:', createError);
                        // If creation fails (e.g., duplicate key), try to find it again
                        subscription = await Subscription_1.default.findOne({
                            stripeSubscriptionId: stripeSubscription.id,
                        });
                        if (subscription) {
                            subscription.status = 'active';
                            if (periodEnd) {
                                subscription.endDate = new Date(periodEnd * 1000);
                            }
                            await subscription.save();
                            console.log(`✅ Updated existing subscription ${subscription._id} to active`);
                        }
                    }
                }
                else {
                    console.log(`⚠️ Cannot create subscription record: missing userId in metadata for Stripe subscription ${stripeSubscription.id}`);
                }
            }
        }
    }
    catch (error) {
        console.error('Error handling customer.subscription.updated:', error);
        throw error;
    }
}
/**
 * Handle subscription deletion
 */
async function handleSubscriptionDeleted(stripeSubscription) {
    try {
        const subscription = await Subscription_1.default.findOne({
            stripeSubscriptionId: stripeSubscription.id,
        });
        if (subscription) {
            subscription.status = 'cancelled';
            await subscription.save();
            console.log(`Subscription ${subscription._id} marked as cancelled`);
        }
    }
    catch (error) {
        console.error('Error handling customer.subscription.deleted:', error);
    }
}
/**
 * Handle subscription creation
 */
async function handleSubscriptionCreated(stripeSubscription) {
    try {
        // This is mainly for logging - the subscription should already be created
        // when the user confirms payment
        console.log(`Stripe subscription created: ${stripeSubscription.id}`);
    }
    catch (error) {
        console.error('Error handling customer.subscription.created:', error);
    }
}
