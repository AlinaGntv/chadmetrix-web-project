"use client";

import { useEffect, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import axios from 'axios';

function AuthCallbackContent() {
    const router = useRouter();
    const searchParams = useSearchParams();
    const token = searchParams.get('token');

    useEffect(() => {
        if (token) {
            localStorage.setItem('token', token);
            axios.defaults.headers.common['Authorization'] = `Bearer ${token}`;
            router.push('/dashboard');
        } else {
            router.push('/login');
        }
    }, [token, router]);

    return <div>Авторизация...</div>;
}

export default function AuthCallback() {
    return (
        <Suspense fallback={<div>Загрузка...</div>}>
            <AuthCallbackContent />
        </Suspense>
    );
}