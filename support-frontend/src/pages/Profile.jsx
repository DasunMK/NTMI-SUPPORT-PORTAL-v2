import React, { useEffect, useState } from 'react';
import { 
    Container, Paper, Typography, Box, Grid, Avatar, CircularProgress, 
    Table, TableBody, TableCell, TableContainer, TableHead, TableRow, 
    Chip, TextField, MenuItem, FormControl, InputLabel, Select, Fade, 
    InputAdornment, Dialog, DialogTitle, DialogContent, DialogActions, Alert, Button 
} from '@mui/material';
import { 
    Business, Email, Phone, FilterList, CalendarToday, Build, 
    AssignmentInd, Person, AccountCircle, Refresh, Download as DownloadIcon, Image as ImageIcon 
} from '@mui/icons-material';
import api from '../services/api';
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';

// Backend URL for images (Adjust if your images are hosted elsewhere)
const API_BASE_URL = 'http://localhost:8080';

const PALETTE = [
  { bg: '#e3f2fd', text: '#1565c0', border: '#90caf9' },
  { bg: '#e8f5e9', text: '#2e7d32', border: '#a5d6a7' },
  { bg: '#f3e5f5', text: '#7b1fa2', border: '#ce93d8' },
  { bg: '#fff3e0', text: '#e65100', border: '#ffcc80' },
  { bg: '#ffebee', text: '#c62828', border: '#ef9a9a' },
  { bg: '#e0f2f1', text: '#00695c', border: '#80cbc4' },
  { bg: '#fff8e1', text: '#ff8f00', border: '#ffe082' },
  { bg: '#eceff1', text: '#37474f', border: '#b0bec5' },
];

