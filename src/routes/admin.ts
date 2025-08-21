import { Router } from 'express';
import { authMiddleware } from '../middleware/auth';
import { getOverview } from '../controllers/admin/overview';
import { getRecentActivity } from '../controllers/admin/recentActivity';

const router = Router();

// All admin routes require authentication
router.use(authMiddleware);

// Admin overview endpoint
router.get('/overview', getOverview);

// Admin recent activity endpoint
router.get('/recent-activity', getRecentActivity);

export default router;
