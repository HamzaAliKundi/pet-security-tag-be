import { Router } from 'express';
import { login, register, resetPassword, sendForgotPasswordEmail, verifyEmail } from '../controllers/auth';

const router = Router();

router.post('/login', login);
router.post('/register', register);
router.post('/verify-email', verifyEmail);
router.post('/forgot-password', sendForgotPasswordEmail);
router.post('/reset-password', resetPassword);

export default router; 