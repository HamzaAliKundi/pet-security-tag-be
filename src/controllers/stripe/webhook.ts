import { Request, Response } from 'express';
import Stripe from 'stripe';
import { env } from '../../config/env';
import Subscription from '../../models/Subscription';
import User from '../../models/User';
import { sendSubscriptionNotificationEmail } from '../../utils/emailService';

const stripe = new Stripe(env.STRIPE_SECRET_KEY, {
  apiVersion: '2025-07-30.basil',
});

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
export const handleStripeWebhook = async (req: Request, res: Response): Promise<void> => {
  const sig = req.headers['stripe-signature'];

  if (!sig) {
    res.status(400).json({ error: 'Missing stripe-signature header' });
    return;
  }

  if (!env.STRIPE_WEBHOOK_SECRET) {
    console.error('STRIPE_WEBHOOK_SECRET is not configured');
    res.status(500).json({ error: 'Webhook secret not configured' });
    return;
  }

  let event: Stripe.Event;

  try {
    // req.body is already raw buffer from express.raw() middleware
    const body = req.body as Buffer;
    
    // Verify webhook signature
    event = stripe.webhooks.constructEvent(
      body,
      sig,
      env.STRIPE_WEBHOOK_SECRET
    );
  } catch (err) {
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
        await handleInvoicePaymentSucceeded(event.data.object as Stripe.Invoice);
        console.log('✅ invoice.payment_succeeded processed successfully');
        break;

      case 'invoice.payment_failed':
        console.log('⚠️  Processing invoice.payment_failed...');
        await handleInvoicePaymentFailed(event.data.object as Stripe.Invoice);
        console.log('✅ invoice.payment_failed processed successfully');
        break;

      case 'customer.subscription.updated':
        console.log('🔄 Processing customer.subscription.updated...');
        await handleSubscriptionUpdated(event.data.object as Stripe.Subscription);
        console.log('✅ customer.subscription.updated processed successfully');
        break;

      case 'customer.subscription.deleted':
        console.log('🗑️  Processing customer.subscription.deleted...');
        await handleSubscriptionDeleted(event.data.object as Stripe.Subscription);
        console.log('✅ customer.subscription.deleted processed successfully');
        break;

      case 'customer.subscription.created':
        console.log('✨ Processing customer.subscription.created...');
        await handleSubscriptionCreated(event.data.object as Stripe.Subscription);
        console.log('✅ customer.subscription.created processed successfully');
        break;

      default:
        console.log(`ℹ️  Unhandled event type: ${event.type}`);
    }

    // Return a response to acknowledge receipt of the event
    res.json({ received: true, eventType: event.type });
  } catch (error) {
    console.error('❌ Error handling webhook event:', error);
    res.status(500).json({ error: 'Webhook handler failed' });
  }
};

/**
 * Handle successful invoice payment (auto-renewal)
 * This is the key event for auto-renewal
 */
