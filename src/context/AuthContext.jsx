/* eslint-disable react-refresh/only-export-components */
import { createContext, useContext, useState, useEffect, useCallback } from 'react';
import api from '../api/axios';
import { googleLogout } from '@react-oauth/google';

const AuthContext = createContext();

export const useAuth = () => useContext(AuthContext);

export const AuthProvider = ({ children }) => {
    const [user, setUser] = useState(null);
    const [token, setToken] = useState(localStorage.getItem('access_token'));
    const [loading, setLoading] = useState(true);
    const [notificationCount, setNotificationCount] = useState(0);

    const refreshNotifications = useCallback(async () => {
        if (!user?.id) return;
        try {
            const res = await api.get('/notifications/unread-count');
            setNotificationCount(res.data.count);
        } catch (err) {
            console.error('Failed to fetch notifications', err);
        }
    }, [user?.id]);

    useEffect(() => {
        // On mount, check if we have a token and valid user data
        const storedUser = localStorage.getItem('user_data');
        if (token && storedUser) {
            setTimeout(() => setUser(JSON.parse(storedUser)), 0);
        }
        setTimeout(() => setLoading(false), 0);
    }, [token]);

    useEffect(() => {
        if (user?.id) setTimeout(() => refreshNotifications(), 0);
    }, [user?.id, refreshNotifications]);

    const loginWithGoogle = async (googleData) => {
        try {
            // 1. Send Google Token to Backend
            const response = await api.post('/auth/google', {
                token: googleData.credential,
            });

            const { access_token, user: userData } = response.data;

            // 2. Save Data & State
            localStorage.setItem('access_token', access_token);
            localStorage.setItem('user_data', JSON.stringify(userData));

            setToken(access_token);
            setUser(userData);

            return { success: true };
        } catch (error) {
            console.error("Login Failed:", error);
            return {
                success: false,
                error: error.response?.data?.detail || "Login failed"
            };
        }
    };

    const logout = () => {
        googleLogout();
        localStorage.removeItem('access_token');
        localStorage.removeItem('user_data');
        setToken(null);
        setUser(null);
        setNotificationCount(0);
        // Redirect handled by UI or ProtectedRoute
    };

    // Update user data in state and localStorage (for profile edits)
    const updateUser = (updates) => {
        setUser(prev => {
            const updated = { ...prev, ...updates };
            localStorage.setItem('user_data', JSON.stringify(updated));
            return updated;
        });
    };

    // DEV ONLY: Login as any user by ID (bypasses Google)
    const devLogin = async (userId) => {
        try {
            const response = await api.post(`/auth/dev/login/${userId}`);
            const { access_token, user: userData } = response.data;

            localStorage.setItem('access_token', access_token);
            localStorage.setItem('user_data', JSON.stringify(userData));

            setToken(access_token);
            setUser(userData);

            return { success: true };
        } catch (error) {
            console.error("Dev Login Failed:", error);
            return {
                success: false,
                error: error.response?.data?.detail || "Dev login failed"
            };
        }
    };

    const value = {
        user,
        token,
        loading,
        notificationCount,
        refreshNotifications,
        loginWithGoogle,
        devLogin,
        logout,
        updateUser,
        isAuthenticated: !!token,
    };

    return (
        <AuthContext.Provider value={value}>
            {!loading && children}
        </AuthContext.Provider>
    );
};
