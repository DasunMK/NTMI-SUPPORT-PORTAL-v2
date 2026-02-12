import React, { useState, useEffect } from 'react';
import { 
    Box, Drawer, AppBar, Toolbar, List, Typography, Divider, IconButton, 
    ListItem, ListItemButton, ListItemIcon, ListItemText, Avatar, Tooltip,
    Dialog, DialogTitle, DialogContent, DialogContentText, DialogActions, Button, Stack, useTheme
} from '@mui/material';
import { 
    Menu as MenuIcon, Dashboard, AddCircle, Person, Help, 
    Logout, AdminPanelSettings, Group, Assessment, Settings,
    Devices, HealthAndSafety, AccessTime
} from '@mui/icons-material';
import { useNavigate, useLocation } from 'react-router-dom';
import NotificationBell from './NotificationBell'; 

const drawerWidth = 280; 

const Layout = ({ children }) => {
    const navigate = useNavigate();
    const location = useLocation();
    
    const [mobileOpen, setMobileOpen] = useState(false);
    const [logoutOpen, setLogoutOpen] = useState(false);
    
    // ✅ NEW: State for Real-Time Clock
    const [currentTime, setCurrentTime] = useState(new Date());

    const role = localStorage.getItem('role');
    const username = localStorage.getItem('username') || 'User';

    // ✅ NEW: Update time every second
    useEffect(() => {
        const timer = setInterval(() => {
            setCurrentTime(new Date());
        }, 1000);

        return () => clearInterval(timer); // Cleanup on unmount
    }, []);

    // --- Branch User Menu ---
    const branchMenu = [
        { text: 'Dashboard', icon: <Dashboard />, path: '/dashboard' },
        { text: 'My Assets', icon: <Devices />, path: '/assets' },
        { text: 'Create Ticket', icon: <AddCircle />, path: '/create-ticket' },
        { text: 'My Profile', icon: <Person />, path: '/profile' },
        { text: 'Help & Support', icon: <Help />, path: '/help' },
    ];

    // --- Admin Menu ---
    const adminMenu = [
        { text: 'Dashboard', icon: <Dashboard />, path: '/admin-dashboard' },
        { text: 'Manage Assets', icon: <Devices />, path: '/assets' },
        { text: 'Hardware Health', icon: <HealthAndSafety />, path: '/dashboard/reliability' },
        { text: 'Manage Users', icon: <Group />, path: '/admin/users' },
        { text: 'Ticket History', icon: <Assessment />, path: '/admin/reports' },
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

    // --- Custom Drawer Content ---
    const drawer = (
        <Box sx={{ 
            height: '100%', 
            display: 'flex', 
            flexDirection: 'column', 
            background: 'linear-gradient(180deg, #0f172a 0%, #1e293b 100%)', 
            color: 'white' 
        }}>
            {/* 1. Sidebar Header */}
            <Box sx={{ p: 4, display: 'flex', alignItems: 'center', gap: 2 }}>
                <Box 
                    sx={{ 
                        width: 40, height: 40, borderRadius: 3, 
                        background: 'linear-gradient(135deg, #3b82f6 0%, #2563eb 100%)',
                        display: 'flex', alignItems: 'center', justifyContent: 'center',
                        boxShadow: '0 8px 16px rgba(59, 130, 246, 0.3)'
                    }}
                >
                    <AdminPanelSettings sx={{ color: 'white', fontSize: 24 }} />
                </Box>
                <Box>
                    <Typography variant="subtitle1" fontWeight="800" sx={{ lineHeight: 1.2, letterSpacing: 0.5 }}>
                        NTMI SUPPORT
                    </Typography>
                    <Typography variant="caption" sx={{ color: 'rgba(255,255,255,0.5)', letterSpacing: 1 }}>
                        PORTAL
                    </Typography>
                </Box>
            </Box>

            <Divider sx={{ borderColor: 'rgba(255,255,255,0.08)', mx: 3 }} />

            {/* 2. Navigation Items */}
            <List sx={{ flexGrow: 1, px: 2, mt: 3 }}>
                {menuItems.map((item) => {
                    const isActive = location.pathname === item.path;
                    return (
                        <ListItem key={item.text} disablePadding sx={{ mb: 1 }}>
                            <ListItemButton 
                                onClick={() => navigate(item.path)} 
                                sx={{ 
                                    borderRadius: 3, 
                                    py: 1.5,
                                    transition: 'all 0.3s ease',
                                    position: 'relative',
                                    bgcolor: isActive ? 'rgba(59, 130, 246, 0.15)' : 'transparent',
                                    color: isActive ? '#60a5fa' : '#94a3b8',
                                    '&:hover': { 
                                        bgcolor: 'rgba(255,255,255,0.05)',
                                        color: 'white',
                                        transform: 'translateX(4px)' 
                                    }
                                }}
                            >
                                <ListItemIcon sx={{ color: 'inherit', minWidth: 40 }}>
                                    {item.icon}
                                </ListItemIcon>
                                <ListItemText 
                                    primary={item.text} 
                                    primaryTypographyProps={{ 
                                        fontSize: '0.95rem', 
                                        fontWeight: isActive ? 700 : 500 
                                    }} 
                                />
                                {isActive && (
                                    <Box sx={{ 
                                        width: 6, height: 6, borderRadius: '50%', 
                                        bgcolor: '#60a5fa', position: 'absolute', right: 16 
                                    }} />
                                )}
                            </ListItemButton>
                        </ListItem>
                    );
                })}
            </List>

            {/* 3. User Profile Card at Bottom */}
            <Box sx={{ p: 2 }}>
                <Box 
                    sx={{ 
                        p: 2, borderRadius: 4, 
                        bgcolor: 'rgba(255,255,255,0.05)', 
                        border: '1px solid rgba(255,255,255,0.05)',
                        backdropFilter: 'blur(10px)',
                        display: 'flex', alignItems: 'center', gap: 2,
                        cursor: 'pointer',
                        transition: 'all 0.2s',
                        '&:hover': { bgcolor: 'rgba(255,255,255,0.1)' }
                    }}
                    onClick={() => navigate('/profile')}
                >
                    <Avatar 
                        sx={{ 
                            bgcolor: '#3b82f6', width: 40, height: 40, 
                            fontWeight: 'bold', boxShadow: '0 4px 12px rgba(0,0,0,0.2)' 
                        }}
                    >
                        {username.charAt(0)}
                    </Avatar>
                    <Box flexGrow={1} overflow="hidden">
                        <Typography variant="body2" fontWeight="bold" color="white" noWrap>
                            {username}
                        </Typography>
                        <Typography variant="caption" color="rgba(255,255,255,0.6)" display="block">
                            View Profile
                        </Typography>
                    </Box>
                    <Tooltip title="Logout">
                        <IconButton 
                            size="small" 
                            onClick={(e) => { e.stopPropagation(); handleLogoutClick(); }} 
                            sx={{ 
                                color: '#ef4444', 
                                bgcolor: 'rgba(239, 68, 68, 0.1)',
                                '&:hover': { bgcolor: 'rgba(239, 68, 68, 0.2)' }
                            }}
                        >
                            <Logout fontSize="small" />
                        </IconButton>
                    </Tooltip>
                </Box>
            </Box>
        </Box>
    );

    return (
        <Box sx={{ display: 'flex', bgcolor: '#f8fafc', minHeight: '100vh' }}>
            
            {/* --- TOP APP BAR --- */}
            <AppBar 
                position="fixed" 
                elevation={0} 
                sx={{ 
                    width: { sm: `calc(100% - ${drawerWidth}px)` }, 
                    ml: { sm: `${drawerWidth}px` }, 
                    bgcolor: 'rgba(255, 255, 255, 0.8)', 
                    backdropFilter: 'blur(12px)',
                    borderBottom: '1px solid #e2e8f0',
                    color: '#1e293b'
                }}
            >
                <Toolbar sx={{ justifyContent: 'space-between' }}>
                    <Box display="flex" alignItems="center">
                        <IconButton 
                            color="inherit" 
                            edge="start" 
                            onClick={handleDrawerToggle} 
                            sx={{ mr: 2, display: { sm: 'none' } }}
                        >
                            <MenuIcon />
                        </IconButton>
                        
                        <Typography variant="h6" fontWeight="800" sx={{ display: { xs: 'none', md: 'block' }, color: '#334155' }}>
                            {menuItems.find(i => i.path === location.pathname)?.text || "Dashboard"}
                        </Typography>
                    </Box>

                    <Stack direction="row" alignItems="center" spacing={2}>
                        <NotificationBell />
                        
                        
                        
                        {/* ✅ REAL-TIME CLOCK */}
                        <Box textAlign="right" sx={{ display: { xs: 'none', sm: 'block' } }}>
                            <Typography variant="caption" color="text.secondary" display="block" sx={{ lineHeight: 1 }}>
                                {currentTime.toLocaleDateString('en-US', { weekday: 'long', month: 'short', day: 'numeric' })}
                            </Typography>
                            <Typography variant="body2" fontWeight="bold" color="text.primary" sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
                                <AccessTime fontSize="inherit" sx={{ opacity: 0.6 }} />
                                {currentTime.toLocaleTimeString('en-US', { hour12: true })}
                            </Typography>
                        </Box>
                    </Stack>
                </Toolbar>
            </AppBar>

            {/* --- SIDEBAR NAVIGATION --- */}
            <Box component="nav" sx={{ width: { sm: drawerWidth }, flexShrink: { sm: 0 } }}>
                <Drawer 
                    variant="temporary" 
                    open={mobileOpen} 
                    onClose={handleDrawerToggle} 
                    ModalProps={{ keepMounted: true }} 
                    sx={{ 
                        display: { xs: 'block', sm: 'none' }, 
                        '& .MuiDrawer-paper': { boxSizing: 'border-box', width: drawerWidth, border: 'none' } 
                    }}
                >
                    {drawer}
                </Drawer>
                <Drawer 
                    variant="permanent" 
                    sx={{ 
                        display: { xs: 'none', sm: 'block' }, 
                        '& .MuiDrawer-paper': { boxSizing: 'border-box', width: drawerWidth, border: 'none' } 
                    }} 
                    open
                >
                    {drawer}
                </Drawer>
            </Box>

            {/* --- MAIN CONTENT AREA --- */}
            <Box 
                component="main" 
                sx={{ 
                    flexGrow: 1, 
                    p: { xs: 2, md: 4 }, 
                    width: { sm: `calc(100% - ${drawerWidth}px)` }, 
                    mt: 8 // Offset for AppBar
                }}
            >
                {children}
            </Box>

            {/* --- LOGOUT DIALOG --- */}
            <Dialog 
                open={logoutOpen} 
                onClose={() => setLogoutOpen(false)}
                PaperProps={{ sx: { borderRadius: 3, p: 1 } }}
            >
                <DialogTitle sx={{ fontWeight: 'bold' }}>Confirm Logout</DialogTitle>
                <DialogContent>
                    <DialogContentText>
                        Are you sure you want to log out of the system?
                    </DialogContentText>
                </DialogContent>
                <DialogActions>
                    <Button onClick={() => setLogoutOpen(false)} sx={{ color: 'text.secondary', fontWeight: 'bold' }}>
                        Cancel
                    </Button>
                    <Button 
                        onClick={confirmLogout} 
                        color="error" 
                        variant="contained" 
                        disableElevation 
                        sx={{ borderRadius: 2, fontWeight: 'bold' }}
                    >
                        Logout
                    </Button>
                </DialogActions>
            </Dialog>
        </Box>
    );
};

export default Layout;