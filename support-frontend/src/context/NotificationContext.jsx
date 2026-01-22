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
        
        // 🔍 DEBUG: Check if we have the ID
        console.log("🔔 [NotificationContext] Fetching for User ID:", userId);

        if (!userId) {
            console.warn("⚠️ [NotificationContext] No User ID found in localStorage. Skipping fetch.");
            return;
        }

        try {
            const response = await api.get(`/notifications/${userId}`);
            console.log("✅ [NotificationContext] Data received:", response.data);
            setNotifications(response.data);
        } catch (error) {
            console.error("❌ [NotificationContext] API Error:", error);
        }
    }, []);

    // --- 2. Initial Load & Auto-Polling ---
    useEffect(() => {
        fetchNotifications(); // Load immediately on mount

        // Poll every 30 seconds to keep data fresh
        const interval = setInterval(() => {
            fetchNotifications();
        }, 5000);

        return () => clearInterval(interval); 
    }, [fetchNotifications]);

    // --- 3. Update Unread Count Automatically ---
    useEffect(() => {
        // Backend might serialize 'isRead' as 'read' or 'isRead'. We check both.
        const count = notifications.filter(n => !n.read && !n.isRead).length;
        setUnreadCount(count);
    }, [notifications]);

    // --- 4. Actions ---

    // Mark single as read
    const markAsRead = async (id) => {
        // 1. Optimistic Update (Immediate UI change)
        setNotifications(prev => prev.map(n => n.id === id ? { ...n, read: true, isRead: true } : n));
        
        // 2. Backend Request
        try {
            await api.put(`/notifications/${id}/read`);
        } catch (error) {
            console.error("Failed to mark notification as read", error);
        }
    };

    // Mark all as read
    const markAllAsRead = async () => {
        const userId = localStorage.getItem('userId');
        if (!userId) return;

        // 1. Optimistic Update
        setNotifications(prev => prev.map(n => ({ ...n, read: true, isRead: true })));
        setUnreadCount(0);

        // 2. Backend Request
        try {
            await api.put(`/notifications/user/${userId}/read-all`);
            toast.info("All notifications marked as read");
        } catch (error) {
            console.error("Failed to mark all as read", error);
            fetchNotifications(); // Re-fetch to sync with server if failed
        }
    };

    // Delete notification
    const deleteNotification = async (id) => {
        // 1. Optimistic Update
        setNotifications(prev => prev.filter(n => n.id !== id));

        // 2. Backend Request
        try {
            await api.delete(`/notifications/${id}`);
            toast.success("Notification removed");
        } catch (error) {
            console.error("Failed to delete notification", error);
            fetchNotifications(); // Re-fetch to sync
        }
    };

    // Manual Trigger (Used when performing actions locally to force a refresh)
    const triggerNotification = (message, type = "INFO") => {
        // Show local toast
        if(type === 'WARNING' || type === 'SECURITY') toast.warning(message);
        else if(type === 'SUCCESS') toast.success(message);
        else toast.info(message);
        
        // Refresh list from server (in case backend created a new DB entry)
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