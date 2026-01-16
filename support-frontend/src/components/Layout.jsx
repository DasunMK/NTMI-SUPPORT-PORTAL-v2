import React from 'react';
import { Box, CssBaseline, Toolbar } from '@mui/material';
import Navbar from './Navbar';
import Sidebar from './Sidebar';

const drawerWidth = 240;

const Layout = ({ children }) => {
    return (
        <Box sx={{ display: 'flex' }}>
            <CssBaseline />
            
            {/* Fixed Header */}
            <Navbar drawerWidth={drawerWidth} />
            
            {/* Fixed Sidebar */}
            <Sidebar />

            {/* Main Content Area */}
            <Box component="main" sx={{ flexGrow: 1, p: 3, width: { sm: `calc(100% - ${drawerWidth}px)` } }}>
                <Toolbar /> {/* Spacer to prevent content hiding behind Navbar */}
                {children}
            </Box>
        </Box>
    );
};

export default Layout;