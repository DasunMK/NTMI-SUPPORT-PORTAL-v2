import React, { useState, useEffect } from 'react';
import { 
    Container, Paper, Typography, Box, Button, Table, TableBody, TableCell, 
    TableContainer, TableHead, TableRow, Chip, IconButton, Dialog, 
    DialogTitle, DialogContent, DialogActions, TextField, MenuItem, Fade,
    InputAdornment, Stack, Avatar, Tooltip
} from '@mui/material';
import { 
    Add, Edit, Search, Download, FilterList, Security, Business, 
    Person, AdminPanelSettings, Block, CheckCircle, RestoreFromTrash
} from '@mui/icons-material';
import { toast } from 'react-toastify';
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import api from '../services/api';

const ManageUsers = () => {
   
    const [users, setUsers] = useState([]);
    const [filteredUsers, setFilteredUsers] = useState([]); 
    const [branches, setBranches] = useState([]);
    
    const [open, setOpen] = useState(false);
    const [isEdit, setIsEdit] = useState(false);
    
    const [searchQuery, setSearchQuery] = useState('');
    const [roleFilter, setRoleFilter] = useState('All');
    const [branchFilter, setBranchFilter] = useState('All');
    
    const [formData, setFormData] = useState({
        userId: null, username: '', password: '', fullName: '', 
        email: '', role: 'BRANCH_USER', branch: ''
    });
    const [errors, setErrors] = useState({});

    // Get Current User Role for Permission Logic
    const currentUserRole = localStorage.getItem('role');

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

    useEffect(() => {
        let result = users;
        if (searchQuery) {
            const q = searchQuery.toLowerCase();
            result = result.filter(u => 
                u.fullName.toLowerCase().includes(q) || 
                u.username.toLowerCase().includes(q) ||
                (u.email && u.email.toLowerCase().includes(q))
            );
        }
        if (roleFilter !== 'All') result = result.filter(u => u.role === roleFilter);
        if (branchFilter !== 'All') result = result.filter(u => u.branch && u.branch.branchName === branchFilter);
        setFilteredUsers(result);
    }, [users, searchQuery, roleFilter, branchFilter]);

    // Dynamic Role Options based on who is logged in
    const getRoleOptions = () => {
        let options = [
            { value: "BRANCH_USER", label: "Branch User" },
            { value: "ADMIN", label: "Admin (IT Support)" }
        ];

        // Only SUPER_ADMIN can create high-level roles
        if (currentUserRole === 'SUPER_ADMIN') {
            options.push({ value: "SUPER_ADMIN", label: "Super Admin (Technical Head)" });
            options.push({ value: "ACCOUNT_HEAD", label: "Account Head (Finance)" });
        }

        return options;
    };

    // Helper for Avatar Colors
    const getRoleColor = (role) => {
        if (role === 'SUPER_ADMIN') return '#ca3838'; // Indigo
        if (role === 'ACCOUNT_HEAD') return '#12cf21'; // Emerald Green
        if (role === 'ADMIN') return '#1d2ae1'; // Red
        return '#3bf6ae'; // Blue
    };

    const generatePDF = () => {
        const doc = new jsPDF();
        doc.setFillColor(30, 41, 59); 
        doc.rect(0, 0, 210, 20, 'F');
        doc.setTextColor(255, 255, 255);
        doc.setFontSize(16);
        doc.text("NTMI System Users", 14, 13);
        
        const tableColumn = ["ID", "Full Name", "Username", "Role", "Branch", "Status"];
        const tableRows = filteredUsers.map(u => [
            u.userId, u.fullName, u.username, u.role, 
            u.branch ? u.branch.branchName : "Head Office", u.active ? "Active" : "Inactive"
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
            // Roles without branches
            if (['ADMIN', 'SUPER_ADMIN', 'ACCOUNT_HEAD'].includes(payload.role)) {
                payload.branch = null;
            } else {
                // Branch Users need a branch object
                payload.branch = payload.branch ? { branchId: payload.branch } : null;
            }

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
            // Handling specific backend error messages (e.g., security violations)
            const msg = error.response?.data?.message || error.response?.data || "Operation Failed";
            toast.error(typeof msg === 'string' ? msg : "Operation Failed");
        }
    };

    const handleToggleStatus = async (user) => {
        if (user.active) {
            if(!window.confirm("Are you sure you want to DEACTIVATE this user?")) return;
            try {
                await api.delete(`/users/${user.userId}`);
                toast.success("User deactivated");
                fetchData();
            } catch (error) { toast.error(error.response?.data?.message || "Deactivation failed"); }
        } else {
            if(!window.confirm("Do you want to REACTIVATE this account?")) return;
            try {
                await api.put(`/users/${user.userId}/activate`);
                toast.success("User restored");
                fetchData();
            } catch (error) { toast.error("Reactivation failed"); }
        }
    };

    return (
        <Fade in={true} timeout={600}>
            <Container maxWidth="xl" sx={{ mt: 4, mb: 6 }}>
                
                {/* Header Banner */}
                <Paper 
                    elevation={0}
                    sx={{ 
                        p: 4, mb: 4, borderRadius: 4, 
                        background: 'linear-gradient(135deg, #1e293b 0%, #334155 100%)',
                        color: 'white', position: 'relative', overflow: 'hidden',
                        display: 'flex', justifyContent: 'space-between', alignItems: 'center'
                    }}
                >
                    <Box sx={{ position: 'relative', zIndex: 1 }}>
                        <Typography variant="h4" fontWeight="800" sx={{ mb: 0.5 }}>User Management</Typography>
                        <Stack direction="row" spacing={1} alignItems="center" sx={{ opacity: 0.8 }}>
                            <Person sx={{ fontSize: 16 }} />
                            <Typography variant="body1">Total Accounts: <strong>{users.length}</strong></Typography>
                        </Stack>
                    </Box>
                    <Stack direction="row" spacing={2} sx={{ position: 'relative', zIndex: 1 }}>
                        <Button variant="outlined" startIcon={<Download />} onClick={generatePDF} sx={{ color: 'white', borderColor: 'rgba(255,255,255,0.3)' }}>Export</Button>
                        <Button variant="contained" startIcon={<Add />} onClick={() => handleOpen()} sx={{ bgcolor: '#3b82f6', fontWeight: 'bold' }}>Add User</Button>
                    </Stack>
                </Paper>

                {/* Filters */}
                <Paper elevation={0} sx={{ p: 2, mb: 4, borderRadius: 3, border: '1px solid #e2e8f0', bgcolor: 'white' }}>
                    <Stack direction={{ xs: 'column', md: 'row' }} spacing={2} alignItems="center">
                        <TextField 
                            size="small" placeholder="Search users..." 
                            value={searchQuery} onChange={(e) => setSearchQuery(e.target.value)}
                            InputProps={{ startAdornment: <InputAdornment position="start"><Search color="action"/></InputAdornment> }}
                            sx={{ flexGrow: 1 }}
                        />
                        <Stack direction="row" spacing={2}>
                            <Box display="flex" alignItems="center" gap={1}>
                                <FilterList color="action" />
                                <TextField select size="small" label="Role" sx={{ minWidth: 150 }} value={roleFilter} onChange={(e) => setRoleFilter(e.target.value)}>
                                    <MenuItem value="All">All Roles</MenuItem>
                                    {/* ✅ UPDATED: Added new roles to filter */}
                                    <MenuItem value="SUPER_ADMIN">Super Admin</MenuItem>
                                    <MenuItem value="ACCOUNT_HEAD">Account Head</MenuItem>
                                    <MenuItem value="ADMIN">Admin</MenuItem>
                                    <MenuItem value="BRANCH_USER">Branch User</MenuItem>
                                </TextField>
                            </Box>
                            <TextField select size="small" label="Branch" sx={{ minWidth: 200 }} value={branchFilter} onChange={(e) => setBranchFilter(e.target.value)}>
                                <MenuItem value="All">All Branches</MenuItem>
                                {branches.map(b => <MenuItem key={b.branchId} value={b.branchName}>{b.branchName}</MenuItem>)}
                            </TextField>
                        </Stack>
                    </Stack>
                </Paper>

                {/* Users Table */}
                <TableContainer component={Paper} elevation={0} sx={{ borderRadius: 3, border: '1px solid #e2e8f0' }}>
                    <Table>
                        <TableHead sx={{ bgcolor: '#f8fafc' }}>
                            <TableRow>
                                <TableCell sx={{ fontWeight: 'bold', color: '#64748b' }}>USER PROFILE</TableCell>
                                <TableCell sx={{ fontWeight: 'bold', color: '#64748b' }}>ROLE</TableCell>
                                <TableCell sx={{ fontWeight: 'bold', color: '#64748b' }}>STATUS</TableCell>
                                <TableCell sx={{ fontWeight: 'bold', color: '#64748b' }}>BRANCH</TableCell>
                                <TableCell align="right" sx={{ fontWeight: 'bold', color: '#64748b' }}>ACTIONS</TableCell>
                            </TableRow>
                        </TableHead>
                        <TableBody>
                            {filteredUsers.map((u) => (
                                <TableRow key={u.userId} hover sx={{ opacity: u.active ? 1 : 0.6 }}>
                                    <TableCell>
                                        <Box display="flex" alignItems="center" gap={2}>
                                            {/* ✅ UPDATED: Dynamic Avatar Color */}
                                            <Avatar sx={{ bgcolor: getRoleColor(u.role), width: 40, height: 40 }}>{u.fullName.charAt(0)}</Avatar>
                                            <Box>
                                                <Typography variant="body2" fontWeight="bold">{u.fullName}</Typography>
                                                <Typography variant="caption" color="textSecondary">{u.email}</Typography>
                                            </Box>
                                        </Box>
                                    </TableCell>
                                    <TableCell>
                                        <Chip 
                                            icon={u.role === 'ADMIN' ? <AdminPanelSettings sx={{ fontSize: '16px !important' }} /> : <Security sx={{ fontSize: '16px !important' }} />} 
                                            label={u.role.replace('_', ' ')} 
                                            color={u.role === 'ADMIN' ? 'error' : 'primary'} 
                                            size="small" variant="outlined" sx={{ fontWeight: 'bold' }} 
                                        />
                                    </TableCell>
                                    <TableCell>
                                        <Chip 
                                            label={u.active ? "Active" : "Inactive"} 
                                            color={u.active ? "success" : "default"} 
                                            size="small" 
                                            icon={u.active ? <CheckCircle sx={{ fontSize: '14px !important' }} /> : <Block sx={{ fontSize: '14px !important' }} />}
                                            sx={{ fontWeight: 'bold', borderRadius: 1 }}
                                        />
                                    </TableCell>
                                    <TableCell>
                                        <Box display="flex" alignItems="center" gap={1} color="text.secondary">
                                            <Business fontSize="small" sx={{ opacity: 0.7 }} />
                                            <Typography variant="body2">{u.branch ? u.branch.branchName : "Head Office"}</Typography>
                                        </Box>
                                    </TableCell>
                                    <TableCell align="right">
                                        <Stack direction="row" justifyContent="flex-end" spacing={1}>
                                            <Tooltip title="Edit">
                                                <IconButton color="primary" size="small" onClick={() => handleOpen(u)} sx={{ bgcolor: '#eff6ff' }}><Edit fontSize="small" /></IconButton>
                                            </Tooltip>
                                            <Tooltip title={u.active ? "Deactivate User" : "Reactivate User"}>
                                                <IconButton 
                                                    color={u.active ? "error" : "success"} 
                                                    size="small" 
                                                    onClick={() => handleToggleStatus(u)} 
                                                    sx={{ bgcolor: u.active ? '#fef2f2' : '#f0fdf4' }}
                                                >
                                                    {u.active ? <Block fontSize="small" /> : <RestoreFromTrash fontSize="small" />}
                                                </IconButton>
                                            </Tooltip>
                                        </Stack>
                                    </TableCell>
                                </TableRow>
                            ))}
                        </TableBody>
                    </Table>
                </TableContainer>

                {/* Dialog */}
                <Dialog open={open} onClose={() => setOpen(false)} maxWidth="sm" fullWidth PaperProps={{ sx: { borderRadius: 3 } }}>
                    <DialogTitle sx={{ bgcolor: '#0f172a', color: 'white', fontWeight: 'bold' }}>
                        {isEdit ? 'Update User' : 'Add New User'}
                    </DialogTitle>
                    <DialogContent sx={{ mt: 3 }}>
                        <Stack spacing={3}>
                             <Box display="flex" gap={2}>
                                <TextField label="Full Name" fullWidth value={formData.fullName} onChange={(e) => setFormData({...formData, fullName: e.target.value})} error={!!errors.fullName} helperText={errors.fullName} />
                                <TextField label="Email" fullWidth value={formData.email} onChange={(e) => setFormData({...formData, email: e.target.value})} error={!!errors.email} helperText={errors.email} />
                             </Box>
                             <Box display="flex" gap={2}>
                                <TextField label="Username" fullWidth value={formData.username} onChange={(e) => setFormData({...formData, username: e.target.value})} error={!!errors.username} helperText={errors.username} />
                                <TextField label={isEdit ? "New Password" : "Password"} type="password" fullWidth value={formData.password} onChange={(e) => setFormData({...formData, password: e.target.value})} error={!!errors.password} helperText={errors.password} />
                             </Box>
                             <Box display="flex" gap={2}>
                                <TextField select label="Role" fullWidth value={formData.role} onChange={(e) => setFormData({...formData, role: e.target.value})}>
                                    {getRoleOptions().map((option) => (
                                        <MenuItem key={option.value} value={option.value}>
                                            {option.label}
                                        </MenuItem>
                                    ))}
                                </TextField>
                                <TextField 
                                    select label="Branch" fullWidth 
                                    value={formData.branch} onChange={(e) => setFormData({...formData, branch: e.target.value})} 
                                    error={!!errors.branch} helperText={errors.branch} 
                                    disabled={['ADMIN', 'SUPER_ADMIN', 'ACCOUNT_HEAD'].includes(formData.role)}
                                >
                                    <MenuItem value="">Select</MenuItem>
                                    {branches.map((b) => <MenuItem key={b.branchId} value={b.branchId}>{b.branchName}</MenuItem>)}
                                </TextField>
                             </Box>
                        </Stack>
                    </DialogContent>
                    <DialogActions sx={{ p: 3 }}>
                        <Button onClick={() => setOpen(false)}>Cancel</Button>
                        <Button onClick={handleSubmit} variant="contained">Save</Button>
                    </DialogActions>
                </Dialog>

            </Container>
        </Fade>
    );
};

export default ManageUsers;