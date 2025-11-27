"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const auth_1 = require("../middleware/auth");
// QR Management controllers (only non-admin functions)
// Admin QR functions are now in admin routes
// QR Scanning controllers
const qrScanning_1 = require("../controllers/qrcode/qrScanning");
// Location sharing controller
const locationShare_1 = require("../controllers/qrcode/locationShare");
const router = (0, express_1.Router)();
// Public routes (no authentication required)
// Check QR code availability
router.get('/check-availability', qrScanning_1.checkQRAvailability);
// QR scanning route - when someone scans a QR code
router.get('/scan/:code', qrScanning_1.scanQRCode);
// Get QR verification details (for showing subscription page) - optional auth to detect logged-in user
router.get('/verify-details/:code', auth_1.optionalAuthMiddleware, qrScanning_1.getQRVerificationDetails);
// Get pet profile for public view (when finder scans verified QR)
router.get('/pet-profile/:petId', qrScanning_1.getPetProfileByQR);
// Share location with pet owner (public route)
router.post('/share-location', locationShare_1.shareLocation);
// Protected routes (authentication required)
// Auto-verify QR code if user has active subscription
router.post('/auto-verify', auth_1.authMiddleware, qrScanning_1.autoVerifyQRCode);
// Verify QR code with subscription (user must be logged in)
router.post('/verify-subscription', auth_1.authMiddleware, qrScanning_1.verifyQRCodeWithSubscription);
// Confirm subscription payment
router.post('/confirm-subscription', auth_1.authMiddleware, qrScanning_1.confirmSubscriptionPayment);
// Note: Admin QR code management routes have been moved to /admin/qr-codes/* 
// in the admin routes file to follow the existing admin pattern
exports.default = router;
