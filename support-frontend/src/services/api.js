import axios from 'axios';

// 1. Create the Axios Instance
const api = axios.create({
    baseURL: 'http://localhost:8080/api', 
    headers: {
        'Content-Type': 'application/json',
    },
});

// 2. REQUEST INTERCEPTOR (Attaches Token)
api.interceptors.request.use(
    (config) => {
        // Check if it's a public endpoint (Login/Register)
        // We check if the URL *contains* /auth/ to be safe
        const isAuthEndpoint = config.url.includes('/auth/');

        if (!isAuthEndpoint) {
            const token = localStorage.getItem('token');
            if (token) {
                config.headers.Authorization = `Bearer ${token}`;
            }
        }
        return config;
    },
    (error) => Promise.reject(error)
);

// 3. RESPONSE INTERCEPTOR (Handles Token Expiry)
api.interceptors.response.use(
    (response) => response,
    (error) => {
        // If the server says "401 Unauthorized" or "403 Forbidden"
        if (error.response && (error.response.status === 401 || error.response.status === 403)) {
            // Only redirect if we are NOT already on the login page
            if (window.location.pathname !== '/login') {
                console.warn("Session expired. Redirecting to login...");
                localStorage.clear();
                window.location.href = '/login';
            }
        }
        return Promise.reject(error);
    }
);

export default api;