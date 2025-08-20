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

export interface PaymentIntentResult {
  success: boolean;
  paymentIntentId?: string;
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
