import React, { useState, useEffect } from 'react';
import { 
    Container, Paper, Typography, Box, Grid, Button, CircularProgress, 
    Fade, Stack, Avatar, Table, TableBody, TableCell, TableContainer, TableHead, TableRow 
} from '@mui/material';
import { 
    TrendingUp, AttachMoney, AssignmentTurnedIn, HourglassTop, Download 
} from '@mui/icons-material';
import { 
    BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, 
    PieChart, Pie, Cell, Legend 
} from 'recharts';
import { toast } from 'react-toastify';
import api from '../services/api';

const COLORS = ['#3b82f6', '#10b981', '#f59e0b', '#ef4444', '#8b5cf6', '#ec4899'];

const StatCard = ({ title, value, prefix = "", icon, color }) => (
    <Paper elevation={0} sx={{ p: 3, borderRadius: 4, border: `1px solid ${color}30`, background: `linear-gradient(135deg, #ffffff 0%, ${color}05 100%)` }}>
        <Box display="flex" alignItems="center" gap={2}>
            <Avatar sx={{ bgcolor: `${color}15`, color: color, width: 56, height: 56 }}>{icon}</Avatar>
            <Box>
                <Typography variant="h4" fontWeight="900" sx={{ color: '#0f172a' }}>
                    {prefix}{typeof value === 'number' ? value.toLocaleString(undefined, { minimumFractionDigits: prefix ? 2 : 0, maximumFractionDigits: 2 }) : value}
                </Typography>
                <Typography variant="subtitle2" fontWeight="bold" color="textSecondary" textTransform="uppercase">{title}</Typography>
            </Box>
        </Box>
    </Paper>
);

