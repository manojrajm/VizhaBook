import express from 'express';
import {
    getSubscriptionPlans,
    getCurrentSubscription,
    getUsage,
    selectPlan,
    cancelSubscription
} from '../controllers/subscriptionController.js';
import { protect } from '../middleware/authMiddleware.js';

const router = express.Router();

// Public plan listing
router.get('/subscription-plans', getSubscriptionPlans);

// Protected subscription endpoints
router.get('/subscriptions/current', protect, getCurrentSubscription);
router.get('/subscriptions/usage', protect, getUsage);
router.post('/subscriptions/select-plan', protect, selectPlan);
router.post('/subscriptions/cancel', protect, cancelSubscription);

export default router;
