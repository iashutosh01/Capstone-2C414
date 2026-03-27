import React, { useState, useEffect, useRef } from 'react';
import { useSelector } from 'react-redux';
import { useParams, useLocation } from 'react-router-dom';
import io from 'socket.io-client';
import {
  Box,
  Typography,
  Paper,
  TextField,
  IconButton,
  Avatar,
  CircularProgress,
  Alert,
} from '@mui/material';
import SendIcon from '@mui/icons-material/Send';
import { format } from 'date-fns';
import  api  from '../services/api'; // Assuming you have a centralized api service

const ENDPOINT = import.meta.env.VITE_API_URL || 'http://localhost:6000';

const Chat = () => {
  const { appointmentId } = useParams();
  const location = useLocation();
  const { doctorName, patientName } = location.state || {};

  const [messages, setMessages] = useState([]);
  const [newMessage, setNewMessage] = useState('');
  const [socket, setSocket] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const { user } = useSelector((state) => state.auth);
  const messagesEndRef = useRef(null);

  const receiver = user.role === 'patient' ? { name: doctorName } : { name: patientName };

  useEffect(() => {
    // 1. Fetch previous messages
    const fetchMessages = async () => {
      try {
        setLoading(true);
        const { data } = await api.get(`/messages/${appointmentId}`);
        setMessages(data.data);
        setError(null);
      } catch (err) {
        setError(
          err.response?.data?.error?.message || 'Failed to fetch messages.'
        );
      } finally {
        setLoading(false);
      }
    };

    fetchMessages();

    // 2. Initialize Socket.IO connection
    const newSocket = io(ENDPOINT);
    setSocket(newSocket);

    // 3. Join room
    if (user?._id) {
      newSocket.emit('joinRoom', { appointmentId, userId: user._id });
    }

    // 4. Listen for incoming messages
    newSocket.on('receiveMessage', (message) => {
      setMessages((prevMessages) => [...prevMessages, message]);
    });

    // 5. Listen for errors
    newSocket.on('error', (errorMessage) => {
      setError(errorMessage);
    });

    // Cleanup on unmount
    return () => {
      newSocket.disconnect();
    };
  }, [appointmentId, user?._id, ENDPOINT]);

  // Auto-scroll to the bottom
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const handleSendMessage = (e) => {
    e.preventDefault();
    if (newMessage.trim() && socket) {
      const receiverId = user.role === 'patient' ? location.state.doctorId : location.state.patientId;
      
      const messageData = {
        appointmentId,
        senderId: user._id,
        receiverId: receiverId,
        message: newMessage,
      };
      socket.emit('sendMessage', messageData);
      setNewMessage('');
    }
  };

  const renderMessage = (msg, index) => {
    const isSender = msg.senderId._id === user._id;
    const senderName = isSender ? 'You' : msg.senderId.name;
    const timestamp = format(new Date(msg.createdAt), 'p, MMM d');

    return (
      <Box
        key={index}
        sx={{
          display: 'flex',
          justifyContent: isSender ? 'flex-end' : 'flex-start',
          mb: 2,
        }}
      >
        <Paper
          elevation={2}
          sx={{
            p: 1.5,
            maxWidth: '70%',
            bgcolor: isSender ? 'primary.main' : 'grey.200',
            color: isSender ? 'primary.contrastText' : 'text.primary',
            borderRadius: isSender
              ? '20px 20px 5px 20px'
              : '20px 20px 20px 5px',
          }}
        >
          <Typography variant="body2" sx={{ fontWeight: 'bold', mb: 0.5 }}>
            {senderName}
          </Typography>
          <Typography variant="body1">{msg.message}</Typography>
          <Typography variant="caption" sx={{ display: 'block', textAlign: 'right', mt: 1 }}>
            {timestamp}
          </Typography>
        </Paper>
      </Box>
    );
  };

  return (
    <Box
      sx={{
        display: 'flex',
        flexDirection: 'column',
        height: 'calc(100vh - 120px)', // Adjust based on your layout
        maxWidth: 800,
        mx: 'auto',
        border: '1px solid #ddd',
        borderRadius: 2,
        overflow: 'hidden',
      }}
    >
      <Paper
        sx={{
          p: 2,
          borderBottom: '1px solid #ddd',
          display: 'flex',
          alignItems: 'center',
        }}
      >
        <Avatar sx={{ mr: 2 }}>{receiver.name?.[0]}</Avatar>
        <Typography variant="h6">Chat with {receiver.name}</Typography>
      </Paper>

      <Box sx={{ flexGrow: 1, p: 2, overflowY: 'auto' }}>
        {loading && <CircularProgress />}
        {error && <Alert severity="error">{error}</Alert>}
        {!loading && !error && messages.map(renderMessage)}
        <div ref={messagesEndRef} />
      </Box>

      <Paper sx={{ p: 1, borderTop: '1px solid #ddd' }}>
        <form onSubmit={handleSendMessage} style={{ display: 'flex' }}>
          <TextField
            fullWidth
            variant="outlined"
            placeholder="Type a message..."
            value={newMessage}
            onChange={(e) => setNewMessage(e.target.value)}
            size="small"
          />
          <IconButton type="submit" color="primary" disabled={!newMessage.trim()}>
            <SendIcon />
          </IconButton>
        </form>
      </Paper>
    </Box>
  );
};

export default Chat;
