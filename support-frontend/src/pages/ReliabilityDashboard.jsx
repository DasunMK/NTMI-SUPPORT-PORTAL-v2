import React, { useEffect, useState, useRef } from 'react';
import { 
    Container, Grid, Paper, Typography, Box, Table, TableBody, 
    TableCell, TableContainer, TableHead, TableRow, Chip, 
    LinearProgress, Button, Avatar, Stack, Alert 
} from '@mui/material';
import { 
    BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, 
    ResponsiveContainer, Cell, LineChart, Line, Legend
} from 'recharts';
import { 
    Warning, CheckCircle, Print, TrendingUp, 
    Speed, BuildCircle, MonetizationOn, EventBusy, ReportProblem
} from '@mui/icons-material';
import { useReactToPrint } from 'react-to-print';
import api from '../services/api';

// --- KPI CARD ---
const KpiCard = ({ title, value, icon, color, subtitle }) => (
    <Paper elevation={0} sx={{ p: 3, borderRadius: 4, height: '100%', background: `linear-gradient(145deg, #ffffff, ${color}08)`, border: `1px solid ${color}20`, boxShadow: '0 4px 20px rgba(0,0,0,0.03)' }}>
        <Box display="flex" justifyContent="space-between" alignItems="start" mb={2}>
            <Box>
                <Typography variant="h4" fontWeight="800" sx={{ color: color, letterSpacing: -1 }}>{value}</Typography>
                <Typography variant="subtitle2" fontWeight="bold" color="textSecondary" mt={0.5}>{title}</Typography>
            </Box>
            <Avatar sx={{ bgcolor: `${color}15`, color: color, width: 56, height: 56, borderRadius: 3 }}>{icon}</Avatar>
        </Box>
        {subtitle && <Chip label={subtitle} size="small" sx={{ bgcolor: `${color}10`, color: color, fontWeight: 'bold' }} />}
    </Paper>
);

