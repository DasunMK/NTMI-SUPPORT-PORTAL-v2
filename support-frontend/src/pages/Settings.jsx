import React, { useState, useEffect } from 'react';
import { 
    Container, Paper, Typography, Box, Tabs, Tab, TextField, Button, 
    List, ListItem, ListItemText, IconButton, Grid, MenuItem, Alert 
} from '@mui/material';
import { Delete, Add, Business, Category, AssignmentLate } from '@mui/icons-material';
import { toast } from 'react-toastify';
import api from '../services/api';

const Settings = () => {
    const [tabIndex, setTabIndex] = useState(0);
    const [branches, setBranches] = useState([]);
    const [categories, setCategories] = useState([]);
    const [types, setTypes] = useState([]);

    // --- INPUT STATES ---
    // Branch Inputs
    const [branchName, setBranchName] = useState('');
    const [branchCode, setBranchCode] = useState('');
    const [branchLocation, setBranchLocation] = useState('');

    // Category Input
    const [newCategory, setNewCategory] = useState('');

    // Error Type Inputs
    const [newType, setNewType] = useState('');
    const [selectedCatForType, setSelectedCatForType] = useState('');

    const fetchData = async () => {
        try {
            const [bRes, cRes, tRes] = await Promise.all([
                api.get('/settings/branches'),   // Using the endpoints we made
                api.get('/settings/categories'),
                api.get('/settings/types')
            ]);
            // Fallback to master-data if settings endpoint returns empty/error initially
            setBranches(bRes.data || []);
            setCategories(cRes.data || []);
            setTypes(tRes.data || []);
        } catch (error) {
            // If the /settings endpoints fail (e.g. 403), try public endpoints
            try {
                const [bRes, cRes, tRes] = await Promise.all([
                    api.get('/master-data/branches'),
                    api.get('/master-data/categories'),
                    api.get('/master-data/types')
                ]);
                setBranches(bRes.data || []);
                setCategories(cRes.data || []);
                setTypes(tRes.data || []);
            } catch (retryError) {
                console.error("Load Error", retryError);
            }
        }
    };

    useEffect(() => { fetchData(); }, []);

    // --- 1. BRANCH HANDLERS ---
    const handleAddBranch = async () => {
        if (!branchName || !branchCode) return toast.warning("Name and Code are required");
        
        try {
            await api.post('/settings/branches', { 
                branchName: branchName,
                branchCode: branchCode,
                location: branchLocation || "Main Office" // Default if empty
            });
            toast.success("Branch Added");
            setBranchName('');
            setBranchCode('');
            setBranchLocation('');
            fetchData();
        } catch (error) { 
            console.error(error);
            toast.error("Failed to add branch. Code might be duplicate."); 
        }
    };

    const handleDeleteBranch = async (id) => {
        if(!window.confirm("Delete this branch?")) return;
        try {
            await api.delete(`/settings/branches/${id}`);
            toast.success("Branch Deleted");
            fetchData();
        } catch (error) { toast.error("Cannot delete: Branch is in use."); }
    };

    // --- 2. CATEGORY HANDLERS ---
    const handleAddCategory = async () => {
        if (!newCategory) return;
        try {
            await api.post('/settings/categories', { categoryName: newCategory });
            toast.success("Category Added");
            setNewCategory('');
            fetchData();
        } catch (error) { toast.error("Failed to add category"); }
    };

    const handleDeleteCategory = async (id) => {
        if(!window.confirm("Delete category?")) return;
        try {
            await api.delete(`/settings/categories/${id}`);
            toast.success("Category Deleted");
            fetchData();
        } catch (error) { toast.error("Cannot delete: Category is in use."); }
    };

    // --- 3. TYPE HANDLERS ---
    const handleAddType = async () => {
        if (!newType || !selectedCatForType) return toast.warning("Select category & enter name");
        try {
            await api.post('/settings/types', { 
                typeName: newType, 
                category: { categoryId: selectedCatForType } 
            });
            toast.success("Error Type Added");
            setNewType('');
            fetchData();
        } catch (error) { toast.error("Failed to add type"); }
    };

    const handleDeleteType = async (id) => {
        if(!window.confirm("Delete error type?")) return;
        try {
            await api.delete(`/settings/types/${id}`);
            toast.success("Type Deleted");
            fetchData();
        } catch (error) { toast.error("Cannot delete: Type is in use."); }
    };

    return (
        <Container maxWidth="md" sx={{ mt: 4, mb: 8 }}>
            <Typography variant="h4" fontWeight="bold" gutterBottom color="primary">System Settings</Typography>
            <Typography variant="body1" color="text.secondary" mb={3}>
                Manage master data for tickets and users.
            </Typography>
            
            <Paper sx={{ width: '100%', mb: 3, borderRadius: 2 }}>
                <Tabs 
                    value={tabIndex} 
                    onChange={(e, val) => setTabIndex(val)} 
                    indicatorColor="primary" 
                    textColor="primary" 
                    variant="fullWidth"
                >
                    <Tab icon={<Business />} label="Branches" />
                    <Tab icon={<Category />} label="Categories" />
                    <Tab icon={<AssignmentLate />} label="Error Types" />
                </Tabs>
            </Paper>

            {/* --- TAB 1: BRANCHES --- */}
            {tabIndex === 0 && (
                <Paper sx={{ p: 4, borderRadius: 2 }}>
                    <Typography variant="h6" gutterBottom>Add New Branch</Typography>
                    <Grid container spacing={2} mb={3} alignItems="center">
                        <Grid size={{ xs: 12, md: 3 }}>
                            <TextField 
                                fullWidth size="small" label="Branch Code" 
                                placeholder="e.g. BR001"
                                value={branchCode} onChange={(e) => setBranchCode(e.target.value)} 
                            />
                        </Grid>
                        <Grid size={{ xs: 12, md: 4 }}>
                            <TextField 
                                fullWidth size="small" label="Branch Name" 
                                placeholder="e.g. Kandy"
                                value={branchName} onChange={(e) => setBranchName(e.target.value)} 
                            />
                        </Grid>
                        <Grid size={{ xs: 12, md: 3 }}>
                            <TextField 
                                fullWidth size="small" label="Location" 
                                placeholder="e.g. City Center"
                                value={branchLocation} onChange={(e) => setBranchLocation(e.target.value)} 
                            />
                        </Grid>
                        <Grid size={{ xs: 12, md: 2 }}>
                            <Button fullWidth variant="contained" onClick={handleAddBranch} startIcon={<Add />}>
                                Add
                            </Button>
                        </Grid>
                    </Grid>

                    <Typography variant="h6" gutterBottom sx={{ mt: 4 }}>Existing Branches</Typography>
                    <List dense sx={{ bgcolor: '#f9f9f9', borderRadius: 2 }}>
                        {branches.map((b) => (
                            <ListItem key={b.branchId} divider secondaryAction={
                                <IconButton edge="end" color="error" onClick={() => handleDeleteBranch(b.branchId)}>
                                    <Delete />
                                </IconButton>
                            }>
                                <ListItemText 
                                    primary={b.branchName} 
                                    secondary={`Code: ${b.branchCode} | Loc: ${b.location || '-'}`} 
                                    primaryTypographyProps={{ fontWeight: 'bold' }}
                                />
                            </ListItem>
                        ))}
                    </List>
                </Paper>
            )}

            {/* --- TAB 2: CATEGORIES --- */}
            {tabIndex === 1 && (
                <Paper sx={{ p: 4, borderRadius: 2 }}>
                    <Typography variant="h6" gutterBottom>Add Error Category</Typography>
                    <Box display="flex" gap={2} mb={4}>
                        <TextField 
                            fullWidth size="small" label="Category Name" 
                            placeholder="e.g. Hardware, Network, Software"
                            value={newCategory} onChange={(e) => setNewCategory(e.target.value)} 
                        />
                        <Button variant="contained" onClick={handleAddCategory} startIcon={<Add />} sx={{ minWidth: 100 }}>
                            Add
                        </Button>
                    </Box>

                    <Typography variant="h6" gutterBottom>Current Categories</Typography>
                    <List dense sx={{ bgcolor: '#f9f9f9', borderRadius: 2 }}>
                        {categories.map((c) => (
                            <ListItem key={c.categoryId} divider secondaryAction={
                                <IconButton edge="end" color="error" onClick={() => handleDeleteCategory(c.categoryId)}>
                                    <Delete />
                                </IconButton>
                            }>
                                <ListItemText primary={c.categoryName} />
                            </ListItem>
                        ))}
                    </List>
                </Paper>
            )}

            {/* --- TAB 3: ERROR TYPES --- */}
            {tabIndex === 2 && (
                <Paper sx={{ p: 4, borderRadius: 2 }}>
                    <Alert severity="info" sx={{ mb: 3 }}>
                        Error Types help categorize tickets specifically (e.g., "Printer Jam" under "Hardware").
                    </Alert>
                    
                    <Typography variant="h6" gutterBottom>Add Error Type</Typography>
                    <Grid container spacing={2} mb={4}>
                        <Grid size={{ xs: 12, md: 5 }}>
                            <TextField 
                                select fullWidth size="small" label="Select Category" 
                                value={selectedCatForType} onChange={(e) => setSelectedCatForType(e.target.value)}
                            >
                                {categories.map((c) => <MenuItem key={c.categoryId} value={c.categoryId}>{c.categoryName}</MenuItem>)}
                            </TextField>
                        </Grid>
                        <Grid size={{ xs: 12, md: 5 }}>
                            <TextField 
                                fullWidth size="small" label="New Error Type Name" 
                                placeholder="e.g. Server Timeout"
                                value={newType} onChange={(e) => setNewType(e.target.value)} 
                            />
                        </Grid>
                        <Grid size={{ xs: 12, md: 2 }}>
                            <Button fullWidth variant="contained" onClick={handleAddType} startIcon={<Add />}>Add</Button>
                        </Grid>
                    </Grid>

                    <Typography variant="h6" gutterBottom>Defined Types</Typography>
                    <List dense sx={{ bgcolor: '#f9f9f9', borderRadius: 2 }}>
                        {types.map((t) => (
                            <ListItem key={t.typeId} divider secondaryAction={
                                <IconButton edge="end" color="error" onClick={() => handleDeleteType(t.typeId)}>
                                    <Delete />
                                </IconButton>
                            }>
                                <ListItemText 
                                    primary={t.typeName} 
                                    secondary={`Category: ${t.category ? t.category.categoryName : 'None'}`} 
                                />
                            </ListItem>
                        ))}
                    </List>
                </Paper>
            )}

        </Container>
    );
};

export default Settings;