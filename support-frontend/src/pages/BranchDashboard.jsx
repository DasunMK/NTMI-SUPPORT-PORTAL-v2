import React, { useState, useEffect } from 'react';
import { 
    Container, Paper, Typography, Box, Card, CardContent, 
    Divider, Fade, Button, CircularProgress,
    Dialog, DialogTitle, DialogContent, DialogActions, Chip, Stack, IconButton, Tooltip, Alert, Grid, Avatar
} from '@mui/material';
import { 
    ConfirmationNumber, PendingActions, CheckCircle, Category, 
    Add, Cancel, Download as DownloadIcon, AccessTime, Store, ReportProblem, Close
} from '@mui/icons-material';
import { useNavigate } from 'react-router-dom';
import { toast } from 'react-toastify';
import api from '../services/api';
import TicketComments from '../components/TicketComments'; 

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

const getStatusColor = (status) => {
    switch (status) {
        case 'OPEN': return '#d32f2f'; 
        case 'IN_PROGRESS': return '#ed6c02'; 
        case 'RESOLVED': return '#2e7d32'; 
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

    // ✅ FIXED: Added isBackground parameter for silent refresh
    const fetchDashboardData = async (isBackground = false) => {
        try {
            const branchId = localStorage.getItem('branchId');
            if (!branchId) return;

            // Only show spinner on first load
            if (!isBackground) setLoading(true);

            const response = await api.get(`/tickets/branch/${branchId}`);
            const allTickets = response.data;

            setStats({
                total: allTickets.length,
                open: allTickets.filter(t => t.status === 'OPEN').length,
                inProgress: allTickets.filter(t => t.status === 'IN_PROGRESS').length,
                resolved: allTickets.filter(t => t.status === 'RESOLVED').length
            });
            
            const activeTickets = allTickets.filter(t => t.status === 'OPEN' || t.status === 'IN_PROGRESS');
            const sortedTickets = activeTickets.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
            setTickets(sortedTickets);

        } catch (error) {
            console.error("Error fetching dashboard data", error);
        } finally {
            setLoading(false);
        }
    };

    // ✅ FIXED: Added interval for 5-second auto-refresh
    useEffect(() => {
        fetchDashboardData(); // Initial Load

        const interval = setInterval(() => {
            fetchDashboardData(true); // Silent Refresh
        }, 5000); 

        return () => clearInterval(interval); // Cleanup
    }, []);

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

    // Card Styles 
    const getCardStyles = (status) => {
        if (status === 'IN_PROGRESS') return { bg: 'linear-gradient(135deg, #eff6ff 0%, #ffffff 100%)', border: '#3b82f6', iconColor: '#3b82f6', statusColor: 'primary' };
        if (status === 'OPEN') return { bg: 'linear-gradient(135deg, #fef2f2 0%, #ffffff 100%)', border: '#ef4444', iconColor: '#ef4444', statusColor: 'error' };
        return { bg: '#ffffff', border: '#e2e8f0', iconColor: '#64748b', statusColor: 'default' };
    };

    if (loading) return <Box display="flex" justifyContent="center" height="80vh" alignItems="center"><CircularProgress /></Box>;

    return (
        <Fade in={true} timeout={800}>
            <Container maxWidth="xl" sx={{ mt: 4, mb: 8 }}>
                
                {/* HEADER */}
                <Paper 
                    elevation={0}
                    sx={{ 
                        p: 4, mb: 5, borderRadius: 4, 
                        background: 'linear-gradient(135deg, #1e293b 0%, #334155 100%)', 
                        color: 'white', position: 'relative', overflow: 'hidden',
                        boxShadow: '0 20px 40px -10px rgba(15, 23, 42, 0.3)'
                    }}
                >
                    <Box sx={{ position: 'absolute', top: -100, right: -50, width: 300, height: 300, borderRadius: '50%', background: 'radial-gradient(circle, rgba(255,255,255,0.1) 0%, rgba(255,255,255,0) 70%)' }} />
                    <Box display="flex" justifyContent="space-between" alignItems="center" position="relative" zIndex={1}>
                        <Box display="flex" alignItems="center" gap={3}>
                            <Avatar sx={{ width: 72, height: 72, bgcolor: 'rgba(255,255,255,0.15)', backdropFilter: 'blur(10px)' }}>
                                <Store sx={{ fontSize: 36, color: '#60a5fa' }} />
                            </Avatar>
                            <Box>
                                <Typography variant="h4" fontWeight="800" gutterBottom sx={{ letterSpacing: -0.5 }}>
                                    {branchName} Dashboard
                                </Typography>
                                <Typography variant="body1" sx={{ opacity: 0.8, fontWeight: 500 }}>
                                    IT support
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
                                boxShadow: '0 8px 16px rgba(37, 99, 235, 0.3)',
                                transition: 'transform 0.2s',
                                '&:hover': { transform: 'scale(1.05)' }
                            }}
                        >
                            Raise Ticket
                        </Button>
                    </Box>
                </Paper>

                <Grid container spacing={3} mb={6}>
                    <Grid item xs={12} sm={6} md={3}><KpiCard title="Total Tickets" value={stats.total} icon={<ConfirmationNumber />} color="#1976d2" subtitle="All Time" /></Grid>
                    <Grid item xs={12} sm={6} md={3}><KpiCard title="Pending Review" value={stats.open} icon={<PendingActions />} color="#d32f2f" subtitle="Awaiting Action" /></Grid>
                    <Grid item xs={12} sm={6} md={3}><KpiCard title="Being Fixed" value={stats.inProgress} icon={<Category />} color="#ed6c02" subtitle="Currently Active" /></Grid>
                    <Grid item xs={12} sm={6} md={3}><KpiCard title="Resolved" value={stats.resolved} icon={<CheckCircle />} color="#2e7d32" subtitle="Completed" /></Grid>
                </Grid>

                <Typography variant="h6" fontWeight="bold" gutterBottom sx={{ mb: 3, color: '#334155' }}>
                    Active Requests
                </Typography>

                {/* TICKET GRID */}
                {tickets.length === 0 ? (
                    <Box textAlign="center" py={8} bgcolor="#f8fafc" borderRadius={4} border="2px dashed #e2e8f0">
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
                                            background: styles.bg, border: `2px solid ${styles.border}`, position: 'relative',
                                            cursor: 'pointer', transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
                                            '&:hover': { transform: 'translateY(-6px)', boxShadow: '0 12px 24px -10px rgba(0, 0, 0, 0.15)' }
                                        }}
                                        onClick={() => handleTicketClick(ticket)}
                                    >
                                        <CardContent sx={{ flexGrow: 1, p: 3, display: 'flex', flexDirection: 'column', gap: 2 }}>
                                            <Box display="flex" justifyContent="space-between" alignItems="start">
                                                <Chip label={`#${ticket.ticketId}`} size="small" sx={{ fontWeight: '800', bgcolor: 'white', border: '1px solid #e2e8f0', borderRadius: 1.5 }} />
                                                <Chip label={ticket.status.replace('_', ' ')} size="small" color={styles.statusColor} sx={{ fontWeight: 'bold', borderRadius: 1.5 }} />
                                            </Box>

                                            <Box flexGrow={1}>
                                                <Typography variant="h6" fontWeight="800" sx={{ lineHeight: 1.2, mb: 0.5, color: '#0f172a' }}>
                                                    {ticket.errorCategory?.categoryName}
                                                </Typography>
                                                <Typography variant="body2" fontWeight="500" color="text.secondary">
                                                    {ticket.errorType?.typeName}
                                                </Typography>
                                            </Box>

                                            <Divider sx={{ borderStyle: 'dashed', opacity: 0.6 }} />

                                            <Box display="flex" alignItems="center" gap={1}>
                                                <AccessTime sx={{ fontSize: 16, color: styles.iconColor }} />
                                                <Typography variant="caption" color="text.secondary" fontWeight="600">
                                                    {new Date(ticket.createdAt).toLocaleDateString()}
                                                </Typography>
                                            </Box>
                                        </CardContent>
                                    </Card>
                                </Grid>
                            );
                        })}
                    </Grid>
                )}

                {/* DETAILS DIALOG */}
                <Dialog 
                    open={openDialog} 
                    onClose={handleCloseDialog} 
                    maxWidth="lg" fullWidth
                    PaperProps={{ sx: { borderRadius: 3, height: '85vh', overflow: 'hidden' } }}
                >
                    {selectedTicket && (
                        <>
                           
                            <Box sx={{ p: 3, borderBottom: '1px solid #e2e8f0', bgcolor: 'white', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                                <Box display="flex" alignItems="center" gap={2}>
                                    <Avatar sx={{ bgcolor: selectedTicket.status === 'OPEN' ? '#fee2e2' : '#dcfce7', color: selectedTicket.status === 'OPEN' ? '#b91c1c' : '#15803d' }}>
                                        <ReportProblem />
                                    </Avatar>
                                    <Box>
                                        <Stack direction="row" alignItems="center" spacing={2}>
                                            <Typography variant="h6" fontWeight="800" color="#0f172a">Ticket #{selectedTicket.ticketId}</Typography>
                                            <Chip label={selectedTicket.status} color={selectedTicket.status === 'OPEN' ? 'error' : 'success'} size="small" />
                                        </Stack>
                                        <Typography variant="body2" color="textSecondary">Created by {selectedTicket.createdBy?.fullName}</Typography>
                                    </Box>
                                </Box>
                                <IconButton onClick={handleCloseDialog} sx={{ bgcolor: '#f1f5f9' }}><Close /></IconButton>
                            </Box>

                            <DialogContent sx={{ p: 0, display: 'flex', flexDirection: { xs: 'column', md: 'row' }, height: '100%' }}>
                                <Box sx={{ flex: 1, p: 4, overflowY: 'auto', borderRight: '1px solid #e2e8f0' }}>
                                    <Alert severity="info" sx={{ mb: 3, borderRadius: 2 }}>
                                        <Typography variant="subtitle2" fontWeight="bold">Subject: {selectedTicket.subject}</Typography>
                                    </Alert>

                                    <Typography variant="caption" fontWeight="bold" color="textSecondary">DESCRIPTION</Typography>
                                    <Paper variant="outlined" sx={{ p: 2, mt: 1, mb: 3, bgcolor: '#fafafa', borderRadius: 2 }}>
                                        <Typography variant="body1" sx={{ whiteSpace: 'pre-wrap' }}>{selectedTicket.description}</Typography>
                                    </Paper>

                                    {/* Images */}
                                    {selectedTicket.images && selectedTicket.images.length > 0 && (
                                        <Box mb={3}>
                                            <Typography variant="caption" fontWeight="bold" color="textSecondary" display="block" mb={1}>EVIDENCE</Typography>
                                            <Stack direction="row" spacing={2} sx={{ overflowX: 'auto', pb: 1 }}>
                                                {selectedTicket.images.map((img, idx) => (
                                                    <Box key={idx} position="relative" sx={{ flexShrink: 0 }}>
                                                        <Box component="img" src={img.base64Data} onClick={() => window.open(img.base64Data)}
                                                            sx={{ width: 80, height: 80, borderRadius: 2, border: '2px solid #e2e8f0', objectFit: 'cover', cursor: 'zoom-in', '&:hover': { borderColor: '#3b82f6' } }} />
                                                        <Tooltip title="Download">
                                                            <IconButton size="small" onClick={(e) => { e.stopPropagation(); downloadImage(img.base64Data, idx); }}
                                                                sx={{ position: 'absolute', bottom: -8, right: -8, bgcolor: 'white', border: '1px solid #ddd', boxShadow: 2 }}>
                                                                <DownloadIcon fontSize="small" color="primary" />
                                                            </IconButton>
                                                        </Tooltip>
                                                    </Box>
                                                ))}
                                            </Stack>
                                        </Box>
                                    )}
                                </Box>

                               
                                <Box sx={{ width: { xs: '100%', md: '400px' }, display: 'flex', flexDirection: 'column', bgcolor: '#f8fafc' }}>
                                    <Box sx={{ flex: 1, p: 2, overflowY: 'auto' }}><TicketComments ticketId={selectedTicket.ticketId} /></Box>
                                    
                                    
                                    <Box sx={{ p: 3, borderTop: '1px solid #e2e8f0', bgcolor: 'white' }}>
                                        {selectedTicket.status === 'OPEN' && (
                                            <Button 
                                                fullWidth variant="outlined" color="error" 
                                                startIcon={<Cancel />} onClick={handleCancelTicket} 
                                                sx={{ borderRadius: 2, fontWeight: 'bold', mb: 1 }}
                                            >
                                                Cancel Request
                                            </Button>
                                        )}
                                        <Button fullWidth onClick={handleCloseDialog} variant="contained" sx={{ borderRadius: 2, fontWeight: 'bold' }}>Close</Button>
                                    </Box>
                                </Box>
                            </DialogContent>
                        </>
                    )}
                </Dialog>

            </Container>
        </Fade>
    );
};

export default BranchDashboard;