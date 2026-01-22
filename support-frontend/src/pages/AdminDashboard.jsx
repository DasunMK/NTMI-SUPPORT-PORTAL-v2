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
    Category, ReportProblem
} from '@mui/icons-material';
import { toast } from 'react-toastify';
import api from '../services/api'; // Ensure this path is correct
import TicketComments from '../components/TicketComments'; // Ensure this path is correct

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

    const theme = useTheme();
    const myId = parseInt(localStorage.getItem('userId'));
    const adminName = localStorage.getItem('username') || 'Administrator';

    // --- Fetch Data ---
    const fetchTickets = async () => {
        try {
            const response = await api.get('/tickets');
            const allData = response.data;

            // Stats Calculation
            setStats({
                unassigned: allData.filter(t => t.status === 'OPEN').length,
                myActive: allData.filter(t => t.status === 'IN_PROGRESS' && t.assignedAdmin?.userId === myId).length,
                myResolved: allData.filter(t => t.status === 'RESOLVED' && t.assignedAdmin?.userId === myId).length
            });

            // Active List
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
                (t.createdBy?.fullName && t.createdBy.fullName.toLowerCase().includes(lowerQ))
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
            toast.success("Ticket Assigned to You");
            setOpenDialog(false);
            fetchTickets();
        } catch (error) { toast.error("Failed to assign ticket"); }
    };

    const handleCloseTicket = async (ticketId) => {
        if (!window.confirm("Mark as Resolved?")) return;
        try {
            await api.put(`/tickets/${ticketId}/close`);
            toast.success("Ticket Resolved");
            setOpenDialog(false);
            fetchTickets();
        } catch (error) { 
            const msg = error.response?.data?.message || "Failed to resolve ticket";
            toast.error(msg);
        }
    };

    const downloadImage = (base64Data, index) => {
        const link = document.createElement("a");
        link.href = base64Data;
        link.download = `Evidence_Img_${index + 1}.png`;
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
    };

    // --- New Print Logic ---
    const handlePrintTicket = (e, ticket) => {
        e.stopPropagation(); // Prevent opening the dialog
        
        const printWindow = window.open('', '', 'height=600,width=800');
        printWindow.document.write('<html><head><title>Ticket Print</title>');
        printWindow.document.write(`
            <style>
                body { font-family: 'Segoe UI', sans-serif; padding: 40px; color: #333; }
                .header { display: flex; justify-content: space-between; border-bottom: 2px solid #333; padding-bottom: 20px; margin-bottom: 30px; }
                .logo { font-size: 24px; font-weight: bold; }
                .ticket-id { font-size: 18px; color: #666; }
                .section { margin-bottom: 20px; }
                .label { font-weight: bold; color: #555; font-size: 12px; text-transform: uppercase; margin-bottom: 5px; }
                .value { font-size: 16px; margin-bottom: 15px; }
                .grid { display: grid; grid-template-columns: 1fr 1fr; gap: 20px; }
                .status-box { padding: 10px; background: #eee; text-align: center; font-weight: bold; margin-bottom: 20px; border-radius: 4px;}
                .footer { margin-top: 50px; border-top: 1px dashed #ccc; padding-top: 20px; font-size: 12px; display: flex; justify-content: space-between; }
                .signature { border-top: 1px solid #000; width: 200px; padding-top: 5px; margin-top: 40px; text-align: center; }
            </style>
        `);
        printWindow.document.write('</head><body>');
        
        printWindow.document.write(`
            <div class="header">
                <div class="logo">NTMI Support System</div>
                <div class="ticket-id">Job Ticket #${ticket.ticketId}</div>
            </div>

            <div class="status-box">
                CURRENT STATUS: ${ticket.status}
            </div>

            <div class="grid">
                <div class="section">
                    <div class="label">Issue Category</div>
                    <div class="value">${ticket.errorCategory?.categoryName || 'N/A'}</div>
                </div>
                <div class="section">
                    <div class="label">Issue Type</div>
                    <div class="value">${ticket.errorType?.typeName || 'N/A'}</div>
                </div>
                <div class="section">
                    <div class="label">Branch</div>
                    <div class="value">${ticket.branch?.branchName || 'N/A'}</div>
                </div>
                 <div class="section">
                    <div class="label">Reported By</div>
                    <div class="value">${ticket.createdBy?.fullName || 'N/A'}</div>
                </div>
            </div>

            <div class="section">
                <div class="label">Subject</div>
                <div class="value">${ticket.subject || 'N/A'}</div>
            </div>

            <div class="section">
                <div class="label">Description</div>
                <div class="value" style="background: #f9f9f9; padding: 15px; border-left: 4px solid #333;">
                    ${ticket.description || 'No description provided.'}
                </div>
            </div>

            <div class="section">
                <div class="label">Reported Date</div>
                <div class="value">${new Date(ticket.createdAt).toLocaleString()}</div>
            </div>

            <div class="footer">
                <div>
                    <div class="signature">Assigned Tech Signature</div>
                </div>
                <div>
                    <div class="signature">Branch Manager Signature</div>
                </div>
            </div>
            
            <div style="margin-top:20px; font-size: 10px; color: #999; text-align: center;">
                Printed on ${new Date().toLocaleString()} by ${adminName}
            </div>
        `);
        
        printWindow.document.write('</body></html>');
        printWindow.document.close();
        printWindow.print();
    };

    // --- Styles Logic ---
    const getCardStyles = (ticket) => {
        const isMine = ticket.assignedAdmin?.userId === myId || ticket.assignedAdmin?.id === myId;

        if (ticket.status === 'IN_PROGRESS' && isMine) {
            return { 
                bg: 'linear-gradient(135deg, #f0fdf4 0%, #ffffff 100%)', 
                border: '#22c55e', 
                iconColor: '#15803d',
                statusLabel: 'MY TASK',
                statusColor: 'success' 
            };
        }
        
        if (ticket.status === 'IN_PROGRESS' && !isMine) {
            return { 
                bg: 'linear-gradient(135deg, #eff6ff 0%, #ffffff 100%)', 
                border: '#3b82f6', 
                iconColor: '#1d4ed8',
                statusLabel: 'IN PROGRESS', 
                statusColor: 'primary'
            };  
        }

        if (ticket.status === 'OPEN') {
            return { 
                bg: 'linear-gradient(135deg, #fef2f2 0%, #ffffff 100%)', 
                border: '#ef4444', 
                iconColor: '#b91c1c',
                statusLabel: 'OPEN',
                statusColor: 'error'
            };
        }

        return { bg: '#ffffff', border: '#e2e8f0', iconColor: '#64748b', statusLabel: ticket.status, statusColor: 'default' };
    };

    const KpiCard = ({ title, value, icon, color, subtitle }) => (
        <Paper elevation={0} sx={{ p: 3, borderRadius: 3, border: `1px solid ${color}40`, bgcolor: `${color}08`, height: '100%' }}>
            <Box display="flex" justifyContent="space-between" alignItems="start" mb={2}>
                <Box>
                    <Typography variant="h3" fontWeight="800" sx={{ color: color, lineHeight: 1 }}>{value}</Typography>
                    <Typography variant="subtitle2" fontWeight="bold" color="textSecondary" mt={1}>{title}</Typography>
                </Box>
                <Avatar sx={{ bgcolor: `${color}20`, color: color, width: 48, height: 48 }}>{icon}</Avatar>
            </Box>
            <Typography variant="caption" color="textSecondary" sx={{ bgcolor: 'white', px: 1, py: 0.5, borderRadius: 1, border: '1px solid #eee' }}>
                {subtitle}
            </Typography>
        </Paper>
    );

    if (loading) return <Box display="flex" justifyContent="center" height="80vh" alignItems="center"><CircularProgress /></Box>;

    return (
        <Fade in={true} timeout={600}>
            <Container maxWidth="xl" sx={{ mt: 4, mb: 6 }}>
                
                {/* 1. WELCOME BANNER */}
                <Paper 
                    elevation={0}
                    sx={{ 
                        p: 4, mb: 5, borderRadius: 4, 
                        background: 'linear-gradient(135deg, #1e293b 0%, #334155 100%)', 
                        color: 'white', position: 'relative', overflow: 'hidden',
                        boxShadow: '0 10px 20px rgba(30, 41, 59, 0.15)'
                    }}
                >
                    <Box sx={{ position: 'absolute', top: -40, right: -40, width: 200, height: 200, borderRadius: '50%', bgcolor: 'rgba(255,255,255,0.05)' }} />
                    <Box display="flex" alignItems="center" gap={3} position="relative" zIndex={1}>
                        <Avatar sx={{ width: 70, height: 70, bgcolor: 'rgba(255,255,255,0.2)', fontSize: 32 }}>
                            {adminName.charAt(0)}
                        </Avatar>
                        <Box>
                            <Typography variant="h4" fontWeight="800" gutterBottom>
                                Welcome, {adminName}
                            </Typography>
                            <Box display="flex" alignItems="center" gap={1}>
                                <Dashboard sx={{ fontSize: 18, opacity: 0.8 }} />
                                <Typography variant="body1" sx={{ opacity: 0.8, fontWeight: 500 }}>
                                    Admin Dashboard • Head Office
                                </Typography>
                            </Box>
                        </Box>
                    </Box>
                </Paper>

                {/* 2. KPI STATS */}
                <Grid container spacing={3} mb={5}>
                    <Grid item xs={12} md={4}>
                        <KpiCard title="Unassigned Queue" value={stats.unassigned} icon={<AssignmentLate />} color="#e11d48" subtitle="Action Required" />
                    </Grid>
                    <Grid item xs={12} md={4}>
                        <KpiCard title="My Active Tasks" value={stats.myActive} icon={<PendingActions />} color="#16a34a" subtitle="Assigned to You" />
                    </Grid>
                    <Grid item xs={12} md={4}>
                        <KpiCard title="Resolved by Me" value={stats.myResolved} icon={<TaskAlt />} color="#ee06db" subtitle="Completed" />
                    </Grid>
                </Grid>

                {/* 3. FILTERS */}
                <Paper sx={{ p: 2, mb: 4, borderRadius: 3, display: 'flex', gap: 2, alignItems: 'center', bgcolor: 'white', border: '1px solid #e2e8f0' }} elevation={0}>
                    <TextField 
                        size="small" 
                        placeholder="Search ID, Branch or User..." 
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        InputProps={{
                            startAdornment: <InputAdornment position="start"><Search color="action"/></InputAdornment>,
                        }}
                        sx={{ flexGrow: 1 }}
                    />
                    <Box display="flex" alignItems="center" gap={1}>
                        <FilterList color="action" />
                        <TextField 
                            select size="small"
                            value={statusFilter} onChange={(e) => setStatusFilter(e.target.value)} 
                            sx={{ minWidth: 150 }}
                        >
                            <MenuItem value="All">All Active</MenuItem>
                            <MenuItem value="OPEN">Open Queue</MenuItem>
                            <MenuItem value="IN_PROGRESS">In Progress</MenuItem>
                        </TextField>
                    </Box>
                </Paper>

                {/* 4. TICKET GRID */}
                {filteredTickets.length === 0 ? (
                    <Box textAlign="center" py={8} bgcolor="#f8fafc" borderRadius={4} border="1px dashed #e2e8f0">
                        <CheckCircle sx={{ fontSize: 60, color: '#10b981', mb: 2, opacity: 0.5 }} />
                        <Typography variant="h6" color="textSecondary">All caught up! No tickets found.</Typography>
                    </Box>
                ) : (
                    <Grid container spacing={3} alignItems="stretch"> 
                        {filteredTickets.map((ticket) => {
                            const styles = getCardStyles(ticket);
                            
                            return (
                                <Grid item xs={12} sm={6} md={4} lg={3} key={ticket.ticketId} sx={{ display: 'flex' }}>
                                    <Card 
                                        elevation={0}
                                        onClick={() => { setSelectedTicket(ticket); setOpenDialog(true); }}
                                        sx={{ 
                                            width: '100%',
                                            borderRadius: 4, 
                                            display: 'flex', flexDirection: 'column',
                                            background: styles.bg, 
                                            border: `2px solid ${styles.border}`, 
                                            position: 'relative',
                                            cursor: 'pointer', 
                                            transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
                                            '&:hover': { transform: 'translateY(-5px)', boxShadow: '0 10px 20px -5px rgba(0, 0, 0, 0.1)' },
                                        }}
                                    >
                                        <CardContent sx={{ flexGrow: 1, p: 3, display: 'flex', flexDirection: 'column', justifyContent: 'space-between' }}>
                                            
                                            {/* Top: Status & ID */}
                                            <Box display="flex" justifyContent="space-between" alignItems="start" mb={2}>
                                                <Chip 
                                                    label={`#${ticket.ticketId}`} 
                                                    size="small" 
                                                    sx={{ fontWeight: 'bold', bgcolor: 'white', border: '1px solid #e2e8f0' }} 
                                                />
                                                <Box display="flex" gap={1}>
                                                    {/* PRINT BUTTON ADDED HERE */}
                                                    <Tooltip title="Print Job Ticket">
                                                        <IconButton 
                                                            size="small" 
                                                            onClick={(e) => handlePrintTicket(e, ticket)}
                                                            sx={{ bgcolor: 'white', border: '1px solid #e2e8f0', width: 24, height: 24 }}
                                                        >
                                                            <Print sx={{ fontSize: 14, color: '#64748b' }} />
                                                        </IconButton>
                                                    </Tooltip>

                                                    <Chip 
                                                        label={styles.statusLabel}
                                                        size="small" 
                                                        color={styles.statusColor}
                                                        sx={{ fontWeight: 'bold' }} 
                                                    />
                                                </Box>
                                            </Box>

                                            {/* Middle: Core Details */}
                                            <Box mb={2}>
                                                <Typography variant="h6" fontWeight="800" sx={{ lineHeight: 1.2, mb: 0.5, color: '#1e293b' }}>
                                                    {ticket.errorCategory?.categoryName}
                                                </Typography>
                                                <Typography variant="body2" fontWeight="500" color="text.secondary">
                                                    {ticket.errorType?.typeName}
                                                </Typography>
                                            </Box>

                                            <Divider sx={{ borderStyle: 'dashed', mb: 2, opacity: 0.6 }} />

                                            {/* Bottom: Meta Data */}
                                            <Stack spacing={1}>
                                                <Box display="flex" alignItems="center" gap={1.5}>
                                                    <Business sx={{ fontSize: 18, color: styles.iconColor }} />
                                                    <Typography variant="body2" fontWeight="bold" color="#334155">
                                                        {ticket.branch?.branchName}
                                                    </Typography>
                                                </Box>
                                                
                                                <Box display="flex" alignItems="center" gap={1.5}>
                                                    <Person sx={{ fontSize: 18, color: styles.iconColor }} />
                                                    <Typography variant="caption" color="text.secondary">
                                                        By: <strong>{ticket.createdBy?.fullName?.split(' ')[0]}</strong>
                                                    </Typography>
                                                </Box>

                                                <Box display="flex" alignItems="center" gap={1.5}>
                                                    <AccessTime sx={{ fontSize: 18, color: styles.iconColor }} />
                                                    <Typography variant="caption" color="text.secondary">
                                                        {new Date(ticket.createdAt).toLocaleDateString()}
                                                    </Typography>
                                                </Box>
                                            </Stack>

                                        </CardContent>
                                    </Card>
                                </Grid>
                            );
                        })}
                    </Grid>
                )}

                {/* 5. MODERN DETAIL DIALOG */}
                <Dialog 
                    open={openDialog} 
                    onClose={() => setOpenDialog(false)} 
                    maxWidth="md" 
                    fullWidth 
                    PaperProps={{ 
                        sx: { 
                            borderRadius: 4, 
                            overflow: 'hidden',
                            boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.25)' 
                        } 
                    }}
                >
                    {selectedTicket && (
                        <>
                            {/* Modern Header */}
                            <Box 
                                sx={{ 
                                    p: 3, 
                                    background: 'linear-gradient(135deg, #0f172a 0%, #334155 100%)', 
                                    color: 'white',
                                    display: 'flex', 
                                    justifyContent: 'space-between', 
                                    alignItems: 'center' 
                                }}
                            >
                                <Box>
                                    <Stack direction="row" alignItems="center" spacing={2} mb={1}>
                                        <Typography variant="h5" fontWeight="800">#{selectedTicket.ticketId}</Typography>
                                        <Chip 
                                            label={selectedTicket.status} 
                                            color={selectedTicket.status === 'OPEN' ? 'error' : 'primary'}
                                            size="small"
                                            sx={{ fontWeight: 'bold', color: 'white' }}
                                        />
                                    </Stack>
                                    <Typography variant="body2" sx={{ opacity: 0.8 }}>
                                        Created on {new Date(selectedTicket.createdAt).toLocaleString()}
                                    </Typography>
                                </Box>
                                <IconButton onClick={() => setOpenDialog(false)} sx={{ color: 'white', bgcolor: 'rgba(255,255,255,0.1)' }}>
                                    <Close />
                                </IconButton>
                            </Box>
                            
                            <DialogContent sx={{ p: 0 }}>
                                <Grid container>
                                    {/* Left Column: Details */}
                                    <Grid item xs={12} md={8} sx={{ p: 4 }}>
                                        {/* Meta Grid */}
                                        <Grid container spacing={2} mb={4}>
                                            <Grid item xs={6}>
                                                <Box display="flex" alignItems="center" gap={2}>
                                                    <Avatar sx={{ bgcolor: '#eff6ff', color: '#3b82f6' }}><Business /></Avatar>
                                                    <Box>
                                                        <Typography variant="caption" color="textSecondary" fontWeight="bold">BRANCH</Typography>
                                                        <Typography variant="body2" fontWeight="bold">{selectedTicket.branch?.branchName}</Typography>
                                                    </Box>
                                                </Box>
                                            </Grid>
                                            <Grid item xs={6}>
                                                <Box display="flex" alignItems="center" gap={2}>
                                                    <Avatar sx={{ bgcolor: '#f0fdf4', color: '#16a34a' }}><Person /></Avatar>
                                                    <Box>
                                                        <Typography variant="caption" color="textSecondary" fontWeight="bold">REQUESTER</Typography>
                                                        <Typography variant="body2" fontWeight="bold">{selectedTicket.createdBy?.fullName}</Typography>
                                                    </Box>
                                                </Box>
                                            </Grid>
                                            <Grid item xs={6}>
                                                <Box display="flex" alignItems="center" gap={2}>
                                                    <Avatar sx={{ bgcolor: '#fef2f2', color: '#ef4444' }}><ReportProblem /></Avatar>
                                                    <Box>
                                                        <Typography variant="caption" color="textSecondary" fontWeight="bold">CATEGORY</Typography>
                                                        <Typography variant="body2" fontWeight="bold">{selectedTicket.errorCategory?.categoryName}</Typography>
                                                    </Box>
                                                </Box>
                                            </Grid>
                                            <Grid item xs={6}>
                                                <Box display="flex" alignItems="center" gap={2}>
                                                    <Avatar sx={{ bgcolor: '#fff7ed', color: '#f97316' }}><Category /></Avatar>
                                                    <Box>
                                                        <Typography variant="caption" color="textSecondary" fontWeight="bold">TYPE</Typography>
                                                        <Typography variant="body2" fontWeight="bold">{selectedTicket.errorType?.typeName}</Typography>
                                                    </Box>
                                                </Box>
                                            </Grid>
                                        </Grid>

                                        {/* Description */}
                                        <Box mb={4}>
                                            <Typography variant="subtitle2" fontWeight="bold" sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 1 }}>
                                                <DescriptionIcon fontSize="small" color="action" /> Subject & Description
                                            </Typography>
                                            <Paper variant="outlined" sx={{ p: 3, bgcolor: '#f8fafc', borderRadius: 2 }}>
                                                <Typography variant="subtitle1" fontWeight="bold" gutterBottom>
                                                    {selectedTicket.subject}
                                                </Typography>
                                                <Typography variant="body2" color="text.secondary" sx={{ whiteSpace: 'pre-wrap' }}>
                                                    {selectedTicket.description || 'No detailed description provided.'}
                                                </Typography>
                                            </Paper>
                                        </Box>

                                        {/* Evidence */}
                                        {selectedTicket.images && selectedTicket.images.length > 0 && (
                                            <Box>
                                                <Typography variant="subtitle2" fontWeight="bold" sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 1 }}>
                                                    <ImageIcon fontSize="small" color="action" /> Attached Evidence
                                                </Typography>
                                                <Stack direction="row" spacing={2} sx={{ overflowX: 'auto', pb: 1 }}>
                                                    {selectedTicket.images.map((img, idx) => (
                                                        <Box key={idx} position="relative" sx={{ flexShrink: 0, group: 'hover' }}>
                                                            <Box 
                                                                component="img" 
                                                                src={img.base64Data} 
                                                                onClick={() => window.open(img.base64Data)}
                                                                sx={{ 
                                                                    width: 120, height: 120, borderRadius: 3, 
                                                                    border: '1px solid #eee', objectFit: 'cover', cursor: 'zoom-in',
                                                                    boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)',
                                                                    transition: 'transform 0.2s',
                                                                    '&:hover': { transform: 'scale(1.05)' }
                                                                }}
                                                            />
                                                        </Box>
                                                    ))}
                                                </Stack>
                                            </Box>
                                        )}
                                    </Grid>

                                    {/* Right Column: Comments & Actions */}
                                    <Grid item xs={12} md={4} sx={{ bgcolor: '#f8fafc', borderLeft: '1px solid #e2e8f0', p: 0, display: 'flex', flexDirection: 'column' }}>
                                        <Box sx={{ p: 3, flexGrow: 1, overflowY: 'auto', maxHeight: '600px' }}>
                                             <TicketComments ticketId={selectedTicket.ticketId} />
                                        </Box>
                                        
                                        {/* Actions Footer */}
                                        <Box sx={{ p: 3, borderTop: '1px solid #e2e8f0', bgcolor: 'white' }}>
                                            {selectedTicket.status === 'OPEN' ? (
                                                <Button 
                                                    variant="contained" 
                                                    color="primary" 
                                                    fullWidth 
                                                    size="large"
                                                    startIcon={<PlayArrow />} 
                                                    onClick={() => handleStartTicket(selectedTicket.ticketId)}
                                                    sx={{ borderRadius: 2, textTransform: 'none', fontWeight: 'bold' }}
                                                >
                                                    Accept Ticket
                                                </Button>
                                            ) : selectedTicket.status === 'IN_PROGRESS' ? (
                                                selectedTicket.assignedAdmin?.userId === myId ? (
                                                    <Button 
                                                        variant="contained" 
                                                        color="success" 
                                                        fullWidth 
                                                        size="large"
                                                        startIcon={<CheckCircle />} 
                                                        onClick={() => handleCloseTicket(selectedTicket.ticketId)}
                                                        sx={{ borderRadius: 2, textTransform: 'none', fontWeight: 'bold' }}
                                                    >
                                                        Resolve Issue
                                                    </Button>
                                                ) : (
                                                    <Alert severity="warning" icon={<Lock fontSize="inherit" />} sx={{ width: '100%', borderRadius: 2 }}>
                                                        Assigned to {selectedTicket.assignedAdmin?.fullName}
                                                    </Alert>
                                                )
                                            ) : (
                                                <Button disabled fullWidth variant="outlined" startIcon={<CheckCircle />}>Ticket Resolved</Button>
                                            )}
                                        </Box>
                                    </Grid>
                                </Grid>
                            </DialogContent>
                        </>
                    )}
                </Dialog>

            </Container>
        </Fade>
    );
};

export default AdminDashboard;