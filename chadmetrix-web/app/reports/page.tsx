"use client";

import { useState, useMemo, useEffect, useRef } from "react";
import { ReportCard } from "@/components/report-card";
import { Filter, Search, ChevronDown, Loader2, BarChart3, Clock, CheckCircle2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { getReports } from "@/lib/api";
import Link from "next/link";
import { useAuth } from "@/lib/hooks/useAuth";
import { useSearchParams } from "next/navigation";
import { Suspense } from "react";

interface ReportData {
    id: string;
    overall_score?: number | null;
    potential_score?: number | null;
    created_at?: string;
    updated_at?: string;
    tariff?: string;
}

interface Report {
    id: string;
    score: number;
    date: string;
}

type SortOption = "newest" | "oldest" | "score-high" | "score-low";

function ReportsContent() {
    const { user } = useAuth();
    const searchParams = useSearchParams();
    const pendingAnalysisId = searchParams.get("pending");

    const [reports, setReports] = useState<Report[]>([]);
    const [loading, setLoading] = useState(true);
    const [searchQuery, setSearchQuery] = useState("");
    const [sortBy, setSortBy] = useState<SortOption>("newest");
    const [showFilters, setShowFilters] = useState(false);
    const [scoreFilter, setScoreFilter] = useState<{ min: number; max: number } | null>(null);

    // Pending-анализ: поллим пока не появится отчёт
    const [pendingDone, setPendingDone] = useState(false);
    const [pendingSeconds, setPendingSeconds] = useState(0);
    const isMountedRef = useRef(true);
    useEffect(() => { return () => { isMountedRef.current = false; }; }, []);

    const tariffType = user?.tariff_type?.toLowerCase();
    const canCompare = tariffType === "htn" || tariffType === "chad";

    const fetchReports = async () => {
        try {
            const data = await getReports() as ReportData[];
            const formatted: Report[] = data.map((item: ReportData) => ({
                id: item.id,
                score: item.overall_score ?? 0,
                date: item.created_at || new Date().toISOString(),
            }));
            setReports(formatted);
        } catch (error) {
            console.error("Failed to load reports:", error);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchReports();
    }, []);

    // ── Поллинг pending-анализа прямо на странице /reports ───────────────────
    useEffect(() => {
        if (!pendingAnalysisId || pendingDone) return;

        let elapsed = 0;
        const interval = setInterval(async () => {
            if (!isMountedRef.current) { clearInterval(interval); return; }

            elapsed += 3000;
            setPendingSeconds(Math.round(elapsed / 1000));

            try {
                const res = await fetch(`/api/analysis/${pendingAnalysisId}/status`, {
                    credentials: "include",
                });

                // 401 — не трогаем auth, просто останавливаем поллинг
                if (res.status === 401) { clearInterval(interval); return; }
                if (!res.ok) return;

                const data = await res.json();

                if (data.has_report && data.report_id) {
                    clearInterval(interval);
                    setPendingDone(true);
                    // Перезагружаем список отчётов без перезагрузки страницы
                    await fetchReports();
                    // Убираем ?pending= из URL без перехода
                    window.history.replaceState({}, "", "/reports");
                }

                // Максимум 5 минут
                if (elapsed >= 300_000) clearInterval(interval);

            } catch (e) {
                console.warn("[pending poll] error:", e);
            }
        }, 3000);

        return () => clearInterval(interval);
    }, [pendingAnalysisId, pendingDone]);

    const filteredReports = useMemo(() => {
        let result = [...reports];

        if (searchQuery) {
            const query = searchQuery.toLowerCase();
            result = result.filter(r =>
                r.id.toLowerCase().includes(query) || r.score.toString().includes(query)
            );
        }

        if (scoreFilter) {
            result = result.filter(r => r.score >= scoreFilter.min && r.score <= scoreFilter.max);
        }

        result.sort((a, b) => {
            switch (sortBy) {
                case "newest": return new Date(b.date).getTime() - new Date(a.date).getTime();
                case "oldest": return new Date(a.date).getTime() - new Date(b.date).getTime();
                case "score-high": return b.score - a.score;
                case "score-low": return a.score - b.score;
                default: return 0;
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

                {/* ── Pending-баннер ── */}
                {pendingAnalysisId && !pendingDone && (
                    <div className="glass rounded-2xl p-4 border border-white/10 mb-6 flex items-center gap-3">
                        <Loader2 className="w-5 h-5 animate-spin text-gray-400 shrink-0" />
                        <div>
                            <p className="text-white text-sm font-medium">Анализ обрабатывается...</p>
                            <p className="text-gray-500 text-xs flex items-center gap-1 mt-0.5">
                                <Clock className="w-3 h-3" />
                                {pendingSeconds} сек — обычно 1–2 минуты. Страница обновится автоматически.
                            </p>
                        </div>
                    </div>
                )}

                {pendingDone && (
                    <div className="glass rounded-2xl p-4 border border-white/10 mb-6 flex items-center gap-3">
                        <CheckCircle2 className="w-5 h-5 text-white shrink-0" />
                        <p className="text-white text-sm font-medium">Анализ готов — смотри в списке ниже</p>
                    </div>
                )}

                <div className="flex flex-col md:flex-row md:items-center md:justify-between mb-8">
                    <div>
                        <h1 className="text-3xl font-bold text-white mb-2">Мои отчёты</h1>
                        <p className="text-gray-400">{filteredReports.length} отчётов</p>
                    </div>

                    <div className="mt-4 md:mt-0 flex flex-col sm:flex-row gap-3">
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

                        {canCompare && (
                            <Link href="/analysis/compare">
                                <Button variant="outline" className="glass border-white/20 hover:bg-white/10">
                                    <BarChart3 className="w-4 h-4 mr-2" />
                                    Сравнить анализы
                                </Button>
                            </Link>
                        )}

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

                {showFilters && (
                    <div className="glass rounded-2xl p-6 border border-white/10 mb-8">
                        <h3 className="text-white font-semibold mb-4">Фильтр по оценке</h3>
                        <div className="flex gap-2 flex-wrap">
                            {[
                                { label: "Все", filter: null },
                                { label: "8+ (Отлично)", filter: { min: 8, max: 10 } },
                                { label: "6–8 (Хорошо)", filter: { min: 6, max: 7.9 } },
                                { label: "<6 (Нужна работа)", filter: { min: 0, max: 5.9 } },
                            ].map(({ label, filter }) => (
                                <Button
                                    key={label}
                                    variant="outline"
                                    size="sm"
                                    onClick={() => setScoreFilter(filter)}
                                    className={
                                        JSON.stringify(scoreFilter) === JSON.stringify(filter)
                                            ? "bg-white/20"
                                            : "glass border-white/10"
                                    }
                                >
                                    {label}
                                </Button>
                            ))}
                        </div>
                    </div>
                )}

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

export default function ReportsPage() {
    return (
        <Suspense fallback={
            <div className="min-h-screen pt-24 flex items-center justify-center">
                <Loader2 className="w-8 h-8 animate-spin text-gray-400" />
            </div>
        }>
            <ReportsContent />
        </Suspense>
    );
}