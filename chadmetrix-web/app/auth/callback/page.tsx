// app/auth/callback/page.tsx
"use client";

import { useEffect } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { Loader2 } from "lucide-react";

export default function AuthCallbackPage() {
    const router = useRouter();
    const searchParams = useSearchParams();

    useEffect(() => {
        const token = searchParams.get("token");

        if (token) {
            // Сохраняем токен в cookie
            document.cookie = `token=${token}; path=/; max-age=2592000; secure; samesite=strict`;
            // Редирект на дашборд
            router.push("/dashboard");
        } else {
            // Если нет токена - ошибка
            router.push("/login?error=auth_failed");
        }
    }, [router, searchParams]);

    return (
        <div className="min-h-screen flex items-center justify-center">
            <div className="text-center">
                <Loader2 className="w-12 h-12 animate-spin text-blue-500 mx-auto mb-4" />
                <h1 className="text-2xl font-bold text-white mb-2">Вход в систему...</h1>
                <p className="text-gray-400">Пожалуйста, подождите</p>
            </div>
        </div>
    );
}