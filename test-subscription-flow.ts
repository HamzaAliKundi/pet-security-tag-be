/**
 * Test Script for Stripe Auto-Renewal Flow
 * 
 * This script helps test the subscription auto-renewal functionality
 * 
 * Usage:
 * 1. Make sure your server is running
 * 2. Update the test data below (userId, qrCodeId, etc.)
 * 3. Run: npx ts-node test-subscription-flow.ts
 */

import Stripe from 'stripe';
import dotenv from 'dotenv';
import mongoose from 'mongoose';
import Subscription from './src/models/Subscription';
import { createStripeSubscription } from './src/utils/stripeService';

dotenv.config();

const STRIPE_SECRET_KEY = process.env.STRIPE_SECRET_KEY;
if (!STRIPE_SECRET_KEY) {
  console.error('STRIPE_SECRET_KEY not found in environment variables');
  process.exit(1);
}

const MONGODB_URI = process.env.MONGODB_URI;
if (!MONGODB_URI) {
  console.error('MONGODB_URI not found in environment variables');
  process.exit(1);
}

const stripe = new Stripe(STRIPE_SECRET_KEY, {
  apiVersion: '2025-07-30.basil',
});

// ============================================
// UPDATE THESE VALUES FOR YOUR TEST
// ============================================
const TEST_USER_ID = 'YOUR_USER_ID_HERE'; // MongoDB ObjectId
const TEST_QR_CODE_ID = 'YOUR_QR_CODE_ID_HERE'; // MongoDB ObjectId
const TEST_EMAIL = 'test@example.com';
const TEST_NAME = 'Test User';
const SUBSCRIPTION_TYPE = 'monthly'; // 'monthly' or 'yearly'
// ============================================

