"use client";

import { useEffect } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { Loader2 } from "lucide-react";

export default function AuthCallback() {
    const router = useRouter();
    const searchParams = useSearchParams();

    useEffect(() => {
        const token = searchParams.get("token");
        if (token) {
            document.cookie = `access_token=${token}; path=/; max-age=86400; SameSite=Lax`;
            router.push("/dashboard");
        } else {
            router.push("/login?error=auth_failed");
        }
    }, [router, searchParams]);

    return (
        <div className="min-h-screen flex items-center justify-center bg-black">
            <div className="text-center">
                <Loader2 className="h-8 w-8 animate-spin text-white mx-auto" />
                <p className="mt-4 text-zinc-500">Выполняется вход...</p>
            </div>
        </div>
    );
}