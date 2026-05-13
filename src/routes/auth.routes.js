import express from 'express';
import { signup, signIn, signOut, me } from '#controllers/auth.controller.js';
import { requireAuth } from '#middleware/auth.middleware.js';

const router = express.Router();

router.post('/sign-up', signup);
router.post('/sign-in', signIn);
router.post('/sign-out', signOut);
router.get('/me', requireAuth, me);

export default router;
