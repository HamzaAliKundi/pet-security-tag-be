import Stripe from 'stripe';
import { env } from '../config/env';

// Initialize Stripe with secret key
const stripe = new Stripe(env.STRIPE_SECRET_KEY, {
  apiVersion: '2025-07-30.basil', // Use latest stable API version
});

export interface CreatePaymentIntentParams {
  amount: number; // Amount in cents
  currency: string;
  metadata: {
    userId: string;
    petName: string;
    quantity: number;
    tagColor: string;
  };
}

export interface CreateSubscriptionPaymentIntentParams {
  amount: number; // Amount in cents
  currency: string;
  metadata: {
    userId: string;
    petName?: string;
    subscriptionType: string;
    action?: string;
    originalSubscriptionId?: string;
  };
}

export interface CreateStripeSubscriptionParams {
  customerId?: string; // Optional: if customer already exists in Stripe
  customerEmail: string;
  customerName?: string;
  priceId?: string; // Optional: Stripe Price ID if you have products set up
  amount: number; // Amount in cents (if not using priceId)
  currency: string;
  interval: 'month' | 'year'; // Billing interval
  metadata: {
    userId: string;
    subscriptionId?: string; // Your internal subscription ID
    subscriptionType?: string; // Subscription type (monthly/yearly)
    qrCodeId?: string;
    petName?: string;
  };
  paymentMethodId?: string; // Payment method ID from frontend
}

export interface PaymentIntentResult {
  success: boolean;
  paymentIntentId?: string;
  clientSecret?: string;
  error?: string;
}

export interface SubscriptionResult {
  success: boolean;
  subscriptionId?: string;
  customerId?: string;
  clientSecret?: string;
  error?: string;
}

export const createPaymentIntent = async (params: CreatePaymentIntentParams): Promise<PaymentIntentResult> => {
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
  } catch (error) {
    console.error('Error creating payment intent:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error occurred',
    };
  }
};

export const createSubscriptionPaymentIntent = async (params: CreateSubscriptionPaymentIntentParams): Promise<PaymentIntentResult> => {
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
  } catch (error) {
    console.error('Error creating subscription payment intent:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error occurred',
    };
  }
};

export const confirmPaymentIntent = async (paymentIntentId: string): Promise<boolean> => {
  try {
    const paymentIntent = await stripe.paymentIntents.retrieve(paymentIntentId);
    return paymentIntent.status === 'succeeded';
  } catch (error) {
    console.error('Error confirming payment intent:', error);
    return false;
  }
};

export const getStripePublishKey = (): string => {
  return env.STRIPE_PUBLISH_KEY;
};

/**
 * Create or retrieve a Stripe customer
 */
export const getOrCreateCustomer = async (email: string, name?: string, metadata?: Record<string, string>): Promise<{ customerId: string } | { error: string }> => {
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
  } catch (error) {
    console.error('Error creating/retrieving Stripe customer:', error);
    return {
      error: error instanceof Error ? error.message : 'Unknown error occurred',
    };
  }
};

/**
 * Create a Stripe Subscription for auto-renewal
 * This replaces the one-time Payment Intent approach
 */
export const createStripeSubscription = async (params: CreateStripeSubscriptionParams): Promise<SubscriptionResult> => {
  try {
    // Get or create customer
    const customerResult = params.customerId 
      ? { customerId: params.customerId }
      : await getOrCreateCustomer(params.customerEmail, params.customerName, {
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
    } else {
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
    const subscriptionParams: Stripe.SubscriptionCreateParams = {
      customer: customerId,
      items: [{ price_data: priceData as any }],
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
    const invoice = subscription.latest_invoice as Stripe.Invoice;
    let clientSecret: string | undefined;
    
    if (invoice && typeof invoice === 'object' && 'payment_intent' in invoice) {
      const paymentIntentId = invoice.payment_intent;
      if (typeof paymentIntentId === 'string') {
        // If it's a string, retrieve the payment intent
        try {
          const paymentIntent = await stripe.paymentIntents.retrieve(paymentIntentId);
          clientSecret = paymentIntent.client_secret || undefined;
        } catch (error) {
          console.error('Error retrieving payment intent:', error);
        }
      } else if (paymentIntentId && typeof paymentIntentId === 'object') {
        // If it's already expanded
        clientSecret = (paymentIntentId as Stripe.PaymentIntent).client_secret || undefined;
      }
    }

    return {
      success: true,
      subscriptionId: subscription.id,
      customerId: customerId,
      clientSecret: clientSecret,
    };
  } catch (error) {
    console.error('Error creating Stripe subscription:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error occurred',
    };
  }
};

/**
 * Retrieve a Stripe subscription
 */
export const getStripeSubscription = async (subscriptionId: string): Promise<Stripe.Subscription | null> => {
  try {
    return await stripe.subscriptions.retrieve(subscriptionId);
  } catch (error) {
    console.error('Error retrieving Stripe subscription:', error);
    return null;
  }
};

/**
 * Cancel a Stripe subscription
 */
export const cancelStripeSubscription = async (subscriptionId: string, immediately: boolean = false): Promise<boolean> => {
  try {
    if (immediately) {
      await stripe.subscriptions.cancel(subscriptionId);
    } else {
      // Cancel at period end
      await stripe.subscriptions.update(subscriptionId, {
        cancel_at_period_end: true,
      });
    }
    return true;
  } catch (error) {
    console.error('Error canceling Stripe subscription:', error);
    return false;
  }
};

/**
 * Update a Stripe subscription (e.g., change plan)
 */
export const updateStripeSubscription = async (
  subscriptionId: string,
  newPriceId?: string,
  newAmount?: number,
  newInterval?: 'month' | 'year'
): Promise<SubscriptionResult> => {
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
    } else if (newAmount && newInterval) {
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
  } catch (error) {
    console.error('Error updating Stripe subscription:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error occurred',
    };
  }
};
