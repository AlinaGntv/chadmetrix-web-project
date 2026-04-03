// app/analysis/compare/page.tsx
"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/lib/hooks/useAuth";
import { Button } from "@/components/ui/button";
import { api } from "@/lib/api";
import { Loader2, BarChart3, Brain, TrendingUp, TrendingDown, Minus } from "lucide-react";
import Image from "next/image";

interface Analysis {
    id: string;
    created_at: string;
    overall_score: number | null;
    photos: string[];
}

// Тип для метрики прогресса
interface MetricProgress {
    first: number;
    last: number;
    change: number;
}

// Тип для результата системного сравнения
interface SystemComparisonResult {
    overall_progress: number;
    metrics_progress: Record<string, MetricProgress>;
    analyses?: Analysis[];
}

// Тип для результата LLM сравнения
interface LlmComparisonResult {
    comparison: string;
    before_analysis_id?: string;
    after_analysis_id?: string;
    before_date?: string;
    after_date?: string;
}

export default function ComparePage() {
    const { user, isAuthenticated, isLoading: isAuthLoading } = useAuth();
    const router = useRouter();
    const [analyses, setAnalyses] = useState<Analysis[]>([]);
    const [selectedAnalyses, setSelectedAnalyses] = useState<string[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [comparisonResult, setComparisonResult] = useState<SystemComparisonResult | LlmComparisonResult | null>(null);
    const [isComparing, setIsComparing] = useState(false);
    const [comparisonType, setComparisonType] = useState<"system" | "llm">("system");

    useEffect(() => {
        if (!isAuthLoading && !isAuthenticated) {
            router.push("/login?redirect=/analysis/compare");
        }
        if (isAuthenticated) {
            fetchAnalyses();
        }
    }, [isAuthLoading, isAuthenticated, router]);

    const fetchAnalyses = async () => {
        try {
            const response = await api.get("/analysis/history?limit=50");
            const completedAnalyses = response.data.analyses.filter((a: Analysis) => a.overall_score !== null);
            setAnalyses(completedAnalyses);
        } catch (error) {
            console.error("Failed to fetch analyses:", error);
        } finally {
            setIsLoading(false);
        }
    };

    const handleSelectAnalysis = (analysisId: string) => {
        setSelectedAnalyses(prev => {
            if (prev.includes(analysisId)) {
                return prev.filter(id => id !== analysisId);
            }
            if (prev.length >= 2) {
                alert("Можно выбрать только 2 анализа для сравнения");
                return prev;
            }
            return [...prev, analysisId];
        });
        setComparisonResult(null);
    };

    const handleCompare = async () => {
        if (selectedAnalyses.length !== 2) {
            alert("Выберите 2 анализа для сравнения");
            return;
        }

        setIsComparing(true);
        try {
            if (comparisonType === "system") {
                const response = await api.post("/analysis/compare/system", selectedAnalyses);
                setComparisonResult(response.data as SystemComparisonResult);
            } else {
                const [beforeId, afterId] = selectedAnalyses;
                const response = await api.post(`/analysis/compare/llm?before_analysis_id=${beforeId}&after_analysis_id=${afterId}`);
                setComparisonResult(response.data as LlmComparisonResult);
            }
        } catch (error) {
            console.error("Comparison failed:", error);
            alert("Ошибка при сравнении");
        } finally {
            setIsComparing(false);
        }
    };

    const formatDate = (dateStr: string) => {
        return new Date(dateStr).toLocaleDateString('ru-RU', {
            day: 'numeric',
            month: 'long',
            year: 'numeric'
        });
    };

    const getChangeIcon = (change: number) => {
        if (change > 0) return <TrendingUp className="w-4 h-4 text-green-400" />;
        if (change < 0) return <TrendingDown className="w-4 h-4 text-red-400" />;
        return <Minus className="w-4 h-4 text-gray-400" />;
    };

    const getChangeColor = (change: number) => {
        if (change > 0) return "text-green-400";
        if (change < 0) return "text-red-400";
        return "text-gray-400";
    };

    // Type guard для проверки типа результата
    const isSystemComparison = (result: SystemComparisonResult | LlmComparisonResult | null): result is SystemComparisonResult => {
        return result !== null && 'metrics_progress' in result;
    };

    if (isAuthLoading || isLoading) {
        return (
            <div className="min-h-screen flex items-center justify-center">
                <Loader2 className="w-8 h-8 animate-spin text-white" />
            </div>
        );
    }

    const isChadTariff = user?.tariff_type?.toLowerCase() === "chad";

    return (
        <div className="min-h-screen pt-24 pb-12 px-4">
            <div className="max-w-7xl mx-auto">
                <div className="mb-8">
                    <h1 className="text-3xl font-bold text-white mb-2">Сравнение анализов</h1>
                    <p className="text-gray-400">
                        Сравните два анализа и отследите ваш прогресс
                    </p>
                </div>

                {/* Выбор типа сравнения */}
                <div className="glass rounded-xl p-4 border border-white/10 mb-6">
                    <div className="flex gap-4">
                        <button
                            type="button"
                            onClick={() => setComparisonType("system")}
                            className={`flex items-center gap-2 px-4 py-2 rounded-lg transition-colors ${comparisonType === "system"
                                    ? "bg-white/10 text-white"
                                    : "text-gray-400 hover:text-white"
                                }`}
                        >
                            <BarChart3 className="w-4 h-4" />
                            Системное сравнение
                        </button>
                        {isChadTariff && (
                            <button
                                type="button"
                                onClick={() => setComparisonType("llm")}
                                className={`flex items-center gap-2 px-4 py-2 rounded-lg transition-colors ${comparisonType === "llm"
                                        ? "bg-white/10 text-white"
                                        : "text-gray-400 hover:text-white"
                                    }`}
                            >
                                <Brain className="w-4 h-4" />
                                LLM сравнение
                            </button>
                        )}
                    </div>
                </div>

                {/* Список анализов */}
                <div className="glass rounded-xl p-6 border border-white/10 mb-6">
                    <h2 className="text-xl font-semibold text-white mb-4">История анализов</h2>
                    {analyses.length === 0 ? (
                        <p className="text-gray-400 text-center py-8">
                            У вас пока нет завершённых анализов
                        </p>
                    ) : (
                        <div className="space-y-3">
                            {analyses.map((analysis) => (
                                <div
                                    key={analysis.id}
                                    onClick={() => handleSelectAnalysis(analysis.id)}
                                    className={`flex items-center justify-between p-4 rounded-lg border cursor-pointer transition-all ${selectedAnalyses.includes(analysis.id)
                                            ? "border-white/30 bg-white/10"
                                            : "border-white/10 hover:bg-white/5"
                                        }`}
                                >
                                    <div className="flex items-center gap-4">
                                        {analysis.photos[0] && (
                                            <div className="relative w-12 h-12 rounded-lg overflow-hidden">
                                                <Image
                                                    src={analysis.photos[0]}
                                                    alt="Preview"
                                                    fill
                                                    className="object-cover"
                                                />
                                            </div>
                                        )}
                                        <div>
                                            <p className="text-white font-medium">
                                                Анализ от {formatDate(analysis.created_at)}
                                            </p>
                                            <p className="text-sm text-gray-400">
                                                Оценка: {analysis.overall_score?.toFixed(1) || "—"}/10
                                            </p>
                                        </div>
                                    </div>
                                    {selectedAnalyses.includes(analysis.id) && (
                                        <div className="w-5 h-5 rounded-full bg-green-500 flex items-center justify-center">
                                            <div className="w-2 h-2 rounded-full bg-white" />
                                        </div>
                                    )}
                                </div>
                            ))}
                        </div>
                    )}
                </div>

                {/* Кнопка сравнения */}
                {selectedAnalyses.length === 2 && (
                    <div className="flex justify-center mb-8">
                        <Button
                            onClick={handleCompare}
                            disabled={isComparing}
                            className="bg-white text-black hover:bg-gray-200 px-8"
                        >
                            {isComparing ? (
                                <>
                                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                                    Сравнение...
                                </>
                            ) : (
                                "Сравнить"
                            )}
                        </Button>
                    </div>
                )}

                {/* Результаты системного сравнения */}
                {comparisonResult && isSystemComparison(comparisonResult) && comparisonType === "system" && (
                    <div className="glass rounded-xl p-6 border border-white/10">
                        <h2 className="text-xl font-semibold text-white mb-4">Результаты сравнения</h2>

                        {/* Общий прогресс */}
                        <div className="mb-6 p-4 rounded-lg bg-white/5">
                            <div className="flex items-center justify-between">
                                <span className="text-gray-400">Общий прогресс:</span>
                                <span className={`text-2xl font-bold ${comparisonResult.overall_progress > 0
                                        ? "text-green-400"
                                        : comparisonResult.overall_progress < 0
                                            ? "text-red-400"
                                            : "text-gray-400"
                                    }`}>
                                    {comparisonResult.overall_progress > 0 ? "+" : ""}
                                    {comparisonResult.overall_progress?.toFixed(1)}
                                </span>
                            </div>
                        </div>

                        {/* Динамика по метрикам */}
                        <h3 className="text-lg font-semibold text-white mb-3">Динамика по метрикам</h3>
                        <div className="space-y-3">
                            {Object.entries(comparisonResult.metrics_progress || {}).map(([name, data]) => {
                                const metricData = data as MetricProgress;
                                return (
                                    <div key={name} className="flex items-center justify-between p-3 rounded-lg bg-white/5">
                                        <span className="text-gray-300">{name}</span>
                                        <div className="flex items-center gap-3">
                                            <span className="text-sm text-gray-400">
                                                {metricData.first.toFixed(1)} → {metricData.last.toFixed(1)}
                                            </span>
                                            <div className="flex items-center gap-1">
                                                {getChangeIcon(metricData.change)}
                                                <span className={`text-sm ${getChangeColor(metricData.change)}`}>
                                                    {metricData.change > 0 ? "+" : ""}{metricData.change.toFixed(1)}
                                                </span>
                                            </div>
                                        </div>
                                    </div>
                                );
                            })}
                        </div>
                    </div>
                )}

                {/* LLM сравнение */}
                {comparisonResult && !isSystemComparison(comparisonResult) && comparisonType === "llm" && (
                    <div className="glass rounded-xl p-6 border border-white/10">
                        <h2 className="text-xl font-semibold text-white mb-4">LLM сравнение</h2>
                        <div className="prose prose-invert max-w-none">
                            <div className="whitespace-pre-wrap text-gray-300">
                                {(comparisonResult as LlmComparisonResult).comparison}
                            </div>
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
}