import React, { useState, useEffect } from 'react';
import { 
    Container, Paper, Typography, Box, Tabs, Tab, TextField, Button, 
    IconButton, Grid, MenuItem, Alert, Stack, Chip, Card, CardContent, 
    Divider, Fade, List, ListItem, ListItemText, ListItemAvatar, Avatar
} from '@mui/material';
import { 
    Delete, Add, Business, Category, AssignmentLate, Settings as SettingsIcon, 
    LocationOn, Devices, Smartphone, Label, Computer, Phone // ✅ Added Phone Icon
} from '@mui/icons-material';
import { toast } from 'react-toastify';
import api from '../services/api';

// --- Helper Component (Defined Outside) ---
const SimpleList = ({ title, placeholder, value, setValue, onAdd, items, onDelete, icon }) => (
    <Card elevation={0} sx={{ border: '1px solid #e2e8f0', borderRadius: 3, height: '100%' }}>
        <CardContent>
            <Typography variant="h6" fontWeight="bold" gutterBottom>{title}</Typography>
            <Box display="flex" gap={1} mb={2}>
                <TextField 
                    size="small" fullWidth placeholder={placeholder} 
                    value={value} onChange={(e) => setValue(e.target.value)} 
                />
                <Button variant="contained" onClick={onAdd} sx={{ minWidth: 'auto', px: 2 }}><Add /></Button>
            </Box>
            <Divider />
            <List sx={{ maxHeight: 300, overflow: 'auto' }}>
                {items.map((item) => (
                    <ListItem key={item.id} secondaryAction={<IconButton edge="end" color="error" onClick={() => onDelete(item.id)}><Delete fontSize="small"/></IconButton>}>
                        {icon && <ListItemAvatar><Avatar sx={{ width: 32, height: 32, bgcolor: '#f1f5f9', color: '#475569' }}>{icon}</Avatar></ListItemAvatar>}
                        <ListItemText primary={item.name} />
                    </ListItem>
                ))}
                {items.length === 0 && <Typography variant="caption" color="textSecondary" sx={{p:2, display:'block', textAlign:'center'}}>No items yet.</Typography>}
            </List>
        </CardContent>
    </Card>
);

