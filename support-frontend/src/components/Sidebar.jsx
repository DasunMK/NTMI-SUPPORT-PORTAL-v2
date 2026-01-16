import React from 'react';
import { 
    Drawer, List, ListItem, ListItemButton, ListItemIcon, ListItemText, 
    Box, Toolbar, Divider 
} from '@mui/material';
import { useNavigate, useLocation } from 'react-router-dom';

// Icons
import DashboardIcon from '@mui/icons-material/Dashboard';
import PeopleIcon from '@mui/icons-material/People'; 
import SettingsIcon from '@mui/icons-material/Settings';
import AssessmentIcon from '@mui/icons-material/Assessment'; 
import PersonIcon from '@mui/icons-material/Person'; 
import AddCircleIcon from '@mui/icons-material/AddCircle'; 
import HelpIcon from '@mui/icons-material/Help';

const drawerWidth = 240;

const Sidebar = () => {
    const navigate = useNavigate();
    const location = useLocation();
    const role = localStorage.getItem('role'); 

    // --- MENU DEFINITIONS ---
    const adminMenu = [
        { text: 'Dashboards', icon: <DashboardIcon />, path: '/admin-dashboard' }, // ✅ Matches App.jsx
        
        // ⚠️ FIXED: Changed from '/manage-users' to '/admin/users'
        { text: 'Manage Users', icon: <PeopleIcon />, path: '/admin/users' }, 
        
        // ⚠️ FIXED: Changed from '/reports' to '/admin/reports'
        { text: 'Reports & History', icon: <AssessmentIcon />, path: '/admin/reports' }, 
        
        // ⚠️ FIXED: Changed from '/settings' to '/admin/settings'
        { text: 'Settings', icon: <SettingsIcon />, path: '/admin/settings' }, 
        
        { text: 'Profile', icon: <PersonIcon />, path: '/profile' }, // ✅ Matches App.jsx
    ];

    const branchMenu = [
        { text: 'Dashboards', icon: <DashboardIcon />, path: '/dashboard' },
        { text: 'Raise New Ticket', icon: <AddCircleIcon />, path: '/create-ticket' },
        { text: 'Profile', icon: <PersonIcon />, path: '/profile' },
        { text: 'Help & Support', icon: <HelpIcon />, path: '/help' },
    ];

    const menuItems = role === 'ADMIN' ? adminMenu : branchMenu;

    return (
        <Drawer
            variant="permanent"
            sx={{
                width: drawerWidth,
                flexShrink: 0,
                [`& .MuiDrawer-paper`]: { width: drawerWidth, boxSizing: 'border-box' },
            }}
        >
            <Toolbar /> 
            <Box sx={{ overflow: 'auto' }}>
                <List>
                    {menuItems.map((item) => (
                        <ListItem key={item.text} disablePadding>
                            <ListItemButton 
                                onClick={() => navigate(item.path)}
                                selected={location.pathname === item.path} 
                                sx={{
                                    '&.Mui-selected': {
                                        backgroundColor: '#e3f2fd',
                                        borderRight: '4px solid #1976d2',
                                        color: '#1976d2',
                                        '& .MuiListItemIcon-root': { color: '#1976d2' }
                                    },
                                    '&:hover': { backgroundColor: '#f5f5f5' }
                                }}
                            >
                                <ListItemIcon sx={{ color: location.pathname === item.path ? '#1976d2' : 'inherit' }}>
                                    {item.icon}
                                </ListItemIcon>
                                <ListItemText primary={item.text} primaryTypographyProps={{ fontWeight: location.pathname === item.path ? 'bold' : 'medium' }} />
                            </ListItemButton>
                        </ListItem>
                    ))}
                </List>
                <Divider />
            </Box>
        </Drawer>
    );
};

export default Sidebar;