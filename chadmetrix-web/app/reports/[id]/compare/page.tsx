// app/reports/[id]/compare/page.tsx
"use client";

import { useParams } from "next/navigation";
import Link from "next/link";
import { ArrowLeft, GitCompare, TrendingUp, TrendingDown, Minus } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useState, useMemo } from "react";

// Заглушки — потом заменишь на API
const currentReport = {
    id: "123",
    objective: 6.4,
    potential: 7.8,
    created_at: "2024-03-15",
    photo: "/test.jpg",
    metrics: [
        { name: "Пропорции лица", score: 6.5 },
        { name: "Симметрия", score: 7.2 },
        { name: "Кожа", score: 5.8 },
        { name: "Челюсть", score: 6.0 },
        { name: "Скулы", score: 7.0 },
        { name: "Нос", score: 6.8 },
        { name: "Глаза", score: 7.5 },
        { name: "Губы", score: 6.2 },
        { name: "Лоб", score: 6.5 },
        { name: "Глазницы", score: 7.0 },
        { name: "Контрастность", score: 6.8 },
        { name: "Волосы", score: 7.5 },
        { name: "Тон кожи", score: 6.0 },
        { name: "Овал", score: 6.5 },
        { name: "Дефекты", score: 5.5 },
        { name: "Нос/подбородок", score: 6.8 },
        { name: "Линия волос", score: 7.0 },
    ]
};

const previousReports = [
    { id: "122", created_at: "2024-02-15", objective: 5.8 },
    { id: "121", created_at: "2024-01-20", objective: 5.2 },
];

// Фиксированные "случайные" значения для демо
const MOCK_OLD_SCORES: Record<string, number[]> = {
    "122": [6.0, 6.8, 5.2, 5.5, 6.5, 6.2, 7.0, 5.8, 6.0, 6.5, 6.2, 7.0, 5.5, 6.0, 5.0, 6.2, 6.5],
    "121": [5.5, 6.5, 4.8, 5.0, 6.0, 5.8, 6.5, 5.5, 5.5, 6.0, 5.8, 6.8, 5.0, 5.5, 4.5, 5.8, 6.0],
};

