// app/referral/page.tsx
"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/lib/hooks/useAuth";
import { getReferralStats } from "@/lib/api";
import { Copy, Check, Users, ShoppingCart, Gift, ArrowLeft, Share2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import Link from "next/link";

// Исправленный интерфейс под реальный API ответ
interface ReferralStats {
    invited_count: number;
    paid_count: number;
    bonuses_earned: number;
    bonus_uses_remaining: number;
    referral_link: string;
}

export default function ReferralPage() {
    const { isAuthenticated, isLoading, user } = useAuth();
    const router = useRouter();
    const [copied, setCopied] = useState(false);
    const [stats, setStats] = useState<ReferralStats | null>(null);
    const [statsLoading, setStatsLoading] = useState(true);

    useEffect(() => {
        if (!isLoading && !isAuthenticated) {
            router.push("/login?redirect=/referral");
        }
    }, [isLoading, isAuthenticated, router]);

    useEffect(() => {
        if (isAuthenticated) {
            loadStats();
        }
    }, [isAuthenticated]);

    const loadStats = async () => {
        try {
            const data = await getReferralStats();
            setStats(data);
        } catch (error) {
            console.error("Failed to load referral stats:", error);
        } finally {
            setStatsLoading(false);
        }
    };

    if (isLoading || !isAuthenticated) {
        return (
            <div className="min-h-screen flex items-center justify-center">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-white"></div>
            </div>
        );
    }

    // Используем referral_link из API или fallback
    const referralLink = stats?.referral_link || `https://chadmetrix.ru/?ref=${user?.id || "demo123"}`;

    const copyToClipboard = () => {
        navigator.clipboard.writeText(referralLink);
        setCopied(true);
        setTimeout(() => setCopied(false), 2000);
    };

    const shareReferral = async () => {
        if (navigator.share) {
            try {
                await navigator.share({
                    title: "ChadMetrix — анализ внешности с ИИ",
                    text: "Попробуй ChadMetrix! Получи профессиональный анализ внешности с помощью ИИ.",
                    url: referralLink,
                });
            } catch {
                // Пользователь отменил шеринг
            }
        } else {
            copyToClipboard();
        }
    };

    // Исправленные дефолтные значения
    const displayStats = stats || {
        invited_count: 0,
        paid_count: 0,
        bonuses_earned: 0,
        bonus_uses_remaining: 0,
        referral_link: `https://chadmetrix.ru/?ref=${user?.id || "demo123"}`
    };

    return (
        <div className="min-h-screen pt-24 pb-12 px-4">
            <div className="max-w-2xl mx-auto">
                {/* Кнопка назад */}
                <div className="mb-6">
                    <Link href="/dashboard">
                        <Button variant="ghost" className="text-gray-400 hover:text-white">
                            <ArrowLeft className="w-4 h-4 mr-2" />
                            Вернуться в кабинет
                        </Button>
                    </Link>
                </div>

                <div className="glass rounded-3xl p-8 border border-white/10 text-center">
                    {/* Иконка */}
                    <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-linear-to-br from-purple-500/20 to-blue-500/20 border border-white/10 mb-6">
                        <Gift className="w-8 h-8 text-purple-400" />
                    </div>

                    <h1 className="text-3xl font-bold text-white mb-4">Пригласи друга</h1>
                    <p className="text-gray-400 mb-8">
                        Отправь эту ссылку друзьям. Когда они зарегистрируются и купят анализ,
                        ты получишь <span className="text-white font-semibold">+1 бесплатный анализ</span>.
                    </p>

                    {/* Ссылка и кнопки */}
                    <div className="flex gap-2 mb-8">
                        <input
                            type="text"
                            value={referralLink}
                            readOnly
                            className="flex-1 bg-black/50 border border-white/20 rounded-lg px-4 py-3 text-gray-300 text-sm focus:outline-none focus:border-white/40"
                        />
                        <Button
                            onClick={copyToClipboard}
                            className="bg-white text-black hover:bg-gray-200 px-6"
                        >
                            {copied ? <Check className="w-4 h-4" /> : <Copy className="w-4 h-4" />}
                        </Button>
                        {typeof navigator !== "undefined" && typeof navigator.share !== "undefined" && (
                            <Button
                                onClick={shareReferral}
                                variant="outline"
                                className="border-white/20 hover:bg-white/10"
                            >
                                <Share2 className="w-4 h-4" />
                            </Button>
                        )}
                    </div>

                    {/* Статистика */}
                    <div className="grid grid-cols-3 gap-4 text-center">
                        <div className="p-4 rounded-xl bg-white/5 border border-white/10 hover:bg-white/10 transition-colors">
                            <Users className="w-5 h-5 text-blue-400 mx-auto mb-2" />
                            <div className="text-2xl font-bold text-white mb-1">
                                {statsLoading ? (
                                    <span className="inline-block w-6 h-6 border-2 border-white/30 border-t-white rounded-full animate-spin"></span>
                                ) : (
                                    displayStats.invited_count
                                )}
                            </div>
                            <div className="text-xs text-gray-500">Приглашено</div>
                        </div>

                        <div className="p-4 rounded-xl bg-white/5 border border-white/10 hover:bg-white/10 transition-colors">
                            <ShoppingCart className="w-5 h-5 text-green-400 mx-auto mb-2" />
                            <div className="text-2xl font-bold text-white mb-1">
                                {statsLoading ? (
                                    <span className="inline-block w-6 h-6 border-2 border-white/30 border-t-white rounded-full animate-spin"></span>
                                ) : (
                                    displayStats.paid_count
                                )}
                            </div>
                            <div className="text-xs text-gray-500">Купили анализ</div>
                        </div>

                        <div className="p-4 rounded-xl bg-linear-to-br from-purple-500/10 to-blue-500/10 border border-purple-500/20 hover:border-purple-500/40 transition-colors">
                            <Gift className="w-5 h-5 text-purple-400 mx-auto mb-2" />
                            <div className="text-2xl font-bold text-white mb-1">
                                {statsLoading ? (
                                    <span className="inline-block w-6 h-6 border-2 border-white/30 border-t-white rounded-full animate-spin"></span>
                                ) : (
                                    displayStats.bonus_uses_remaining
                                )}
                            </div>
                            <div className="text-xs text-gray-500">Бонусов на счету</div>
                        </div>
                    </div>

                    {/* Дополнительная информация */}
                    {displayStats.bonus_uses_remaining > 0 && (
                        <div className="mt-6 p-4 rounded-xl bg-green-500/10 border border-green-500/20">
                            <p className="text-green-400 text-sm">
                                🎉 У вас есть {displayStats.bonus_uses_remaining} бонусных анализов!
                                Они автоматически применятся при следующем анализе (только анфас).
                            </p>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
}