export default function ExecutiveReports() {
    const [data, setData] = useState(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const fetchAnalytics = async () => {
            try {
                const res = await api.get('/reports/executive-summary');
                setData(res.data);
            } catch (error) {
                toast.error("Failed to load executive data");
            } finally {
                setLoading(false);
            }
        };
        fetchAnalytics();
    }, []);

    const exportToCSV = () => {
        if (!data || !data.topSpendingBranches) return;
        
        // CSV Headers
        let csvContent = "Branch Name,Total Repair Cost (LKR)\n";
        
        // Add Data Rows
        data.topSpendingBranches.forEach(row => {
            csvContent += `"${row.branch}",${row.totalCost}\n`;
        });

        // Trigger Download
        const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
        const link = document.createElement("a");
        link.href = URL.createObjectURL(blob);
        link.download = `NTMI_Financial_Summary_${new Date().toISOString().slice(0,10)}.csv`;
        link.click();
        toast.success("CSV Downloaded Successfully");
    };

    if (loading) return <Box display="flex" justifyContent="center" height="80vh" alignItems="center"><CircularProgress /></Box>;
    if (!data) return <Typography align="center" mt={5}>No data available.</Typography>;

    return (
        <Fade in={true} timeout={600}>
            <Container maxWidth="xl" sx={{ mt: 4, mb: 8 }}>
                
                {/* HERO HEADER */}
                <Paper elevation={0} sx={{ p: 4, mb: 4, borderRadius: 4, background: 'linear-gradient(135deg, #0f172a 0%, #1e293b 100%)', color: 'white', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <Box>
                        <Stack direction="row" alignItems="center" gap={1.5} mb={0.5}>
                            <TrendingUp fontSize="large" sx={{ color: '#38bdf8' }} />
                            <Typography variant="h4" fontWeight="800">Executive Analytics</Typography>
                        </Stack>
                        <Typography variant="body1" sx={{ opacity: 0.8 }}>Financial and Operational Overview</Typography>
                    </Box>
                    <Button variant="contained" color="success" startIcon={<Download />} onClick={exportToCSV} sx={{ borderRadius: 2, fontWeight: 'bold' }}>
                        Export CSV (Finance)
                    </Button>
                </Paper>

                {/* KPI CARDS */}
                <Grid container spacing={3} mb={5}>
                    <Grid size={{ xs: 12, sm: 6, md: 3 }}>
                        <StatCard title="Total IT Spend" value={data.totalSpend} prefix="Rs. " icon={<AttachMoney />} color="#10b981" />
                    </Grid>
                    <Grid size={{ xs: 12, sm: 6, md: 3 }}>
                        <StatCard title="Avg Cost / Ticket" value={data.avgCostPerTicket} prefix="Rs. " icon={<TrendingUp />} color="#f59e0b" />
                    </Grid>
                    <Grid size={{ xs: 12, sm: 6, md: 3 }}>
                        <StatCard title="Resolved Tickets" value={data.resolvedCount} icon={<AssignmentTurnedIn />} color="#3b82f6" />
                    </Grid>
                    <Grid size={{ xs: 12, sm: 6, md: 3 }}>
                        <StatCard title="Pending Approvals" value={data.pendingApprovals} icon={<HourglassTop />} color="#ef4444" />
                    </Grid>
                </Grid>

                {/* CHARTS SECTION */}
                <Grid container spacing={3} mb={5}>
                    
                    {/* Bar Chart: Spend Over Time */}
                    <Grid size={{ xs: 12, lg: 8 }}>
                        <Paper elevation={0} sx={{ p: 3, borderRadius: 4, border: '1px solid #e2e8f0', height: 400 }}>
                            <Typography variant="h6" fontWeight="800" color="#334155" mb={3}>Repair Expenditure Trend</Typography>
                            <ResponsiveContainer width="100%" height="85%">
                                <BarChart data={data.monthlyTrend}>
                                    <XAxis dataKey="month" stroke="#94a3b8" fontSize={12} />
                                    <YAxis stroke="#94a3b8" fontSize={12} tickFormatter={(value) => `Rs.${value/1000}k`} />
                                    <Tooltip cursor={{ fill: '#f1f5f9' }} contentStyle={{ borderRadius: 8, fontWeight: 'bold' }} formatter={(value) => `Rs. ${value.toLocaleString()}`} />
                                    <Bar dataKey="cost" fill="#3b82f6" radius={[4, 4, 0, 0]} />
                                </BarChart>
                            </ResponsiveContainer>
                        </Paper>
                    </Grid>

                    {/* Pie Chart: Tickets by Branch */}
                    <Grid size={{ xs: 12, lg: 4 }}>
                        <Paper elevation={0} sx={{ p: 3, borderRadius: 4, border: '1px solid #e2e8f0', height: 400 }}>
                            <Typography variant="h6" fontWeight="800" color="#334155" mb={1}>Issue Volume by Branch</Typography>
                            <ResponsiveContainer width="100%" height="90%">
                                <PieChart>
                                    <Pie data={data.branchVolume} dataKey="value" nameKey="name" cx="50%" cy="50%" innerRadius={60} outerRadius={100} paddingAngle={5}>
                                        {data.branchVolume.map((entry, index) => (
                                            <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                                        ))}
                                    </Pie>
                                    <Tooltip contentStyle={{ borderRadius: 8, fontWeight: 'bold' }} />
                                    <Legend verticalAlign="bottom" height={36} iconType="circle" wrapperStyle={{ fontSize: '12px' }}/>
                                </PieChart>
                            </ResponsiveContainer>
                        </Paper>
                    </Grid>
                </Grid>

                {/* TOP SPENDING BRANCHES TABLE */}
                <Typography variant="h6" fontWeight="800" color="#334155" mb={2}>Top Spending Branches (Action Required)</Typography>
                <TableContainer component={Paper} elevation={0} sx={{ borderRadius: 3, border: '1px solid #e2e8f0' }}>
                    <Table>
                        <TableHead sx={{ bgcolor: '#f8fafc' }}>
                            <TableRow>
                                <TableCell sx={{ fontWeight: '800', color: '#64748b' }}>RANK</TableCell>
                                <TableCell sx={{ fontWeight: '800', color: '#64748b' }}>BRANCH NAME</TableCell>
                                <TableCell align="right" sx={{ fontWeight: '800', color: '#64748b' }}>TOTAL REPAIR COST (LKR)</TableCell>
                            </TableRow>
                        </TableHead>
                        <TableBody>
                            {data.topSpendingBranches.map((row, index) => (
                                <TableRow key={index} hover>
                                    <TableCell><Typography fontWeight="bold" color="textSecondary">#{index + 1}</Typography></TableCell>
                                    <TableCell><Typography fontWeight="bold" color="primary.main">{row.branch}</Typography></TableCell>
                                    <TableCell align="right">
                                        <Typography fontWeight="800" color={index === 0 ? 'error.main' : '#334155'}>
                                            Rs. {row.totalCost.toLocaleString(undefined, { minimumFractionDigits: 2 })}
                                        </Typography>
                                    </TableCell>
                                </TableRow>
                            ))}
                        </TableBody>
                    </Table>
                </TableContainer>

            </Container>
        </Fade>
    );
}