export default function ComparePage() {
    const params = useParams();
    const [selectedReportId, setSelectedReportId] = useState<string | null>(null);

    const selectedReport = previousReports.find(r => r.id === selectedReportId);

    // useMemo вместо прямого вызова Math.random
    const compareMetrics = useMemo(() => {
        if (!selectedReport) return [];

        const oldScores = MOCK_OLD_SCORES[selectedReport.id] ||
            currentReport.metrics.map(m => Math.max(1, m.score - 1));

        return currentReport.metrics.map((m, idx) => ({
            ...m,
            oldScore: oldScores[idx] || m.score,
        }));
    }, [selectedReport]);

    const getChange = (current: number, previous: number) => {
        const diff = current - previous;
        if (diff > 0.3) return { icon: TrendingUp, color: "text-green-400", diff: `+${diff.toFixed(1)}` };
        if (diff < -0.3) return { icon: TrendingDown, color: "text-red-400", diff: diff.toFixed(1) };
        return { icon: Minus, color: "text-gray-400", diff: "0" };
    };

    return (
        <div className="min-h-screen pt-24 pb-12 px-4">
            <div className="max-w-5xl mx-auto">

                {/* HEADER */}

                <div className="flex items-center justify-between mb-6">
                    <Link href={`/reports/${params.id}`}>
                        <Button variant="ghost" className="text-gray-400 hover:text-white">
                            <ArrowLeft className="w-4 h-4 mr-2" />
                            К отчёту
                        </Button>
                    </Link>
                </div>

                <div className="glass rounded-3xl p-8 border border-white/10 mb-6">
                    <div className="flex items-center gap-3 mb-2">
                        <GitCompare className="w-6 h-6 text-gray-400" />
                        <h1 className="text-2xl font-bold text-white">Сравнение отчётов</h1>
                    </div>
                    <p className="text-gray-400">
                        Выберите предыдущий отчёт для сравнения прогресса
                    </p>
                </div>

                {/* SELECTOR */}

                <div className="glass rounded-2xl p-6 border border-white/10 mb-6">
                    <h3 className="text-white font-semibold mb-4">Выберите отчёт для сравнения</h3>
                    <div className="grid md:grid-cols-3 gap-4">
                        {previousReports.map(report => (
                            <button
                                key={report.id}
                                onClick={() => setSelectedReportId(report.id)}
                                className={`p-4 rounded-xl border text-left transition-all ${selectedReportId === report.id
                                        ? "bg-white/10 border-white/30"
                                        : "bg-white/5 border-white/10 hover:border-white/20"
                                    }`}
                            >
                                <div className="text-sm text-gray-400 mb-1">Отчёт #{report.id}</div>
                                <div className="text-white font-semibold">{report.created_at}</div>
                                <div className="text-gray-500 text-sm mt-1">Оценка: {report.objective}</div>
                            </button>
                        ))}
                    </div>
                </div>

                {/* COMPARISON RESULT */}

                {selectedReport && (
                    <div className="glass rounded-3xl p-8 border border-white/10">
                        <div className="grid md:grid-cols-3 gap-6 mb-8">

                            {/* BEFORE */}

                            <div className="text-center p-6 rounded-xl bg-white/5 border border-white/10">
                                <div className="text-xs text-gray-500 uppercase tracking-wider mb-2">
                                    До
                                </div>
                                <div className="text-3xl font-bold text-gray-400">
                                    {selectedReport.objective}
                                </div>
                                <div className="text-sm text-gray-500 mt-1">
                                    {selectedReport.created_at}
                                </div>
                            </div>

                            {/* CHANGE */}

                            <div className="text-center p-6 rounded-xl bg-white/10 border border-white/20">
                                <div className="text-xs text-gray-500 uppercase tracking-wider mb-2">
                                    Изменение
                                </div>
                                {(() => {
                                    const change = getChange(currentReport.objective, selectedReport.objective);
                                    const Icon = change.icon;
                                    return (
                                        <div className={`text-3xl font-bold ${change.color} flex items-center justify-center gap-2`}>
                                            <Icon className="w-6 h-6" />
                                            {change.diff}
                                        </div>
                                    );
                                })()}
                                <div className="text-sm text-gray-500 mt-1">
                                    Общий прогресс
                                </div>
                            </div>

                            {/* AFTER */}

                            <div className="text-center p-6 rounded-xl bg-white/5 border border-white/10">
                                <div className="text-xs text-gray-500 uppercase tracking-wider mb-2">
                                    После
                                </div>
                                <div className="text-3xl font-bold text-white">
                                    {currentReport.objective}
                                </div>
                                <div className="text-sm text-gray-500 mt-1">
                                    {currentReport.created_at}
                                </div>
                            </div>
                        </div>

                        {/* METRICS COMPARISON */}

                        <h3 className="text-white font-semibold mb-4">Сравнение по метрикам</h3>
                        <div className="grid md:grid-cols-2 gap-3">
                            {compareMetrics.map((metric) => {
                                const change = getChange(metric.score, metric.oldScore);
                                const Icon = change.icon;
                                return (
                                    <div
                                        key={metric.name}
                                        className="flex items-center justify-between p-3 rounded-lg bg-white/5 border border-white/5"
                                    >
                                        <span className="text-gray-400 text-sm">{metric.name}</span>
                                        <div className="flex items-center gap-3">
                                            <span className="text-gray-500 text-sm">
                                                {metric.oldScore.toFixed(1)}
                                            </span>
                                            <Icon className={`w-4 h-4 ${change.color}`} />
                                            <span className={`font-bold ${change.color}`}>
                                                {metric.score.toFixed(1)}
                                            </span>
                                        </div>
                                    </div>
                                );
                            })}
                        </div>
                    </div>
                )}

            </div>
        </div>
    );
}