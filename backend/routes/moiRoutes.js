import express from 'express';
import { getMoiEntries, createMoiEntry, deleteMoiEntry } from '../controllers/moiController.js';
import { protect } from '../middleware/authMiddleware.js';

const router = express.Router();

router.route('/')
    .get(getMoiEntries)
    .post(protect, createMoiEntry);

router.route('/:id')
    .delete(protect, deleteMoiEntry);

export default router;
