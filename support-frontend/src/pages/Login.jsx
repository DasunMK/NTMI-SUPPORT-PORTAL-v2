import React, { useState } from 'react';
import { Container, Box, TextField, Button, Typography, Card, CardContent } from '@mui/material';
import { toast } from 'react-toastify';
import { useNavigate } from 'react-router-dom';
import api from '../services/api'; 

const Login = () => {
    const [username, setUsername] = useState('');
    const [password, setPassword] = useState('');
    const navigate = useNavigate();

    const handleLogin = async (e) => {
        e.preventDefault(); 

        try {
            const response = await api.post('/auth/login', { username, password });
            const data = response.data;
            
            console.log("Login Response:", data); // Keep this for debugging

            // 1. Handle Token
            const token = data.token || data.accessToken;
            
            // 2. Handle User Object (Backend might send flat data or nested 'user' object)
            const userObj = data.user ? data.user : data;

            // 3. Extract Basic Info
            const role = userObj.role || (userObj.roles && userObj.roles[0]);
            const userId = userObj.userId || userObj.id;
            const usernameVal = userObj.username;

            // 4. ⚠️ FIX: Extract Branch ID (Handle both Flat and Nested formats)
            let branchId = null;
            let branchName = null;

            if (userObj.branchId) {
                // Scenario A: Flat structure (What your logs show)
                branchId = userObj.branchId;
                branchName = userObj.branchName || 'My Branch';
            } else if (userObj.branch) {
                // Scenario B: Nested structure (Standard JPA)
                branchId = userObj.branch.branchId;
                branchName = userObj.branch.branchName;
            }

            if (!token || !role) {
                throw new Error("Invalid response. Missing Token or Role.");
            }

            // 5. Save EVERYTHING to Local Storage
            localStorage.setItem('token', token);
            localStorage.setItem('role', role);
            localStorage.setItem('userId', userId);
            localStorage.setItem('username', usernameVal);

            if (branchId) {
                localStorage.setItem('branchId', branchId);
                localStorage.setItem('branchName', branchName);
            }

            // 6. Redirect
            toast.success(`Welcome back, ${usernameVal}!`);
            
            if (role === 'ADMIN') {
                navigate('/admin-dashboard');
            } else {
                navigate('/dashboard');
            }

        } catch (error) {
            console.error("Login Error:", error);
            const errorMessage = error.response?.data?.message || "Invalid Username or Password";
            toast.error(errorMessage);
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