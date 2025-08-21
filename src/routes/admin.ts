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

export default router;
