import React, { useState, useEffect, useMemo } from 'react';
import { 
    Container, Paper, Typography, Box, Grid, TextField, MenuItem, Button, 
    Table, TableBody, TableCell, TableContainer, TableHead, TableRow, Chip,
    Dialog, DialogTitle, DialogContent, DialogActions, Alert, Fade, IconButton, Stack, Avatar, Tooltip,
    InputAdornment
} from '@mui/material';
import { 
    Download, FilterList, Refresh, Person, Close, 
    Assessment, Business, SupportAgent, 
    PlayArrow, CheckCircle, Lock, Computer, Download as DownloadIcon,
    DeleteForever, PriorityHigh, Event, AttachMoney, 
    Timer, HourglassBottom, Image as ImageIcon,
    ReportProblem, Timeline, Engineering, CloudUpload
} from '@mui/icons-material';
import { toast } from 'react-toastify'; 
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import api from '../services/api';
import TicketComments from '../components/TicketComments'; 

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
    const [billImage, setBillImage] = useState(null);
    const [billFileName, setBillFileName] = useState("");
    
    const myId = parseInt(localStorage.getItem('userId')); 
    const myRole = localStorage.getItem('role'); 

    // --- FILTER STATES ---
    const [filterBranch, setFilterBranch] = useState('All');
    const [filterUser, setFilterUser] = useState('All');       // Handled By
    const [filterRaisedBy, setFilterRaisedBy] = useState('All'); // Raised By
    const [filterCategory, setFilterCategory] = useState('All'); 
    const [filterType, setFilterType] = useState('All');        
    const [filterStatus, setFilterStatus] = useState('All'); 
    const [filterAsset, setFilterAsset] = useState('All');       // ✅ NEW: Asset Filter
    const [dateRange, setDateRange] = useState({ start: '', end: '' });

    const [branches, setBranches] = useState([]);
    const [categories, setCategories] = useState([]); 
    const [types, setTypes] = useState([]);           

    // --- HELPER: CALCULATE DURATION ---
    const formatDuration = (startStr, endStr, createdStr) => {
        const effectiveStart = startStr ? new Date(startStr) : new Date(createdStr);
        const end = endStr ? new Date(endStr) : new Date(); 
        const diffMs = end - effectiveStart;
        
        if (diffMs < 0) return "0m"; 
        
        const minutes = Math.floor((diffMs / (1000 * 60)) % 60);
        const hours = Math.floor((diffMs / (1000 * 60 * 60)) % 24);
        const days = Math.floor(diffMs / (1000 * 60 * 60 * 24));

        let duration = "";
        if (days > 0) duration += `${days}d `;
        if (hours > 0) duration += `${hours}h `;
        duration += `${minutes}m`;

        return duration.trim() || "< 1m";
    };

    const getApprovalDetails = (status) => {
        switch(status) {
            case 'PENDING_SUPER_ADMIN': return { text: 'Waiting for Technical Director', color: 'warning.main' };
            case 'PENDING_FINANCE': return { text: 'Waiting for Account Head', color: 'warning.main' };
            case 'APPROVED_FOR_REPAIR': return { text: 'Fully Authorized', color: 'success.main' };
            case 'REJECTED': return { text: 'Rejected by Management', color: 'error.main' };
            default: return { text: 'N/A', color: 'text.secondary' };
        }
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

    // ✅ EXTRACT UNIQUE OPTIONS FOR DROPDOWNS DYNAMICALLY
    const handledByOptions = useMemo(() => [...new Set(tickets.map(t => t.assignedAdmin?.fullName).filter(Boolean))], [tickets]);
    const raisedByOptions = useMemo(() => [...new Set(tickets.map(t => t.createdBy?.fullName).filter(Boolean))], [tickets]);
    const assetOptions = useMemo(() => [...new Map(tickets.filter(t => t.asset).map(t => [t.asset.assetCode, t.asset])).values()], [tickets]);

    useEffect(() => {
        let result = tickets;
        if (filterBranch !== 'All') result = result.filter(t => t.branch?.branchName === filterBranch);
        if (filterUser !== 'All') result = result.filter(t => t.assignedAdmin?.fullName === filterUser);
        if (filterRaisedBy !== 'All') result = result.filter(t => t.createdBy?.fullName === filterRaisedBy);
        if (filterAsset !== 'All') result = result.filter(t => t.asset?.assetCode === filterAsset); // ✅ NEW
        if (filterCategory !== 'All') result = result.filter(t => t.errorCategory?.categoryName === filterCategory); 
        if (filterType !== 'All') result = result.filter(t => t.errorType?.typeName === filterType);            
        if (filterStatus !== 'All') result = result.filter(t => t.status === filterStatus);
        if (dateRange.start) result = result.filter(t => t.createdAt >= dateRange.start);
        if (dateRange.end) result = result.filter(t => t.createdAt <= dateRange.end + "T23:59:59");
        
        setFilteredTickets(result);
    }, [tickets, filterBranch, filterUser, filterRaisedBy, filterAsset, filterCategory, filterType, filterStatus, dateRange]);

    // --- ACTIONS ---
    const handleStartWork = async () => {
        try {
            await api.put(`/tickets/${selectedTicket.ticketId}/start-work`);
            toast.success("Repair Work Started");
            setOpenDialog(false);
            loadData(); 
        } catch (error) { toast.error("Failed to start work"); }
    };

    const openResolutionPrompt = (type) => {
        setActionType(type);
        setResolutionText('');
        setRepairCost(''); 
        setBillImage(null);
        setBillFileName("");
        setOpenActionDialog(true);
    };

    const handleBillUpload = (event) => {
        const file = event.target.files[0];
        if (file) {
            const reader = new FileReader();
            reader.onloadend = () => {
                setBillImage(reader.result);
                setBillFileName(file.name);
            };
            reader.readAsDataURL(file);
        }
    };

    const submitFinalResolution = async () => {
        if (!resolutionText.trim()) {
            toast.warning("Please enter details about the action taken.");
            return;
        }
        
        const costValue = actionType === 'RESOLVE' ? (parseFloat(repairCost) || 0) : 0;
        const estCost = selectedTicket.estimatedCost || 0;

        if (actionType === 'RESOLVE' && costValue > estCost) {
            if (!selectedTicket.varianceReason && costValue > 0 && costValue > estCost) {
                 toast.warning("Cost exceeds estimate. Reason required."); 
                 return; 
            }
        }

        const payload = { 
            resolution: resolutionText, 
            finalCost: costValue, 
            disposeAsset: actionType === 'DISPOSE' ? 'true' : 'false',
            billImage: billImage,
            varianceReason: selectedTicket.varianceReason 
        };

        try {
            await api.put(`/tickets/${selectedTicket.ticketId}/resolve-final`, payload);
            toast.success(actionType === 'DISPOSE' ? "Asset Disposed" : "Ticket Resolved");
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
                        <Stack direction="row" alignItems="center" gap={1} color="textSecondary">
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
                            
                            {/* ✅ NEW: Handled By Filter */}
                            <Grid item xs={12} md={3}>
                                <TextField select fullWidth size="small" label="Handled By" value={filterUser} onChange={(e) => setFilterUser(e.target.value)}>
                                    <MenuItem value="All">All Admins</MenuItem>
                                    {handledByOptions.map(name => <MenuItem key={name} value={name}>{name}</MenuItem>)}
                                </TextField>
                            </Grid>

                            {/* ✅ NEW: Raised By Filter */}
                            <Grid item xs={12} md={3}>
                                <TextField select fullWidth size="small" label="Raised By" value={filterRaisedBy} onChange={(e) => setFilterRaisedBy(e.target.value)}>
                                    <MenuItem value="All">All Users</MenuItem>
                                    {raisedByOptions.map(name => <MenuItem key={name} value={name}>{name}</MenuItem>)}
                                </TextField>
                            </Grid>

                            {/* ✅ NEW: Asset Filter */}
                            <Grid item xs={12} md={3}>
                                <TextField select fullWidth size="small" label="Asset" value={filterAsset} onChange={(e) => setFilterAsset(e.target.value)}>
                                    <MenuItem value="All">All Assets</MenuItem>
                                    {assetOptions.map(asset => <MenuItem key={asset.assetCode} value={asset.assetCode}>{asset.assetCode} ({asset.model})</MenuItem>)}
                                </TextField>
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
                            <Grid item xs={12} md={3}>
                                <TextField type="date" fullWidth size="small" label="From Date" InputLabelProps={{ shrink: true }} value={dateRange.start} onChange={(e) => setDateRange({...dateRange, start: e.target.value})} />
                            </Grid>
                            <Grid item xs={12} md={3}>
                                <TextField type="date" fullWidth size="small" label="To Date" InputLabelProps={{ shrink: true }} value={dateRange.end} onChange={(e) => setDateRange({...dateRange, end: e.target.value})} />
                            </Grid>
                        </Grid>
                        <Box display="flex" justifyContent="space-between" alignItems="center">
                            <Typography variant="caption" color="textSecondary">Showing <strong>{filteredTickets.length}</strong> results</Typography>
                            <Button size="small" color="error" onClick={() => { 
                                setFilterBranch('All'); setFilterUser('All'); setFilterRaisedBy('All'); 
                                setFilterAsset('All'); setFilterStatus('All'); setFilterCategory('All'); 
                                setFilterType('All'); setDateRange({start:'', end:''}); 
                            }}>
                                Clear All Filters
                            </Button>
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

                {/* DETAILED TICKET DIALOG (Interactive) */}
                <Dialog open={openDialog} onClose={() => setOpenDialog(false)} fullWidth maxWidth="lg" PaperProps={{ sx: { borderRadius: 3, height: '90vh' } }}>
                    {selectedTicket && (
                        <>
                            <Box sx={{ p: 3, borderBottom: '1px solid #e2e8f0', bgcolor: 'white', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                                <Box display="flex" alignItems="center" gap={2}>
                                    <Avatar sx={{ bgcolor: '#eff6ff', color: '#3b82f6' }}><ReportProblem /></Avatar>
                                    <Box>
                                        <Stack direction="row" alignItems="center" spacing={2}>
                                            <Typography variant="h5" fontWeight="800" color="#0f172a">Ticket #{selectedTicket.ticketId}</Typography>
                                            <Chip label={selectedTicket.status} size="small" color={getStatusColor(selectedTicket.status)} sx={{ fontWeight: 'bold' }} />
                                        </Stack>
                                        <Typography variant="body2" color="textSecondary">By {selectedTicket.createdBy?.fullName}</Typography>
                                    </Box>
                                </Box>
                                <IconButton onClick={() => setOpenDialog(false)} sx={{ bgcolor: '#f1f5f9' }}><Close /></IconButton>
                            </Box>

                            <DialogContent sx={{ p: 0, display: 'flex', flexDirection: { xs: 'column', md: 'row' }, height: '100%' }}>
                                {/* LEFT SIDE: TICKET INFO & CHAT */}
                                <Box sx={{ flex: 1, p: 4, overflowY: 'auto', borderRight: '1px solid #e2e8f0' }}>
                                    
                                    <Paper sx={{ p: 2.5, mb: 3, bgcolor: '#f0f9ff', border: '1px solid #bae6fd', borderRadius: 3 }}>
                                        <Stack direction="row" alignItems="center" gap={1} mb={2}>
                                            <Timeline color="primary" fontSize="small" />
                                            <Typography variant="subtitle2" fontWeight="800" color="primary.main">PROJECT STATUS & FINANCIALS</Typography>
                                        </Stack>
                                        <Grid container spacing={2}>
                                            <Grid item xs={6}>
                                                <Typography variant="caption" color="textSecondary" fontWeight="bold">APPROVAL STATUS</Typography>
                                                <Typography variant="body2" fontWeight="bold" sx={{ color: getApprovalDetails(selectedTicket.status).color }}>
                                                    {getApprovalDetails(selectedTicket.status).text}
                                                </Typography>
                                            </Grid>
                                            <Grid item xs={6}>
                                                <Typography variant="caption" color="textSecondary" fontWeight="bold">ESTIMATED COST</Typography>
                                                <Typography variant="body2" fontWeight="bold" color="#0f172a">
                                                    {selectedTicket.status === 'OPEN' 
                                                        ? 'Pending Estimate' 
                                                        : `Rs. ${(selectedTicket.estimatedCost || selectedTicket.repairCost || 0).toLocaleString()}`}
                                                </Typography>
                                            </Grid>
                                            
                                            {selectedTicket.repairDescription && (
                                                <Grid item xs={12}>
                                                    <Typography variant="caption" color="textSecondary" fontWeight="bold">REPAIR PLAN ({selectedTicket.repairSource || 'EXTERNAL'})</Typography>
                                                    <Typography variant="body2" sx={{ fontStyle: 'italic', color: '#475569' }}>"{selectedTicket.repairDescription}"</Typography>
                                                </Grid>
                                            )}
                                            
                                            {selectedTicket.varianceReason && (
                                                <Grid item xs={12}>
                                                    <Typography variant="caption" color="error" fontWeight="bold">COST VARIANCE</Typography>
                                                    <Alert severity="warning" sx={{ p: 1, py: 0, bgcolor: '#fff7ed' }}>
                                                        Exceeded estimate by Rs. {parseFloat(selectedTicket.repairCost) - parseFloat(selectedTicket.estimatedCost)}
                                                    </Alert>
                                                    <Typography variant="caption" color="error">Reason: {selectedTicket.varianceReason}</Typography>
                                                </Grid>
                                            )}
                                        </Grid>
                                    </Paper>

                                    <Box mb={4}>
                                        <Typography variant="h6" fontWeight="bold" gutterBottom>{selectedTicket.subject}</Typography>
                                        <Typography variant="body1" color="textSecondary" sx={{ whiteSpace: 'pre-wrap' }}>{selectedTicket.description}</Typography>
                                    </Box>

                                    {/* Asset Info */}
                                    {selectedTicket.asset && (
                                        <Paper variant="outlined" sx={{ p: 2, borderRadius: 3, display: 'flex', alignItems: 'center', gap: 2, borderLeft: '4px solid #3b82f6', mb: 3 }}>
                                            <Avatar variant="rounded" sx={{ bgcolor: 'white', color: '#3b82f6' }}><Computer/></Avatar>
                                            <Box>
                                                <Typography variant="subtitle2" fontWeight="bold" color="#1e40af">LINKED ASSET</Typography>
                                                <Typography variant="body2">{selectedTicket.asset.brand} {selectedTicket.asset.model} (Serial: {selectedTicket.asset.serialNumber})</Typography>
                                                <Typography variant="caption" color="textSecondary">Tag: {selectedTicket.asset.assetCode}</Typography>
                                                <Typography variant="caption" display="block" color="textSecondary">Branch: {selectedTicket.branch?.branchName}</Typography>
                                            </Box>
                                        </Paper>
                                    )}

                                    {/* Evidence */}
                                    {selectedTicket.images && selectedTicket.images.length > 0 && (
                                        <Box mb={3}>
                                            <Typography variant="caption" fontWeight="bold" color="textSecondary" display="block" mb={1}>EVIDENCE</Typography>
                                            <Stack direction="row" spacing={2} sx={{ overflowX: 'auto', pb: 1 }}>
                                                {selectedTicket.images.map((img, idx) => (
                                                    <Box key={idx} position="relative" sx={{ flexShrink: 0 }}>
                                                        <Box component="img" src={img.base64Data} onClick={() => window.open(img.base64Data)} sx={{ width: 80, height: 80, borderRadius: 2, border: '2px solid #e2e8f0', objectFit: 'cover', cursor: 'zoom-in', '&:hover': { borderColor: '#3b82f6' } }} />
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
                                </Box>
                                
                                {/* RIGHT SIDE: ACTIONS & CHAT */}
                                <Box sx={{ width: { xs: '100%', md: '450px' }, display: 'flex', flexDirection: 'column', bgcolor: '#f8fafc' }}>
                                    <Box sx={{ flex: 1, p: 2, overflowY: 'auto', bgcolor: '#fff' }}>
                                        <TicketComments ticketId={selectedTicket.ticketId} status={selectedTicket.status} />
                                    </Box>

                                    <Box sx={{ p: 3, borderTop: '1px solid #e2e8f0', bgcolor: 'white' }}>
                                        {myRole === 'SUPER_ADMIN' ? (
                                            <Alert severity="info" icon={<Lock />} sx={{ width: '100%' }}>
                                                <Typography variant="caption">
                                                    <strong>Read-Only View</strong>
                                                </Typography>
                                                <Typography variant="caption" display="block">
                                                    Super Admins cannot modify ticket status. Please contact an Admin.
                                                </Typography>
                                            </Alert>
                                        ) : (
                                            <Stack spacing={2}>
                                                {selectedTicket.status === 'APPROVED_FOR_REPAIR' && (
                                                    <Button variant="contained" color="primary" fullWidth size="large" onClick={handleStartWork} startIcon={<Engineering />} sx={{ borderRadius: 2, fontWeight: 'bold' }}>
                                                        Start Repair
                                                    </Button>
                                                )}
                                                {selectedTicket.status === 'IN_PROGRESS' && (
                                                    <Button variant="contained" color="success" fullWidth size="large" onClick={() => openResolutionPrompt('RESOLVE')} sx={{ borderRadius: 2, fontWeight: 'bold' }}>
                                                        Complete & Resolve
                                                    </Button>
                                                )}
                                                {selectedTicket.status === 'RESOLVED' && (
                                                    <Button disabled fullWidth variant="outlined" startIcon={<CheckCircle />}>
                                                        Already Resolved
                                                    </Button>
                                                )}
                                            </Stack>
                                        )}
                                    </Box>
                                </Box>
                            </DialogContent>

                            {/* RESOLUTION DIALOG */}
                            <Dialog open={openActionDialog} onClose={() => setOpenActionDialog(false)} maxWidth="sm" fullWidth PaperProps={{ sx: { borderRadius: 3 } }}>
                                <DialogTitle sx={{ bgcolor: actionType === 'DISPOSE' ? '#fee2e2' : '#f0fdf4', color: actionType === 'DISPOSE' ? '#b91c1c' : '#15803d', fontWeight: '800', display: 'flex', alignItems: 'center', gap: 1.5 }}>
                                    {actionType === 'DISPOSE' ? <DeleteForever /> : <CheckCircle />}
                                    {actionType === 'DISPOSE' ? 'Confirm Asset Disposal' : 'Finalize Repair'}
                                </DialogTitle>
                                <DialogContent sx={{ mt: 2 }}>
                                    <Stack spacing={3}>
                                        {actionType === 'DISPOSE' && (
                                            <Alert severity="error" variant="outlined" sx={{ borderRadius: 2 }}><strong>Warning:</strong> This will permanently mark the asset as <strong>DISPOSED</strong>.</Alert>
                                        )}
                                        <Box>
                                            <Typography variant="caption" fontWeight="bold" color="textSecondary" sx={{ mb: 1, display: 'block', textTransform: 'uppercase' }}>Action Details</Typography>
                                            <TextField autoFocus placeholder="Describe the action taken..." fullWidth multiline rows={4} value={resolutionText} onChange={(e) => setResolutionText(e.target.value)} variant="outlined" sx={{ bgcolor: '#f8fafc' }} />
                                        </Box>
                                        {actionType === 'RESOLVE' && (
                                            <Box>
                                                <Typography variant="caption" fontWeight="bold" color="textSecondary" sx={{ mb: 1, display: 'block', textTransform: 'uppercase' }}>Financial Details</Typography>
                                                <Stack spacing={2}>
                                                    <TextField label="Final Cost" fullWidth type="number" value={repairCost} onChange={(e) => setRepairCost(e.target.value)} placeholder="0.00" InputProps={{ startAdornment: (<InputAdornment position="start"><Typography fontWeight="bold" color="primary">Rs.</Typography></InputAdornment>) }} />
                                                    
                                                    <Box display="flex" alignItems="center" gap={2} mt={2}>
                                                        <Button variant="outlined" component="label" startIcon={<CloudUpload />}>
                                                            Upload Bill
                                                            <input type="file" hidden accept="image/*" onChange={handleBillUpload} />
                                                        </Button>
                                                        {billFileName && (
                                                            <Chip label={billFileName} onDelete={() => { setBillImage(null); setBillFileName(""); }} />
                                                        )}
                                                    </Box>
                                                </Stack>
                                            </Box>
                                        )}
                                    </Stack>
                                </DialogContent>
                                <DialogActions sx={{ p: 3, borderTop: '1px solid #e2e8f0', bgcolor: '#f8fafc' }}>
                                    <Button onClick={() => setOpenActionDialog(false)} sx={{ color: '#64748b', fontWeight: 'bold' }}>Cancel</Button>
                                    <Button onClick={submitFinalResolution} variant="contained" size="large" color={actionType === 'DISPOSE' ? 'error' : 'success'} disabled={!resolutionText.trim()} sx={{ px: 4, fontWeight: '800', borderRadius: 2 }}>
                                        {actionType === 'DISPOSE' ? 'Confirm Disposal' : 'Complete Ticket'}
                                    </Button>
                                </DialogActions>
                            </Dialog>
                        </>
                    )}
                </Dialog>
            </Container>
        </Fade>
    );
}