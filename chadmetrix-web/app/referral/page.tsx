// app/referral/page.tsx
"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/lib/hooks/useAuth";
import { Copy, Check } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useState } from "react";

export default function ReferralPage() {
    const { isAuthenticated, isLoading, user } = useAuth();
    const router = useRouter();
    const [copied, setCopied] = useState(false);

    useEffect(() => {
        if (!isLoading && !isAuthenticated) {
            router.push("/login?redirect=/referral");
        }
    }, [isLoading, isAuthenticated, router]);

    if (isLoading || !isAuthenticated) {
        return (
            <div className="min-h-screen flex items-center justify-center">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-white"></div>
            </div>
        );
    }

    // Генерация реферальной ссылки (потом с бэкенда)
    const referralLink = `https://chadmetrix.ru/?ref=${user?.id || "demo123"}`;

    const copyToClipboard = () => {
        navigator.clipboard.writeText(referralLink);
        setCopied(true);
        setTimeout(() => setCopied(false), 2000);
    };

    return (
        <div className="min-h-screen pt-24 pb-12 px-4">
            <div className="max-w-2xl mx-auto">
                <div className="glass rounded-3xl p-8 border border-white/10 text-center">
                    <h1 className="text-3xl font-bold text-white mb-4">Пригласи друга</h1>
                    <p className="text-gray-400 mb-8">
                        Отправь эту ссылку друзьям. Когда они зарегистрируются и купят анализ,
                        ты получишь <span className="text-white font-semibold">+1 бесплатный анализ</span>.
                    </p>

                    <div className="flex gap-2 mb-6">
                        <input
                            type="text"
                            value={referralLink}
                            readOnly
                            className="flex-1 bg-black/50 border border-white/20 rounded-lg px-4 py-3 text-gray-300 text-sm"
                        />
                        <Button
                            onClick={copyToClipboard}
                            className="bg-white text-black hover:bg-gray-200 px-6"
                        >
                            {copied ? <Check className="w-4 h-4" /> : <Copy className="w-4 h-4" />}
                        </Button>
                    </div>

                    <div className="grid grid-cols-3 gap-4 text-center">
                        <div className="p-4 rounded-xl bg-white/5 border border-white/10">
                            <div className="text-2xl font-bold text-white mb-1">0</div>
                            <div className="text-xs text-gray-500">Приглашено</div>
                        </div>
                        <div className="p-4 rounded-xl bg-white/5 border border-white/10">
                            <div className="text-2xl font-bold text-white mb-1">0</div>
                            <div className="text-xs text-gray-500">Купили анализ</div>
                        </div>
                        <div className="p-4 rounded-xl bg-white/5 border border-white/10">
                            <div className="text-2xl font-bold text-white mb-1">0</div>
                            <div className="text-xs text-gray-500">Бонусов на счету</div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}