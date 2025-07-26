import { Router } from 'express';
import { 
  createOrder, 
} from '../controllers/user/order';
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

// User dashbaord (Private)
router.get("/get-single-user", authMiddleware, getSingleUser);
router.patch("/update-single-user", authMiddleware, updateSingleUser);


export default router; 