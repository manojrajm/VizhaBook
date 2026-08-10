import express from 'express';
import { loginUser, registerUser, getMe, resetPassword } from '../controllers/authController.js';
import { protect } from '../middleware/authMiddleware.js';
import { validateRequest, signupValidationSchema, loginValidationSchema } from '../middleware/authValidation.js';

const router = express.Router();

router.post('/login', validateRequest(loginValidationSchema), loginUser);
router.post('/signup', validateRequest(signupValidationSchema), registerUser);
router.get('/me', protect, getMe);
router.post('/reset-password', resetPassword);

export default router;
