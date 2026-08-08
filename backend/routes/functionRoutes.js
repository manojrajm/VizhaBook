import express from 'express';
import { getFunctions, createFunction, deleteFunction } from '../controllers/functionController.js';
import { protect } from '../middleware/authMiddleware.js';

const router = express.Router();

router.route('/')
    .get(getFunctions)
    .post(protect, createFunction);

router.route('/:id')
    .delete(protect, deleteFunction);

export default router;
