import { Router } from 'express';
import { authMiddleware } from '../middleware/auth';
import { getOverview } from '../controllers/admin/overview';
import { getRecentActivity } from '../controllers/admin/recentActivity';
import { 
  getUsers, 
  getUserById, 
  updateUserStatus, 
  deleteUser, 
  getUserStats
} from '../controllers/admin/users';
import { 
  getPets, 
  getPetById, 
  deletePet, 
  getPetStats
} from '../controllers/admin/pets';
import { 
  getOrders, 
  getOrderById, 
  updateOrderStatus, 
  getOrderStats
} from '../controllers/admin/orders';
import { 
  getPayments, 
  getPaymentById, 
  getPaymentStats
} from '../controllers/admin/payments';
import {
  generateBulkQRCodes,
  getAllQRCodes,
  getQRCodeById,
  getQRStats,
  deleteQRCode,
  bulkDeleteQRCodes,
  downloadQRCodesCSV
} from '../controllers/qrcode/qrManagement';
import {
  getAllContacts,
  getContact,
  updateContactStatus
} from '../controllers/user/contact';
import {
  getAllInvestments,
  getInvestmentById,
  updateInvestmentStatus
} from '../controllers/user/invest';
import {
  updateUserLoyaltyPoints,
  getUserLoyaltyInfo,
  updateRewardRedemptionStatus,
  getPendingRewardRedemptions
} from '../controllers/admin/loyalty';


const router = Router();

// All admin routes require authentication
router.use(authMiddleware);

// Admin overview endpoint
router.get('/overview', getOverview);

// Admin recent activity endpoint
router.get('/recent-activity', getRecentActivity);

// Admin user management endpoints
router.get('/users', getUsers);
router.get('/users/:userId', getUserById);
router.put('/users/:userId/status', updateUserStatus);
router.delete('/users/:userId', deleteUser);
router.get('/users/stats', getUserStats);
router.get('/users/:userId/loyalty', getUserLoyaltyInfo);
router.put('/users/:userId/loyalty-points', updateUserLoyaltyPoints);

// Admin pet management endpoints
router.get('/pets', getPets);
router.get('/pets/:petId', getPetById);
router.delete('/pets/:petId', deletePet);
router.get('/pets/stats', getPetStats);

// Admin order management endpoints
router.get('/orders', getOrders);
router.get('/orders/:orderId', getOrderById);
router.put('/orders/:orderId/status', updateOrderStatus);
router.get('/orders/stats', getOrderStats);

// Admin payment management endpoints
router.get('/payments', getPayments);
router.get('/payments/stats', getPaymentStats);
router.get('/payments/:paymentId', getPaymentById);

// Admin QR code management endpoints
router.post('/qr-codes/generate-bulk', generateBulkQRCodes);
router.get('/qr-codes', getAllQRCodes);
router.get('/qr-codes/stats', getQRStats);
router.delete('/qr-codes/bulk', bulkDeleteQRCodes);
router.get('/qr-codes/download/csv', downloadQRCodesCSV);
router.get('/qr-codes/:qrId', getQRCodeById);
router.delete('/qr-codes/:qrId', deleteQRCode);

// Admin contact management endpoints
router.get('/contacts', getAllContacts);
router.get('/contacts/:contactId', getContact);
router.put('/contacts/:contactId/status', updateContactStatus);

// Admin investment management endpoints
router.get('/investments', getAllInvestments);
router.get('/investments/:investmentId', getInvestmentById);
router.put('/investments/:investmentId/status', updateInvestmentStatus);

// Admin reward redemption endpoints
router.get('/reward-redemptions/pending', getPendingRewardRedemptions);
router.put('/reward-redemptions/:redemptionId/status', updateRewardRedemptionStatus);

export default router;
