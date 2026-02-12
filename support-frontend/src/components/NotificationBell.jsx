import React, { useState } from 'react';
import { 
    IconButton, Badge, Menu, Typography, Box, 
    List, ListItem, ListItemButton, ListItemText, ListItemAvatar, // ✅ Import ListItemButton
    Avatar, Divider, Button 
} from '@mui/material';
import { 
    Notifications, ConfirmationNumber, Warning, CheckCircle, Security, AccessTime, Info
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
        // Optional: Close menu on click
        // handleClose();
    };

    const getIcon = (type) => {
        switch(type) {
            case 'WARNING': return <Warning sx={{ color: '#ed6c02' }} />;
            case 'SUCCESS': return <CheckCircle sx={{ color: '#2e7d32' }} />;
            case 'SECURITY': return <Security sx={{ color: '#d32f2f' }} />;
            case 'ALERT': return <Warning sx={{ color: '#ef4444' }} />;
            default: return <Info sx={{ color: '#0ea5e9' }} />;
        }
    };

    const getBgColor = (type) => {
        switch(type) {
            case 'WARNING': return '#fff7ed';
            case 'SUCCESS': return '#f0fdf4';
            case 'SECURITY': return '#fef2f2';
            default: return '#f0f9ff';
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
                PaperProps={{ 
                    sx: { 
                        width: 360, 
                        maxHeight: 500, 
                        borderRadius: 3, 
                        mt: 1.5,
                        boxShadow: '0 10px 40px rgba(0,0,0,0.1)' 
                    } 
                }}
                transformOrigin={{ horizontal: 'right', vertical: 'top' }}
                anchorOrigin={{ horizontal: 'right', vertical: 'bottom' }}
            >
                <Box p={2} display="flex" justifyContent="space-between" alignItems="center" borderBottom="1px solid #f1f5f9">
                    <Typography variant="subtitle1" fontWeight="bold">Notifications</Typography>
                    {unreadCount > 0 && (
                        <Button size="small" onClick={markAllAsRead} sx={{ fontSize: '0.75rem' }}>
                            Mark all read
                        </Button>
                    )}
                </Box>

                <List sx={{ p: 0 }}>
                    {notifications.length === 0 ? (
                        <Box p={4} textAlign="center" color="text.secondary">
                            <Notifications sx={{ fontSize: 40, opacity: 0.2, mb: 1 }} />
                            <Typography variant="body2">No notifications yet</Typography>
                        </Box>
                    ) : (
                        notifications.slice(0, 5).map((n) => (
                            <React.Fragment key={n.id}>
                                <ListItem disablePadding>
                                    {/* ✅ FIXED: Use ListItemButton instead of ListItem button */}
                                    <ListItemButton 
                                        onClick={() => handleItemClick(n)}
                                        sx={{ 
                                            bgcolor: n.read ? 'transparent' : '#f8fafc', // Highlight unread
                                            transition: 'background-color 0.2s',
                                            '&:hover': { bgcolor: '#f1f5f9' }
                                        }}
                                    >
                                        <ListItemAvatar>
                                            <Avatar sx={{ bgcolor: getBgColor(n.type) }}>
                                                {getIcon(n.type)}
                                            </Avatar>
                                        </ListItemAvatar>
                                        <ListItemText
                                            primary={
                                                <Typography variant="body2" fontWeight={n.read ? 'normal' : 'bold'} color="text.primary">
                                                    {n.title}
                                                </Typography>
                                            }
                                            secondary={
                                                <React.Fragment>
                                                    <Typography variant="caption" display="block" color="text.secondary" noWrap sx={{ mt: 0.5 }}>
                                                        {n.message}
                                                    </Typography>
                                                    <Typography variant="caption" color="text.disabled" sx={{ display: 'flex', alignItems: 'center', gap: 0.5, mt: 0.5 }}>
                                                        <AccessTime sx={{ fontSize: 12 }} /> 
                                                        {n.createdAt ? new Date(n.createdAt).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'}) : 'Just now'}
                                                    </Typography>
                                                </React.Fragment>
                                            }
                                        />
                                        {!n.read && (
                                            <Box sx={{ width: 8, height: 8, borderRadius: '50%', bgcolor: '#3b82f6', ml: 1 }} />
                                        )}
                                    </ListItemButton>
                                </ListItem>
                                <Divider component="li" />
                            </React.Fragment>
                        ))
                    )}
                </List>
                
                <Box p={1} bgcolor="#f8fafc">
                    <Button fullWidth onClick={() => { handleClose(); navigate('/notifications'); }} sx={{ fontWeight: 'bold', color: '#64748b' }}>
                        View All History
                    </Button>
                </Box>
            </Menu>
        </>
    );
};

export default NotificationBell;