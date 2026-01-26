import React, { useState, useEffect } from 'react';
import { 
    Container, Paper, Typography, Box, Avatar, Grid, Button, 
    Divider, Chip, Stack, Fade, Tooltip, Table, TableBody, 
    TableCell, TableContainer, TableHead, TableRow, TextField, 
    InputAdornment, MenuItem, Dialog, DialogTitle, DialogContent, DialogActions 
} from '@mui/material';
import { 
    Person, Email, Phone, Business, Key, 
    AdminPanelSettings, VerifiedUser, CalendarMonth,
    Search, FilterList, Download, Visibility 
} from '@mui/icons-material';
import { toast } from 'react-toastify'; 
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import api from '../services/api';

const Profile = () => {
    // --- User Context ---
    const userId = localStorage.getItem('userId');
    const username = localStorage.getItem('username') || 'User';
    const email = localStorage.getItem('email') || 'user@ntmi.lk'; 
    const role = localStorage.getItem('role') || 'BRANCH_OFFICER';
    const branchName = localStorage.getItem('branchName') || 'Head Office';
    const lastLogin = new Date().toLocaleDateString();

    // --- State ---
    const [tickets, setTickets] = useState([]);
    const [filteredTickets, setFilteredTickets] = useState([]);
    const [searchQuery, setSearchQuery] = useState('');
    const [statusFilter, setStatusFilter] = useState('All');

    const [openPasswordDialog, setOpenPasswordDialog] = useState(false);
    const [passwords, setPasswords] = useState({ current: '', new: '', confirm: '' });


    useEffect(() => {
        fetchUserTickets();
    }, []);

    useEffect(() => {
        filterTickets();
    }, [tickets, searchQuery, statusFilter]);

    const fetchUserTickets = async () => {
        if (!userId) return;
        try {
            let endpoint = '';
            if (role === 'ADMIN') {
                endpoint = `/tickets/assigned-to/${userId}`;
            } else {
                endpoint = `/tickets/created-by/${userId}`;
            }

            const response = await api.get(endpoint);
            setTickets(response.data);
            setFilteredTickets(response.data);
        } catch (error) {
            console.error("Failed to load ticket history", error);
        }
    };

    const filterTickets = () => {
        let result = tickets;

        if (searchQuery) {
            const lowerQ = searchQuery.toLowerCase();
            result = result.filter(t => 
                String(t.ticketId).includes(lowerQ) || 
                t.errorCategory?.categoryName.toLowerCase().includes(lowerQ) ||
                t.subject?.toLowerCase().includes(lowerQ)
            );
        }

        if (statusFilter !== 'All') {
            result = result.filter(t => t.status === statusFilter);
        }

        setFilteredTickets(result);
    };


    const generatePDF = () => {
        const doc = new jsPDF();
        doc.setFillColor(30, 41, 59);
        doc.rect(0, 0, 210, 20, 'F');
        doc.setTextColor(255, 255, 255);
        doc.setFontSize(16);
        doc.text(`${username}'s Ticket History`, 14, 13);
        
        const tableColumn = ["ID", "Category", "Status", "Date", role === 'ADMIN' ? "Branch" : "Assigned To"];
        const tableRows = filteredTickets.map(t => [
            t.ticketId,
            t.errorCategory?.categoryName,
            t.status,
            new Date(t.createdAt).toLocaleDateString(),
            role === 'ADMIN' ? t.branch?.branchName : (t.assignedAdmin?.fullName || "Pending")
        ]);

        autoTable(doc, {
            head: [tableColumn], body: tableRows, startY: 30,
            theme: 'grid', headStyles: { fillColor: [30, 41, 59] }
        });
        doc.save(`My_Tickets_${new Date().toISOString().slice(0,10)}.pdf`);
    };

   
    const handleChangePassword = async () => {
        if (!passwords.current || !passwords.new || !passwords.confirm) {
            toast.warning("Please fill in all fields");
            return;
        }
        if (passwords.new !== passwords.confirm) {
            toast.error("New passwords do not match");
            return;
        }
        if (passwords.new.length < 6) {
            toast.warning("Password must be at least 6 characters");
            return;
        }

        try {
            await api.put('/users/change-password', {
                currentPassword: passwords.current,
                newPassword: passwords.new
            });
            toast.success("Password changed successfully!");
            setOpenPasswordDialog(false);
            setPasswords({ current: '', new: '', confirm: '' }); 
        } catch (error) {
            const msg = error.response?.data || "Failed to change password.";
            toast.error(typeof msg === 'string' ? msg : "An error occurred");
        }
    };

    
    const getRoleColor = (r) => r === 'ADMIN' ? 'error' : 'primary';
    const getStatusColor = (s) => {
        if (s === 'OPEN') return 'error';
        if (s === 'IN_PROGRESS') return 'warning';
        if (s === 'RESOLVED') return 'success';
        return 'default';
    };

    const InfoItem = ({ icon, label, value }) => (
        <Box display="flex" alignItems="center" gap={2} sx={{ p: 2, borderRadius: 3, bgcolor: '#f8fafc', border: '1px solid #e2e8f0', transition: 'all 0.2s', '&:hover': { bgcolor: 'white', borderColor: '#cbd5e1', boxShadow: 1 } }}>
            <Box sx={{ p: 1.5, borderRadius: 2, bgcolor: 'white', color: '#3b82f6', boxShadow: '0 2px 4px rgba(0,0,0,0.05)' }}>{icon}</Box>
            <Box>
                <Typography variant="caption" color="textSecondary" display="block" fontWeight="bold" sx={{ textTransform: 'uppercase', letterSpacing: 0.5 }}>{label}</Typography>
                <Typography variant="body1" fontWeight="600" color="#1e293b">{value}</Typography>
            </Box>
        </Box>
    );

    return (
        <Fade in={true} timeout={600}>
            <Container maxWidth="lg" sx={{ mt: 4, mb: 8 }}>
                
                {/* PROFILE HEADER */}
                <Box sx={{ position: 'relative', mb: 8 }}>
                    <Paper elevation={0} sx={{ height: 200, borderRadius: 4, background: 'linear-gradient(120deg, #1e293b 0%, #334155 100%)', position: 'relative', overflow: 'hidden' }}>
                        <Box sx={{ position: 'absolute', top: -50, right: -50, width: 200, height: 200, borderRadius: '50%', bgcolor: 'rgba(255,255,255,0.05)' }} />
                    </Paper>
                    <Box sx={{ position: 'absolute', bottom: -40, left: { xs: '50%', md: 40 }, transform: { xs: 'translateX(-50%)', md: 'none' }, display: 'flex', alignItems: 'flex-end', gap: 3 }}>
                        <Box position="relative">
                            <Avatar sx={{ width: 140, height: 140, bgcolor: 'white', color: '#1e293b', fontSize: 50, fontWeight: '800', border: '6px solid white', boxShadow: '0 10px 30px rgba(0,0,0,0.1)' }}>{username.charAt(0)}</Avatar>
                            <VerifiedUser sx={{ position: 'absolute', bottom: 10, right: 10, color: '#3b82f6', bgcolor: 'white', borderRadius: '50%' }} />
                        </Box>
                        <Box sx={{ mb: 1, display: { xs: 'none', md: 'block' } }}>
                            <Typography variant="h4" fontWeight="800" sx={{ color: 'white', textShadow: '0 2px 4px rgba(0,0,0,0.3)' }}>{username}</Typography>
                            <Stack direction="row" spacing={1} mt={1}>
                                <Chip label={role.replace('_', ' ')} color={getRoleColor(role)} size="small" sx={{ fontWeight: 'bold', border: '2px solid white' }} />
                                <Chip icon={<CalendarMonth sx={{ fontSize: '14px !important', color: 'inherit !important' }} />} label={`Active since ${lastLogin}`} size="small" sx={{ bgcolor: 'rgba(0,0,0,0.6)', color: 'white', backdropFilter: 'blur(4px)' }} />
                            </Stack>
                        </Box>
                    </Box>
                </Box>

                
                <Grid container spacing={4} sx={{ mt: 4 }}>
                    <Grid item xs={12} md={4}>
                        <Paper elevation={0} sx={{ p: 3, borderRadius: 4, border: '1px solid #e2e8f0', height: '100%' }}>
                            <Typography variant="h6" fontWeight="bold" gutterBottom>Details</Typography>
                            <Divider sx={{ mb: 3 }} />
                            <Stack spacing={2}>
                                <Box display="flex" justifyContent="space-between" alignItems="center">
                                    <Typography variant="body2" color="textSecondary">Status</Typography>
                                    <Chip label="Active" color="success" size="small" variant="soft" sx={{ fontWeight: 'bold', bgcolor: '#dcfce7', color: '#166534' }} />
                                </Box>
                                <Box display="flex" justifyContent="space-between" alignItems="center">
                                    <Typography variant="body2" color="textSecondary">Total Tickets</Typography>
                                    <Typography variant="body2" fontWeight="bold">{tickets.length}</Typography>
                                </Box>
                            </Stack>
                        </Paper>
                    </Grid>

                   
                    <Grid item xs={12} md={8}>
                        <Paper elevation={0} sx={{ p: 4, borderRadius: 4, border: '1px solid #e2e8f0' }}>
                            <Box display="flex" alignItems="center" gap={1} mb={3}>
                                <Person color="primary" />
                                <Typography variant="h6" fontWeight="bold">Personal Information</Typography>
                            </Box>
                            <Grid container spacing={3}>
                                <Grid item xs={12} sm={6}><InfoItem icon={<Person fontSize="small" />} label="Full Name" value={username} /></Grid>
                                <Grid item xs={12} sm={6}><InfoItem icon={<Email fontSize="small" />} label="Email Address" value={email} /></Grid>
                                <Grid item xs={12} sm={6}><InfoItem icon={<Phone fontSize="small" />} label="Phone Number" value="+94 7X XXX XXXX" /></Grid>
                                <Grid item xs={12} sm={6}><InfoItem icon={<Business fontSize="small" />} label="Branch Office" value={branchName} /></Grid>
                            </Grid>
                            
                            <Divider sx={{ my: 4 }} />
                            
                            <Box display="flex" alignItems="center" justifyContent="space-between">
                                <Box display="flex" alignItems="center" gap={1}>
                                    <AdminPanelSettings color="error" />
                                    <Typography variant="h6" fontWeight="bold">Security</Typography>
                                </Box>
                                <Button variant="outlined" startIcon={<Key />} onClick={() => setOpenPasswordDialog(true)} sx={{ borderRadius: 2, fontWeight: 'bold' }}>Change Password</Button>
                            </Box>
                        </Paper>
                    </Grid>
                </Grid>

                {/* TABLE */}
                <Box mt={6}>
                    <Paper elevation={0} sx={{ p: 4, borderRadius: 4, border: '1px solid #e2e8f0' }}>
                        <Box display="flex" justifyContent="space-between" alignItems="center" mb={3} flexWrap="wrap" gap={2}>
                            <Box>
                                <Typography variant="h6" fontWeight="bold">
                                    {role === 'ADMIN' ? 'My Work History' : 'My Support Requests'}
                                </Typography>
                                <Typography variant="body2" color="textSecondary">
                                    {role === 'ADMIN' ? 'Tickets assigned to and resolved by you.' : 'History of tickets you have raised.'}
                                </Typography>
                            </Box>
                            <Button startIcon={<Download />} onClick={generatePDF} variant="outlined" size="small">Export PDF</Button>
                        </Box>

                       
                        <Box display="flex" gap={2} mb={3}>
                            <TextField 
                                size="small" placeholder="Search ticket ID or subject..." 
                                value={searchQuery} onChange={(e) => setSearchQuery(e.target.value)}
                                InputProps={{ startAdornment: <InputAdornment position="start"><Search fontSize="small" /></InputAdornment> }}
                                sx={{ flexGrow: 1 }}
                            />
                            <TextField select size="small" value={statusFilter} onChange={(e) => setStatusFilter(e.target.value)} sx={{ minWidth: 150 }}>
                                <MenuItem value="All">All Statuses</MenuItem>
                                <MenuItem value="OPEN">Open</MenuItem>
                                <MenuItem value="IN_PROGRESS">In Progress</MenuItem>
                                <MenuItem value="RESOLVED">Resolved</MenuItem>
                            </TextField>
                        </Box>

                       
                        <TableContainer sx={{ border: '1px solid #f1f5f9', borderRadius: 2 }}>
                            <Table>
                                <TableHead sx={{ bgcolor: '#f8fafc' }}>
                                    <TableRow>
                                        <TableCell sx={{ fontWeight: 'bold', color: '#64748b' }}>ID</TableCell>
                                        <TableCell sx={{ fontWeight: 'bold', color: '#64748b' }}>CATEGORY / SUBJECT</TableCell>
                                        <TableCell sx={{ fontWeight: 'bold', color: '#64748b' }}>STATUS</TableCell>
                                        <TableCell sx={{ fontWeight: 'bold', color: '#64748b' }}>DATE</TableCell>
                                        <TableCell sx={{ fontWeight: 'bold', color: '#64748b' }}>
                                            {role === 'ADMIN' ? 'BRANCH' : 'ASSIGNED TO'}
                                        </TableCell>
                                    </TableRow>
                                </TableHead>
                                <TableBody>
                                    {filteredTickets.length === 0 ? (
                                        <TableRow>
                                            <TableCell colSpan={5} align="center" sx={{ py: 4, color: 'text.secondary' }}>No records found.</TableCell>
                                        </TableRow>
                                    ) : (
                                        filteredTickets.map((t) => (
                                            <TableRow key={t.ticketId} hover>
                                                <TableCell sx={{ fontWeight: 'bold', color: '#334155' }}>#{t.ticketId}</TableCell>
                                                <TableCell>
                                                    <Typography variant="body2" fontWeight="bold">{t.errorCategory?.categoryName}</Typography>
                                                    <Typography variant="caption" color="textSecondary">{t.subject || 'No Subject'}</Typography>
                                                </TableCell>
                                                <TableCell>
                                                    <Chip label={t.status.replace('_', ' ')} color={getStatusColor(t.status)} size="small" sx={{ fontWeight: 'bold', borderRadius: 1 }} />
                                                </TableCell>
                                                <TableCell>{new Date(t.createdAt).toLocaleDateString()}</TableCell>
                                                <TableCell>
                                                    {role === 'ADMIN' ? (
                                                        <Chip icon={<Business sx={{ fontSize: '14px !important' }} />} label={t.branch?.branchName} size="small" variant="outlined" />
                                                    ) : (
                                                        <Typography variant="body2">{t.assignedAdmin?.fullName || <span style={{ color: '#94a3b8', fontStyle: 'italic' }}>Pending</span>}</Typography>
                                                    )}
                                                </TableCell>
                                            </TableRow>
                                        ))
                                    )}
                                </TableBody>
                            </Table>
                        </TableContainer>
                    </Paper>
                </Box>

                {/* PASSWORD DIALOG */}
                <Dialog open={openPasswordDialog} onClose={() => setOpenPasswordDialog(false)} maxWidth="sm" fullWidth>
                    <DialogTitle fontWeight="bold">Change Password</DialogTitle>
                    <DialogContent>
                        <Stack spacing={2} mt={1}>
                            <TextField label="Current Password" type="password" fullWidth value={passwords.current} onChange={(e) => setPasswords({...passwords, current: e.target.value})} />
                            <TextField label="New Password" type="password" fullWidth value={passwords.new} onChange={(e) => setPasswords({...passwords, new: e.target.value})} />
                            <TextField label="Confirm New Password" type="password" fullWidth value={passwords.confirm} onChange={(e) => setPasswords({...passwords, confirm: e.target.value})} error={passwords.confirm && passwords.new !== passwords.confirm} helperText={passwords.confirm && passwords.new !== passwords.confirm ? "Passwords do not match" : ""} />
                        </Stack>
                    </DialogContent>
                    <DialogActions sx={{ p: 2 }}>
                        <Button onClick={() => setOpenPasswordDialog(false)}>Cancel</Button>
                        <Button variant="contained" onClick={handleChangePassword}>Update Password</Button>
                    </DialogActions>
                </Dialog>

            </Container>
        </Fade>
    );
};

export default Profile;