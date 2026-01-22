import React, { useState, useEffect, useRef } from 'react';
import { 
    Container, Paper, Typography, TextField, Button, MenuItem, 
    Box, FormControl, InputLabel, Select, Fade, CircularProgress,
    Grid, Stack, Avatar
} from '@mui/material';
import { 
    Send, CloudUpload, Delete, 
    SupportAgent, NoteAdd
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
    const [isDragging, setIsDragging] = useState(false); 
    
    // Image State
    const [images, setImages] = useState([]); 
    const [previews, setPreviews] = useState([]); 

    // Data State
    const [categories, setCategories] = useState([]);
    const [errorTypes, setErrorTypes] = useState([]);
    const [loading, setLoading] = useState(false);
    const branchName = localStorage.getItem('branchName') || "My Branch";

    // --- Data Loading ---
    useEffect(() => {
        const fetchCategories = async () => {
            try {
                const response = await api.get('/master-data/categories');
                setCategories(response.data);
            } catch (error) {
                console.error("Error loading categories", error);
            }
        };
        fetchCategories();
    }, []);

    const handleCategoryChange = async (categoryId) => {
        setSelectedCategory(categoryId);
        setSelectedType(''); 
        try {
            const response = await api.get(`/master-data/types/by-category/${categoryId}`);
            setErrorTypes(response.data);
        } catch (error) {
            console.error("Error loading types", error);
        }
    };

    // --- Image Processing Logic ---
    const processFiles = (files) => {
        const fileArray = Array.from(files);
        
        if (images.length + fileArray.length > 5) {
            toast.warning("Maximum 5 images allowed.");
            return;
        }

        fileArray.forEach(file => {
            if (file.size > 5 * 1024 * 1024) { 
                toast.error(`File ${file.name} is too large (Max 5MB).`);
                return;
            }
            if (!file.type.startsWith('image/')) {
                toast.error(`File ${file.name} is not an image.`);
                return;
            }

            const reader = new FileReader();
            reader.readAsDataURL(file);
            reader.onload = () => {
                setImages(prev => [...prev, reader.result]);
                setPreviews(prev => [...prev, URL.createObjectURL(file)]);
            };
        });
    };

    // --- Drag & Drop Handlers ---
    const handleDragOver = (e) => {
        e.preventDefault();
        setIsDragging(true);
    };

    const handleDragLeave = (e) => {
        e.preventDefault();
        setIsDragging(false);
    };

    const handleDrop = (e) => {
        e.preventDefault();
        setIsDragging(false);
        if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
            processFiles(e.dataTransfer.files);
            e.dataTransfer.clearData();
        }
    };

    const handleFileSelect = (e) => {
        if (e.target.files && e.target.files.length > 0) {
            processFiles(e.target.files);
        }
    };

    const removeImage = (index) => {
        setImages(prev => prev.filter((_, i) => i !== index));
        setPreviews(prev => prev.filter((_, i) => i !== index));
    };

    // --- Submit ---
    const handleSubmit = async (e) => {
        e.preventDefault();
        setLoading(true);

        const payload = {
            description: description,
            priority: priority,
            categoryId: selectedCategory,
            typeId: selectedType,
            images: images 
        };

        try {
            await api.post('/tickets', payload);
            toast.success("Ticket Created Successfully!");
            navigate('/dashboard'); 
        } catch (error) {
            const errorMsg = error.response?.data?.message || "Failed to create ticket.";
            toast.error(errorMsg);
        } finally {
            setLoading(false);
        }
    };

    return (
        <Fade in={true} timeout={800}>
            <Container maxWidth="sm" sx={{ mt: 6, mb: 8 }}>
                
                {/* 1. HEADER CARD */}
                <Paper 
                    elevation={0}
                    sx={{ 
                        p: 4, mb: 3, borderRadius: 4, 
                        background: 'linear-gradient(135deg, #1e293b 0%, #334155 100%)', 
                        color: 'white', textAlign: 'center', position: 'relative', overflow: 'hidden'
                    }}
                >
                    <Box sx={{ position: 'relative', zIndex: 1 }}>
                        <Avatar sx={{ bgcolor: 'rgba(255,255,255,0.2)', width: 60, height: 60, mx: 'auto', mb: 2 }}>
                            <SupportAgent fontSize="large" />
                        </Avatar>
                        <Typography variant="h5" fontWeight="800">
                            New Support Request
                        </Typography>
                        <Typography variant="body2" sx={{ opacity: 0.8, mt: 1 }}>
                            Submitting as: <strong>{branchName}</strong>
                        </Typography>
                    </Box>
                    {/* Decorative Background */}
                    <Box sx={{ position: 'absolute', top: -30, left: -30, width: 100, height: 100, borderRadius: '50%', bgcolor: 'rgba(255,255,255,0.05)' }} />
                    <Box sx={{ position: 'absolute', bottom: -30, right: -30, width: 150, height: 150, borderRadius: '50%', bgcolor: 'rgba(255,255,255,0.05)' }} />
                </Paper>

                {/* 2. FORM CARD */}
                <Paper elevation={0} sx={{ p: 4, borderRadius: 4, border: '1px solid #e2e8f0' }}>
                    <form onSubmit={handleSubmit}>
                        <Stack spacing={3}>

                            {/* Category & Type Row */}
                            <Stack direction={{ xs: 'column', sm: 'row' }} spacing={2}>
                                <FormControl fullWidth required>
                                    <InputLabel>Category</InputLabel>
                                    <Select 
                                        value={selectedCategory} 
                                        label="Category" 
                                        onChange={(e) => handleCategoryChange(e.target.value)}
                                        startAdornment={<NoteAdd sx={{ mr: 1, color: 'text.secondary' }} fontSize="small" />}
                                    >
                                        {categories.map((cat) => <MenuItem key={cat.categoryId} value={cat.categoryId}>{cat.categoryName}</MenuItem>)}
                                    </Select>
                                </FormControl>

                                <FormControl fullWidth required disabled={!selectedCategory}>
                                    <InputLabel>Error Type</InputLabel>
                                    <Select value={selectedType} label="Error Type" onChange={(e) => setSelectedType(e.target.value)}>
                                        {errorTypes.map((type) => <MenuItem key={type.typeId} value={type.typeId}>{type.typeName}</MenuItem>)}
                                    </Select>
                                </FormControl>
                            </Stack>

                            {/* Priority Selection */}
                            <FormControl fullWidth required>
                                <InputLabel>Priority Level</InputLabel>
                                <Select value={priority} label="Priority Level" onChange={(e) => setPriority(e.target.value)}>
                                    <MenuItem value="LOW">Low - Routine Request</MenuItem>
                                    <MenuItem value="MEDIUM">Medium - Standard Issue</MenuItem>
                                    <MenuItem value="HIGH">High - Urgent Issue</MenuItem>
                                    <MenuItem value="CRITICAL">Critical - System Down</MenuItem>
                                </Select>
                            </FormControl>

                            {/* Description Input */}
                            <TextField
                                label="Description (Optional)"
                                multiline rows={4} fullWidth
                                value={description}
                                onChange={(e) => setDescription(e.target.value)}
                                placeholder="Describe the steps to reproduce the issue..."
                                variant="outlined"
                            />

                            {/* --- DRAG & DROP ZONE --- */}
                            <Box>
                                <Typography variant="subtitle2" fontWeight="bold" color="textSecondary" mb={1}>
                                    Evidence / Screenshots (Optional)
                                </Typography>
                                
                                <Box
                                    onDragOver={handleDragOver}
                                    onDragLeave={handleDragLeave}
                                    onDrop={handleDrop}
                                    onClick={() => fileInputRef.current.click()}
                                    sx={{
                                        border: '2px dashed',
                                        borderColor: isDragging ? 'primary.main' : '#cbd5e1',
                                        borderRadius: 3,
                                        bgcolor: isDragging ? '#eff6ff' : '#f8fafc',
                                        p: 4,
                                        textAlign: 'center',
                                        cursor: 'pointer',
                                        transition: 'all 0.2s ease-in-out',
                                        '&:hover': { borderColor: 'primary.main', bgcolor: '#f1f5f9' }
                                    }}
                                >
                                    <input type="file" hidden multiple accept="image/*" ref={fileInputRef} onChange={handleFileSelect} />
                                    
                                    <CloudUpload sx={{ fontSize: 40, color: isDragging ? 'primary.main' : '#94a3b8', mb: 1 }} />
                                    <Typography variant="body2" fontWeight="bold" color="textPrimary">
                                        Click or Drag images here
                                    </Typography>
                                    <Typography variant="caption" color="textSecondary">
                                        JPG, PNG (Max 5MB) • {images.length}/5 uploaded
                                    </Typography>
                                </Box>

                                {/* --- THUMBNAIL PREVIEWS --- */}
                                {previews.length > 0 && (
                                    <Grid container spacing={2} sx={{ mt: 1 }}>
                                        {previews.map((src, index) => (
                                            <Grid item key={index}>
                                                <Box sx={{ position: 'relative', width: 70, height: 70, borderRadius: 2, overflow: 'hidden', border: '1px solid #e2e8f0' }}>
                                                    <img src={src} alt="preview" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                                                    <Box 
                                                        onClick={(e) => { e.stopPropagation(); removeImage(index); }}
                                                        sx={{ 
                                                            position: 'absolute', top: 0, right: 0, bottom: 0, left: 0,
                                                            bgcolor: 'rgba(0,0,0,0.5)', display: 'flex', alignItems: 'center', justifyContent: 'center',
                                                            opacity: 0, transition: 'opacity 0.2s', cursor: 'pointer',
                                                            '&:hover': { opacity: 1 }
                                                        }}
                                                    >
                                                        <Delete sx={{ color: 'white', fontSize: 20 }} />
                                                    </Box>
                                                </Box>
                                            </Grid>
                                        ))}
                                    </Grid>
                                )}
                            </Box>

                            {/* SUBMIT BUTTON */}
                            <Button 
                                type="submit" variant="contained" size="large" fullWidth
                                endIcon={loading ? <CircularProgress size={20} color="inherit"/> : <Send />}
                                disabled={loading || !selectedType}
                                sx={{ 
                                    py: 1.8, borderRadius: 3, fontWeight: 'bold', textTransform: 'none', fontSize: '1rem',
                                    background: 'linear-gradient(to right, #2563eb, #1d4ed8)',
                                    boxShadow: '0 4px 12px rgba(37, 99, 235, 0.3)'
                                }}
                            >
                                {loading ? "Processing Request..." : "Submit Ticket"}
                            </Button>

                        </Stack>
                    </form>
                </Paper>
            </Container>
        </Fade>
    );
};

export default CreateTicket;