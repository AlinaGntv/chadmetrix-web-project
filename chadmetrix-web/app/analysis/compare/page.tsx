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

interface MetricProgress {
    first: number;
    last: number;
    change: number;
}

interface SystemComparisonResult {
    comparison_type: string;
    overall_change: number;
    trend: string;
    metrics_progress: Record<string, MetricProgress>;
    first_report: {
        id: string;
        date: string;
        overall_score: number;
        category: string;
    };
    last_report: {
        id: string;
        date: string;
        overall_score: number;
        category: string;
    };
    reports_count: number;
}

interface LlmComparisonData {
    overall_change?: number;
    metrics_changes?: Record<string, number>;
    summary?: string;
}

interface LlmComparisonResult {
    before_analysis_id: string;
    after_analysis_id: string;
    before_date: string;
    after_date: string;
    comparison: LlmComparisonData;
}

interface HistoryResponse {
    analyses: Analysis[];
    total: number;
}

export default function ComparePage() {
    const { user, isAuthenticated, isLoading: isAuthLoading } = useAuth();
    const router = useRouter();
    const [analyses, setAnalyses] = useState<Analysis[]>([]);
    const [selectedAnalyses, setSelectedAnalyses] = useState<string[]>([]);
    const [isLoading, setIsLoading] = useState<boolean>(true);
    const [comparisonResult, setComparisonResult] = useState<SystemComparisonResult | LlmComparisonResult | null>(null);
    const [isComparing, setIsComparing] = useState<boolean>(false);
    const [comparisonType, setComparisonType] = useState<"system" | "llm">("system");

    useEffect(() => {
        if (!isAuthLoading && !isAuthenticated) {
            router.push("/login?redirect=/analysis/compare");
        }
        if (isAuthenticated) {
            fetchAnalyses();
        }
    }, [isAuthLoading, isAuthenticated, router]);

    const fetchAnalyses = async (): Promise<void> => {
        try {
            const response = await api.get("/analysis/history?limit=50");
            const data = response.data as HistoryResponse;
            const completedAnalyses = data.analyses.filter((a: Analysis) => a.overall_score !== null);
            setAnalyses(completedAnalyses);
        } catch (error) {
            console.error("Failed to fetch analyses:", error);
        } finally {
            setIsLoading(false);
        }
    };

    const handleSelectAnalysis = (analysisId: string): void => {
        setSelectedAnalyses((prev: string[]) => {
            if (prev.includes(analysisId)) {
                return prev.filter((id: string) => id !== analysisId);
            }
            if (prev.length >= 2) {
                alert("Можно выбрать только 2 анализа для сравнения");
                return prev;
            }
            return [...prev, analysisId];
        });
        setComparisonResult(null);
    };

    const handleCompare = async (): Promise<void> => {
        if (selectedAnalyses.length !== 2) {
            alert("Выберите 2 анализа для сравнения");
            return;
        }

        setIsComparing(true);
        try {
            if (comparisonType === "system") {
                const response = await api.post("/analysis/compare/system", {
                    analysis_ids: selectedAnalyses
                });
                setComparisonResult(response.data as SystemComparisonResult);
            } else {
                const [beforeId, afterId] = selectedAnalyses;
                const response = await api.post("/analysis/compare/llm", {
                    before_analysis_id: beforeId,
                    after_analysis_id: afterId
                });
                setComparisonResult(response.data as LlmComparisonResult);
            }
        } catch (error: unknown) {
            console.error("Comparison failed:", error);
            const err = error as { response?: { data?: { detail?: string } } };
            const errorMsg = err.response?.data?.detail || "Ошибка при сравнении";
            alert(errorMsg);
        } finally {
            setIsComparing(false);
        }
    };

    const formatDate = (dateStr: string): string => {
        return new Date(dateStr).toLocaleDateString('ru-RU', {
            day: 'numeric',
            month: 'long',
            year: 'numeric'
        });
    };

    const getChangeIcon = (change: number): React.ReactElement => {
        if (change > 0) return <TrendingUp className="w-4 h-4 text-green-400" />;
        if (change < 0) return <TrendingDown className="w-4 h-4 text-red-400" />;
        return <Minus className="w-4 h-4 text-gray-400" />;
    };

    const getChangeColor = (change: number): string => {
        if (change > 0) return "text-green-400";
        if (change < 0) return "text-red-400";
        return "text-gray-400";
    };

    const isSystemComparison = (result: SystemComparisonResult | LlmComparisonResult | null): result is SystemComparisonResult => {
        return result !== null && 'comparison_type' in result && result.comparison_type === 'system';
    };

    const tariffType = user?.tariff_type?.toLowerCase() || "";
    const isChadTariff: boolean = tariffType === "chad";
    const isHtnTariff: boolean = tariffType === "htn";

    const availableComparisonTypes: string[] = [];
    if (isHtnTariff || isChadTariff) availableComparisonTypes.push("system");
    if (isChadTariff) availableComparisonTypes.push("llm");

    if (isAuthLoading || isLoading) {
        return (
            <div className="min-h-screen flex items-center justify-center">
                <Loader2 className="w-8 h-8 animate-spin text-white" />
            </div>
        );
    }

    return (
        <div className="min-h-screen pt-24 pb-12 px-4">
            <div className="max-w-7xl mx-auto">
                <div className="mb-8">
                    <h1 className="text-3xl font-bold text-white mb-2">Сравнение анализов</h1>
                    <p className="text-gray-400">
                        Сравните два анализа и отследите ваш прогресс
                    </p>
                </div>

                {availableComparisonTypes.length > 1 && (
                    <div className="glass rounded-xl p-4 border border-white/10 mb-6">
                        <div className="flex gap-4">
                            {availableComparisonTypes.includes("system") && (
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
                            )}
                            {availableComparisonTypes.includes("llm") && (
                                <button
                                    type="button"
                                    onClick={() => setComparisonType("llm")}
                                    className={`flex items-center gap-2 px-4 py-2 rounded-lg transition-colors ${comparisonType === "llm"
                                            ? "bg-white/10 text-white"
                                            : "text-gray-400 hover:text-white"
                                        }`}
                                >
                                    <Brain className="w-4 h-4" />
                                    LLM сравнение (CHAD)
                                </button>
                            )}
                        </div>
                    </div>
                )}

                <div className="glass rounded-xl p-6 border border-white/10 mb-6">
                    <h2 className="text-xl font-semibold text-white mb-4">История анализов</h2>
                    {analyses.length === 0 ? (
                        <p className="text-gray-400 text-center py-8">
                            У вас пока нет завершённых анализов
                        </p>
                    ) : (
                        <div className="space-y-3">
                            {analyses.map((analysis: Analysis) => (
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
                                            <div className="relative w-12 h-12 rounded-lg overflow-hidden bg-gray-800">
                                                <Image
                                                    src={analysis.photos[0]}
                                                    alt="Preview"
                                                    width={48}
                                                    height={48}
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
                                `Сравнить (${comparisonType === "system" ? "системное" : "LLM"})`
                            )}
                        </Button>
                    </div>
                )}

                {comparisonResult && isSystemComparison(comparisonResult) && (
                    <div className="glass rounded-xl p-6 border border-white/10">
                        <h2 className="text-xl font-semibold text-white mb-4">Результаты сравнения</h2>

                        <div className="mb-4 text-sm text-gray-400">
                            {formatDate(comparisonResult.first_report.date)} → {formatDate(comparisonResult.last_report.date)}
                        </div>

                        <div className="mb-6 p-4 rounded-lg bg-white/5">
                            <div className="flex items-center justify-between">
                                <div className="text-center">
                                    <p className="text-gray-400 text-sm">Было</p>
                                    <p className="text-2xl font-bold text-white">
                                        {comparisonResult.first_report.overall_score.toFixed(1)}
                                    </p>
                                    <p className="text-xs text-gray-500">{comparisonResult.first_report.category}</p>
                                </div>
                                <div className="text-center">
                                    <div className="flex items-center gap-1">
                                        {getChangeIcon(comparisonResult.overall_change)}
                                        <span className={`text-xl font-bold ${getChangeColor(comparisonResult.overall_change)}`}>
                                            {comparisonResult.overall_change > 0 ? "+" : ""}
                                            {comparisonResult.overall_change.toFixed(1)}
                                        </span>
                                    </div>
                                    <p className="text-xs text-gray-500">изменение</p>
                                </div>
                                <div className="text-center">
                                    <p className="text-gray-400 text-sm">Стало</p>
                                    <p className="text-2xl font-bold text-white">
                                        {comparisonResult.last_report.overall_score.toFixed(1)}
                                    </p>
                                    <p className="text-xs text-gray-500">{comparisonResult.last_report.category}</p>
                                </div>
                            </div>
                        </div>

                        <h3 className="text-lg font-semibold text-white mb-3">Динамика по метрикам</h3>
                        <div className="space-y-2 max-h-96 overflow-y-auto">
                            {Object.entries(comparisonResult.metrics_progress).map(([name, data]) => {
                                const metricData = data as MetricProgress;
                                return (
                                    <div key={name} className="flex items-center justify-between p-3 rounded-lg bg-white/5">
                                        <span className="text-gray-300 text-sm flex-1">{name}</span>
                                        <div className="flex items-center gap-3">
                                            <span className="text-sm text-gray-400 w-16 text-right">
                                                {metricData.first.toFixed(1)} → {metricData.last.toFixed(1)}
                                            </span>
                                            <div className="flex items-center gap-1 w-16">
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

                        {Object.keys(comparisonResult.metrics_progress).length === 0 && (
                            <p className="text-gray-400 text-center py-4">
                                Нет данных по метрикам для сравнения
                            </p>
                        )}
                    </div>
                )}

                {comparisonResult && !isSystemComparison(comparisonResult) && (
                    <div className="glass rounded-xl p-6 border border-white/10">
                        <h2 className="text-xl font-semibold text-white mb-4">LLM сравнение</h2>
                        <div className="mb-4 text-sm text-gray-400">
                            {(comparisonResult as LlmComparisonResult).before_date &&
                                `${formatDate((comparisonResult as LlmComparisonResult).before_date)} → ${formatDate((comparisonResult as LlmComparisonResult).after_date)}`
                            }
                        </div>
                        <div className="prose prose-invert max-w-none">
                            <div className="whitespace-pre-wrap text-gray-300">
                                {(comparisonResult as LlmComparisonResult).comparison?.summary || "Нет данных для сравнения"}
                            </div>
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
}