import express from 'express';
import {
    adminLogin,
    getAdminDashboard,
    getAdminUsers,
    updateUserSubscription
} from '../controllers/adminController.js';
import { verifyAdmin } from '../middleware/adminMiddleware.js';
import {
    validateAdminPayload,
    adminLoginSchema,
    manualSubscriptionSchema
} from '../middleware/adminValidation.js';

const router = express.Router();

// Admin Login (Public endpoint with Zod validation)
router.post('/login', validateAdminPayload(adminLoginSchema), adminLogin);

// Protected Super Admin Routes (Requires valid JWT + SUPER_ADMIN role)
router.get('/dashboard', verifyAdmin, getAdminDashboard);
router.get('/users', verifyAdmin, getAdminUsers);
router.patch('/users/:userId/subscription', verifyAdmin, validateAdminPayload(manualSubscriptionSchema), updateUserSubscription);

export default router;
