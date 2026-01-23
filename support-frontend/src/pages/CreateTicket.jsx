import React, { useState, useEffect, useRef } from 'react';
import { 
    Container, Paper, Typography, TextField, Button, MenuItem, 
    Box, FormControl, InputLabel, Select, Fade, CircularProgress,
    Grid, Stack, Avatar, InputAdornment, FormHelperText, Card, CardContent, Chip
} from '@mui/material';
import { 
    Send, CloudUpload, Delete, 
    SupportAgent, NoteAdd, Computer, Devices 
} from '@mui/icons-material';
import { toast } from 'react-toastify';
import { useNavigate } from 'react-router-dom';
import api from '../services/api';

const CreateTicket = () => {
    const navigate = useNavigate();
    const fileInputRef = useRef(null); 

    // --- State ---
    const [description, setDescription] = useState('');
    const [priority, setPriority] = useState('MEDIUM'); 
    const [selectedCategory, setSelectedCategory] = useState('');
    const [selectedType, setSelectedType] = useState('');
    
    // --- Asset State ---
    const [branchAssets, setBranchAssets] = useState([]); // All assets in user's branch
    const [selectedAssetId, setSelectedAssetId] = useState(''); // ID of selected asset
    const [selectedAssetDetails, setSelectedAssetDetails] = useState(null); // For previewing details

    const [isDragging, setIsDragging] = useState(false); 
    const [images, setImages] = useState([]); 
    const [previews, setPreviews] = useState([]); 
    const [categories, setCategories] = useState([]);
    const [errorTypes, setErrorTypes] = useState([]);
    const [loading, setLoading] = useState(false);
    
    const branchName = localStorage.getItem('branchName') || "My Branch";
    const branchId = localStorage.getItem('branchId'); 

    // --- Data Loading ---
    useEffect(() => {
        const loadData = async () => {
            try {
                // 1. Load Categories
                const catResponse = await api.get('/master-data/categories');
                setCategories(catResponse.data);

                // 2. Load Assets for this Branch
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

    // --- Handlers ---
    
    // Load Error Types when Category changes
    const handleCategoryChange = async (categoryId) => {
        setSelectedCategory(categoryId);
        setSelectedType(''); 
        try {
            const response = await api.get(`/master-data/types/by-category/${categoryId}`);
            setErrorTypes(response.data);
        } catch (error) { console.error("Error loading types", error); }
    };

    // Handle Asset Selection
    const handleAssetChange = (assetId) => {
        setSelectedAssetId(assetId);
        if (assetId) {
            const asset = branchAssets.find(a => a.assetId === assetId);
            setSelectedAssetDetails(asset);
        } else {
            setSelectedAssetDetails(null);
        }
    };

    // --- Image Processing (Same as before) ---
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

    // --- Submit ---
    const handleSubmit = async (e) => {
        e.preventDefault();
        
        // Basic Validation
        if (!selectedCategory || !selectedType || !description) {
            toast.warning("Please fill in Category, Issue Type, and Description.");
            return;
        }

        setLoading(true);
        
        // Prepare Payload
        // If selectedAssetId is empty string "", send NULL to backend
        const finalAssetId = selectedAssetId ? parseInt(selectedAssetId) : null;

        const payload = { 
            description, 
            priority, 
            categoryId: selectedCategory, 
            typeId: selectedType, 
            assetId: finalAssetId, // Can be null (for generic issues) or ID (for hardware)
            images 
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

    return (
        <Fade in={true} timeout={800}>
            <Container maxWidth="md" sx={{ mt: 6, mb: 8 }}>
                
                {/* Header Card */}
                <Paper elevation={0} sx={{ p: 4, mb: 3, borderRadius: 4, background: 'linear-gradient(135deg, #1e293b 0%, #334155 100%)', color: 'white', textAlign: 'center' }}>
                    <Box>
                        <Avatar sx={{ bgcolor: 'rgba(255,255,255,0.2)', width: 56, height: 56, mx: 'auto', mb: 2 }}><SupportAgent fontSize="large" /></Avatar>
                        <Typography variant="h5" fontWeight="800">Submit Support Request</Typography>
                        <Typography variant="body2" sx={{ opacity: 0.8, mt: 1 }}>Logging issue for: <strong>{branchName}</strong></Typography>
                    </Box>
                </Paper>

                <Paper elevation={0} sx={{ p: 4, borderRadius: 4, border: '1px solid #e2e8f0' }}>
                    <form onSubmit={handleSubmit}>
                        <Stack spacing={3}>

                            {/* 1. Category & Type */}
                            <Stack direction={{ xs: 'column', sm: 'row' }} spacing={2}>
                                <FormControl fullWidth required>
                                    <InputLabel>Problem Category</InputLabel>
                                    <Select 
                                        value={selectedCategory} label="Problem Category" 
                                        onChange={(e) => handleCategoryChange(e.target.value)}
                                        startAdornment={<InputAdornment position="start"><NoteAdd fontSize="small" sx={{ color: 'text.secondary' }} /></InputAdornment>}
                                    >
                                        {categories.map((cat) => <MenuItem key={cat.categoryId} value={cat.categoryId}>{cat.categoryName}</MenuItem>)}
                                    </Select>
                                </FormControl>

                                <FormControl fullWidth required disabled={!selectedCategory}>
                                    <InputLabel>Issue Type</InputLabel>
                                    <Select value={selectedType} label="Issue Type" onChange={(e) => setSelectedType(e.target.value)}>
                                        {errorTypes.map((type) => <MenuItem key={type.typeId} value={type.typeId}>{type.typeName}</MenuItem>)}
                                    </Select>
                                </FormControl>
                            </Stack>

                            {/* 2. Asset Selection (Optional) */}
                            <FormControl fullWidth>
                                <InputLabel>Affected Device (Optional)</InputLabel>
                                <Select 
                                    value={selectedAssetId} 
                                    label="Affected Device (Optional)" 
                                    onChange={(e) => handleAssetChange(e.target.value)}
                                    displayEmpty
                                    startAdornment={<InputAdornment position="start"><Computer fontSize="small" sx={{ color: 'text.secondary' }} /></InputAdornment>}
                                >
                                    <MenuItem value="">
                                        <em>None / General Issue (No specific device)</em>
                                    </MenuItem>
                                    {branchAssets.map((asset) => (
                                        <MenuItem key={asset.assetId} value={asset.assetId}>
                                            {asset.assetCode} — {asset.brand} {asset.model}
                                        </MenuItem>
                                    ))}
                                </Select>
                                <FormHelperText>Select a device if this is a hardware failure. Leave empty for general software/network issues.</FormHelperText>
                            </FormControl>

                            {/* 3. Asset Preview Card (Only visible if asset selected) */}
                            {selectedAssetDetails && (
                                <Fade in={true}>
                                    <Card variant="outlined" sx={{ bgcolor: '#f8fafc', borderRadius: 2 }}>
                                        <CardContent sx={{ py: 2, '&:last-child': { pb: 2 } }}>
                                            <Stack direction="row" alignItems="center" spacing={2}>
                                                <Devices color="primary" />
                                                <Box>
                                                    <Typography variant="subtitle2" fontWeight="bold">
                                                        {selectedAssetDetails.brand} {selectedAssetDetails.model}
                                                    </Typography>
                                                    <Typography variant="caption" color="textSecondary">
                                                        Serial: {selectedAssetDetails.serialNumber} • Type: {selectedAssetDetails.deviceType || 'N/A'} • Code: {selectedAssetDetails.assetCode}
                                                    </Typography>
                                                </Box>
                                                <Chip label="Selected" size="small" color="primary" sx={{ ml: 'auto !important' }} />
                                            </Stack>
                                        </CardContent>
                                    </Card>
                                </Fade>
                            )}

                            {/* 4. Priority */}
                            <FormControl fullWidth required>
                                <InputLabel>Priority Level</InputLabel>
                                <Select value={priority} label="Priority Level" onChange={(e) => setPriority(e.target.value)}>
                                    <MenuItem value="LOW">Low - Routine Request</MenuItem>
                                    <MenuItem value="MEDIUM">Medium - Standard Issue</MenuItem>
                                    <MenuItem value="HIGH">High - Urgent (Work Stopped)</MenuItem>
                                    <MenuItem value="CRITICAL">Critical - System Down</MenuItem>
                                </Select>
                            </FormControl>

                            {/* 5. Description */}
                            <TextField 
                                label="Detailed Description" 
                                multiline rows={4} 
                                fullWidth 
                                required
                                value={description} 
                                onChange={(e) => setDescription(e.target.value)} 
                                placeholder="Please describe the issue clearly..." 
                            />

                            {/* 6. Image Upload */}
                            <Box 
                                onDragOver={handleDragOver} onDragLeave={handleDragLeave} onDrop={handleDrop}
                                onClick={() => fileInputRef.current.click()}
                                sx={{ border: '2px dashed', borderColor: isDragging ? 'primary.main' : '#cbd5e1', borderRadius: 3, bgcolor: isDragging ? '#eff6ff' : '#f8fafc', p: 4, textAlign: 'center', cursor: 'pointer', transition: 'all 0.2s', '&:hover': { borderColor: 'primary.main', bgcolor: '#f1f5f9' } }}
                            >
                                <input type="file" hidden multiple accept="image/*" ref={fileInputRef} onChange={handleFileSelect} />
                                <CloudUpload sx={{ fontSize: 40, color: '#94a3b8', mb: 1 }} />
                                <Typography variant="body2" fontWeight="bold" color="textPrimary">Click or Drag screenshots here (Optional)</Typography>
                            </Box>
                            
                            {/* Preview Grid */}
                            {previews.length > 0 && (
                                <Grid container spacing={2}>
                                    {previews.map((src, i) => (
                                        <Grid item key={i}>
                                            <Box sx={{ width: 80, height: 80, borderRadius: 2, overflow: 'hidden', position: 'relative' }}>
                                                <img src={src} alt="preview" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                                            </Box>
                                        </Grid>
                                    ))}
                                </Grid>
                            )}

                            <Button 
                                type="submit" 
                                variant="contained" 
                                size="large" 
                                fullWidth 
                                endIcon={loading ? <CircularProgress size={20} color="inherit"/> : <Send />} 
                                disabled={loading} 
                                sx={{ py: 1.8, borderRadius: 3, fontWeight: 'bold', background: 'linear-gradient(to right, #2563eb, #1d4ed8)' }}
                            >
                                {loading ? "Creating Ticket..." : "Submit Ticket"}
                            </Button>
                        </Stack>
                    </form>
                </Paper>
            </Container>
        </Fade>
    );
};

export default CreateTicket;