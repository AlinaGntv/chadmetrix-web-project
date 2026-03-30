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
    tariff_expire?: string;           // ← ДОБАВИТЬ
    photo_uses_remaining: number;
    payment_method_id?: string;       // ← ДОБАВИТЬ (для автоплатежей)
    auto_payment_enabled?: boolean;   // ← ДОБАВИТЬ (для автоплатежей)
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
            setUser(null);
        } finally {
            setIsLoading(false);
        }
    };

    const loginWithGoogle = (refCode?: string) => {
        const url = refCode
            ? `/api/auth/login/google?ref=${encodeURIComponent(refCode)}`
            : "/api/auth/login/google";
        window.location.href = url;
    };

    const logout = async () => {
        try {
            await api.post("/auth/logout");
            document.cookie = "token=; path=/; expires=Thu, 01 Jan 1970 00:00:00 GMT";
            setUser(null);
            window.location.href = "/";
        } catch {
            console.error("Logout error");
        }
    };

    return {
        user,
        isLoading,
        isAuthenticated: !!user,
        loginWithGoogle,
        logout,
        refreshUser: checkAuth  // ← Уже есть, отлично
    };
}