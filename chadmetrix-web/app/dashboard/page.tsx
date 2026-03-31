// app/dashboard/page.tsx
"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { Plus, FileText, TrendingUp, User, Gift, Users, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { ReportCard } from "@/components/report-card";
import { useAuth } from "@/lib/hooks/useAuth";
import { getReports } from "@/lib/api";

// Интерфейс на основе моделей БД
interface ReportData {
    id: string;
    report?: {
        overall_score?: number;
    } | null;
    created_at?: string;
}

interface Report {
    id: string;
    score: number;
    date: string;
}

export default function DashboardPage() {
    const { user } = useAuth();
    const [reports, setReports] = useState<Report[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const fetchReports = async () => {
            try {
                const data: ReportData[] = await getReports();
                const formatted: Report[] = data.slice(0, 3).map((item) => ({
                    id: item.id,
                    score: item.report?.overall_score || 0,
                    date: item.created_at || new Date().toISOString(),
                }));
                setReports(formatted);
            } catch (error) {
                console.error("Failed to load reports:", error);
            } finally {
                setLoading(false);
            }
        };

        fetchReports();
    }, []);

    const totalReports = reports.length;
    const avgScore = reports.length > 0
        ? (reports.reduce((sum, r) => sum + r.score, 0) / reports.length).toFixed(1)
        : "0.0";

    return (
        <div className="min-h-screen pt-24 pb-12 px-4 sm:px-6 lg:px-8">
            <div className="max-w-7xl mx-auto">
                <div className="flex flex-col md:flex-row md:items-center md:justify-between mb-8">
                    <div>
                        <h1 className="text-3xl font-bold text-white mb-2">Личный кабинет</h1>
                        <p className="text-gray-400">Управляйте своими анализами и отслеживайте прогресс</p>
                    </div>
                    <div className="mt-4 md:mt-0 flex flex-wrap gap-3">
                        <Link href="/referral">
                            <Button
                                variant="outline"
                                className="border-white/20 text-gray-300 hover:bg-white/10 hover:text-white"
                            >
                                <Gift className="w-4 h-4 mr-2" />
                                Реферальная программа
                            </Button>
                        </Link>
                        <Link href="/analysis/new">
                            <Button className="bg-white text-black hover:bg-gray-200">
                                <Plus className="w-4 h-4 mr-2" />
                                Новый анализ
                            </Button>
                        </Link>
                    </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-12">
                    <div className="glass rounded-2xl p-6 border border-white/10">
                        <div className="flex items-center justify-between mb-4">
                            <FileText className="w-8 h-8 text-gray-400" />
                            <span className="text-2xl font-bold text-white">{totalReports}</span>
                        </div>
                        <p className="text-gray-400">Всего анализов</p>
                    </div>

                    <div className="glass rounded-2xl p-6 border border-white/10">
                        <div className="flex items-center justify-between mb-4">
                            <TrendingUp className="w-8 h-8 text-gray-400" />
                            <span className="text-2xl font-bold text-white">{avgScore}</span>
                        </div>
                        <p className="text-gray-400">Средний балл</p>
                    </div>

                    <div className="glass rounded-2xl p-6 border border-white/10">
                        <div className="flex items-center justify-between mb-4">
                            <User className="w-8 h-8 text-gray-400" />
                            <span className="text-2xl font-bold text-white">
                                {user?.tariff_type === 'free' ? 'Free' : user?.tariff_type?.toUpperCase()}
                            </span>
                        </div>
                        <p className="text-gray-400">Текущий тариф</p>
                    </div>

                    <Link href="/referral" className="group">
                        <div className="glass rounded-2xl p-6 border border-white/10 hover:border-white/30 transition-all cursor-pointer">
                            <div className="flex items-center justify-between mb-4">
                                <div className="flex items-center gap-2">
                                    <Users className="w-8 h-8 text-gray-400" />
                                    <Gift className="w-5 h-5 text-gray-400" />
                                </div>
                                <span className="text-2xl font-bold text-white group-hover:text-gray-300 transition-colors">→</span>
                            </div>
                            <p className="text-gray-400 group-hover:text-gray-300">Реферальная программа</p>
                            <p className="text-xs text-gray-500 mt-1">Пригласи друга — получи бонус</p>
                        </div>
                    </Link>
                </div>

                <div className="mb-8">
                    <div className="flex items-center justify-between mb-6">
                        <h2 className="text-xl font-semibold text-white">Последние отчёты</h2>
                        <Link href="/reports" className="text-gray-400 hover:text-white text-sm">
                            Смотреть все →
                        </Link>
                    </div>

                    {loading ? (
                        <div className="flex justify-center py-12">
                            <Loader2 className="w-8 h-8 animate-spin text-gray-400" />
                        </div>
                    ) : reports.length > 0 ? (
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                            {reports.map((report) => (
                                <ReportCard
                                    key={report.id}
                                    id={report.id}
                                    score={report.score}
                                    date={new Date(report.date)}
                                />
                            ))}
                        </div>
                    ) : (
                        <div className="glass rounded-2xl p-8 border border-white/10 text-center">
                            <p className="text-gray-400 mb-4">У вас пока нет отчётов</p>
                            <Link href="/analysis/new">
                                <Button className="bg-white text-black hover:bg-gray-200">
                                    Сделать первый анализ
                                </Button>
                            </Link>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
}