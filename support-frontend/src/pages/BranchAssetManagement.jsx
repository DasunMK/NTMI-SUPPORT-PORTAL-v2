import React, { useState, useEffect } from 'react';
import { 
    Container, Paper, Typography, Button, Table, TableBody, TableCell, 
    TableContainer, TableHead, TableRow, IconButton, Dialog, DialogTitle, 
    DialogContent, DialogActions, TextField, MenuItem, Box, Chip, Stack, 
    InputAdornment, Tooltip, LinearProgress, Avatar, Grid 
} from '@mui/material';

import { 
    Search, Download, Inventory, History, Close, Computer, 
    CheckCircle, Build, DeleteForever, ReportProblem, EventBusy 
} from '@mui/icons-material';

import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import api from '../services/api';
import { toast } from 'react-toastify';
import { useNavigate } from 'react-router-dom';

const getWarrantyDaysLeft = (expiryDate) => {
    if (!expiryDate) return null;
    const today = new Date();
    const expiry = new Date(expiryDate);
    const diffTime = expiry - today;
    return Math.ceil(diffTime / (1000 * 60 * 60 * 24));
};

const StatCard = ({ title, count, icon, color }) => (
    <Paper 
        elevation={0} 
        sx={{ 
            p: 3, borderRadius: 4, 
            background: `linear-gradient(145deg, #ffffff, ${color}08)`,
            border: `1px solid ${color}20`,
            boxShadow: '0 4px 20px rgba(0,0,0,0.03)',
            transition: 'transform 0.2s',
            '&:hover': { transform: 'translateY(-4px)', boxShadow: '0 12px 30px rgba(0,0,0,0.08)' }
        }}
    >
        <Box display="flex" justifyContent="space-between" alignItems="start" mb={2}>
            <Box>
                <Typography variant="h4" fontWeight="800" sx={{ color: color, letterSpacing: -1 }}>{count}</Typography>
                <Typography variant="caption" fontWeight="bold" color="textSecondary" mt={0.5} sx={{ textTransform: 'uppercase' }}>{title}</Typography>
            </Box>
            <Avatar sx={{ bgcolor: `${color}15`, color: color, width: 48, height: 48, borderRadius: 3 }}>{icon}</Avatar>
        </Box>
        <Chip label="Local Inventory" size="small" sx={{ bgcolor: `${color}10`, color: color, fontWeight: 'bold', borderRadius: 1.5 }} />
    </Paper>
);

