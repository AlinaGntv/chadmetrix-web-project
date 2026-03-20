// src/app/auth/callback/page.tsx
"use client";

import { useEffect } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import axios from 'axios';

export default function AuthCallback() {
    const router = useRouter();
    const searchParams = useSearchParams();
    const token = searchParams.get('token');

    useEffect(() => {
        if (token) {
            // Сохраняем токен
            localStorage.setItem('token', token);
            axios.defaults.headers.common['Authorization'] = `Bearer ${token}`;

            // Перенаправляем на главную
            router.push('/dashboard');
        } else {
            router.push('/login');
        }
    }, [token, router]);

    return <div>Авторизация...</div>;
}