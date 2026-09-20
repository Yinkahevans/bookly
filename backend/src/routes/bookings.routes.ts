import { Router } from 'express';
import { notifyNewBooking, updateBookingStatus } from '../controllers/bookings.controller.js';
import { requireBookingOwner } from '../middleware/auth.middleware.js';

const router = Router();

router.post('/:bookingId/notify', notifyNewBooking);
router.patch('/:bookingId/status', requireBookingOwner, updateBookingStatus);

export default router;
