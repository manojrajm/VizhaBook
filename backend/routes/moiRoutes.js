import express from 'express';
import {
    getMoiEntries,
    createMoiEntry,
    updateMoiEntry,
    deleteMoiEntry
} from '../controllers/moiController.js';
import { protect } from '../middleware/authMiddleware.js';

const router = express.Router();

router.route('/')
    .get(protect, getMoiEntries)
    .post(protect, createMoiEntry);

router.route('/:id')
    .put(protect, updateMoiEntry)
    .delete(protect, deleteMoiEntry);

export default router;
