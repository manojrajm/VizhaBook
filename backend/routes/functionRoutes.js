import express from 'express';
import {
    getFunctions,
    getFunctionById,
    createFunction,
    updateFunction,
    deleteFunction
} from '../controllers/functionController.js';
import { protect } from '../middleware/authMiddleware.js';

const router = express.Router();

// All function routes require authentication
router.route('/')
    .get(protect, getFunctions)
    .post(protect, createFunction);

router.route('/:id')
    .get(protect, getFunctionById)
    .put(protect, updateFunction)
    .delete(protect, deleteFunction);

export default router;
