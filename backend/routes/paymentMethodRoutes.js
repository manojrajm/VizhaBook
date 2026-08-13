import express from 'express';
import {
    getPaymentMethodsByFunction,
    createPaymentMethod,
    updatePaymentMethod,
    togglePaymentMethodStatus,
    setDefaultPaymentMethod,
    deletePaymentMethod
} from '../controllers/paymentMethodController.js';
import { protect } from '../middleware/authMiddleware.js';

const router = express.Router({ mergeParams: true });

// Routes nested under /api/functions/:functionId/payment-methods
router.route('/functions/:functionId/payment-methods')
    .get(protect, getPaymentMethodsByFunction)
    .post(protect, createPaymentMethod);

// Routes under /api/payment-methods/:id
router.route('/payment-methods/:id')
    .put(protect, updatePaymentMethod)
    .delete(protect, deletePaymentMethod);

router.route('/payment-methods/:id/status')
    .patch(protect, togglePaymentMethodStatus);

router.route('/payment-methods/:id/default')
    .patch(protect, setDefaultPaymentMethod);

export default router;
