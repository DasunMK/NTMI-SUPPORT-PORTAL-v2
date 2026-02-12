import React, { useState, useEffect } from 'react';
import { 
    Container, Paper, Typography, Box, CircularProgress, 
    Avatar, Chip, LinearProgress, Fade, Stack, Grid, Tooltip, Divider
} from '@mui/material';
import { 
    Warning, Build, Speed, AssignmentTurnedIn,
    ErrorOutline, AttachMoney, AccessTime, BatteryChargingFull, CheckCircle
} from '@mui/icons-material';
import { toast } from 'react-toastify';
import api from '../services/api';

// --- STYLES & HELPERS ---
const getProgressColor = (value) => {
    if (value > 10) return '#ef4444'; 
    if (value > 5) return '#f59e0b';  
    return '#3b82f6';                 
};

// Component for Standard KPI Cards
const KpiPaper = ({ title, value, sub, icon, color, bgGradient }) => (
    <Paper 
        elevation={0} 
        sx={{ 
            p: 3, borderRadius: 4, 
            background: bgGradient || 'linear-gradient(135deg, #ffffff 0%, #f8fafc 100%)',
            border: `1px solid ${color}20`,
            height: '100%',
            display: 'flex',
            flexDirection: 'column',
            justifyContent: 'center'
        }}
    >
        <Box display="flex" alignItems="center" gap={2} mb={1}>
            <Avatar sx={{ bgcolor: `${color}15`, color: color, width: 48, height: 48 }}>{icon}</Avatar>
            <Box>
                <Typography variant="h4" fontWeight="800" sx={{ color: '#1e293b' }}>{value}</Typography>
                <Typography variant="caption" fontWeight="bold" color="textSecondary" textTransform="uppercase">{title}</Typography>
            </Box>
        </Box>
        {sub && <Typography variant="body2" color="textSecondary" sx={{ ml: 8, mt: -1 }}>{sub}</Typography>}
    </Paper>
);

// Component for Financial/Cost Cards (Currency format)
// ✅ Fixed: Added (value || 0) to prevent crash if data is undefined
const CurrencyPaper = ({ title, value, sub, icon, color }) => (
    <Paper 
        elevation={0} 
        sx={{ 
            p: 3, borderRadius: 4, 
            background: 'linear-gradient(135deg, #fffbeb 0%, #ffffff 100%)',
            border: '1px solid #fcd34d',
            height: '100%',
            display: 'flex',
            flexDirection: 'column',
            justifyContent: 'center'
        }}
    >
        <Box display="flex" alignItems="center" gap={2} mb={1}>
            <Avatar sx={{ bgcolor: '#fef3c7', color: '#d97706', width: 48, height: 48 }}>{icon}</Avatar>
            <Box>
                <Typography variant="h4" fontWeight="800" sx={{ color: '#78350f' }}>
                    Rs. {(value || 0).toLocaleString(undefined, { minimumFractionDigits: 2 })}
                </Typography>
                <Typography variant="caption" fontWeight="bold" color="textSecondary" textTransform="uppercase">{title}</Typography>
            </Box>
        </Box>
        {sub && <Typography variant="body2" color="textSecondary" sx={{ ml: 8, mt: -1 }}>{sub}</Typography>}
    </Paper>
);

