import React, { useState, useEffect } from 'react';
import { 
    Container, Paper, Typography, Box, Grid, Avatar, Divider, Chip, 
    Table, TableBody, TableCell, TableContainer, TableHead, TableRow, 
    CircularProgress, Card, CardContent 
} from '@mui/material';
import { 
    Person, Email, Business, Badge, AssignmentInd, History 
} from '@mui/icons-material';
import api from '../services/api';

const Profile = () => {
    const [user, setUser] = useState(null);
    const [myTickets, setMyTickets] = useState([]);
    const [loading, setLoading] = useState(true);

    // Get basic info from LocalStorage
    const userId = parseInt(localStorage.getItem('userId'));
    const role = localStorage.getItem('role');

    useEffect(() => {
        const fetchProfileData = async () => {
            try {
                // 1. Fetch Full User Details
                const userRes = await api.get(`/users/${userId}`);
                setUser(userRes.data);

                // 2. Fetch Tickets
                // If Admin: Get All tickets, then filter for "Assigned to Me"
                // If Branch: Get All tickets, then filter for "Raised by Me"
                // (Optimally, backend should have specific endpoints, but filtering works fine here)
                const ticketRes = await api.get('/tickets');
                const allTickets = ticketRes.data;

                let filtered = [];
                if (role === 'ADMIN') {
                    // Show tickets I am working on
                    filtered = allTickets.filter(t => t.assignedUser?.userId === userId);
                } else {
                    // Show tickets I created
                    filtered = allTickets.filter(t => t.createdBy?.userId === userId);
                }

                // Sort: Active tickets first
                filtered.sort((a, b) => (a.status === 'IN_PROGRESS' ? -1 : 1));
                setMyTickets(filtered);

            } catch (error) {
                console.error("Error loading profile", error);
            } finally {
                setLoading(false);
            }
        };

        if (userId) fetchProfileData();
    }, [userId, role]);

    if (loading) return <Box display="flex" justifyContent="center" mt={10}><CircularProgress /></Box>;

    return (
        <Container maxWidth="lg" sx={{ mt: 4, mb: 4 }}>
            
            {/* 1. PROFILE HEADER CARD */}
            <Paper elevation={3} sx={{ p: 4, mb: 4, borderRadius: 3, background: 'linear-gradient(135deg, #1e293b 0%, #334155 100%)', color: 'white' }}>
                <Grid container spacing={4} alignItems="center">
                    <Grid item>
                        <Avatar sx={{ width: 100, height: 100, bgcolor: '#3b82f6', fontSize: 40, border: '4px solid white' }}>
                            {user?.fullName?.charAt(0)}
                        </Avatar>
                    </Grid>
                    <Grid item xs>
                        <Typography variant="h4" fontWeight="bold">{user?.fullName}</Typography>
                        <Box display="flex" gap={2} mt={1} flexWrap="wrap">
                            <Chip 
                                icon={<Badge sx={{ color: 'white !important' }} />} 
                                label={user?.role?.replace('_', ' ')} 
                                sx={{ bgcolor: 'rgba(255,255,255,0.2)', color: 'white', fontWeight: 'bold' }} 
                            />
                            <Chip 
                                icon={<Business sx={{ color: 'white !important' }} />} 
                                label={user?.branch ? user.branch.branchName : 'Head Office'} 
                                sx={{ bgcolor: 'rgba(255,255,255,0.2)', color: 'white', fontWeight: 'bold' }} 
                            />
                        </Box>
                    </Grid>
                </Grid>
            </Paper>

            <Grid container spacing={4}>
                {/* 2. USER DETAILS */}
                <Grid item xs={12} md={4}>
                    <Paper sx={{ p: 3, borderRadius: 2, height: '100%' }}>
                        <Typography variant="h6" fontWeight="bold" gutterBottom>Personal Information</Typography>
                        <Divider sx={{ mb: 2 }} />
                        
                        <ListInfo icon={<Person color="primary"/>} label="Username" value={user?.username} />
                        <ListInfo icon={<Email color="primary"/>} label="Email" value={user?.email} />
                        
                        <Box mt={3} p={2} bgcolor="#f8fafc" borderRadius={2} border="1px dashed #cbd5e1">
                            <Typography variant="caption" color="text.secondary">
                                Need to change your password or details? Please contact the System Administrator.
                            </Typography>
                        </Box>
                    </Paper>
                </Grid>

                {/* 3. TICKET HISTORY (ASSIGNED or RAISED) */}
                <Grid item xs={12} md={8}>
                    <Paper sx={{ p: 3, borderRadius: 2, minHeight: 400 }}>
                        <Box display="flex" alignItems="center" gap={1} mb={2}>
                            {role === 'ADMIN' ? <AssignmentInd color="primary" /> : <History color="primary" />}
                            <Typography variant="h6" fontWeight="bold">
                                {role === 'ADMIN' ? 'Tickets Assigned to Me' : 'My Ticket History'}
                            </Typography>
                        </Box>
                        <Divider sx={{ mb: 0 }} />

                        <TableContainer>
                            <Table>
                                <TableHead>
                                    <TableRow>
                                        <TableCell><strong>ID</strong></TableCell>
                                        <TableCell><strong>Issue</strong></TableCell>
                                        <TableCell><strong>Branch</strong></TableCell>
                                        <TableCell><strong>Date</strong></TableCell>
                                        <TableCell><strong>Status</strong></TableCell>
                                    </TableRow>
                                </TableHead>
                                <TableBody>
                                    {myTickets.length === 0 ? (
                                        <TableRow>
                                            <TableCell colSpan={5} align="center" sx={{ py: 5, color: 'text.secondary' }}>
                                                No tickets found.
                                            </TableCell>
                                        </TableRow>
                                    ) : (
                                        myTickets.map((t) => (
                                            <TableRow key={t.ticketId} hover>
                                                <TableCell>#{t.ticketId}</TableCell>
                                                <TableCell>
                                                    <Typography variant="body2" fontWeight="bold">
                                                        {t.errorCategory?.categoryName}
                                                    </Typography>
                                                    <Typography variant="caption" color="text.secondary">
                                                        {t.errorType?.typeName}
                                                    </Typography>
                                                </TableCell>
                                                <TableCell>{t.branch?.branchName || 'Head Office'}</TableCell>
                                                <TableCell>{new Date(t.createdAt).toLocaleDateString()}</TableCell>
                                                <TableCell>
                                                    <Chip 
                                                        label={t.status.replace('_', ' ')} 
                                                        color={getStatusColor(t.status)} 
                                                        size="small" 
                                                        sx={{ fontWeight: 'bold', fontSize: '0.7rem' }}
                                                    />
                                                </TableCell>
                                            </TableRow>
                                        ))
                                    )}
                                </TableBody>
                            </Table>
                        </TableContainer>
                    </Paper>
                </Grid>
            </Grid>
        </Container>
    );
};

// Helper Components
const ListInfo = ({ icon, label, value }) => (
    <Box display="flex" alignItems="center" gap={2} mb={2}>
        <Box sx={{ p: 1, bgcolor: '#eff6ff', borderRadius: '50%' }}>{icon}</Box>
        <Box>
            <Typography variant="caption" color="text.secondary">{label}</Typography>
            <Typography variant="body1" fontWeight="medium">{value || 'N/A'}</Typography>
        </Box>
    </Box>
);

const getStatusColor = (status) => {
    switch (status) {
        case 'OPEN': return 'error';
        case 'IN_PROGRESS': return 'warning';
        case 'RESOLVED': return 'success';
        default: return 'default';
    }
};

export default Profile;