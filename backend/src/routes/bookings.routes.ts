import { Router } from 'express';
import { notifyNewBooking, updateBookingStatus } from '../controllers/bookings.controller';
import { requireBookingOwner } from '../middleware/auth.middleware';

const router = Router();

router.post('/:bookingId/notify', notifyNewBooking);
router.patch('/:bookingId/status', requireBookingOwner, updateBookingStatus);

export default router;