const ReliabilityDashboard = () => {
    const [loading, setLoading] = useState(true);
    const [stats, setStats] = useState({
        pastDueTickets: 0,
        totalResolved: 0,
        topFailingAssets: [],
        totalRepairCost: 0,
        avgResolutionHours: 0,
        assetAvailability: 100
    });

    useEffect(() => {
        fetchReliabilityData();
    }, []);

    const fetchReliabilityData = async () => {
        try {
            const response = await api.get('/tickets/reliability');
            setStats(response.data);
        } catch (error) {
            console.error(error);
            toast.error("Failed to load reliability data");
        } finally {
            setLoading(false);
        }
    };

    // ✅ Fixed: Safe calculation to prevent NaN crashes
    const maxFailures = Math.max(...stats.topFailingAssets.map(a => a.count || 0), 1);

    if (loading) {
        return (
            <Box display="flex" justifyContent="center" alignItems="center" height="80vh">
                <CircularProgress />
            </Box>
        );
    }

    return (
        <Fade in={true} timeout={600}>
            <Container maxWidth="xl" sx={{ mt: 4, mb: 6 }}>
                
                {/* HEADER */}
                <Paper 
                    elevation={0} 
                    sx={{ 
                        p: 4, mb: 5, borderRadius: 4, 
                        background: 'linear-gradient(135deg, #1e293b 0%, #0f172a 100%)', 
                        color: 'white', boxShadow: '0 20px 40px -10px rgba(15, 23, 42, 0.3)' 
                    }}
                >
                    <Box display="flex" alignItems="center" gap={3}>
                        <Avatar sx={{ bgcolor: 'rgba(255,255,255,0.15)', width: 64, height: 64 }}><Speed fontSize="large" /></Avatar>
                        <Box>
                            <Typography variant="h4" fontWeight="800">Advanced Reliability Monitor</Typography>
                            <Typography variant="body1" sx={{ opacity: 0.7 }}>National Transport Medical Institute • Financial & Operational Health</Typography>
                        </Box>
                    </Box>
                </Paper>

                {/* TOP SECTION: CRITICAL METRICS - ✅ Updated for MUI v6 (Removed 'item', updated 'size') */}
                <Grid container spacing={3} mb={5}>
                    
                    {/* Past Due */}
                    <Grid size={{ xs: 12, sm: 6, md: 3 }}>
                        <KpiPaper 
                            title="Past Due Tickets" 
                            value={stats.pastDueTickets} 
                            sub="Open > 48 Hours" 
                            icon={<Warning />} 
                            color="#ef4444"
                            bgGradient="linear-gradient(135deg, #fef2f2 0%, #ffffff 100%)"
                        />
                    </Grid>

                    {/* Availability */}
                    <Grid size={{ xs: 12, sm: 6, md: 3 }}>
                         <Paper 
                            elevation={0} 
                            sx={{ 
                                p: 3, borderRadius: 4, 
                                background: 'linear-gradient(135deg, #f0fdf4 0%, #ffffff 100%)',
                                border: '1px solid #bbf7d0',
                                height: '100%',
                                display: 'flex',
                                flexDirection: 'column',
                                justifyContent: 'center'
                            }}
                        >
                            <Box display="flex" alignItems="center" gap={2} mb={2}>
                                <Avatar sx={{ bgcolor: '#dcfce7', color: '#15803d', width: 48, height: 48 }}><BatteryChargingFull /></Avatar>
                                <Box>
                                    <Typography variant="h4" fontWeight="800" sx={{ color: '#14532d' }}>{stats.assetAvailability || 0}%</Typography>
                                    <Typography variant="caption" fontWeight="bold" color="textSecondary" textTransform="uppercase">Asset Availability</Typography>
                                </Box>
                            </Box>
                            <Box display="flex" alignItems="center" gap={2} sx={{ ml: 8 }}>
                                <Box width="100%">
                                    <Tooltip title="Percentage of assets currently functional">
                                        {/* ✅ Fixed: Added fallback value */}
                                        <LinearProgress 
                                            variant="determinate" 
                                            value={stats.assetAvailability || 0} 
                                            sx={{ 
                                                height: 8, borderRadius: 5, 
                                                backgroundColor: '#f1f5f9',
                                                [`& .MuiLinearProgress-bar`]: { backgroundColor: '#16a34a', borderRadius: 5 }
                                            }} 
                                        />
                                    </Tooltip>
                                </Box>
                            </Box>
                        </Paper>
                    </Grid>

                    {/* Avg Resolution Time */}
                    <Grid size={{ xs: 12, sm: 6, md: 3 }}>
                        <KpiPaper 
                            title="Avg Fix Time" 
                            value={stats.avgResolutionHours + "h"} 
                            sub="Hours to Resolve" 
                            icon={<AccessTime />} 
                            color="#3b82f6"
                            bgGradient="linear-gradient(135deg, #eff6ff 0%, #ffffff 100%)"
                        />
                    </Grid>

                    {/* Financial Cost */}
                    <Grid size={{ xs: 12, sm: 6, md: 3 }}>
                        <CurrencyPaper 
                            title="Total Repair Cost" 
                            value={stats.totalRepairCost} 
                            sub="Lifetime Expense" 
                            icon={<AttachMoney />} 
                            color="#d97706"
                        />
                    </Grid>

                </Grid>

                {/* BOTTOM SECTION: FAILURE ANALYSIS - ✅ Updated for MUI v6 */}
                <Grid container spacing={3}>
                    
                    {/* Top Failing Assets */}
                    <Grid size={{ xs: 12, md: 8 }}>
                        <Paper elevation={0} sx={{ p: 4, borderRadius: 4, border: '1px solid #e2e8f0', height: '100%' }}>
                            <Box display="flex" justifyContent="space-between" alignItems="center" mb={4}>
                                <Box display="flex" alignItems="center" gap={2}>
                                    <Avatar sx={{ bgcolor: '#fee2e2', color: '#ef4444' }}><Build /></Avatar>
                                    <Box>
                                        <Typography variant="h6" fontWeight="800">Top Failing Assets</Typography>
                                        <Typography variant="caption" color="textSecondary">Equipment requiring frequent repairs</Typography>
                                    </Box>
                                </Box>
                                <Chip label="Top 5" size="small" color="error" variant="outlined" />
                            </Box>

                            {stats.topFailingAssets.length > 0 ? (
                                <Stack spacing={3}>
                                    {stats.topFailingAssets.map((item, index) => {
                                        const percentage = (item.count / maxFailures) * 100;
                                        const color = getProgressColor(item.count);
                                        return (
                                            <Box key={index}>
                                                <Box display="flex" justifyContent="space-between" mb={1}>
                                                    <Typography variant="subtitle1" fontWeight="bold" color="#334155">
                                                        {item.brand} {item.model}
                                                    </Typography>
                                                    <Typography variant="subtitle2" fontWeight="bold" sx={{ color: color }}>
                                                        {item.count} Failures
                                                    </Typography>
                                                </Box>
                                                <LinearProgress 
                                                    variant="determinate" 
                                                    value={percentage} 
                                                    sx={{ 
                                                        height: 10, borderRadius: 5, 
                                                        backgroundColor: '#f1f5f9',
                                                        [`& .MuiLinearProgress-bar`]: { backgroundColor: color, borderRadius: 5 }
                                                    }} 
                                                />
                                            </Box>
                                        );
                                    })}
                                </Stack>
                            ) : (
                                <Box textAlign="center" py={4} sx={{ opacity: 0.5 }}>
                                    <CheckCircle sx={{ fontSize: 48, mb: 1, color: '#10b981' }} />
                                    <Typography>Excellent! No failure data recorded yet.</Typography>
                                </Box>
                            )}
                        </Paper>
                    </Grid>

                    {/* Quick Summary / Status */}
                    <Grid size={{ xs: 12, md: 4 }}>
                         <Paper elevation={0} sx={{ p: 4, borderRadius: 4, border: '1px solid #e2e8f0', height: '100%', bgcolor: '#f8fafc' }}>
                            <Typography variant="h6" fontWeight="bold" mb={3} sx={{ color: '#334155' }}>System Status Summary</Typography>
                            
                            <Stack spacing={2}>
                                <Box display="flex" alignItems="center" gap={2}>
                                    <Avatar sx={{ width: 32, height: 32, bgcolor: 'white' }}><AssignmentTurnedIn fontSize="small" color="success" /></Avatar>
                                    <Typography variant="body2" color="textSecondary">System has recorded <strong>{stats.totalResolved}</strong> total resolutions.</Typography>
                                </Box>
                                <Divider />
                                <Box display="flex" alignItems="center" gap={2}>
                                    <Avatar sx={{ width: 32, height: 32, bgcolor: 'white' }}><AttachMoney fontSize="small" color="warning" /></Avatar>
                                    <Typography variant="body2" color="textSecondary">Maintenance budget utilization is active.</Typography>
                                </Box>
                                <Divider />
                                <Box display="flex" alignItems="center" gap={2}>
                                    <Avatar sx={{ width: 32, height: 32, bgcolor: 'white' }}><Speed fontSize="small" color="primary" /></Avatar>
                                    <Typography variant="body2" color="textSecondary">Average fix time currently optimized.</Typography>
                                </Box>
                            </Stack>
                         </Paper>
                    </Grid>

                </Grid>

            </Container>
        </Fade>
    );
};

export default ReliabilityDashboard;