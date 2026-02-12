import React, { useEffect, useState, useRef } from 'react';
import { 
    Container, Grid, Paper, Typography, Box, Table, TableBody, 
    TableCell, TableContainer, TableHead, TableRow, Chip, 
    LinearProgress, Button, Avatar, Stack, MenuItem, TextField,
    Tooltip, IconButton
} from '@mui/material';
import { 
    BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip as RechartsTooltip, 
    ResponsiveContainer, Cell, AreaChart, Area, Legend, PieChart, Pie
} from 'recharts';
import { 
    Print, Speed, BuildCircle, MonetizationOn, EventBusy, 
    TrendingUp, FilterList, Warning, CheckCircle, Cancel,
    HealthAndSafety
} from '@mui/icons-material';
import jsPDF from 'jspdf';
import html2canvas from 'html2canvas';
import api from '../services/api';

// --- HELPERS FOR BUSINESS LOGIC ---

// 1. Calculate Asset Health Score (0 - 100)
const calculateHealthScore = (asset) => {
    // Logic: Start with 100. Deduct points for bad behavior.
    let score = 100;
    
    // Penalty 1: Repairs (Heavy penalty) -> -10 per repair
    score -= (asset.repairCount || 0) * 10;

    // Penalty 2: Cost Ratio (If repairs cost > 50% of asset value, huge penalty)
    const costRatio = asset.purchaseCost > 0 ? (asset.totalRepairCost / asset.purchaseCost) : 0;
    score -= (costRatio * 100) * 0.5; 

    // Penalty 3: Age Factor (Older assets lose points slightly)
    // Assuming 5 years is standard life. 
    const ageYears = asset.ageInMonths / 12;
    if (ageYears > 3) score -= 5;
    if (ageYears > 5) score -= 15;

    // Clamp score between 0 and 100
    return Math.max(0, Math.min(100, Math.round(score)));
};

// 2. Determine Recommendation based on Score & Cost
const getRecommendation = (score, asset) => {
    const costRatio = asset.purchaseCost > 0 ? (asset.totalRepairCost / asset.purchaseCost) : 0;

    if (costRatio > 0.6) return { action: 'REPLACE', reason: 'Repair Cost > 60% of Value', color: 'error' };
    if (score < 40) return { action: 'REPLACE', reason: 'Critical Health Score', color: 'error' };
    if (score < 70) return { action: 'MONITOR', reason: 'Declining Reliability', color: 'warning' };
    return { action: 'KEEP', reason: 'Healthy Asset', color: 'success' };
};

