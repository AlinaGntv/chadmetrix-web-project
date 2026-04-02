// lib/hooks/useAuth.ts
"use client";

import { useState, useEffect } from "react";
import { api, getCurrentUser } from "@/lib/api";

// Используем тот же тип что и в api.ts или делаем поля необязательными
interface User {
    id: string;
    email?: string;                    // ← сделать необязательным
    full_name?: string;                // ← сделать необязательным
    avatar_url?: string;               // ← сделать необязательным
    tariff_type: string;
    tariff_expire?: string;
    photo_uses_remaining: number;
    bonus_uses_remaining: number;    // ← ДОБАВИТЬ
    payment_method_id?: string;
    auto_payment_enabled?: boolean;
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
            // Приводим тип с дефолтным значением для бонусов
            setUser({
                ...userData,
                bonus_uses_remaining: userData.bonus_uses_remaining || 0
            });
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
        refreshUser: checkAuth
    };
}