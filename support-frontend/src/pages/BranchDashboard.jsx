import React, { useState, useEffect } from 'react';
import { 
    Container, Grid, Paper, Typography, Box, Card, 
    MenuItem, Select, FormControl, IconButton, CircularProgress 
} from '@mui/material';
import Navbar from '../components/Navbar';
import api from '../services/api'; // Connect to backend
// Icons
import ConfirmationNumberIcon from '@mui/icons-material/ConfirmationNumber';
import MoreVertIcon from '@mui/icons-material/MoreVert';
// Recharts
import { 
    PieChart, Pie, Cell, BarChart, Bar, XAxis, YAxis, 
    CartesianGrid, Tooltip, Legend, ResponsiveContainer 
} from 'recharts';

// --- COLORS ---
const COLORS = ['#0088FE', '#00C49F', '#FFBB28', '#FF8042', '#AF19FF'];

// --- SUB-COMPONENT ---
const SummaryCard = ({ title, count, color, icon }) => (
    <Card elevation={0} sx={{ height: '100%', p: 3, display: 'flex', alignItems: 'center', borderRadius: 3, boxShadow: '0px 4px 20px rgba(0,0,0,0.05)' }}>
        <Box sx={{ p: 2, borderRadius: '50%', backgroundColor: `${color}15`, color: color, display: 'flex', mr: 3 }}>
            {icon}
        </Box>
        <Box>
            <Typography variant="body2" color="textSecondary" fontWeight="600" sx={{ textTransform: 'uppercase' }}>
                {title}
            </Typography>
            <Typography variant="h4" fontWeight="bold" sx={{ color: '#2c3e50', mt: 0.5 }}>
                {count}
            </Typography>
        </Box>
    </Card>
);

