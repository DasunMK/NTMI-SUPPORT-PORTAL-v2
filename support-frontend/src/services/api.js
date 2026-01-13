import axios from 'axios';

// Create a configured instance of Axios
const api = axios.create({
    baseURL: 'http://localhost:8080/api', // Your Spring Boot Backend URL
});

// Interceptor: Before sending ANY request, check if we have a token
api.interceptors.request.use((config) => {
    const token = localStorage.getItem('token'); // Get token from browser storage
    if (token) {
        config.headers.Authorization = `Bearer ${token}`; // Attach it!
    }
    return config;
}, (error) => {
    return Promise.reject(error);
});

export default api;