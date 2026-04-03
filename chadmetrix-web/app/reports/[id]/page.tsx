// app/reports/[id]/page.tsx
"use client";

import { useParams } from "next/navigation";
import { useEffect, useState } from "react";
import Link from "next/link";
import Image from "next/image";
import { ArrowLeft, Loader2, Brain, BarChart3, AlertTriangle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { getReport } from "@/lib/api";
import { useAuth } from "@/lib/hooks/useAuth";

interface ReportData {
    id: string;
    status: string;
    photos: string[];
    metrics: Record<string, { value: number; comment: string }> | null;
    weak_zones: string[] | null;
    report: {
        overall_score: number | null;
        potential_score: number | null;
        category: string | null;
        summary: string | null;
        improvement_plan: string | null;
        analysis_type?: string;
        weak_zones_focus?: string[];
    } | null;
    created_at: string;
}

export default function ReportDetailPage() {
    const params = useParams();
    const { user } = useAuth();
    const [report, setReport] = useState<ReportData | null>(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        const fetchReport = async () => {
            try {
                const data = await getReport(params.id as string);
                setReport(data);
            } catch {
                setError("Не удалось загрузить отчёт");
            } finally {
                setLoading(false);
            }
        };

        fetchReport();
    }, [params.id]);

    if (loading) {
        return (
            <div className="min-h-screen pt-24 flex items-center justify-center">
                <Loader2 className="w-8 h-8 animate-spin text-gray-400" />
            </div>
        );
    }

    if (error || !report) {
        return (
            <div className="min-h-screen pt-24 px-4">
                <div className="max-w-5xl mx-auto text-center">
                    <p className="text-gray-400">{error || "Отчёт не найден"}</p>
                    <Link href="/reports">
                        <Button variant="ghost" className="mt-4 text-gray-400 hover:text-white">
                            ← Назад к отчётам
                        </Button>
                    </Link>
                </div>
            </div>
        );
    }

    // Преобразуем метрики для отображения
    const metricsList = report.metrics
        ? Object.entries(report.metrics).map(([name, data]) => ({
            name,
            score: typeof data === 'object' ? data.value : data,
            comment: typeof data === 'object' ? data.comment : '',
        }))
        : [];

    // Парсим роадмап из improvement_plan (разбиваем по неделям если есть)
    const roadmapText = report.report?.improvement_plan || "";
    const roadmapWeeks = roadmapText.split(/\n\n+/).slice(0, 4);

    // Получаем тип анализа
    const analysisType = report.report?.analysis_type || "basic";
    const weakZonesFocus = report.report?.weak_zones_focus || [];

    // Проверяем, может ли пользователь сравнивать (для отображения кнопки)
    const tariffType = user?.tariff_type?.toLowerCase();
    const canCompare = tariffType === "htn" || tariffType === "chad";

    return (
        <div className="min-h-screen pt-24 pb-12 px-4">
            <div className="max-w-5xl mx-auto">

                {/* HEADER */}
                <div className="flex items-center justify-between mb-6 flex-wrap gap-3">
                    <Link href="/reports">
                        <Button variant="ghost" className="text-gray-400 hover:text-white">
                            <ArrowLeft className="w-4 h-4 mr-2" />
                            Назад к отчётам
                        </Button>
                    </Link>

                    {canCompare && (
                        <Link href="/analysis/compare">
                            <Button variant="outline" className="glass border-white/20">
                                <BarChart3 className="w-4 h-4 mr-2" />
                                Сравнить с другим анализом
                            </Button>
                        </Link>
                    )}
                </div>

                {/* MAIN CARD */}
                <div className="glass rounded-3xl p-8 border border-white/10">
                    <div className="flex items-center justify-between flex-wrap gap-3 mb-6">
                        <div>
                            <h1 className="text-3xl font-bold text-white">
                                Отчёт от {new Date(report.created_at).toLocaleDateString('ru-RU')}
                            </h1>
                            <div className="flex items-center gap-3 mt-2">
                                <span className="text-sm text-gray-500">#{report.id.slice(0, 8)}</span>

                                {/* Бейдж типа анализа */}
                                <span className={`px-3 py-1 rounded-full text-xs font-medium ${analysisType === 'chad'
                                    ? 'bg-purple-500/20 text-purple-400'
                                    : analysisType === 'htn'
                                        ? 'bg-blue-500/20 text-blue-400'
                                        : 'bg-gray-500/20 text-gray-400'
                                    }`}>
                                    {analysisType === 'chad' && 'CHAD анализ'}
                                    {analysisType === 'htn' && 'HTN анализ'}
                                    {analysisType === 'basic' && 'Базовый анализ'}
                                </span>
                            </div>
                        </div>
                    </div>

                    <div className="grid md:grid-cols-3 gap-6">

                        {/* PHOTOS */}
                        <div className="space-y-4">
                            {report.photos?.map((photo, idx) => (
                                <div
                                    key={idx}
                                    className="aspect-square relative rounded-xl overflow-hidden border border-white/10 bg-gray-900"
                                >
                                    <Image
                                        src={photo}
                                        alt={`Фото ${idx === 0 ? 'анфас' : 'профиль'}`}
                                        fill
                                        className="object-cover"
                                    />
                                    <div className="absolute bottom-2 left-2 bg-black/50 px-2 py-0.5 rounded text-xs text-white">
                                        {idx === 0 ? 'Анфас' : 'Профиль'}
                                    </div>
                                </div>
                            ))}
                            {(!report.photos || report.photos.length === 0) && (
                                <div className="aspect-square rounded-xl border border-white/10 bg-gray-900 flex items-center justify-center">
                                    <span className="text-gray-500">Нет фото</span>
                                </div>
                            )}
                        </div>

                        {/* SCORES */}
                        <div className="flex flex-col justify-center gap-4">
                            <ScoreBox
                                title="Объективная оценка"
                                value={report.report?.overall_score || 0}
                                max={10}
                            />
                            <ScoreBox
                                title="Потенциальная оценка"
                                value={report.report?.potential_score || 0}
                                max={10}
                                highlight
                            />
                        </div>

                        {/* SUMMARY */}
                        <div className="flex flex-col justify-center">
                            <h3 className="text-white font-semibold mb-3 text-sm uppercase tracking-wider">
                                Резюме
                            </h3>
                            <p className="text-gray-300 text-sm leading-relaxed">
                                {report.report?.summary || "Анализ выполнен"}
                            </p>
                            {report.report?.category && (
                                <div className="mt-4">
                                    <span className="text-xs text-gray-500 uppercase">Категория</span>
                                    <p className="text-white font-medium">{report.report.category}</p>
                                </div>
                            )}
                        </div>
                    </div>
                </div>

                {/* СЛАБЫЕ ЗОНЫ - только для CHAD */}
                {analysisType === 'chad' && weakZonesFocus.length > 0 && (
                    <div className="glass rounded-3xl p-8 border border-orange-500/20 mt-6 bg-linear-to-r from-orange-500/5 to-transparent">
                        <div className="flex items-center gap-3 mb-4">
                            <AlertTriangle className="w-6 h-6 text-orange-400" />
                            <h2 className="text-xl font-semibold text-orange-400">
                                Акцент на слабые зоны
                            </h2>
                        </div>
                        <p className="text-gray-400 text-sm mb-4">
                            В этом анализе особое внимание уделено следующим метрикам.
                            Рекомендуем сфокусироваться на их улучшении в первую очередь:
                        </p>
                        <div className="flex flex-wrap gap-2">
                            {weakZonesFocus.map((zone: string) => (
                                <span
                                    key={zone}
                                    className="px-3 py-1.5 rounded-lg bg-orange-500/10 border border-orange-500/20 text-orange-300 text-sm"
                                >
                                    {zone}
                                </span>
                            ))}
                        </div>
                    </div>
                )}

                {/* МЕТРИКИ */}
                {metricsList.length > 0 && (
                    <div className="glass rounded-3xl p-8 border border-white/10 mt-6">
                        <h2 className="text-xl font-semibold text-white mb-6">
                            Детальные метрики
                        </h2>
                        <div className="grid md:grid-cols-2 gap-4">
                            {metricsList.map((metric, i) => (
                                <div
                                    key={i}
                                    className={`flex items-center justify-between p-3 rounded-lg border ${weakZonesFocus.includes(metric.name) && analysisType === 'chad'
                                        ? 'bg-orange-500/10 border-orange-500/20'
                                        : 'bg-white/5 border-white/5'
                                        }`}
                                >
                                    <span className={`text-sm ${weakZonesFocus.includes(metric.name) && analysisType === 'chad'
                                        ? 'text-orange-300'
                                        : 'text-gray-400'
                                        }`}>
                                        {metric.name}
                                        {weakZonesFocus.includes(metric.name) && analysisType === 'chad' && (
                                            <span className="ml-2 text-xs text-orange-400">(слабая зона)</span>
                                        )}
                                    </span>
                                    <div className="text-right">
                                        <span className={`font-bold ${getScoreColor(metric.score)}`}>
                                            {metric.score.toFixed(1)}
                                        </span>
                                        <span className="text-gray-600 text-xs ml-2">/10</span>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>
                )}

                {/* КОММЕНТАРИИ К МЕТРИКАМ - только для CHAD */}
                {analysisType === 'chad' && metricsList.some(m => m.comment) && (
                    <div className="glass rounded-3xl p-8 border border-white/10 mt-6">
                        <div className="flex items-center gap-3 mb-4">
                            <Brain className="w-5 h-5 text-purple-400" />
                            <h2 className="text-xl font-semibold text-white">
                                Детальные комментарии
                            </h2>
                        </div>
                        <div className="space-y-3">
                            {metricsList.filter(m => m.comment).map((metric, i) => (
                                <div key={i} className="p-3 rounded-lg bg-white/5">
                                    <p className="text-sm font-medium text-gray-300 mb-1">{metric.name}</p>
                                    <p className="text-xs text-gray-400">{metric.comment}</p>
                                </div>
                            ))}
                        </div>
                    </div>
                )}

                {/* РОАДМАП */}
                {roadmapText && (
                    <div className="glass rounded-3xl p-8 border border-white/10 mt-6">
                        <h2 className="text-xl font-semibold text-white mb-6">
                            Роадмап на 30 дней
                        </h2>
                        <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-4">
                            {roadmapWeeks.map((week, i) => (
                                <div key={i} className="p-4 rounded-xl bg-white/5 border border-white/5">
                                    <div className="text-xs text-gray-500 uppercase tracking-wider mb-2">
                                        Неделя {i + 1}
                                    </div>
                                    <p className="text-gray-300 text-sm whitespace-pre-line">{week}</p>
                                </div>
                            ))}
                        </div>
                    </div>
                )}

                {/* ПОДСКАЗКА ДЛЯ CHAD */}
                {analysisType === 'chad' && (
                    <div className="mt-6 text-center">
                        <Link href="/analysis/compare">
                            <Button variant="outline" className="glass border-purple-500/30 text-purple-400 hover:bg-purple-500/10">
                                <Brain className="w-4 h-4 mr-2" />
                                Сравнить прогресс с другим анализом
                            </Button>
                        </Link>
                    </div>
                )}
            </div>
        </div>
    );
}

function getScoreColor(score: number) {
    if (score >= 7) return "text-white";
    if (score >= 5) return "text-gray-300";
    return "text-gray-500";
}

function ScoreBox({
    title,
    value,
    max,
    highlight = false,
}: {
    title: string;
    value: number;
    max: number;
    highlight?: boolean;
}) {
    return (
        <div className={`rounded-xl p-4 text-center border ${highlight
            ? "bg-white/10 border-white/20"
            : "bg-white/5 border-white/10"
            }`}>
            <p className="text-gray-400 text-xs uppercase tracking-wider mb-1">
                {title}
            </p>
            <div className="flex items-baseline justify-center">
                <span className="text-3xl font-bold text-white">
                    {value.toFixed(1)}
                </span>
                <span className="text-gray-500 text-sm ml-1">
                    /{max}
                </span>
            </div>
        </div>
    );
}