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

const router = Router();

// Pet tag order endpoints
router.post('/orders', createOrder);

// Contact form endpoints
router.post('/contact', submitContact);
router.get('/contact', getAllContacts);
router.get('/contact/:contactId', getContact);
router.put('/contact/:contactId/status', updateContactStatus);

export default router; 