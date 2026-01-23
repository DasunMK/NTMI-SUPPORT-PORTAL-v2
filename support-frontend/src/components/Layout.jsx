// File: src/components/Layout.jsx
import React, { useState } from 'react';
import { 
    Box, Drawer, AppBar, Toolbar, List, Typography, Divider, IconButton, 
    ListItem, ListItemButton, ListItemIcon, ListItemText, Avatar, Tooltip,
    Dialog, DialogTitle, DialogContent, DialogContentText, DialogActions, Button, Stack
} from '@mui/material';
import { 
    Menu as MenuIcon, Dashboard, AddCircle, Person, Help, 
    Logout, AdminPanelSettings, Group, Assessment, Settings,
    Devices, HealthAndSafety 
} from '@mui/icons-material';
import { useNavigate, useLocation } from 'react-router-dom';
import NotificationBell from './NotificationBell'; 

const drawerWidth = 260;

const Layout = ({ children }) => {
    const navigate = useNavigate();
    const location = useLocation();
    const [mobileOpen, setMobileOpen] = useState(false);
    const [logoutOpen, setLogoutOpen] = useState(false);

    const role = localStorage.getItem('role');
    const username = localStorage.getItem('username') || 'User';

    // --- Branch User Menu ---
    const branchMenu = [
        { text: 'Dashboard', icon: <Dashboard />, path: '/dashboard' },
        { text: 'My Assets', icon: <Devices />, path: '/assets' }, // ✅ Shared Route
        { text: 'Create Ticket', icon: <AddCircle />, path: '/create-ticket' },
        { text: 'My Profile', icon: <Person />, path: '/profile' },
        { text: 'Help & Support', icon: <Help />, path: '/help' },
    ];

    // --- Admin Menu ---
    const adminMenu = [
        { text: 'Overview', icon: <Dashboard />, path: '/admin-dashboard' },
        { text: 'Manage Assets', icon: <Devices />, path: '/assets' },
        { text: 'Hardware Health', icon: <HealthAndSafety />, path: '/dashboard/reliability' },
        { text: 'Manage Users', icon: <Group />, path: '/admin/users' },
        { text: 'Ticket Reports', icon: <Assessment />, path: '/admin/reports' },
        { text: 'System Settings', icon: <Settings />, path: '/admin/settings' },
        { text: 'My Profile', icon: <Person />, path: '/profile' },
    ];

    const menuItems = role === 'ADMIN' ? adminMenu : branchMenu;

    const handleDrawerToggle = () => setMobileOpen(!mobileOpen);
    const handleLogoutClick = () => setLogoutOpen(true);
    const confirmLogout = () => {
        localStorage.clear();
        setLogoutOpen(false);
        navigate('/login');
    };

    const drawer = (
        <Box sx={{ height: '100%', display: 'flex', flexDirection: 'column', bgcolor: '#1e293b', color: 'white' }}>
            <Box sx={{ p: 3, display: 'flex', alignItems: 'center', gap: 2 }}>
                <AdminPanelSettings sx={{ fontSize: 32, color: '#60a5fa' }} />
                <Typography variant="h6" fontWeight="bold" sx={{ letterSpacing: 1 }}>NTMI SUPPORT</Typography>
            </Box>
            <Divider sx={{ bgcolor: 'rgba(255,255,255,0.1)' }} />
            <List sx={{ flexGrow: 1, px: 2, mt: 2 }}>
                {menuItems.map((item) => {
                    const isActive = location.pathname === item.path;
                    return (
                        <ListItem key={item.text} disablePadding sx={{ mb: 1 }}>
                            <ListItemButton onClick={() => navigate(item.path)} sx={{ borderRadius: 2, bgcolor: isActive ? '#3b82f6' : 'transparent', color: isActive ? 'white' : '#94a3b8', '&:hover': { bgcolor: isActive ? '#2563eb' : 'rgba(255,255,255,0.05)', color: 'white' } }}>
                                <ListItemIcon sx={{ color: 'inherit', minWidth: 40 }}>{item.icon}</ListItemIcon>
                                <ListItemText primary={item.text} primaryTypographyProps={{ fontWeight: isActive ? 'bold' : 'medium' }} />
                            </ListItemButton>
                        </ListItem>
                    );
                })}
            </List>
            <Box sx={{ p: 2, bgcolor: 'rgba(0,0,0,0.2)' }}>
                <Box display="flex" alignItems="center" gap={2}>
                    <Box display="flex" alignItems="center" gap={2} flexGrow={1} sx={{ cursor: 'pointer' }} onClick={() => navigate('/profile')}>
                        <Avatar sx={{ bgcolor: '#3b82f6', width: 40, height: 40, fontWeight: 'bold' }}>{username.charAt(0)}</Avatar>
                        <Box overflow="hidden">
                            <Typography variant="body2" fontWeight="bold" noWrap>{username}</Typography>
                            <Typography variant="caption" color="gray" display="block">View Profile</Typography>
                        </Box>
                    </Box>
                    <Tooltip title="Logout">
                        <IconButton size="small" onClick={handleLogoutClick} sx={{ color: '#ef4444', ml: 'auto' }}><Logout fontSize="small" /></IconButton>
                    </Tooltip>
                </Box>
            </Box>
        </Box>
    );

    return (
        <Box sx={{ display: 'flex' }}>
            <AppBar position="fixed" elevation={0} sx={{ width: { sm: `calc(100% - ${drawerWidth}px)` }, ml: { sm: `${drawerWidth}px` }, bgcolor: 'white', color: 'black', borderBottom: '1px solid #e2e8f0' }}>
                <Toolbar>
                    <IconButton color="inherit" edge="start" onClick={handleDrawerToggle} sx={{ mr: 2, display: { sm: 'none' } }}><MenuIcon /></IconButton>
                    <Typography variant="h6" noWrap component="div" fontWeight="bold" sx={{ flexGrow: 1, display: { xs: 'block', sm: 'none' } }}>NTMI Support</Typography>
                    <Box sx={{ flexGrow: 1, display: { xs: 'none', sm: 'block' } }} />
                    <Stack direction="row" alignItems="center" spacing={1}>
                        <NotificationBell />
                        <Box sx={{ display: { xs: 'block', sm: 'none' } }}><IconButton onClick={handleLogoutClick} color="error"><Logout /></IconButton></Box>
                    </Stack>
                </Toolbar>
            </AppBar>
            <Box component="nav" sx={{ width: { sm: drawerWidth }, flexShrink: { sm: 0 } }}>
                <Drawer variant="temporary" open={mobileOpen} onClose={handleDrawerToggle} ModalProps={{ keepMounted: true }} sx={{ display: { xs: 'block', sm: 'none' }, '& .MuiDrawer-paper': { boxSizing: 'border-box', width: drawerWidth, border: 'none' } }}>{drawer}</Drawer>
                <Drawer variant="permanent" sx={{ display: { xs: 'none', sm: 'block' }, '& .MuiDrawer-paper': { boxSizing: 'border-box', width: drawerWidth, border: 'none' } }} open>{drawer}</Drawer>
            </Box>
            <Box component="main" sx={{ flexGrow: 1, p: 3, width: { sm: `calc(100% - ${drawerWidth}px)` }, minHeight: '100vh', bgcolor: '#f8fafc' }}>
                <Toolbar />
                {children}
            </Box>
            <Dialog open={logoutOpen} onClose={() => setLogoutOpen(false)}>
                <DialogTitle>{"Confirm Logout"}</DialogTitle>
                <DialogContent><DialogContentText>Are you sure you want to log out?</DialogContentText></DialogContent>
                <DialogActions><Button onClick={() => setLogoutOpen(false)} color="inherit">Cancel</Button><Button onClick={confirmLogout} color="error" variant="contained" autoFocus>Logout</Button></DialogActions>
            </Dialog>
        </Box>
    );
};

export default Layout;