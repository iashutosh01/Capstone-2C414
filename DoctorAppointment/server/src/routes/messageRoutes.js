import express from 'express';
import { getMessages } from '../controllers/messageController.js';
import { protect } from '../middleware/auth.js';

const router = express.Router();

// @route   GET /api/messages/:appointmentId
// @desc    Get all messages for a specific appointment
// @access  Private (Patient or Doctor involved in the appointment)
router.get('/:appointmentId', protect, getMessages);

export default router;
