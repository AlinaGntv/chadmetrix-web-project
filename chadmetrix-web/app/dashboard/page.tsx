// app/dashboard/page.tsx
"use client";

import Link from "next/link";
import { Plus, FileText, TrendingUp, User, Gift, Users } from "lucide-react";
import { Button } from "@/components/ui/button";
import { ReportCard } from "@/components/report-card";

const recentReports = [
    { id: "1", score: 8.4, date: new Date(), metricsCount: 17 },
    { id: "2", score: 7.2, date: new Date(Date.now() - 86400000), metricsCount: 17 },
    { id: "3", score: 9.1, date: new Date(Date.now() - 172800000), metricsCount: 17 },
];

export default function DashboardPage() {
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
                                className="border-purple-500/30 text-purple-300 hover:bg-purple-500/10 hover:text-purple-200"
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
                            <span className="text-2xl font-bold text-white">12</span>
                        </div>
                        <p className="text-gray-400">Всего анализов</p>
                    </div>

                    <div className="glass rounded-2xl p-6 border border-white/10">
                        <div className="flex items-center justify-between mb-4">
                            <TrendingUp className="w-8 h-8 text-green-400" />
                            <span className="text-2xl font-bold text-white">8.2</span>
                        </div>
                        <p className="text-gray-400">Средний балл</p>
                    </div>

                    <div className="glass rounded-2xl p-6 border border-white/10">
                        <div className="flex items-center justify-between mb-4">
                            <User className="w-8 h-8 text-gray-400" />
                            <span className="text-2xl font-bold text-white">Pro</span>
                        </div>
                        <p className="text-gray-400">Текущий тариф</p>
                    </div>

                    {/* === НОВОЕ: Карточка рефералов === */}
                    <Link href="/referral" className="group">
                        <div className="glass rounded-2xl p-6 border border-purple-500/20 bg-linear-to-br from-purple-500/5 to-blue-500/5 hover:border-purple-500/40 transition-all cursor-pointer">
                            <div className="flex items-center justify-between mb-4">
                                <div className="flex items-center gap-2">
                                    <Users className="w-8 h-8 text-purple-400" />
                                    <Gift className="w-5 h-5 text-purple-300" />
                                </div>
                                <span className="text-2xl font-bold text-white group-hover:text-purple-300 transition-colors">→</span>
                            </div>
                            <p className="text-gray-400 group-hover:text-gray-300">Реферальная программа</p>
                            <p className="text-xs text-purple-400/70 mt-1">Пригласи друга — получи бонус</p>
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

                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                        {recentReports.map((report) => (
                            <ReportCard key={report.id} {...report} />
                        ))}
                    </div>
                </div>
            </div>
        </div>
    );
}