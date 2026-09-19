import { Router } from 'express';
import { requireAdmin } from '../middleware/auth.middleware';
import {
  getStats,
  listBusinesses,
  updateBusinessStatus,
  listBookings,
  listUsers,
  getSettings,
  updateSettings,
} from '../controllers/admin.controller';

const router = Router();

router.use(requireAdmin);

router.get('/stats', getStats);
router.get('/businesses', listBusinesses);
router.patch('/businesses/:businessId/status', updateBusinessStatus);
router.get('/bookings', listBookings);
router.get('/users', listUsers);
router.get('/settings', getSettings);
router.patch('/settings', updateSettings);

export default router;