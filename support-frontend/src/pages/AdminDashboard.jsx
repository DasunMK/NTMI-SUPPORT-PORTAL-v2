import React, { useState, useEffect } from 'react';
import { 
    Container, Paper, Typography, Box, Chip, Button, 
    TextField, MenuItem, Dialog, DialogTitle, DialogContent, 
    DialogActions, Card, CardContent, Fade, CircularProgress,
    InputAdornment, Divider, Alert, Stack, IconButton, Grid, Avatar, Tooltip, useTheme
} from '@mui/material';
import { 
    Search, PlayArrow, CheckCircle, Person,
    AssignmentLate, PendingActions, TaskAlt,
    Download as DownloadIcon, Lock, FilterList, 
    Dashboard, Business, AccessTime, Print, Close,
    Description as DescriptionIcon, Image as ImageIcon,
    Category, ReportProblem, Computer, DeleteForever, ChatBubbleOutline,
    Payments // ✅ Added for Cost Icon
} from '@mui/icons-material';
import { toast } from 'react-toastify';
import api from '../services/api'; 
import TicketComments from '../components/TicketComments'; 

// --- MODERN KPI CARD COMPONENT ---
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

    // ✅ State for Resolution/Disposal Dialog
    const [openActionDialog, setOpenActionDialog] = useState(false);
    const [actionType, setActionType] = useState(null); 
    const [resolutionText, setResolutionText] = useState('');
    const [repairCost, setRepairCost] = useState(''); // ✅ NEW: State for Cost

    const myId = parseInt(localStorage.getItem('userId'));
    const adminName = localStorage.getItem('username') || 'Administrator';

    // --- Fetch Data ---
    const fetchTickets = async () => {
        try {
            const response = await api.get('/tickets');
            const allData = response.data;

            setStats({
                unassigned: allData.filter(t => t.status === 'OPEN').length,
                myActive: allData.filter(t => t.status === 'IN_PROGRESS' && t.assignedAdmin?.userId === myId).length,
                myResolved: allData.filter(t => t.status === 'RESOLVED' && t.assignedAdmin?.userId === myId).length
            });

            const dashboardList = allData.filter(t => t.status === 'OPEN' || t.status === 'IN_PROGRESS');
            
            dashboardList.sort((a, b) => {
                const isMyTaskA = a.assignedAdmin?.userId === myId;
                const isMyTaskB = b.assignedAdmin?.userId === myId;
                if (isMyTaskA && !isMyTaskB) return -1;
                if (!isMyTaskA && isMyTaskB) return 1;
                if (a.status === 'OPEN' && b.status !== 'OPEN') return -1;
                if (a.status !== 'OPEN' && b.status === 'OPEN') return 1;
                return new Date(a.createdAt) - new Date(b.createdAt);
            });

            setTickets(dashboardList);
            setFilteredTickets(dashboardList);

        } catch (error) {
            console.error(error);
            toast.error("Failed to load tickets");
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => { fetchTickets(); }, []);

    // --- Search Logic ---
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
    const handleStartTicket = async (ticketId) => {
        try {
            await api.put(`/tickets/${ticketId}/start`);
            toast.success("Ticket Assigned & Asset Marked for Repair");
            setOpenDialog(false);
            fetchTickets();
        } catch (error) { toast.error("Failed to assign ticket"); }
    };

    const openResolutionPrompt = (type) => {
        setActionType(type);
        setResolutionText('');
        setRepairCost(''); // ✅ Reset cost when opening
        setOpenActionDialog(true);
    };

    const submitResolution = async () => {
        if (!resolutionText.trim()) {
            toast.warning("Please enter details about the action taken.");
            return;
        }

        // ✅ Updated Payload to include Cost
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
            fetchTickets();
        } catch (error) {
            toast.error("Failed to update status");
        }
    };

    const handlePrintTicket = (e, ticket) => {
        e.stopPropagation();
        // ... (Keep existing print logic)
    };

    const getCardStyles = (ticket) => {
        const isMine = ticket.assignedAdmin?.userId === myId || ticket.assignedAdmin?.id === myId;
        if (ticket.status === 'IN_PROGRESS' && isMine) return { bg: 'linear-gradient(135deg, #f0fdf4 0%, #ffffff 100%)', border: '#22c55e', iconColor: '#15803d', statusLabel: 'MY TASK', statusColor: 'success' };
        if (ticket.status === 'IN_PROGRESS' && !isMine) return { bg: 'linear-gradient(135deg, #eff6ff 0%, #ffffff 100%)', border: '#3b82f6', iconColor: '#1d4ed8', statusLabel: 'IN PROGRESS', statusColor: 'primary' };
        if (ticket.status === 'OPEN') return { bg: 'linear-gradient(135deg, #fef2f2 0%, #ffffff 100%)', border: '#ef4444', iconColor: '#b91c1c', statusLabel: 'OPEN', statusColor: 'error' };
        return { bg: '#ffffff', border: '#e2e8f0', iconColor: '#64748b', statusLabel: ticket.status, statusColor: 'default' };
    };

    if (loading) return <Box display="flex" justifyContent="center" height="80vh" alignItems="center"><CircularProgress /></Box>;

    return (
        <Fade in={true} timeout={600}>
            <Container maxWidth="xl" sx={{ mt: 4, mb: 6 }}>
                
                {/* 1. WELCOME BANNER */}
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
                    <Grid item xs={12} md={4}><KpiCard title="Open Queue" value={stats.unassigned} icon={<AssignmentLate />} color="#e11d48" subtitle="Requires Assignment" /></Grid>
                    <Grid item xs={12} md={4}><KpiCard title="My Tasks" value={stats.myActive} icon={<PendingActions />} color="#16a34a" subtitle="In Progress" /></Grid>
                    <Grid item xs={12} md={4}><KpiCard title="Completed" value={stats.myResolved} icon={<TaskAlt />} color="#8b5cf6" subtitle="Resolved by You" /></Grid>
                </Grid>

                {/* 3. FILTERS */}
                <Paper sx={{ p: 2, mb: 4, borderRadius: 3, display: 'flex', gap: 2, alignItems: 'center', bgcolor: 'white', border: '1px solid #e2e8f0', boxShadow: '0 4px 6px -1px rgba(0,0,0,0.05)' }} elevation={0}>
                    <TextField 
                        size="small" 
                        placeholder="Search ID, Branch or User..." 
                        value={searchQuery} 
                        onChange={(e) => setSearchQuery(e.target.value)} 
                        InputProps={{ startAdornment: <InputAdornment position="start"><Search color="action"/></InputAdornment>, sx: { borderRadius: 2 } }} 
                        sx={{ flexGrow: 1 }} 
                    />
                    <Box display="flex" alignItems="center" gap={1}>
                        <FilterList color="action" />
                        <TextField select size="small" value={statusFilter} onChange={(e) => setStatusFilter(e.target.value)} sx={{ minWidth: 150 }}>
                            <MenuItem value="All">All Active</MenuItem>
                            <MenuItem value="OPEN">Open Queue</MenuItem>
                            <MenuItem value="IN_PROGRESS">In Progress</MenuItem>
                        </TextField>
                    </Box>
                </Paper>

                {/* 4. TICKET GRID */}
                {filteredTickets.length === 0 ? (
                    <Box textAlign="center" py={10} bgcolor="#f8fafc" borderRadius={4} border="2px dashed #e2e8f0">
                        <CheckCircle sx={{ fontSize: 60, color: '#94a3b8', mb: 2, opacity: 0.5 }} />
                        <Typography variant="h6" color="textSecondary">No active tickets found.</Typography>
                    </Box>
                ) : (
                    <Grid container spacing={3}> 
                        {filteredTickets.map((ticket) => {
                            const styles = getCardStyles(ticket);
                            return (
                                <Grid item xs={12} sm={6} md={4} lg={3} key={ticket.ticketId} sx={{ display: 'flex' }}>
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
                                                <Box display="flex" alignItems="center" gap={1.5}><Person sx={{ fontSize: 18, color: styles.iconColor }} /><Typography variant="caption" color="text.secondary">Requester: <strong>{ticket.createdBy?.fullName?.split(' ')[0]}</strong></Typography></Box>
                                                <Box display="flex" alignItems="center" gap={1.5}><AccessTime sx={{ fontSize: 18, color: styles.iconColor }} /><Typography variant="caption" color="text.secondary">{new Date(ticket.createdAt).toLocaleDateString()}</Typography></Box>
                                            </Stack>
                                        </CardContent>
                                    </Card>
                                </Grid>
                            );
                        })}
                    </Grid>
                )}

                {/* 5. TICKET DETAIL DIALOG */}
                <Dialog open={openDialog} onClose={() => setOpenDialog(false)} maxWidth="lg" fullWidth PaperProps={{ sx: { borderRadius: 3, overflow: 'hidden', height: '90vh' } }}>
                    {selectedTicket && (
                        <>
                            <Box sx={{ p: 3, borderBottom: '1px solid #e2e8f0', bgcolor: 'white', display: 'flex', justifyContent: 'space-between', alignItems: 'center', position: 'sticky', top: 0, zIndex: 10 }}>
                                <Box display="flex" alignItems="center" gap={2}>
                                    <Avatar sx={{ bgcolor: selectedTicket.status === 'OPEN' ? '#fee2e2' : '#dcfce7', color: selectedTicket.status === 'OPEN' ? '#b91c1c' : '#15803d' }}><ReportProblem /></Avatar>
                                    <Box>
                                        <Stack direction="row" alignItems="center" spacing={2}><Typography variant="h5" fontWeight="800" color="#0f172a">Ticket #{selectedTicket.ticketId}</Typography><Chip label={selectedTicket.status} color={selectedTicket.status === 'OPEN' ? 'error' : 'success'} size="small" /></Stack>
                                        <Typography variant="body2" color="textSecondary">By {selectedTicket.createdBy?.fullName}</Typography>
                                    </Box>
                                </Box>
                                <IconButton onClick={() => setOpenDialog(false)} sx={{ bgcolor: '#f1f5f9' }}><Close /></IconButton>
                            </Box>

                            <DialogContent sx={{ p: 0, display: 'flex', flexDirection: { xs: 'column', md: 'row' }, height: '100%' }}>
                                <Box sx={{ flex: 1, p: 4, overflowY: 'auto', borderRight: '1px solid #e2e8f0' }}>
                                    <Paper variant="outlined" sx={{ p: 3, mb: 4, borderRadius: 3, bgcolor: '#f8fafc' }}>
                                        <Grid container spacing={3}>
                                            <Grid item xs={6}><Typography variant="caption" fontWeight="bold" color="textSecondary">BRANCH</Typography><Typography variant="subtitle1" fontWeight="bold">{selectedTicket.branch?.branchName}</Typography></Grid>
                                            <Grid item xs={6}><Typography variant="caption" fontWeight="bold" color="textSecondary">CATEGORY</Typography><Typography variant="subtitle1" fontWeight="bold">{selectedTicket.errorCategory?.categoryName}</Typography></Grid>
                                        </Grid>
                                    </Paper>
                                    <Box mb={4}>
                                        <Typography variant="h6" fontWeight="bold" gutterBottom>{selectedTicket.subject}</Typography>
                                        <Typography variant="body1" color="text.secondary" sx={{ whiteSpace: 'pre-wrap' }}>{selectedTicket.description}</Typography>
                                    </Box>
                                    {selectedTicket.asset && (
                                        <Paper variant="outlined" sx={{ p: 2, borderRadius: 3, display: 'flex', alignItems: 'center', gap: 2, borderLeft: '4px solid #3b82f6' }}>
                                            <Avatar variant="rounded" sx={{ bgcolor: '#eff6ff', color: '#3b82f6' }}><Computer/></Avatar>
                                            <Box><Typography variant="subtitle2" fontWeight="bold">{selectedTicket.asset.brand} {selectedTicket.asset.model}</Typography><Typography variant="caption">Tag: {selectedTicket.asset.assetCode}</Typography></Box>
                                        </Paper>
                                    )}
                                </Box>
                                <Box sx={{ width: { xs: '100%', md: '450px' }, display: 'flex', flexDirection: 'column', bgcolor: '#f8fafc' }}>
                                    <Box sx={{ flex: 1, p: 2, overflowY: 'auto' }}><TicketComments ticketId={selectedTicket.ticketId} /></Box>
                                    <Box sx={{ p: 3, borderTop: '1px solid #e2e8f0', bgcolor: 'white' }}>
                                        {selectedTicket.status === 'OPEN' ? (
                                            <Button variant="contained" fullWidth size="large" onClick={() => handleStartTicket(selectedTicket.ticketId)} sx={{ borderRadius: 2, fontWeight: 'bold', background: 'linear-gradient(to right, #2563eb, #1d4ed8)' }}>Accept Ticket</Button>
                                        ) : selectedTicket.status === 'IN_PROGRESS' ? (
                                            <Stack spacing={2}>
                                                <Button variant="contained" color="success" fullWidth size="large" onClick={() => openResolutionPrompt('RESOLVE')} sx={{ borderRadius: 2, fontWeight: 'bold' }}>Resolve Issue</Button>
                                                <Button variant="outlined" color="error" fullWidth onClick={() => openResolutionPrompt('DISPOSE')} sx={{ borderRadius: 2, fontWeight: 'bold' }}>Dispose Asset</Button>
                                            </Stack>
                                        ) : <Button disabled fullWidth variant="outlined">Ticket Closed</Button>}
                                    </Box>
                                </Box>
                            </DialogContent>
                        </>
                    )}
                </Dialog>

                {/* ✅ 6. UPDATED RESOLUTION / DISPOSAL DIALOG WITH COST FIELD */}
                <Dialog 
                    open={openActionDialog} 
                    onClose={() => setOpenActionDialog(false)} 
                    maxWidth="sm" 
                    fullWidth
                    PaperProps={{ sx: { borderRadius: 3 } }}
                >
                    <DialogTitle sx={{ 
                        bgcolor: actionType === 'DISPOSE' ? '#fee2e2' : '#f0fdf4', 
                        color: actionType === 'DISPOSE' ? '#b91c1c' : '#15803d', 
                        fontWeight: '800',
                        display: 'flex',
                        alignItems: 'center',
                        gap: 1.5
                    }}>
                        {actionType === 'DISPOSE' ? <DeleteForever /> : <CheckCircle />}
                        {actionType === 'DISPOSE' ? 'Confirm Asset Disposal' : 'Complete Ticket Resolution'}
                    </DialogTitle>
                    
                    <DialogContent sx={{ mt: 2 }}>
                        <Stack spacing={3}>
                            {actionType === 'DISPOSE' && (
                                <Alert severity="error" variant="outlined" sx={{ borderRadius: 2 }}>
                                    <strong>Warning:</strong> This will permanently mark the asset as <strong>DISPOSED</strong>.
                                </Alert>
                            )}

                            <Box>
                                <Typography variant="caption" fontWeight="bold" color="textSecondary" sx={{ mb: 1, display: 'block', textTransform: 'uppercase' }}>
                                    Action Details
                                </Typography>
                                <TextField
                                    autoFocus
                                    placeholder={actionType === 'DISPOSE' ? "Explain why this asset cannot be repaired..." : "Explain exactly what was fixed..."}
                                    fullWidth
                                    multiline
                                    rows={4}
                                    value={resolutionText}
                                    onChange={(e) => setResolutionText(e.target.value)}
                                    variant="outlined"
                                    sx={{ bgcolor: '#f8fafc' }}
                                />
                            </Box>

                            {/* ✅ NEW: Repair Cost Field (Only shows during Resolve) */}
                            {actionType === 'RESOLVE' && (
                                <Box>
                                    <Typography variant="caption" fontWeight="bold" color="textSecondary" sx={{ mb: 1, display: 'block', textTransform: 'uppercase' }}>
                                        Financial Details
                                    </Typography>
                                    <TextField
                                        label="Total Repair Cost"
                                        fullWidth
                                        type="number"
                                        value={repairCost}
                                        onChange={(e) => setRepairCost(e.target.value)}
                                        placeholder="0.00"
                                        InputProps={{
                                            startAdornment: (
                                                <InputAdornment position="start">
                                                    <Typography fontWeight="bold" color="primary">Rs.</Typography>
                                                </InputAdornment>
                                            ),
                                            sx: { borderRadius: 2, bgcolor: '#f8fafc', fontWeight: 'bold' }
                                        }}
                                        helperText="Include parts, labor, and external service fees."
                                    />
                                </Box>
                            )}
                        </Stack>
                    </DialogContent>
                    
                    <DialogActions sx={{ p: 3, borderTop: '1px solid #e2e8f0', bgcolor: '#f8fafc' }}>
                        <Button onClick={() => setOpenActionDialog(false)} sx={{ color: '#64748b', fontWeight: 'bold' }}>Cancel</Button>
                        <Button 
                            onClick={submitResolution} 
                            variant="contained" 
                            size="large"
                            color={actionType === 'DISPOSE' ? 'error' : 'success'}
                            disabled={!resolutionText.trim()}
                            sx={{ px: 4, fontWeight: '800', borderRadius: 2 }}
                        >
                            {actionType === 'DISPOSE' ? 'Confirm Disposal' : 'Submit & Close Ticket'}
                        </Button>
                    </DialogActions>
                </Dialog>

            </Container>
        </Fade>
    );
};

export default AdminDashboard;