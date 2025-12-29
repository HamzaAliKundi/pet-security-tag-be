import { Router } from 'express';
import { 
  createOrder,
  confirmPayment as confirmPublicOrderPayment,
  getLatestOrders
} from '../controllers/user/order';
import { 
  createUserPetTagOrder,
  getUserPetTagOrders,
  getUserPetTagOrder,
  updateUserPetTagOrder,
  confirmPayment,
  getUserPetCount,
  createReplacementOrder,
  confirmReplacementPayment
} from '../controllers/user/userPetTagOrder';
import { 
  submitContact, 
  getAllContacts, 
  getContact, 
  updateContactStatus 
} from '../controllers/user/contact';
import { submitInvestment } from '../controllers/user/invest';
import { submitReview, getMyReview, getApprovedReviews } from '../controllers/user/review';
import { authMiddleware } from '../middleware/auth';
import { getSingleUser, updateSingleUser, deleteAccount } from '../controllers/user/account';
import { 
  createPet, 
  getUserPets, 
  getPet, 
  updatePet, 
  uploadPetImage 
} from '../controllers/user/pet';
import { 
  getUserSubscriptions, 
  getSubscriptionStats,
  renewSubscription,
  upgradeSubscription,
  confirmSubscriptionPayment
} from '../controllers/user/subscription';
import { getLoyaltyInfo, getReferralLink } from '../controllers/user/loyalty';
import { validateDiscount } from '../controllers/user/discount';
import { upload } from '../utils/imageUploadService';

const router = Router();

// Pet tag order endpoints (public)
router.post('/orders', createOrder);
router.post('/orders/:orderId/confirm-payment', confirmPublicOrderPayment);
router.get('/orders/latest', getLatestOrders);

// Discount validation endpoint (public)
router.post('/discounts/validate', validateDiscount);

// Contact form endpoints (public)
router.post('/contact', submitContact);
router.get('/contact', getAllContacts);
router.get('/contact/:contactId', getContact);
router.put('/contact/:contactId/status', updateContactStatus);

// Investment inquiry endpoints (public)
router.post('/invest', submitInvestment);

// Review endpoints
router.post('/reviews', authMiddleware, submitReview);
router.get('/reviews/my-review', authMiddleware, getMyReview);
router.get('/reviews', getApprovedReviews);

// User dashboard (Private)
router.get("/get-single-user", authMiddleware, getSingleUser);
router.patch("/update-single-user", authMiddleware, updateSingleUser);
router.delete("/delete-account", authMiddleware, deleteAccount);

// Authenticated user pet tag order endpoints (Private)
router.get('/user-pet-count', authMiddleware, getUserPetCount);
router.post('/user-pet-tag-orders', authMiddleware, createUserPetTagOrder);
router.get('/user-pet-tag-orders', authMiddleware, getUserPetTagOrders);
router.get('/user-pet-tag-orders/:orderId', authMiddleware, getUserPetTagOrder);
router.put('/user-pet-tag-orders/:orderId', authMiddleware, updateUserPetTagOrder);
router.post('/user-pet-tag-orders/:orderId/confirm-payment', authMiddleware, confirmPayment);

// Replacement order endpoints (Private)
router.post('/pets/:petId/replacement-order', authMiddleware, createReplacementOrder);
router.post('/replacement-orders/:orderId/confirm-payment', authMiddleware, confirmReplacementPayment);

// Pet management endpoints (Private)
router.post('/pets', authMiddleware, createPet);
router.get('/pets', authMiddleware, getUserPets);
router.get('/pets/:petId', authMiddleware, getPet);
router.put('/pets/:petId', authMiddleware, updatePet);
router.post('/pets/:petId/upload-image', authMiddleware, upload.single('image'), uploadPetImage);

// Subscription endpoints (Private)
router.get('/subscriptions', authMiddleware, getUserSubscriptions);
router.get('/subscriptions/stats', authMiddleware, getSubscriptionStats);
router.post('/subscriptions/renew', authMiddleware, renewSubscription);
router.post('/subscriptions/upgrade', authMiddleware, upgradeSubscription);
router.post('/subscriptions/confirm-payment', authMiddleware, confirmSubscriptionPayment);

// Loyalty endpoints (Private)
router.get('/loyalty', authMiddleware, getLoyaltyInfo);
router.get('/loyalty/referral-link', authMiddleware, getReferralLink);

export default router; 