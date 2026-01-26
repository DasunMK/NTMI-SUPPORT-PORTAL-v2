import React, { useState, useEffect, useRef } from 'react';
import { 
    Container, Paper, Typography, TextField, Button, MenuItem, 
    Box, FormControl, InputLabel, Select, Fade, CircularProgress,
    Stack, Avatar, InputAdornment, FormHelperText, Card, CardContent, Chip, Divider, useTheme
} from '@mui/material';
import { 
    Send, CloudUpload, SupportAgent, NoteAdd, Computer, Devices, 
    PriorityHigh, Close, Domain, Category, Description
} from '@mui/icons-material';
import { toast } from 'react-toastify';
import { useNavigate } from 'react-router-dom';
import api from '../services/api';

const CreateTicket = () => {
    const navigate = useNavigate();
    const fileInputRef = useRef(null);
    const theme = useTheme();

    const [description, setDescription] = useState('');
    const [priority, setPriority] = useState('MEDIUM'); 
    const [selectedCategory, setSelectedCategory] = useState('');
    const [selectedType, setSelectedType] = useState('');
    
    const [branchAssets, setBranchAssets] = useState([]); 
    const [selectedAssetId, setSelectedAssetId] = useState(''); 
    const [selectedAssetDetails, setSelectedAssetDetails] = useState(null); 

    const [isDragging, setIsDragging] = useState(false); 
    const [images, setImages] = useState([]); 
    const [previews, setPreviews] = useState([]); 
    const [categories, setCategories] = useState([]);
    const [errorTypes, setErrorTypes] = useState([]);
    const [loading, setLoading] = useState(false);
    
    const branchName = localStorage.getItem('branchName') || "My Branch";
    const branchId = localStorage.getItem('branchId'); 


    useEffect(() => {
        const loadData = async () => {
            try {
                const catResponse = await api.get('/master-data/categories');
                setCategories(catResponse.data);

                if (branchId) {
                    const assetResponse = await api.get(`/assets/branch/${branchId}`);
                    setBranchAssets(assetResponse.data);
                }
            } catch (error) {
                console.error("Error loading data", error);
            }
        };
        loadData();
    }, [branchId]);

    const handleCategoryChange = async (categoryId) => {
        setSelectedCategory(categoryId);
        setSelectedType(''); 
        try {
            const response = await api.get(`/master-data/types/by-category/${categoryId}`);
            setErrorTypes(response.data);
        } catch (error) { console.error("Error loading types", error); }
    };

    const handleAssetChange = (assetId) => {
        setSelectedAssetId(assetId);
        if (assetId) {
            const asset = branchAssets.find(a => a.assetId === assetId);
            setSelectedAssetDetails(asset);
        } else {
            setSelectedAssetDetails(null);
        }
    };

    const processFiles = (files) => {
        const fileArray = Array.from(files);
        if (images.length + fileArray.length > 5) { toast.warning("Maximum 5 images allowed."); return; }
        fileArray.forEach(file => {
            if (file.size > 5 * 1024 * 1024) { toast.error(`File ${file.name} is too large.`); return; }
            const reader = new FileReader();
            reader.readAsDataURL(file);
            reader.onload = () => {
                setImages(prev => [...prev, reader.result]);
                setPreviews(prev => [...prev, URL.createObjectURL(file)]);
            };
        });
    };
    const handleDragOver = (e) => { e.preventDefault(); setIsDragging(true); };
    const handleDragLeave = (e) => { e.preventDefault(); setIsDragging(false); };
    const handleDrop = (e) => { e.preventDefault(); setIsDragging(false); if (e.dataTransfer.files) processFiles(e.dataTransfer.files); };
    const handleFileSelect = (e) => { if (e.target.files) processFiles(e.target.files); };

    const removeImage = (index) => {
        setImages(prev => prev.filter((_, i) => i !== index));
        setPreviews(prev => prev.filter((_, i) => i !== index));
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        if (!selectedCategory || !selectedType || !description) {
            toast.warning("Please fill in Category, Issue Type, and Description.");
            return;
        }
        setLoading(true);
        const finalAssetId = selectedAssetId ? parseInt(selectedAssetId) : null;
        const payload = { 
            description, priority, categoryId: selectedCategory, 
            typeId: selectedType, assetId: finalAssetId, images 
        };

        try {
            await api.post('/tickets', payload);
            toast.success("Ticket Created Successfully!");
            navigate('/dashboard'); 
        } catch (error) {
            toast.error(error.response?.data?.message || "Failed to create ticket.");
        } finally {
            setLoading(false);
        }
    };

    const getPriorityColor = (p) => {
        switch(p) {
            case 'CRITICAL': return '#ef4444';
            case 'HIGH': return '#f97316';
            case 'MEDIUM': return '#3b82f6';
            default: return '#10b981';
        }
    };

    return (
        <Fade in={true} timeout={800}>
            <Container maxWidth="md" sx={{ mt: 6, mb: 8 }}>
                
                {/* Header Banner */}
                <Paper 
                    elevation={0} 
                    sx={{ 
                        p: 4, mb: 3, borderRadius: 4, 
                        background: 'linear-gradient(135deg, #0f172a 0%, #1e293b 100%)', 
                        color: 'white', position: 'relative', overflow: 'hidden',
                        boxShadow: '0 20px 40px -10px rgba(15, 23, 42, 0.4)'
                    }}
                >
                   
                    <Box sx={{ position: 'absolute', top: -60, right: -60, width: 300, height: 300, borderRadius: '50%', background: 'radial-gradient(circle, rgba(255,255,255,0.1) 0%, rgba(255,255,255,0) 70%)' }} />
                    
                    <Box display="flex" alignItems="center" gap={3} position="relative" zIndex={1}>
                        <Avatar sx={{ bgcolor: 'rgba(255,255,255,0.15)', width: 64, height: 64, backdropFilter: 'blur(10px)', boxShadow: '0 4px 12px rgba(0,0,0,0.1)' }}>
                            <SupportAgent fontSize="large" />
                        </Avatar>
                        <Box>
                            <Typography variant="h4" fontWeight="800" sx={{ letterSpacing: -0.5 }}>New Support Request</Typography>
                            <Stack direction="row" alignItems="center" spacing={1} mt={0.5}>
                                <Domain sx={{ fontSize: 16, opacity: 0.7 }} />
                                <Typography variant="body1" sx={{ opacity: 0.8 }}>Logging issue for: <strong>{branchName}</strong></Typography>
                            </Stack>
                        </Box>
                    </Box>
                </Paper>

                {/* Form */}
                <Paper elevation={0} sx={{ p: 5, borderRadius: 4, border: '1px solid #e2e8f0', boxShadow: '0 4px 6px -1px rgba(0,0,0,0.02)' }}>
                    <form onSubmit={handleSubmit}>
                        <Stack spacing={4}>

                            
                            <Box>
                                <Typography variant="subtitle2" fontWeight="bold" color="textSecondary" sx={{ mb: 2, textTransform: 'uppercase', letterSpacing: 1 }}>
                                    1. Issue Classification
                                </Typography>
                                
                            
                                <Stack direction={{ xs: 'column', sm: 'row' }} spacing={2}>
                                    <FormControl fullWidth required sx={{ flex: 1 }}>
                                        <InputLabel id="cat-label">Category</InputLabel>
                                        <Select 
                                            labelId="cat-label"
                                            value={selectedCategory} label="Category" 
                                            onChange={(e) => handleCategoryChange(e.target.value)}
                                            startAdornment={<InputAdornment position="start"><Category fontSize="small" color="action" /></InputAdornment>}
                                        >
                                            {categories.map((cat) => <MenuItem key={cat.categoryId} value={cat.categoryId}>{cat.categoryName}</MenuItem>)}
                                        </Select>
                                    </FormControl>

                                    <FormControl fullWidth required disabled={!selectedCategory} sx={{ flex: 1 }}>
                                        <InputLabel id="type-label">Issue Type</InputLabel>
                                        <Select 
                                            labelId="type-label"
                                            value={selectedType} label="Issue Type" onChange={(e) => setSelectedType(e.target.value)}
                                            startAdornment={<InputAdornment position="start"><NoteAdd fontSize="small" color="action" /></InputAdornment>}
                                        >
                                            {errorTypes.map((type) => <MenuItem key={type.typeId} value={type.typeId}>{type.typeName}</MenuItem>)}
                                        </Select>
                                    </FormControl>
                                </Stack>
                            </Box>

                            <Divider sx={{ borderStyle: 'dashed' }} />

                            {/* Section: Affected Asset */}
                            <Box>
                                <Typography variant="subtitle2" fontWeight="bold" color="textSecondary" sx={{ mb: 2, textTransform: 'uppercase', letterSpacing: 1 }}>
                                    2. Affected Hardware
                                </Typography>
                                <FormControl fullWidth>
                                    <InputLabel id="asset-label">Select Device (Optional)</InputLabel>
                                    <Select 
                                        labelId="asset-label"
                                        value={selectedAssetId} label="Select Device (Optional)" 
                                        onChange={(e) => handleAssetChange(e.target.value)}
                                        startAdornment={<InputAdornment position="start"><Computer fontSize="small" color="action" /></InputAdornment>}
                                    >
                                        <MenuItem value=""><em>General Issue / Software Only</em></MenuItem>
                                        {branchAssets.map((asset) => (
                                            <MenuItem key={asset.assetId} value={asset.assetId}>
                                                {asset.assetCode} — {asset.brand} {asset.model}
                                            </MenuItem>
                                        ))}
                                    </Select>
                                    <FormHelperText>If this issue relates to a specific device, please select it here.</FormHelperText>
                                </FormControl>

                                {selectedAssetDetails && (
                                    <Fade in={true}>
                                        <Card variant="outlined" sx={{ mt: 2, borderRadius: 3, bgcolor: '#f0f9ff', borderColor: '#bae6fd', position: 'relative', overflow: 'visible' }}>
                                            <CardContent sx={{ pb: 2 }}>
                                                <Box display="flex" alignItems="center" gap={2}>
                                                    <Avatar variant="rounded" sx={{ bgcolor: 'white', color: '#0ea5e9', border: '1px solid #bae6fd' }}>
                                                        <Devices />
                                                    </Avatar>
                                                    <Box>
                                                        <Typography variant="subtitle2" fontWeight="bold" color="#0c4a6e">
                                                            {selectedAssetDetails.brand} {selectedAssetDetails.model}
                                                        </Typography>
                                                        <Typography variant="caption" color="#0369a1" fontWeight="bold" sx={{ letterSpacing: 0.5 }}>
                                                            {selectedAssetDetails.assetCode}
                                                        </Typography>
                                                    </Box>
                                                </Box>
                                                <Divider sx={{ my: 1.5, borderColor: 'rgba(14, 165, 233, 0.2)' }} />
                                                <Stack direction="row" spacing={3}>
                                                    <Typography variant="caption" color="textSecondary">Serial: <strong>{selectedAssetDetails.serialNumber}</strong></Typography>
                                                    <Typography variant="caption" color="textSecondary">Type: <strong>{selectedAssetDetails.deviceType}</strong></Typography>
                                                </Stack>
                                            </CardContent>
                                            <Chip label="Selected" size="small" color="primary" sx={{ position: 'absolute', top: -10, right: 10, height: 20, fontSize: 10, fontWeight: 'bold' }} />
                                        </Card>
                                    </Fade>
                                )}
                            </Box>

                            <Divider sx={{ borderStyle: 'dashed' }} />
                            
                            <Box>
                                <Typography variant="subtitle2" fontWeight="bold" color="textSecondary" sx={{ mb: 2, textTransform: 'uppercase', letterSpacing: 1 }}>
                                    3. Incident Details
                                </Typography>
                                
                                <Stack spacing={3}>
                                    <FormControl fullWidth required>
                                        <InputLabel id="priority-label">Urgency Level</InputLabel>
                                        <Select 
                                            labelId="priority-label"
                                            value={priority} label="Urgency Level" onChange={(e) => setPriority(e.target.value)}
                                            startAdornment={<InputAdornment position="start"><PriorityHigh fontSize="small" sx={{ color: getPriorityColor(priority) }} /></InputAdornment>}
                                        >
                                            <MenuItem value="LOW"><Chip label="LOW" size="small" sx={{ bgcolor: '#dcfce7', color: '#166534', fontWeight: 'bold', mr: 1 }}/> Routine Request</MenuItem>
                                            <MenuItem value="MEDIUM"><Chip label="MEDIUM" size="small" sx={{ bgcolor: '#dbeafe', color: '#1e40af', fontWeight: 'bold', mr: 1 }}/> Standard Issue</MenuItem>
                                            <MenuItem value="HIGH"><Chip label="HIGH" size="small" sx={{ bgcolor: '#ffedd5', color: '#9a3412', fontWeight: 'bold', mr: 1 }}/> Urgent (Work Stopped)</MenuItem>
                                            <MenuItem value="CRITICAL"><Chip label="CRITICAL" size="small" sx={{ bgcolor: '#fee2e2', color: '#991b1b', fontWeight: 'bold', mr: 1 }}/> System Down</MenuItem>
                                        </Select>
                                    </FormControl>

                                    <TextField 
                                        label="Detailed Description" 
                                        multiline rows={5} 
                                        fullWidth required
                                        value={description} 
                                        onChange={(e) => setDescription(e.target.value)} 
                                        placeholder="What happened? Are there error messages? What were you doing?" 
                                        InputProps={{ startAdornment: <InputAdornment position="start" sx={{ alignSelf: 'flex-start', mt: 1 }}><Description color="action" fontSize="small" /></InputAdornment> }}
                                    />
                                </Stack>
                            </Box>

                            <Divider sx={{ borderStyle: 'dashed' }} />

                           
                            <Box>
                                <Typography variant="subtitle2" fontWeight="bold" color="textSecondary" sx={{ mb: 2, textTransform: 'uppercase', letterSpacing: 1 }}>
                                    4. Evidence (Optional)
                                </Typography>
                                <Box 
                                    onDragOver={handleDragOver} onDragLeave={handleDragLeave} onDrop={handleDrop}
                                    onClick={() => fileInputRef.current.click()}
                                    sx={{ 
                                        border: '2px dashed', 
                                        borderColor: isDragging ? 'primary.main' : '#cbd5e1', 
                                        borderRadius: 3, 
                                        bgcolor: isDragging ? '#eff6ff' : '#f8fafc', 
                                        p: 4, textAlign: 'center', cursor: 'pointer', 
                                        transition: 'all 0.2s', 
                                        '&:hover': { borderColor: 'primary.main', bgcolor: '#f1f5f9', transform: 'translateY(-2px)' } 
                                    }}
                                >
                                    <input type="file" hidden multiple accept="image/*" ref={fileInputRef} onChange={handleFileSelect} />
                                    <CloudUpload sx={{ fontSize: 48, color: '#94a3b8', mb: 1 }} />
                                    <Typography variant="body1" fontWeight="bold" color="textPrimary">Click or Drag Screenshots Here</Typography>
                                    <Typography variant="caption" color="textSecondary">Max 5 images (5MB each)</Typography>
                                </Box>

                                {previews.length > 0 && (
                                    <Box mt={2} sx={{ display: 'flex', gap: 1, overflowX: 'auto', pb: 1 }}>
                                        {previews.map((src, i) => (
                                            <Box key={i} sx={{ width: 80, height: 80, borderRadius: 2, overflow: 'hidden', position: 'relative', flexShrink: 0, border: '1px solid #e2e8f0' }}>
                                                <img src={src} alt="prev" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                                                <Box 
                                                    onClick={() => removeImage(i)}
                                                    sx={{ 
                                                        position: 'absolute', inset: 0, bgcolor: 'rgba(0,0,0,0.4)', 
                                                        display: 'flex', alignItems: 'center', justifyContent: 'center', 
                                                        opacity: 0, transition: 'opacity 0.2s', cursor: 'pointer',
                                                        '&:hover': { opacity: 1 } 
                                                    }}
                                                >
                                                    <Close sx={{ color: 'white', fontSize: 24 }} />
                                                </Box>
                                            </Box>
                                        ))}
                                    </Box>
                                )}
                            </Box>

                           
                            <Button 
                                type="submit" 
                                variant="contained" 
                                size="large" 
                                fullWidth
                                endIcon={loading ? <CircularProgress size={24} color="inherit"/> : <Send />} 
                                disabled={loading} 
                                sx={{ 
                                    py: 2, borderRadius: 3, fontWeight: '800', fontSize: '1.1rem', letterSpacing: 0.5,
                                    background: 'linear-gradient(to right, #2563eb, #1d4ed8)',
                                    boxShadow: '0 8px 16px rgba(37, 99, 235, 0.2)',
                                    '&:hover': { background: 'linear-gradient(to right, #1d4ed8, #1e40af)', boxShadow: '0 12px 20px rgba(37, 99, 235, 0.4)' }
                                }}
                            >
                                {loading ? "Creating Ticket..." : "Submit Support Request"}
                            </Button>

                        </Stack>
                    </form>
                </Paper>
            </Container>
        </Fade>
    );
};

export default CreateTicket;