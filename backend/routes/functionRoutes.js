import express from 'express';
import {
    getFunctions,
    getFunctionById,
    createFunction,
    updateFunction,
    deleteFunction
} from '../controllers/functionController.js';
import {
    getPaymentMethodsByFunction,
    createPaymentMethod,
    updatePaymentMethod,
    togglePaymentMethodStatus,
    deletePaymentMethod
} from '../controllers/paymentMethodController.js';
import { protect } from '../middleware/authMiddleware.js';

const router = express.Router();

// Nested Payment Methods Routes for /api/functions/:functionId/payment-methods
router.route('/:functionId/payment-methods')
    .get(protect, getPaymentMethodsByFunction)
    .post(protect, createPaymentMethod);

router.route('/:functionId/payment-methods/:id')
    .put(protect, updatePaymentMethod)
    .delete(protect, deletePaymentMethod);

router.route('/:functionId/payment-methods/:id/status')
    .patch(protect, togglePaymentMethodStatus);

// Function routes
router.route('/')
    .get(protect, getFunctions)
    .post(protect, createFunction);

router.route('/:id')
    .get(protect, getFunctionById)
    .put(protect, updateFunction)
    .delete(protect, deleteFunction);

export default router;
