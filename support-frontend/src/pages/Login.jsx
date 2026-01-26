import React, { useState } from 'react';
import { 
    Box, TextField, Button, Typography, Paper, 
    InputAdornment, IconButton, CircularProgress, Stack, Fade, Container 
} from '@mui/material';
import { 
    Visibility, VisibilityOff, Person, Lock, 
    Login as LoginIcon
} from '@mui/icons-material';
import { toast } from 'react-toastify';
import { useNavigate } from 'react-router-dom';
import api from '../services/api'; 

// High-quality background image
const BG_IMAGE = "https://images.unsplash.com/photo-1519389950473-47ba0277781c?q=80&w=2070&auto=format&fit=crop";

const Login = () => {
    const navigate = useNavigate();
    
    const [formData, setFormData] = useState({ username: '', password: '' });
    const [showPassword, setShowPassword] = useState(false);
    const [loading, setLoading] = useState(false);

    const handleChange = (e) => {
        setFormData({ ...formData, [e.target.name]: e.target.value });
    };

    const handleLogin = async (e) => {
        e.preventDefault(); 
        setLoading(true);

        try {
            const response = await api.post('/auth/login', formData);
            const data = response.data;
            
            const token = data.token || data.accessToken;
            const userObj = data.user ? data.user : data;
            const role = userObj.role || (userObj.roles && userObj.roles[0]);
            const userId = userObj.userId || userObj.id;
            const usernameVal = userObj.username;

            let branchId = null;
            let branchName = null;

            if (userObj.branchId) {
                branchId = userObj.branchId;
                branchName = userObj.branchName || 'My Branch';
            } else if (userObj.branch) {
                branchId = userObj.branch.branchId;
                branchName = userObj.branch.branchName;
            }

            if (!token || !role) throw new Error("Invalid response.");

            localStorage.setItem('token', token);
            localStorage.setItem('role', role);
            localStorage.setItem('userId', userId);
            localStorage.setItem('username', usernameVal);

            if (branchId) {
                localStorage.setItem('branchId', branchId);
                localStorage.setItem('branchName', branchName);
            }

            toast.success(`Welcome back, ${usernameVal}!`);
            navigate(role === 'ADMIN' ? '/admin-dashboard' : '/dashboard');

        } catch (error) {
            console.error("Login Error:", error);
            const errorMessage = error.response?.data?.message || "Invalid Username or Password";
            toast.error(errorMessage);
        } finally {
            setLoading(false);
        }
    };

    return (
        <Box 
            sx={{ 
                height: '100vh', 
                width: '100vw',
                overflow: 'hidden',
                backgroundImage: `url(${BG_IMAGE})`,
                backgroundSize: 'cover',
                backgroundPosition: 'center',
                position: 'relative',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center'
            }}
        >
            {/* Dark Overlay for readability */}
            <Box 
                sx={{
                    position: 'absolute', top: 0, left: 0, right: 0, bottom: 0,
                    background: 'linear-gradient(135deg, rgba(15, 23, 42, 0.85) 0%, rgba(30, 41, 59, 0.95) 100%)',
                    zIndex: 1
                }}
            />

            {/* Login Card */}
            <Container maxWidth="xs" sx={{ position: 'relative', zIndex: 2 }}>
                <Fade in={true} timeout={800}>
                    <Paper 
                        elevation={24}
                        sx={{ 
                            p: 4, 
                            borderRadius: 4, 
                            backdropFilter: 'blur(12px)',
                            backgroundColor: 'rgba(255, 255, 255, 0.95)', 
                            boxShadow: '0 8px 32px 0 rgba(0, 0, 0, 0.3)',
                            border: '1px solid rgba(255, 255, 255, 0.18)'
                        }}
                    >
                        {/* Header Section */}
                        <Box textAlign="center" mb={4}>
                            
                            {/* LOGO */}
                            <Box 
                                component="img"
                                src="/logo.png" 
                                alt="NTMI Logo"
                                sx={{ 
                                    height: 80,       
                                    width: 'auto',
                                    maxWidth: '100%',
                                    mb: 2,
                                    objectFit: 'contain'
                                }}
                            />

                            <Typography variant="h5" fontWeight="800" color="#1e293b">
                                NTMI Support Portal
                            </Typography>
                            <Typography variant="body2" color="textSecondary">
                                Sign in to access the system
                            </Typography>
                        </Box>

                        {/* Login Form */}
                        <form onSubmit={handleLogin}>
                            <Stack spacing={3}>
                                <TextField
                                    label="Username"
                                    name="username"
                                    fullWidth
                                    value={formData.username}
                                    onChange={handleChange}
                                    required
                                    autoFocus
                                    InputProps={{
                                        startAdornment: (
                                            <InputAdornment position="start">
                                                <Person color="primary" />
                                            </InputAdornment>
                                        ),
                                        sx: { borderRadius: 3 }
                                    }}
                                />
                                
                                <Box>
                                    <TextField
                                        label="Password"
                                        name="password"
                                        type={showPassword ? 'text' : 'password'}
                                        fullWidth
                                        value={formData.password}
                                        onChange={handleChange}
                                        required
                                        InputProps={{
                                            startAdornment: (
                                                <InputAdornment position="start">
                                                    <Lock color="primary" />
                                                </InputAdornment>
                                            ),
                                            endAdornment: (
                                                <InputAdornment position="end">
                                                    <IconButton onClick={() => setShowPassword(!showPassword)} edge="end">
                                                        {showPassword ? <VisibilityOff /> : <Visibility />}
                                                    </IconButton>
                                                </InputAdornment>
                                            ),
                                            sx: { borderRadius: 3 }
                                        }}
                                    />
                                    <Box display="flex" justifyContent="flex-end" mt={1}>
                                        <Typography
                                            variant="caption"
                                            // ✅ UPDATED: Opens /help in a new tab
                                            onClick={() => window.open('/help', '_blank')}
                                            sx={{ 
                                                fontWeight: 'bold', color: 'primary.main', cursor: 'pointer',
                                                '&:hover': { textDecoration: 'underline' }
                                            }}
                                        >
                                            Forgot password?
                                        </Typography>
                                    </Box>
                                </Box>

                                <Button 
                                    type="submit" 
                                    fullWidth 
                                    variant="contained" 
                                    size="large"
                                    disabled={loading}
                                    startIcon={!loading && <LoginIcon />}
                                    sx={{ 
                                        py: 1.5, borderRadius: 3, fontWeight: 'bold', fontSize: '1rem',
                                        background: 'linear-gradient(to right, #2563eb, #4f46e5)',
                                        boxShadow: '0 4px 12px rgba(37, 99, 235, 0.3)',
                                        '&:hover': { background: 'linear-gradient(to right, #1d4ed8, #4338ca)' }
                                    }}
                                >
                                    {loading ? <CircularProgress size={26} color="inherit" /> : 'Log in'}
                                </Button>
                            </Stack>
                        </form>

                        <Box mt={4} textAlign="center">
                            <Typography variant="caption" color="text.disabled">
                                © 2026 National Transport Medical Institute
                            </Typography>
                        </Box>
                    </Paper>
                </Fade>
            </Container>
        </Box>
    );
};

export default Login;