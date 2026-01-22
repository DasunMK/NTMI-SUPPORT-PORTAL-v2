import React, { useState } from 'react';
import { 
    Container, Box, TextField, Button, Typography, Paper, 
    InputAdornment, IconButton, CircularProgress, Stack 
} from '@mui/material';
import { 
    Visibility, VisibilityOff, Person, Lock, 
    Login as LoginIcon, Security 
} from '@mui/icons-material';
import { toast } from 'react-toastify';
import { useNavigate } from 'react-router-dom';
import api from '../services/api'; 

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
                minHeight: '100vh',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                background: 'linear-gradient(135deg, #0f172a 0%, #1e293b 100%)',
                p: 2
            }}
        >
            <Container maxWidth="xs">
                <Paper 
                    elevation={10} 
                    sx={{ 
                        p: 4, 
                        borderRadius: 4, 
                        backdropFilter: 'blur(10px)',
                        bgcolor: 'rgba(255, 255, 255, 0.95)',
                        border: '1px solid rgba(255, 255, 255, 0.3)',
                        overflow: 'hidden',
                        position: 'relative'
                    }}
                >
                    <Box sx={{ position: 'absolute', top: 0, left: 0, right: 0, height: 6, background: 'linear-gradient(90deg, #2563eb, #9333ea)' }} />

                    <Box textAlign="center" mb={4}>
                        <Box 
                            sx={{ 
                                width: 60, height: 60, borderRadius: '50%', 
                                bgcolor: '#eff6ff', color: '#2563eb', 
                                display: 'flex', alignItems: 'center', justifyContent: 'center',
                                mx: 'auto', mb: 2
                            }}
                        >
                            <Security fontSize="large" />
                        </Box>
                        <Typography variant="h5" fontWeight="800" color="#1e293b">
                            NTMI Support
                        </Typography>
                        <Typography variant="body2" color="textSecondary">
                            Sign in to your account
                        </Typography>
                    </Box>

                    <form onSubmit={handleLogin}>
                        <Stack spacing={2.5}>
                            <TextField
                                label="Username"
                                name="username"
                                variant="outlined"
                                fullWidth
                                value={formData.username}
                                onChange={handleChange}
                                required
                                InputProps={{
                                    startAdornment: (
                                        <InputAdornment position="start">
                                            <Person color="action" fontSize="small" />
                                        </InputAdornment>
                                    ),
                                }}
                            />
                            
                            <TextField
                                label="Password"
                                name="password"
                                type={showPassword ? 'text' : 'password'}
                                variant="outlined"
                                fullWidth
                                value={formData.password}
                                onChange={handleChange}
                                required
                                InputProps={{
                                    startAdornment: (
                                        <InputAdornment position="start">
                                            <Lock color="action" fontSize="small" />
                                        </InputAdornment>
                                    ),
                                    endAdornment: (
                                        <InputAdornment position="end">
                                            <IconButton
                                                onClick={() => setShowPassword(!showPassword)}
                                                edge="end"
                                                size="small"
                                            >
                                                {showPassword ? <VisibilityOff /> : <Visibility />}
                                            </IconButton>
                                        </InputAdornment>
                                    ),
                                }}
                            />

                            {/* ✅ FIXED: Forgot Password Link */}
                            <Box display="flex" justifyContent="flex-end">
                                <Typography
                                    variant="caption"
                                    onClick={() => navigate('/help', { state: { focus: 'panel1' } })}
                                    sx={{ 
                                        fontWeight: 'bold', 
                                        color: '#2563eb', 
                                        cursor: 'pointer',
                                        '&:hover': { textDecoration: 'underline' }
                                    }}
                                >
                                    Forgot Password?
                                </Typography>
                            </Box>

                            <Button 
                                type="submit" 
                                variant="contained" 
                                fullWidth 
                                size="large"
                                disabled={loading}
                                startIcon={!loading && <LoginIcon />}
                                sx={{ 
                                    py: 1.5, 
                                    fontWeight: 'bold', 
                                    textTransform: 'none',
                                    fontSize: '1rem',
                                    borderRadius: 2,
                                    background: 'linear-gradient(to right, #2563eb, #1d4ed8)',
                                    boxShadow: '0 4px 12px rgba(37, 99, 235, 0.3)',
                                    transition: 'all 0.2s',
                                    '&:hover': { transform: 'translateY(-1px)', boxShadow: '0 6px 16px rgba(37, 99, 235, 0.4)' }
                                }}
                            >
                                {loading ? <CircularProgress size={24} color="inherit" /> : 'Sign In'}
                            </Button>
                        </Stack>
                    </form>

                    <Box mt={4} textAlign="center">
                        <Typography variant="caption" color="textSecondary">
                            © 2026 National Transport Medical Institute
                        </Typography>
                    </Box>
                </Paper>
            </Container>
        </Box>
    );
};

export default Login;