const Settings = () => {
    const [tabIndex, setTabIndex] = useState(0);
    
    // --- Data States ---
    const [branches, setBranches] = useState([]);
    const [categories, setCategories] = useState([]);
    const [types, setTypes] = useState([]);
    const [brands, setBrands] = useState([]);
    const [models, setModels] = useState([]);
    const [deviceTypes, setDeviceTypes] = useState([]);

    // --- Branch Inputs ---
    const [branchName, setBranchName] = useState('');
    const [branchCode, setBranchCode] = useState('');
    const [branchLocation, setBranchLocation] = useState('');
    const [branchContact, setBranchContact] = useState(''); // ✅ NEW STATE

    // --- Other Inputs ---
    const [newCategory, setNewCategory] = useState('');
    const [newType, setNewType] = useState('');
    const [selectedCatForType, setSelectedCatForType] = useState('');
    
    // --- Device Management Inputs ---
    const [newBrand, setNewBrand] = useState('');
    const [newDeviceType, setNewDeviceType] = useState('');
    const [selectedBrandForModel, setSelectedBrandForModel] = useState('');
    const [selectedDeviceTypeForModel, setSelectedDeviceTypeForModel] = useState(''); 
    const [newModelName, setNewModelName] = useState('');

    // --- FETCH DATA ---
    const fetchData = async () => {
        try {
            const [bRes, cRes, tRes, brRes, moRes, dtRes] = await Promise.all([
                api.get('/settings/branches').catch(() => ({ data: [] })),
                api.get('/settings/categories').catch(() => ({ data: [] })),
                api.get('/settings/types').catch(() => ({ data: [] })),
                api.get('/settings/brands').catch(() => ({ data: [] })),
                api.get('/settings/models').catch(() => ({ data: [] })),
                api.get('/settings/device-types').catch(() => ({ data: [] }))
            ]);
            setBranches(bRes.data);
            setCategories(cRes.data);
            setTypes(tRes.data);
            setBrands(brRes.data);
            setModels(moRes.data);
            setDeviceTypes(dtRes.data);
        } catch (error) {
            console.error("Load Error", error);
            toast.error("Could not load settings data");
        }
    };

    useEffect(() => { fetchData(); }, []);

    // --- HANDLERS ---

    // 1. Branches Handler
    const handleAddBranch = async () => {
        if (!branchName || !branchCode) return toast.warning("Name and Code required");
        try { 
            await api.post('/settings/branches', { 
                branchName, 
                branchCode, 
                location: branchLocation || "Main Office",
                contactNumber: branchContact // ✅ SENDING CONTACT
            }); 
            toast.success("Branch Added"); 
            // Reset Fields
            setBranchName(''); setBranchCode(''); setBranchLocation(''); setBranchContact(''); 
            fetchData(); 
        } catch (e) { toast.error("Failed"); }
    };
    const handleDeleteBranch = async (id) => { if(!window.confirm("Delete?")) return; try { await api.delete(`/settings/branches/${id}`); toast.success("Deleted"); fetchData(); } catch (e) { toast.error("In Use"); } };

    // ... (Other handlers remain exactly the same: Category, Type, Brand, DeviceType, Model) ...
    const handleAddCategory = async () => { if (!newCategory) return; try { await api.post('/settings/categories', { categoryName: newCategory }); toast.success("Added"); setNewCategory(''); fetchData(); } catch (e) { toast.error("Failed"); } };
    const handleDeleteCategory = async (id) => { if(!window.confirm("Delete?")) return; try { await api.delete(`/settings/categories/${id}`); toast.success("Deleted"); fetchData(); } catch (e) { toast.error("In Use"); } };
    const handleAddType = async () => { if (!newType || !selectedCatForType) return toast.warning("Select category & name"); try { await api.post('/settings/types', { typeName: newType, category: { categoryId: selectedCatForType } }); toast.success("Added"); setNewType(''); fetchData(); } catch (e) { toast.error("Failed"); } };
    const handleDeleteType = async (id) => { if(!window.confirm("Delete?")) return; try { await api.delete(`/settings/types/${id}`); toast.success("Deleted"); fetchData(); } catch (e) { toast.error("In Use"); } };
    const handleAddBrand = async () => { if (!newBrand) return; try { await api.post('/settings/brands', { name: newBrand }); toast.success("Added"); setNewBrand(''); fetchData(); } catch (e) { toast.error("Failed"); } };
    const handleDeleteBrand = async (id) => { try { await api.delete(`/settings/brands/${id}`); toast.success("Deleted"); fetchData(); } catch (e) { toast.error("In Use"); } };
    const handleAddDeviceType = async () => { if (!newDeviceType) return; try { await api.post('/settings/device-types', { name: newDeviceType }); toast.success("Added"); setNewDeviceType(''); fetchData(); } catch (e) { toast.error("Failed"); } };
    const handleDeleteDeviceType = async (id) => { try { await api.delete(`/settings/device-types/${id}`); toast.success("Deleted"); fetchData(); } catch (e) { toast.error("In Use"); } };
    const handleAddModel = async () => {
        if (!newModelName || !selectedBrandForModel || !selectedDeviceTypeForModel) { return toast.warning("Select Brand, Type & Enter Name"); }
        try { await api.post('/settings/models', { name: newModelName, brand: { id: selectedBrandForModel }, deviceType: { id: selectedDeviceTypeForModel } }); toast.success("Model Added"); setNewModelName(''); fetchData(); } catch (e) { toast.error("Failed"); }
    };
    const handleDeleteModel = async (id) => { try { await api.delete(`/settings/models/${id}`); toast.success("Deleted"); fetchData(); } catch (e) { toast.error("In Use"); } };


    return (
        <Fade in={true} timeout={600}>
            <Container maxWidth="xl" sx={{ mt: 4, mb: 8 }}>
                
                {/* HERO HEADER */}
                <Paper elevation={0} sx={{ p: 4, mb: 4, borderRadius: 4, background: 'linear-gradient(135deg, #1e293b 0%, #334155 100%)', color: 'white', display: 'flex', alignItems: 'center', gap: 2 }}>
                    <Box p={1.5} bgcolor="rgba(255,255,255,0.1)" borderRadius={2}><SettingsIcon fontSize="large" /></Box>
                    <Box>
                        <Typography variant="h4" fontWeight="800">System Configuration</Typography>
                        <Typography variant="body1" sx={{ opacity: 0.8 }}>Manage master data for the Help Desk system.</Typography>
                    </Box>
                </Paper>

                {/* TABS */}
                <Paper sx={{ mb: 4, borderRadius: 3, overflow: 'hidden' }} elevation={0} variant="outlined">
                    <Tabs value={tabIndex} onChange={(e, val) => setTabIndex(val)} indicatorColor="primary" textColor="primary" variant="fullWidth" sx={{ bgcolor: '#f8fafc' }}>
                        <Tab icon={<Business />} label="Branches" sx={{ fontWeight: 'bold', py: 3 }} />
                        <Tab icon={<Category />} label="Categories" sx={{ fontWeight: 'bold', py: 3 }} />
                        <Tab icon={<AssignmentLate />} label="Error Types" sx={{ fontWeight: 'bold', py: 3 }} />
                        <Tab icon={<Devices />} label="Device Management" sx={{ fontWeight: 'bold', py: 3 }} />
                    </Tabs>
                </Paper>

                {/* --- TAB 1: BRANCHES --- */}
                {tabIndex === 0 && (
                    <Grid container spacing={4}>
                        <Grid item xs={12} md={4}>
                            <Card elevation={0} sx={{ border: '1px solid #e2e8f0', borderRadius: 3, height: '100%' }}>
                                <CardContent>
                                    <Typography variant="h6" fontWeight="bold" gutterBottom>Add New Branch</Typography>
                                    <Stack spacing={2.5} mt={2}>
                                        <TextField fullWidth size="small" label="Branch Code" placeholder="e.g. B001" value={branchCode} onChange={(e) => setBranchCode(e.target.value)} />
                                        <TextField fullWidth size="small" label="Branch Name" placeholder="e.g. Colombo Main" value={branchName} onChange={(e) => setBranchName(e.target.value)} />
                                        <TextField fullWidth size="small" label="Location" placeholder="Address/City" value={branchLocation} onChange={(e) => setBranchLocation(e.target.value)} />
                                        
                                        {/* ✅ NEW CONTACT INPUT */}
                                        <TextField fullWidth size="small" label="Contact Number" placeholder="e.g. 011-2345678" value={branchContact} onChange={(e) => setBranchContact(e.target.value)} />
                                        
                                        <Button fullWidth variant="contained" onClick={handleAddBranch} startIcon={<Add />}>Add Branch</Button>
                                    </Stack>
                                </CardContent>
                            </Card>
                        </Grid>
                        <Grid item xs={12} md={8}>
                            <Grid container spacing={2}>
                                {branches.map((b) => (
                                    <Grid item xs={12} sm={6} key={b.branchId}>
                                        <Paper elevation={0} sx={{ p: 2, border: '1px solid #e2e8f0', borderRadius: 3, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                                            <Box>
                                                <Typography variant="subtitle1" fontWeight="bold">{b.branchName}</Typography>
                                                <Box display="flex" alignItems="center" gap={0.5} mt={0.5}>
                                                    <Chip label={b.branchCode} size="small" sx={{ borderRadius: 1, fontWeight: 'bold', height: 20, fontSize: '0.7rem' }} />
                                                    <Typography variant="caption" color="textSecondary"><LocationOn sx={{ fontSize: 14, verticalAlign: 'middle' }} /> {b.location || '-'}</Typography>
                                                </Box>
                                                {/* ✅ NEW CONTACT DISPLAY */}
                                                {b.contactNumber && (
                                                    <Box display="flex" alignItems="center" gap={0.5} mt={0.5}>
                                                        <Phone sx={{ fontSize: 14, color: 'text.secondary' }} />
                                                        <Typography variant="caption" color="textSecondary">{b.contactNumber}</Typography>
                                                    </Box>
                                                )}
                                            </Box>
                                            <IconButton color="error" onClick={() => handleDeleteBranch(b.branchId)} sx={{ bgcolor: '#fef2f2' }}><Delete fontSize="small" /></IconButton>
                                        </Paper>
                                    </Grid>
                                ))}
                            </Grid>
                        </Grid>
                    </Grid>
                )}

                {/* TAB 2, 3, 4 (Categories, Error Types, Device Management) */}
                {tabIndex === 1 && (
                    <Grid container spacing={4}><Grid item xs={12} md={4}><SimpleList title="Add Category" placeholder="Category Name" value={newCategory} setValue={setNewCategory} onAdd={handleAddCategory} items={[]} onDelete={()=>{}}/></Grid><Grid item xs={12} md={8}><Paper elevation={0} sx={{p:3,border:'1px solid #e2e8f0',borderRadius:3}}><Typography fontWeight="bold" mb={2}>ACTIVE CATEGORIES</Typography><Box display="flex" flexWrap="wrap" gap={1}>{categories.map(c=><Chip key={c.categoryId} label={c.categoryName} onDelete={()=>handleDeleteCategory(c.categoryId)} deleteIcon={<Delete/>} sx={{fontWeight:'bold',borderRadius:2}}/ >)}</Box></Paper></Grid></Grid>
                )}
                {tabIndex === 2 && (
                    <Box><Card elevation={0} sx={{border:'1px solid #e2e8f0',borderRadius:3,mb:4}}><CardContent><Grid container spacing={2} alignItems="center"><Grid item xs={12} md={4}><TextField select fullWidth size="small" label="Select Category" value={selectedCatForType} onChange={e=>setSelectedCatForType(e.target.value)}>{categories.map(c=><MenuItem key={c.categoryId} value={c.categoryId}>{c.categoryName}</MenuItem>)}</TextField></Grid><Grid item xs={12} md={6}><TextField fullWidth size="small" label="Error Type" value={newType} onChange={e=>setNewType(e.target.value)}/></Grid><Grid item xs={12} md={2}><Button fullWidth variant="contained" onClick={handleAddType}><Add/></Button></Grid></Grid></CardContent></Card><Grid container spacing={3}>{categories.map(cat=><Grid item xs={12} md={6} key={cat.categoryId}><Paper elevation={0} sx={{p:3,border:'1px solid #e2e8f0',borderRadius:3}}><Typography fontWeight="bold" gutterBottom>{cat.categoryName}</Typography><Divider sx={{mb:2}}/><Box display="flex" flexWrap="wrap" gap={1}>{types.filter(t=>t.category?.categoryId===cat.categoryId).map(t=><Chip key={t.typeId} label={t.typeName} onDelete={()=>handleDeleteType(t.typeId)} size="small"/>)}</Box></Paper></Grid>)}</Grid></Box>
                )}
                {tabIndex === 3 && (
                    <Grid container spacing={3}>
                        <Grid item xs={12} md={4}><SimpleList title="1. Brands" placeholder="e.g. Dell, HP" value={newBrand} setValue={setNewBrand} onAdd={handleAddBrand} items={brands} onDelete={handleDeleteBrand} icon={<Label fontSize="small"/>}/></Grid>
                        <Grid item xs={12} md={4}><SimpleList title="2. Device Types" placeholder="e.g. Laptop, Printer" value={newDeviceType} setValue={setNewDeviceType} onAdd={handleAddDeviceType} items={deviceTypes} onDelete={handleDeleteDeviceType} icon={<Computer fontSize="small"/>}/></Grid>
                        <Grid item xs={12} md={4}><Card elevation={0} sx={{ border: '1px solid #e2e8f0', borderRadius: 3, height: '100%' }}><CardContent><Typography variant="h6" fontWeight="bold" gutterBottom>3. Models</Typography><Stack spacing={2} mb={2}><TextField select size="small" label="Select Brand" value={selectedBrandForModel} onChange={(e) => setSelectedBrandForModel(e.target.value)} fullWidth>{brands.map((b) => <MenuItem key={b.id} value={b.id}>{b.name}</MenuItem>)}</TextField><TextField select size="small" label="Select Type" value={selectedDeviceTypeForModel} onChange={(e) => setSelectedDeviceTypeForModel(e.target.value)} fullWidth>{deviceTypes.map((t) => <MenuItem key={t.id} value={t.id}>{t.name}</MenuItem>)}</TextField><Box display="flex" gap={1}><TextField size="small" fullWidth label="Model Name" placeholder="e.g. Latitude 3520" value={newModelName} onChange={(e) => setNewModelName(e.target.value)} /><Button variant="contained" onClick={handleAddModel} sx={{ minWidth: 'auto', px: 2 }}><Add /></Button></Box></Stack><Divider /><List sx={{ maxHeight: 300, overflow: 'auto' }}>{models.map((model) => (<ListItem key={model.id} secondaryAction={<IconButton edge="end" color="error" onClick={() => handleDeleteModel(model.id)}><Delete fontSize="small"/></IconButton>}><ListItemAvatar><Avatar sx={{ bgcolor: '#eff6ff', color: '#1d4ed8' }}><Smartphone fontSize="small" /></Avatar></ListItemAvatar><ListItemText primary={model.name} secondary={<Typography variant="caption" sx={{ fontWeight: 'bold', color: 'text.secondary', display: 'block' }}>{model.brand ? model.brand.name : '-'} • {model.deviceType ? model.deviceType.name : '-'}</Typography>} /></ListItem>))}</List></CardContent></Card></Grid>
                    </Grid>
                )}

            </Container>
        </Fade>
    );
};

export default Settings;