// 3. KPI Card Component
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
    // --- State ---
    const [kpi, setKpi] = useState({ totalSpend: 0, avgMttr: 0, criticalAssets: 0, mtbf: 0 });
    const [assetAnalysis, setAssetAnalysis] = useState([]); // The processed table data
    const [failureDistribution, setFailureDistribution] = useState([]); 
    const [costData, setCostData] = useState([]);
    
    // --- Filters ---
    const [branchFilter, setBranchFilter] = useState('All');
    const [branches, setBranches] = useState([]);
    const [dateRange, setDateRange] = useState('6M'); 

    const [loading, setLoading] = useState(true);
    const [exporting, setExporting] = useState(false);
    
    const reportRef = useRef(null);

    // --- PDF Export Logic ---
    const handleExportPDF = async () => {
        const input = reportRef.current;
        if (!input) return;
        setExporting(true);
        try {
            const canvas = await html2canvas(input, { scale: 2, useCORS: true, backgroundColor: '#ffffff' });
            const imgData = canvas.toDataURL('image/png');
            const pdf = new jsPDF('p', 'mm', 'a4');
            const pdfWidth = pdf.internal.pageSize.getWidth();
            const pdfHeight = pdf.internal.pageSize.getHeight();
            const imgProps = pdf.getImageProperties(imgData);
            const imgHeight = (imgProps.height * pdfWidth) / imgProps.width;

            let heightLeft = imgHeight;
            let position = 0;

            pdf.addImage(imgData, 'PNG', 0, position, pdfWidth, imgHeight);
            heightLeft -= pdfHeight;

            while (heightLeft >= 0) {
                position = heightLeft - imgHeight;
                pdf.addPage();
                pdf.addImage(imgData, 'PNG', 0, position, pdfWidth, imgHeight);
                heightLeft -= pdfHeight;
            }
            pdf.save(`NTMI_Strategic_Analysis_${new Date().toISOString().slice(0,10)}.pdf`);
        } catch (error) {
            console.error("PDF Export Failed:", error);
        } finally {
            setExporting(false);
        }
    };

    // --- Data Fetching & Processing ---
    useEffect(() => {
        const loadData = async () => {
            setLoading(true);
            try {
                // 1. Fetch Basic Data
                const branchRes = await api.get('/master-data/branches');
                setBranches(branchRes.data);

                const params = { branch: branchFilter === 'All' ? null : branchFilter, range: dateRange };
                
                // 2. Fetch Raw Analytics
                const [kpiRes, rawAssetsRes, costRes, pieRes] = await Promise.all([
                    api.get('/analytics/kpi', { params }),
                    api.get('/analytics/assets-detailed', { params }), // Expects detailed asset list
                    api.get('/analytics/costs', { params }),
                    api.get('/analytics/failure-distribution', { params }) 
                ]);

                // 3. Process Asset Logic (Client Side Calculation)
                const processedAssets = rawAssetsRes.data.map(asset => {
                    const score = calculateHealthScore(asset);
                    const recommendation = getRecommendation(score, asset);
                    
                    return {
                        ...asset,
                        healthScore: score,
                        recommendation: recommendation,
                        mtbf: asset.repairCount > 0 ? (asset.ageInMonths / asset.repairCount).toFixed(1) : 'N/A',
                        costRatio: asset.purchaseCost > 0 ? ((asset.totalRepairCost / asset.purchaseCost) * 100).toFixed(1) : 0
                    };
                });

                // Sort by Health Score (Critical first)
                processedAssets.sort((a, b) => a.healthScore - b.healthScore);

                setKpi(kpiRes.data);
                setAssetAnalysis(processedAssets);
                setCostData(costRes.data);
                setFailureDistribution(pieRes.data);

            } catch (err) {
                console.error("Failed to load dashboard data", err);
            } finally {
                setLoading(false);
            }
        };
        loadData();
    }, [branchFilter, dateRange]);

    const COLORS = ['#0088FE', '#00C49F', '#FFBB28', '#FF8042', '#8884d8'];

    if (loading) return <LinearProgress />;

    return (
        <Container maxWidth="xl" sx={{ mt: 4, mb: 8 }}>
            
            {/* HEADER & FILTERS */}
            <Paper elevation={0} sx={{ p: 3, mb: 4, borderRadius: 4, bgcolor: '#f8fafc', border: '1px solid #e2e8f0' }}>
                <Box display="flex" flexDirection={{ xs: 'column', md: 'row' }} justifyContent="space-between" alignItems="center" gap={3}>
                    <Box>
                        <Typography variant="h4" fontWeight="800" sx={{ color: '#0f172a', letterSpacing: -1 }}>
                            Asset Reliability & Life Cycle
                        </Typography>
                        <Typography variant="body2" color="textSecondary">
                            Strategic analysis for procurement and replacement decisions.
                        </Typography>
                    </Box>
                    
                    <Stack direction="row" spacing={2} alignItems="center">
                        <TextField 
                            select size="small" label="Filter Branch" value={branchFilter} 
                            onChange={(e) => setBranchFilter(e.target.value)} 
                            sx={{ minWidth: 150, bgcolor: 'white' }}
                        >
                            <MenuItem value="All">All Branches</MenuItem>
                            {branches.map(b => <MenuItem key={b.branchId} value={b.branchId}>{b.branchName}</MenuItem>)}
                        </TextField>

                        <Button 
                            variant="contained" 
                            startIcon={exporting ? <LinearProgress sx={{ width: 20 }} /> : <Print />} 
                            onClick={handleExportPDF} 
                            disabled={exporting}
                            sx={{ bgcolor: '#0f172a', fontWeight: 'bold', height: 40 }}
                        >
                            {exporting ? "Generating..." : "Export Report"}
                        </Button>
                    </Stack>
                </Box>
            </Paper>

            {/* REPORTABLE AREA */}
            <div ref={reportRef} style={{ padding: '20px', backgroundColor: 'white' }}>
                
                {/* 1. KEY METRICS */}
                <Typography variant="h6" fontWeight="bold" mb={2} color="textSecondary">EXECUTIVE SUMMARY</Typography>
                <Grid container spacing={3} mb={5}>
                    <Grid item xs={12} sm={6} md={3}>
                        <KpiCard title="Total Maint. Spend" value={`Rs. ${kpi.totalSpend.toLocaleString()}`} icon={<MonetizationOn />} color="#7c3aed" subtitle="Life Cycle Cost" />
                    </Grid>
                    <Grid item xs={12} sm={6} md={3}>
                        <KpiCard title="Avg. Asset Health" value={`${Math.round(assetAnalysis.reduce((acc, curr) => acc + curr.healthScore, 0) / (assetAnalysis.length || 1))}/100`} icon={<HealthAndSafety />} color="#10b981" subtitle="Overall Score" />
                    </Grid>
                    <Grid item xs={12} sm={6} md={3}>
                        <KpiCard title="Replace Recommended" value={assetAnalysis.filter(a => a.recommendation.action === 'REPLACE').length} icon={<Cancel />} color="#ef4444" subtitle="Critical Condition" />
                    </Grid>
                    <Grid item xs={12} sm={6} md={3}>
                        <KpiCard title="Monitor Closely" value={assetAnalysis.filter(a => a.recommendation.action === 'MONITOR').length} icon={<Warning />} color="#f59e0b" subtitle="Declining Health" />
                    </Grid>
                </Grid>

                {/* 2. CHARTS */}
                <Grid container spacing={4} mb={5}>
                    <Grid item xs={12} lg={8}>
                        <Paper elevation={0} sx={{ p: 4, borderRadius: 4, border: '1px solid #e2e8f0', height: '100%' }}>
                            <Box display="flex" justifyContent="space-between" mb={2}>
                                <Typography variant="h6" fontWeight="800" color="#0f172a">Financial Impact (Maintenance Spend)</Typography>
                            </Box>
                            <ResponsiveContainer width="100%" height={300}>
                                <AreaChart data={costData} margin={{ top: 10, right: 30, left: 0, bottom: 0 }}>
                                    <defs>
                                        <linearGradient id="colorCost" x1="0" y1="0" x2="0" y2="1">
                                            <stop offset="5%" stopColor="#7c3aed" stopOpacity={0.8}/>
                                            <stop offset="95%" stopColor="#7c3aed" stopOpacity={0}/>
                                        </linearGradient>
                                    </defs>
                                    <XAxis dataKey="month" />
                                    <YAxis />
                                    <CartesianGrid strokeDasharray="3 3" vertical={false} />
                                    <RechartsTooltip />
                                    <Area type="monotone" dataKey="totalCost" stroke="#7c3aed" fillOpacity={1} fill="url(#colorCost)" />
                                </AreaChart>
                            </ResponsiveContainer>
                        </Paper>
                    </Grid>
                    <Grid item xs={12} lg={4}>
                        <Paper elevation={0} sx={{ p: 3, borderRadius: 4, border: '1px solid #e2e8f0', height: '100%', display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
                            <Typography variant="h6" fontWeight="800" color="#0f172a" mb={2}>Failure Categories</Typography>
                            <ResponsiveContainer width="100%" height={250}>
                                <PieChart>
                                    <Pie data={failureDistribution} cx="50%" cy="50%" innerRadius={60} outerRadius={80} paddingAngle={5} dataKey="value">
                                        {failureDistribution.map((entry, index) => (
                                            <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                                        ))}
                                    </Pie>
                                    <RechartsTooltip />
                                    <Legend />
                                </PieChart>
                            </ResponsiveContainer>
                        </Paper>
                    </Grid>
                </Grid>

                {/* 3. THE STRATEGIC RELIABILITY TABLE */}
                <Paper elevation={0} sx={{ borderRadius: 4, border: '1px solid #e2e8f0', overflow: 'hidden' }}>
                    <Box p={3} bgcolor="#f1f5f9" borderBottom="1px solid #e2e8f0" display="flex" alignItems="center" gap={2}>
                        <BuildCircle color="primary" />
                        <Box>
                            <Typography variant="h6" fontWeight="800" color="#1e293b">Asset Life Cycle & Reliability Analysis</Typography>
                            <Typography variant="caption" color="textSecondary">Decision support for repair vs. replace scenarios based on Health Score.</Typography>
                        </Box>
                    </Box>
                    <TableContainer>
                        <Table size="small">
                            <TableHead sx={{ bgcolor: '#fff' }}>
                                <TableRow>
                                    <TableCell sx={{ fontWeight: 'bold', color: '#64748b' }}>ASSET</TableCell>
                                    <TableCell sx={{ fontWeight: 'bold', color: '#64748b' }}>AGE</TableCell>
                                    <TableCell align="center" sx={{ fontWeight: 'bold', color: '#64748b' }}>REPAIRS</TableCell>
                                    <TableCell align="center" sx={{ fontWeight: 'bold', color: '#64748b' }}>MTBF (Mo)</TableCell>
                                    <TableCell align="right" sx={{ fontWeight: 'bold', color: '#64748b' }}>REPAIR COST</TableCell>
                                    <TableCell align="center" sx={{ fontWeight: 'bold', color: '#64748b' }}>COST %</TableCell>
                                    <TableCell align="center" sx={{ fontWeight: 'bold', color: '#64748b' }}>HEALTH</TableCell>
                                    <TableCell sx={{ fontWeight: 'bold', color: '#64748b' }}>RECOMMENDATION</TableCell>
                                </TableRow>
                            </TableHead>
                            <TableBody>
                                {assetAnalysis.map((row) => (
                                    <TableRow key={row.assetId} hover>
                                        <TableCell>
                                            <Typography variant="body2" fontWeight="bold" color="#0f172a">{row.brand} {row.model}</Typography>
                                            <Typography variant="caption" color="textSecondary">{row.assetCode}</Typography>
                                        </TableCell>
                                        <TableCell>{(row.ageInMonths / 12).toFixed(1)} Yrs</TableCell>
                                        <TableCell align="center">
                                            <Chip label={row.repairCount} size="small" sx={{ fontWeight: 'bold', bgcolor: '#f1f5f9' }} />
                                        </TableCell>
                                        <TableCell align="center">{row.mtbf}</TableCell>
                                        <TableCell align="right">
                                            <Typography variant="body2" fontWeight="bold">Rs. {row.totalRepairCost.toLocaleString()}</Typography>
                                        </TableCell>
                                        <TableCell align="center">
                                            <Chip 
                                                label={`${row.costRatio}%`} 
                                                size="small" 
                                                color={row.costRatio > 50 ? 'error' : row.costRatio > 25 ? 'warning' : 'default'} 
                                                variant={row.costRatio > 50 ? 'filled' : 'outlined'}
                                            />
                                        </TableCell>
                                        <TableCell align="center">
                                            <Box position="relative" display="inline-flex">
                                                <CircularProgress 
                                                    variant="determinate" 
                                                    value={row.healthScore} 
                                                    color={row.healthScore < 50 ? 'error' : row.healthScore < 75 ? 'warning' : 'success'}
                                                    size={35}
                                                />
                                                <Box top={0} left={0} bottom={0} right={0} position="absolute" display="flex" alignItems="center" justifyContent="center">
                                                    <Typography variant="caption" component="div" color="text.secondary" fontWeight="bold">
                                                        {row.healthScore}
                                                    </Typography>
                                                </Box>
                                            </Box>
                                        </TableCell>
                                        <TableCell>
                                            <Stack direction="row" alignItems="center" spacing={1}>
                                                {row.recommendation.action === 'REPLACE' ? <Cancel color="error" fontSize="small"/> : 
                                                 row.recommendation.action === 'MONITOR' ? <Warning color="warning" fontSize="small"/> : 
                                                 <CheckCircle color="success" fontSize="small"/>}
                                                <Box>
                                                    <Chip 
                                                        label={row.recommendation.action} 
                                                        size="small" 
                                                        color={row.recommendation.color} 
                                                        sx={{ fontWeight: '900', fontSize: '0.65rem', height: 20 }} 
                                                    />
                                                    <Typography variant="caption" display="block" color="textSecondary" fontSize="0.65rem">
                                                        {row.recommendation.reason}
                                                    </Typography>
                                                </Box>
                                            </Stack>
                                        </TableCell>
                                    </TableRow>
                                ))}
                            </TableBody>
                        </Table>
                    </TableContainer>
                </Paper>

                {/* Footer for Report */}
                <Box mt={4} pt={2} borderTop="1px solid #e2e8f0" display="flex" justifyContent="space-between">
                    <Typography variant="caption" color="textSecondary">Generated by NTMI Support Portal</Typography>
                    <Typography variant="caption" color="textSecondary">{new Date().toLocaleString()}</Typography>
                </Box>
            </div>
        </Container>
    );
};

export default ReliabilityDashboard;