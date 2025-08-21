import { Router } from 'express';
import { authMiddleware } from '../middleware/auth';
import { getOverview } from '../controllers/admin/overview';
import { getRecentActivity } from '../controllers/admin/recentActivity';
import { 
  getUsers, 
  getUserById, 
  updateUserStatus, 
  deleteUser, 
  getUserStats
} from '../controllers/admin/users';

const router = Router();

// All admin routes require authentication
router.use(authMiddleware);

// Admin overview endpoint
router.get('/overview', getOverview);

// Admin recent activity endpoint
router.get('/recent-activity', getRecentActivity);

// Admin user management endpoints
router.get('/users', getUsers);
router.get('/users/:userId', getUserById);
router.put('/users/:userId/status', updateUserStatus);
router.delete('/users/:userId', deleteUser);
router.get('/users/stats', getUserStats);

export default router;
