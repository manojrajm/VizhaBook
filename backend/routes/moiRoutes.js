import express from 'express';
import {
    getMoiEntries,
    createMoiEntry,
    updateMoiEntry,
    deleteMoiEntry,
    submitPendingCheckin,
    getPendingCheckins,
    approvePendingCheckin,
    rejectPendingCheckin
} from '../controllers/moiController.js';
import { protect } from '../middleware/authMiddleware.js';

const router = express.Router();

// Pending QR check-in routes (session-friendly for live QR & host approval)
router.route('/pending')
    .get(getPendingCheckins)
    .post(submitPendingCheckin);

router.route('/pending/:id/approve')
    .post(approvePendingCheckin);

router.route('/pending/:id')
    .delete(rejectPendingCheckin);

// Official Moi ledger routes
router.route('/')
    .get(protect, getMoiEntries)
    .post(protect, createMoiEntry);

router.route('/:id')
    .put(protect, updateMoiEntry)
    .delete(protect, deleteMoiEntry);

export default router;
