import React, { useState, useEffect } from 'react';
import { 
    Container, Paper, Typography, Box, Tabs, Tab, TextField, Button, 
    IconButton, Grid, MenuItem, Alert, Stack, Chip, Card, CardContent, Divider, Fade
} from '@mui/material';
import { 
    Delete, Add, Business, Category, AssignmentLate, Settings as SettingsIcon, LocationOn
} from '@mui/icons-material';
import { toast } from 'react-toastify';
import api from '../services/api';

const Settings = () => {
    const [tabIndex, setTabIndex] = useState(0);
    const [branches, setBranches] = useState([]);
    const [categories, setCategories] = useState([]);
    const [types, setTypes] = useState([]);

    // --- INPUT STATES ---
    const [branchName, setBranchName] = useState('');
    const [branchCode, setBranchCode] = useState('');
    const [branchLocation, setBranchLocation] = useState('');
    const [newCategory, setNewCategory] = useState('');
    const [newType, setNewType] = useState('');
    const [selectedCatForType, setSelectedCatForType] = useState('');

    const fetchData = async () => {
        try {
            const [bRes, cRes, tRes] = await Promise.all([
                api.get('/settings/branches').catch(() => api.get('/master-data/branches')),
                api.get('/settings/categories').catch(() => api.get('/master-data/categories')),
                api.get('/settings/types').catch(() => api.get('/master-data/types'))
            ]);
            setBranches(bRes.data || []);
            setCategories(cRes.data || []);
            setTypes(tRes.data || []);
        } catch (error) {
            console.error("Load Error", error);
            toast.error("Could not load settings data");
        }
    };

    useEffect(() => { fetchData(); }, []);

    // --- HANDLERS ---
    const handleAddBranch = async () => {
        if (!branchName || !branchCode) return toast.warning("Name and Code are required");
        try {
            await api.post('/settings/branches', { branchName, branchCode, location: branchLocation || "Main Office" });
            toast.success("Branch Added");
            setBranchName(''); setBranchCode(''); setBranchLocation(''); fetchData();
        } catch (error) { toast.error("Failed to add branch"); }
    };

    const handleDeleteBranch = async (id) => {
        if(!window.confirm("Delete this branch?")) return;
        try {
            await api.delete(`/settings/branches/${id}`);
            toast.success("Branch Deleted"); fetchData();
        } catch (error) { toast.error("Cannot delete: Branch is in use."); }
    };

    const handleAddCategory = async () => {
        if (!newCategory) return;
        try {
            await api.post('/settings/categories', { categoryName: newCategory });
            toast.success("Category Added"); setNewCategory(''); fetchData();
        } catch (error) { toast.error("Failed to add category"); }
    };

    const handleDeleteCategory = async (id) => {
        if(!window.confirm("Delete category?")) return;
        try {
            await api.delete(`/settings/categories/${id}`);
            toast.success("Category Deleted"); fetchData();
        } catch (error) { toast.error("Cannot delete: Category is in use."); }
    };

    const handleAddType = async () => {
        if (!newType || !selectedCatForType) return toast.warning("Select category & enter name");
        try {
            await api.post('/settings/types', { typeName: newType, category: { categoryId: selectedCatForType } });
            toast.success("Error Type Added"); setNewType(''); fetchData();
        } catch (error) { toast.error("Failed to add type"); }
    };

    const handleDeleteType = async (id) => {
        if(!window.confirm("Delete error type?")) return;
        try {
            await api.delete(`/settings/types/${id}`);
            toast.success("Type Deleted"); fetchData();
        } catch (error) { toast.error("Cannot delete: Type is in use."); }
    };

    return (
        <Fade in={true} timeout={600}>
            <Container maxWidth="lg" sx={{ mt: 4, mb: 8 }}>
                
                {/* 1. HERO HEADER */}
                <Paper 
                    elevation={0}
                    sx={{ 
                        p: 4, mb: 4, borderRadius: 4, 
                        background: 'linear-gradient(135deg, #1e293b 0%, #334155 100%)',
                        color: 'white', display: 'flex', alignItems: 'center', gap: 2
                    }}
                >
                    <Box p={1.5} bgcolor="rgba(255,255,255,0.1)" borderRadius={2}>
                        <SettingsIcon fontSize="large" />
                    </Box>
                    <Box>
                        <Typography variant="h4" fontWeight="800">System Configuration</Typography>
                        <Typography variant="body1" sx={{ opacity: 0.8 }}>Manage master data for branches, categories, and issue types.</Typography>
                    </Box>
                </Paper>

                {/* 2. TABS */}
                <Paper sx={{ mb: 4, borderRadius: 3, overflow: 'hidden' }} elevation={0} variant="outlined">
                    <Tabs 
                        value={tabIndex} 
                        onChange={(e, val) => setTabIndex(val)} 
                        indicatorColor="primary" 
                        textColor="primary" 
                        variant="fullWidth"
                        sx={{ bgcolor: '#f8fafc' }}
                    >
                        <Tab icon={<Business />} label="Branches" sx={{ fontWeight: 'bold', py: 3 }} />
                        <Tab icon={<Category />} label="Categories" sx={{ fontWeight: 'bold', py: 3 }} />
                        <Tab icon={<AssignmentLate />} label="Error Types" sx={{ fontWeight: 'bold', py: 3 }} />
                    </Tabs>
                </Paper>

                {/* --- TAB 1: BRANCHES --- */}
                {tabIndex === 0 && (
                    <Grid container spacing={4}>
                        {/* Form */}
                        <Grid item xs={12} md={4}>
                            <Card elevation={0} sx={{ border: '1px solid #e2e8f0', borderRadius: 3, height: '100%' }}>
                                <CardContent>
                                    <Typography variant="h6" fontWeight="bold" gutterBottom>Add New Branch</Typography>
                                    <Typography variant="body2" color="textSecondary" mb={3}>Define a new office location for the system.</Typography>
                                    
                                    <Stack spacing={2.5}>
                                        <TextField fullWidth size="small" label="Branch Code" placeholder="e.g. BR001" value={branchCode} onChange={(e) => setBranchCode(e.target.value)} />
                                        <TextField fullWidth size="small" label="Branch Name" placeholder="e.g. Kandy" value={branchName} onChange={(e) => setBranchName(e.target.value)} />
                                        <TextField fullWidth size="small" label="Location" placeholder="e.g. City Center" value={branchLocation} onChange={(e) => setBranchLocation(e.target.value)} />
                                        <Button fullWidth variant="contained" onClick={handleAddBranch} startIcon={<Add />} sx={{ py: 1.2, fontWeight: 'bold', borderRadius: 2 }}>
                                            Add Branch
                                        </Button>
                                    </Stack>
                                </CardContent>
                            </Card>
                        </Grid>

                        {/* List */}
                        <Grid item xs={12} md={8}>
                            <Grid container spacing={2}>
                                {branches.map((b) => (
                                    <Grid item xs={12} sm={6} key={b.branchId}>
                                        <Paper elevation={0} sx={{ p: 2, border: '1px solid #e2e8f0', borderRadius: 3, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                                            <Box>
                                                <Typography variant="subtitle1" fontWeight="bold">{b.branchName}</Typography>
                                                <Box display="flex" alignItems="center" gap={0.5} mt={0.5}>
                                                    <Chip label={b.branchCode} size="small" sx={{ borderRadius: 1, fontWeight: 'bold', height: 20, fontSize: '0.7rem' }} />
                                                    <Box display="flex" alignItems="center" color="text.secondary">
                                                        <LocationOn sx={{ fontSize: 14, ml: 1 }} />
                                                        <Typography variant="caption">{b.location || '-'}</Typography>
                                                    </Box>
                                                </Box>
                                            </Box>
                                            <IconButton color="error" onClick={() => handleDeleteBranch(b.branchId)} sx={{ bgcolor: '#fef2f2' }}>
                                                <Delete fontSize="small" />
                                            </IconButton>
                                        </Paper>
                                    </Grid>
                                ))}
                            </Grid>
                        </Grid>
                    </Grid>
                )}

                {/* --- TAB 2: CATEGORIES --- */}
                {tabIndex === 1 && (
                    <Grid container spacing={4}>
                        <Grid item xs={12} md={4}>
                            <Card elevation={0} sx={{ border: '1px solid #e2e8f0', borderRadius: 3 }}>
                                <CardContent>
                                    <Typography variant="h6" fontWeight="bold" gutterBottom>Add Category</Typography>
                                    <Typography variant="body2" color="textSecondary" mb={3}>Group issues logically (e.g., Hardware, Network).</Typography>
                                    <Stack spacing={2}>
                                        <TextField fullWidth size="small" label="Category Name" value={newCategory} onChange={(e) => setNewCategory(e.target.value)} />
                                        <Button fullWidth variant="contained" onClick={handleAddCategory} startIcon={<Add />} sx={{ borderRadius: 2 }}>Add</Button>
                                    </Stack>
                                </CardContent>
                            </Card>
                        </Grid>

                        <Grid item xs={12} md={8}>
                            <Paper elevation={0} sx={{ p: 3, border: '1px solid #e2e8f0', borderRadius: 3 }}>
                                <Typography variant="subtitle2" fontWeight="bold" color="textSecondary" mb={2} sx={{ letterSpacing: 1 }}>ACTIVE CATEGORIES</Typography>
                                <Box display="flex" flexWrap="wrap" gap={1.5}>
                                    {categories.map((c) => (
                                        <Chip 
                                            key={c.categoryId} 
                                            label={c.categoryName} 
                                            onDelete={() => handleDeleteCategory(c.categoryId)}
                                            deleteIcon={<Delete />}
                                            sx={{ fontWeight: 'bold', borderRadius: 2, px: 1, py: 2.5, bgcolor: '#f1f5f9', border: '1px solid #e2e8f0' }}
                                        />
                                    ))}
                                </Box>
                            </Paper>
                        </Grid>
                    </Grid>
                )}

                {/* --- TAB 3: ERROR TYPES (FIXED WIDTH ISSUE) --- */}
                {tabIndex === 2 && (
                    <Box>
                        <Alert severity="info" sx={{ mb: 3, borderRadius: 2 }}>
                            <strong>Tip:</strong> Error Types must belong to a specific Category. E.g., "Printer Jam" belongs to "Hardware".
                        </Alert>
                        
                        <Card elevation={0} sx={{ border: '1px solid #e2e8f0', borderRadius: 3, mb: 4 }}>
                            <CardContent sx={{ p: 3 }}>
                                {/* ✅ Grid container now ensures alignment */}
                                <Grid container spacing={2} alignItems="center">
                                    <Grid item xs={12} md={4}>
                                        <TextField 
                                            select 
                                            fullWidth 
                                            size="small" 
                                            label="Select Category" 
                                            value={selectedCatForType} 
                                            onChange={(e) => setSelectedCatForType(e.target.value)}
                                            // ✅ FIXED: Forced minWidth to prevent squashing
                                            sx={{ minWidth: 200 }} 
                                        >
                                            {categories.map((c) => <MenuItem key={c.categoryId} value={c.categoryId}>{c.categoryName}</MenuItem>)}
                                        </TextField>
                                    </Grid>
                                    <Grid item xs={12} md={6}>
                                        <TextField 
                                            fullWidth 
                                            size="small" 
                                            label="New Error Type Name" 
                                            placeholder="e.g. Server Timeout"
                                            value={newType} 
                                            onChange={(e) => setNewType(e.target.value)} 
                                        />
                                    </Grid>
                                    <Grid item xs={12} md={2}>
                                        <Button fullWidth variant="contained" onClick={handleAddType} startIcon={<Add />} sx={{ height: 40, borderRadius: 2 }}>
                                            Add Type
                                        </Button>
                                    </Grid>
                                </Grid>
                            </CardContent>
                        </Card>

                        <Grid container spacing={3}>
                            {categories.map((cat) => {
                                const catTypes = types.filter(t => t.category?.categoryId === cat.categoryId);
                                if (catTypes.length === 0) return null;

                                return (
                                    <Grid item xs={12} md={6} key={cat.categoryId}>
                                        <Paper elevation={0} sx={{ p: 3, border: '1px solid #e2e8f0', borderRadius: 3, height: '100%' }}>
                                            <Typography variant="h6" fontWeight="bold" gutterBottom sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                                                <Category color="primary" fontSize="small" /> {cat.categoryName}
                                            </Typography>
                                            <Divider sx={{ mb: 2 }} />
                                            <Box display="flex" flexWrap="wrap" gap={1}>
                                                {catTypes.map(t => (
                                                    <Chip 
                                                        key={t.typeId} 
                                                        label={t.typeName} 
                                                        onDelete={() => handleDeleteType(t.typeId)}
                                                        size="small"
                                                        sx={{ borderRadius: 1 }}
                                                    />
                                                ))}
                                            </Box>
                                        </Paper>
                                    </Grid>
                                );
                            })}
                        </Grid>
                    </Box>
                )}

            </Container>
        </Fade>
    );
};

export default Settings;