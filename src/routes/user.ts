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
import { 
  createPet, 
  getUserPets, 
  getPet, 
  updatePet, 
  uploadPetImage 
} from '../controllers/user/pet';
import { 
  getUserSubscriptions, 
  getSubscriptionStats 
} from '../controllers/user/subscription';
import { upload } from '../utils/imageUploadService';

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

// Pet management endpoints (Private)
router.post('/pets', authMiddleware, createPet);
router.get('/pets', authMiddleware, getUserPets);
router.get('/pets/:petId', authMiddleware, getPet);
router.put('/pets/:petId', authMiddleware, updatePet);
router.post('/pets/:petId/upload-image', authMiddleware, upload.single('image'), uploadPetImage);

// Subscription endpoints (Private)
router.get('/subscriptions', authMiddleware, getUserSubscriptions);
router.get('/subscriptions/stats', authMiddleware, getSubscriptionStats);

export default router; 