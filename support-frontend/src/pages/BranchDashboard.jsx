import React, { useState, useEffect } from 'react';
import { 
    Container, Paper, Typography, Box, Card, CardContent, 
    Avatar, Divider, Fade, Button, CircularProgress,
    Dialog, DialogTitle, DialogContent, DialogActions, Chip // <--- Imported these
} from '@mui/material';
import { 
    ConfirmationNumber, PendingActions, CheckCircle, 
    LocationOn, Category, Description, AccessTime, Add, 
    Cancel, Close // <--- Imported Icons
} from '@mui/icons-material';
import { useNavigate } from 'react-router-dom';
import { toast } from 'react-toastify'; // Use Toast for notifications
import api from '../services/api';

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
    
    // --- New State for Popup ---
    const [selectedTicket, setSelectedTicket] = useState(null);
    const [openDialog, setOpenDialog] = useState(false);

    const branchName = localStorage.getItem('branchName') || 'My Branch';

    // Fetch Data Function (Reusable)
    const fetchDashboardData = async () => {
        try {
            const branchId = localStorage.getItem('branchId');
            if (!branchId) return;

            const response = await api.get(`/tickets/branch/${branchId}`);
            const allTickets = response.data;
            
            const sortedTickets = allTickets.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
            setTickets(sortedTickets);

            setStats({
                total: allTickets.length,
                open: allTickets.filter(t => t.status === 'OPEN').length,
                inProgress: allTickets.filter(t => t.status === 'IN_PROGRESS').length,
                resolved: allTickets.filter(t => t.status === 'RESOLVED').length
            });
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

    // Open Modal
    const handleTicketClick = (ticket) => {
        setSelectedTicket(ticket);
        setOpenDialog(true);
    };

    // Close Modal
    const handleCloseDialog = () => {
        setOpenDialog(false);
        setSelectedTicket(null);
    };

    // Cancel Ticket Logic
    const handleCancelTicket = async () => {
        if (!selectedTicket) return;
        
        // Confirm before cancelling
        if (!window.confirm("Are you sure you want to cancel this ticket?")) return;

        try {
            await api.put(`/tickets/${selectedTicket.ticketId}/cancel`);
            toast.success("Ticket Cancelled Successfully");
            handleCloseDialog();
            fetchDashboardData(); // Refresh the list
        } catch (error) {
            toast.error("Failed to cancel ticket");
            console.error(error);
        }
    };

    const KpiCard = ({ title, value, icon, color }) => (
        <Paper 
            elevation={2} 
            sx={{ 
                p: 3, display: 'flex', justifyContent: 'space-between', alignItems: 'center',
                borderRadius: 3, borderLeft: `5px solid ${color}`, flex: '1 1 200px'
            }}
        >
            <Box>
                <Typography variant="subtitle2" color="textSecondary" fontWeight="bold">{title}</Typography>
                <Typography variant="h4" fontWeight="bold" color="textPrimary">{value}</Typography>
            </Box>
            <Box sx={{ bgcolor: `${color}20`, p: 1.5, borderRadius: '50%', color: color }}>
                {icon}
            </Box>
        </Paper>
    );

    if (loading) return <Box display="flex" justifyContent="center" mt={10}><CircularProgress /></Box>;

    return (
        <Fade in={true} timeout={800}>
            <Container maxWidth="xl" sx={{ mt: 4, mb: 4 }}>
                
                {/* Header */}
                <Box display="flex" justifyContent="space-between" alignItems="center" mb={4}>
                    <Box>
                        <Typography variant="h4" fontWeight="bold" color="primary">Dashboard</Typography>
                        <Typography variant="subtitle1" color="textSecondary">Overview for <strong>{branchName}</strong></Typography>
                    </Box>
                    <Button variant="contained" startIcon={<Add />} onClick={() => navigate('/create-ticket')} sx={{ borderRadius: 2, px: 3 }}>
                        Raise Ticket
                    </Button>
                </Box>

                {/* Stats */}
                <Box display="flex" gap={3} mb={5} flexWrap="wrap">
                    <KpiCard title="Total Tickets" value={stats.total} icon={<ConfirmationNumber />} color="#1976d2" />
                    <KpiCard title="Pending" value={stats.open} icon={<PendingActions />} color="#d32f2f" />
                    <KpiCard title="In Progress" value={stats.inProgress} icon={<Category />} color="#ed6c02" />
                    <KpiCard title="Resolved" value={stats.resolved} icon={<CheckCircle />} color="#2e7d32" />
                </Box>

                <Typography variant="h5" fontWeight="bold" gutterBottom>Recent Tickets</Typography>

                {/* Ticket Grid */}
                <Box display="grid" gridTemplateColumns="repeat(auto-fill, minmax(300px, 1fr))" gap={3}>
                    {tickets.map((ticket) => {
                        const statusColor = getStatusColor(ticket.status);
                        return (
                            <Card 
                                key={ticket.ticketId} 
                                elevation={3} 
                                onClick={() => handleTicketClick(ticket)}
                                sx={{ 
                                    borderRadius: 2, 
                                    borderLeft: `6px solid ${statusColor}`,
                                    cursor: 'pointer',
                                    transition: 'transform 0.2s',
                                    '&:hover': { transform: 'scale(1.02)' }
                                }}
                            >
                                {/* Status Banner */}
                                <Box sx={{ bgcolor: statusColor, color: 'white', py: 0.5, textAlign: 'center', fontWeight: 'bold', fontSize: '0.85rem' }}>
                                    {ticket.status.replace('_', ' ')}
                                </Box>

                                <CardContent sx={{ pt: 2, pb: 1 }}>
                                    
                                    {/* Ticket ID */}
                                    <Box display="flex" justifyContent="space-between" alignItems="center" mb={2}>
                                        <Typography variant="h6" color="primary" fontWeight="bold">
                                            TKT-{ticket.ticketId}
                                        </Typography>
                                    </Box>

                                    <Divider sx={{ mb: 2 }} />

                                    {/* Ticket Details Grid */}
                                    <Box display="flex" flexDirection="column" gap={1.5}>
                                        
                                        {/* Error Category */}
                                        <Box display="flex" justifyContent="space-between">
                                            <Typography variant="body2" color="textSecondary" fontWeight="bold">Category:</Typography>
                                            <Typography variant="body2" fontWeight="medium">
                                                {ticket.errorCategory ? ticket.errorCategory.categoryName : '-'}
                                            </Typography>
                                        </Box>

                                        {/* Error Type */}
                                        <Box display="flex" justifyContent="space-between">
                                            <Typography variant="body2" color="textSecondary" fontWeight="bold">Type:</Typography>
                                            <Typography variant="body2" fontWeight="medium">
                                                {ticket.errorType ? ticket.errorType.typeName : '-'}
                                            </Typography>
                                        </Box>

                                        {/* Raised By */}
                                        <Box display="flex" justifyContent="space-between">
                                            <Typography variant="body2" color="textSecondary" fontWeight="bold">Raised By:</Typography>
                                            <Typography variant="body2" fontWeight="medium">
                                                {ticket.createdBy ? ticket.createdBy.fullName : 'Unknown'}
                                            </Typography>
                                        </Box>

                                        {/* Date & Time */}
                                        <Box display="flex" justifyContent="space-between">
                                            <Typography variant="body2" color="textSecondary" fontWeight="bold">Date:</Typography>
                                            <Typography variant="caption" sx={{ bgcolor: '#f5f5f5', px: 1, py: 0.5, borderRadius: 1 }}>
                                                {new Date(ticket.createdAt).toLocaleString()}
                                            </Typography>
                                        </Box>

                                    </Box>
                                </CardContent>
                            </Card>
                        );
                    })}
                </Box>

                {/* --- DETAILS POPUP (DIALOG) --- */}
                <Dialog open={openDialog} onClose={handleCloseDialog} maxWidth="sm" fullWidth>
                    {selectedTicket && (
                        <>
                            <DialogTitle sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', bgcolor: '#f5f5f5' }}>
                                <Box>
                                    <Typography variant="h6" fontWeight="bold">Ticket Details</Typography>
                                    <Typography variant="caption" color="textSecondary">TKT-{selectedTicket.ticketId}</Typography>
                                </Box>
                                <Chip 
                                    label={selectedTicket.status.replace('_', ' ')} 
                                    sx={{ bgcolor: getStatusColor(selectedTicket.status), color: 'white', fontWeight: 'bold' }} 
                                />
                            </DialogTitle>
                            
                            <DialogContent dividers>
                                <Box display="flex" flexDirection="column" gap={2}>
                                    <Box>
                                        <Typography variant="caption" color="textSecondary" fontWeight="bold">SUBJECT</Typography>
                                        <Typography variant="body1">{selectedTicket.subject}</Typography>
                                    </Box>
                                    <Box>
                                        <Typography variant="caption" color="textSecondary" fontWeight="bold">DESCRIPTION</Typography>
                                        <Paper elevation={0} sx={{ p: 2, bgcolor: '#f9f9f9', borderRadius: 2 }}>
                                            <Typography variant="body2">{selectedTicket.description}</Typography>
                                        </Paper>
                                    </Box>
                                    <Box display="flex" gap={4}>
                                        <Box>
                                            <Typography variant="caption" color="textSecondary" fontWeight="bold">CATEGORY</Typography>
                                            <Typography variant="body2">{selectedTicket.errorCategory?.categoryName || '-'}</Typography>
                                        </Box>
                                        <Box>
                                            <Typography variant="caption" color="textSecondary" fontWeight="bold">TYPE</Typography>
                                            <Typography variant="body2">{selectedTicket.errorType?.typeName || '-'}</Typography>
                                        </Box>
                                    </Box>
                                    
                                    <Divider />
                                    
                                    <Box display="flex" alignItems="center" gap={2}>
                                        <Avatar sx={{ bgcolor: selectedTicket.assignedUser ? '#1976d2' : '#bdbdbd' }}>
                                            {selectedTicket.assignedUser?.fullName.charAt(0) || '?'}
                                        </Avatar>
                                        <Box>
                                            <Typography variant="caption" color="textSecondary" fontWeight="bold">ASSIGNED TECHNICIAN</Typography>
                                            <Typography variant="body2">
                                                {selectedTicket.assignedUser ? selectedTicket.assignedUser.fullName : "Waiting for assignment..."}
                                            </Typography>
                                        </Box>
                                    </Box>
                                </Box>
                            </DialogContent>
                            
                            <DialogActions sx={{ p: 2 }}>
                                {/* Only show Cancel button if ticket is OPEN */}
                                {selectedTicket.status === 'OPEN' && (
                                    <Button 
                                        variant="outlined" 
                                        color="error" 
                                        startIcon={<Cancel />} 
                                        onClick={handleCancelTicket}
                                        sx={{ mr: 'auto' }} // Pushes button to the left
                                    >
                                        Cancel Ticket
                                    </Button>
                                )}
                                <Button onClick={handleCloseDialog} variant="contained" color="primary">
                                    Close Details
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