async function handleInvoicePaymentSucceeded(invoice: Stripe.Invoice): Promise<void> {
  try {
    // Type assertion to access properties that may not be in TypeScript definitions
    const invoiceAny: any = invoice;
    
    // invoice.subscription can be a string ID or an expanded Subscription object
    let subscriptionId: string | null = null;
    const subscriptionField = invoiceAny.subscription;
    if (subscriptionField) {
      if (typeof subscriptionField === 'string') {
        subscriptionId = subscriptionField;
      } else if (typeof subscriptionField === 'object' && subscriptionField.id) {
        subscriptionId = subscriptionField.id;
      }
    }
    
    if (!subscriptionId) {
      console.log('Invoice does not have a subscription ID');
      return;
    }

    // Find subscription in database by stripeSubscriptionId
    const subscription = await Subscription.findOne({
      stripeSubscriptionId: subscriptionId,
    });

    if (!subscription) {
      console.log(`Subscription not found in database for Stripe subscription: ${subscriptionId}`);
      return;
    }

    // Check invoice billing_reason to determine if this is initial payment or renewal
    const billingReason = invoiceAny.billing_reason;
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
      const existingWithPaymentIntent = await Subscription.findOne({
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

    // Check if subscription is already active (avoid duplicate renewals)
    if (subscription.status === 'active' && new Date(subscription.endDate) > new Date()) {
      console.log(`Subscription ${subscription._id} is already active, skipping renewal`);
      return;
    }

    // Calculate new end date based on subscription type
    const startDate = new Date();
    const endDate = new Date();

    if (subscription.type === 'monthly') {
      endDate.setMonth(endDate.getMonth() + 1);
    } else if (subscription.type === 'yearly') {
      endDate.setFullYear(endDate.getFullYear() + 1);
    } else if (subscription.type === 'lifetime') {
      endDate.setFullYear(endDate.getFullYear() + 100);
    }

    // Get payment intent ID - can be string or expanded PaymentIntent object
    let paymentIntentId: string | undefined = undefined;
    const paymentIntentField = invoiceAny.payment_intent;
    if (paymentIntentField) {
      if (typeof paymentIntentField === 'string') {
        paymentIntentId = paymentIntentField;
      } else if (typeof paymentIntentField === 'object' && paymentIntentField.id) {
        paymentIntentId = paymentIntentField.id;
      }
    }

    // Create new subscription record for this renewal (preserve payment history)
    const newSubscription = await Subscription.create({
      userId: subscription.userId,
      qrCodeId: subscription.qrCodeId,
      type: subscription.type,
      status: 'active',
      startDate,
      endDate,
      paymentIntentId: paymentIntentId,
      stripeSubscriptionId: subscriptionId, // Keep the same Stripe subscription ID
      amountPaid: invoice.amount_paid ? invoice.amount_paid / 100 : subscription.amountPaid, // Convert from cents
      currency: invoice.currency || subscription.currency,
      autoRenew: subscription.autoRenew,
    });

    // Mark old subscription as expired (keep for history)
    subscription.status = 'expired';
    await subscription.save();

    // Send notification email
    try {
      const user = await User.findById(subscription.userId);
      if (user && user.email) {
        await sendSubscriptionNotificationEmail(user.email, {
          customerName: user.firstName || 'Valued Customer',
          action: 'renewal',
          planType: subscription.type,
          amount: newSubscription.amountPaid,
          validUntil: endDate.toLocaleDateString('en-GB'),
          paymentDate: new Date().toLocaleDateString('en-GB'),
        });
      }
    } catch (emailError) {
      console.error('Failed to send renewal notification email:', emailError);
    }

    console.log(`Subscription ${subscription._id} auto-renewed successfully. New subscription: ${newSubscription._id}`);
  } catch (error) {
    console.error('Error handling invoice.payment_succeeded:', error);
    throw error;
  }
}

/**
 * Handle failed invoice payment
 */
async function handleInvoicePaymentFailed(invoice: Stripe.Invoice): Promise<void> {
  try {
    // Type assertion to access properties that may not be in TypeScript definitions
    const invoiceAny: any = invoice;
    
    // invoice.subscription can be a string ID or an expanded Subscription object
    let subscriptionId: string | null = null;
    const subscriptionField = invoiceAny.subscription;
    if (subscriptionField) {
      if (typeof subscriptionField === 'string') {
        subscriptionId = subscriptionField;
      } else if (typeof subscriptionField === 'object' && subscriptionField.id) {
        subscriptionId = subscriptionField.id;
      }
    }
    
    if (!subscriptionId) {
      return;
    }

    const subscription = await Subscription.findOne({
      stripeSubscriptionId: subscriptionId,
    });

    if (subscription) {
      // Optionally mark subscription as expired or send notification
      console.log(`Payment failed for subscription ${subscription._id}`);
      
      // You might want to send an email notification here
      // or mark the subscription with a "payment_failed" status
    }
  } catch (error) {
    console.error('Error handling invoice.payment_failed:', error);
  }
}

/**
 * Handle subscription update (e.g., plan change, cancellation)
 */
async function handleSubscriptionUpdated(stripeSubscription: Stripe.Subscription): Promise<void> {
  try {
    const subscription = await Subscription.findOne({
      stripeSubscriptionId: stripeSubscription.id,
      status: 'active',
    });

    if (subscription) {
      // Update subscription status based on Stripe status
      if (stripeSubscription.status === 'canceled' || stripeSubscription.status === 'unpaid') {
        subscription.status = 'cancelled';
        await subscription.save();
      } else if (stripeSubscription.status === 'active') {
        // Update end date based on current period end
        // Type assertion to access properties that may not be in TypeScript definitions
        const subscriptionAny: any = stripeSubscription;
        const periodEnd = subscriptionAny.current_period_end;
        if (periodEnd) {
          subscription.endDate = new Date(periodEnd * 1000);
          await subscription.save();
        }
      }
    }
  } catch (error) {
    console.error('Error handling customer.subscription.updated:', error);
  }
}

/**
 * Handle subscription deletion
 */
async function handleSubscriptionDeleted(stripeSubscription: Stripe.Subscription): Promise<void> {
  try {
    const subscription = await Subscription.findOne({
      stripeSubscriptionId: stripeSubscription.id,
    });

    if (subscription) {
      subscription.status = 'cancelled';
      await subscription.save();
      console.log(`Subscription ${subscription._id} marked as cancelled`);
    }
  } catch (error) {
    console.error('Error handling customer.subscription.deleted:', error);
  }
}

/**
 * Handle subscription creation
 */
async function handleSubscriptionCreated(stripeSubscription: Stripe.Subscription): Promise<void> {
  try {
    // This is mainly for logging - the subscription should already be created
    // when the user confirms payment
    console.log(`Stripe subscription created: ${stripeSubscription.id}`);
  } catch (error) {
    console.error('Error handling customer.subscription.created:', error);
  }
}

