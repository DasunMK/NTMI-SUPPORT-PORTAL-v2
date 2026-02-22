import React, { useState, useEffect } from 'react';
import { 
    Container, Paper, Typography, Box, Chip, Button, 
    TextField, MenuItem, Dialog, DialogTitle, DialogContent, 
    DialogActions, Card, CardContent, Fade, CircularProgress,
    InputAdornment, Divider, Alert, Stack, IconButton, Grid, Avatar, Tooltip,
    Radio, RadioGroup, FormControlLabel, FormControl, FormLabel
} from '@mui/material';
import { 
    Search, AssignmentLate, PendingActions, TaskAlt,
    FilterList, Dashboard, AccessTime, Close,
    ReportProblem, Computer, DeleteForever, CheckCircle, Business, Person,
    Lock, Build, Engineering, Timeline, CloudUpload,
    Download as DownloadIcon, WarningAmber
} from '@mui/icons-material';
import { toast } from 'react-toastify';
import api from '../services/api'; 
import TicketComments from '../components/TicketComments'; 

// --- KPI CARD ---
const KpiCard = ({ title, value, icon, color, subtitle }) => (
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
                <Typography variant="h3" fontWeight="800" sx={{ color: color, letterSpacing: -1 }}>{value}</Typography>
                <Typography variant="subtitle2" fontWeight="bold" color="textSecondary" mt={0.5} sx={{ textTransform: 'uppercase', letterSpacing: 0.5 }}>{title}</Typography>
            </Box>
            <Avatar sx={{ bgcolor: `${color}15`, color: color, width: 56, height: 56, borderRadius: 3 }}>{icon}</Avatar>
        </Box>
        <Chip label={subtitle} size="small" sx={{ bgcolor: `${color}10`, color: color, fontWeight: 'bold', borderRadius: 1.5 }} />
    </Paper>
);

