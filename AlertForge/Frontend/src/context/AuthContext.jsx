import React, { createContext, useContext, useState, useEffect } from 'react';
import { authApi } from '@/api/auth.api';

const AuthContext = createContext();

export const AuthProvider = ({ children }) => {
    const [user, setUser] = useState(null);
    const [loading, setLoading] = useState(true);

    const fetchUser = async () => {
        try {
            const data = await authApi.me();
            setUser(data);
        } catch (error) {
            console.error("[AuthContext] Failed to fetch user:", error);
            setUser(null);
            // Don't clear token here, wait for 401 interceptor if it's truly expired
        } finally {
            setLoading(false);
        }
    };

    const logout = async () => {
        try {
            await authApi.logout();
            localStorage.removeItem("alertforge.accessToken");
            setUser(null);
        } catch (error) {
            console.error("[AuthContext] Logout failed:", error);
        }
    };

    useEffect(() => {
        fetchUser();

        // Listen for auth-expired event from apiClient
        const handleAuthExpired = () => {
            setUser(null);
            localStorage.removeItem("alertforge.accessToken");
        };
        window.addEventListener("alertforge:auth-expired", handleAuthExpired);
        return () => window.removeEventListener("alertforge:auth-expired", handleAuthExpired);
    }, []);

    return (
        <AuthContext.Provider value={{ user, setUser, loading, fetchUser, logout }}>
            {children}
        </AuthContext.Provider>
    );
};

export const useAuth = () => {
    const context = useContext(AuthContext);
    if (!context) {
        throw new Error("useAuth must be used within an AuthProvider");
    }
    return context;
};
