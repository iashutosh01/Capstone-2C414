import getChatbotReply from '../utils/chatbot.js';

export const handleChatbotRequest = (req, res) => {
  const { message } = req.body;

  if (!message) {
    return res.status(400).json({
      success: false,
      error: { code: 'BAD_REQUEST', message: 'Message is required.' },
    });
  }

  const reply = getChatbotReply(message);

  res.status(200).json({
    success: true,
    data: {
      reply,
    },
  });
};
