// lib/hooks/useAuth.ts
"use client";

import { useState, useEffect, useCallback } from "react";
import { api, getCurrentUser } from "@/lib/api";

// Обновленный интерфейс User, соответствующий API /api/auth/me
interface User {
    id: string;
    email?: string;
    full_name?: string;
    avatar_url?: string;
    tariff_type: string;
    tariff_expire?: string;
    photo_uses_remaining: number;
    bonus_uses_remaining: number;
    total_uses_remaining: number;  // ← ДОБАВИТЬ агрегированное поле
    payment_method_id?: string;
    auto_payment_enabled?: boolean;
}

export function useAuth() {
    const [user, setUser] = useState<User | null>(null);
    const [isLoading, setIsLoading] = useState(true);

    const checkAuth = useCallback(async () => {
        try {
            const userData = await getCurrentUser();
            // Приводим тип с дефолтными значениями
            setUser({
                id: userData.id,
                email: userData.email,
                full_name: userData.full_name,
                avatar_url: userData.avatar_url,
                tariff_type: userData.tariff_type,
                tariff_expire: userData.tariff_expire,
                photo_uses_remaining: userData.photo_uses_remaining || 0,
                bonus_uses_remaining: userData.bonus_uses_remaining || 0,
                total_uses_remaining: userData.total_uses_remaining ?? (userData.photo_uses_remaining + userData.bonus_uses_remaining), // fallback на всякий случай
                payment_method_id: userData.payment_method_id,
                auto_payment_enabled: userData.auto_payment_enabled,
            });
        } catch {
            setUser(null);
        } finally {
            setIsLoading(false);
        }
    }, []);

    useEffect(() => {
        checkAuth();
    }, [checkAuth]);

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

    const refreshUser = useCallback(async () => {
        setIsLoading(true);
        await checkAuth();
    }, [checkAuth]);

    return {
        user,
        isLoading,
        isAuthenticated: !!user,
        loginWithGoogle,
        logout,
        refreshUser,
    };
}