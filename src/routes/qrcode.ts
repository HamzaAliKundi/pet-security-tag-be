import { Router } from 'express';
import { authMiddleware } from '../middleware/auth';

// QR Management controllers (only non-admin functions)
// Admin QR functions are now in admin routes

// QR Scanning controllers
import {
  scanQRCode,
  getQRVerificationDetails,
  verifyQRCodeWithSubscription,
  autoVerifyQRCode,
  confirmSubscriptionPayment,
  getPetProfileByQR
} from '../controllers/qrcode/qrScanning';

// Location sharing controller
import { shareLocation } from '../controllers/qrcode/locationShare';

const router = Router();

// Public routes (no authentication required)
// QR scanning route - when someone scans a QR code
router.get('/scan/:code', scanQRCode);

// Get QR verification details (for showing subscription page)
router.get('/verify-details/:code', getQRVerificationDetails);

// Get pet profile for public view (when finder scans verified QR)
router.get('/pet-profile/:petId', getPetProfileByQR);

// Share location with pet owner (public route)
router.post('/share-location', shareLocation);

// Protected routes (authentication required)
// Auto-verify QR code if user has active subscription
router.post('/auto-verify', authMiddleware, autoVerifyQRCode);

// Verify QR code with subscription (user must be logged in)
router.post('/verify-subscription', authMiddleware, verifyQRCodeWithSubscription);

// Confirm subscription payment
router.post('/confirm-subscription', authMiddleware, confirmSubscriptionPayment);

// Note: Admin QR code management routes have been moved to /admin/qr-codes/* 
// in the admin routes file to follow the existing admin pattern

export default router;
