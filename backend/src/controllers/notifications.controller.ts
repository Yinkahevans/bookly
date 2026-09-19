import { Request, Response } from 'express';
import { runReminderSweep } from '../services/reminder.service';

// Manual trigger, useful for testing the reminder flow without waiting for the cron tick.
export async function triggerReminderSweep(_req: Request, res: Response) {
  await runReminderSweep();
  res.json({ ok: true });
}
