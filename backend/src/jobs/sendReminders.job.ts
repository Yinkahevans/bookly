import cron from 'node-cron';
import { runReminderSweep } from '../services/reminder.service';

// Runs every 30 minutes. On Render, this can instead be a separate "Cron Job" service
// running `node dist/jobs/sendReminders.job.js` once per run — either works.
export function scheduleReminderJob() {
  cron.schedule('*/30 * * * *', async () => {
    console.log('[reminder job] running sweep');
    await runReminderSweep();
  });
}