const Profile = () => {
    const [user, setUser] = useState(null);
    const [tickets, setTickets] = useState([]);
    const [filteredTickets, setFilteredTickets] = useState([]);
    const [loading, setLoading] = useState(true);
    const [userColorMap, setUserColorMap] = useState({});
    const [selectedTicket, setSelectedTicket] = useState(null);

    const [filterUser, setFilterUser] = useState('All'); 
    const [filterStatus, setFilterStatus] = useState('All');
    const [filterCategory, setFilterCategory] = useState('All'); 
    const [filterType, setFilterType] = useState('All'); 
    const [dateRange, setDateRange] = useState({ start: '', end: '' });

    const [branches, setBranches] = useState([]);
    const [admins, setAdmins] = useState([]); 
    const [categories, setCategories] = useState([]); 
    const [types, setTypes] = useState([]); 

    const userId = localStorage.getItem('userId');

    const fetchData = async () => {
        try {
            const userRes = await api.get(`/users/${userId}`);
            setUser(userRes.data);

            const [branchRes, catRes, typeRes, allUsersRes] = await Promise.all([
                api.get('/master-data/branches'),
                api.get('/master-data/categories'),
                api.get('/master-data/types'),
                api.get('/users')
            ]);

            setBranches(branchRes.data || []);
            setCategories(catRes.data || []);
            setTypes(typeRes.data || []);

            const allUsers = allUsersRes.data || [];
            setAdmins(allUsers.filter(u => u.role === 'OPS' || u.role === 'ADMIN')); 

            const ticketRes = await api.get('/tickets');
            
            // ROBUST FILTER
            const myTickets = ticketRes.data.filter(t => {
                const tUserId = t.user?.userId || t.userId || t.createdBy;
                // If it's an object, try to get the ID from inside it
                const finalId = (typeof tUserId === 'object' && tUserId !== null) 
                    ? (tUserId.userId || tUserId.id) 
                    : tUserId;

                return String(finalId) === String(userId);
            });
            
            myTickets.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));

            setTickets(myTickets);
            setFilteredTickets(myTickets);
            setLoading(false);

        } catch (error) {
            console.error("Error loading profile data", error);
            setLoading(false);
        }
    };

    useEffect(() => {
        if (userId) fetchData();
    }, [userId]);

    useEffect(() => {
        if (tickets.length > 0) {
            const uniqueAdmins = [...new Set(tickets.map(t => t.assignedUser?.fullName).filter(Boolean))];
            const newColorMap = {};
            uniqueAdmins.forEach((adminName, index) => {
                newColorMap[adminName] = PALETTE[index % PALETTE.length];
            });
            setUserColorMap(newColorMap);
        }
    }, [tickets]);

    useEffect(() => {
        let result = tickets;

        if (filterUser !== 'All') result = result.filter(t => t.assignedUser?.fullName === filterUser);
        if (filterStatus !== 'All') result = result.filter(t => t.status === filterStatus);
        if (filterCategory !== 'All') result = result.filter(t => t.errorCategory?.categoryName === filterCategory);
        if (filterType !== 'All') result = result.filter(t => t.errorType?.typeName === filterType);
        
        if (dateRange.start) result = result.filter(t => t.createdAt >= dateRange.start);
        if (dateRange.end) result = result.filter(t => t.createdAt <= dateRange.end + "T23:59:59");

        setFilteredTickets(result);
    }, [tickets, filterUser, filterStatus, filterCategory, filterType, dateRange]);

    const availableTypes = filterCategory === 'All' 
        ? types 
        : types.filter(t => t.category?.categoryName === filterCategory);

    const generatePDF = () => {
        const doc = new jsPDF();
        doc.text(`My Ticket History - ${user?.fullName}`, 14, 15);
        
        const tableColumn = ["ID", "Category", "Type", "Fixed By", "Date", "Status"];
        const tableRows = [];

        filteredTickets.forEach(t => {
            const ticketData = [
                t.ticketId,
                t.errorCategory?.categoryName || "-",
                t.errorType?.typeName || "-",
                t.assignedUser?.fullName || "Unassigned",
                new Date(t.createdAt).toLocaleDateString(),
                t.status
            ];
            tableRows.push(ticketData);
        });

        autoTable(doc, {
            head: [tableColumn],
            body: tableRows,
            startY: 20,
        });

        doc.save(`My_Tickets.pdf`);
    };

    // Helper to safely construct image URL
    const getImageUrl = (path) => {
        if (!path) return null;
        if (path.startsWith('http')) return path; // Already absolute
        // Remove leading slash if present to avoid double slashes
        const cleanPath = path.startsWith('/') ? path.substring(1) : path;
        return `${API_BASE_URL}/${cleanPath}`;
    };

    if (loading) return <Box display="flex" justifyContent="center" mt={10}><CircularProgress /></Box>;

    return (
        <Fade in={true} timeout={800}>
            <Container maxWidth="xl" sx={{ mt: 4, mb: 4 }}>
                
                {/* USER CARD */}
                <Paper elevation={3} sx={{ p: 4, mb: 5, borderRadius: 3, display: 'flex', alignItems: 'center', gap: 4, flexWrap: 'wrap' }}>
                    <Avatar sx={{ width: 100, height: 100, bgcolor: 'primary.main', fontSize: 40 }}>
                        {user?.fullName?.charAt(0)}
                    </Avatar>
                    <Box flexGrow={1}>
                        <Typography variant="h4" fontWeight="bold" color="primary">{user?.fullName}</Typography>
                        <Typography variant="subtitle1" color="textSecondary" gutterBottom>{user?.role} Account</Typography>
                        <Grid container spacing={2} mt={1}>
                            <Grid size={{ xs: 12, sm: 4 }} display="flex" alignItems="center" gap={1}>
                                <Business color="action" /> <Typography>{user?.branch ? user.branch.branchName : 'Head Office'}</Typography>
                            </Grid>
                            <Grid size={{ xs: 12, sm: 4 }} display="flex" alignItems="center" gap={1}>
                                <Email color="action" /> <Typography>{user?.email}</Typography>
                            </Grid>
                            <Grid size={{ xs: 12, sm: 4 }} display="flex" alignItems="center" gap={1}>
                                <Phone color="action" /> <Typography>{user?.phone || 'No Phone'}</Typography>
                            </Grid>
                        </Grid>
                    </Box>
                </Paper>

                {/* HEADER */}
                <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
                    <Typography variant="h5" fontWeight="bold" sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                        <FilterList /> My Tickets
                    </Typography>
                    <Box sx={{ display: 'flex', gap: 2 }}>
                        <Button variant="outlined" startIcon={<Refresh />} onClick={fetchData}>Refresh</Button>
                        <Button variant="contained" color="secondary" startIcon={<DownloadIcon />} onClick={generatePDF}>Download PDF</Button>
                    </Box>
                </Box>

                {/* FILTERS */}
                <Paper sx={{ p: 2, mb: 3, bgcolor: '#f5f5f5' }}>
                    <Grid container spacing={2} alignItems="center">
                        <Grid size={{ xs: 12, md: 1 }} sx={{ display: 'flex', alignItems: 'center', color: 'text.secondary' }}>
                            <FilterList sx={{ mr: 1 }} /> Filters:
                        </Grid>
                        
                        <Grid size={{ xs: 12, md: 2 }}>
                            <TextField select fullWidth size="small" label="Category" value={filterCategory} onChange={(e) => {
                                setFilterCategory(e.target.value);
                                setFilterType('All'); 
                            }}>
                                <MenuItem value="All">All Categories</MenuItem>
                                {categories.map((c) => <MenuItem key={c.categoryId} value={c.categoryName}>{c.categoryName}</MenuItem>)}
                            </TextField>
                        </Grid>

                        <Grid size={{ xs: 12, md: 2 }}>
                            <TextField select fullWidth size="small" label="Error Type" value={filterType} onChange={(e) => setFilterType(e.target.value)}>
                                <MenuItem value="All">All Types</MenuItem>
                                {availableTypes.map((t) => <MenuItem key={t.typeId} value={t.typeName}>{t.typeName}</MenuItem>)}
                            </TextField>
                        </Grid>

                        <Grid size={{ xs: 12, md: 2 }}>
                            <TextField select fullWidth size="small" label="Status" value={filterStatus} onChange={(e) => setFilterStatus(e.target.value)}>
                                <MenuItem value="All">All</MenuItem>
                                <MenuItem value="OPEN">Open</MenuItem>
                                <MenuItem value="IN_PROGRESS">Active</MenuItem>
                                <MenuItem value="RESOLVED">Resolved</MenuItem>
                                <MenuItem value="CLOSED">Closed</MenuItem>
                            </TextField>
                        </Grid>

                        <Grid size={{ xs: 12, md: 2 }}>
                            <TextField select fullWidth size="small" label="Fixed By" value={filterUser} onChange={(e) => setFilterUser(e.target.value)}>
                                <MenuItem value="All">All Technicians</MenuItem>
                                {admins.map((u) => <MenuItem key={u.userId} value={u.fullName}>{u.fullName}</MenuItem>)}
                            </TextField>
                        </Grid>

                        <Grid size={{ xs: 6, md: 1.5 }}>
                            <TextField type="date" fullWidth size="small" label="From" InputLabelProps={{ shrink: true }} value={dateRange.start} onChange={(e) => setDateRange({...dateRange, start: e.target.value})} />
                        </Grid>
                        <Grid size={{ xs: 6, md: 1.5 }}>
                            <TextField type="date" fullWidth size="small" label="To" InputLabelProps={{ shrink: true }} value={dateRange.end} onChange={(e) => setDateRange({...dateRange, end: e.target.value})} />
                        </Grid>

                        <Grid size={{ xs: 12 }} sx={{ display: 'flex', justifyContent: 'flex-end' }}>
                            <Button size="small" color="error" onClick={() => {
                                setFilterUser('All'); setFilterStatus('All'); 
                                setFilterCategory('All'); setFilterType('All');
                                setDateRange({start:'', end:''});
                            }}>Clear Filters</Button>
                        </Grid>
                    </Grid>
                </Paper>

                {/* TABLE */}
                <TableContainer component={Paper} elevation={3}>
                    <Table>
                        <TableHead sx={{ bgcolor: '#eeeeee' }}>
                            <TableRow>
                                <TableCell><strong>ID</strong></TableCell>
                                <TableCell><strong>Branch</strong></TableCell>
                                <TableCell><strong>Issue Type</strong></TableCell>
                                <TableCell><strong>Description</strong></TableCell>
                                <TableCell><strong>Date</strong></TableCell>
                                <TableCell><strong>Fixed By</strong></TableCell>
                                <TableCell><strong>Status</strong></TableCell>
                            </TableRow>
                        </TableHead>
                        <TableBody>
                            {filteredTickets.length === 0 ? (
                                <TableRow><TableCell colSpan={7} align="center">No tickets found.</TableCell></TableRow>
                            ) : (
                                filteredTickets.map((t) => {
                                    const adminName = t.assignedUser?.fullName;
                                    const userColors = userColorMap[adminName] || { bg: '#f5f5f5', text: '#616161', border: '#e0e0e0' };

                                    return (
                                        <TableRow 
                                            key={t.ticketId} 
                                            hover 
                                            onClick={() => setSelectedTicket(t)} 
                                            sx={{ cursor: 'pointer' }}
                                        >
                                            <TableCell>#{t.ticketId}</TableCell>
                                            <TableCell>{t.branch?.branchName}</TableCell>
                                            <TableCell>
                                                <strong>{t.errorCategory?.categoryName}</strong>
                                                <Typography variant="caption" display="block" color="text.secondary">
                                                    {t.errorType?.typeName}
                                                </Typography>
                                            </TableCell>
                                            <TableCell sx={{ maxWidth: 200 }}>
                                                <Typography variant="body2" noWrap title={t.description}>
                                                    {t.description || "No description"}
                                                </Typography>
                                            </TableCell>
                                            <TableCell>{new Date(t.createdAt).toLocaleDateString()}</TableCell>
                                            <TableCell>
                                                {adminName ? (
                                                    <Chip 
                                                        icon={<Build sx={{ fontSize: '14px !important', color: `${userColors.text} !important` }} />} 
                                                        label={adminName} 
                                                        size="small" 
                                                        sx={{ borderRadius: 1, fontWeight: 'bold', bgcolor: userColors.bg, color: userColors.text, border: `1px solid ${userColors.border}` }}
                                                    />
                                                ) : <Typography variant="caption" color="textSecondary">-</Typography>}
                                            </TableCell>
                                            <TableCell>
                                                <Chip 
                                                    label={t.status.replace('_', ' ')} 
                                                    color={t.status === 'RESOLVED' ? 'success' : t.status === 'IN_PROGRESS' ? 'warning' : 'error'} 
                                                    size="small" sx={{ fontWeight: 'bold', minWidth: 80 }}
                                                />
                                            </TableCell>
                                        </TableRow>
                                    );
                                })
                            )}
                        </TableBody>
                    </Table>
                </TableContainer>

                {/* --- POPUP DETAIL WITH IMAGE --- */}
                {selectedTicket && (
                    <Dialog open={Boolean(selectedTicket)} onClose={() => setSelectedTicket(null)} fullWidth maxWidth="sm">
                        <DialogTitle sx={{ bgcolor: '#f5f5f5', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                            <Box>
                                <Typography variant="subtitle1" fontWeight="bold">Ticket Details</Typography>
                                <Typography variant="caption" color="text.secondary">#{selectedTicket.ticketId}</Typography>
                            </Box>
                            <Chip 
                                label={selectedTicket.status.replace('_', ' ')} 
                                color={selectedTicket.status === 'RESOLVED' ? 'success' : selectedTicket.status === 'IN_PROGRESS' ? 'warning' : 'error'} 
                                size="small" 
                            />
                        </DialogTitle>
                        
                        <DialogContent dividers>
                            <Grid container spacing={2}>
                                <Grid size={{ xs: 6 }}>
                                    <Typography variant="caption" color="text.secondary">Branch</Typography>
                                    <Typography variant="body1" fontWeight="bold">{selectedTicket.branch?.branchName}</Typography>
                                </Grid>
                                <Grid size={{ xs: 6 }}>
                                    <Typography variant="caption" color="text.secondary">Date</Typography>
                                    <Typography variant="body1">{new Date(selectedTicket.createdAt).toLocaleDateString()}</Typography>
                                </Grid>
                                <Grid size={{ xs: 12 }}>
                                    <Typography variant="caption" color="text.secondary">Category</Typography>
                                    <Typography variant="body1" fontWeight="bold">{selectedTicket.errorCategory?.categoryName} - {selectedTicket.errorType?.typeName}</Typography>
                                </Grid>
                                
                                <Grid size={{ xs: 12 }}>
                                    <Typography variant="caption" color="text.secondary">Description</Typography>
                                    <Paper variant="outlined" sx={{ p: 1.5, bgcolor: '#fafafa', maxHeight: 150, overflow: 'auto' }}>
                                        <Typography variant="body2">{selectedTicket.description}</Typography>
                                    </Paper>
                                </Grid>

                                {/* --- IMAGE SECTION --- */}
                                <Grid size={{ xs: 12 }}>
                                    <Typography variant="caption" color="text.secondary" sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
                                        <ImageIcon fontSize="small" /> Attachment
                                    </Typography>
                                    
                                    {selectedTicket.imageUrl ? (
                                        <Box 
                                            sx={{ mt: 1, display: 'flex', justifyContent: 'center', bgcolor: '#f5f5f5', borderRadius: 2, p: 1, border: '1px dashed #bdbdbd' }}
                                        >
                                            <img 
                                                src={getImageUrl(selectedTicket.imageUrl)} 
                                                alt="Ticket Evidence" 
                                                style={{ maxWidth: '100%', maxHeight: '300px', borderRadius: '4px', objectFit: 'contain' }} 
                                                onError={(e) => { e.target.onerror = null; e.target.src = 'https://via.placeholder.com/400x200?text=Image+Not+Found'; }}
                                            />
                                        </Box>
                                    ) : (
                                        <Box sx={{ mt: 1, p: 2, textAlign: 'center', bgcolor: '#f9f9f9', borderRadius: 1, color: 'text.secondary', border: '1px solid #eee' }}>
                                            <Typography variant="body2" sx={{ fontStyle: 'italic' }}>No image attached to this ticket.</Typography>
                                        </Box>
                                    )}
                                </Grid>

                                {selectedTicket.assignedUser && (
                                    <Grid size={{ xs: 12 }}>
                                         <Alert severity="info" icon={<AccountCircle />}>
                                            Fixed By: <strong>{selectedTicket.assignedUser.fullName}</strong>
                                         </Alert>
                                    </Grid>
                                )}
                            </Grid>
                        </DialogContent>
                        
                        <DialogActions>
                            <Button onClick={() => setSelectedTicket(null)} variant="contained">Close</Button>
                        </DialogActions>
                    </Dialog>
                )}
            </Container>
        </Fade>
    );
};

export default Profile;