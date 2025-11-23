import { Router } from 'express';
import authRoutes from './auth';
import userRoutes from './user';
import petRoutes from './pet';
import adminRoutes from './admin';
import qrcodeRoutes from './qrcode';
import stripeRoutes from './stripe';

const router = Router();

router.use('/auth', authRoutes);
router.use('/user', userRoutes);
router.use('/pet', petRoutes);
router.use('/admin', adminRoutes);
router.use('/qr', qrcodeRoutes);
router.use('/stripe', stripeRoutes);

export default router; 