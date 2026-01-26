import React, { useState, useEffect } from 'react';
import { 
    Container, Paper, Typography, Button, Table, TableBody, TableCell, 
    TableContainer, TableHead, TableRow, IconButton, Dialog, DialogTitle, 
    DialogContent, DialogActions, TextField, MenuItem, Box, Chip, Stack, 
    Select, ToggleButton, ToggleButtonGroup, 
    InputAdornment, Avatar, Grid, LinearProgress
} from '@mui/material';

import { 
    Add, Edit, Delete, CheckCircle, Build, DeleteForever, 
    Search, Download, Inventory, History, Close, Computer, EventBusy, Payments
} from '@mui/icons-material';

import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import api from '../services/api';
import { toast } from 'react-toastify';

// Helper: Calculate Days Left
const getWarrantyDaysLeft = (expiryDate) => {
    if (!expiryDate) return null;
    const today = new Date();
    const expiry = new Date(expiryDate);
    const diffTime = expiry - today;
    return Math.ceil(diffTime / (1000 * 60 * 60 * 24));
};

// Stat Card Component
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
                <Typography variant="h3" fontWeight="800" sx={{ color: color, letterSpacing: -1 }}>{count}</Typography>
                <Typography variant="subtitle2" fontWeight="bold" color="textSecondary" mt={0.5} sx={{ textTransform: 'uppercase', letterSpacing: 0.5 }}>{title}</Typography>
            </Box>
            <Avatar sx={{ bgcolor: `${color}15`, color: color, width: 56, height: 56, borderRadius: 3 }}>{icon}</Avatar>
        </Box>
        <Chip label="Live Inventory" size="small" sx={{ bgcolor: `${color}10`, color: color, fontWeight: 'bold', borderRadius: 1.5 }} />
    </Paper>
);