async function testSubscriptionFlow() {
  try {
    console.log('🚀 Starting Subscription Auto-Renewal Test\n');

    // Connect to MongoDB
    console.log('📦 Connecting to MongoDB...');
    await mongoose.connect(MONGODB_URI);
    console.log('✅ Connected to MongoDB\n');

    // Step 1: Create a test customer in Stripe
    console.log('👤 Creating test customer in Stripe...');
    const customer = await stripe.customers.create({
      email: TEST_EMAIL,
      name: TEST_NAME,
      metadata: {
        userId: TEST_USER_ID,
        test: 'true',
      },
    });
    console.log(`✅ Customer created: ${customer.id}\n`);

    // Step 2: Create a test payment method
    console.log('💳 Creating test payment method...');
    const paymentMethod = await stripe.paymentMethods.create({
      type: 'card',
      card: {
        number: '4242 4242 4242 4242',
        exp_month: 12,
        exp_year: 2025,
        cvc: '123',
      },
    });
    console.log(`✅ Payment method created: ${paymentMethod.id}\n`);

    // Step 3: Attach payment method to customer
    console.log('🔗 Attaching payment method to customer...');
    await stripe.paymentMethods.attach(paymentMethod.id, {
      customer: customer.id,
    });
    console.log('✅ Payment method attached\n');

    // Step 4: Set as default payment method
    console.log('⭐ Setting default payment method...');
    await stripe.customers.update(customer.id, {
      invoice_settings: {
        default_payment_method: paymentMethod.id,
      },
    });
    console.log('✅ Default payment method set\n');

    // Step 5: Create Stripe Subscription
    console.log('📝 Creating Stripe subscription...');
    const pricing = {
      monthly: 275, // £2.75 in cents
      yearly: 1999, // £19.99 in cents
    };

    const amount = pricing[SUBSCRIPTION_TYPE as keyof typeof pricing];
    const interval = SUBSCRIPTION_TYPE === 'monthly' ? 'month' : 'year';

    const subscriptionResult = await createStripeSubscription({
      customerId: customer.id,
      customerEmail: TEST_EMAIL,
      customerName: TEST_NAME,
      amount: amount,
      currency: 'gbp',
      interval: interval as 'month' | 'year',
      paymentMethodId: paymentMethod.id,
      metadata: {
        userId: TEST_USER_ID,
        subscriptionId: 'test',
        qrCodeId: TEST_QR_CODE_ID,
      },
    });

    if (!subscriptionResult.success) {
      console.error('❌ Failed to create subscription:', subscriptionResult.error);
      return;
    }

    console.log(`✅ Subscription created: ${subscriptionResult.subscriptionId}`);
    console.log(`   Customer ID: ${subscriptionResult.customerId}`);
    console.log(`   Client Secret: ${subscriptionResult.clientSecret?.substring(0, 20)}...\n`);

    // Step 6: Confirm the payment (simulate frontend confirmation)
    if (subscriptionResult.clientSecret) {
      console.log('💳 Confirming payment...');
      // In a real scenario, you would use Stripe.js on the frontend
      // For testing, we'll just verify the subscription is active
      const subscription = await stripe.subscriptions.retrieve(subscriptionResult.subscriptionId!);
      console.log(`✅ Subscription status: ${subscription.status}\n`);
    }

    // Step 7: Create subscription record in database
    console.log('💾 Creating subscription record in database...');
    const endDate = new Date();
    if (SUBSCRIPTION_TYPE === 'monthly') {
      endDate.setMonth(endDate.getMonth() + 1);
    } else {
      endDate.setFullYear(endDate.getFullYear() + 1);
    }

    const dbSubscription = await Subscription.create({
      userId: TEST_USER_ID,
      qrCodeId: TEST_QR_CODE_ID,
      type: SUBSCRIPTION_TYPE as 'monthly' | 'yearly',
      status: 'active',
      startDate: new Date(),
      endDate: endDate,
      stripeSubscriptionId: subscriptionResult.subscriptionId,
      paymentIntentId: 'test_payment_intent',
      amountPaid: amount / 100,
      currency: 'gbp',
      autoRenew: true,
    });

    console.log(`✅ Database subscription created: ${dbSubscription._id}\n`);

    // Step 8: Test webhook - simulate invoice.payment_succeeded
    console.log('🔔 Testing webhook handler...');
    console.log('   To test the webhook:');
    console.log(`   1. Use Stripe CLI: stripe trigger invoice.payment_succeeded`);
    console.log(`   2. Or send test webhook from Stripe Dashboard`);
    console.log(`   3. Make sure webhook includes subscription: ${subscriptionResult.subscriptionId}\n`);

    // Step 9: Verify subscription in database
    console.log('🔍 Verifying subscription in database...');
    const verifySubscription = await Subscription.findOne({
      stripeSubscriptionId: subscriptionResult.subscriptionId,
    });

    if (verifySubscription) {
      console.log('✅ Subscription found in database');
      console.log(`   ID: ${verifySubscription._id}`);
      console.log(`   Type: ${verifySubscription.type}`);
      console.log(`   Status: ${verifySubscription.status}`);
      console.log(`   Auto Renew: ${verifySubscription.autoRenew}`);
      console.log(`   End Date: ${verifySubscription.endDate}\n`);
    } else {
      console.log('❌ Subscription not found in database\n');
    }

    console.log('✅ Test setup complete!\n');
    console.log('📋 Next Steps:');
    console.log('   1. Trigger a test webhook event');
    console.log('   2. Check server logs for webhook processing');
    console.log('   3. Verify new subscription record is created');
    console.log('   4. Verify old subscription is marked as expired');
    console.log('   5. Check email notifications (if configured)\n');

    // Cleanup option
    console.log('🧹 To cleanup test data:');
    console.log(`   - Delete subscription in Stripe: ${subscriptionResult.subscriptionId}`);
    console.log(`   - Delete customer in Stripe: ${customer.id}`);
    console.log(`   - Delete subscription in DB: ${dbSubscription._id}\n`);

  } catch (error) {
    console.error('❌ Test failed:', error);
  } finally {
    await mongoose.disconnect();
    console.log('👋 Disconnected from MongoDB');
  }
}

// Run the test
testSubscriptionFlow();