const BranchDashboard = () => {
    const [period, setPeriod] = useState('Last 7 Days');
    const [loading, setLoading] = useState(true);
    const [stats, setStats] = useState({
        pastDueTickets: 0,
        newTicketsToday: 0,
        closedTicketsToday: 0,
        categoryStats: [],
        errorStats: [],
        weeklyStats: []
    });

    // --- FETCH REAL DATA ---
    useEffect(() => {
        fetchDashboardData();
    }, []);

    const fetchDashboardData = async () => {
        try {
            const response = await api.get('/dashboard/stats');
            // Backend sends: { name: "Hardware", value: 10 }
            // Recharts expects: { name: "Hardware", value: 10 } (Matches!)
            setStats(response.data);
            setLoading(false);
        } catch (error) {
            console.error("Error loading dashboard stats:", error);
            setLoading(false);
        }
    };

    if (loading) {
        return <Box display="flex" justifyContent="center" mt={10}><CircularProgress /></Box>;
    }

    return (
        <Box sx={{ backgroundColor: '#f8f9fa', minHeight: '100vh', pb: 4 }}>
            <Navbar />
            <Container maxWidth="xl" sx={{ mt: 4 }}>
                
                {/* --- ROW 1: SUMMARY CARDS --- */}
                <Grid container spacing={3} mb={4}>
                    <Grid item xs={12} md={4}>
                        <SummaryCard title="Tickets Past Due" count={stats.pastDueTickets} color="#d32f2f" icon={<ConfirmationNumberIcon fontSize="large" />} />
                    </Grid>
                    <Grid item xs={12} md={4}>
                        <SummaryCard title="New Tickets Today" count={stats.newTicketsToday} color="#1976d2" icon={<ConfirmationNumberIcon fontSize="large" />} />
                    </Grid>
                    <Grid item xs={12} md={4}>
                         <SummaryCard title="Tickets Closed Today" count={stats.closedTicketsToday} color="#2e7d32" icon={<ConfirmationNumberIcon fontSize="large" />} />
                    </Grid>
                </Grid>

                {/* --- ROW 2: CHARTS --- */}
                <Grid container spacing={3} mb={4}>
                    
                    {/* Category Chart */}
                    <Grid item xs={12} md={6}>
                        <Paper elevation={0} sx={{ p: 3, height: 400, borderRadius: 3, boxShadow: '0px 4px 20px rgba(0,0,0,0.05)' }}>
                            <Box display="flex" justifyContent="space-between" mb={2}>
                                <Typography variant="h6" fontWeight="bold">Category-wise Tickets</Typography>
                                <IconButton size="small"><MoreVertIcon /></IconButton>
                            </Box>
                            <ResponsiveContainer width="100%" height="90%">
                                <PieChart>
                                    <Pie data={stats.categoryStats} cx="50%" cy="50%" innerRadius={80} outerRadius={110} paddingAngle={5} dataKey="value">
                                        {stats.categoryStats.map((entry, index) => (
                                            <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                                        ))}
                                    </Pie>
                                    <Tooltip />
                                    <Legend verticalAlign="bottom" height={36}/>
                                </PieChart>
                            </ResponsiveContainer>
                        </Paper>
                    </Grid>

                    {/* Error Chart */}
                    <Grid item xs={12} md={6}>
                        <Paper elevation={0} sx={{ p: 3, height: 400, borderRadius: 3, boxShadow: '0px 4px 20px rgba(0,0,0,0.05)' }}>
                            <Box display="flex" justifyContent="space-between" mb={2}>
                                <Typography variant="h6" fontWeight="bold">Error-wise Tickets</Typography>
                                <IconButton size="small"><MoreVertIcon /></IconButton>
                            </Box>
                            <ResponsiveContainer width="100%" height="90%">
                                <BarChart layout="vertical" data={stats.errorStats} margin={{ top: 20, right: 30, left: 20, bottom: 5 }}>
                                    <CartesianGrid strokeDasharray="3 3" horizontal={false} />
                                    <XAxis type="number" hide />
                                    <YAxis dataKey="name" type="category" width={100} tick={{fontSize: 12, fontWeight: 600}} />
                                    <Tooltip cursor={{fill: 'transparent'}} />
                                    <Bar dataKey="value" fill="#8884d8" barSize={20} radius={[0, 4, 4, 0]}>
                                        {stats.errorStats.map((entry, index) => (
                                            <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                                        ))}
                                    </Bar>
                                </BarChart>
                            </ResponsiveContainer>
                        </Paper>
                    </Grid>
                </Grid>

                {/* --- ROW 3: TIMELINE --- */}
                <Grid container spacing={3}>
                    <Grid item xs={12}>
                        <Paper elevation={0} sx={{ p: 3, borderRadius: 3, boxShadow: '0px 4px 20px rgba(0,0,0,0.05)' }}>
                            <Box display="flex" justifyContent="space-between" mb={3}>
                                <Typography variant="h6" fontWeight="bold">Total vs Closed Tickets</Typography>
                                <FormControl size="small" sx={{ minWidth: 150 }}>
                                    <Select value={period} onChange={(e) => setPeriod(e.target.value)}>
                                        <MenuItem value="Last 7 Days">Last 7 Days</MenuItem>
                                    </Select>
                                </FormControl>
                            </Box>
                            <ResponsiveContainer width="100%" height={350}>
                                <BarChart data={stats.weeklyStats} margin={{ top: 5, right: 30, left: 20, bottom: 5 }}>
                                    <CartesianGrid strokeDasharray="3 3" vertical={false} />
                                    <XAxis dataKey="day" axisLine={false} tickLine={false} dy={10} />
                                    <YAxis axisLine={false} tickLine={false} />
                                    <Tooltip cursor={{fill: '#f0f0f0'}} />
                                    <Legend />
                                    <Bar dataKey="total" name="Total Tickets" fill="#3f51b5" radius={[4, 4, 0, 0]} barSize={30} />
                                    <Bar dataKey="closed" name="Closed Tickets" fill="#00e676" radius={[4, 4, 0, 0]} barSize={30} />
                                </BarChart>
                            </ResponsiveContainer>
                        </Paper>
                    </Grid>
                </Grid>
            </Container>
        </Box>
    );
};

export default BranchDashboard;