const AssetManagement = () => {
    // --- State ---
    const [assets, setAssets] = useState([]);
    const [branches, setBranches] = useState([]); 
    const [brands, setBrands] = useState([]); 
    const [models, setModels] = useState([]);
    const [deviceTypes, setDeviceTypes] = useState([]);

    const [open, setOpen] = useState(false);
    const [historyOpen, setHistoryOpen] = useState(false);
    const [detailsOpen, setDetailsOpen] = useState(false);
    
    const [currentAsset, setCurrentAsset] = useState(null);
    const [repairHistory, setRepairHistory] = useState([]);
    const [loadingHistory, setLoadingHistory] = useState(false);

    // --- Role & Identity ---
    const userRole = localStorage.getItem('role'); 
    const myBranchId = localStorage.getItem('branchId');
    
    // ✅ FIX: Initialize state safely based on role
    const [selectedBranchId, setSelectedBranchId] = useState(userRole === 'ADMIN' ? 'ALL' : (myBranchId || ''));

    const [searchQuery, setSearchQuery] = useState('');
    const [filterStatus, setFilterStatus] = useState('ALL');

    const [formData, setFormData] = useState({
        assetCode: '', brand: '', deviceType: '', model: '', 
        serialNumber: '', status: 'ACTIVE', branchId: '', 
        purchasedDate: '', warrantyExpiry: ''
    });

    useEffect(() => {
        loadMasterData();
        if(userRole === 'ADMIN') loadBranches();
    }, []);

    // ✅ FIX: Fetch assets ONLY when ID is valid
    useEffect(() => {
        if (selectedBranchId) {
            fetchAssets(selectedBranchId);
        }
    }, [selectedBranchId]);

    const loadMasterData = async () => {
        try {
            const [bRes, mRes, dtRes] = await Promise.all([
                api.get('/settings/brands'),
                api.get('/settings/models'),
                api.get('/settings/device-types')
            ]);
            setBrands(bRes.data);
            setModels(mRes.data);
            setDeviceTypes(dtRes.data);
        } catch (e) { console.error(e); }
    };

    const loadBranches = async () => {
        try {
            const res = await api.get('/master-data/branches'); // Verify this endpoint matches your backend
            setBranches(res.data);
        } catch (error) {
            console.error("Failed to load branches", error);
        }
    };

    // ✅ FIX: Improved Fetch Logic to handle 'ALL' correctly
    const fetchAssets = async (branchId) => {
        try {
            let url;
            if (branchId === 'ALL') {
                url = '/assets'; // Admin sees all
            } else {
                url = `/assets/branch/${branchId}`; // Specific branch
            }
            
            const res = await api.get(url);
            setAssets(res.data);
        } catch (error) { 
            console.error("Error fetching assets:", error);
            // Optional: toast.error("Failed to load assets."); 
        }
    };

    // --- History Logic ---
    const handleViewHistory = async (asset) => {
        setCurrentAsset(asset);
        setHistoryOpen(true);
        setLoadingHistory(true);
        try {
            const res = await api.get(`/assets/${asset.assetId}/history`);
            setRepairHistory(res.data);
        } catch (error) { setRepairHistory([]); } 
        finally { setLoadingHistory(false); }
    };

    const handleViewDetails = (asset) => {
        setCurrentAsset(asset);
        setDetailsOpen(true);
    };

    const getTotalRepairCost = () => {
        return repairHistory.reduce((sum, record) => sum + (record.cost || 0), 0);
    };

    // --- Filter Logic ---
    const getFilteredModels = () => {
        const bId = brands.find(b => b.name === formData.brand)?.id;
        const tId = deviceTypes.find(t => t.name === formData.deviceType)?.id;
        // Simple client-side filter if models have brandId linked
        return models; 
    };

    const filteredAssets = assets.filter(asset => {
        const lowerQ = searchQuery.toLowerCase();
        const matchesSearch = asset.assetCode.toLowerCase().includes(lowerQ) || 
                              asset.brand.toLowerCase().includes(lowerQ) || 
                              asset.model.toLowerCase().includes(lowerQ) ||
                              (asset.serialNumber && asset.serialNumber.toLowerCase().includes(lowerQ));
        const matchesStatus = filterStatus === 'ALL' || asset.status === filterStatus;
        return matchesSearch && matchesStatus;
    });

    const stats = {
        total: assets.length,
        active: assets.filter(a => a.status === 'ACTIVE').length,
        repair: assets.filter(a => a.status === 'REPAIR').length,
        disposed: assets.filter(a => a.status === 'DISPOSED').length
    };

    // --- PDF Generator ---
    const generatePDF = () => {
        const doc = new jsPDF();
        doc.setFillColor(30, 41, 59); 
        doc.rect(0, 0, 210, 24, 'F');
        doc.setTextColor(255, 255, 255);
        doc.setFontSize(16);
        doc.text("NTMI Asset Inventory Report", 14, 15);
        
        doc.setTextColor(50, 50, 50);
        doc.setFontSize(10);
        const dateStr = new Date().toLocaleDateString();
        const filterStr = `Filter: ${filterStatus} | Search: "${searchQuery}" | Total: ${filteredAssets.length}`;
        doc.text(`Generated: ${dateStr}`, 14, 32);
        doc.text(filterStr, 14, 38);

        const tableColumn = ["Asset Code", "Branch", "Device", "Serial No", "Status", "Warranty Exp"];
        const tableRows = filteredAssets.map(asset => [
            asset.assetCode,
            asset.branch?.branchName || "-",
            `${asset.brand} ${asset.model}`,
            asset.serialNumber,
            asset.status,
            asset.warrantyExpiry || "N/A"
        ]);

        autoTable(doc, {
            head: [tableColumn],
            body: tableRows,
            startY: 42,
            theme: 'grid',
            headStyles: { fillColor: [30, 41, 59] },
            styles: { fontSize: 9, cellPadding: 2 }
        });

        doc.save(`NTMI_Assets_${new Date().toISOString().slice(0,10)}.pdf`);
        toast.success("PDF Downloaded Successfully");
    };

    // --- Dialog Handlers ---
    const handleOpen = (asset = null) => {
        if (asset) {
            setFormData({
                assetCode: asset.assetCode, brand: asset.brand, deviceType: asset.deviceType || '', 
                model: asset.model, serialNumber: asset.serialNumber, status: asset.status,
                branchId: asset.branch?.branchId || (selectedBranchId === 'ALL' ? (branches[0]?.branchId || '') : selectedBranchId),
                purchasedDate: asset.purchasedDate || '', warrantyExpiry: asset.warrantyExpiry || ''
            });
            setCurrentAsset(asset);
        } else {
            setFormData({ 
                assetCode: '', brand: '', deviceType: '', model: '', 
                serialNumber: '', status: 'ACTIVE', 
                branchId: selectedBranchId === 'ALL' ? (branches[0]?.branchId || '') : selectedBranchId, 
                purchasedDate: '', warrantyExpiry: '' 
            });
            setCurrentAsset(null);
        }
        setOpen(true);
    };

    const handleSave = async () => {
        const payload = { ...formData, branchId: undefined }; // Don't send branchId in body if using param, or align with backend
        try {
            if (currentAsset) {
                await api.put(`/assets/${currentAsset.assetId}`, payload);
            } else {
                // Ensure branchId is passed correctly based on your backend expectation
                await api.post(`/assets?branchId=${formData.branchId}`, payload);
            }
            toast.success("Asset Saved");
            setOpen(false); 
            fetchAssets(selectedBranchId);
        } catch (error) { toast.error("Operation Failed"); }
    };

    const handleDelete = async (id) => {
        if(!window.confirm("Delete permanently?")) return;
        try { await api.delete(`/assets/${id}`); toast.success("Deleted"); fetchAssets(selectedBranchId); } 
        catch (error) { toast.error("Failed"); }
    };

    return (
        <Container maxWidth="xl" sx={{ mt: 4, mb: 8 }}>
            
            {/* BANNER */}
            <Paper elevation={0} sx={{ p: 4, mb: 5, borderRadius: 4, background: 'linear-gradient(135deg, #0f172a 0%, #1e293b 100%)', color: 'white', position: 'relative', overflow: 'hidden' }}>
                <Box sx={{ position: 'absolute', top: -100, right: -50, width: 300, height: 300, borderRadius: '50%', background: 'rgba(255,255,255,0.05)' }} />
                <Stack direction="row" justifyContent="space-between" alignItems="center" position="relative" zIndex={1}>
                    <Box display="flex" alignItems="center" gap={3}>
                        <Avatar sx={{ width: 64, height: 64, bgcolor: 'rgba(255,255,255,0.15)' }}><Inventory /></Avatar>
                        <Box>
                            <Typography variant="h4" fontWeight="800">Asset Management</Typography>
                            {/* Branch Selector for Admin */}
                            {userRole === 'ADMIN' && (
                                <Select 
                                    size="small" value={selectedBranchId} 
                                    onChange={(e) => setSelectedBranchId(e.target.value)} 
                                    sx={{ color: 'white', '.MuiSvgIcon-root': { color: 'white' }, mt: 1, minWidth: 150 }}
                                    variant="standard" disableUnderline
                                >
                                    <MenuItem value="ALL">All Branches</MenuItem>
                                    {branches.map(b => <MenuItem key={b.branchId} value={b.branchId}>{b.branchName}</MenuItem>)}
                                </Select>
                            )}
                        </Box>
                    </Box>
                    <Stack direction="row" spacing={2}>
                        <Button 
                            variant="outlined" 
                            startIcon={<Download />} 
                            onClick={generatePDF} 
                            sx={{ color: 'white', borderColor: 'rgba(255,255,255,0.3)', '&:hover': { borderColor: 'white', bgcolor: 'rgba(255,255,255,0.1)' } }}
                        >
                            Export PDF
                        </Button>
                        <Button variant="contained" startIcon={<Add />} onClick={() => handleOpen()} sx={{ bgcolor: 'white', color: '#0f172a', fontWeight: 'bold', '&:hover': { bgcolor: '#f1f5f9' } }}>
                            Register Asset
                        </Button>
                    </Stack>
                </Stack>
            </Paper>

            {/* STAT CARDS */}
            <Grid container spacing={3} mb={5}>
                <Grid item xs={12} sm={6} md={3}><StatCard title="Total Inventory" count={stats.total} icon={<Inventory />} color="#334155" /></Grid>
                <Grid item xs={12} sm={6} md={3}><StatCard title="In Service" count={stats.active} icon={<CheckCircle />} color="#10b981" /></Grid>
                <Grid item xs={12} sm={6} md={3}><StatCard title="Repairing" count={stats.repair} icon={<Build />} color="#f59e0b" /></Grid>
                <Grid item xs={12} sm={6} md={3}><StatCard title="DISPOSED" count={stats.disposed} icon={<DeleteForever />} color="#e11d48" /></Grid>
            </Grid>

            {/* FILTERS */}
            <Paper sx={{ p: 2, mb: 4, borderRadius: 3, display: 'flex', gap: 2, alignItems: 'center' }} elevation={0} variant="outlined">
                <TextField 
                    size="small" placeholder="Quick search asset code, brand, serial..." fullWidth
                    value={searchQuery} onChange={(e) => setSearchQuery(e.target.value)} 
                    InputProps={{ startAdornment: <InputAdornment position="start"><Search color="action" /></InputAdornment> }} 
                />
                <TextField select size="small" value={filterStatus} onChange={(e) => setFilterStatus(e.target.value)} sx={{ minWidth: 150 }}>
                    <MenuItem value="ALL">All Statuses</MenuItem>
                    <MenuItem value="ACTIVE">Active</MenuItem>
                    <MenuItem value="REPAIR">Repair</MenuItem>
                    <MenuItem value="DISPOSED">Disposed</MenuItem>
                </TextField>
            </Paper>

            {/* ASSET TABLE */}
            <TableContainer component={Paper} elevation={0} sx={{ borderRadius: 4, border: '1px solid #e2e8f0' }}>
                <Table>
                    <TableHead sx={{ bgcolor: '#f8fafc' }}>
                        <TableRow>
                            <TableCell sx={{ fontWeight: '800', color: '#475569' }}>ASSET Reg No. & TYPE</TableCell>
                            <TableCell sx={{ fontWeight: '800', color: '#475569' }}>BRANCH</TableCell>
                            <TableCell sx={{ fontWeight: '800', color: '#475569' }}>DEVICE DETAILS</TableCell>
                            <TableCell sx={{ fontWeight: '800', color: '#475569' }}>WARRANTY DAYS LEFT</TableCell>
                            <TableCell sx={{ fontWeight: '800', color: '#475569' }} align="center">REPAIRS COUNT</TableCell>
                            <TableCell sx={{ fontWeight: '800', color: '#475569' }}>STATUS</TableCell>
                            <TableCell align="right" sx={{ fontWeight: '800', color: '#475569' }}>ACTIONS</TableCell>
                        </TableRow>
                    </TableHead>
                    <TableBody>
                        {filteredAssets.length === 0 ? (
                            <TableRow>
                                <TableCell colSpan={7} align="center" sx={{ py: 5, color: 'text.secondary' }}>
                                    No assets found.
                                </TableCell>
                            </TableRow>
                        ) : (
                            filteredAssets.map((asset) => {
                                const daysLeft = getWarrantyDaysLeft(asset.warrantyExpiry);
                                return (
                                    <TableRow key={asset.assetId} hover sx={{ cursor: 'pointer' }} onClick={() => handleViewDetails(asset)}>
                                        <TableCell>
                                            <Typography variant="body2" fontWeight="800" color="primary.main">{asset.assetCode}</Typography>
                                            <Typography variant="caption" sx={{ color: 'text.secondary', fontWeight: 700 }}>{asset.deviceType}</Typography>
                                        </TableCell>
                                        <TableCell><Chip label={asset.branch?.branchCode || 'N/A'} size="small" variant="outlined" /></TableCell>
                                        <TableCell>
                                            <Typography variant="body2" fontWeight="700">{asset.brand}</Typography>
                                            <Typography variant="caption" color="textSecondary">{asset.model}</Typography>
                                        </TableCell>
                                        <TableCell>
                                            {daysLeft !== null ? (
                                                <Chip 
                                                    size="small" 
                                                    icon={<EventBusy sx={{ fontSize: '14px !important' }} />}
                                                    label={daysLeft > 0 ? `${daysLeft} Days` : 'Expired'} 
                                                    color={daysLeft < 30 ? "error" : "default"}
                                                    sx={{ fontWeight: 'bold' }}
                                                />
                                            ) : "-"}
                                        </TableCell>
                                        <TableCell align="center">
                                            <Avatar sx={{ width: 28, height: 28, fontSize: '0.75rem', bgcolor: asset.repairCount > 2 ? '#fee2e2' : '#f1f5f9', color: asset.repairCount > 2 ? '#b91c1c' : '#475569', border: '1px solid #e2e8f0', margin: 'auto' }}>
                                                {asset.repairCount || 0}
                                            </Avatar>
                                        </TableCell>
                                        <TableCell>
                                            <Chip label={asset.status} color={asset.status === 'ACTIVE' ? 'success' : 'warning'} size="small" sx={{ fontWeight: 800, fontSize: '0.65rem' }} />
                                        </TableCell>
                                        <TableCell align="right" onClick={(e) => e.stopPropagation()}>
                                            <Stack direction="row" spacing={1} justifyContent="flex-end">
                                                <IconButton size="small" onClick={() => handleViewHistory(asset)} sx={{ color: '#6366f1' }}><History fontSize="small" /></IconButton>
                                                {userRole === 'ADMIN' && (
                                                    <>
                                                        <IconButton size="small" onClick={() => handleOpen(asset)} sx={{ color: '#0ea5e9' }}><Edit fontSize="small"/></IconButton>
                                                        <IconButton size="small" onClick={() => handleDelete(asset.assetId)} sx={{ color: '#ef4444' }}><Delete fontSize="small"/></IconButton>
                                                    </>
                                                )}
                                            </Stack>
                                        </TableCell>
                                    </TableRow>
                                );
                            })
                        )}
                    </TableBody>
                </Table>
            </TableContainer>

            {/* ASSET DETAILS DIALOG */}
            <Dialog open={detailsOpen} onClose={() => setDetailsOpen(false)} maxWidth="sm" fullWidth PaperProps={{ sx: { borderRadius: 3 } }}>
                <DialogTitle sx={{ bgcolor: '#0f172a', color: 'white', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <Typography variant="h6" fontWeight="bold">Asset Profile</Typography>
                    <IconButton onClick={() => setDetailsOpen(false)} sx={{ color: 'white' }}><Close /></IconButton>
                </DialogTitle>
                <DialogContent sx={{ mt: 2 }}>
                    {currentAsset && (
                        <Box>
                            <Stack direction="row" alignItems="center" gap={2} mb={3} p={2} bgcolor="#f8fafc" borderRadius={2} border="1px solid #e2e8f0">
                                <Avatar sx={{ width: 56, height: 56, bgcolor: 'primary.main' }}><Computer /></Avatar>
                                <Box>
                                    <Typography variant="h6" fontWeight="900">{currentAsset.assetCode}</Typography>
                                    <Typography variant="body2" color="textSecondary">{currentAsset.brand} {currentAsset.model}</Typography>
                                </Box>
                            </Stack>
                            <Grid container spacing={3}>
                                <Grid item xs={6}><Typography variant="caption" fontWeight="bold" color="textSecondary">SERIAL NO</Typography><Typography variant="body1" fontWeight="700">{currentAsset.serialNumber}</Typography></Grid>
                                <Grid item xs={6}><Typography variant="caption" fontWeight="bold" color="textSecondary">BRANCH</Typography><Typography variant="body1" fontWeight="700">{currentAsset.branch?.branchName}</Typography></Grid>
                                <Grid item xs={6}><Typography variant="caption" fontWeight="bold" color="textSecondary">PURCHASE DATE</Typography><Typography variant="body1" fontWeight="700">{currentAsset.purchasedDate || 'N/A'}</Typography></Grid>
                                <Grid item xs={6}><Typography variant="caption" fontWeight="bold" color="textSecondary">REPAIR COUNT</Typography><Typography variant="body1" fontWeight="700">{currentAsset.repairCount || 0} repairs</Typography></Grid>
                            </Grid>
                        </Box>
                    )}
                </DialogContent>
                <DialogActions sx={{ p: 3, borderTop: '1px solid #eee' }}>
                    <Button 
                        variant="outlined" color="primary" startIcon={<History />} 
                        onClick={() => { setDetailsOpen(false); handleViewHistory(currentAsset); }} 
                        sx={{ fontWeight: 'bold', borderWidth: 2 }}
                    >
                        Maintenance History
                    </Button>
                    <Box sx={{ flexGrow: 1 }} />
                    <Button onClick={() => setDetailsOpen(false)}>Close</Button>
                    {userRole === 'ADMIN' && <Button variant="contained" startIcon={<Edit />} onClick={() => { setDetailsOpen(false); handleOpen(currentAsset); }}>Edit</Button>}
                </DialogActions>
            </Dialog>

            {/* REGISTER / EDIT DIALOG */}
            <Dialog open={open} onClose={() => setOpen(false)} maxWidth="sm" fullWidth PaperProps={{ sx: { borderRadius: 3 } }}>
                <DialogTitle sx={{ bgcolor: '#0f172a', color: 'white', fontWeight: 'bold' }}>{currentAsset ? `Edit Asset` : "Register New Asset"}</DialogTitle>
                <DialogContent sx={{ mt: 3 }}>
                    <Stack spacing={3}>
                        {userRole === 'ADMIN' && (
                            <TextField select label="Target Branch" fullWidth variant="outlined" value={formData.branchId} onChange={(e) => setFormData({...formData, branchId: e.target.value})}>
                                {branches.map(b => <MenuItem key={b.branchId} value={b.branchId}>{b.branchName}</MenuItem>)}
                            </TextField>
                        )}
                        <TextField label="Asset Code" fullWidth value={formData.assetCode} onChange={(e) => setFormData({...formData, assetCode: e.target.value})} />
                        <Box sx={{ display: 'flex', gap: 2 }}>
                            <TextField select label="Brand" sx={{ flex: 1 }} value={formData.brand} onChange={(e) => setFormData({...formData, brand: e.target.value})}>{brands.map(b => <MenuItem key={b.id} value={b.name}>{b.name}</MenuItem>)}</TextField>
                            <TextField select label="Type" sx={{ flex: 1 }} value={formData.deviceType} onChange={(e) => setFormData({...formData, deviceType: e.target.value})}>{deviceTypes.map(t => <MenuItem key={t.id} value={t.name}>{t.name}</MenuItem>)}</TextField>
                        </Box>
                        <Box sx={{ display: 'flex', gap: 2 }}>
                            <TextField select label="Model" sx={{ flex: 1 }} value={formData.model} onChange={(e) => setFormData({...formData, model: e.target.value})}>{models.map(m => <MenuItem key={m.id} value={m.name}>{m.name}</MenuItem>)}</TextField>
                            <TextField label="Serial No" sx={{ flex: 1 }} value={formData.serialNumber} onChange={(e) => setFormData({...formData, serialNumber: e.target.value})} />
                        </Box>
                        <Box sx={{ display: 'flex', gap: 2 }}>
                            <TextField label="Warranty Exp" type="date" sx={{ flex: 1 }} InputLabelProps={{ shrink: true }} value={formData.warrantyExpiry} onChange={(e) => setFormData({...formData, warrantyExpiry: e.target.value})} />
                            <ToggleButtonGroup value={formData.status} exclusive onChange={(e, s) => s && setFormData({...formData, status: s})} sx={{ flex: 1 }} color="primary" size="small">
                                <ToggleButton value="ACTIVE">ACTIVE</ToggleButton>
                                <ToggleButton value="REPAIR">REPAIR</ToggleButton>
                                <ToggleButton value="DISPOSED">DISPOSED</ToggleButton>
                            </ToggleButtonGroup>
                        </Box>
                    </Stack>
                </DialogContent>
                <DialogActions sx={{ p: 3 }}><Button onClick={() => setOpen(false)}>Cancel</Button><Button variant="contained" onClick={handleSave}>Save Changes</Button></DialogActions>
            </Dialog>

            {/* MAINTENANCE LOG DIALOG */}
            <Dialog open={historyOpen} onClose={() => setHistoryOpen(false)} maxWidth="sm" fullWidth PaperProps={{ sx: { borderRadius: 3 } }}>
                <DialogTitle sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', bgcolor: '#f1f5f9' }}>
                    <Box display="flex" alignItems="center" gap={1.5}><History color="primary"/><Typography variant="h6" fontWeight="800">Maintenance Log</Typography></Box>
                    <IconButton onClick={() => setHistoryOpen(false)} size="small"><Close /></IconButton>
                </DialogTitle>
                <DialogContent sx={{ bgcolor: '#f8fafc', pt: 3 }}>
                    {loadingHistory ? <LinearProgress sx={{ my: 4 }} /> : (
                        <>
                            {repairHistory.length > 0 && (
                                <Paper elevation={0} sx={{ p: 2, mb: 3, borderRadius: 2, bgcolor: '#f5f3ff', border: '1px solid #ddd6fe', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                                    <Box display="flex" alignItems="center" gap={1}><Payments sx={{ color: '#7c3aed' }} /><Typography variant="subtitle2" fontWeight="800" color="#5b21b6">TOTAL COST</Typography></Box>
                                    <Typography variant="h6" fontWeight="900" color="#7c3aed">Rs. {getTotalRepairCost().toLocaleString()}</Typography>
                                </Paper>
                            )}
                            <Stack spacing={2}>
                                {repairHistory.map((record) => (
                                    <Paper key={record.id} elevation={0} sx={{ p: 2, border: '1px solid #e2e8f0', borderLeft: '6px solid #3b82f6', bgcolor: 'white' }}>
                                        <Box display="flex" justifyContent="space-between">
                                            <Typography variant="body2" fontWeight="800">{record.actionTaken}</Typography>
                                            <Box textAlign="right">
                                                <Typography variant="caption" fontWeight="bold" color="textSecondary" display="block">{record.repairDate}</Typography>
                                                {record.cost > 0 && <Chip label={`Rs. ${record.cost.toLocaleString()}`} size="small" sx={{ height: 20, bgcolor: '#f1f5f9', mt: 0.5, fontWeight: 'bold' }} />}
                                            </Box>
                                        </Box>
                                    </Paper>
                                ))}
                            </Stack>
                        </>
                    )}
                </DialogContent>
                <DialogActions><Button onClick={() => setHistoryOpen(false)}>Close</Button></DialogActions>
            </Dialog>

        </Container>
    );
};

export default AssetManagement;