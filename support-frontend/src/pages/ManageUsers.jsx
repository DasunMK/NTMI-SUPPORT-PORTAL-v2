import React, { useState, useEffect } from 'react';
import { 
    Container, Paper, Typography, Box, Button, Table, TableBody, TableCell, 
    TableContainer, TableHead, TableRow, Chip, IconButton, Dialog, 
    DialogTitle, DialogContent, DialogActions, TextField, MenuItem, Fade,
    InputAdornment, Grid, Avatar, Tooltip, Stack, Divider // <--- ✅ Added Divider
} from '@mui/material';
import { 
    Add, Edit, Delete, Search, Download, FilterList, Security, Business, Key, 
    Person, Email, AdminPanelSettings, Badge
} from '@mui/icons-material';
import { toast } from 'react-toastify';
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import api from '../services/api';

const ManageUsers = () => {
    // --- State Management ---
    const [users, setUsers] = useState([]);
    const [filteredUsers, setFilteredUsers] = useState([]); 
    const [branches, setBranches] = useState([]);
    
    // UI States
    const [open, setOpen] = useState(false);
    const [isEdit, setIsEdit] = useState(false);
    
    // Filter States
    const [searchQuery, setSearchQuery] = useState('');
    const [roleFilter, setRoleFilter] = useState('All');
    const [branchFilter, setBranchFilter] = useState('All');

    // Form Data
    const [formData, setFormData] = useState({
        userId: null, username: '', password: '', fullName: '', 
        email: '', role: 'BRANCH_USER', branch: ''
    });
    const [errors, setErrors] = useState({});

    // --- 1. Data Fetching ---
    const fetchData = async () => {
        try {
            const [userRes, branchRes] = await Promise.all([
                api.get('/users'),
                api.get('/master-data/branches')
            ]);
            setUsers(userRes.data);
            setFilteredUsers(userRes.data);
            setBranches(branchRes.data);
        } catch (error) {
            console.error(error);
            toast.error("Failed to load user data");
        }
    };

    useEffect(() => { fetchData(); }, []);

    // --- 2. Filtering Logic ---
    useEffect(() => {
        let result = users;

        // Search
        if (searchQuery) {
            const q = searchQuery.toLowerCase();
            result = result.filter(u => 
                u.fullName.toLowerCase().includes(q) || 
                u.username.toLowerCase().includes(q) ||
                (u.email && u.email.toLowerCase().includes(q))
            );
        }

        // Role Filter
        if (roleFilter !== 'All') {
            result = result.filter(u => u.role === roleFilter);
        }

        // Branch Filter
        if (branchFilter !== 'All') {
            result = result.filter(u => u.branch && u.branch.branchName === branchFilter);
        }

        setFilteredUsers(result);
    }, [users, searchQuery, roleFilter, branchFilter]);

    // --- 3. Actions (PDF, CRUD) ---
    const generatePDF = () => {
        const doc = new jsPDF();
        doc.setFillColor(30, 41, 59); // Dark Slate
        doc.rect(0, 0, 210, 20, 'F');
        doc.setTextColor(255, 255, 255);
        doc.setFontSize(16);
        doc.text("NTMI System Users", 14, 13);
        
        const tableColumn = ["ID", "Full Name", "Username", "Role", "Branch", "Email"];
        const tableRows = filteredUsers.map(u => [
            u.userId, u.fullName, u.username, u.role, 
            u.branch ? u.branch.branchName : "Head Office", u.email || "-"
        ]);

        autoTable(doc, {
            head: [tableColumn], body: tableRows, startY: 30,
            theme: 'grid', headStyles: { fillColor: [30, 41, 59] }
        });
        doc.save('NTMI_Users.pdf');
    };

    const validate = () => {
        let tempErrors = {};
        if (!formData.fullName.trim()) tempErrors.fullName = "Required";
        if (!formData.username.trim()) tempErrors.username = "Required";
        if (!formData.email) tempErrors.email = "Required";
        if (!isEdit && !formData.password) tempErrors.password = "Required";
        if (formData.password && formData.password.length < 6) tempErrors.password = "Min 6 chars";
        if (formData.role === 'BRANCH_USER' && !formData.branch) tempErrors.branch = "Required";
        setErrors(tempErrors);
        return Object.keys(tempErrors).length === 0;
    };

    const handleOpen = (user = null) => {
        setErrors({});
        if (user) {
            setFormData({
                userId: user.userId, username: user.username, password: '', 
                fullName: user.fullName, email: user.email, role: user.role, 
                branch: user.branch ? user.branch.branchId : ''
            });
            setIsEdit(true);
        } else {
            setFormData({
                userId: null, username: '', password: '', fullName: '', 
                email: '', role: 'BRANCH_USER', branch: ''
            });
            setIsEdit(false);
        }
        setOpen(true);
    };

    const handleSubmit = async () => {
        if (!validate()) return;
        try {
            const payload = { ...formData };
            if (payload.role === 'ADMIN') payload.branch = null;
            else payload.branch = payload.branch ? { branchId: payload.branch } : null;

            if (isEdit && !payload.password) delete payload.password;

            if (isEdit) {
                await api.put(`/users/${formData.userId}`, payload);
                toast.success("User updated successfully");
            } else {
                await api.post('/users', payload);
                toast.success("User created successfully");
            }
            setOpen(false);
            fetchData();
        } catch (error) {
            toast.error(error.response?.data || "Operation Failed");
        }
    };

    const handleDelete = async (id) => {
        if(!window.confirm("Are you sure? This action cannot be undone.")) return;
        try {
            await api.delete(`/users/${id}`);
            toast.success("User deleted");
            fetchData();
        } catch (error) { toast.error("Delete failed"); }
    };

    return (
        <Fade in={true} timeout={600}>
            <Container maxWidth="xl" sx={{ mt: 4, mb: 6 }}>
                
                {/* 1. HERO HEADER */}
                <Paper 
                    elevation={0}
                    sx={{ 
                        p: 4, mb: 4, borderRadius: 4, 
                        background: 'linear-gradient(135deg, #1e293b 0%, #334155 100%)',
                        color: 'white', position: 'relative', overflow: 'hidden',
                        display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 2
                    }}
                >
                    {/* Decorative Circle */}
                    <Box sx={{ position: 'absolute', top: -40, right: -40, width: 200, height: 200, borderRadius: '50%', bgcolor: 'rgba(255,255,255,0.05)' }} />
                    
                    <Box sx={{ position: 'relative', zIndex: 1 }}>
                        <Typography variant="h4" fontWeight="800" sx={{ mb: 0.5 }}>User Management</Typography>
                        <Stack direction="row" spacing={1} alignItems="center" sx={{ opacity: 0.8 }}>
                            <Badge sx={{ fontSize: 16 }} />
                            <Typography variant="body1">
                                Total Users: <strong>{users.length}</strong>
                            </Typography>
                        </Stack>
                    </Box>

                    <Stack direction="row" spacing={2} sx={{ position: 'relative', zIndex: 1 }}>
                        <Button 
                            variant="outlined" 
                            startIcon={<Download />} 
                            onClick={generatePDF} 
                            sx={{ color: 'white', borderColor: 'rgba(255,255,255,0.3)', '&:hover': { borderColor: 'white', bgcolor: 'rgba(255,255,255,0.1)' } }}
                        >
                            Export List
                        </Button>
                        <Button 
                            variant="contained" 
                            startIcon={<Add />} 
                            onClick={() => handleOpen()} 
                            sx={{ bgcolor: '#3b82f6', fontWeight: 'bold', '&:hover': { bgcolor: '#2563eb' } }}
                        >
                            Add New User
                        </Button>
                    </Stack>
                </Paper>

                {/* 2. SEARCH & FILTERS */}
                <Paper elevation={0} sx={{ p: 2, mb: 4, borderRadius: 3, border: '1px solid #e2e8f0', bgcolor: 'white' }}>
                    <Stack direction={{ xs: 'column', md: 'row' }} spacing={2} alignItems="center">
                        <TextField 
                            size="small" placeholder="Search by Name or Email..." 
                            value={searchQuery} onChange={(e) => setSearchQuery(e.target.value)}
                            InputProps={{ startAdornment: <InputAdornment position="start"><Search color="action"/></InputAdornment> }}
                            sx={{ flexGrow: 1 }}
                        />
                        
                        <Stack direction="row" spacing={2}>
                            <Box display="flex" alignItems="center" gap={1}>
                                <FilterList color="action" />
                                <TextField 
                                    select size="small" label="Role" sx={{ minWidth: 150 }}
                                    value={roleFilter} onChange={(e) => setRoleFilter(e.target.value)}
                                >
                                    <MenuItem value="All">All Roles</MenuItem>
                                    <MenuItem value="ADMIN">Admin</MenuItem>
                                    <MenuItem value="BRANCH_USER">Branch User</MenuItem>
                                </TextField>
                            </Box>

                            <TextField 
                                select size="small" label="Branch" sx={{ minWidth: 200 }}
                                value={branchFilter} onChange={(e) => setBranchFilter(e.target.value)}
                            >
                                <MenuItem value="All">All Branches</MenuItem>
                                {branches.map(b => <MenuItem key={b.branchId} value={b.branchName}>{b.branchName}</MenuItem>)}
                            </TextField>
                        </Stack>
                    </Stack>
                </Paper>

                {/* 3. USERS TABLE */}
                <TableContainer component={Paper} elevation={0} sx={{ borderRadius: 3, border: '1px solid #e2e8f0', overflow: 'hidden' }}>
                    <Table>
                        <TableHead sx={{ bgcolor: '#f8fafc' }}>
                            <TableRow>
                                <TableCell sx={{ fontWeight: 'bold', color: '#64748b' }}>USER PROFILE</TableCell>
                                <TableCell sx={{ fontWeight: 'bold', color: '#64748b' }}>ROLE</TableCell>
                                <TableCell sx={{ fontWeight: 'bold', color: '#64748b' }}>ASSIGNED BRANCH</TableCell>
                                <TableCell align="right" sx={{ fontWeight: 'bold', color: '#64748b' }}>ACTIONS</TableCell>
                            </TableRow>
                        </TableHead>
                        <TableBody>
                            {filteredUsers.length === 0 ? (
                                <TableRow>
                                    <TableCell colSpan={4} align="center" sx={{ py: 8, color: 'text.secondary' }}>
                                        <Typography variant="h6" color="text.disabled">No users found.</Typography>
                                    </TableCell>
                                </TableRow>
                            ) : (
                                filteredUsers.map((u) => (
                                    <TableRow key={u.userId} hover sx={{ '&:last-child td, &:last-child th': { border: 0 } }}>
                                        <TableCell>
                                            <Box display="flex" alignItems="center" gap={2}>
                                                <Avatar 
                                                    sx={{ 
                                                        bgcolor: u.role === 'ADMIN' ? '#e11d48' : '#3b82f6', 
                                                        width: 42, height: 42, fontSize: 16, fontWeight: 'bold',
                                                        boxShadow: '0 2px 5px rgba(0,0,0,0.1)'
                                                    }}
                                                >
                                                    {u.fullName.charAt(0)}
                                                </Avatar>
                                                <Box>
                                                    <Typography variant="body2" fontWeight="bold" color="#1e293b">{u.fullName}</Typography>
                                                    <Typography variant="caption" color="textSecondary">{u.username} • {u.email}</Typography>
                                                </Box>
                                            </Box>
                                        </TableCell>
                                        <TableCell>
                                            <Chip 
                                                icon={u.role === 'ADMIN' ? <AdminPanelSettings sx={{ fontSize: '16px !important' }} /> : <Security sx={{ fontSize: '16px !important' }} />} 
                                                label={u.role === 'BRANCH_USER' ? 'Branch User' : 'Administrator'} 
                                                color={u.role === 'ADMIN' ? 'error' : 'primary'} 
                                                size="small" variant="outlined" sx={{ fontWeight: 'bold', borderRadius: 1 }}
                                            />
                                        </TableCell>
                                        <TableCell>
                                            <Box display="flex" alignItems="center" gap={1} color="text.secondary">
                                                <Business fontSize="small" sx={{ opacity: 0.7 }} />
                                                <Typography variant="body2" fontWeight="medium">
                                                    {u.branch ? u.branch.branchName : "Head Office (System Wide)"}
                                                </Typography>
                                            </Box>
                                        </TableCell>
                                        <TableCell align="right">
                                            <Stack direction="row" justifyContent="flex-end" spacing={1}>
                                                <Tooltip title="Edit User">
                                                    <IconButton color="primary" size="small" onClick={() => handleOpen(u)} sx={{ bgcolor: '#eff6ff', '&:hover': { bgcolor: '#dbeafe' } }}>
                                                        <Edit fontSize="small" />
                                                    </IconButton>
                                                </Tooltip>
                                                <Tooltip title="Delete User">
                                                    <IconButton color="error" size="small" onClick={() => handleDelete(u.userId)} sx={{ bgcolor: '#fef2f2', '&:hover': { bgcolor: '#fee2e2' } }}>
                                                        <Delete fontSize="small" />
                                                    </IconButton>
                                                </Tooltip>
                                            </Stack>
                                        </TableCell>
                                    </TableRow>
                                ))
                            )}
                        </TableBody>
                    </Table>
                </TableContainer>

                {/* 4. USER DIALOG (Well Organized Form) */}
                <Dialog open={open} onClose={() => setOpen(false)} maxWidth="sm" fullWidth PaperProps={{ sx: { borderRadius: 3 } }}>
                    <DialogTitle sx={{ borderBottom: '1px solid #f1f5f9', pb: 2, bgcolor: '#f8fafc' }}>
                        <Typography variant="h6" fontWeight="bold">
                            {isEdit ? 'Edit User Profile' : 'Create New Account'}
                        </Typography>
                    </DialogTitle>
                    
                    <DialogContent sx={{ pt: 3 }}>
                        <Stack spacing={3} mt={1}>
                            
                            {/* Section 1: Identity */}
                            <Box>
                                <Typography variant="caption" fontWeight="800" color="textSecondary" sx={{ letterSpacing: 1 }}>IDENTITY</Typography>
                                <Divider sx={{ my: 1 }} />
                                <Grid container spacing={2} mt={0}>
                                    <Grid item xs={12} sm={6}>
                                        <TextField 
                                            label="Full Name" fullWidth size="small"
                                            value={formData.fullName} onChange={(e) => setFormData({...formData, fullName: e.target.value})}
                                            error={!!errors.fullName} helperText={errors.fullName}
                                            InputProps={{ startAdornment: <InputAdornment position="start"><Person fontSize="small" color="action"/></InputAdornment> }}
                                        />
                                    </Grid>
                                    <Grid item xs={12} sm={6}>
                                        <TextField 
                                            label="Email Address" fullWidth size="small"
                                            value={formData.email} onChange={(e) => setFormData({...formData, email: e.target.value})} 
                                            error={!!errors.email} helperText={errors.email}
                                            InputProps={{ startAdornment: <InputAdornment position="start"><Email fontSize="small" color="action"/></InputAdornment> }}
                                        />
                                    </Grid>
                                </Grid>
                            </Box>

                            {/* Section 2: Credentials */}
                            <Box>
                                <Typography variant="caption" fontWeight="800" color="textSecondary" sx={{ letterSpacing: 1 }}>CREDENTIALS</Typography>
                                <Divider sx={{ my: 1 }} />
                                <Grid container spacing={2} mt={0}>
                                    <Grid item xs={12} sm={6}>
                                        <TextField 
                                            label="Username" fullWidth size="small"
                                            value={formData.username} onChange={(e) => setFormData({...formData, username: e.target.value})} 
                                            error={!!errors.username} helperText={errors.username}
                                        />
                                    </Grid>
                                    <Grid item xs={12} sm={6}>
                                        <TextField 
                                            label={isEdit ? "New Password (Optional)" : "Password"} 
                                            type="password" fullWidth size="small"
                                            value={formData.password} onChange={(e) => setFormData({...formData, password: e.target.value})} 
                                            error={!!errors.password} helperText={errors.password}
                                            InputProps={{ startAdornment: <InputAdornment position="start"><Key fontSize="small" color="action"/></InputAdornment> }}
                                        />
                                    </Grid>
                                </Grid>
                            </Box>

                            {/* Section 3: Access Control */}
                            <Box>
                                <Typography variant="caption" fontWeight="800" color="textSecondary" sx={{ letterSpacing: 1 }}>ACCESS CONTROL</Typography>
                                <Divider sx={{ my: 1 }} />
                                <Grid container spacing={2} mt={0}>
                                    <Grid item xs={12} sm={6}>
                                        <TextField 
                                            select label="System Role" fullWidth size="small"
                                            value={formData.role} onChange={(e) => setFormData({...formData, role: e.target.value})}
                                        >
                                            <MenuItem value="BRANCH_USER">Branch Officer</MenuItem>
                                            <MenuItem value="ADMIN">System Administrator</MenuItem>
                                        </TextField>
                                    </Grid>
                                    <Grid item xs={12} sm={6}>
                                        <TextField 
                                            select label="Branch Assignment" fullWidth size="small"
                                            value={formData.branch} onChange={(e) => setFormData({...formData, branch: e.target.value})}
                                            error={!!errors.branch} helperText={errors.branch || (formData.role === 'ADMIN' ? 'Not applicable for Admin' : '')}
                                            disabled={formData.role === 'ADMIN'}
                                        >
                                            <MenuItem value=""><em>Select Branch</em></MenuItem>
                                            {branches.map((b) => (
                                                <MenuItem key={b.branchId} value={b.branchId}>{b.branchName}</MenuItem>
                                            ))}
                                        </TextField>
                                    </Grid>
                                </Grid>
                            </Box>

                        </Stack>
                    </DialogContent>

                    <DialogActions sx={{ p: 3, borderTop: '1px solid #f1f5f9', bgcolor: '#f8fafc' }}>
                        <Button onClick={() => setOpen(false)} sx={{ color: 'text.secondary', fontWeight: 'bold' }}>Cancel</Button>
                        <Button variant="contained" onClick={handleSubmit} sx={{ borderRadius: 2, px: 3, fontWeight: 'bold' }}>
                            {isEdit ? 'Save Changes' : 'Create User'}
                        </Button>
                    </DialogActions>
                </Dialog>

            </Container>
        </Fade>
    );
};

export default ManageUsers;