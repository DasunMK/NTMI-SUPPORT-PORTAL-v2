import React from 'react';
import { AppBar, Toolbar, Typography, Button, Box } from '@mui/material';
import { useNavigate } from 'react-router-dom';
import LogoutIcon from '@mui/icons-material/Logout';

const Navbar = () => {
    const navigate = useNavigate();
    const username = localStorage.getItem('username') || 'User'; // We need to save username in Login first!

    const handleLogout = () => {
        localStorage.clear(); // Wipe the data
        navigate('/login');   // Go back to login
    };

    return (
        <AppBar position="static">
            <Toolbar>
                <Typography variant="h6" component="div" sx={{ flexGrow: 1, fontWeight: 'bold' }}>
                    NTMI Support
                </Typography>
                
                <Box display="flex" alignItems="center" gap={2}>
                    <Typography variant="body1">
                        Hello, {username}
                    </Typography>
                    <Button 
                        color="inherit" 
                        startIcon={<LogoutIcon />} 
                        onClick={handleLogout}
                        variant="outlined"
                        sx={{ borderColor: 'white' }}
                    >
                        Logout
                    </Button>
                </Box>
            </Toolbar>
        </AppBar>
    );
};

export default Navbar;