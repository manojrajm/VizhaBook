import express from 'express';
import { loginUser, registerUser, getMe, resetPassword } from '../controllers/authController.js';
import { protect } from '../middleware/authMiddleware.js';

const router = express.Router();

router.post('/login', loginUser);
router.post('/signup', registerUser);
router.get('/me', protect, getMe);
router.post('/reset-password', resetPassword);

export default router;
