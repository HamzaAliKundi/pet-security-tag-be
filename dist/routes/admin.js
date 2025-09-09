"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const auth_1 = require("../middleware/auth");
const overview_1 = require("../controllers/admin/overview");
const recentActivity_1 = require("../controllers/admin/recentActivity");
const users_1 = require("../controllers/admin/users");
const pets_1 = require("../controllers/admin/pets");
const orders_1 = require("../controllers/admin/orders");
const payments_1 = require("../controllers/admin/payments");
const qrManagement_1 = require("../controllers/qrcode/qrManagement");
const router = (0, express_1.Router)();
// All admin routes require authentication
router.use(auth_1.authMiddleware);
// Admin overview endpoint
router.get('/overview', overview_1.getOverview);
// Admin recent activity endpoint
router.get('/recent-activity', recentActivity_1.getRecentActivity);
// Admin user management endpoints
router.get('/users', users_1.getUsers);
router.get('/users/:userId', users_1.getUserById);
router.put('/users/:userId/status', users_1.updateUserStatus);
router.delete('/users/:userId', users_1.deleteUser);
router.get('/users/stats', users_1.getUserStats);
// Admin pet management endpoints
router.get('/pets', pets_1.getPets);
router.get('/pets/:petId', pets_1.getPetById);
router.delete('/pets/:petId', pets_1.deletePet);
router.get('/pets/stats', pets_1.getPetStats);
// Admin order management endpoints
router.get('/orders', orders_1.getOrders);
router.get('/orders/:orderId', orders_1.getOrderById);
router.put('/orders/:orderId/status', orders_1.updateOrderStatus);
router.get('/orders/stats', orders_1.getOrderStats);
// Admin payment management endpoints
router.get('/payments', payments_1.getPayments);
router.get('/payments/stats', payments_1.getPaymentStats);
router.get('/payments/:paymentId', payments_1.getPaymentById);
// Admin QR code management endpoints
router.post('/qr-codes/generate-bulk', qrManagement_1.generateBulkQRCodes);
router.get('/qr-codes', qrManagement_1.getAllQRCodes);
router.get('/qr-codes/stats', qrManagement_1.getQRStats);
router.get('/qr-codes/:qrId', qrManagement_1.getQRCodeById);
router.delete('/qr-codes/:qrId', qrManagement_1.deleteQRCode);
exports.default = router;
