// lib/hooks/useAuth.ts
"use client";

import { useState, useEffect } from "react";
import { api, getCurrentUser } from "@/lib/api";

interface User {
    id: string;
    email: string;
    full_name: string;
    avatar_url: string;
    tariff_type: string;
    photo_uses_remaining: number;
}

export function useAuth() {
    const [user, setUser] = useState<User | null>(null);
    const [isLoading, setIsLoading] = useState(true);

    useEffect(() => {
        checkAuth();
    }, []);

    const checkAuth = async () => {
        try {
            const userData = await getCurrentUser();
            setUser(userData);
        } catch {
            // Убрал 'error' — он не использовался
            setUser(null);
        } finally {
            setIsLoading(false);
        }
    };

    const loginWithGoogle = () => {
        window.location.href = "/api/auth/login/google";
    };

    const logout = async () => {
        try {
            await api.post("/auth/logout");
            document.cookie = "token=; path=/; expires=Thu, 01 Jan 1970 00:00:00 GMT";
            setUser(null);
            window.location.href = "/";
        } catch {
            // Убрал 'error' — он не использовался
            console.error("Logout error");
        }
    };

    return {
        user,
        isLoading,
        isAuthenticated: !!user,
        loginWithGoogle,
        logout,
        refreshUser: checkAuth
    };
}