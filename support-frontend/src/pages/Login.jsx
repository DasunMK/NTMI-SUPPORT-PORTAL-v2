import React, { useState } from 'react';
import { Container, Box, TextField, Button, Typography, Card, CardContent } from '@mui/material';
import { toast } from 'react-toastify';
import { useNavigate } from 'react-router-dom';
import api from '../services/api'; // Import our new helper
import { jwtDecode } from "jwt-decode";

const Login = () => {
    const [username, setUsername] = useState('');
    const [password, setPassword] = useState('');
    const navigate = useNavigate();

    const handleLogin = async (e) => {
        e.preventDefault(); // Stop page refresh

        try {
            // 1. Send Login Request
            const response = await api.post('/auth/login', { username, password });

            // 2. Save Data to Local Storage (Browser Memory)
            const { token, role, userId } = response.data;
            localStorage.setItem('token', token);
            localStorage.setItem('role', role);
            localStorage.setItem('userId', userId);
            localStorage.setItem('username', response.data.username);

            // 3. Show Success & Redirect
            toast.success(`Welcome back, ${username}!`);
            
            // Decode token just to be sure or use the role from response
            if (role === 'ADMIN') {
                navigate('/admin-dashboard');
            } else {
                navigate('/dashboard');
            }

        } catch (error) {
            console.error("Login Error:", error);
            toast.error("Invalid Username or Password");
        }
    };

    return (
        <Container maxWidth="xs">
            <Box 
                display="flex" 
                justifyContent="center" 
                alignItems="center" 
                minHeight="100vh"
            >
                <Card elevation={3} sx={{ width: '100%', padding: 2 }}>
                    <CardContent>
                        <Typography variant="h5" component="h1" gutterBottom align="center" fontWeight="bold">
                            NTMI Support Portal
                        </Typography>
                        <Typography variant="body2" color="textSecondary" align="center" sx={{ mb: 3 }}>
                            Please sign in to continue
                        </Typography>

                        <form onSubmit={handleLogin}>
                            <TextField
                                label="Username"
                                variant="outlined"
                                fullWidth
                                margin="normal"
                                value={username}
                                onChange={(e) => setUsername(e.target.value)}
                                required
                            />
                            <TextField
                                label="Password"
                                type="password"
                                variant="outlined"
                                fullWidth
                                margin="normal"
                                value={password}
                                onChange={(e) => setPassword(e.target.value)}
                                required
                            />

                            <Button 
                                type="submit" 
                                variant="contained" 
                                color="primary" 
                                fullWidth 
                                size="large"
                                sx={{ mt: 2 }}
                            >
                                Login
                            </Button>
                        </form>
                    </CardContent>
                </Card>
            </Box>
        </Container>
    );
};

export default Login;