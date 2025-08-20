import { Router } from 'express';
import { 
  createOrder, 
} from '../controllers/user/order';
import { 
  createUserPetTagOrder,
  getUserPetTagOrders,
  getUserPetTagOrder,
  updateUserPetTagOrder,
  confirmPayment
} from '../controllers/user/userPetTagOrder';
import { 
  submitContact, 
  getAllContacts, 
  getContact, 
  updateContactStatus 
} from '../controllers/user/contact';
import { authMiddleware } from '../middleware/auth';
import { getSingleUser, updateSingleUser } from '../controllers/user/account';

const router = Router();

// Pet tag order endpoints (public)
router.post('/orders', createOrder);

// Contact form endpoints (public)
router.post('/contact', submitContact);
router.get('/contact', getAllContacts);
router.get('/contact/:contactId', getContact);
router.put('/contact/:contactId/status', updateContactStatus);

// User dashboard (Private)
router.get("/get-single-user", authMiddleware, getSingleUser);
router.patch("/update-single-user", authMiddleware, updateSingleUser);

// Authenticated user pet tag order endpoints (Private)
router.post('/user-pet-tag-orders', authMiddleware, createUserPetTagOrder);
router.get('/user-pet-tag-orders', authMiddleware, getUserPetTagOrders);
router.get('/user-pet-tag-orders/:orderId', authMiddleware, getUserPetTagOrder);
router.put('/user-pet-tag-orders/:orderId', authMiddleware, updateUserPetTagOrder);
router.post('/user-pet-tag-orders/:orderId/confirm-payment', authMiddleware, confirmPayment);

export default router; 