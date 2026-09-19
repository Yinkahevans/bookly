import { Router } from 'express';
import { setRole } from '../controllers/auth.controller';

const router = Router();
router.post('/role', setRole);

export default router;