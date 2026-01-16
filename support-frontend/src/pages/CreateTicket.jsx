import React, { useState, useEffect } from 'react';
import { 
    Container, Paper, Typography, TextField, Button, MenuItem, 
    Box, FormControl, InputLabel, Select, Fade, CircularProgress 
} from '@mui/material';
import SendIcon from '@mui/icons-material/Send';
import { toast } from 'react-toastify';
import { useNavigate } from 'react-router-dom';
import api from '../services/api';

const CreateTicket = () => {
    const navigate = useNavigate();

    // Form State
    const [subject, setSubject] = useState(''); // New Field
    const [description, setDescription] = useState('');
    const [priority, setPriority] = useState('MEDIUM'); // New Field
    
    // Dropdown Data
    const [categories, setCategories] = useState([]);
    const [selectedCategory, setSelectedCategory] = useState('');
    
    const [errorTypes, setErrorTypes] = useState([]);
    const [selectedType, setSelectedType] = useState('');
    
    const [loading, setLoading] = useState(false);
    const branchName = localStorage.getItem('branchName') || "My Branch";

    // 1. Load Categories on Page Load
    useEffect(() => {
        const fetchCategories = async () => {
            try {
                // Ensure this endpoint exists in your MasterDataController
                const response = await api.get('/master-data/categories');
                setCategories(response.data);
            } catch (error) {
                console.error("Error loading categories", error);
                toast.error("Could not load categories.");
            }
        };
        fetchCategories();
    }, []);

    // 2. Load Error Types when Category changes
    const handleCategoryChange = async (categoryId) => {
        setSelectedCategory(categoryId);
        setSelectedType(''); // Reset type
        try {
            const response = await api.get(`/master-data/types/by-category/${categoryId}`);
            setErrorTypes(response.data);
        } catch (error) {
            console.error("Error loading types", error);
        }
    };

    // 3. Handle Submit (JSON ONLY)
    const handleSubmit = async (e) => {
        e.preventDefault();
        setLoading(true);

        // Match the TicketDTO.java structure exactly!
        const payload = {
            subject: subject,
            description: description,
            priority: priority,
            categoryId: selectedCategory,
            typeId: selectedType
        };

        try {
            // We use simple JSON POST now
            await api.post('/tickets', payload);
            
            toast.success("Ticket Created Successfully!");
            navigate('/dashboard'); // Go back to dashboard
        } catch (error) {
            console.error("Submit Error:", error);
            toast.error("Failed to create ticket. Please try again.");
        } finally {
            setLoading(false);
        }
    };

    return (
        <Fade in={true} timeout={800}>
            <Container maxWidth="sm" sx={{ mt: 8, mb: 4 }}>
                <Paper 
                    elevation={3} 
                    sx={{ 
                        p: 5, 
                        borderRadius: 3, 
                        borderTop: '6px solid #1976d2' 
                    }}
                >
                    <Typography variant="h5" fontWeight="bold" align="center" color="primary" gutterBottom sx={{ mb: 4 }}>
                        Raise New Ticket
                    </Typography>
                    
                    <form onSubmit={handleSubmit}>
                        <Box display="flex" flexDirection="column" gap={3}>

                            {/* Branch Name (Read Only) */}
                            <TextField
                                label="Branch"
                                value={branchName}
                                fullWidth
                                disabled
                                variant="filled"
                            />

                            {/* Subject (New Requirement) */}
                            <TextField
                                label="Subject"
                                value={subject}
                                onChange={(e) => setSubject(e.target.value)}
                                fullWidth
                                required
                                placeholder="E.g., Printer Not Working"
                            />

                            {/* Priority Selection */}
                            <FormControl fullWidth required>
                                <InputLabel>Priority</InputLabel>
                                <Select
                                    value={priority}
                                    label="Priority"
                                    onChange={(e) => setPriority(e.target.value)}
                                >
                                    <MenuItem value="LOW">Low</MenuItem>
                                    <MenuItem value="MEDIUM">Medium</MenuItem>
                                    <MenuItem value="HIGH">High</MenuItem>
                                    <MenuItem value="CRITICAL">Critical</MenuItem>
                                </Select>
                            </FormControl>

                            {/* Category Selection */}
                            <FormControl fullWidth required>
                                <InputLabel>Error Category</InputLabel>
                                <Select
                                    value={selectedCategory}
                                    label="Error Category"
                                    onChange={(e) => handleCategoryChange(e.target.value)}
                                >
                                    {categories.map((cat) => (
                                        <MenuItem key={cat.categoryId} value={cat.categoryId}>
                                            {cat.categoryName}
                                        </MenuItem>
                                    ))}
                                </Select>
                            </FormControl>

                            {/* Type Selection */}
                            <FormControl fullWidth required disabled={!selectedCategory}>
                                <InputLabel>Error Type</InputLabel>
                                <Select
                                    value={selectedType}
                                    label="Error Type"
                                    onChange={(e) => setSelectedType(e.target.value)}
                                >
                                    {errorTypes.map((type) => (
                                        <MenuItem key={type.typeId} value={type.typeId}>
                                            {type.typeName}
                                        </MenuItem>
                                    ))}
                                </Select>
                            </FormControl>

                            {/* Description */}
                            <TextField
                                label="Description"
                                multiline
                                rows={4}
                                fullWidth
                                required
                                value={description}
                                onChange={(e) => setDescription(e.target.value)}
                                placeholder="Please describe the issue in detail..."
                            />

                            {/* Submit Button */}
                            <Button 
                                type="submit" 
                                variant="contained" 
                                size="large" 
                                fullWidth
                                endIcon={loading ? <CircularProgress size={20} color="inherit"/> : <SendIcon />}
                                disabled={loading || !selectedType || !description}
                                sx={{ py: 1.5, fontWeight: 'bold', mt: 1 }}
                            >
                                {loading ? "Submitting..." : "SUBMIT TICKET"}
                            </Button>

                        </Box>
                    </form>
                </Paper>
            </Container>
        </Fade>
    );
};

export default CreateTicket; 