const AdminDashboard = () => {
    // --- State ---
    const [tickets, setTickets] = useState([]);
    const [filteredTickets, setFilteredTickets] = useState([]);
    const [stats, setStats] = useState({ unassigned: 0, myActive: 0, myResolved: 0 });
    const [loading, setLoading] = useState(true);

    const [searchQuery, setSearchQuery] = useState('');
    const [statusFilter, setStatusFilter] = useState('All');

    const [selectedTicket, setSelectedTicket] = useState(null);
    const [openDialog, setOpenDialog] = useState(false);

    // --- Action Dialog State ---
    const [openActionDialog, setOpenActionDialog] = useState(false);
    const [actionType, setActionType] = useState(null); 
    const [resolutionText, setResolutionText] = useState('');
    const [repairCost, setRepairCost] = useState(''); 
    const [varianceReason, setVarianceReason] = useState(''); 
    
    // Estimate Logic State
    const [repairSource, setRepairSource] = useState('EXTERNAL'); 
    const [repairDescription, setRepairDescription] = useState('');
    
    // Bill Upload State
    const [billImage, setBillImage] = useState(null);
    const [billFileName, setBillFileName] = useState("");

    const myId = parseInt(localStorage.getItem('userId'));
    const adminName = localStorage.getItem('username') || 'Administrator';

    // --- Fetch Data ---
    const fetchTickets = async (isBackground = false) => {
        try {
            if (!isBackground) setLoading(true);

            const response = await api.get('/tickets');
            const allData = response.data;

            setStats({
                unassigned: allData.filter(t => t.status === 'OPEN').length,
                myActive: allData.filter(t => (t.status === 'IN_PROGRESS' || t.status === 'APPROVED_FOR_REPAIR') && t.assignedAdmin?.userId === myId).length,
                myResolved: allData.filter(t => t.status === 'RESOLVED' && t.assignedAdmin?.userId === myId).length
            });

            const dashboardList = allData.filter(t => 
                ['OPEN', 'PENDING_SUPER_ADMIN', 'PENDING_FINANCE', 'APPROVED_FOR_REPAIR', 'IN_PROGRESS'].includes(t.status)
            );
            
            dashboardList.sort((a, b) => {
                const isMyTaskA = a.assignedAdmin?.userId === myId;
                const isMyTaskB = b.assignedAdmin?.userId === myId;
                if (isMyTaskA && !isMyTaskB) return -1;
                if (!isMyTaskA && isMyTaskB) return 1;
                return new Date(b.createdAt) - new Date(a.createdAt);
            });

            setTickets(dashboardList);
            if (!searchQuery) {
                setFilteredTickets(dashboardList);
            }

        } catch (error) {
            console.error(error);
            if (!isBackground) toast.error("Failed to load tickets");
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchTickets(); 
        const intervalId = setInterval(() => { fetchTickets(true); }, 5000); 
        return () => clearInterval(intervalId); 
    }, []);

    useEffect(() => {
        let result = tickets;
        if (searchQuery) {
            const lowerQ = searchQuery.toLowerCase();
            result = result.filter(t => 
                String(t.ticketId).includes(lowerQ) ||
                (t.branch?.branchName && t.branch.branchName.toLowerCase().includes(lowerQ)) ||
                (t.createdBy?.fullName && t.createdBy.fullName.toLowerCase().includes(lowerQ)) ||
                (t.asset && (t.asset.assetCode.toLowerCase().includes(lowerQ) || t.asset.model.toLowerCase().includes(lowerQ)))
            );
        }
        if (statusFilter !== 'All') {
            result = result.filter(t => t.status === statusFilter);
        }
        setFilteredTickets(result);
    }, [searchQuery, statusFilter, tickets]);

    // --- Actions ---

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

    const handleSourceChange = (e) => {
        setRepairSource(e.target.value);
        setRepairCost(''); 
    };

    const handleSubmitEstimate = async () => {
        if (!repairDescription.trim()) {
            toast.warning("Please provide a technical description.");
            return;
        }

        // ✅ FIX: Validate Cost
        const costValue = parseFloat(repairCost) || 0;
        if (costValue < 0) {
            toast.error("Estimated cost cannot be negative.");
            return;
        }

        if (repairSource === 'EXTERNAL' && repairCost === '') {
            toast.warning("External repairs usually require a cost estimate.");
            return;
        }

        try {
            await api.put(`/tickets/${selectedTicket.ticketId}/estimate`, { 
                estimatedCost: costValue,
                repairSource: repairSource,
                repairDescription: repairDescription
            });
            toast.success("Estimate Sent for Approval");
            setOpenDialog(false);
            setRepairCost('');
            setRepairDescription('');
            fetchTickets();
        } catch (error) { toast.error("Failed to submit estimate"); }
    };

    const handleStartWork = async () => {
        try {
            await api.put(`/tickets/${selectedTicket.ticketId}/start-work`);
            toast.success("Repair Work Started");
            setOpenDialog(false);
            fetchTickets();
        } catch (error) { toast.error("Failed to start work"); }
    };

    const openResolutionPrompt = (type) => {
        setActionType(type);
        setResolutionText('');
        setRepairCost(''); 
        setVarianceReason(''); 
        setBillImage(null);
        setBillFileName("");
        setOpenActionDialog(true);
    };

    const submitFinalResolution = async () => {
        if (!resolutionText.trim()) {
            toast.warning("Please enter details about the action taken.");
            return;
        }

        // ✅ FIX: Validate Final Cost
        const costValue = actionType === 'RESOLVE' ? (parseFloat(repairCost) || 0) : 0;
        if (actionType === 'RESOLVE' && costValue < 0) {
            toast.error("Final cost cannot be negative.");
            return;
        }

        const estCost = selectedTicket.estimatedCost || 0;

        // Logic: Check for Cost Overrun
        if (actionType === 'RESOLVE' && costValue > estCost) {
            if (!varianceReason.trim()) {
                toast.warning(`Final cost exceeds estimate by Rs. ${costValue - estCost}. Please provide a reason.`);
                return;
            }
        }
        
        const payload = { 
            resolution: resolutionText, 
            finalCost: costValue, 
            disposeAsset: actionType === 'DISPOSE' ? 'true' : 'false',
            billImage: billImage,
            varianceReason: varianceReason 
        };

        try {
            await api.put(`/tickets/${selectedTicket.ticketId}/resolve-final`, payload);
            if (actionType === 'DISPOSE') toast.success("Asset Disposed & Ticket Closed");
            else toast.success("Repair Completed & Ticket Resolved");
            setOpenActionDialog(false);
            setOpenDialog(false);
            fetchTickets();
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

    const getCardStyles = (ticket) => {
        const isMine = ticket.assignedAdmin?.userId === myId;
        if (ticket.status === 'OPEN') return { bg: 'linear-gradient(135deg, #fff1f2 0%, #ffffff 100%)', border: '#fda4af', iconColor: '#e11d48', statusLabel: 'OPEN', statusColor: 'error' };
        if (ticket.status.includes('PENDING')) return { bg: 'linear-gradient(135deg, #fff7ed 0%, #ffffff 100%)', border: '#fdba74', iconColor: '#ea580c', statusLabel: 'WAITING APPROVAL', statusColor: 'warning' };
        if (ticket.status === 'APPROVED_FOR_REPAIR') return { bg: 'linear-gradient(135deg, #f3e8ff 0%, #ffffff 100%)', border: '#d8b4fe', iconColor: '#9333ea', statusLabel: 'READY TO START', statusColor: 'secondary' };
        if (ticket.status === 'IN_PROGRESS' && isMine) return { bg: 'linear-gradient(135deg, #f0fdf4 0%, #ffffff 100%)', border: '#4ade80', iconColor: '#16a34a', statusLabel: 'IN PROGRESS (YOU)', statusColor: 'success' };
        return { bg: '#ffffff', border: '#e2e8f0', iconColor: '#64748b', statusLabel: ticket.status.replace('_', ' '), statusColor: 'default' };
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

    const isOverrun = selectedTicket && actionType === 'RESOLVE' 
        ? (parseFloat(repairCost) || 0) > (selectedTicket.estimatedCost || 0) 
        : false;

    if (loading) return <Box display="flex" justifyContent="center" height="80vh" alignItems="center"><CircularProgress /></Box>;

    return (
        <Fade in={true} timeout={600}>
            <Container maxWidth="xl" sx={{ mt: 4, mb: 6 }}>
                
                {/* 1. HEADER */}
                <Paper elevation={0} sx={{ p: 4, mb: 5, borderRadius: 4, background: 'linear-gradient(135deg, #0f172a 0%, #1e293b 100%)', color: 'white', position: 'relative', overflow: 'hidden', boxShadow: '0 20px 40px -10px rgba(15, 23, 42, 0.3)' }}>
                    <Box sx={{ position: 'absolute', top: -100, right: -50, width: 300, height: 300, borderRadius: '50%', background: 'radial-gradient(circle, rgba(255,255,255,0.1) 0%, rgba(255,255,255,0) 70%)' }} />
                    <Box display="flex" alignItems="center" gap={3} position="relative" zIndex={1}>
                        <Avatar sx={{ width: 72, height: 72, bgcolor: 'rgba(255,255,255,0.15)', fontSize: 32, backdropFilter: 'blur(10px)' }}>{adminName.charAt(0)}</Avatar>
                        <Box>
                            <Typography variant="h4" fontWeight="800" gutterBottom sx={{ letterSpacing: -0.5 }}>Welcome back, {adminName}</Typography>
                            <Box display="flex" alignItems="center" gap={1}>
                                <Dashboard sx={{ fontSize: 18, opacity: 0.7 }} />
                                <Typography variant="body1" sx={{ opacity: 0.7, fontWeight: 500 }}>Admin Console • System Overview</Typography>
                            </Box>
                        </Box>
                    </Box>
                </Paper>

                {/* 2. KPI STATS */}
                <Grid container spacing={3} mb={5}>
                    <Grid size={{ xs: 12, md: 4 }}><KpiCard title="New Requests" value={stats.unassigned} icon={<AssignmentLate />} color="#e11d48" subtitle="Require Estimate" /></Grid>
                    <Grid size={{ xs: 12, md: 4 }}><KpiCard title="My Active Jobs" value={stats.myActive} icon={<Build />} color="#16a34a" subtitle="Working or Ready" /></Grid>
                    <Grid size={{ xs: 12, md: 4 }}><KpiCard title="Jobs Done" value={stats.myResolved} icon={<TaskAlt />} color="#8b5cf6" subtitle="Resolved by You" /></Grid>
                </Grid>

                {/* 3. FILTERS */}
                <Paper sx={{ p: 2, mb: 4, borderRadius: 3, display: 'flex', gap: 2, alignItems: 'center', bgcolor: 'white', border: '1px solid #e2e8f0', boxShadow: '0 4px 6px -1px rgba(0,0,0,0.05)' }} elevation={0}>
                    <TextField size="small" placeholder="Search ID, Branch or User..." value={searchQuery} onChange={(e) => setSearchQuery(e.target.value)} InputProps={{ startAdornment: <InputAdornment position="start"><Search color="action"/></InputAdornment>, sx: { borderRadius: 2 } }} sx={{ flexGrow: 1 }} />
                    <Box display="flex" alignItems="center" gap={1}>
                        <FilterList color="action" />
                        <TextField select size="small" value={statusFilter} onChange={(e) => setStatusFilter(e.target.value)} sx={{ minWidth: 150 }}>
                            <MenuItem value="All">All Active</MenuItem>
                            <MenuItem value="OPEN">Open (New)</MenuItem>
                            <MenuItem value="APPROVED_FOR_REPAIR">Ready for Repair</MenuItem>
                            <MenuItem value="IN_PROGRESS">In Progress</MenuItem>
                        </TextField>
                    </Box>
                </Paper>

                {/* 4. TICKET GRID */}
                <Grid container spacing={3}> 
                    {filteredTickets.map((ticket) => {
                        const styles = getCardStyles(ticket);
                        return (
                            <Grid size={{ xs: 12, sm: 6, md: 4, lg: 3 }} key={ticket.ticketId} sx={{ display: 'flex' }}>
                                <Card elevation={0} onClick={() => { setSelectedTicket(ticket); setOpenDialog(true); }} sx={{ width: '100%', borderRadius: 4, display: 'flex', flexDirection: 'column', background: styles.bg, border: `2px solid ${styles.border}`, cursor: 'pointer', transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)', '&:hover': { transform: 'translateY(-6px)', boxShadow: '0 12px 24px -10px rgba(0, 0, 0, 0.15)' } }}>
                                    <CardContent sx={{ flexGrow: 1, p: 3, display: 'flex', flexDirection: 'column', justifyContent: 'space-between' }}>
                                        <Box display="flex" justifyContent="space-between" alignItems="start" mb={2}>
                                            <Chip label={`#${ticket.ticketId}`} size="small" sx={{ fontWeight: '800', bgcolor: 'white', border: '1px solid #e2e8f0', borderRadius: 1.5 }} />
                                            <Chip label={styles.statusLabel} size="small" color={styles.statusColor} sx={{ fontWeight: 'bold', borderRadius: 1.5 }} />
                                        </Box>
                                        <Box mb={2}>
                                            <Typography variant="h6" fontWeight="800" sx={{ lineHeight: 1.3, mb: 1, color: '#0f172a' }}>{ticket.errorCategory?.categoryName}</Typography>
                                            {ticket.asset && ( <Chip icon={<Computer style={{ fontSize: 14 }} />} label={`${ticket.asset.brand} ${ticket.asset.model}`} size="small" sx={{ mb: 1, bgcolor: '#f1f5f9', color: '#475569', fontWeight: '600', border: '1px solid #cbd5e1', height: 24, fontSize: '0.75rem' }} /> )}
                                            <Typography variant="body2" fontWeight="500" color="text.secondary">{ticket.errorType?.typeName}</Typography>
                                        </Box>
                                        <Divider sx={{ borderStyle: 'dashed', mb: 2, opacity: 0.6 }} />
                                        <Stack spacing={1.5}>
                                            <Box display="flex" alignItems="center" gap={1.5}><Business sx={{ fontSize: 18, color: styles.iconColor }} /><Typography variant="body2" fontWeight="600" color="#334155">{ticket.branch?.branchName}</Typography></Box>
                                            <Box display="flex" alignItems="center" gap={1.5}><Person sx={{ fontSize: 18, color: styles.iconColor }} /><Typography variant="caption" color="textSecondary">Requester: <strong>{ticket.createdBy?.fullName?.split(' ')[0]}</strong></Typography></Box>
                                            <Box display="flex" alignItems="center" gap={1.5}><AccessTime sx={{ fontSize: 18, color: styles.iconColor }} /><Typography variant="caption" color="textSecondary">{new Date(ticket.createdAt).toLocaleDateString()}</Typography></Box>
                                        </Stack>
                                    </CardContent>
                                </Card>
                            </Grid>
                        );
                    })}
                </Grid>

                {/* 5. TICKET DETAIL DIALOG */}
                <Dialog open={openDialog} onClose={() => setOpenDialog(false)} maxWidth="lg" fullWidth PaperProps={{ sx: { borderRadius: 3, overflow: 'hidden', height: '90vh' } }}>
                    {selectedTicket && (
                        <>
                            <Box sx={{ p: 3, borderBottom: '1px solid #e2e8f0', bgcolor: 'white', display: 'flex', justifyContent: 'space-between', alignItems: 'center', position: 'sticky', top: 0, zIndex: 10 }}>
                                <Box display="flex" alignItems="center" gap={2}>
                                    <Avatar sx={{ bgcolor: '#eff6ff', color: '#3b82f6' }}><ReportProblem /></Avatar>
                                    <Box>
                                        <Stack direction="row" alignItems="center" spacing={2}><Typography variant="h5" fontWeight="800" color="#0f172a">Ticket #{selectedTicket.ticketId}</Typography><Chip label={selectedTicket.status} size="small" /></Stack>
                                        <Typography variant="body2" color="textSecondary">By {selectedTicket.createdBy?.fullName}</Typography>
                                    </Box>
                                </Box>
                                <IconButton onClick={() => setOpenDialog(false)} sx={{ bgcolor: '#f1f5f9' }}><Close /></IconButton>
                            </Box>

                            <DialogContent sx={{ p: 0, display: 'flex', flexDirection: { xs: 'column', md: 'row' }, height: '100%' }}>
                                <Box sx={{ flex: 1, p: 4, overflowY: 'auto', borderRight: '1px solid #e2e8f0' }}>
                                    
                                    <Paper sx={{ p: 2.5, mb: 3, bgcolor: '#f0f9ff', border: '1px solid #bae6fd', borderRadius: 3 }}>
                                        <Stack direction="row" alignItems="center" gap={1} mb={2}>
                                            <Timeline color="primary" fontSize="small" />
                                            <Typography variant="subtitle2" fontWeight="800" color="primary.main">PROJECT STATUS & FINANCIALS</Typography>
                                        </Stack>
                                        <Grid container spacing={2}>
                                            <Grid size={{ xs: 6 }}>
                                                <Typography variant="caption" color="textSecondary" fontWeight="bold">APPROVAL STATUS</Typography>
                                                <Typography variant="body2" fontWeight="bold" sx={{ color: getApprovalDetails(selectedTicket.status).color }}>{getApprovalDetails(selectedTicket.status).text}</Typography>
                                            </Grid>
                                            <Grid size={{ xs: 6 }}>
                                                <Typography variant="caption" color="textSecondary" fontWeight="bold">ESTIMATED COST</Typography>
                                                <Typography variant="body2" fontWeight="bold" color="#0f172a">
                                                    {selectedTicket.status === 'OPEN' 
                                                        ? 'Pending Estimate' 
                                                        : `Rs. ${(selectedTicket.estimatedCost || 0).toLocaleString()}`}
                                                </Typography>
                                            </Grid>
                                            {/* ✅ NEW: SHOW REPAIR PLAN */}
                                            {selectedTicket.repairDescription && (
                                                <Grid size={{ xs: 12 }}>
                                                    <Typography variant="caption" color="textSecondary" fontWeight="bold">REPAIR PLAN ({selectedTicket.repairSource || 'EXTERNAL'})</Typography>
                                                    <Typography variant="body2" sx={{ fontStyle: 'italic', color: '#475569' }}>"{selectedTicket.repairDescription}"</Typography>
                                                </Grid>
                                            )}
                                            <Grid size={{ xs: 6 }}><Typography variant="caption" color="textSecondary" fontWeight="bold">CREATED ON</Typography><Typography variant="body2">{new Date(selectedTicket.createdAt).toLocaleDateString()}</Typography></Grid>
                                            <Grid size={{ xs: 6 }}><Typography variant="caption" color="textSecondary" fontWeight="bold">ASSIGNED TO</Typography><Typography variant="body2">{selectedTicket.assignedAdmin?.fullName || 'Unassigned'}</Typography></Grid>
                                        </Grid>
                                    </Paper>

                                    <Box mb={4}>
                                        <Typography variant="h6" fontWeight="bold" gutterBottom>{selectedTicket.subject}</Typography>
                                        <Typography variant="body1" color="text.secondary" sx={{ whiteSpace: 'pre-wrap' }}>{selectedTicket.description}</Typography>
                                    </Box>

                                    {selectedTicket.asset && (
                                        <Paper variant="outlined" sx={{ p: 2, borderRadius: 3, display: 'flex', alignItems: 'center', gap: 2, borderLeft: '4px solid #3b82f6', mb: 3 }}>
                                            <Avatar variant="rounded" sx={{ bgcolor: '#eff6ff', color: '#3b82f6' }}><Computer/></Avatar>
                                            <Box><Typography variant="subtitle2" fontWeight="bold">{selectedTicket.asset.brand} {selectedTicket.asset.model}</Typography><Typography variant="caption" display="block">Tag: {selectedTicket.asset.assetCode}</Typography><Typography variant="caption" color="textSecondary">{selectedTicket.branch?.branchName}</Typography></Box>
                                        </Paper>
                                    )}

                                    {selectedTicket.images && selectedTicket.images.length > 0 && (
                                        <Box mb={4}>
                                            <Typography variant="caption" fontWeight="bold" color="textSecondary" display="block" mb={1}>EVIDENCE</Typography>
                                            <Stack direction="row" spacing={2} sx={{ overflowX: 'auto', pb: 1 }}>
                                                {selectedTicket.images.map((img, idx) => (
                                                    <Box key={idx} position="relative" sx={{ flexShrink: 0 }}>
                                                        <Box component="img" src={img.base64Data} onClick={() => window.open(img.base64Data)} sx={{ width: 80, height: 80, borderRadius: 2, border: '2px solid #e2e8f0', objectFit: 'cover', cursor: 'zoom-in', '&:hover': { borderColor: '#3b82f6' } }} />
                                                        <Tooltip title="Download"><IconButton size="small" onClick={(e) => { e.stopPropagation(); downloadImage(img.base64Data, idx); }} sx={{ position: 'absolute', bottom: -8, right: -8, bgcolor: 'white', border: '1px solid #ddd', boxShadow: 2 }}><DownloadIcon fontSize="small" color="primary" /></IconButton></Tooltip>
                                                    </Box>
                                                ))}
                                            </Stack>
                                        </Box>
                                    )}
                                </Box>
                                
                                <Box sx={{ width: { xs: '100%', md: '450px' }, display: 'flex', flexDirection: 'column', bgcolor: '#f8fafc' }}>
                                    <Box sx={{ flex: 1, p: 2, overflowY: 'auto' }}>
                                        <TicketComments ticketId={selectedTicket.ticketId} status={selectedTicket.status} />
                                    </Box>

                                    <Box sx={{ p: 3, borderTop: '1px solid #e2e8f0', bgcolor: 'white' }}>
                                        
                                        {selectedTicket.status === 'OPEN' && (
                                            <Stack spacing={3}>
                                                <Paper variant="outlined" sx={{ p: 2, bgcolor: '#f8fafc' }}>
                                                    <FormControl component="fieldset">
                                                        <FormLabel component="legend" sx={{ fontWeight: 'bold', fontSize: '0.85rem', mb: 1 }}>REPAIR SOURCE</FormLabel>
                                                        <RadioGroup row value={repairSource} onChange={handleSourceChange}>
                                                            <FormControlLabel value="EXTERNAL" control={<Radio size="small" />} label={<Typography variant="body2">External Vendor</Typography>} />
                                                            <FormControlLabel value="INTERNAL" control={<Radio size="small" />} label={<Typography variant="body2">Internal Stock</Typography>} />
                                                        </RadioGroup>
                                                    </FormControl>
                                                </Paper>

                                                <TextField label="Technical Repair Description" placeholder="E.g. Replacing Fuser Unit, Refilling Black Toner..." multiline rows={2} fullWidth size="small" value={repairDescription} onChange={(e) => setRepairDescription(e.target.value)} />

                                                <TextField 
                                                    label="Estimated Cost (Labor / Transport / Parts)" 
                                                    type="number" 
                                                    size="small" 
                                                    fullWidth 
                                                    value={repairCost} 
                                                    onChange={(e) => setRepairCost(e.target.value)} 
                                                    placeholder="0.00" 
                                                    helperText={repairSource === 'INTERNAL' ? "Enter 0 if using only stock. Enter value if labor/transport costs apply." : "Enter total estimated vendor charges."} 
                                                    InputProps={{ startAdornment: <InputAdornment position="start">Rs.</InputAdornment> }} 
                                                />

                                                <Button variant="contained" fullWidth size="large" onClick={handleSubmitEstimate} sx={{ borderRadius: 2, fontWeight: 'bold' }}>Submit Plan & Request Approval</Button>
                                            </Stack>
                                        )}

                                        {(selectedTicket.status.includes('PENDING')) && (
                                            <Alert severity="warning" variant="outlined" icon={<PendingActions />} sx={{ borderRadius: 2 }}><strong>Approval Pending</strong><br/>Waiting for authorization.</Alert>
                                        )}

                                        {selectedTicket.status === 'APPROVED_FOR_REPAIR' && (
                                            <Stack spacing={2}>
                                                <Alert severity="success" variant="filled" sx={{ borderRadius: 2 }}>Estimate Approved. Ready for repair.</Alert>
                                                <Button variant="contained" color="secondary" fullWidth size="large" onClick={handleStartWork} startIcon={<Engineering />} sx={{ borderRadius: 2, fontWeight: 'bold' }}>Start Repair Work</Button>
                                            </Stack>
                                        )}

                                        {selectedTicket.status === 'IN_PROGRESS' && (
                                            selectedTicket.assignedAdmin?.userId === myId ? (
                                                <Stack spacing={2}>
                                                    <Button variant="contained" color="success" fullWidth size="large" onClick={() => openResolutionPrompt('RESOLVE')} sx={{ borderRadius: 2, fontWeight: 'bold' }}>Complete & Resolve</Button>
                                                    <Button variant="outlined" color="error" fullWidth onClick={() => openResolutionPrompt('DISPOSE')} sx={{ borderRadius: 2, fontWeight: 'bold' }}>Asset Unrepairable (Dispose)</Button>
                                                </Stack>
                                            ) : (
                                                <Alert severity="info" variant="outlined" icon={<Lock />} sx={{ borderRadius: 2 }}>Ticket locked by <strong>{selectedTicket.assignedAdmin?.fullName}</strong>.</Alert>
                                            )
                                        )}

                                        {(selectedTicket.status === 'RESOLVED' || selectedTicket.status === 'CLOSED') && (
                                            <Button disabled fullWidth variant="outlined">Ticket Closed</Button>
                                        )}
                                    </Box>
                                </Box>
                            </DialogContent>
                        </>
                    )}
                </Dialog>

                {/* 6. ACTION DIALOG (RESOLVE / DISPOSE) */}
                <Dialog open={openActionDialog} onClose={() => setOpenActionDialog(false)} maxWidth="sm" fullWidth PaperProps={{ sx: { borderRadius: 3 } }}>
                    <DialogTitle sx={{ bgcolor: actionType === 'DISPOSE' ? '#fee2e2' : '#f0fdf4', color: actionType === 'DISPOSE' ? '#b91c1c' : '#15803d', fontWeight: '800', display: 'flex', alignItems: 'center', gap: 1.5 }}>
                        {actionType === 'DISPOSE' ? <DeleteForever /> : <CheckCircle />}
                        {actionType === 'DISPOSE' ? 'Confirm Asset Disposal' : 'Finalize Repair'}
                    </DialogTitle>
                    <DialogContent sx={{ mt: 2 }}>
                        <Stack spacing={3}>
                            {actionType === 'DISPOSE' && (<Alert severity="error" variant="outlined" sx={{ borderRadius: 2 }}><strong>Warning:</strong> This will permanently mark the asset as <strong>DISPOSED</strong>.</Alert>)}
                            
                            <Box>
                                <Typography variant="caption" fontWeight="bold" color="textSecondary" sx={{ mb: 1, display: 'block', textTransform: 'uppercase' }}>Resolution Details</Typography>
                                <TextField autoFocus placeholder={actionType === 'DISPOSE' ? "Reason for disposal..." : "Describe the repair work done..."} fullWidth multiline rows={4} value={resolutionText} onChange={(e) => setResolutionText(e.target.value)} variant="outlined" sx={{ bgcolor: '#f8fafc' }} />
                            </Box>
                            
                            {actionType === 'RESOLVE' && (
                                <Box>
                                    <Typography variant="caption" fontWeight="bold" color="textSecondary" sx={{ mb: 1, display: 'block', textTransform: 'uppercase' }}>Final Cost & Billing</Typography>
                                    <Stack spacing={2}>
                                        <TextField 
                                            label="Final Cost" 
                                            fullWidth 
                                            type="number" 
                                            value={repairCost} 
                                            onChange={(e) => setRepairCost(e.target.value)} 
                                            placeholder="0.00" 
                                            InputProps={{ 
                                                startAdornment: (<InputAdornment position="start"><Typography fontWeight="bold" color="primary">Rs.</Typography></InputAdornment>), 
                                                sx: { borderRadius: 2, bgcolor: '#f8fafc', fontWeight: 'bold' } 
                                            }} 
                                            helperText="Enter the actual final cost." 
                                        />
                                        
                                        {/* COST VARIANCE ALERT */}
                                        {isOverrun && (
                                            <Fade in={true}>
                                                <Alert severity="warning" icon={<WarningAmber />} sx={{ borderRadius: 2, border: '1px solid #fdba74' }}>
                                                    <strong>Cost Overrun:</strong> Final cost exceeds the approved estimate. Please provide a justification.
                                                </Alert>
                                            </Fade>
                                        )}

                                        {/* VARIANCE REASON INPUT */}
                                        {isOverrun && (
                                            <TextField 
                                                label="Reason for Cost Overrun" 
                                                placeholder="E.g. Price increase, additional parts required..." 
                                                fullWidth 
                                                multiline 
                                                rows={2}
                                                required 
                                                error={!varianceReason.trim()}
                                                value={varianceReason} 
                                                onChange={(e) => setVarianceReason(e.target.value)} 
                                            />
                                        )}

                                        {/* Bill Upload Section */}
                                        <Box display="flex" alignItems="center" gap={2}>
                                            <Button variant="outlined" component="label" startIcon={<CloudUpload />}>
                                                Upload Bill / Invoice
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

            </Container>
        </Fade>
    );
};

export default AdminDashboard;