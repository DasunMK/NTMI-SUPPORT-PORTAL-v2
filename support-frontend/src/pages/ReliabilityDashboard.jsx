import React, { useEffect, useState, useRef } from 'react';
import { 
    Container, Grid, Paper, Typography, Box, Table, TableBody, 
    TableCell, TableContainer, TableHead, TableRow, Chip, 
    LinearProgress, Button, Avatar, Stack, MenuItem, TextField
} from '@mui/material';
import { 
    BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, 
    ResponsiveContainer, Cell, AreaChart, Area, Legend, PieChart, Pie
} from 'recharts';
import { 
    Print, Speed, BuildCircle, MonetizationOn, EventBusy, 
    TrendingUp, FilterList
} from '@mui/icons-material';
import jsPDF from 'jspdf';
import html2canvas from 'html2canvas';
import api from '../services/api';

// --- KPI CARD COMPONENT ---
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
    const [reliabilityData, setReliabilityData] = useState([]);
    const [costData, setCostData] = useState([]);
    const [failureDistribution, setFailureDistribution] = useState([]); 
    const [warrantyRiskData, setWarrantyRiskData] = useState([]);
    
    // --- Filters ---
    const [branchFilter, setBranchFilter] = useState('All');
    const [branches, setBranches] = useState([]);
    const [dateRange, setDateRange] = useState('6M'); 

    const [loading, setLoading] = useState(true);
    const [exporting, setExporting] = useState(false); // Separate loading state for export
    
    // ✅ Ref for the printable area
    const reportRef = useRef(null);

    // ✅ NEW: PDF Export Function (html2canvas + jsPDF)
    const handleExportPDF = async () => {
        const input = reportRef.current;
        if (!input) return;

        setExporting(true);
        try {
            // 1. Capture the DOM element as a canvas
            const canvas = await html2canvas(input, {
                scale: 2, // Higher scale for better quality
                useCORS: true, // Handle cross-origin images if any
                backgroundColor: '#ffffff' // Ensure white background
            });

            // 2. Convert canvas to image data
            const imgData = canvas.toDataURL('image/png');

            // 3. Initialize PDF (A4 size, Portrait)
            const pdf = new jsPDF('p', 'mm', 'a4');
            const pdfWidth = pdf.internal.pageSize.getWidth();
            const pdfHeight = pdf.internal.pageSize.getHeight();

            // 4. Calculate image dimensions to fit PDF
            const imgProps = pdf.getImageProperties(imgData);
            const imgHeight = (imgProps.height * pdfWidth) / imgProps.width;

            // 5. Add image to PDF (Handle multi-page if content is long)
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

            // 6. Save File
            pdf.save(`NTMI_Strategic_Report_${new Date().toISOString().slice(0,10)}.pdf`);

        } catch (error) {
            console.error("PDF Export Failed:", error);
        } finally {
            setExporting(false);
        }
    };

    // --- Data Fetching ---
    useEffect(() => {
        const loadData = async () => {
            setLoading(true);
            try {
                // 1. Fetch Branches for Filter
                const branchRes = await api.get('/master-data/branches');
                setBranches(branchRes.data);

                // 2. Fetch Dashboard Data
                const params = { branch: branchFilter === 'All' ? null : branchFilter, range: dateRange };
                
                const [kpiRes, relRes, costRes, riskRes, pieRes] = await Promise.all([
                    api.get('/analytics/kpi', { params }),
                    api.get('/analytics/reliability', { params }),
                    api.get('/analytics/costs', { params }),
                    api.get('/analytics/warranty-risk', { params }),
                    api.get('/analytics/failure-distribution', { params }) 
                ]);

                setKpi(kpiRes.data);
                setReliabilityData(relRes.data);
                setCostData(costRes.data);
                setWarrantyRiskData(riskRes.data);
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
                            Strategic Asset Intelligence
                        </Typography>
                        <Typography variant="body2" color="textSecondary">
                            Financial, operational, and risk analysis dashboard.
                        </Typography>
                    </Box>
                    
                    <Stack direction="row" spacing={2} alignItems="center">
                        <TextField 
                            select 
                            size="small" 
                            label="Filter Branch" 
                            value={branchFilter} 
                            onChange={(e) => setBranchFilter(e.target.value)} 
                            sx={{ minWidth: 150, bgcolor: 'white' }}
                        >
                            <MenuItem value="All">All Branches</MenuItem>
                            {branches.map(b => <MenuItem key={b.branchId} value={b.branchId}>{b.branchName}</MenuItem>)}
                        </TextField>

                        <TextField 
                            select 
                            size="small" 
                            label="Time Range" 
                            value={dateRange} 
                            onChange={(e) => setDateRange(e.target.value)} 
                            sx={{ minWidth: 120, bgcolor: 'white' }}
                        >
                            <MenuItem value="1M">Last Month</MenuItem>
                            <MenuItem value="3M">Last 3 Months</MenuItem>
                            <MenuItem value="6M">Last 6 Months</MenuItem>
                            <MenuItem value="1Y">Last Year</MenuItem>
                        </TextField>

                        {/* ✅ Export Button calls the new handler */}
                        <Button 
                            variant="contained" 
                            startIcon={exporting ? <LinearProgress sx={{ width: 20 }} /> : <Print />} 
                            onClick={handleExportPDF} 
                            disabled={exporting}
                            sx={{ bgcolor: '#0f172a', fontWeight: 'bold', height: 40 }}
                        >
                            {exporting ? "Generating..." : "Export PDF"}
                        </Button>
                    </Stack>
                </Box>
            </Paper>

            {/* ✅ REF ATTACHED TO THIS WRAPPER */}
            <div ref={reportRef} style={{ padding: '20px', backgroundColor: 'white' }}>
                
                {/* 1. KEY PERFORMANCE INDICATORS */}
                <Typography variant="h6" fontWeight="bold" mb={2} color="textSecondary">PERFORMANCE METRICS</Typography>
                <Grid container spacing={3} mb={5}>
                    <Grid item xs={12} sm={6} md={3}>
                        <KpiCard title="Total Maint. Spend" value={`Rs. ${kpi.totalSpend.toLocaleString()}`} icon={<MonetizationOn />} color="#7c3aed" subtitle="Life Cycle Cost" />
                    </Grid>
                    <Grid item xs={12} sm={6} md={3}>
                        <KpiCard title="MTBF (Reliability)" value={`${kpi.mtbf} Hrs`} icon={<Speed />} color="#0ea5e9" subtitle="Mean Time Between Failures" />
                    </Grid>
                    <Grid item xs={12} sm={6} md={3}>
                        <KpiCard title="MTTR (Efficiency)" value={`${kpi.avgMttr} Days`} icon={<BuildCircle />} color="#f59e0b" subtitle="Avg. Repair Time" />
                    </Grid>
                    <Grid item xs={12} sm={6} md={3}>
                        <KpiCard title="Critical Warranty Risks" value={warrantyRiskData.length} icon={<EventBusy />} color="#ef4444" subtitle="Action Required" />
                    </Grid>
                </Grid>

                {/* 2. CHARTS SECTION */}
                <Grid container spacing={4} mb={5}>
                    
                    {/* Failure Rate by Model */}
                    <Grid item xs={12} lg={8}>
                        <Paper elevation={0} sx={{ p: 4, borderRadius: 4, border: '1px solid #e2e8f0', height: '100%' }}>
                            <Box display="flex" justifyContent="space-between" mb={2}>
                                <Typography variant="h6" fontWeight="800" color="#0f172a">Model Reliability (Failure Rate %)</Typography>
                                <Chip icon={<FilterList sx={{ fontSize: 16 }} />} label="High Failure Models" size="small" />
                            </Box>
                            <ResponsiveContainer width="100%" height={300}>
                                <BarChart data={reliabilityData} layout="vertical" margin={{ left: 20 }}>
                                    <CartesianGrid strokeDasharray="3 3" horizontal={true} vertical={false} />
                                    <XAxis type="number" domain={[0, 100]} hide />
                                    <YAxis dataKey="modelName" type="category" width={100} tick={{fontSize: 12, fontWeight: 600}} />
                                    <Tooltip cursor={{fill: 'transparent'}} />
                                    <Bar dataKey="failureRate" barSize={20} radius={[0, 4, 4, 0]}>
                                        {reliabilityData.map((entry, index) => (
                                            <Cell key={`cell-${index}`} fill={entry.failureRate > 15 ? '#ef4444' : '#3b82f6'} />
                                        ))}
                                    </Bar>
                                </BarChart>
                            </ResponsiveContainer>
                        </Paper>
                    </Grid>

                    {/* Failure Distribution Pie */}
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
                                    <Tooltip />
                                    <Legend />
                                </PieChart>
                            </ResponsiveContainer>
                        </Paper>
                    </Grid>

                    {/* Cost Trends Area Chart */}
                    <Grid item xs={12}>
                        <Paper elevation={0} sx={{ p: 4, borderRadius: 4, border: '1px solid #e2e8f0' }}>
                            <Stack direction="row" alignItems="center" gap={2} mb={3}>
                                <TrendingUp sx={{ color: '#7c3aed' }} />
                                <Typography variant="h6" fontWeight="800" color="#0f172a">Financial Impact Analysis (Monthly Spend)</Typography>
                            </Stack>
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
                                    <Tooltip />
                                    <Area type="monotone" dataKey="totalCost" stroke="#7c3aed" fillOpacity={1} fill="url(#colorCost)" />
                                </AreaChart>
                            </ResponsiveContainer>
                        </Paper>
                    </Grid>
                </Grid>

                {/* 3. WARRANTY RISK TABLE */}
                <Paper elevation={0} sx={{ borderRadius: 4, border: '1px solid #e2e8f0', overflow: 'hidden' }}>
                    <Box p={3} bgcolor="#fff1f2" borderBottom="1px solid #ffe4e6" display="flex" alignItems="center" gap={2}>
                        <EventBusy color="error" />
                        <Box>
                            <Typography variant="h6" fontWeight="800" color="#991b1b">Warranty Risk Watchlist</Typography>
                            <Typography variant="caption" color="#991b1b">Assets currently in repair with expiring warranties.</Typography>
                        </Box>
                    </Box>
                    <TableContainer>
                        <Table size="small">
                            <TableHead sx={{ bgcolor: '#fff' }}>
                                <TableRow>
                                    <TableCell sx={{ fontWeight: 'bold' }}>ASSET</TableCell>
                                    <TableCell sx={{ fontWeight: 'bold' }}>MODEL</TableCell>
                                    <TableCell sx={{ fontWeight: 'bold' }}>BRANCH</TableCell>
                                    <TableCell sx={{ fontWeight: 'bold' }}>STATUS</TableCell>
                                    <TableCell sx={{ fontWeight: 'bold' }}>WARRANTY END</TableCell>
                                    <TableCell align="right" sx={{ fontWeight: 'bold' }}>DAYS LEFT</TableCell>
                                </TableRow>
                            </TableHead>
                            <TableBody>
                                {warrantyRiskData.length === 0 ? (
                                    <TableRow><TableCell colSpan={6} align="center" sx={{ py: 3 }}>No critical risks found.</TableCell></TableRow>
                                ) : (
                                    warrantyRiskData.map((row) => (
                                        <TableRow key={row.assetId}>
                                            <TableCell sx={{ fontWeight: 'bold' }}>{row.assetCode}</TableCell>
                                            <TableCell>{row.brand} {row.model}</TableCell>
                                            <TableCell>{row.branchName}</TableCell>
                                            <TableCell><Chip label={row.status} size="small" color="warning" /></TableCell>
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