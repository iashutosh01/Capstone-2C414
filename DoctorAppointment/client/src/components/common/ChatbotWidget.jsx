import React, { useState, useRef, useEffect } from 'react';
import {
  Box,
  Paper,
  IconButton,
  TextField,
  Typography,
  Avatar,
  CircularProgress,
} from '@mui/material';
import ChatIcon from '@mui/icons-material/Chat';
import CloseIcon from '@mui/icons-material/Close';
import SendIcon from '@mui/icons-material/Send';
import  api  from '../../services/api';

const ChatbotWidget = () => {
  const [isOpen, setIsOpen] = useState(false);
  const [messages, setMessages] = useState([]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const messagesEndRef = useRef(null);

  useEffect(() => {
    if (isOpen && messages.length === 0) {
      setMessages([
        {
          sender: 'bot',
          text: 'Hi there! How can I help you today? You can ask me about booking appointments, payments, or cancellations.',
        },
      ]);
    }
  }, [isOpen]);
  
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const toggleChatbot = () => {
    setIsOpen(!isOpen);
  };

  const handleSend = async (e) => {
    e.preventDefault();
    if (!input.trim()) return;

    const userMessage = { sender: 'user', text: input };
    setMessages((prev) => [...prev, userMessage]);
    setInput('');
    setLoading(true);

    try {
      const { data } = await api.post('/chatbot', { message: input });
      const botMessage = { sender: 'bot', text: data.data.reply };
      setMessages((prev) => [...prev, botMessage]);
    } catch (error) {
      const errorMessage = {
        sender: 'bot',
        text: 'Sorry, I am having trouble connecting. Please try again later.',
      };
      setMessages((prev) => [...prev, errorMessage]);
    } finally {
      setLoading(false);
    }
  };

  if (isOpen) {
    return (
      <Paper
        elevation={10}
        sx={{
          position: 'fixed',
          bottom: 20,
          right: 20,
          width: 350,
          height: 500,
          display: 'flex',
          flexDirection: 'column',
          borderRadius: '15px',
          zIndex: 1000,
        }}
      >
        <Box
          sx={{
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            p: 1,
            backgroundColor: 'primary.main',
            color: 'white',
            borderTopLeftRadius: '15px',
            borderTopRightRadius: '15px',
          }}
        >
          <Typography variant="h6" sx={{ ml: 1 }}>AI Assistant</Typography>
          <IconButton onClick={toggleChatbot} size="small">
            <CloseIcon sx={{ color: 'white' }}/>
          </IconButton>
        </Box>
        <Box sx={{ flexGrow: 1, p: 2, overflowY: 'auto' }}>
          {messages.map((msg, index) => (
            <Box
              key={index}
              sx={{
                display: 'flex',
                justifyContent: msg.sender === 'bot' ? 'flex-start' : 'flex-end',
                mb: 2,
              }}
            >
              <Paper
                elevation={1}
                sx={{
                  p: 1,
                  bgcolor: msg.sender === 'bot' ? 'grey.200' : 'primary.light',
                  color: msg.sender === 'bot' ? 'black' : 'white',
                  borderRadius:
                    msg.sender === 'bot'
                      ? '10px 10px 10px 0'
                      : '10px 10px 0 10px',
                }}
              >
                {msg.text}
              </Paper>
            </Box>
          ))}
          {loading && <CircularProgress size={20} />}
          <div ref={messagesEndRef} />
        </Box>
        <Box component="form" onSubmit={handleSend} sx={{ p: 1, display: 'flex' }}>
          <TextField
            fullWidth
            size="small"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            placeholder="Ask a question..."
          />
          <IconButton type="submit">
            <SendIcon />
          </IconButton>
        </Box>
      </Paper>
    );
  }

  return (
    <IconButton
      onClick={toggleChatbot}
      sx={{
        position: 'fixed',
        bottom: 20,
        right: 20,
        backgroundColor: 'primary.main',
        color: 'white',
        '&:hover': { backgroundColor: 'primary.dark' },
        width: 60,
        height: 60,
        zIndex: 1000,
      }}
    >
      <ChatIcon />
    </IconButton>
  );
};

export default ChatbotWidget;
