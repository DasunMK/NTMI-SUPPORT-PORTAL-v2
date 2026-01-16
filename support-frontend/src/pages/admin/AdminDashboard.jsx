import React, { useState, useEffect } from 'react';
import { 
    Container, Paper, Typography, Box, Avatar, LinearProgress, Button, Fade, CircularProgress 
} from '@mui/material';
import Grid from '@mui/material/Grid'; 
import { 
    Group, ConfirmationNumber, AssignmentTurnedIn, Warning, Security // <--- Added Security Icon
} from '@mui/icons-material';
import { useNavigate } from 'react-router-dom';
import api from '../../services/api';

const AdminDashboard = () => {
    const navigate = useNavigate();
    const [loading, setLoading] = useState(true);
    const [stats, setStats] = useState({
        totalTickets: 0,
        pendingTickets: 0,
        resolvedTickets: 0,
        activeAdmins: 0 // <--- Renamed from activeTechs
    });
    const [recentTickets, setRecentTickets] = useState([]);

    useEffect(() => {
        const fetchAdminData = async () => {
            try {
                // 1. FETCH USERS
                let adminCount = 0;
                try {
                    const userRes = await api.get('/users');
                    // 🛠️ CHANGE: Count ONLY Admins now
                    adminCount = userRes.data.filter(u => u.role === 'ADMIN').length;
                } catch (err) {
                    console.error("Failed to load users:", err);
                }

                // 2. FETCH TICKETS
                let tickets = [];
                try {
                    const ticketRes = await api.get('/tickets');
                    tickets = ticketRes.data;
                } catch (err) {
                    // Mock data
                    tickets = [
                        { id: 1, status: 'OPEN', errorCategory: { categoryName: 'Hardware' }, errorType: { typeName: 'Printer Jam' }, branch: { branchName: 'Colombo Main' }, createdAt: new Date() },
                        { id: 2, status: 'RESOLVED', errorCategory: { categoryName: 'Network' }, errorType: { typeName: 'Slow Internet' }, branch: { branchName: 'Kandy' }, createdAt: new Date(Date.now() - 86400000) },
                        { id: 3, status: 'IN_PROGRESS', errorCategory: { categoryName: 'Software' }, errorType: { typeName: 'Login Failed' }, branch: { branchName: 'Galle' }, createdAt: new Date(Date.now() - 172800000) },
                    ];
                }

                const pending = tickets.filter(t => t.status === 'OPEN' || t.status === 'IN_PROGRESS').length;
                const resolved = tickets.filter(t => t.status === 'RESOLVED').length;

                setStats({
                    totalTickets: tickets.length,
                    pendingTickets: pending,
                    resolvedTickets: resolved,
                    activeAdmins: adminCount // <--- Update state
                });

                setRecentTickets(tickets.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt)).slice(0, 3));
                setLoading(false);

            } catch (error) {
                console.error("Dashboard Error", error);
                setLoading(false);
            }
        };
        fetchAdminData();
    }, []);

    const StatCard = ({ title, value, icon, color, subtext }) => (
        <Paper elevation={2} sx={{ p: 3, display: 'flex', alignItems: 'center', justifyContent: 'space-between', borderRadius: 3 }}>
            <Box>
                <Typography variant="subtitle2" color="textSecondary" fontWeight="bold">{title}</Typography>
                <Typography variant="h4" fontWeight="bold" sx={{ my: 0.5 }}>{value}</Typography>
                <Typography variant="caption" color={color} fontWeight="bold">{subtext}</Typography>
            </Box>
            <Box sx={{ bgcolor: `${color}20`, p: 1.5, borderRadius: '50%', color: color }}>
                {icon}
            </Box>
        </Paper>
    );

    if (loading) return <Box display="flex" justifyContent="center" mt={10}><CircularProgress /></Box>;

    return (
        <Fade in={true} timeout={800}>
            <Container maxWidth="xl" sx={{ mt: 4, mb: 4 }}>
                <Box display="flex" justifyContent="space-between" alignItems="center" mb={4}>
                    <Box>
                        <Typography variant="h4" fontWeight="bold" color="primary">Admin Overview</Typography>
                        <Typography variant="subtitle1" color="textSecondary">System Performance & Health</Typography>
                    </Box>
                    <Button variant="contained" startIcon={<Group />} onClick={() => navigate('/admin/users')}>
                        Manage Users
                    </Button>
                </Box>

                {/* KPI CARDS */}
                <Grid container spacing={3} mb={4}>
                    <Grid item xs={12} sm={6} md={3}>
                        <StatCard title="Total Tickets" value={stats.totalTickets} icon={<ConfirmationNumber />} color="#1976d2" subtext="All Time" />
                    </Grid>
                    <Grid item xs={12} sm={6} md={3}>
                        <StatCard title="Action Required" value={stats.pendingTickets} icon={<Warning />} color="#d32f2f" subtext="Open / In Progress" />
                    </Grid>
                    <Grid item xs={12} sm={6} md={3}>
                        <StatCard title="Resolved" value={stats.resolvedTickets} icon={<AssignmentTurnedIn />} color="#2e7d32" subtext="Successfully Closed" />
                    </Grid>
                    
                    {/* 🛠️ CHANGE: Updated Label to "System Admins" */}
                    <Grid item xs={12} sm={6} md={3}>
                        <StatCard title="System Admins" value={stats.activeAdmins} icon={<Security />} color="#ed6c02" subtext="Privileged Users" />
                    </Grid>
                </Grid>

                <Grid container spacing={3}>
                    <Grid item xs={12} md={8}>
                        <Paper elevation={3} sx={{ p: 3, borderRadius: 2 }}>
                            <Typography variant="h6" fontWeight="bold" mb={2}>Recent Incoming Tickets</Typography>
                            {recentTickets.map((ticket, index) => (
                                <Box key={ticket.id || index} sx={{ display: 'flex', alignItems: 'center', mb: 2, p: 2, bgcolor: '#f9f9f9', borderRadius: 2 }}>
                                    <Avatar sx={{ bgcolor: ticket.status === 'OPEN' ? '#d32f2f' : '#ed6c02', mr: 2 }}>
                                        {ticket.errorCategory?.categoryName?.charAt(0) || 'T'}
                                    </Avatar>
                                    <Box flexGrow={1}>
                                        <Typography fontWeight="bold">
                                            {ticket.errorCategory?.categoryName} - {ticket.errorType?.typeName}
                                        </Typography>
                                        <Typography variant="body2" color="textSecondary">
                                            {ticket.branch?.branchName} • {new Date(ticket.createdAt).toLocaleDateString()}
                                        </Typography>
                                    </Box>
                                </Box>
                            ))}
                        </Paper>
                    </Grid>

                    <Grid item xs={12} md={4}>
                        <Paper elevation={3} sx={{ p: 3, borderRadius: 2, height: '100%' }}>
                            <Typography variant="h6" fontWeight="bold" mb={3}>System Health</Typography>
                            <Box mb={3}>
                                <Box display="flex" justifyContent="space-between" mb={1}>
                                    <Typography variant="body2">Server Status</Typography>
                                    <Typography variant="body2" color="success.main" fontWeight="bold">Online</Typography>
                                </Box>
                                <LinearProgress variant="determinate" value={100} color="success" />
                            </Box>
                            <Box mb={3}>
                                <Box display="flex" justifyContent="space-between" mb={1}>
                                    <Typography variant="body2">Resolution Rate</Typography>
                                    <Typography variant="body2" fontWeight="bold">
                                        {stats.totalTickets > 0 ? Math.round((stats.resolvedTickets / stats.totalTickets) * 100) : 0}%
                                    </Typography>
                                </Box>
                                <LinearProgress variant="determinate" value={stats.totalTickets > 0 ? (stats.resolvedTickets / stats.totalTickets) * 100 : 0} color="primary" />
                            </Box>
                        </Paper>
                    </Grid>
                </Grid>
            </Container>
        </Fade>
    );
};

export default AdminDashboard;