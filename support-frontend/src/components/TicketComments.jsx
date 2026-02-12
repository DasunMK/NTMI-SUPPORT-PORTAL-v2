import React, { useState, useEffect, useRef } from 'react';
import { 
    Box, Typography, TextField, IconButton, Paper, Avatar, 
    CircularProgress, Alert
} from '@mui/material';
import { Send, Lock } from '@mui/icons-material';
import api from '../services/api';

// ✅ Accept 'status' prop to control locking
const TicketComments = ({ ticketId, status }) => {
    const [comments, setComments] = useState([]);
    const [newComment, setNewComment] = useState("");
    const [loading, setLoading] = useState(true);
    const bottomRef = useRef(null);

    const myUserId = parseInt(localStorage.getItem('userId'));

    const fetchComments = async (isBackground = false) => {
        try {
            const response = await api.get(`/comments/ticket/${ticketId}`);
            
            setComments(prev => {
                if (prev.length !== response.data.length) {
                    setTimeout(() => bottomRef.current?.scrollIntoView({ behavior: "smooth" }), 100);
                }
                return response.data;
            });

        } catch (error) {
            console.error("Failed to load comments");
        } finally {
            if (!isBackground) setLoading(false);
        }
    };

    useEffect(() => {
        fetchComments(false);
        const interval = setInterval(() => {
            fetchComments(true);
        }, 3000);

        return () => clearInterval(interval);
    }, [ticketId]);

    const handleSend = async () => {
        if (!newComment.trim()) return;

        try {
            const payload = { text: newComment, ticketId: ticketId };
            await api.post('/comments', payload);
            setNewComment(""); 
            fetchComments(true); 
        } catch (error) {
            console.error("Failed to send comment");
        }
    };

    const formatTime = (dateString) => {
        if(!dateString) return "";
        return new Date(dateString).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    };

    if (loading) return <Box p={3} textAlign="center"><CircularProgress size={20} /></Box>;

    return (
        <Box sx={{ mt: 3, display: 'flex', flexDirection: 'column', height: '100%' }}>
            
            <Typography variant="subtitle2" color="textSecondary" gutterBottom fontWeight="bold">
                DISCUSSION & UPDATES
            </Typography>

            {/* Chat History Area */}
            <Paper 
                variant="outlined" 
                sx={{ 
                    p: 2, 
                    height: 300, 
                    overflowY: 'auto', 
                    bgcolor: '#f8fafc',
                    display: 'flex',
                    flexDirection: 'column',
                    gap: 2,
                    borderRadius: 2
                }}
            >
                {comments.length === 0 && (
                    <Typography variant="body2" color="textSecondary" textAlign="center" mt={4}>
                        No comments yet. Start the conversation.
                    </Typography>
                )}

                {comments.map((c) => {
                    const isMe = c.author.userId === myUserId;
                    return (
                        <Box key={c.commentId} display="flex" justifyContent={isMe ? 'flex-end' : 'flex-start'} gap={1}>
                            {!isMe && (
                                <Avatar sx={{ width: 32, height: 32, bgcolor: '#94a3b8', fontSize: 14 }}>
                                    {c.author.fullName.charAt(0)}
                                </Avatar>
                            )}
                            
                            <Box maxWidth="80%">
                                <Paper 
                                    elevation={0}
                                    sx={{ 
                                        p: 1.5, 
                                        bgcolor: isMe ? '#3b82f6' : 'white', 
                                        color: isMe ? 'white' : 'text.primary',
                                        borderRadius: 2,
                                        borderTopLeftRadius: isMe ? 2 : 0,
                                        borderTopRightRadius: isMe ? 0 : 2,
                                        border: isMe ? 'none' : '1px solid #e2e8f0'
                                    }}
                                >
                                    <Typography variant="body2" sx={{ whiteSpace: 'pre-wrap' }}>
                                        {c.text}
                                    </Typography>
                                </Paper>
                                <Typography variant="caption" color="textSecondary" display="block" textAlign={isMe ? 'right' : 'left'} mt={0.5} fontSize="0.7rem">
                                    {isMe ? "You" : c.author.fullName.split(' ')[0]} • {formatTime(c.createdAt)}
                                </Typography>
                            </Box>
                        </Box>
                    );
                })}
                <div ref={bottomRef} />
            </Paper>

            {/* ✅ CONDITIONAL RENDERING: Lock Chat if status is OPEN */}
            <Box mt={2}>
                {status === 'OPEN' ? (
                    <Paper 
                        variant="outlined" 
                        sx={{ 
                            p: 2, 
                            bgcolor: '#f1f5f9', 
                            display: 'flex', 
                            alignItems: 'center', 
                            justifyContent: 'center', 
                            gap: 1,
                            color: '#64748b'
                        }}
                    >
                        <Lock fontSize="small" />
                        <Typography variant="body2" fontWeight="bold">
                            Chat is locked until an Admin accepts this ticket.
                        </Typography>
                    </Paper>
                ) : (
                    <Box display="flex" gap={1}>
                        <TextField 
                            fullWidth 
                            size="small" 
                            placeholder="Type a message..." 
                            value={newComment}
                            onChange={(e) => setNewComment(e.target.value)}
                            onKeyPress={(e) => e.key === 'Enter' && handleSend()}
                            sx={{ bgcolor: 'white' }}
                        />
                        <IconButton 
                            color="primary" 
                            onClick={handleSend} 
                            disabled={!newComment.trim()}
                            sx={{ bgcolor: '#eff6ff', '&:hover': { bgcolor: '#dbeafe' } }}
                        >
                            <Send />
                        </IconButton>
                    </Box>
                )}
            </Box>
        </Box>
    );
};

export default TicketComments;