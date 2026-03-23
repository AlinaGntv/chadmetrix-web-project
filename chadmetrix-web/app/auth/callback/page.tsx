// app/auth/callback/page.tsx
"use client";

import { Suspense, useEffect } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { Loader2 } from "lucide-react";

function CallbackContent() {
    const router = useRouter();
    const searchParams = useSearchParams();

    useEffect(() => {
        const token = searchParams.get("token");

        if (token) {
            // Устанавливаем cookie с правильными параметрами
            // Убираем secure для разработки, добавляем SameSite=Lax
            document.cookie = `token=${token}; path=/; max-age=2592000; SameSite=Lax; ${window.location.protocol === 'https:' ? 'secure;' : ''}`;

            // Небольшая задержка для установки cookie
            setTimeout(() => {
                router.push("/dashboard");
            }, 100);
        } else {
            router.push("/login?error=auth_failed");
        }
    }, [router, searchParams]);

    return (
        <div className="min-h-screen flex items-center justify-center">
            <div className="text-center">
                <Loader2 className="w-12 h-12 animate-spin text-gray-500 mx-auto mb-4" />
                <h1 className="text-2xl font-bold text-white mb-2">Вход в систему...</h1>
                <p className="text-gray-400">Пожалуйста, подождите</p>
            </div>
        </div>
    );
}

export default function AuthCallbackPage() {
    return (
        <Suspense fallback={
            <div className="min-h-screen flex items-center justify-center">
                <div className="text-center">
                    <Loader2 className="w-12 h-12 animate-spin text-gray-500 mx-auto mb-4" />
                    <h1 className="text-2xl font-bold text-white mb-2">Загрузка...</h1>
                </div>
            </div>
        }>
            <CallbackContent />
        </Suspense>
    );
}