// app/reports/page.tsx
"use client";

import { useState, useMemo, useEffect } from "react";
import { ReportCard } from "@/components/report-card";
import { Filter, Search, ChevronDown, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { getReports } from "@/lib/api";
import Link from "next/link";

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

type SortOption = "newest" | "oldest" | "score-high" | "score-low";

export default function ReportsPage() {
    const [reports, setReports] = useState<Report[]>([]);
    const [loading, setLoading] = useState(true);
    const [searchQuery, setSearchQuery] = useState("");
    const [sortBy, setSortBy] = useState<SortOption>("newest");
    const [showFilters, setShowFilters] = useState(false);
    const [scoreFilter, setScoreFilter] = useState<{ min: number; max: number } | null>(null);

    // Загрузка реальных отчётов
    useEffect(() => {
        const fetchReports = async () => {
            try {
                const data: ReportData[] = await getReports();
                // Преобразуем данные из API в нужный формат
                const formatted: Report[] = data.map((item) => ({
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

    // Фильтрация и сортировка
    const filteredReports = useMemo(() => {
        let result = [...reports];

        // Поиск по ID или оценке
        if (searchQuery) {
            const query = searchQuery.toLowerCase();
            result = result.filter(report =>
                report.id.toLowerCase().includes(query) ||
                report.score.toString().includes(query)
            );
        }

        // Фильтр по оценке
        if (scoreFilter) {
            result = result.filter(report =>
                report.score >= scoreFilter.min && report.score <= scoreFilter.max
            );
        }

        // Сортировка
        result.sort((a, b) => {
            switch (sortBy) {
                case "newest":
                    return new Date(b.date).getTime() - new Date(a.date).getTime();
                case "oldest":
                    return new Date(a.date).getTime() - new Date(b.date).getTime();
                case "score-high":
                    return b.score - a.score;
                case "score-low":
                    return a.score - b.score;
                default:
                    return 0;
            }
        });

        return result;
    }, [reports, searchQuery, sortBy, scoreFilter]);

    if (loading) {
        return (
            <div className="min-h-screen pt-24 flex items-center justify-center">
                <Loader2 className="w-8 h-8 animate-spin text-gray-400" />
            </div>
        );
    }

    return (
        <div className="min-h-screen pt-24 pb-12 px-4 sm:px-6 lg:px-8">
            <div className="max-w-7xl mx-auto">
                <div className="flex flex-col md:flex-row md:items-center md:justify-between mb-8">
                    <div>
                        <h1 className="text-3xl font-bold text-white mb-2">Мои отчёты</h1>
                        <p className="text-gray-400">
                            {filteredReports.length} отчётов
                        </p>
                    </div>

                    <div className="mt-4 md:mt-0 flex flex-col sm:flex-row gap-3">
                        {/* Поиск */}
                        <div className="relative">
                            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-500" />
                            <input
                                type="text"
                                placeholder="Поиск по ID или оценке..."
                                value={searchQuery}
                                onChange={(e) => setSearchQuery(e.target.value)}
                                className="pl-10 pr-4 py-2 bg-white/5 border border-white/10 rounded-lg text-white placeholder-gray-500 focus:outline-none focus:border-white/30 w-full sm:w-64"
                            />
                        </div>

                        {/* Сортировка */}
                        <div className="relative">
                            <select
                                value={sortBy}
                                onChange={(e) => setSortBy(e.target.value as SortOption)}
                                className="appearance-none bg-white/5 border border-white/10 rounded-lg px-4 py-2 pr-10 text-white focus:outline-none focus:border-white/30 cursor-pointer"
                            >
                                <option value="newest" className="bg-black">Сначала новые</option>
                                <option value="oldest" className="bg-black">Сначала старые</option>
                                <option value="score-high" className="bg-black">Высокая оценка</option>
                                <option value="score-low" className="bg-black">Низкая оценка</option>
                            </select>
                            <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-500 pointer-events-none" />
                        </div>

                        {/* Фильтр */}
                        <Button
                            variant="outline"
                            onClick={() => setShowFilters(!showFilters)}
                            className={`glass border-white/20 ${showFilters ? "bg-white/10" : ""}`}
                        >
                            <Filter className="w-4 h-4 mr-2" />
                            Фильтры
                        </Button>
                    </div>
                </div>

                {/* Панель фильтров */}
                {showFilters && (
                    <div className="glass rounded-2xl p-6 border border-white/10 mb-8">
                        <h3 className="text-white font-semibold mb-4">Фильтр по оценке</h3>
                        <div className="flex gap-2 flex-wrap">
                            <Button
                                variant="outline"
                                size="sm"
                                onClick={() => setScoreFilter(null)}
                                className={!scoreFilter ? "bg-white/20" : "glass border-white/10"}
                            >
                                Все
                            </Button>
                            <Button
                                variant="outline"
                                size="sm"
                                onClick={() => setScoreFilter({ min: 8, max: 10 })}
                                className={scoreFilter?.min === 8 ? "bg-white/20" : "glass border-white/10"}
                            >
                                8+ (Отлично)
                            </Button>
                            <Button
                                variant="outline"
                                size="sm"
                                onClick={() => setScoreFilter({ min: 6, max: 7.9 })}
                                className={scoreFilter?.min === 6 ? "bg-white/20" : "glass border-white/10"}
                            >
                                6-8 (Хорошо)
                            </Button>
                            <Button
                                variant="outline"
                                size="sm"
                                onClick={() => setScoreFilter({ min: 0, max: 5.9 })}
                                className={scoreFilter?.min === 0 ? "bg-white/20" : "glass border-white/10"}
                            >
                                {"<6 (Нужна работа)"}
                            </Button>
                        </div>
                    </div>
                )}

                {/* Список отчётов */}
                {filteredReports.length > 0 ? (
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                        {filteredReports.map((report) => (
                            <ReportCard
                                key={report.id}
                                id={report.id}
                                score={report.score}
                                date={new Date(report.date)}
                            />
                        ))}
                    </div>
                ) : (
                    <div className="glass rounded-2xl p-12 border border-white/10 text-center">
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
    );
}