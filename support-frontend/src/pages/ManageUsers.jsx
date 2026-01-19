import React, { useState, useEffect } from 'react';
import { 
    Container, Paper, Typography, Box, Button, Table, TableBody, TableCell, 
    TableContainer, TableHead, TableRow, Chip, IconButton, Dialog, 
    DialogTitle, DialogContent, DialogActions, TextField, MenuItem, Fade 
} from '@mui/material';
import { 
    Add, Edit, Delete, Person, Security 
} from '@mui/icons-material';
import { toast } from 'react-toastify';
import api from '../services/api';

const ManageUsers = () => {
    const [users, setUsers] = useState([]);
    const [branches, setBranches] = useState([]);
    const [open, setOpen] = useState(false);
    const [isEdit, setIsEdit] = useState(false);
    
    // Form State
    const [formData, setFormData] = useState({
        userId: null, username: '', password: '', fullName: '', 
        email: '', role: 'BRANCH_USER', branch: ''
    });

    // --- Fetch Data ---
    const fetchData = async () => {
        try {
            const [userRes, branchRes] = await Promise.all([
                api.get('/users'),
                api.get('/master-data/branches')
            ]);
            setUsers(userRes.data);
            setBranches(branchRes.data);
        } catch (error) {
            console.error(error);
            toast.error("Failed to load data");
        }
    };

    useEffect(() => { fetchData(); }, []);

    // --- Handlers ---
    const handleOpen = (user = null) => {
        if (user) {
            // Edit Mode
            setFormData({
                userId: user.userId,
                username: user.username,
                password: '', 
                fullName: user.fullName,
                email: user.email,
                role: user.role,
                branch: user.branch ? user.branch.branchId : ''
            });
            setIsEdit(true);
        } else {
            // Add Mode
            setFormData({
                userId: null, username: '', password: '', fullName: '', 
                email: '', role: 'BRANCH_USER', branch: '' // Default to Branch User
            });
            setIsEdit(false);
        }
        setOpen(true);
    };

    const handleSubmit = async () => {
        try {
            const payload = { ...formData };
            
            // 🛠️ LOGIC FIX: Admins have NO branch
            if (payload.role === 'ADMIN') {
                payload.branch = null;
            } else {
                // For Branch Users, map the ID to an object
                if (payload.branch) {
                    payload.branch = { branchId: payload.branch };
                } else {
                    payload.branch = null; 
                }
            }

            if (isEdit && !payload.password) delete payload.password;

            if (isEdit) {
                await api.put(`/users/${formData.userId}`, payload);
                toast.success("User Updated");
            } else {
                await api.post('/users', payload);
                toast.success("User Created");
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
            toast.success("User Deleted");
            fetchData();
        } catch (error) { toast.error("Delete Failed"); }
    };

    return (
        <Fade in={true}>
            <Container maxWidth="lg" sx={{ mt: 4 }}>
                <Box display="flex" justifyContent="space-between" alignItems="center" mb={3}>
                    <Typography variant="h4" fontWeight="bold">User Management</Typography>
                    <Button variant="contained" startIcon={<Add />} onClick={() => handleOpen()}>
                        Add New User
                    </Button>
                </Box>

                <TableContainer component={Paper} elevation={3}>
                    <Table>
                        <TableHead sx={{ bgcolor: '#f5f5f5' }}>
                            <TableRow>
                                <TableCell><strong>ID</strong></TableCell>
                                <TableCell><strong>Name</strong></TableCell>
                                <TableCell><strong>Role</strong></TableCell>
                                <TableCell><strong>Branch</strong></TableCell>
                                <TableCell align="right"><strong>Actions</strong></TableCell>
                            </TableRow>
                        </TableHead>
                        <TableBody>
                            {users.map((u) => (
                                <TableRow key={u.userId} hover>
                                    <TableCell>#{u.userId}</TableCell>
                                    <TableCell>
                                        <Box display="flex" alignItems="center" gap={1}>
                                            <Person color="action" />
                                            <Box>
                                                <Typography variant="body2" fontWeight="bold">{u.fullName}</Typography>
                                                <Typography variant="caption" color="textSecondary">{u.username}</Typography>
                                            </Box>
                                        </Box>
                                    </TableCell>
                                    <TableCell>
                                        <Chip 
                                            icon={<Security sx={{ fontSize: 16 }} />} 
                                            label={u.role} 
                                            color={u.role === 'ADMIN' ? 'secondary' : 'primary'} 
                                            size="small" 
                                            variant="outlined" 
                                        />
                                    </TableCell>
                                    <TableCell>
                                        {u.role === 'ADMIN' ? (
                                            <Typography variant="caption" sx={{ fontStyle: 'italic', color: 'text.secondary' }}>
                                                Global / Head Office
                                            </Typography>
                                        ) : (
                                            u.branch ? u.branch.branchName : '-'
                                        )}
                                    </TableCell>
                                    <TableCell align="right">
                                        <IconButton color="primary" onClick={() => handleOpen(u)}><Edit /></IconButton>
                                        <IconButton color="error" onClick={() => handleDelete(u.userId)}><Delete /></IconButton>
                                    </TableCell>
                                </TableRow>
                            ))}
                        </TableBody>
                    </Table>
                </TableContainer>

                {/* ADD/EDIT DIALOG */}
                <Dialog open={open} onClose={() => setOpen(false)} maxWidth="sm" fullWidth>
                    <DialogTitle>{isEdit ? 'Edit User' : 'Add New User'}</DialogTitle>
                    <DialogContent>
                        <Box display="flex" flexDirection="column" gap={2} mt={1}>
                            <TextField label="Full Name" fullWidth value={formData.fullName} onChange={(e) => setFormData({...formData, fullName: e.target.value})} />
                            <TextField label="Username" fullWidth value={formData.username} onChange={(e) => setFormData({...formData, username: e.target.value})} />
                            <TextField label="Email" fullWidth value={formData.email} onChange={(e) => setFormData({...formData, email: e.target.value})} />
                            
                            <TextField 
                                label={isEdit ? "Password (Leave blank to keep)" : "Password"} 
                                type="password" 
                                fullWidth 
                                value={formData.password} 
                                onChange={(e) => setFormData({...formData, password: e.target.value})} 
                            />
                            
                            <TextField 
                                select 
                                label="Role" 
                                fullWidth 
                                value={formData.role} 
                                onChange={(e) => setFormData({...formData, role: e.target.value})}
                            >
                                <MenuItem value="BRANCH_USER">Branch Officer</MenuItem>
                                <MenuItem value="ADMIN">Admin / Operations</MenuItem>
                            </TextField>

                            {/* 🛠️ UI FIX: Only show Branch dropdown if NOT Admin */}
                            {formData.role !== 'ADMIN' && (
                                <TextField 
                                    select 
                                    label="Branch" 
                                    fullWidth 
                                    value={formData.branch} 
                                    onChange={(e) => setFormData({...formData, branch: e.target.value})}
                                >
                                    <MenuItem value=""><em>None</em></MenuItem>
                                    {branches.map((b) => (
                                        <MenuItem key={b.branchId} value={b.branchId}>{b.branchName}</MenuItem>
                                    ))}
                                </TextField>
                            )}
                        </Box>
                    </DialogContent>
                    <DialogActions>
                        <Button onClick={() => setOpen(false)}>Cancel</Button>
                        <Button variant="contained" onClick={handleSubmit}>{isEdit ? 'Update' : 'Create'}</Button>
                    </DialogActions>
                </Dialog>

            </Container>
        </Fade>
    );
};

export default ManageUsers;