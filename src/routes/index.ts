import { Router } from 'express';
import authRoutes from './auth';
import userRoutes from './user';
import petRoutes from './pet';

const router = Router();

router.use('/auth', authRoutes);
router.use('/user', userRoutes);
router.use('/pet', petRoutes);

export default router; 