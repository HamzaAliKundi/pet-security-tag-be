import { Router } from 'express';
import { authMiddleware } from '../middleware/auth';
import {
  createPet,
  getUserPets,
  getPet,
  updatePet
} from '../controllers/user/pet';

const router = Router();

// All pet routes require authentication
router.use(authMiddleware);

// Pet management endpoints
router.post('/', createPet);
router.get('/', getUserPets);
router.get('/:petId', getPet);
router.put('/:petId', updatePet);

export default router;
