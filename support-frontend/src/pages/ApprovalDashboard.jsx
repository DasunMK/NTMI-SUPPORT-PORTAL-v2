import React, { useState, useEffect } from 'react';
import { 
    Container, Paper, Typography, Box, Button, Chip, Stack, 
    Dialog, DialogTitle, DialogContent, DialogActions, TextField, 
    Grid, Avatar, CircularProgress, Divider
} from '@mui/material';
import { 
    CheckCircle, Cancel, AttachMoney, Build, 
    Person, Business, AccessTime, Security, ReceiptLong 
} from '@mui/icons-material';
import { toast } from 'react-toastify';
import api from '../services/api';

const ApprovalDashboard = () => {
    const [tickets, setTickets] = useState([]);
    const [loading, setLoading] = useState(true);
    
    // Dialog State
    const [rejectDialog, setRejectDialog] = useState(false);
    const [selectedTicket, setSelectedTicket] = useState(null);
    const [rejectReason, setRejectReason] = useState("");

    // User Context
    const role = localStorage.getItem('role'); // "SUPER_ADMIN" or "ACCOUNT_HEAD"
    const isFinance = role === 'ACCOUNT_HEAD';

    useEffect(() => {
        fetchPendingApprovals();
    }, []);

    const fetchPendingApprovals = async () => {
        setLoading(true);
        try {
            const res = await api.get('/approvals/pending');
            setTickets(res.data);
        } catch (error) {
            console.error("Failed to load approvals", error);
            toast.error("Failed to load pending approvals.");
        } finally {
            setLoading(false);
        }
    };

    const handleApprove = async (id) => {
        try {
            await api.put(`/approvals/${id}/approve`);
            
            if (isFinance) {
                toast.success("Funds Authorized. Ticket moved to 'Ready for Repair'.");
            } else {
                // If cost was 0, this toast technically means "Sent to Repair" directly
                toast.success("Approval Granted. Ticket routed successfully.");
            }
            
            fetchPendingApprovals(); 
        } catch (error) {
            toast.error("Approval Failed");
        }
    };

    const handleRejectClick = (ticket) => {
        setSelectedTicket(ticket);
        setRejectDialog(true);
    };

    const submitReject = async () => {
        if (!rejectReason) return toast.warning("Please provide a reason.");
        try {
            await api.put(`/approvals/${selectedTicket.ticketId}/reject`, { reason: rejectReason });
            toast.error("Ticket Rejected & Returned to Admin");
            setRejectDialog(false);
            setRejectReason("");
            fetchPendingApprovals();
        } catch (error) {
            toast.error("Rejection Failed");
        }
    };

    if (loading) return <Box display="flex" justifyContent="center" mt={10}><CircularProgress /></Box>;

    return (
        <Container maxWidth="lg" sx={{ mt: 4, mb: 8 }}>
            
            {/* Header Banner */}
            <Paper elevation={0} sx={{ p: 4, mb: 4, borderRadius: 4, background: isFinance ? 'linear-gradient(135deg, #059669 0%, #10b981 100%)' : 'linear-gradient(135deg, #4f46e5 0%, #6366f1 100%)', color: 'white' }}>
                <Box display="flex" alignItems="center" gap={3}>
                    <Avatar sx={{ width: 64, height: 64, bgcolor: 'rgba(255,255,255,0.2)' }}>
                        {isFinance ? <AttachMoney fontSize="large" /> : <Security fontSize="large" />}
                    </Avatar>
                    <Box>
                        <Typography variant="h4" fontWeight="800">
                            {isFinance ? "Financial Approval Console" : "Technical Approval Console"}
                        </Typography>
                        <Typography variant="body1" sx={{ opacity: 0.9 }}>
                            {isFinance ? "Review budgets and authorize repair funds." : "Validate repair requests and technical assessments."}
                        </Typography>
                    </Box>
                </Box>
            </Paper>

            <Typography variant="h6" fontWeight="bold" gutterBottom sx={{ mb: 3, color: '#334155' }}>
                Pending Requests ({tickets.length})
            </Typography>

            {tickets.length === 0 ? (
                <Paper sx={{ p: 6, textAlign: 'center', borderRadius: 3, bgcolor: '#f8fafc' }}>
                    <CheckCircle sx={{ fontSize: 60, color: '#cbd5e1', mb: 2 }} />
                    <Typography color="textSecondary">All caught up! No pending approvals.</Typography>
                </Paper>
            ) : (
                <Grid container spacing={3}>
                    {tickets.map((t) => (
                        <Grid item xs={12} key={t.ticketId}>
                            <Paper elevation={0} sx={{ p: 3, borderRadius: 3, border: '1px solid #e2e8f0', display: 'flex', flexDirection: {xs: 'column', md: 'row'}, gap: 3 }}>
                                
                                {/* 1. Asset & Ticket Info */}
                                <Box flex={1}>
                                    <Stack direction="row" alignItems="center" spacing={2} mb={1}>
                                        <Chip label={`Ticket #${t.ticketId}`} size="small" sx={{ fontWeight: 'bold' }} />
                                        <Chip 
                                            label={t.status.replace('_', ' ')} 
                                            size="small" 
                                            color={isFinance ? "success" : "primary"} 
                                            variant="outlined" 
                                            sx={{ fontWeight: 'bold' }}
                                        />
                                    </Stack>
                                    <Typography variant="h6" fontWeight="bold" color="#1e293b">
                                        {t.subject}
                                    </Typography>
                                    <Typography variant="body2" color="textSecondary" mb={2}>
                                        {t.description}
                                    </Typography>
                                    
                                    <Stack direction="row" spacing={3} color="text.secondary" mb={2}>
                                        {t.asset && (
                                            <Box display="flex" alignItems="center" gap={1}>
                                                <Build fontSize="small" />
                                                <Typography variant="caption" fontWeight="bold">
                                                    {t.asset.brand} {t.asset.model}
                                                </Typography>
                                            </Box>
                                        )}
                                        <Box display="flex" alignItems="center" gap={1}>
                                            <Business fontSize="small" />
                                            <Typography variant="caption">{t.branch?.branchName}</Typography>
                                        </Box>
                                        <Box display="flex" alignItems="center" gap={1}>
                                            <Person fontSize="small" />
                                            <Typography variant="caption">{t.assignedAdmin?.fullName || "Admin"}</Typography>
                                        </Box>
                                    </Stack>

                                    <Paper variant="outlined" sx={{ p: 1.5, bgcolor: '#f8fafc', borderRadius: 2 }}>
                                        <Typography variant="caption" fontWeight="bold" color="textSecondary" display="block" mb={0.5}>
                                            PROPOSED REPAIR PLAN ({t.repairSource || 'EXTERNAL'})
                                        </Typography>
                                        <Typography variant="body2" sx={{ fontStyle: 'italic', color: '#334155' }}>
                                            "{t.repairDescription || 'No description provided by Admin.'}"
                                        </Typography>
                                    </Paper>
                                </Box>

                                {/* 2. Financials & Actions */}
                                <Box sx={{ minWidth: '250px', display: 'flex', flexDirection: 'column', justifyContent: 'center', textAlign: {xs: 'left', md: 'right'}, borderLeft: {md: '1px solid #e2e8f0'}, pl: {md: 3} }}>
                                    <Typography variant="caption" display="block" fontWeight="bold" color="textSecondary" mb={0.5}>
                                        ESTIMATED REPAIR COST
                                    </Typography>
                                    
                                    <Typography variant="h4" fontWeight="800" color={isFinance ? "#059669" : "#1e293b"} mb={2}>
                                        {t.estimatedCost ? `Rs. ${t.estimatedCost.toLocaleString()}` : "Rs. 0.00"}
                                    </Typography>

                                    <Stack direction="row" spacing={2} justifyContent={{xs: 'flex-start', md: 'flex-end'}}>
                                        <Button 
                                            variant="outlined" 
                                            color="error" 
                                            startIcon={<Cancel />} 
                                            onClick={() => handleRejectClick(t)}
                                        >
                                            Reject
                                        </Button>
                                        <Button 
                                            variant="contained" 
                                            color={isFinance ? "success" : "primary"} 
                                            startIcon={<CheckCircle />} 
                                            onClick={() => handleApprove(t.ticketId)}
                                            sx={{ fontWeight: 'bold', px: 3 }}
                                        >
                                            {isFinance ? "Authorize Funds" : "Approve Plan"}
                                        </Button>
                                    </Stack>
                                </Box>
                            </Paper>
                        </Grid>
                    ))}
                </Grid>
            )}

            {/* Reject Reason Dialog */}
            <Dialog open={rejectDialog} onClose={() => setRejectDialog(false)} maxWidth="sm" fullWidth>
                <DialogTitle>Reject Request #{selectedTicket?.ticketId}</DialogTitle>
                <DialogContent>
                    <Typography variant="body2" color="textSecondary" mb={2}>
                        Please provide a reason for rejecting this repair request. This will be sent to the Admin.
                    </Typography>
                    <TextField 
                        autoFocus 
                        margin="dense" 
                        label="Rejection Reason" 
                        fullWidth 
                        multiline 
                        rows={3} 
                        value={rejectReason}
                        onChange={(e) => setRejectReason(e.target.value)}
                    />
                </DialogContent>
                <DialogActions>
                    <Button onClick={() => setRejectDialog(false)}>Cancel</Button>
                    <Button onClick={submitReject} color="error" variant="contained">Confirm Rejection</Button>
                </DialogActions>
            </Dialog>

        </Container>
    );
};

export default ApprovalDashboard;