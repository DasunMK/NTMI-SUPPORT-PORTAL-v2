import React, { createContext, useState, useEffect, useContext, useCallback } from 'react';
import { toast } from 'react-toastify';
import api from '../services/api';

const NotificationContext = createContext();

export const useNotifications = () => useContext(NotificationContext);

export const NotificationProvider = ({ children }) => {
    const [notifications, setNotifications] = useState([]);
    const [unreadCount, setUnreadCount] = useState(0);

    // --- 1. Fetch Notifications from Backend ---
    const fetchNotifications = useCallback(async () => {
        const userId = localStorage.getItem('userId');
        
        if (!userId) return;

        try {
            const response = await api.get(`/notifications/${userId}`);
            setNotifications(response.data);
        } catch (error) {
            // Error handled silently for production
        }
    }, []);

    // --- 2. Initial Load & Auto-Polling ---
    useEffect(() => {
        fetchNotifications(); 

        const interval = setInterval(() => {
            fetchNotifications();
        }, 5000);

        return () => clearInterval(interval); 
    }, [fetchNotifications]);

    // --- 3. Update Unread Count Automatically ---
    useEffect(() => {
        const count = notifications.filter(n => !n.read && !n.isRead).length;
        setUnreadCount(count);
    }, [notifications]);

    // --- 4. Actions ---

    const markAsRead = async (id) => {
        setNotifications(prev => prev.map(n => n.id === id ? { ...n, read: true, isRead: true } : n));
        
        try {
            await api.put(`/notifications/${id}/read`);
        } catch (error) {
            // Silently fail or re-fetch if necessary
        }
    };

    const markAllAsRead = async () => {
        const userId = localStorage.getItem('userId');
        if (!userId) return;

        setNotifications(prev => prev.map(n => ({ ...n, read: true, isRead: true })));
        setUnreadCount(0);

        try {
            await api.put(`/notifications/user/${userId}/read-all`);
            toast.info("All notifications marked as read");
        } catch (error) {
            fetchNotifications(); 
        }
    };

    const deleteNotification = async (id) => {
        setNotifications(prev => prev.filter(n => n.id !== id));

        try {
            await api.delete(`/notifications/${id}`);
            toast.success("Notification removed");
        } catch (error) {
            fetchNotifications(); 
        }
    };

    const triggerNotification = (message, type = "INFO") => {
        if(type === 'WARNING' || type === 'SECURITY') toast.warning(message);
        else if(type === 'SUCCESS') toast.success(message);
        else toast.info(message);
        
        setTimeout(() => {
            fetchNotifications();
        }, 1000); 
    };

    return (
        <NotificationContext.Provider value={{ 
            notifications, 
            unreadCount, 
            markAsRead, 
            markAllAsRead, 
            deleteNotification, 
            triggerNotification, 
            fetchNotifications 
        }}>
            {children}
        </NotificationContext.Provider>
    );
};