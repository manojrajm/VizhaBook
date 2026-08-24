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

// Function nested routes (GET is public for guest QR check-in)
router.route('/functions/:functionId/payment-methods')
    .get(getPaymentMethodsByFunction)
    .post(protect, createPaymentMethod);

router.route('/functions/:functionId/payment-methods/:id')
    .put(protect, updatePaymentMethod)
    .delete(protect, deletePaymentMethod);

router.route('/functions/:functionId/payment-methods/:id/status')
    .patch(protect, togglePaymentMethodStatus);

// Standalone routes
router.route('/payment-methods/:id')
    .put(protect, updatePaymentMethod)
    .delete(protect, deletePaymentMethod);

router.route('/payment-methods/:id/status')
    .patch(protect, togglePaymentMethodStatus);

router.route('/payment-methods/:id/default')
    .patch(protect, setDefaultPaymentMethod);

export default router;
