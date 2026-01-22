import React, { useEffect } from 'react';
import { 
    Container, Paper, Typography, Box, List, ListItem, ListItemText, 
    ListItemAvatar, Avatar, IconButton, Fade, Chip, Button, Divider, Tooltip
} from '@mui/material';
import { 
    Notifications, Warning, CheckCircle, Security, Delete, DoneAll, 
    Info, AccessTime 
} from '@mui/icons-material';
import { useNotifications } from '../context/NotificationContext';

const NotificationsPage = () => {
    const { 
        notifications, 
        markAsRead, 
        markAllAsRead, 
        deleteNotification, 
        fetchNotifications 
    } = useNotifications();

    useEffect(() => {
        fetchNotifications();
    }, [fetchNotifications]);

    // ✅ NEW: Safe Date Formatter
    const formatDate = (dateString) => {
        if (!dateString) return "Just now"; // Handle null dates

        try {
            // Handle Java Arrays [2024, 1, 19, 10, 30] if backend sends them
            if (Array.isArray(dateString)) {
                const [year, month, day, hour, minute] = dateString;
                return new Date(year, month - 1, day, hour, minute).toLocaleString([], {
                    month: 'short', day: 'numeric', hour: '2-digit', minute:'2-digit'
                });
            }

            const date = new Date(dateString);
            if (isNaN(date.getTime())) return "Just now"; // Handle invalid strings

            return date.toLocaleString([], { 
                month: 'short', day: 'numeric', hour: '2-digit', minute:'2-digit' 
            });
        } catch (error) {
            return "Just now";
        }
    };

    const getIcon = (type) => {
        switch(type) {
            case 'WARNING': return <Warning sx={{ color: 'white' }} />;
            case 'SUCCESS': return <CheckCircle sx={{ color: 'white' }} />;
            case 'SECURITY': return <Security sx={{ color: 'white' }} />;
            default: return <Info sx={{ color: 'white' }} />;
        }
    };

    const getColor = (type) => {
        switch(type) {
            case 'WARNING': return '#ed6c02';
            case 'SUCCESS': return '#2e7d32';
            case 'SECURITY': return '#d32f2f';
            default: return '#0288d1';
        }
    };

    return (
        <Fade in={true}>
            <Container maxWidth="md" sx={{ mt: 4, mb: 6 }}>
                
                <Box display="flex" justifyContent="space-between" alignItems="center" mb={3}>
                    <Box>
                        <Typography variant="h4" fontWeight="800" gutterBottom>
                            Notification History
                        </Typography>
                        <Typography variant="body1" color="textSecondary">
                            View and manage your alerts and updates.
                        </Typography>
                    </Box>
                    {notifications.length > 0 && (
                        <Button 
                            variant="outlined" 
                            startIcon={<DoneAll />} 
                            onClick={markAllAsRead}
                            sx={{ borderRadius: 2 }}
                        >
                            Mark All Read
                        </Button>
                    )}
                </Box>

                <Paper elevation={0} sx={{ borderRadius: 4, border: '1px solid #e2e8f0', overflow: 'hidden' }}>
                    {notifications.length === 0 ? (
                        <Box p={6} textAlign="center">
                            <Notifications sx={{ fontSize: 60, color: '#e2e8f0', mb: 2 }} />
                            <Typography variant="h6" color="textSecondary">No notifications found</Typography>
                        </Box>
                    ) : (
                        <List sx={{ p: 0 }}>
                            {notifications.map((n, index) => (
                                <React.Fragment key={n.id}>
                                    <ListItem 
                                        alignItems="flex-start"
                                        secondaryAction={
                                            <Tooltip title="Delete">
                                                <IconButton edge="end" aria-label="delete" onClick={() => deleteNotification(n.id)}>
                                                    <Delete fontSize="small" color="action" />
                                                </IconButton>
                                            </Tooltip>
                                        }
                                        sx={{ 
                                            p: 2,
                                            bgcolor: (n.read || n.isRead) ? 'white' : '#f0f9ff',
                                            transition: 'background-color 0.2s',
                                            '&:hover': { bgcolor: '#f8fafc' }
                                        }}
                                    >
                                        <ListItemAvatar sx={{ mt: 0.5 }}>
                                            <Avatar sx={{ bgcolor: getColor(n.type), width: 40, height: 40 }}>
                                                {getIcon(n.type)}
                                            </Avatar>
                                        </ListItemAvatar>
                                        
                                        <ListItemText
                                            onClick={() => markAsRead(n.id)}
                                            sx={{ cursor: 'pointer', pr: 4 }}
                                            primary={
                                                <Box display="flex" alignItems="center" gap={1} mb={0.5}>
                                                    <Typography variant="subtitle1" fontWeight={(n.read || n.isRead) ? 'medium' : 'bold'}>
                                                        {n.title}
                                                    </Typography>
                                                    {!(n.read || n.isRead) && (
                                                        <Chip label="NEW" size="small" color="primary" sx={{ height: 20, fontSize: '0.65rem', fontWeight: 'bold' }} />
                                                    )}
                                                </Box>
                                            }
                                            secondary={
                                                <Box>
                                                    <Typography variant="body2" color="text.primary" sx={{ mb: 0.5 }}>
                                                        {n.message}
                                                    </Typography>
                                                    <Box display="flex" alignItems="center" gap={0.5} color="text.secondary">
                                                        <AccessTime sx={{ fontSize: 14 }} />
                                                        
                                                        {/* ✅ USE THE NEW FORMATTER HERE */}
                                                        <Typography variant="caption">
                                                            {formatDate(n.createdAt)}
                                                        </Typography>

                                                    </Box>
                                                </Box>
                                            }
                                        />
                                    </ListItem>
                                    {index < notifications.length - 1 && <Divider component="li" />}
                                </React.Fragment>
                            ))}
                        </List>
                    )}
                </Paper>
            </Container>
        </Fade>
    );
};

export default NotificationsPage;