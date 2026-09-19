import { Router } from 'express';
import { triggerReminderSweep } from '../controllers/notifications.controller';

const router = Router();

router.post('/reminders/run', triggerReminderSweep);

export default router;
