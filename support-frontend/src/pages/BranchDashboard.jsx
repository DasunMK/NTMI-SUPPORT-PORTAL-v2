import React, { useState, useEffect } from 'react';
import { 
    Container, Paper, Typography, Box, Card, CardContent, 
    Divider, Fade, Button, CircularProgress,
    Dialog, DialogTitle, DialogContent, DialogActions, Chip, Stack, IconButton, Tooltip, Alert, Grid
} from '@mui/material';
import { 
    ConfirmationNumber, PendingActions, CheckCircle, Category, 
    Add, Cancel, Download as DownloadIcon, AccessTime, Store
} from '@mui/icons-material';
import { useNavigate } from 'react-router-dom';
import { toast } from 'react-toastify';
import api from '../services/api';
import TicketComments from '../components/TicketComments'; // ✅ 1. Import Chat Component

const getStatusColor = (status) => {
    switch (status) {
        case 'OPEN': return '#d32f2f'; // Red
        case 'IN_PROGRESS': return '#ed6c02'; // Orange
        case 'RESOLVED': return '#2e7d32'; // Green
        case 'CLOSED': return '#757575'; // Grey
        case 'CANCELLED': return '#000000'; // Black
        default: return '#1976d2';
    }
};

const BranchDashboard = () => {
    const navigate = useNavigate();
    const [stats, setStats] = useState({ total: 0, open: 0, inProgress: 0, resolved: 0 });
    const [tickets, setTickets] = useState([]);
    const [loading, setLoading] = useState(true);
    
    const [selectedTicket, setSelectedTicket] = useState(null);
    const [openDialog, setOpenDialog] = useState(false);

    const branchName = localStorage.getItem('branchName') || 'My Branch';

    const fetchDashboardData = async () => {
        try {
            const branchId = localStorage.getItem('branchId');
            if (!branchId) return;

            const response = await api.get(`/tickets/branch/${branchId}`);
            const allTickets = response.data;

            // 1. Calculate Stats (Use ALL tickets for counts)
            setStats({
                total: allTickets.length,
                open: allTickets.filter(t => t.status === 'OPEN').length,
                inProgress: allTickets.filter(t => t.status === 'IN_PROGRESS').length,
                resolved: allTickets.filter(t => t.status === 'RESOLVED').length
            });
            
            // 2. Filter Grid (Show ONLY Active Tickets: OPEN or IN_PROGRESS)
            const activeTickets = allTickets.filter(t => 
                t.status === 'OPEN' || t.status === 'IN_PROGRESS'
            );

            const sortedTickets = activeTickets.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
            setTickets(sortedTickets);

        } catch (error) {
            console.error("Error fetching dashboard data", error);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchDashboardData();
    }, []);

    // --- Handlers ---
    const handleTicketClick = (ticket) => {
        setSelectedTicket(ticket);
        setOpenDialog(true);
    };

    const handleCloseDialog = () => {
        setOpenDialog(false);
        setSelectedTicket(null);
    };

    const handleCancelTicket = async () => {
        if (!selectedTicket) return;
        if (!window.confirm("Are you sure you want to cancel this ticket?")) return;

        try {
            await api.put(`/tickets/${selectedTicket.ticketId}/cancel`);
            toast.success("Ticket Cancelled Successfully");
            handleCloseDialog();
            fetchDashboardData(); 
        } catch (error) {
            toast.error("Failed to cancel ticket");
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

    // --- Styles ---
    const getCardStyles = (status) => {
        if (status === 'IN_PROGRESS') {
            return { bg: 'linear-gradient(135deg, #eff6ff 0%, #ffffff 100%)', border: '#3b82f6', iconColor: '#3b82f6' };
        }
        if (status === 'OPEN') {
            return { bg: 'linear-gradient(135deg, #fef2f2 0%, #ffffff 100%)', border: '#ef4444', iconColor: '#ef4444' };
        }
        return { bg: '#ffffff', border: '#e2e8f0', iconColor: '#64748b' };
    };

    const KpiCard = ({ title, value, icon, color }) => (
        <Paper elevation={0} sx={{ p: 3, display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderRadius: 3, border: `1px solid ${color}40`, bgcolor: `${color}08` }}>
            <Box>
                <Typography variant="subtitle2" color="textSecondary" fontWeight="bold">{title}</Typography>
                <Typography variant="h4" fontWeight="800" sx={{ color: color }}>{value}</Typography>
            </Box>
            <Box sx={{ bgcolor: `${color}20`, p: 1.5, borderRadius: '50%', color: color }}>
                {icon}
            </Box>
        </Paper>
    );

    if (loading) return <Box display="flex" justifyContent="center" mt={10}><CircularProgress /></Box>;

    return (
        <Fade in={true} timeout={800}>
            <Container maxWidth="xl" sx={{ mt: 4, mb: 8 }}>
                
                {/* 1. HERO HEADER */}
                <Paper 
                    elevation={0}
                    sx={{ 
                        p: 4, mb: 5, borderRadius: 4, 
                        background: 'linear-gradient(135deg, #1e293b 0%, #334155 100%)', 
                        color: 'white', position: 'relative', overflow: 'hidden'
                    }}
                >
                    <Box display="flex" justifyContent="space-between" alignItems="center" position="relative" zIndex={1}>
                        <Box display="flex" alignItems="center" gap={3}>
                            <Box sx={{ bgcolor: 'rgba(255,255,255,0.1)', p: 2, borderRadius: 3 }}>
                                <Store sx={{ fontSize: 40, color: '#60a5fa' }} />
                            </Box>
                            <Box>
                                <Typography variant="h4" fontWeight="800" gutterBottom>
                                    {branchName} Dashboard
                                </Typography>
                                <Typography variant="body1" sx={{ opacity: 0.8 }}>
                                    Overview of your IT support requests and their status.
                                </Typography>
                            </Box>
                        </Box>
                        <Button 
                            variant="contained" 
                            startIcon={<Add />} 
                            onClick={() => navigate('/create-ticket')} 
                            sx={{ 
                                borderRadius: 3, px: 4, py: 1.5, fontWeight: 'bold',
                                background: 'linear-gradient(45deg, #2563eb, #3b82f6)',
                                boxShadow: '0 8px 16px rgba(37, 99, 235, 0.3)'
                            }}
                        >
                            Raise New Ticket
                        </Button>
                    </Box>
                    {/* Decorative Circle */}
                    <Box sx={{ position: 'absolute', right: -50, top: -50, width: 250, height: 250, borderRadius: '50%', bgcolor: 'rgba(255,255,255,0.05)' }} />
                </Paper>

                {/* 2. KPI STATS */}
                <Grid container spacing={3} mb={6}>
                    <Grid item xs={12} sm={6} md={3}>
                        <KpiCard title="Total Tickets" value={stats.total} icon={<ConfirmationNumber />} color="#1976d2" />
                    </Grid>
                    <Grid item xs={12} sm={6} md={3}>
                        <KpiCard title="Pending Review" value={stats.open} icon={<PendingActions />} color="#d32f2f" />
                    </Grid>
                    <Grid item xs={12} sm={6} md={3}>
                        <KpiCard title="Being Fixed" value={stats.inProgress} icon={<Category />} color="#ed6c02" />
                    </Grid>
                    <Grid item xs={12} sm={6} md={3}>
                        <KpiCard title="Resolved" value={stats.resolved} icon={<CheckCircle />} color="#2e7d32" />
                    </Grid>
                </Grid>

                <Typography variant="h6" fontWeight="bold" gutterBottom sx={{ mb: 3 }}>
                    Active Requests
                </Typography>

                {/* 3. TICKET GRID (Only Open/In Progress) */}
                {tickets.length === 0 ? (
                    <Box textAlign="center" py={5} bgcolor="#f8fafc" borderRadius={3} border="1px dashed #e2e8f0">
                        <CheckCircle sx={{ fontSize: 60, color: '#22c55e', mb: 2, opacity: 0.5 }} />
                        <Typography variant="h6" color="textSecondary">All clear! No pending issues.</Typography>
                    </Box>
                ) : (
                    <Grid container spacing={3}>
                        {tickets.map((ticket) => {
                            const styles = getCardStyles(ticket.status);
                            
                            return (
                                <Grid item xs={12} sm={6} md={4} lg={3} key={ticket.ticketId}>
                                    <Card 
                                        elevation={0}
                                        sx={{ 
                                            borderRadius: 4, height: '100%', display: 'flex', flexDirection: 'column',
                                            background: styles.bg, border: `1px solid ${styles.border}`, position: 'relative',
                                            cursor: 'pointer', transition: 'all 0.3s ease',
                                            '&:hover': { transform: 'translateY(-5px)', boxShadow: '0 10px 20px -5px rgba(0, 0, 0, 0.1)' }
                                        }}
                                        onClick={() => handleTicketClick(ticket)}
                                    >
                                        <CardContent sx={{ flexGrow: 1, p: 3, display: 'flex', flexDirection: 'column', gap: 2 }}>
                                            
                                            <Box display="flex" justifyContent="space-between" alignItems="start">
                                                <Chip label={`#${ticket.ticketId}`} size="small" sx={{ fontWeight: 'bold', bgcolor: 'white', border: '1px solid #e2e8f0' }} />
                                                <Chip 
                                                    label={ticket.status.replace('_', ' ')} 
                                                    size="small" 
                                                    sx={{ fontWeight: 'bold', bgcolor: getStatusColor(ticket.status), color: 'white' }} 
                                                />
                                            </Box>

                                            <Box flexGrow={1}>
                                                <Typography variant="h6" fontWeight="bold" sx={{ lineHeight: 1.2, mb: 0.5 }}>
                                                    {ticket.errorCategory?.categoryName}
                                                </Typography>
                                                <Typography variant="body2" color="text.secondary">
                                                    {ticket.errorType?.typeName}
                                                </Typography>
                                            </Box>

                                            <Divider sx={{ borderStyle: 'dashed' }} />

                                            <Box display="flex" justifyContent="space-between" alignItems="center">
                                                <Box display="flex" alignItems="center" gap={1}>
                                                    <AccessTime sx={{ fontSize: 16, color: styles.iconColor }} />
                                                    <Typography variant="caption" color="text.secondary">
                                                        {new Date(ticket.createdAt).toLocaleDateString()}
                                                    </Typography>
                                                </Box>
                                                <Store sx={{ fontSize: 20, color: styles.iconColor, opacity: 0.5 }} />
                                            </Box>

                                        </CardContent>
                                    </Card>
                                </Grid>
                            );
                        })}
                    </Grid>
                )}

                {/* --- DETAILS DIALOG --- */}
                <Dialog 
                    open={openDialog} 
                    onClose={handleCloseDialog} 
                    maxWidth="sm" fullWidth
                    PaperProps={{ sx: { borderRadius: 3 } }}
                >
                    {selectedTicket && (
                        <>
                            <DialogTitle sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', bgcolor: '#f8fafc', borderBottom: '1px solid #f1f5f9' }}>
                                <Box>
                                    <Typography variant="h6" fontWeight="bold">Ticket Details</Typography>
                                    <Typography variant="caption" color="textSecondary">ID: TKT-{selectedTicket.ticketId}</Typography>
                                </Box>
                                <Chip 
                                    label={selectedTicket.status.replace('_', ' ')} 
                                    sx={{ bgcolor: getStatusColor(selectedTicket.status), color: 'white', fontWeight: 'bold' }} 
                                />
                            </DialogTitle>
                            
                            <DialogContent sx={{ pt: 3 }}>
                                <Alert severity="info" sx={{ mb: 3, borderRadius: 2 }}>
                                    <Typography variant="subtitle2" fontWeight="bold">Subject:</Typography>
                                    {selectedTicket.subject || 'No Subject'}
                                </Alert>

                                {/* Image Gallery */}
                                {selectedTicket.images && selectedTicket.images.length > 0 && (
                                    <Box mb={3}>
                                        <Typography variant="caption" fontWeight="bold" color="textSecondary" display="block" mb={1}>
                                            ATTACHED EVIDENCE
                                        </Typography>
                                        <Stack direction="row" spacing={2} sx={{ overflowX: 'auto', pb: 1 }}>
                                            {selectedTicket.images.map((img, idx) => (
                                                <Box key={idx} position="relative" sx={{ flexShrink: 0 }}>
                                                    <Box 
                                                        component="img"
                                                        src={img.base64Data}
                                                        alt="evidence"
                                                        onClick={() => window.open(img.base64Data)}
                                                        sx={{ 
                                                            width: 80, height: 80, borderRadius: 2, 
                                                            border: '2px solid #e2e8f0', objectFit: 'cover', 
                                                            cursor: 'zoom-in', transition: 'all 0.2s',
                                                            '&:hover': { transform: 'scale(1.05)', borderColor: '#3b82f6' } 
                                                        }}
                                                    />
                                                    <Tooltip title="Download">
                                                        <IconButton 
                                                            size="small"
                                                            onClick={(e) => { e.stopPropagation(); downloadImage(img.base64Data, idx); }}
                                                            sx={{ position: 'absolute', bottom: -8, right: -8, bgcolor: 'white', border: '1px solid #ddd', boxShadow: 2, '&:hover': { bgcolor: '#f5f5f5' } }}
                                                        >
                                                            <DownloadIcon fontSize="small" color="primary" />
                                                        </IconButton>
                                                    </Tooltip>
                                                </Box>
                                            ))}
                                        </Stack>
                                    </Box>
                                )}

                                <Typography variant="caption" fontWeight="bold" color="textSecondary">DESCRIPTION</Typography>
                                <Paper variant="outlined" sx={{ p: 2, mt: 0.5, mb: 3, bgcolor: '#fafafa', borderRadius: 2 }}>
                                    <Typography variant="body2">{selectedTicket.description || 'No description provided.'}</Typography>
                                </Paper>

                                {/* ✅ ADDED: Comments Component */}
                                <Divider sx={{ my: 2 }} />
                                <TicketComments ticketId={selectedTicket.ticketId} />

                                <Box display="flex" justifyContent="space-between" bgcolor="#f1f5f9" p={2} borderRadius={2} mt={2}>
                                    <Box>
                                        <Typography variant="caption" color="textSecondary">Assigned To</Typography>
                                        <Typography variant="body2" fontWeight="bold">
                                            {selectedTicket.assignedAdmin ? selectedTicket.assignedAdmin.fullName : "Pending Assignment"}
                                        </Typography>
                                    </Box>
                                    <Box textAlign="right">
                                        <Typography variant="caption" color="textSecondary">Created On</Typography>
                                        <Typography variant="body2" fontWeight="bold">
                                            {new Date(selectedTicket.createdAt).toLocaleDateString()}
                                        </Typography>
                                    </Box>
                                </Box>
                            </DialogContent>
                            
                            <DialogActions sx={{ p: 3, borderTop: '1px solid #f1f5f9' }}>
                                {selectedTicket.status === 'OPEN' && (
                                    <Button 
                                        variant="outlined" color="error" 
                                        startIcon={<Cancel />} onClick={handleCancelTicket} 
                                        sx={{ mr: 'auto', borderRadius: 2, fontWeight: 'bold' }}
                                    >
                                        Cancel Request
                                    </Button>
                                )}
                                <Button onClick={handleCloseDialog} variant="contained" color="primary" sx={{ borderRadius: 2, px: 3, fontWeight: 'bold' }}>
                                    Close
                                </Button>
                            </DialogActions>
                        </>
                    )}
                </Dialog>

            </Container>
        </Fade>
    );
};

export default BranchDashboard;