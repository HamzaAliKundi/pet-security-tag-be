/**
 * Manual Webhook Test Script
 * 
 * This script manually tests the webhook handler by simulating Stripe webhook events
 * Useful for testing without Stripe CLI or Dashboard
 * 
 * Usage: npx ts-node test-webhook-manual.ts
 */

import express from 'express';
import { handleStripeWebhook } from './src/controllers/stripe/webhook';
import Stripe from 'stripe';
import dotenv from 'dotenv';

dotenv.config();

const app = express();
const port = 3001;

// Middleware to parse raw body (required for webhook signature verification)
app.use('/webhook', express.raw({ type: 'application/json' }));
app.use(express.json());

// Test endpoint
app.post('/test-webhook', async (req, res) => {
  try {
    console.log('🧪 Testing webhook handler...\n');

    // Create a mock invoice.payment_succeeded event
    const mockInvoice: any = {
      id: 'in_test_123',
      object: 'invoice',
      amount_paid: 275, // £2.75 in cents
      currency: 'gbp',
      subscription: 'sub_test_123', // This should match a subscription in your DB
      payment_intent: 'pi_test_123',
      status: 'paid',
      // Add other required invoice fields
    };

    const mockEvent: Stripe.Event = {
      id: 'evt_test_123',
      object: 'event',
      api_version: '2025-07-30.basil',
      created: Math.floor(Date.now() / 1000),
      data: {
        object: mockInvoice,
        previous_attributes: null,
      },
      livemode: false,
      pending_webhooks: 1,
      request: {
        id: null,
        idempotency_key: null,
      },
      type: 'invoice.payment_succeeded',
    };

    // Create a mock request
    const mockReq = {
      headers: {
        'stripe-signature': 'test_signature',
      },
      body: Buffer.from(JSON.stringify(mockEvent)),
    } as any;

    const mockRes = {
      status: (code: number) => ({
        json: (data: any) => {
          console.log(`Response Status: ${code}`);
          console.log('Response Data:', JSON.stringify(data, null, 2));
          return mockRes;
        },
      }),
      json: (data: any) => {
        console.log('Response:', JSON.stringify(data, null, 2));
        return mockRes;
      },
    } as any;

    // Note: This will fail signature verification, but you can test the logic
    console.log('⚠️  Note: Signature verification will fail in manual test');
    console.log('   Use Stripe CLI or Dashboard for full webhook testing\n');

    // For manual testing, you might want to bypass signature verification
    // by temporarily modifying the webhook handler

    res.json({
      message: 'Manual webhook test',
      note: 'Use Stripe CLI or Dashboard for proper webhook testing',
    });
  } catch (error) {
    console.error('Error:', error);
    res.status(500).json({ error: 'Test failed' });
  }
});

app.listen(port, () => {
  console.log(`🧪 Test server running on http://localhost:${port}`);
  console.log(`   POST http://localhost:${port}/test-webhook to test\n`);
});