const BranchAssetManagement = () => {
    const navigate = useNavigate();

    const [assets, setAssets] = useState([]);
    const [searchQuery, setSearchQuery] = useState('');
    const [filterStatus, setFilterStatus] = useState('ALL');
    
    const [historyOpen, setHistoryOpen] = useState(false);
    const [currentAsset, setCurrentAsset] = useState(null);
    const [repairHistory, setRepairHistory] = useState([]);
    const [loadingHistory, setLoadingHistory] = useState(false);

    const myBranchId = localStorage.getItem('branchId');

    useEffect(() => {
        if (myBranchId) {
            fetchMyAssets();
        } else {
            toast.error("Branch ID missing. Please relogin.");
        }
    }, [myBranchId]);

    const fetchMyAssets = async () => {
        try {
            const res = await api.get(`/assets/branch/${myBranchId}`);
            setAssets(res.data);
        } catch (error) {
            console.error("Failed to load assets", error);
        }
    };

    const handleViewHistory = async (asset) => {
        setCurrentAsset(asset);
        setHistoryOpen(true);
        setLoadingHistory(true);
        try {
            const res = await api.get(`/assets/${asset.assetId}/history`);
            setRepairHistory(res.data);
        } catch (error) { 
            setRepairHistory([]); 
        } finally { 
            setLoadingHistory(false); 
        }
    };

    const handleReportIssue = (asset) => {
        navigate('/create-ticket', { 
            state: { 
                assetId: asset.assetId, 
                assetCode: asset.assetCode,
                category: asset.deviceType 
            } 
        });
    };

    const filteredAssets = assets.filter(asset => {
        const lowerQ = searchQuery.toLowerCase();
        const matchesSearch = asset.assetCode.toLowerCase().includes(lowerQ) || 
                              asset.brand.toLowerCase().includes(lowerQ) || 
                              asset.model.toLowerCase().includes(lowerQ);
        const matchesStatus = filterStatus === 'ALL' || asset.status === filterStatus;
        return matchesSearch && matchesStatus;
    });

    // Calculate Grand Total for the branch
    const branchTotalSpend = filteredAssets.reduce((sum, a) => sum + (a.totalRepairCost || 0), 0);

    const stats = {
        total: assets.length,
        active: assets.filter(a => a.status === 'ACTIVE').length,
        repair: assets.filter(a => a.status === 'REPAIR').length,
        disposed: assets.filter(a => a.status === 'DISPOSED').length
    };

    const generatePDF = () => {
        const doc = new jsPDF();
        doc.setFillColor(30, 41, 59);
        doc.rect(0, 0, 210, 24, 'F');
        doc.setTextColor(255, 255, 255);
        doc.setFontSize(16);
        doc.text("My Branch Assets Report", 14, 15);
        
        doc.setTextColor(50, 50, 50);
        doc.setFontSize(10);
        doc.text(`Generated: ${new Date().toLocaleDateString()}`, 14, 35);

        const tableColumn = ["Asset Code", "Device", "Serial No", "Status", "Warranty", "Repairs"];
        const tableRows = filteredAssets.map(asset => [
            asset.assetCode,
            `${asset.brand} ${asset.model}`,
            asset.serialNumber,
            asset.status,
            asset.warrantyExpiry || "N/A",
            asset.repairCount || 0,
            `Rs. ${(asset.totalRepairCost || 0).toLocaleString()}`
        ]);

        autoTable(doc, {
            head: [tableColumn],
            body: tableRows,
            startY: 40,
            theme: 'grid',
            headStyles: { fillColor: [30, 41, 59] },
            styles: { fontSize: 8 }
        });
        doc.save(`My_Assets_Report.pdf`);
    };

    return (
        <Container maxWidth="xl" sx={{ mt: 4, mb: 8 }}>
            
            {/* HEADER */}
            <Paper elevation={0} sx={{ p: 4, mb: 5, borderRadius: 4, background: 'linear-gradient(135deg, #0f172a 0%, #1e293b 100%)', color: 'white' }}>
                <Stack direction="row" justifyContent="space-between" alignItems="center">
                    <Box display="flex" alignItems="center" gap={3}>
                        <Avatar sx={{ width: 64, height: 64, bgcolor: 'rgba(255,255,255,0.15)' }}><Inventory /></Avatar>
                        <Box>
                            <Typography variant="h4" fontWeight="800">My Branch Assets</Typography>
                            <Typography variant="body1" sx={{ opacity: 0.8 }}>Inventory & Reliability Tracking</Typography>
                        </Box>
                    </Box>
                    <Button variant="outlined" startIcon={<Download />} onClick={generatePDF} sx={{ color: 'white', borderColor: 'rgba(255,255,255,0.3)', '&:hover': { borderColor: 'white', bgcolor: 'rgba(255,255,255,0.1)' } }}>
                        Export Report
                    </Button>
                </Stack>
            </Paper>

            <Grid container spacing={3} mb={5}>
                <Grid item xs={12} sm={6} md={3}><StatCard title="Total Devices" count={stats.total} icon={<Inventory />} color="#334155" /></Grid>
                <Grid item xs={12} sm={6} md={3}><StatCard title="Working" count={stats.active} icon={<CheckCircle />} color="#10b981" /></Grid>
                <Grid item xs={12} sm={6} md={3}><StatCard title="In Repair" count={stats.repair} icon={<Build />} color="#f59e0b" /></Grid>
                <Grid item xs={12} sm={6} md={3}><StatCard title="Disposed" count={stats.disposed} icon={<DeleteForever />} color="#e11d48" /></Grid>
            </Grid>

            {/* FILTERS */}
            <Paper sx={{ p: 2, mb: 4, borderRadius: 3, display: 'flex', gap: 2, alignItems: 'center' }} elevation={0} variant="outlined">
                <TextField size="small" placeholder="Quick search..." fullWidth value={searchQuery} onChange={(e) => setSearchQuery(e.target.value)} InputProps={{ startAdornment: <InputAdornment position="start"><Search color="action" /></InputAdornment> }} />
                <TextField select size="small" value={filterStatus} onChange={(e) => setFilterStatus(e.target.value)} sx={{ minWidth: 150 }}>
                    <MenuItem value="ALL">All Statuses</MenuItem>
                    <MenuItem value="ACTIVE">Active</MenuItem>
                    <MenuItem value="REPAIR">Repair</MenuItem>
                    <MenuItem value="DISPOSED">Disposed</MenuItem>
                </TextField>
            </Paper>

            {/* TABLE */}
            <TableContainer component={Paper} elevation={0} sx={{ borderRadius: 4, border: '1px solid #e2e8f0' }}>
                <Table sx={{ minWidth: 1000 }}>
                    <TableHead sx={{ bgcolor: '#f8fafc' }}>
                        <TableRow>
                            <TableCell sx={{ fontWeight: '800', color: '#475569' }}>ASSET CODE</TableCell>
                            <TableCell sx={{ fontWeight: '800', color: '#475569' }}>DEVICE DETAILS</TableCell>
                            <TableCell sx={{ fontWeight: '800', color: '#475569' }}>WARRANTY</TableCell>
                            <TableCell align="center" sx={{ fontWeight: '800', color: '#475569' }}>REPAIRS</TableCell>
                            <TableCell sx={{ fontWeight: '800', color: '#475569' }}>STATUS</TableCell>
                            <TableCell align="right" sx={{ fontWeight: '800', color: '#475569' }}>ACTIONS</TableCell>
                        </TableRow>
                    </TableHead>
                    <TableBody>
                        {filteredAssets.map((asset) => {
                            const daysLeft = getWarrantyDaysLeft(asset.warrantyExpiry);
                            return (
                                <TableRow key={asset.assetId} hover>
                                    <TableCell>
                                        <Typography variant="body2" fontWeight="800" color="primary.main">{asset.assetCode}</Typography>
                                    </TableCell>
                                    <TableCell>
                                        <Typography variant="body2" fontWeight="700">{asset.brand} {asset.model}</Typography>
                                        <Typography variant="caption" color="textSecondary">{asset.deviceType} • S/N: {asset.serialNumber}</Typography>
                                    </TableCell>
                                    <TableCell>
                                        {daysLeft !== null ? (
                                            <Chip size="small" icon={<EventBusy sx={{ fontSize: '14px !important' }} />} label={daysLeft > 0 ? `${daysLeft} Days` : 'Expired'} color={daysLeft < 30 ? "error" : "default"} sx={{ fontWeight: 'bold' }} />
                                        ) : "-"}
                                    </TableCell>
                                    <TableCell align="center">
                                        <Chip 
                                            label={asset.repairCount || 0} 
                                            size="small" 
                                            sx={{ 
                                                bgcolor: (asset.repairCount || 0) > 0 ? '#eff6ff' : '#f8fafc',
                                                color: (asset.repairCount || 0) > 0 ? '#1d4ed8' : '#94a3b8',
                                                fontWeight: 'bold'
                                            }} 
                                        />
                                    </TableCell>
                                    {/* <TableCell align="right">
                                        <Typography variant="body2" fontWeight="700">
                                            {asset.totalRepairCost ? `Rs. ${asset.totalRepairCost.toLocaleString()}` : '-'}
                                        </Typography>
                                    </TableCell> */}
                                    <TableCell>
                                        <Chip label={asset.status} color={asset.status === 'ACTIVE' ? 'success' : 'warning'} size="small" sx={{ fontWeight: 800, fontSize: '0.65rem' }} />
                                    </TableCell>
                                    <TableCell align="right">
                                        <Stack direction="row" spacing={1} justifyContent="flex-end">
                                            <IconButton size="small" onClick={() => handleViewHistory(asset)} sx={{ color: '#6366f1' }}><History fontSize="small" /></IconButton>
                                            <Tooltip title="Report Issue">
                                                <IconButton size="small" onClick={() => handleReportIssue(asset)} sx={{ color: '#f59e0b', bgcolor: '#fffbeb' }}><ReportProblem fontSize="small"/></IconButton>
                                            </Tooltip>
                                        </Stack>
                                    </TableCell>
                                </TableRow>
                            );
                        })}

                        {/* GRAND TOTAL ROW */}
                        {/* <TableRow sx={{ bgcolor: '#f8fafc' }}>
                            <TableCell colSpan={4} align="right">
                                <Typography variant="subtitle2" fontWeight="800">Branch Maintenance Total:</Typography>
                            </TableCell>
                            <TableCell align="right">
                                <Typography variant="subtitle2" fontWeight="800" color="primary.main">
                                    Rs. {branchTotalSpend.toLocaleString()}
                                </Typography>
                            </TableCell>
                            <TableCell colSpan={2} />
                        </TableRow> */}
                    </TableBody>
                </Table>
            </TableContainer>

            {/* MAINTENANCE HISTORY DIALOG */}
            <Dialog open={historyOpen} onClose={() => setHistoryOpen(false)} maxWidth="sm" fullWidth>
                <DialogTitle sx={{ fontWeight: '800' }}>Maintenance Log: {currentAsset?.assetCode}</DialogTitle>
                <DialogContent>
                    {loadingHistory ? <LinearProgress sx={{ mt: 2 }} /> : (
                        <Stack spacing={2} mt={2}>
                            {repairHistory.length === 0 ? <Typography color="textSecondary">No history found.</Typography> : repairHistory.map((rec) => (
                                <Paper key={rec.id} sx={{ p: 2, borderLeft: '4px solid #3b82f6', bgcolor: '#f8fafc' }}>
                                    <Box display="flex" justifyContent="space-between" alignItems="center">
                                        <Typography variant="body2" fontWeight="bold">{rec.actionTaken}</Typography>
                                        {rec.cost > 0 && <Chip label={`Rs. ${rec.cost.toLocaleString()}`} size="small" color="success" variant="outlined" />}
                                    </Box>
                                    <Typography variant="caption" display="block" mt={0.5} color="textSecondary">Performed on: {rec.repairDate}</Typography>
                                </Paper>
                            ))}
                        </Stack>
                    )}
                </DialogContent>
                <DialogActions sx={{ p: 2 }}><Button onClick={() => setHistoryOpen(false)} variant="contained">Close</Button></DialogActions>
            </Dialog>

        </Container>
    );
};

export default BranchAssetManagement;