import React, { useState, useEffect } from 'react';
import { 
    Box, Button, Container, Paper, Table, TableBody, TableCell, 
    TableContainer, TableHead, TableRow, Typography, IconButton, 
    Dialog, DialogTitle, DialogContent, DialogActions, TextField, 
    MenuItem, Chip 
} from '@mui/material';
import { Add, Edit, Delete } from '@mui/icons-material';
import { toast } from 'react-toastify'; // <--- FIX: Import Toast
import api from '../../services/api';

const ManageUsers = () => {
    const [users, setUsers] = useState([]);
    const [open, setOpen] = useState(false);
    const [editMode, setEditMode] = useState(false);
    const [selectedUser, setSelectedUser] = useState(null);

    // --- FIX: Define formData state correctly ---
    const [formData, setFormData] = useState({
        username: '',
        password: '',
        fullName: '',
        email: '',
        phone: '',
        role: 'BRANCH_USER',
        branchId: ''
    });

    const [branches, setBranches] = useState([]);

    // 1. Fetch Users & Branches on Load
    useEffect(() => {
        fetchData();
        fetchBranches();
    }, []);

    const fetchData = async () => {
        try {
            const response = await api.get('/users');
            setUsers(response.data);
        } catch (error) {
            console.error("Error fetching users", error);
            toast.error("Failed to load users");
        }
    };

    const fetchBranches = async () => {
        try {
            // If you don't have a branch endpoint yet, we use mock data
            const response = await api.get('/master-data/branches'); 
            setBranches(response.data);
        } catch (error) {
            // Mock branches if backend is missing
            setBranches([
                { branchId: 1, branchName: 'Head Office' },
                { branchId: 2, branchName: 'Colombo Main' },
                { branchId: 3, branchName: 'Kandy' },
                { branchId: 4, branchName: 'Galle' }
            ]);
        }
    };

    const handleOpen = (user = null) => {
        if (user) {
            setEditMode(true);
            setSelectedUser(user);
            setFormData({
                username: user.username,
                password: '', // Leave empty to keep existing password
                fullName: user.fullName,
                email: user.email,
                phone: user.phone || '',
                role: user.role,
                branchId: user.branch ? user.branch.branchId : ''
            });
        } else {
            setEditMode(false);
            setSelectedUser(null);
            setFormData({
                username: '',
                password: '',
                fullName: '',
                email: '',
                phone: '',
                role: 'BRANCH_USER',
                branchId: ''
            });
        }
        setOpen(true);
    };

    const handleClose = () => setOpen(false);

    const handleChange = (e) => {
        setFormData({ ...formData, [e.target.name]: e.target.value });
    };

    const handleSave = async () => {
        try {
            // Validation
            if (!formData.username || (!editMode && !formData.password) || !formData.fullName || !formData.email) {
                toast.error("Please fill in all required fields.");
                return;
            }

            // --- FIX: Format Payload for Java Backend ---
            const payload = {
                ...formData,
                branch: formData.branchId ? { branchId: formData.branchId } : null
            };
            delete payload.branchId; // Backend doesn't want this raw field

            if (editMode) {
                // We typically don't send password on edit unless changed
                if (!payload.password) delete payload.password;
                
                await api.put(`/users/${selectedUser.userId}`, payload);
                toast.success("User updated successfully");
            } else {
                await api.post('/auth/register', payload);
                toast.success("User registered successfully");
            }

            handleClose();
            fetchData();
        } catch (error) {
            console.error("Error saving user", error);
            toast.error(error.response?.data || "Operation failed.");
        }
    };

    const handleDelete = async (userId) => {
        if (window.confirm("Are you sure you want to delete this user?")) {
            try {
                await api.delete(`/users/${userId}`);
                toast.success("User deleted");
                fetchData();
            } catch (error) {
                toast.error("Failed to delete user");
            }
        }
    };

    return (
        <Container maxWidth="lg" sx={{ mt: 4, mb: 4 }}>
            <Box display="flex" justifyContent="space-between" mb={3}>
                <Typography variant="h4" fontWeight="bold">Manage Users</Typography>
                <Button variant="contained" startIcon={<Add />} onClick={() => handleOpen()}>
                    Add New User
                </Button>
            </Box>

            <TableContainer component={Paper}>
                <Table>
                    <TableHead>
                        <TableRow sx={{ bgcolor: '#f5f5f5' }}>
                            <TableCell><b>ID</b></TableCell>
                            <TableCell><b>Name</b></TableCell>
                            <TableCell><b>Username</b></TableCell>
                            <TableCell><b>Role</b></TableCell>
                            <TableCell><b>Branch</b></TableCell>
                            <TableCell align="right"><b>Actions</b></TableCell>
                        </TableRow>
                    </TableHead>
                    <TableBody>
                        {users.map((user) => (
                            <TableRow key={user.userId}>
                                <TableCell>{user.userId}</TableCell>
                                <TableCell>
                                    <Typography variant="body2" fontWeight="bold">{user.fullName}</Typography>
                                    <Typography variant="caption" color="textSecondary">{user.email}</Typography>
                                </TableCell>
                                <TableCell>{user.username}</TableCell>
                                <TableCell>
                                    <Chip 
                                        label={user.role} 
                                        color={user.role === 'ADMIN' ? 'error' : 'primary'} 
                                        size="small" 
                                    />
                                </TableCell>
                                <TableCell>{user.branch ? user.branch.branchName : 'Head Office'}</TableCell>
                                <TableCell align="right">
                                    <IconButton color="primary" onClick={() => handleOpen(user)}>
                                        <Edit />
                                    </IconButton>
                                    <IconButton color="error" onClick={() => handleDelete(user.userId)}>
                                        <Delete />
                                    </IconButton>
                                </TableCell>
                            </TableRow>
                        ))}
                    </TableBody>
                </Table>
            </TableContainer>

            {/* --- ADD/EDIT DIALOG --- */}
            <Dialog open={open} onClose={handleClose} maxWidth="sm" fullWidth>
                <DialogTitle>{editMode ? 'Edit User' : 'Add New User'}</DialogTitle>
                <DialogContent>
                    <Box component="form" sx={{ mt: 1 }}>
                        <TextField
                            fullWidth margin="normal" label="Full Name" name="fullName"
                            value={formData.fullName} onChange={handleChange} required
                        />
                        <TextField
                            fullWidth margin="normal" label="Email" name="email" type="email"
                            value={formData.email} onChange={handleChange} required
                        />
                        <TextField
                            fullWidth margin="normal" label="Username" name="username"
                            value={formData.username} onChange={handleChange} required
                            disabled={editMode} // Prevent changing username on edit
                        />
                        <TextField
                            fullWidth margin="normal" label={editMode ? "Password (Leave blank to keep)" : "Password"} 
                            name="password" type="password"
                            value={formData.password} onChange={handleChange} 
                            required={!editMode}
                        />
                        
                        <TextField
                            select fullWidth margin="normal" label="Role" name="role"
                            value={formData.role} onChange={handleChange}
                        >
                            <MenuItem value="ADMIN">Admin</MenuItem>
                            <MenuItem value="BRANCH_USER">Branch User</MenuItem>
                        </TextField>

                        <TextField
                            select fullWidth margin="normal" label="Branch" name="branchId"
                            value={formData.branchId} onChange={handleChange}
                        >
                            <MenuItem value=""><em>Head Office / None</em></MenuItem>
                            {branches.map((b) => (
                                <MenuItem key={b.branchId} value={b.branchId}>
                                    {b.branchName}
                                </MenuItem>
                            ))}
                        </TextField>
                    </Box>
                </DialogContent>
                <DialogActions>
                    <Button onClick={handleClose}>Cancel</Button>
                    <Button onClick={handleSave} variant="contained" color="primary">
                        {editMode ? 'Update' : 'Register'}
                    </Button>
                </DialogActions>
            </Dialog>
        </Container>
    );
};

export default ManageUsers;