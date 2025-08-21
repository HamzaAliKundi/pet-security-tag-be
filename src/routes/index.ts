import { Router } from 'express';
import authRoutes from './auth';
import userRoutes from './user';
import petRoutes from './pet';
import adminRoutes from './admin';

const router = Router();

router.use('/auth', authRoutes);
router.use('/user', userRoutes);
router.use('/pet', petRoutes);
router.use('/admin', adminRoutes);

export default router; 