import React, { useState, useEffect, useRef } from 'react';
import { 
    Box, Typography, TextField, IconButton, Paper, Avatar, 
    CircularProgress
} from '@mui/material';
import { Send } from '@mui/icons-material';
import api from '../services/api';

const TicketComments = ({ ticketId }) => {
    const [comments, setComments] = useState([]);
    const [newComment, setNewComment] = useState("");
    const [loading, setLoading] = useState(true); // Initial loading state
    const bottomRef = useRef(null);

    const myUserId = parseInt(localStorage.getItem('userId'));

    // 1. Fetch Comments Function
    const fetchComments = async (isBackground = false) => {
        try {
            const response = await api.get(`/comments/ticket/${ticketId}`);
            
            // Only scroll down if it's the first load or if a new message arrived
            setComments(prev => {
                // If length changed, we know there is a new message
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

    // 2. Auto-Polling (The Fix)
    useEffect(() => {
        fetchComments(false); // Initial Load (show spinner)

        // ✅ Poll every 3 seconds to check for new messages
        const interval = setInterval(() => {
            fetchComments(true); // Background load (no spinner)
        }, 3000);

        return () => clearInterval(interval); // Cleanup on close
    }, [ticketId]);

    // 3. Send Comment
    const handleSend = async () => {
        if (!newComment.trim()) return;

        try {
            const payload = { text: newComment, ticketId: ticketId };
            // Optimistic update (optional, but waiting for server is safer for ID)
            await api.post('/comments', payload);
            
            setNewComment(""); // Clear input
            fetchComments(true); // Refresh immediately
        } catch (error) {
            console.error("Failed to send comment");
        }
    };

    // 4. Helper: Format Time
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

            {/* Input Area */}
            <Box display="flex" gap={1} mt={2}>
                <TextField 
                    fullWidth 
                    size="small" 
                    placeholder="Type a message..." 
                    value={newComment}
                    onChange={(e) => setNewComment(e.target.value)}
                    onKeyPress={(e) => e.key === 'Enter' && handleSend()}
                    sx={{ bgcolor: 'white' }}
                />
                <IconButton color="primary" onClick={handleSend} disabled={!newComment.trim()}>
                    <Send />
                </IconButton>
            </Box>
        </Box>
    );
};

export default TicketComments;