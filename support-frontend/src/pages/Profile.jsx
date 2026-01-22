import React, { useState } from 'react';
import { 
    Container, Paper, Typography, Box, Avatar, Grid, Button, 
    Divider, Chip, Stack, Fade, IconButton, Tooltip, 
    Dialog, DialogTitle, DialogContent, DialogActions, TextField
} from '@mui/material';
import { 
    Person, Email, Phone, Business, Key, 
    AdminPanelSettings, Edit, VerifiedUser, CalendarMonth 
} from '@mui/icons-material';
import { toast } from 'react-toastify'; // Ensure you have this installed
import api from '../services/api';

const Profile = () => {
    // 1. Get user data
    const username = localStorage.getItem('username') || 'User';
    const email = localStorage.getItem('email') || 'user@ntmi.lk'; 
    const role = localStorage.getItem('role') || 'BRANCH_OFFICER';
    const branchName = localStorage.getItem('branchName') || 'Head Office';
    const lastLogin = new Date().toLocaleDateString();

    // --- NEW: Password Dialog State ---
    const [openPasswordDialog, setOpenPasswordDialog] = useState(false);
    const [passwords, setPasswords] = useState({ current: '', new: '', confirm: '' });

    // 2. Styles Helper
    const getRoleColor = (r) => r === 'ADMIN' ? 'error' : 'primary';

    // 3. Handle Password Change
    const handleChangePassword = async () => {
        if (!passwords.current || !passwords.new || !passwords.confirm) {
            toast.error("Please fill in all fields");
            return;
        }
        if (passwords.new !== passwords.confirm) {
            toast.error("New passwords do not match");
            return;
        }

        try {
            await api.put('/users/change-password', {
                currentPassword: passwords.current,
                newPassword: passwords.new
            });
            toast.success("Password changed successfully!");
            setOpenPasswordDialog(false);
            setPasswords({ current: '', new: '', confirm: '' }); // Reset form
        } catch (error) {
            toast.error(error.response?.data || "Failed to change password");
        }
    };

    // 4. Reusable Info Row Component
    const InfoItem = ({ icon, label, value }) => (
        <Box 
            display="flex" 
            alignItems="center" 
            gap={2} 
            sx={{ 
                p: 2, 
                borderRadius: 3, 
                bgcolor: '#f8fafc', 
                border: '1px solid #e2e8f0',
                transition: 'all 0.2s',
                '&:hover': { bgcolor: 'white', borderColor: '#cbd5e1', boxShadow: 1 }
            }}
        >
            <Box sx={{ 
                p: 1.5, 
                borderRadius: 2, 
                bgcolor: 'white', 
                color: '#3b82f6',
                boxShadow: '0 2px 4px rgba(0,0,0,0.05)'
            }}>
                {icon}
            </Box>
            <Box>
                <Typography variant="caption" color="textSecondary" display="block" fontWeight="bold" sx={{ textTransform: 'uppercase', letterSpacing: 0.5 }}>
                    {label}
                </Typography>
                <Typography variant="body1" fontWeight="600" color="#1e293b">
                    {value}
                </Typography>
            </Box>
        </Box>
    );

    return (
        <Fade in={true} timeout={600}>
            <Container maxWidth="lg" sx={{ mt: 4, mb: 8 }}>
                
                {/* --- 1. HERO BANNER --- */}
                <Box sx={{ position: 'relative', mb: 8 }}>
                    <Paper 
                        elevation={0}
                        sx={{ 
                            height: 200, 
                            borderRadius: 4, 
                            background: 'linear-gradient(120deg, #1e293b 0%, #334155 100%)',
                            position: 'relative',
                            overflow: 'hidden'
                        }}
                    >
                        <Box sx={{ position: 'absolute', top: -50, right: -50, width: 200, height: 200, borderRadius: '50%', bgcolor: 'rgba(255,255,255,0.05)' }} />
                        <Box sx={{ position: 'absolute', bottom: -30, left: 100, width: 100, height: 100, borderRadius: '50%', bgcolor: 'rgba(255,255,255,0.05)' }} />
                    </Paper>

                    {/* Floating Profile Card Header */}
                    <Box 
                        sx={{ 
                            position: 'absolute', 
                            bottom: -40, 
                            left: { xs: '50%', md: 40 }, 
                            transform: { xs: 'translateX(-50%)', md: 'none' },
                            display: 'flex', 
                            alignItems: 'flex-end', 
                            gap: 3 
                        }}
                    >
                        <Box position="relative">
                            <Avatar 
                                sx={{ 
                                    width: 140, 
                                    height: 140, 
                                    bgcolor: 'white', 
                                    color: '#1e293b', 
                                    fontSize: 50,
                                    fontWeight: '800',
                                    border: '6px solid white',
                                    boxShadow: '0 10px 30px rgba(0,0,0,0.1)'
                                }}
                            >
                                {username.charAt(0)}
                            </Avatar>
                            <Tooltip title="Verified Account">
                                <VerifiedUser sx={{ position: 'absolute', bottom: 10, right: 10, color: '#3b82f6', bgcolor: 'white', borderRadius: '50%' }} />
                            </Tooltip>
                        </Box>
                        
                        <Box sx={{ mb: 1, display: { xs: 'none', md: 'block' } }}>
                            <Typography variant="h4" fontWeight="800" sx={{ color: 'white', textShadow: '0 2px 4px rgba(0,0,0,0.3)' }}>
                                {username}
                            </Typography>
                            <Stack direction="row" spacing={1} mt={1}>
                                <Chip 
                                    label={role.replace('_', ' ')} 
                                    color={getRoleColor(role)} 
                                    size="small" 
                                    sx={{ fontWeight: 'bold', border: '2px solid white' }} 
                                />
                                <Chip 
                                    icon={<CalendarMonth sx={{ fontSize: '14px !important', color: 'inherit !important' }} />}
                                    label={`Active since ${lastLogin}`} 
                                    size="small"
                                    sx={{ bgcolor: 'rgba(0,0,0,0.6)', color: 'white', backdropFilter: 'blur(4px)' }} 
                                />
                            </Stack>
                        </Box>
                    </Box>
                </Box>

                {/* --- 2. MAIN CONTENT GRID --- */}
                <Grid container spacing={4} sx={{ mt: 4 }}>
                    
                    {/* LEFT COLUMN: Summary Card */}
                    <Grid item xs={12} md={4}>
                        <Paper elevation={0} sx={{ p: 3, borderRadius: 4, border: '1px solid #e2e8f0', height: '100%' }}>
                            <Typography variant="h6" fontWeight="bold" gutterBottom>
                                At a Glance
                            </Typography>
                            <Divider sx={{ mb: 3 }} />
                            
                            <Stack spacing={2}>
                                <Box display="flex" justifyContent="space-between" alignItems="center">
                                    <Typography variant="body2" color="textSecondary">Status</Typography>
                                    <Chip label="Active" color="success" size="small" variant="soft" sx={{ fontWeight: 'bold', bgcolor: '#dcfce7', color: '#166534' }} />
                                </Box>
                                <Box display="flex" justifyContent="space-between" alignItems="center">
                                    <Typography variant="body2" color="textSecondary">Role Level</Typography>
                                    <Typography variant="body2" fontWeight="bold">{role === 'ADMIN' ? 'Administrator' : 'Standard User'}</Typography>
                                </Box>
                                <Box display="flex" justifyContent="space-between" alignItems="center">
                                    <Typography variant="body2" color="textSecondary">Branch Code</Typography>
                                    <Typography variant="body2" fontWeight="bold">NTMI-001</Typography>
                                </Box>
                            </Stack>
                        </Paper>
                    </Grid>

                    {/* RIGHT COLUMN: Details & Settings */}
                    <Grid item xs={12} md={8}>
                        <Paper elevation={0} sx={{ p: 4, borderRadius: 4, border: '1px solid #e2e8f0' }}>
                            <Box display="flex" alignItems="center" gap={1} mb={3}>
                                <Person color="primary" />
                                <Typography variant="h6" fontWeight="bold">Personal Information</Typography>
                            </Box>
                            
                            <Grid container spacing={3}>
                                <Grid item xs={12} sm={6}>
                                    <InfoItem icon={<Person fontSize="small" />} label="Full Name" value={username} />
                                </Grid>
                                <Grid item xs={12} sm={6}>
                                    <InfoItem icon={<Email fontSize="small" />} label="Email Address" value={email} />
                                </Grid>
                                <Grid item xs={12} sm={6}>
                                    <InfoItem icon={<Phone fontSize="small" />} label="Phone Number" value="+94 7X XXX XXXX" />
                                </Grid>
                                <Grid item xs={12} sm={6}>
                                    <InfoItem icon={<Business fontSize="small" />} label="Branch Office" value={branchName} />
                                </Grid>
                            </Grid>

                            <Divider sx={{ my: 4 }} />

                            <Box display="flex" alignItems="center" gap={1} mb={3}>
                                <AdminPanelSettings color="error" />
                                <Typography variant="h6" fontWeight="bold">Security & Login</Typography>
                            </Box>
                            
                            <Grid container spacing={2} alignItems="center">
                                <Grid item xs={12} sm={8}>
                                    <Typography variant="subtitle2" fontWeight="bold">Password</Typography>
                                    <Typography variant="body2" color="textSecondary">
                                        Last changed 3 months ago. It's a good idea to use a strong password.
                                    </Typography>
                                </Grid>
                                <Grid item xs={12} sm={4} textAlign={{ sm: 'right' }}>
                                    {/* ✅ BUTTON TRIGGERS DIALOG */}
                                    <Button 
                                        variant="outlined" 
                                        color="primary" 
                                        startIcon={<Key />} 
                                        onClick={() => setOpenPasswordDialog(true)}
                                        sx={{ borderRadius: 2, textTransform: 'none', fontWeight: 'bold' }}
                                    >
                                        Change Password
                                    </Button>
                                </Grid>
                            </Grid>
                        </Paper>
                    </Grid>

                </Grid>

                {/* --- 3. CHANGE PASSWORD DIALOG --- */}
                <Dialog open={openPasswordDialog} onClose={() => setOpenPasswordDialog(false)} maxWidth="sm" fullWidth>
                    <DialogTitle fontWeight="bold">Change Password</DialogTitle>
                    <DialogContent>
                        <Stack spacing={2} mt={1}>
                            <TextField
                                label="Current Password"
                                type="password"
                                fullWidth
                                value={passwords.current}
                                onChange={(e) => setPasswords({...passwords, current: e.target.value})}
                            />
                            <TextField
                                label="New Password"
                                type="password"
                                fullWidth
                                value={passwords.new}
                                onChange={(e) => setPasswords({...passwords, new: e.target.value})}
                            />
                            <TextField
                                label="Confirm New Password"
                                type="password"
                                fullWidth
                                error={passwords.confirm && passwords.new !== passwords.confirm}
                                helperText={passwords.confirm && passwords.new !== passwords.confirm ? "Passwords do not match" : ""}
                                value={passwords.confirm}
                                onChange={(e) => setPasswords({...passwords, confirm: e.target.value})}
                            />
                        </Stack>
                    </DialogContent>
                    <DialogActions sx={{ p: 2 }}>
                        <Button onClick={() => setOpenPasswordDialog(false)}>Cancel</Button>
                        <Button variant="contained" onClick={handleChangePassword}>Update Password</Button>
                    </DialogActions>
                </Dialog>

            </Container>
        </Fade>
    );
};

export default Profile;