const ReliabilityDashboard = () => {
    const [kpi, setKpi] = useState({ totalSpend: 0, avgMttr: 0, criticalAssets: 0, mtbf: 0 });
    const [reliabilityData, setReliabilityData] = useState([]);
    const [costData, setCostData] = useState([]);
    const [warrantyRiskData, setWarrantyRiskData] = useState([]); // ✅ NEW Data Source
    const [loading, setLoading] = useState(true);

    const componentRef = useRef();
    const handlePrint = useReactToPrint({
        content: () => componentRef.current,
        documentTitle: `NTMI_Strategic_Report_${new Date().toISOString().split('T')[0]}`,
    });

    useEffect(() => {
        const fetchData = async () => {
            try {
                // 1. Fetch KPIs
                const kpiRes = await api.get('/analytics/kpi');
                setKpi(kpiRes.data);

                // 2. Fetch Reliability (Failure Rates)
                const relRes = await api.get('/analytics/reliability');
                setReliabilityData(relRes.data);

                // 3. Fetch Monthly Costs
                const costRes = await api.get('/analytics/costs');
                setCostData(costRes.data);

                // 4. Fetch Warranty Risk (Repaired/Disposed < 30 Days)
                const riskRes = await api.get('/analytics/warranty-risk');
                setWarrantyRiskData(riskRes.data);

            } catch (err) {
                console.error("Failed to load dashboard data", err);
            } finally {
                setLoading(false);
            }
        };
        fetchData();
    }, []);

    const getBarColor = (rate) => {
        if (rate > 20) return "#ef4444"; 
        if (rate > 10) return "#f59e0b"; 
        return "#10b981"; 
    };

    if (loading) return <LinearProgress />;

    return (
        <Container maxWidth="xl" sx={{ mt: 4, mb: 8 }}>
            
            {/* HEADER */}
            <Box display="flex" justifyContent="space-between" alignItems="center" mb={5}>
                <Box>
                    <Typography variant="h4" fontWeight="800" sx={{ color: '#0f172a', letterSpacing: -1, mb: 1 }}>
                        Strategic Asset Intelligence
                    </Typography>
                    <Typography variant="body1" color="textSecondary">
                        Real-time financial, operational, and risk analysis generated from live DB data.
                    </Typography>
                </Box>
                <Button variant="contained" startIcon={<Print />} onClick={handlePrint} sx={{ bgcolor: '#0f172a', fontWeight: 'bold' }}>
                    Export Report
                </Button>
            </Box>

            <div ref={componentRef} style={{ padding: '10px' }}>
                
                {/* 1. KPIs */}
                <Grid container spacing={3} mb={5}>
                    <Grid item xs={12} md={3}>
                        <KpiCard title="Total Maintenance Spend" value={`Rs. ${kpi.totalSpend.toLocaleString()}`} icon={<MonetizationOn />} color="#7c3aed" subtitle="Life Cycle Cost" />
                    </Grid>
                    <Grid item xs={12} md={3}>
                        <KpiCard title="Mean Time Between Failures" value={`${kpi.mtbf} Hrs`} icon={<Speed />} color="#0ea5e9" subtitle="Reliability Score" />
                    </Grid>
                    <Grid item xs={12} md={3}>
                        <KpiCard title="Avg. Repair Time (MTTR)" value={`${kpi.avgMttr} Days`} icon={<BuildCircle />} color="#f59e0b" subtitle="Efficiency Metric" />
                    </Grid>
                    <Grid item xs={12} md={3}>
                        <KpiCard title="Warranty Expiring & Risk" value={warrantyRiskData.length} icon={<EventBusy />} color="#ef4444" subtitle="Critical Attention Needed" />
                    </Grid>
                </Grid>

                <Grid container spacing={4}>
                    
                    {/* 2. FAILURE RATE CHART */}
                    <Grid item xs={12} lg={8}>
                        <Paper sx={{ p: 4, borderRadius: 4, height: '450px', border: '1px solid #e2e8f0' }}>
                            <Typography variant="h6" fontWeight="800" mb={1} color="#0f172a">Model Reliability Analysis</Typography>
                            <Typography variant="body2" color="textSecondary" mb={4}>Failure rate percentage based on total units vs. ticket volume.</Typography>
                            
                            <ResponsiveContainer width="100%" height="85%">
                                <BarChart data={reliabilityData} layout="vertical" margin={{ top: 5, right: 30, left: 40, bottom: 5 }}>
                                    <CartesianGrid strokeDasharray="3 3" horizontal={true} vertical={false} />
                                    <XAxis type="number" domain={[0, 100]} hide />
                                    <YAxis dataKey="modelName" type="category" width={140} tick={{fontSize: 12, fontWeight: 600}} />
                                    <Tooltip />
                                    <Bar dataKey="failureRate" name="Failure %" barSize={24} radius={[0, 6, 6, 0]}>
                                        {reliabilityData.map((entry, index) => <Cell key={`cell-${index}`} fill={getBarColor(entry.failureRate)} />)}
                                    </Bar>
                                </BarChart>
                            </ResponsiveContainer>
                        </Paper>
                    </Grid>

                    {/* 3. COST TRENDS */}
                    <Grid item xs={12} lg={4}>
                        <Paper sx={{ p: 3, borderRadius: 4, borderLeft: '6px solid #7c3aed', bgcolor: '#fff', height: '100%' }}>
                            <Stack direction="row" alignItems="center" gap={2} mb={2}>
                                <TrendingUp sx={{ color: '#7c3aed' }} />
                                <Typography variant="subtitle2" fontWeight="800" color="#7c3aed">COST TREND ANALYSIS</Typography>
                            </Stack>
                            <ResponsiveContainer width="100%" height={300}>
                                <LineChart data={costData}>
                                    <CartesianGrid strokeDasharray="3 3" vertical={false} />
                                    <XAxis dataKey="month" tick={{fontSize: 10}} />
                                    <Tooltip />
                                    <Legend />
                                    <Line type="monotone" dataKey="Nugegoda" stroke="#7c3aed" strokeWidth={3} dot={false} />
                                    <Line type="monotone" dataKey="Werahera" stroke="#0ea5e9" strokeWidth={3} dot={false} />
                                </LineChart>
                            </ResponsiveContainer>
                        </Paper>
                    </Grid>

                    {/* 4. WARRANTY RISK WATCHLIST (New Requirement) */}
                    <Grid item xs={12}>
                        <Paper sx={{ borderRadius: 4, border: '1px solid #e2e8f0', overflow: 'hidden' }}>
                            <Box p={3} bgcolor="#fef2f2" borderBottom="1px solid #fee2e2" display="flex" alignItems="center" gap={2}>
                                <ReportProblem color="error" />
                                <Box>
                                    <Typography variant="h6" fontWeight="800" color="#991b1b">Warranty Risk Watchlist</Typography>
                                    <Typography variant="caption" color="#b91c1c" fontWeight="bold">
                                        Devices currently in Repair/Disposed status with &lt; 30 days warranty remaining.
                                    </Typography>
                                </Box>
                            </Box>
                            <TableContainer>
                                <Table>
                                    <TableHead sx={{ bgcolor: '#fff' }}>
                                        <TableRow>
                                            <TableCell sx={{ fontWeight: '800', color: '#64748b' }}>ASSET CODE</TableCell>
                                            <TableCell sx={{ fontWeight: '800', color: '#64748b' }}>DEVICE</TableCell>
                                            <TableCell sx={{ fontWeight: '800', color: '#64748b' }}>BRANCH</TableCell>
                                            <TableCell sx={{ fontWeight: '800', color: '#64748b' }}>STATUS</TableCell>
                                            <TableCell sx={{ fontWeight: '800', color: '#64748b' }}>WARRANTY EXPIRY</TableCell>
                                            <TableCell sx={{ fontWeight: '800', color: '#64748b' }} align="right">DAYS LEFT</TableCell>
                                        </TableRow>
                                    </TableHead>
                                    <TableBody>
                                        {warrantyRiskData.length === 0 ? (
                                            <TableRow><TableCell colSpan={6} align="center">No critical warranty risks found.</TableCell></TableRow>
                                        ) : (
                                            warrantyRiskData.map((row) => (
                                                <TableRow key={row.assetId} hover>
                                                    <TableCell sx={{ fontWeight: 'bold', color: '#0f172a' }}>{row.assetCode}</TableCell>
                                                    <TableCell>{row.brand} {row.model}</TableCell>
                                                    <TableCell>{row.branchName}</TableCell>
                                                    <TableCell>
                                                        <Chip label={row.status} size="small" color={row.status === 'DISPOSED' ? 'error' : 'warning'} sx={{ fontWeight: 'bold' }} />
                                                    </TableCell>
                                                    <TableCell>{row.warrantyExpiry}</TableCell>
                                                    <TableCell align="right">
                                                        <Chip label={`${row.daysLeft} Days`} size="small" sx={{ bgcolor: '#fee2e2', color: '#b91c1c', fontWeight: 'bold' }} />
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
            </div>
        </Container>
    );
};

export default ReliabilityDashboard;