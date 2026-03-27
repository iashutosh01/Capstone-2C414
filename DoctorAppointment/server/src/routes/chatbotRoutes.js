import express from 'express';
import { handleChatbotRequest } from '../controllers/chatbotController.js';

const router = express.Router();

// @route   POST /api/chatbot
// @desc    Get a reply from the chatbot
// @access  Public
router.post('/', handleChatbotRequest);

export default router;
