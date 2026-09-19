import express from 'express';
import cors from 'cors';
import 'dotenv/config';

import bookingsRoutes from './routes/bookings.routes';
import notificationsRoutes from './routes/notifications.routes';
import adminRoutes from './routes/admin.routes';
import authRoutes from './routes/auth.routes';
import { scheduleReminderJob } from './jobs/sendReminders.job';

const app = express();
const PORT = process.env.PORT || 4000;

app.use(
  cors({
    origin: [process.env.FRONTEND_URL || 'http://localhost:5173', process.env.ADMIN_URL || 'http://localhost:5174'],
  })
);
app.use(express.json());

app.get('/health', (_req, res) => res.json({ ok: true, service: 'bookly-backend' }));

app.use('/bookings', bookingsRoutes);
app.use('/notifications', notificationsRoutes);
app.use('/admin', adminRoutes);
app.use('/auth', authRoutes);

app.listen(PORT, () => {
  console.log(`Bookly backend listening on :${PORT}`);
  scheduleReminderJob();
});
