import React, { useState, useEffect } from 'react';
import { 
    Container, Paper, Typography, Box, Grid, Chip, Button, 
    TextField, MenuItem, IconButton, Dialog, DialogTitle, DialogContent, 
    DialogActions, Card, CardContent, Avatar, Fade, CircularProgress,
    InputAdornment, Divider, Alert
} from '@mui/material';
import { 
    Search, Business, AccessTime, Close, 
    PlayArrow, CheckCircle, Person, Category, Warning
} from '@mui/icons-material';
import { toast } from 'react-toastify';
import api from '../services/api';

const AdminDashboard = () => {
    // --- State ---
    const [tickets, setTickets] = useState([]);
    const [filteredTickets, setFilteredTickets] = useState([]);
    const [stats, setStats] = useState({ total: 0, open: 0, pending: 0 });
    const [loading, setLoading] = useState(true);

    const [searchQuery, setSearchQuery] = useState('');
    const [statusFilter, setStatusFilter] = useState('All');

    const [selectedTicket, setSelectedTicket] = useState(null);
    const [openDialog, setOpenDialog] = useState(false);

    // --- Fetch Data ---
    const fetchTickets = async () => {
        try {
            const response = await api.get('/tickets');
            const allData = response.data;

            // 1. FILTER: Hide Resolved/Closed/Cancelled immediately
            const activeTickets = allData.filter(t => 
                t.status === 'OPEN' || t.status === 'IN_PROGRESS'
            );
            
            // 2. SORT: Open tickets first, then oldest to newest (FIFO)
            activeTickets.sort((a, b) => {
                if (a.status === 'OPEN' && b.status !== 'OPEN') return -1;
                if (a.status !== 'OPEN' && b.status === 'OPEN') return 1;
                return new Date(a.createdAt) - new Date(b.createdAt);
            });

            setTickets(activeTickets);
            setFilteredTickets(activeTickets);
            calculateStats(activeTickets);
        } catch (error) {
            console.error(error);
            toast.error("Failed to load tickets");
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => { fetchTickets(); }, []);

    // --- Stats ---
    const calculateStats = (data) => {
        setStats({
            total: data.length,
            open: data.filter(t => t.status === 'OPEN').length,
            pending: data.filter(t => t.status === 'IN_PROGRESS').length
        });
    };

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
        if (!window.confirm("Mark as Resolved? This will remove it from the dashboard.")) return;
        try {
            await api.put(`/tickets/${ticketId}/close`);
            toast.success("Ticket Resolved");
            setOpenDialog(false);
            fetchTickets();
        } catch (error) { toast.error("Failed to resolve ticket"); }
    };

    // --- Styles ---
    const getStatusColor = (status) => {
        return status === 'OPEN' ? '#d32f2f' : '#ed6c02'; // Red or Orange
    };

    if (loading) return <Box display="flex" justifyContent="center" height="80vh" alignItems="center"><CircularProgress /></Box>;

    return (
        <Fade in={true} timeout={600}>
            <Container maxWidth="xl" sx={{ mt: 4, mb: 6 }}>
                
                {/* 1. HEADER & STATS */}
                <Box mb={4}>
                    <Typography variant="h4" fontWeight="800" color="#1e293b" gutterBottom>
                        Active Issues
                    </Typography>
                    <Grid container spacing={3}>
                        <Grid item xs={12} sm={4}>
                            <Paper sx={{ p: 2, bgcolor: '#e3f2fd', borderLeft: '6px solid #1976d2', borderRadius: 2 }}>
                                <Typography variant="h4" fontWeight="bold" color="primary">{stats.total}</Typography>
                                <Typography variant="subtitle2" sx={{ opacity: 0.7 }}>Active Tickets</Typography>
                            </Paper>
                        </Grid>
                        <Grid item xs={12} sm={4}>
                            <Paper sx={{ p: 2, bgcolor: '#ffebee', borderLeft: '6px solid #d32f2f', borderRadius: 2 }}>
                                <Typography variant="h4" fontWeight="bold" color="error">{stats.open}</Typography>
                                <Typography variant="subtitle2" sx={{ opacity: 0.7 }}>Unassigned (Open)</Typography>
                            </Paper>
                        </Grid>
                        <Grid item xs={12} sm={4}>
                            <Paper sx={{ p: 2, bgcolor: '#fff3e0', borderLeft: '6px solid #ed6c02', borderRadius: 2 }}>
                                <Typography variant="h4" fontWeight="bold" color="warning.main">{stats.pending}</Typography>
                                <Typography variant="subtitle2" sx={{ opacity: 0.7 }}>In Progress</Typography>
                            </Paper>
                        </Grid>
                    </Grid>
                </Box>

                {/* 2. FILTERS */}
                <Paper sx={{ p: 2, mb: 4, borderRadius: 3, display: 'flex', gap: 2, alignItems: 'center', bgcolor: 'white' }} elevation={1}>
                    <InputAdornment position="start"><Search color="action" /></InputAdornment>
                    <TextField 
                        placeholder="Search ID, Branch or Person..." 
                        variant="standard" 
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        sx={{ flexGrow: 1 }}
                        InputProps={{ disableUnderline: true }}
                    />
                    <Divider orientation="vertical" flexItem sx={{ height: 28, alignSelf: 'center' }} />
                    <TextField 
                        select 
                        variant="standard"
                        value={statusFilter} 
                        onChange={(e) => setStatusFilter(e.target.value)} 
                        sx={{ minWidth: 150 }}
                        InputProps={{ disableUnderline: true }}
                    >
                        <MenuItem value="All">All Active</MenuItem>
                        <MenuItem value="OPEN">Open</MenuItem>
                        <MenuItem value="IN_PROGRESS">In Progress</MenuItem>
                    </TextField>
                </Paper>

                {/* 3. TICKET CARDS */}
                <Grid container spacing={3}>
                    {filteredTickets.map((ticket) => {
                        const statusColor = getStatusColor(ticket.status);
                        
                        return (
                            <Grid item xs={12} sm={6} md={4} lg={3} key={ticket.ticketId}>
                                <Card 
                                    elevation={3}
                                    sx={{ 
                                        borderRadius: 3, height: '100%', display: 'flex', flexDirection: 'column',
                                        transition: 'all 0.2s', borderTop: `4px solid ${statusColor}`,
                                        '&:hover': { transform: 'translateY(-4px)', boxShadow: 6 },
                                    }}
                                >
                                    <CardContent sx={{ flexGrow: 1, p: 2.5 }}>
                                        
                                        {/* Row 1: ID & Status */}
                                        <Box display="flex" justifyContent="space-between" alignItems="center" mb={2}>
                                            <Chip label={`#${ticket.ticketId}`} size="small" sx={{ fontWeight: 'bold', bgcolor: '#f1f5f9' }} />
                                            <Chip 
                                                label={ticket.status.replace('_', ' ')} 
                                                size="small" 
                                                sx={{ 
                                                    fontWeight: 'bold', fontSize: '0.7rem', 
                                                    bgcolor: `${statusColor}15`, color: statusColor 
                                                }} 
                                            />
                                        </Box>

                                        {/* Row 2: Branch (Prominent) */}
                                        <Box display="flex" alignItems="center" gap={1} mb={2}>
                                            <Business color="primary" fontSize="small" />
                                            <Typography variant="subtitle1" fontWeight="bold">
                                                {ticket.branch?.branchName || 'Unknown Branch'}
                                            </Typography>
                                        </Box>

                                        <Divider sx={{ my: 1.5, borderStyle: 'dashed' }} />

                                        {/* Row 3: Technical Details */}
                                        <Grid container spacing={1} mb={2}>
                                            <Grid item xs={12}>
                                                <Box display="flex" gap={1}>
                                                    <Category fontSize="small" color="action" />
                                                    <Box>
                                                        <Typography variant="caption" display="block" color="textSecondary">Category</Typography>
                                                        <Typography variant="body2" fontWeight="medium">
                                                            {ticket.errorCategory?.categoryName} - {ticket.errorType?.typeName}
                                                        </Typography>
                                                    </Box>
                                                </Box>
                                            </Grid>
                                        </Grid>

                                        {/* Row 4: People & Time */}
                                        <Box display="flex" flexDirection="column" gap={1.5}>
                                            <Box display="flex" alignItems="center" gap={1}>
                                                <Person fontSize="small" color="action" />
                                                <Typography variant="body2">
                                                    {ticket.createdBy?.fullName || 'Unknown User'}
                                                </Typography>
                                            </Box>
                                            <Box display="flex" alignItems="center" gap={1}>
                                                <AccessTime fontSize="small" color="action" />
                                                <Typography variant="body2">
                                                    {new Date(ticket.createdAt).toLocaleString()}
                                                </Typography>
                                            </Box>
                                        </Box>

                                        <Box mt={3}>
                                            <Button 
                                                variant="outlined" fullWidth size="small"
                                                onClick={() => { setSelectedTicket(ticket); setOpenDialog(true); }}
                                                sx={{ borderRadius: 2, textTransform: 'none' }}
                                            >
                                                View & Action
                                            </Button>
                                        </Box>

                                    </CardContent>
                                </Card>
                            </Grid>
                        );
                    })}
                </Grid>

                {/* 4. ACTION DIALOG (Shows full details + Actions) */}
                <Dialog open={openDialog} onClose={() => setOpenDialog(false)} maxWidth="sm" fullWidth>
                    {selectedTicket && (
                        <>
                            <DialogTitle sx={{ bgcolor: '#f8fafc', borderBottom: '1px solid #e2e8f0' }}>
                                <Typography variant="h6" fontWeight="bold">Ticket #{selectedTicket.ticketId}</Typography>
                            </DialogTitle>
                            
                            <DialogContent sx={{ pt: 3 }}>
                                <Alert severity="info" sx={{ mb: 2 }}>
                                    <strong>Subject:</strong> {selectedTicket.subject || 'No Subject'}
                                </Alert>
                                <Typography variant="caption" fontWeight="bold" color="textSecondary">DESCRIPTION</Typography>
                                <Paper variant="outlined" sx={{ p: 2, mt: 0.5, mb: 3, bgcolor: '#fafafa' }}>
                                    <Typography variant="body2">{selectedTicket.description || 'No description provided.'}</Typography>
                                </Paper>

                                <Grid container spacing={2}>
                                    <Grid item xs={6}>
                                        <Typography variant="caption" color="textSecondary">BRANCH</Typography>
                                        <Typography variant="body2" fontWeight="bold">{selectedTicket.branch?.branchName}</Typography>
                                    </Grid>
                                    <Grid item xs={6}>
                                        <Typography variant="caption" color="textSecondary">RAISED BY</Typography>
                                        <Typography variant="body2" fontWeight="bold">{selectedTicket.createdBy?.fullName}</Typography>
                                    </Grid>
                                    <Grid item xs={12}>
                                        <Typography variant="caption" color="textSecondary">ASSIGNED TO</Typography>
                                        <Typography variant="body2" fontWeight="bold">
                                            {selectedTicket.assignedUser ? selectedTicket.assignedUser.fullName : 'Unassigned'}
                                        </Typography>
                                    </Grid>
                                </Grid>
                            </DialogContent>

                            <DialogActions sx={{ p: 3, borderTop: '1px solid #e2e8f0', justifyContent: 'space-between' }}>
                                {selectedTicket.status === 'OPEN' ? (
                                    <Button 
                                        variant="contained" color="primary" fullWidth
                                        startIcon={<PlayArrow />} onClick={() => handleStartTicket(selectedTicket.ticketId)}
                                    >
                                        Accept Ticket
                                    </Button>
                                ) : (
                                    <Button 
                                        variant="contained" color="success" fullWidth
                                        startIcon={<CheckCircle />} onClick={() => handleCloseTicket(selectedTicket.ticketId)}
                                    >
                                        Mark Resolved
                                    </Button>
                                )}
                            </DialogActions>
                        </>
                    )}
                </Dialog>

            </Container>
        </Fade>
    );
};

export default AdminDashboard;