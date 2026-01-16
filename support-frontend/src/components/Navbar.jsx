import React from 'react';
import { AppBar, Toolbar, Typography, Button, Box } from '@mui/material';
import { useNavigate } from 'react-router-dom';
import LogoutIcon from '@mui/icons-material/Logout';

// Receive drawerWidth as a prop so it aligns perfectly
const Navbar = ({ drawerWidth }) => {
    const navigate = useNavigate();
    const username = localStorage.getItem('username') || 'User';

    const handleLogout = () => {
        localStorage.clear();
        navigate('/login');
    };

    return (
        <AppBar 
            position="fixed" 
            sx={{ zIndex: (theme) => theme.zIndex.drawer + 1 }} // Ensures Navbar stays ON TOP of Sidebar
        >
            <Toolbar>
                <Typography variant="h6" component="div" sx={{ flexGrow: 1, fontWeight: 'bold' }}>
                    NTMI Support Portal
                </Typography>
                
                <Box display="flex" alignItems="center" gap={2}>
                    <Typography variant="body2">
                        {username}
                    </Typography>
                    <Button 
                        color="inherit" 
                        startIcon={<LogoutIcon />} 
                        onClick={handleLogout}
                        size="small"
                        sx={{ textTransform: 'none', border: '1px solid rgba(255,255,255,0.3)' }}
                    >
                        Logout
                    </Button>
                </Box>
            </Toolbar>
        </AppBar>
    );
};

export default Navbar;