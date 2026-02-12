import React, { useState, useEffect } from 'react';
import { 
    Container, Paper, Typography, Box, Grid, TextField, MenuItem, Button, 
    Table, TableBody, TableCell, TableContainer, TableHead, TableRow, Chip,
    Dialog, DialogTitle, DialogContent, DialogActions, Alert, Fade, IconButton, Stack, Avatar, Divider, Tooltip, InputAdornment
} from '@mui/material';
import { 
    Download, FilterList, Refresh, Person, Close, 
    Assessment, Business, SupportAgent, 
    PlayArrow, CheckCircle, Lock, Computer, Download as DownloadIcon,
    DeleteForever, PriorityHigh, Event, AttachMoney, 
    Timer, HourglassBottom // ✅ Added Timer Icons
} from '@mui/icons-material';
import { toast } from 'react-toastify'; 
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import api from '../services/api';

const PALETTE = ['#1565c0', '#2e7d32', '#7b1fa2', '#e65100', '#c62828', '#00695c'];

export default function Reports() {
    const [tickets, setTickets] = useState([]);
    const [filteredTickets, setFilteredTickets] = useState([]);
    const [userColorMap, setUserColorMap] = useState({});
    const [selectedTicket, setSelectedTicket] = useState(null);
    const [openDialog, setOpenDialog] = useState(false);

    // --- RESOLUTION STATES ---
    const [openActionDialog, setOpenActionDialog] = useState(false);
    const [actionType, setActionType] = useState(null); 
    const [resolutionText, setResolutionText] = useState('');
    const [repairCost, setRepairCost] = useState('');

    const myId = parseInt(localStorage.getItem('userId')); 

    // --- FILTER STATES ---
    const [filterBranch, setFilterBranch] = useState('All');
    const [filterUser, setFilterUser] = useState('All'); 
    const [filterRaisedBy, setFilterRaisedBy] = useState('All'); 
    const [filterStatus, setFilterStatus] = useState('All');
    const [filterCategory, setFilterCategory] = useState('All'); 
    const [filterType, setFilterType] = useState('All');         
    const [dateRange, setDateRange] = useState({ start: '', end: '' });

    const [branches, setBranches] = useState([]);
    const [categories, setCategories] = useState([]); 
    const [types, setTypes] = useState([]);           

    // --- HELPER: CALCULATE DURATION ---
    const formatDuration = (startStr, endStr, createdStr) => {
        // 1. If no start time exists, use the creation time as fallback
        const effectiveStart = startStr ? new Date(startStr) : new Date(createdStr);
        
        // 2. Determine end time (Specific date or NOW)
        const end = endStr ? new Date(endStr) : new Date(); 
        
        const diffMs = end - effectiveStart;
        if (diffMs < 0) return "0m"; // Prevent negative time

        const minutes = Math.floor((diffMs / (1000 * 60)) % 60);
        const hours = Math.floor((diffMs / (1000 * 60 * 60)) % 24);
        const days = Math.floor(diffMs / (1000 * 60 * 60 * 24));

        let duration = "";
        if (days > 0) duration += `${days}d `;
        if (hours > 0) duration += `${hours}h `;
        duration += `${minutes}m`;

        // 3. If duration is empty (less than 1 min), show "< 1m"
        return duration.trim() || "< 1m";
    };

    const loadData = async () => {
        try {
            const [ticketRes, branchRes, userRes, catRes, typeRes] = await Promise.all([
                api.get('/tickets'), 
                api.get('/master-data/branches'),
                api.get('/users'),
                api.get('/master-data/categories'),
                api.get('/master-data/types')
            ]);

            const data = ticketRes.data;
            data.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
            
            setTickets(data);
            setFilteredTickets(data);
            setBranches(branchRes.data);
            setCategories(catRes.data);
            setTypes(typeRes.data);
        } catch (error) {
            toast.error("Failed to refresh data");
        }
    };

    useEffect(() => { loadData(); }, []);

    useEffect(() => {
        if (tickets.length > 0) {
            const uniqueUsers = [...new Set(tickets.map(t => t.assignedAdmin?.fullName).filter(Boolean))];
            const newColorMap = {};
            uniqueUsers.forEach((user, index) => {
                newColorMap[user] = PALETTE[index % PALETTE.length];
            });
            setUserColorMap(newColorMap);
        }
    }, [tickets]);

    useEffect(() => {
        let result = tickets;
        if (filterBranch !== 'All') result = result.filter(t => t.branch?.branchName === filterBranch);
        if (filterUser !== 'All') result = result.filter(t => t.assignedAdmin?.fullName === filterUser);
        if (filterRaisedBy !== 'All') result = result.filter(t => t.createdBy?.fullName === filterRaisedBy);
        if (filterCategory !== 'All') result = result.filter(t => t.errorCategory?.categoryName === filterCategory); 
        if (filterType !== 'All') result = result.filter(t => t.errorType?.typeName === filterType);             
        if (filterStatus !== 'All') result = result.filter(t => t.status === filterStatus);
        if (dateRange.start) result = result.filter(t => t.createdAt >= dateRange.start);
        if (dateRange.end) result = result.filter(t => t.createdAt <= dateRange.end + "T23:59:59");
        setFilteredTickets(result);
    }, [tickets, filterBranch, filterUser, filterRaisedBy, filterCategory, filterType, filterStatus, dateRange]);

    const handleStartTicket = async (ticketId) => {
        try {
            await api.put(`/tickets/${ticketId}/start`);
            toast.success("Ticket Assigned to You");
            setOpenDialog(false);
            loadData(); 
        } catch (error) { toast.error("Failed to assign ticket"); }
    };

    const openResolutionPrompt = (type) => {
        setActionType(type);
        setResolutionText('');
        setRepairCost(''); 
        setOpenActionDialog(true);
    };

    const submitResolution = async () => {
        if (!resolutionText.trim()) {
            toast.warning("Please enter details about the action taken.");
            return;
        }
        const payload = {
            resolution: resolutionText,
            cost: actionType === 'RESOLVE' ? (parseFloat(repairCost) || 0) : 0, 
            disposeAsset: actionType === 'DISPOSE' ? 'true' : 'false'
        };
        try {
            await api.put(`/tickets/${selectedTicket.ticketId}/close`, payload);
            toast.success(actionType === 'DISPOSE' ? "Asset Disposed" : "Ticket Resolved & Repair Recorded");
            setOpenActionDialog(false);
            setOpenDialog(false);
            loadData(); 
        } catch (error) { toast.error("Failed to update status"); }
    };

    const downloadImage = (base64Data, index) => {
        const link = document.createElement("a");
        link.href = base64Data;
        link.download = `Evidence_Img_${index + 1}.png`;
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
    };

    const generatePDF = () => {
        const doc = new jsPDF();
        doc.setFillColor(30, 41, 59);
        doc.rect(0, 0, 210, 20, 'F');
        doc.setTextColor(255, 255, 255);
        doc.setFontSize(16);
        doc.text("NTMI Ticket Report", 14, 13);
        doc.setTextColor(0, 0, 0);
        doc.setFontSize(10);
        doc.text(`Generated: ${new Date().toLocaleDateString()}`, 14, 28);

        const tableColumn = ["ID", "Branch", "Category", "Type", "Raised By", "Fixed By", "Status"];
        const tableRows = filteredTickets.map(t => [
            t.ticketId,
            t.branch?.branchName || "-",
            t.errorCategory?.categoryName || "-",
            t.errorType?.typeName || "-",
            t.createdBy?.fullName || "-",
            t.assignedAdmin?.fullName || "-", 
            t.status
        ]);

        autoTable(doc, {
            head: [tableColumn], body: tableRows, startY: 35,
            theme: 'grid', headStyles: { fillColor: [30, 41, 59] }, styles: { fontSize: 8 }
        });
        doc.save(`NTMI_Report.pdf`);
    };

    const getStatusColor = (status) => {
        switch (status) {
            case 'RESOLVED': return 'success';
            case 'IN_PROGRESS': return 'warning';
            case 'OPEN': return 'error';
            default: return 'primary';
        }
    };

    const getPriorityColor = (p) => {
        switch(p) {
            case 'CRITICAL': return 'error';
            case 'HIGH': return 'warning';
            case 'MEDIUM': return 'info';
            default: return 'default';
        }
    };

    const handleOpenDialog = (ticket) => {
        setSelectedTicket(ticket);
        setOpenDialog(true);
    };

    return (
        <Fade in={true} timeout={600}>
            <Container maxWidth="xl" sx={{ mt: 4, mb: 6 }}>
                
                {/* HERO HEADER */}
                <Paper elevation={0} sx={{ p: 4, mb: 4, borderRadius: 4, background: 'linear-gradient(135deg, #1e293b 0%, #334155 100%)', color: 'white', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <Box>
                        <Stack direction="row" alignItems="center" gap={1} mb={0.5}>
                            <Assessment />
                            <Typography variant="h4" fontWeight="800">System Reports</Typography>
                        </Stack>
                        <Typography variant="body1" sx={{ opacity: 0.8 }}>Analyze ticket history, filter by branch, and export data.</Typography>
                    </Box>
                    <Stack direction="row" spacing={2}>
                        <Button variant="outlined" startIcon={<Refresh />} onClick={loadData} sx={{ color: 'white', borderColor: 'rgba(255,255,255,0.3)', '&:hover': { borderColor: 'white', bgcolor: 'rgba(255,255,255,0.1)' } }}>Refresh</Button>
                        <Button variant="contained" color="secondary" startIcon={<Download />} onClick={generatePDF} sx={{ borderRadius: 2, fontWeight: 'bold' }}>Export PDF</Button>
                    </Stack>
                </Paper>

                {/* FILTERS */}
                <Paper elevation={0} sx={{ p: 3, mb: 4, borderRadius: 3, border: '1px solid #e2e8f0', bgcolor: 'white' }}>
                    <Stack spacing={3}>
                        <Stack direction="row" alignItems="center" gap={1} color="text.secondary">
                            <FilterList fontSize="small" />
                            <Typography variant="subtitle2" fontWeight="bold">FILTER OPTIONS</Typography>
                        </Stack>
                        <Grid container spacing={2}>
                            <Grid item xs={12} md={3}>
                                <TextField select fullWidth size="small" label="Branch" value={filterBranch} onChange={(e) => setFilterBranch(e.target.value)}>
                                    <MenuItem value="All">All Branches</MenuItem>
                                    {branches.map((b) => <MenuItem key={b.branchId} value={b.branchName}>{b.branchName}</MenuItem>)}
                                </TextField>
                            </Grid>
                            <Grid item xs={12} md={3}>
                                <TextField type="date" fullWidth size="small" label="From Date" InputLabelProps={{ shrink: true }} value={dateRange.start} onChange={(e) => setDateRange({...dateRange, start: e.target.value})} />
                            </Grid>
                            <Grid item xs={12} md={3}>
                                <TextField type="date" fullWidth size="small" label="To Date" InputLabelProps={{ shrink: true }} value={dateRange.end} onChange={(e) => setDateRange({...dateRange, end: e.target.value})} />
                            </Grid>
                            <Grid item xs={12} md={3}>
                                <TextField select fullWidth size="small" label="Status" value={filterStatus} onChange={(e) => setFilterStatus(e.target.value)}>
                                    <MenuItem value="All">All Statuses</MenuItem>
                                    <MenuItem value="OPEN">Open</MenuItem>
                                    <MenuItem value="IN_PROGRESS">In Progress</MenuItem>
                                    <MenuItem value="RESOLVED">Resolved</MenuItem>
                                    <MenuItem value="CANCELLED">Cancelled</MenuItem>
                                </TextField>
                            </Grid>
                        </Grid>
                        <Box display="flex" justifyContent="space-between" alignItems="center">
                            <Typography variant="caption" color="textSecondary">Showing <strong>{filteredTickets.length}</strong> results</Typography>
                            <Button size="small" color="error" onClick={() => { setFilterBranch('All'); setFilterUser('All'); setFilterRaisedBy('All'); setFilterStatus('All'); setFilterCategory('All'); setFilterType('All'); setDateRange({start:'', end:''}); }}>Clear All Filters</Button>
                        </Box>
                    </Stack>
                </Paper>

                {/* TABLE */}
                <TableContainer component={Paper} elevation={0} sx={{ borderRadius: 3, border: '1px solid #e2e8f0', overflow: 'hidden' }}>
                    <Table size="medium">
                        <TableHead sx={{ bgcolor: '#f8fafc' }}>
                            <TableRow>
                                <TableCell sx={{ fontWeight: 'bold', color: '#64748b' }}>ID</TableCell>
                                <TableCell sx={{ fontWeight: 'bold', color: '#64748b' }}>ISSUE DETAILS</TableCell>
                                <TableCell sx={{ fontWeight: 'bold', color: '#64748b' }}>BRANCH</TableCell>
                                <TableCell sx={{ fontWeight: 'bold', color: '#64748b' }}>RAISED BY</TableCell>
                                <TableCell sx={{ fontWeight: 'bold', color: '#64748b' }}>HANDLED BY</TableCell>
                                <TableCell sx={{ fontWeight: 'bold', color: '#64748b' }}>DATE</TableCell>
                                <TableCell align="right" sx={{ fontWeight: 'bold', color: '#64748b' }}>STATUS</TableCell>
                            </TableRow>
                        </TableHead>
                        <TableBody>
                            {filteredTickets.map((t) => (
                                <TableRow key={t.ticketId} hover onClick={() => handleOpenDialog(t)} sx={{ cursor: 'pointer' }}>
                                    <TableCell><Typography variant="body2" fontWeight="bold">#{t.ticketId}</Typography></TableCell>
                                    <TableCell>
                                        <Typography variant="body2" fontWeight="bold">{t.errorCategory?.categoryName}</Typography>
                                        <Typography variant="caption" color="textSecondary">{t.errorType?.typeName}</Typography>
                                    </TableCell>
                                    <TableCell><Typography variant="body2">{t.branch?.branchName || 'Unknown'}</Typography></TableCell>
                                    <TableCell><Typography variant="body2">{t.createdBy?.fullName || 'System'}</Typography></TableCell>
                                    <TableCell>
                                        {t.assignedAdmin?.fullName ? (
                                            <Stack direction="row" alignItems="center" spacing={1}>
                                                <Avatar sx={{ width: 24, height: 24, fontSize: 10, bgcolor: userColorMap[t.assignedAdmin.fullName] }}>{t.assignedAdmin.fullName.charAt(0)}</Avatar>
                                                <Typography variant="body2">{t.assignedAdmin.fullName}</Typography>
                                            </Stack>
                                        ) : <Typography variant="caption">-</Typography>}
                                    </TableCell>
                                    <TableCell><Typography variant="caption" color="textSecondary">{new Date(t.createdAt).toLocaleDateString()}</Typography></TableCell>
                                    <TableCell align="right"><Chip label={t.status.replace('_', ' ')} color={getStatusColor(t.status)} size="small" variant="filled" sx={{ fontWeight: 'bold' }}/></TableCell>
                                </TableRow>
                            ))}
                        </TableBody>
                    </Table>
                </TableContainer>

                {/* DETAILED TICKET DIALOG */}
                <Dialog open={openDialog} onClose={() => setOpenDialog(false)} fullWidth maxWidth="md" PaperProps={{ sx: { borderRadius: 3 } }}>
                    {selectedTicket && (
                        <>
                            <DialogTitle sx={{ borderBottom: '1px solid #f1f5f9', bgcolor: '#f8fafc', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                                <Box>
                                    <Typography variant="h6" fontWeight="bold">Ticket Details</Typography>
                                    <Typography variant="caption" color="text.secondary">ID: #{selectedTicket.ticketId}</Typography>
                                </Box>
                                <IconButton size="small" onClick={() => setOpenDialog(false)}><Close /></IconButton>
                            </DialogTitle>
                            
                            <DialogContent sx={{ pt: 3 }}>
                                <Stack spacing={2} mt={1}>
                                    
                                    {/* 1. Status & Priority Bar */}
                                    <Box display="flex" justifyContent="space-between" alignItems="center">
                                        <Alert severity={getStatusColor(selectedTicket.status) === 'default' ? 'info' : getStatusColor(selectedTicket.status)} icon={false} sx={{ py: 0, px: 2, fontWeight: 'bold' }}>
                                            Status: {selectedTicket.status.replace('_', ' ')}
                                        </Alert>
                                        <Stack direction="row" spacing={1}>
                                            <Chip icon={<PriorityHigh sx={{ fontSize: '14px !important' }}/>} label={selectedTicket.priority || "MEDIUM"} size="small" color={getPriorityColor(selectedTicket.priority)} variant="outlined" sx={{ fontWeight: 'bold' }} />
                                            <Chip icon={<Event sx={{ fontSize: '14px !important' }}/>} label={new Date(selectedTicket.createdAt).toLocaleDateString()} size="small" variant="outlined" />
                                        </Stack>
                                    </Box>

                                    {/* 2. Detailed Grid */}
                                    <Grid container spacing={2}>
                                        <Grid item xs={12} md={6}>
                                            <Paper variant="outlined" sx={{ p: 2, bgcolor: '#f8fafc', height: '100%' }}>
                                                <Typography variant="caption" fontWeight="bold" color="textSecondary" display="block" mb={1}>ISSUE CONTEXT</Typography>
                                                <Grid container spacing={1}>
                                                    <Grid item xs={12}><Typography variant="body2"><strong>Category:</strong> {selectedTicket.errorCategory?.categoryName}</Typography></Grid>
                                                    <Grid item xs={12}><Typography variant="body2"><strong>Type:</strong> {selectedTicket.errorType?.typeName}</Typography></Grid>
                                                    <Grid item xs={12}><Typography variant="body2"><strong>Branch:</strong> {selectedTicket.branch?.branchName}</Typography></Grid>
                                                </Grid>
                                            </Paper>
                                        </Grid>

                                        <Grid item xs={12} md={6}>
                                            <Paper variant="outlined" sx={{ p: 2, bgcolor: '#f8fafc', height: '100%' }}>
                                                <Typography variant="caption" fontWeight="bold" color="textSecondary" display="block" mb={1}>INVOLVED PARTIES</Typography>
                                                <Stack spacing={1}>
                                                    <Stack direction="row" alignItems="center" gap={1}>
                                                        <Person fontSize="small" color="action"/>
                                                        <Box>
                                                            <Typography variant="body2" fontWeight="bold">{selectedTicket.createdBy?.fullName}</Typography>
                                                            <Typography variant="caption" color="textSecondary">{selectedTicket.createdBy?.username}</Typography>
                                                        </Box>
                                                    </Stack>
                                                    <Divider />
                                                    <Stack direction="row" alignItems="center" gap={1}>
                                                        <SupportAgent fontSize="small" color="action"/>
                                                        <Typography variant="body2">{selectedTicket.assignedAdmin?.fullName || "Not Assigned"}</Typography>
                                                    </Stack>
                                                </Stack>
                                            </Paper>
                                        </Grid>
                                    </Grid>

                                    {/* 3. Asset Details */}
                                    {selectedTicket.asset && (
                                        <Paper variant="outlined" sx={{ p: 2, borderLeft: '4px solid #3b82f6', bgcolor: '#eff6ff' }}>
                                            <Stack direction="row" alignItems="center" gap={2}>
                                                <Avatar variant="rounded" sx={{ bgcolor: 'white', color: '#1976d2' }}><Computer /></Avatar>
                                                <Box>
                                                    <Typography variant="subtitle2" fontWeight="bold">LINKED ASSET</Typography>
                                                    <Typography variant="body2">{selectedTicket.asset.brand} {selectedTicket.asset.model} (Serial: {selectedTicket.asset.serialNumber})</Typography>
                                                    <Typography variant="caption" color="textSecondary">Tag: {selectedTicket.asset.assetCode}</Typography>
                                                </Box>
                                            </Stack>
                                        </Paper>
                                    )}

                                    {/* 4. Resolution Info (✅ UPDATED HERE) */}
                                    {selectedTicket.status === 'RESOLVED' && (
                                        <Paper variant="outlined" sx={{ p: 2, borderLeft: '4px solid #2e7d32', bgcolor: '#f0fdf4' }}>
                                            <Box display="flex" justifyContent="space-between" alignItems="center">
                                                <Typography variant="caption" fontWeight="bold" color="success.main" display="flex" alignItems="center" gap={0.5}>
                                                    <CheckCircle fontSize="inherit" /> RESOLUTION DETAILS
                                                </Typography>
                                                
                                                {/* ✅ PASS 'createdAt' AS FALLBACK */}
                                                <Chip 
                                                    icon={<Timer />} 
                                                    label={`Time: ${formatDuration(selectedTicket.startedAt, selectedTicket.updatedAt, selectedTicket.createdAt)}`} 
                                                    size="small" 
                                                    variant="outlined" 
                                                    color="success"
                                                />
                                            </Box>
                                            <Typography variant="body2" mt={1}>{selectedTicket.resolution || "Issue resolved successfully."}</Typography>
                                            {selectedTicket.cost > 0 && (
                                                <Chip icon={<AttachMoney />} label={`Cost: Rs. ${selectedTicket.cost}`} size="small" color="success" variant="outlined" sx={{ mt: 1, fontWeight: 'bold' }} />
                                            )}
                                        </Paper>
                                    )}

                                    {/* 5. In Progress Time Tracker (✅ UPDATED HERE) */}
                                    {selectedTicket.status === 'IN_PROGRESS' && (
                                        <Paper variant="outlined" sx={{ p: 2, bgcolor: '#fff7ed', borderLeft: '4px solid #f97316' }}>
                                            <Box display="flex" alignItems="center" gap={1}>
                                                <HourglassBottom fontSize="small" sx={{ color: '#ea580c' }} />
                                                <Typography variant="body2" fontWeight="bold" color="#9a3412">
                                                    {/* ✅ PASS 'createdAt' AS FALLBACK */}
                                                    Time Elapsed: {formatDuration(selectedTicket.startedAt, null, selectedTicket.createdAt)}
                                                </Typography>
                                            </Box>
                                        </Paper>
                                    )}

                                    {/* 6. Description */}
                                    <Box>
                                        <Typography variant="caption" fontWeight="bold" color="textSecondary">FULL DESCRIPTION</Typography>
                                        <Paper variant="outlined" sx={{ p: 2, mt: 0.5, bgcolor: '#fff', maxHeight: 150, overflowY: 'auto' }}>
                                            <Typography variant="body2" color="textPrimary" sx={{ whiteSpace: 'pre-line' }}>{selectedTicket.description || "No description."}</Typography>
                                        </Paper>
                                    </Box>

                                    {/* 7. Evidence Images */}
                                    {selectedTicket.images && selectedTicket.images.length > 0 && (
                                        <Box mt={2}>
                                            <Typography variant="caption" fontWeight="bold" color="textSecondary" display="block" mb={1}>EVIDENCE</Typography>
                                            <Stack direction="row" spacing={2} sx={{ overflowX: 'auto', pb: 1 }}>
                                                {selectedTicket.images.map((img, idx) => (
                                                    <Box key={idx} position="relative" sx={{ flexShrink: 0 }}>
                                                        <Box component="img" src={img.base64Data} onClick={() => window.open(img.base64Data)} sx={{ width: 100, height: 100, borderRadius: 2, border: '2px solid #e2e8f0', objectFit: 'cover', cursor: 'zoom-in', '&:hover': { borderColor: '#3b82f6' } }} />
                                                        <Tooltip title="Download">
                                                            <IconButton size="small" onClick={(e) => { e.stopPropagation(); downloadImage(img.base64Data, idx); }} sx={{ position: 'absolute', bottom: -8, right: -8, bgcolor: 'white', border: '1px solid #ddd', boxShadow: 2 }}>
                                                                <DownloadIcon fontSize="small" color="primary" />
                                                            </IconButton>
                                                        </Tooltip>
                                                    </Box>
                                                ))}
                                            </Stack>
                                        </Box>
                                    )}
                                </Stack>
                            </DialogContent>
                            
                            <DialogActions sx={{ p: 3, borderTop: '1px solid #f1f5f9', justifyContent: 'space-between' }}>
                                {selectedTicket.status === 'OPEN' && (
                                    <Button variant="contained" color="primary" fullWidth startIcon={<PlayArrow />} onClick={() => handleStartTicket(selectedTicket.ticketId)}>Accept & Start</Button>
                                )}
                                {selectedTicket.status === 'IN_PROGRESS' && (
                                    selectedTicket.assignedAdmin?.userId === myId ? (
                                        <Button variant="contained" color="success" fullWidth startIcon={<CheckCircle />} onClick={() => openResolutionPrompt('RESOLVE')}>Mark Resolved</Button>
                                    ) : (
                                        <Alert severity="warning" icon={<Lock fontSize="inherit" />} sx={{ width: '100%', py: 0, alignItems: 'center' }}>Locked by <strong>{selectedTicket.assignedAdmin?.fullName}</strong></Alert>
                                    )
                                )}
                                {selectedTicket.status === 'RESOLVED' && <Button disabled fullWidth variant="outlined" startIcon={<CheckCircle />}>Already Resolved</Button>}
                            </DialogActions>
                        </>
                    )}
                </Dialog>

                {/* RESOLUTION DIALOG */}
                <Dialog open={openActionDialog} onClose={() => setOpenActionDialog(false)} maxWidth="sm" fullWidth PaperProps={{ sx: { borderRadius: 3 } }}>
                    <DialogTitle sx={{ bgcolor: actionType === 'DISPOSE' ? '#fee2e2' : '#f0fdf4', color: actionType === 'DISPOSE' ? '#b91c1c' : '#15803d', fontWeight: '800', display: 'flex', alignItems: 'center', gap: 1.5 }}>
                        {actionType === 'DISPOSE' ? <DeleteForever /> : <CheckCircle />}
                        {actionType === 'DISPOSE' ? 'Confirm Asset Disposal' : 'Complete Ticket Resolution'}
                    </DialogTitle>
                    <DialogContent sx={{ mt: 2 }}>
                        <Stack spacing={3}>
                            {actionType === 'DISPOSE' && (<Alert severity="error" variant="outlined" sx={{ borderRadius: 2 }}><strong>Warning:</strong> This will permanently mark the asset as <strong>DISPOSED</strong>.</Alert>)}
                            <Box>
                                <Typography variant="caption" fontWeight="bold" color="textSecondary" sx={{ mb: 1, display: 'block', textTransform: 'uppercase' }}>Action Details</Typography>
                                <TextField autoFocus placeholder="Explain action taken..." fullWidth multiline rows={4} value={resolutionText} onChange={(e) => setResolutionText(e.target.value)} variant="outlined" sx={{ bgcolor: '#f8fafc' }} />
                            </Box>
                            {actionType === 'RESOLVE' && (
                                <Box>
                                    <Typography variant="caption" fontWeight="bold" color="textSecondary" sx={{ mb: 1, display: 'block', textTransform: 'uppercase' }}>Financial Details</Typography>
                                    <TextField label="Total Repair Cost" fullWidth type="number" value={repairCost} onChange={(e) => setRepairCost(e.target.value)} placeholder="0.00" InputProps={{ startAdornment: (<InputAdornment position="start"><Typography fontWeight="bold" color="primary">Rs.</Typography></InputAdornment>) }} />
                                </Box>
                            )}
                        </Stack>
                    </DialogContent>
                    <DialogActions sx={{ p: 3, borderTop: '1px solid #e2e8f0', bgcolor: '#f8fafc' }}>
                        <Button onClick={() => setOpenActionDialog(false)} sx={{ color: '#64748b', fontWeight: 'bold' }}>Cancel</Button>
                        <Button onClick={submitResolution} variant="contained" size="large" color={actionType === 'DISPOSE' ? 'error' : 'success'} disabled={!resolutionText.trim()} sx={{ px: 4, fontWeight: '800', borderRadius: 2 }}>Confirm</Button>
                    </DialogActions>
                </Dialog>

            </Container>
        </Fade>
    );
}