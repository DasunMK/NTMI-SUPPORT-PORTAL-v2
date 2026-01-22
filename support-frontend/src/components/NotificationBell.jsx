import React, { useState } from 'react';
import { 
    IconButton, Badge, Menu, MenuItem, Typography, Box, 
    List, ListItem, ListItemText, ListItemAvatar, Avatar, Divider, Button 
} from '@mui/material';
import { 
    Notifications, ConfirmationNumber, Warning, CheckCircle, Security, AccessTime 
} from '@mui/icons-material';
import { useNavigate } from 'react-router-dom';
import { useNotifications } from '../context/NotificationContext';

const NotificationBell = () => {
    const [anchorEl, setAnchorEl] = useState(null);
    const { notifications, unreadCount, markAsRead, markAllAsRead } = useNotifications();
    const navigate = useNavigate();

    const handleClick = (event) => setAnchorEl(event.currentTarget);
    const handleClose = () => setAnchorEl(null);

    const handleItemClick = (n) => {
        markAsRead(n.id);
        // Navigate based on type if needed, e.g., navigate(`/ticket/${n.relatedTicketId}`)
    };

    const getIcon = (type) => {
        switch(type) {
            case 'WARNING': return <Warning sx={{ color: '#ed6c02' }} />;
            case 'SUCCESS': return <CheckCircle sx={{ color: '#2e7d32' }} />;
            case 'SECURITY': return <Security sx={{ color: '#d32f2f' }} />;
            default: return <ConfirmationNumber sx={{ color: '#1976d2' }} />;
        }
    };

    return (
        <>
            <IconButton color="inherit" onClick={handleClick}>
                <Badge badgeContent={unreadCount} color="error">
                    <Notifications />
                </Badge>
            </IconButton>

            <Menu
                anchorEl={anchorEl}
                open={Boolean(anchorEl)}
                onClose={handleClose}
                PaperProps={{ sx: { width: 360, maxHeight: 500, borderRadius: 3, mt: 1 } }}
            >
                <Box p={2} display="flex" justifyContent="space-between" alignItems="center">
                    <Typography variant="subtitle1" fontWeight="bold">Notifications</Typography>
                    {unreadCount > 0 && (
                        <Button size="small" onClick={markAllAsRead}>Mark all read</Button>
                    )}
                </Box>
                <Divider />

                <List sx={{ p: 0 }}>
                    {notifications.length === 0 ? (
                        <Box p={3} textAlign="center" color="text.secondary">
                            <Notifications sx={{ fontSize: 40, opacity: 0.3, mb: 1 }} />
                            <Typography variant="body2">No notifications yet</Typography>
                        </Box>
                    ) : (
                        notifications.slice(0, 5).map((n) => (
                            <ListItem 
                                key={n.id} 
                                button 
                                onClick={() => handleItemClick(n)}
                                sx={{ 
                                    bgcolor: n.isRead ? 'transparent' : '#f0f9ff',
                                    borderBottom: '1px solid #f0f0f0'
                                }}
                            >
                                <ListItemAvatar>
                                    <Avatar sx={{ bgcolor: 'transparent' }}>
                                        {getIcon(n.type)}
                                    </Avatar>
                                </ListItemAvatar>
                                <ListItemText
                                    primary={
                                        <Typography variant="body2" fontWeight={n.isRead ? 'normal' : 'bold'}>
                                            {n.title}
                                        </Typography>
                                    }
                                    secondary={
                                        <React.Fragment>
                                            <Typography variant="caption" display="block" color="textPrimary" noWrap>
                                                {n.message}
                                            </Typography>
                                            <Typography variant="caption" color="textSecondary" sx={{ display: 'flex', alignItems: 'center', gap: 0.5, mt: 0.5 }}>
                                                <AccessTime fontSize="inherit" /> {new Date(n.date).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}
                                            </Typography>
                                        </React.Fragment>
                                    }
                                />
                            </ListItem>
                        ))
                    )}
                </List>
                
                <Divider />
                <Box p={1}>
                    <Button fullWidth onClick={() => { handleClose(); navigate('/notifications'); }}>
                        View All History
                    </Button>
                </Box>
            </Menu>
        </>
    );
};

export default NotificationBell;