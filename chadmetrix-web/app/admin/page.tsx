// app/admin/page.tsx
"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/lib/hooks/useAuth";
import { PromocodeManager } from "@/components/admin/PromocodeManager";
import { ReviewManager } from "@/components/admin/ReviewManager";
import { api } from "@/lib/api";
import { Users, Star, CreditCard, BarChart3, DollarSign, Ticket, Loader2 } from "lucide-react";

interface AdminStats {
    total_users: number;
    total_reviews: number;
    total_payments: number;
    total_analyses: number;
    total_revenue: number;
    active_promocodes: number;
}

export default function AdminPage() {
    const { user, isAuthenticated, isLoading } = useAuth();
    const router = useRouter();
    const [stats, setStats] = useState<AdminStats | null>(null);
    const [isLoadingStats, setIsLoadingStats] = useState(true);

    // Проверка прав администратора
    const isAdmin = user?.email === "gntv.surname@gmail.com";

    useEffect(() => {
        if (!isLoading && !isAuthenticated) {
            router.push("/login?redirect=/admin");
        }
        if (isAuthenticated && !isAdmin) {
            router.push("/dashboard");
        }
        if (isAdmin) {
            fetchStats();
        }
    }, [isLoading, isAuthenticated, isAdmin, router]);

    const fetchStats = async () => {
        try {
            const response = await api.get("/payments/admin/stats");
            setStats(response.data);
        } catch (error) {
            console.error("Failed to fetch stats:", error);
        } finally {
            setIsLoadingStats(false);
        }
    };

    if (isLoading || !isAuthenticated) {
        return (
            <div className="min-h-screen flex items-center justify-center">
                <Loader2 className="w-8 h-8 animate-spin text-white" />
            </div>
        );
    }

    if (!isAdmin) {
        return null;
    }

    const statCards = [
        { title: "Пользователей", value: stats?.total_users || 0, icon: Users, color: "blue" },
        { title: "Отзывов", value: stats?.total_reviews || 0, icon: Star, color: "yellow" },
        { title: "Платежей", value: stats?.total_payments || 0, icon: CreditCard, color: "green" },
        { title: "Анализов", value: stats?.total_analyses || 0, icon: BarChart3, color: "purple" },
        { title: "Выручка", value: `${stats?.total_revenue || 0}₽`, icon: DollarSign, color: "orange" },
        { title: "Активных промокодов", value: stats?.active_promocodes || 0, icon: Ticket, color: "pink" },
    ];

    return (
        <div className="min-h-screen pt-24 pb-12 px-4">
            <div className="max-w-7xl mx-auto">
                <h1 className="text-3xl font-bold text-white mb-8">Админ-панель</h1>

                {/* Статистика */}
                {!isLoadingStats && stats && (
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 mb-8">
                        {statCards.map((card) => {
                            const Icon = card.icon;
                            const colorClasses = {
                                blue: "from-blue-500/20 to-blue-600/10 border-blue-500/20",
                                yellow: "from-yellow-500/20 to-yellow-600/10 border-yellow-500/20",
                                green: "from-green-500/20 to-green-600/10 border-green-500/20",
                                purple: "from-purple-500/20 to-purple-600/10 border-purple-500/20",
                                orange: "from-orange-500/20 to-orange-600/10 border-orange-500/20",
                                pink: "from-pink-500/20 to-pink-600/10 border-pink-500/20",
                            };
                            return (
                                <div
                                    key={card.title}
                                    className={`glass rounded-xl p-6 border bg-linear-to-br ${colorClasses[card.color as keyof typeof colorClasses]}`}
                                >
                                    <div className="flex items-center justify-between mb-2">
                                        <Icon className="w-8 h-8 text-gray-400" />
                                        <span className="text-2xl font-bold text-white">{card.value}</span>
                                    </div>
                                    <p className="text-gray-400 text-sm">{card.title}</p>
                                </div>
                            );
                        })}
                    </div>
                )}

                {/* Управление промокодами */}
                <div className="glass rounded-2xl p-6 border border-white/10">
                    <PromocodeManager />
                </div>
                {/* Управление отзывами */}
                <div className="glass rounded-2xl p-6 border border-white/10 mt-6">
                    <ReviewManager />
                </div>
            </div>
        </div>
    );
}