import { Router } from 'express';
import { handleStripeWebhook } from '../controllers/stripe/webhook';

const router = Router();

/**
 * Stripe Webhook Endpoint
 * 
 * IMPORTANT: This endpoint must receive raw body for signature verification
 * Make sure express.json() middleware is NOT applied to this route
 * 
 * Configure in Stripe Dashboard:
 * 1. Go to Developers > Webhooks
 * 2. Add endpoint: https://yourdomain.com/api/v1/stripe/webhook
 * 3. Subscribe to events:
 *    - invoice.payment_succeeded
 *    - invoice.payment_failed
 *    - customer.subscription.updated
 *    - customer.subscription.deleted
 *    - customer.subscription.created
 * 4. Copy the webhook signing secret to your .env as STRIPE_WEBHOOK_SECRET
 */
router.post('/webhook', handleStripeWebhook);

export default router;

