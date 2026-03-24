// app/reports/page.tsx
"use client";

import { useState, useMemo } from "react";
import { ReportCard } from "@/components/report-card";
import { Filter, Search, ChevronDown } from "lucide-react";
import { Button } from "@/components/ui/button";

// Мок-данные — потом заменишь на API
const mockReports = [
    { id: "1", score: 8.4, date: new Date() },
    { id: "2", score: 7.2, date: new Date(Date.now() - 86400000) },
    { id: "3", score: 9.1, date: new Date(Date.now() - 172800000) },
    { id: "4", score: 6.8, date: new Date(Date.now() - 259200000) },
    { id: "5", score: 8.9, date: new Date(Date.now() - 345600000) },
    { id: "6", score: 7.5, date: new Date(Date.now() - 432000000) },
];

type SortOption = "newest" | "oldest" | "score-high" | "score-low";

export default function ReportsPage() {
    const [searchQuery, setSearchQuery] = useState("");
    const [sortBy, setSortBy] = useState<SortOption>("newest");
    const [showFilters, setShowFilters] = useState(false);
    const [scoreFilter, setScoreFilter] = useState<{ min: number; max: number } | null>(null);

    // Фильтрация и сортировка
    const filteredReports = useMemo(() => {
        let result = [...mockReports];

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
                    return b.date.getTime() - a.date.getTime();
                case "oldest":
                    return a.date.getTime() - b.date.getTime();
                case "score-high":
                    return b.score - a.score;
                case "score-low":
                    return a.score - b.score;
                default:
                    return 0;
            }
        });

        return result;
    }, [searchQuery, sortBy, scoreFilter]);

    return (
        <div className="min-h-screen pt-24 pb-12 px-4 sm:px-6 lg:px-8">
            <div className="max-w-7xl mx-auto">
                <div className="flex flex-col md:flex-row md:items-center md:justify-between mb-8">
                    <div>
                        <h1 className="text-3xl font-bold text-white mb-2">Мои отчёты</h1>
                        <p className="text-gray-400">
                            {filteredReports.length} из {mockReports.length} отчётов
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
                            <ReportCard key={report.id} {...report} />
                        ))}
                    </div>
                ) : (
                    <div className="glass rounded-2xl p-12 border border-white/10 text-center">
                        <p className="text-gray-400 mb-4">Отчёты не найдены</p>
                        <Button
                            variant="outline"
                            onClick={() => {
                                setSearchQuery("");
                                setScoreFilter(null);
                                setSortBy("newest");
                            }}
                            className="glass border-white/20"
                        >
                            Сбросить фильтры
                        </Button>
                    </div>
                )}
            </div>
        </div>
    );
}