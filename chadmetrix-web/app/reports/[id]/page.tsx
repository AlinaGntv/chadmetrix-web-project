// app/reports/[id]/page.tsx
"use client";

import { useParams } from "next/navigation";
import { useEffect, useState } from "react";
import Link from "next/link";
import Image from "next/image";
import {
    ArrowLeft, Loader2, Brain, BarChart3, AlertTriangle,
    Calendar, TrendingUp, Target, CreditCard,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { getReport } from "@/lib/api";
import { useAuth } from "@/lib/hooks/useAuth";
import { ReportCardModal } from "@/components/ReportCardModal";   // ← новый импорт

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

const ALL_METRICS = [
    "Пропорции лица",
    "Симметрия глаз, бровей и губ",
    "Состояние кожи",
    "Форма подбородка и челюсти",
    "Высота скул",
    "Размер и форма носа",
    "Размер и форма глаз",
    "Форма и насыщенность губ",
    "Отношение лба к лицу",
    "Глубина глазных впадин",
    "Степень выраженности и контрастности черт лица",
    "Плотность и текстура волос на лбу",
    "Общий тон кожи",
    "Овал лица",
    "Дефекты кожи",
    "Пропорция длины носа и подбородка",
    "Линия роста волос",
];

export default function ReportDetailPage() {
    const params = useParams();
    const { user } = useAuth();
    const [report, setReport] = useState<ReportData | null>(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [cardOpen, setCardOpen] = useState(false);     // ← состояние модалки

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

    const metricsList = ALL_METRICS.map((metricName) => {
        const existing = report.metrics?.[metricName];
        let score = 5.0;
        let comment = "";
        if (existing) {
            if (typeof existing === "object") { score = existing.value ?? 5.0; comment = existing.comment ?? ""; }
            else if (typeof existing === "number") { score = existing; }
        }
        return { name: metricName, score, comment };
    }).sort((a, b) => b.score - a.score);

    const analysisType = report.report?.analysis_type || "basic";
    const weakZonesFocus = report.report?.weak_zones_focus || [];
    const tariffType = user?.tariff_type?.toLowerCase();
    const canCompare = tariffType === "htn" || tariffType === "chad";
    const roadmapText = report.report?.improvement_plan || "";

    const parseRoadmapWeeks = (text: string) => {
        const weeks: { week: number; content: string }[] = [];
        const weekPattern = /(?:Недел[яа]|Week)\s*(\d+)[:\-\s]*([^Н]*(?:Недел[яа]|Week|$))/gi;
        let match;
        while ((match = weekPattern.exec(text)) !== null) {
            const weekNum = parseInt(match[1]);
            const content = match[2].trim().replace(/(?:Недел[яа]|Week)\s*\d+.*$/, "").trim();
            if (content) weeks.push({ week: weekNum, content });
        }
        if (weeks.length === 0) {
            for (let i = 1; i <= 4; i++) {
                const regex = new RegExp(`${i}[.)]\\s*([^\\d]+?)(?=\\s*${i + 1}[.)]|$)`, "is");
                const m = text.match(regex);
                if (m?.[1]?.trim()) weeks.push({ week: i, content: m[1].trim() });
            }
        }
        if (weeks.length === 0 && text) {
            text.split(/\n\s*\n/).forEach((part, idx) => {
                if (part.trim() && idx < 4) weeks.push({ week: idx + 1, content: part.trim() });
            });
        }
        return weeks;
    };

    const roadmapWeeks = parseRoadmapWeeks(roadmapText);

    // Данные для модалки
    const overallScore = report.report?.overall_score ?? 0;
    const potentialScore = report.report?.potential_score ?? 0;

    return (
        <div className="min-h-screen pt-24 pb-12 px-4">
            {/* ── МОДАЛКА ────────────────────────────────────────────── */}
            <ReportCardModal
                open={cardOpen}
                onClose={() => setCardOpen(false)}
                overallScore={overallScore}
                potentialScore={potentialScore}
                category={report.report?.category ?? null}
                metrics={report.metrics}
                photoUrl={report.photos?.[0] ?? null}
            />

            <div className="max-w-5xl mx-auto">

                {/* HEADER */}
                <div className="flex items-center justify-between mb-6 flex-wrap gap-3">
                    <Link href="/reports">
                        <Button variant="ghost" className="text-gray-400 hover:text-white">
                            <ArrowLeft className="w-4 h-4 mr-2" />
                            Назад к отчётам
                        </Button>
                    </Link>

                    <div className="flex items-center gap-2 flex-wrap">
                        {/* ── КНОПКА «КАРТОЧКА РЕЗУЛЬТАТА» ── */}
                        <Button
                            variant="outline"
                            onClick={() => setCardOpen(true)}
                            className="glass border-purple-500/30 text-purple-400 hover:bg-purple-500/10 hover:border-purple-500/50 transition-all"
                        >
                            <CreditCard className="w-4 h-4 mr-2" />
                            Карточка результата
                        </Button>

                        {canCompare && (
                            <Link href="/analysis/compare">
                                <Button variant="outline" className="glass border-white/20">
                                    <BarChart3 className="w-4 h-4 mr-2" />
                                    Сравнить с другим анализом
                                </Button>
                            </Link>
                        )}
                    </div>
                </div>

                {/* MAIN CARD */}
                <div className="glass rounded-3xl p-8 border border-white/10">
                    <div className="flex items-center justify-between flex-wrap gap-3 mb-6">
                        <div>
                            <h1 className="text-3xl font-bold text-white">
                                Отчёт от {new Date(report.created_at).toLocaleDateString("ru-RU")}
                            </h1>
                            <div className="flex items-center gap-3 mt-2 flex-wrap">
                                <span className="text-sm text-gray-500">#{report.id.slice(0, 8)}</span>
                                <span className={`px-3 py-1 rounded-full text-xs font-medium ${analysisType === "chad" ? "bg-purple-500/20 text-purple-400"
                                    : analysisType === "htn" ? "bg-blue-500/20 text-blue-400"
                                        : "bg-gray-500/20 text-gray-400"
                                    }`}>
                                    {analysisType === "chad" && "CHAD анализ"}
                                    {analysisType === "htn" && "HTN анализ"}
                                    {analysisType === "basic" && "Базовый анализ"}
                                </span>
                                {report.report?.category && (
                                    <span className="px-3 py-1 rounded-full text-xs font-medium bg-white/10 text-white">
                                        {report.report.category}
                                    </span>
                                )}
                            </div>
                        </div>
                    </div>

                    <div className="grid md:grid-cols-3 gap-6">
                        {/* PHOTOS */}
                        <div className="space-y-4">
                            {report.photos?.slice(0, 2).map((photo, idx) => (
                                <div key={idx} className="aspect-square relative rounded-xl overflow-hidden border border-white/10 bg-gray-900">
                                    <Image src={photo} alt={`Фото ${idx === 0 ? "анфас" : "профиль"}`} fill className="object-cover" />
                                    <div className="absolute bottom-2 left-2 bg-black/60 px-2 py-0.5 rounded text-xs text-white">
                                        {idx === 0 ? "Анфас" : "Профиль"}
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
                            <ScoreBox title="Объективная оценка" value={overallScore} max={10} />
                            <ScoreBox title="Потенциальная оценка" value={potentialScore} max={10} highlight />
                            <div className="text-center text-xs text-gray-500 mt-2">
                                <Target className="w-3 h-3 inline mr-1" />
                                Потенциал улучшения: {potentialScore - overallScore > 0 ? "+" : ""}
                                {(potentialScore - overallScore).toFixed(1)}
                            </div>
                        </div>

                        {/* SUMMARY */}
                        <div className="flex flex-col justify-center">
                            <h3 className="text-white font-semibold mb-3 text-sm uppercase tracking-wider flex items-center gap-2">
                                <Calendar className="w-4 h-4" />
                                Резюме
                            </h3>
                            <p className="text-gray-300 text-sm leading-relaxed">
                                {report.report?.summary || "Анализ выполнен успешно"}
                            </p>
                        </div>
                    </div>
                </div>

                {/* СЛАБЫЕ ЗОНЫ — только для CHAD */}
                {analysisType === "chad" && weakZonesFocus.length > 0 && (
                    <div className="glass rounded-3xl p-8 border border-orange-500/20 mt-6 bg-linear-to-r from-orange-500/5 to-transparent">
                        <div className="flex items-center gap-3 mb-4">
                            <AlertTriangle className="w-6 h-6 text-orange-400" />
                            <h2 className="text-xl font-semibold text-orange-400">Акцент на слабые зоны</h2>
                        </div>
                        <p className="text-gray-400 text-sm mb-4">
                            В этом анализе особое внимание уделено следующим метрикам.
                            Рекомендуем сфокусироваться на их улучшении в первую очередь:
                        </p>
                        <div className="flex flex-wrap gap-2">
                            {weakZonesFocus.map((zone: string) => (
                                <span key={zone} className="px-3 py-1.5 rounded-lg bg-orange-500/10 border border-orange-500/20 text-orange-300 text-sm">
                                    {zone}
                                </span>
                            ))}
                        </div>
                    </div>
                )}

                {/* МЕТРИКИ */}
                <div className="glass rounded-3xl p-8 border border-white/10 mt-6">
                    <h2 className="text-xl font-semibold text-white mb-6">
                        Детальные метрики
                        <span className="text-sm text-gray-500 ml-2">({metricsList.length} из 17)</span>
                    </h2>
                    <div className="grid md:grid-cols-2 gap-3">
                        {metricsList.map((metric, i) => {
                            const isWeakZone = weakZonesFocus.includes(metric.name);
                            return (
                                <div key={i} className={`flex items-center justify-between p-3 rounded-lg transition-all ${isWeakZone && analysisType === "chad"
                                    ? "bg-orange-500/10 border border-orange-500/20"
                                    : "bg-white/5 border border-white/5 hover:bg-white/10"
                                    }`}>
                                    <div className="flex-1">
                                        <span className={`text-sm ${isWeakZone && analysisType === "chad" ? "text-orange-300" : "text-gray-400"}`}>
                                            {metric.name}
                                        </span>
                                        {isWeakZone && analysisType === "chad" && (
                                            <span className="ml-2 text-xs text-orange-400">(слабая зона)</span>
                                        )}
                                    </div>
                                    <div className="flex items-center gap-2">
                                        <div className="w-16 bg-gray-700 rounded-full h-1.5">
                                            <div
                                                className="bg-linear-to-r from-blue-500 to-purple-500 h-1.5 rounded-full transition-all"
                                                style={{ width: `${(metric.score / 10) * 100}%` }}
                                            />
                                        </div>
                                        <span className={`font-bold min-w-8.75 text-right ${metric.score >= 7 ? "text-white" : metric.score >= 5 ? "text-gray-300" : "text-gray-500"
                                            }`}>
                                            {metric.score.toFixed(1)}
                                        </span>
                                    </div>
                                </div>
                            );
                        })}
                    </div>
                </div>

                {/* КОММЕНТАРИИ */}
                {metricsList.some((m) => m.comment) && (
                    <div className="glass rounded-3xl p-8 border border-white/10 mt-6">
                        <div className="flex items-center gap-3 mb-4">
                            <Brain className="w-5 h-5 text-purple-400" />
                            <h2 className="text-xl font-semibold text-white">Детальные комментарии</h2>
                        </div>
                        <div className="space-y-3">
                            {metricsList.filter((m) => m.comment).map((metric, i) => (
                                <div key={i} className="p-3 rounded-lg bg-white/5 border border-white/5">
                                    <p className="text-sm font-medium text-gray-300 mb-1">{metric.name}</p>
                                    <p className="text-xs text-gray-400 leading-relaxed">{metric.comment}</p>
                                </div>
                            ))}
                        </div>
                    </div>
                )}

                {/* РОАДМАП */}
                {roadmapText && (
                    <div className="glass rounded-3xl p-8 border border-white/10 mt-6">
                        <div className="flex items-center gap-3 mb-6">
                            <TrendingUp className="w-5 h-5 text-green-400" />
                            <h2 className="text-xl font-semibold text-white">Роадмап на 30 дней</h2>
                        </div>

                        {roadmapWeeks.length > 0 ? (
                            <div className="grid md:grid-cols-2 gap-5">
                                {roadmapWeeks.map((week) => (
                                    <div key={week.week} className="p-5 rounded-xl bg-white/5 border border-white/10 hover:border-white/20 transition-all">
                                        <div className="flex items-center gap-3 mb-3">
                                            <div className="w-8 h-8 rounded-full bg-linear-to-r from-blue-500 to-purple-500 flex items-center justify-center">
                                                <span className="text-white text-sm font-bold">{week.week}</span>
                                            </div>
                                            <h3 className="text-lg font-semibold text-white">Неделя {week.week}</h3>
                                        </div>
                                        <div className="text-gray-300 text-sm leading-relaxed space-y-2">
                                            {week.content.split("\n").map((line, idx) => {
                                                const trimmed = line.trim();
                                                if (!trimmed) return null;
                                                if (trimmed.startsWith("-") || trimmed.startsWith("•") || trimmed.startsWith("*")) {
                                                    return <li key={idx} className="ml-4 text-gray-400">{trimmed.substring(1).trim()}</li>;
                                                }
                                                if (trimmed.match(/^\d+\./)) {
                                                    return <div key={idx} className="mt-2"><span className="text-blue-400 font-medium">{trimmed}</span></div>;
                                                }
                                                return <p key={idx} className="text-gray-400">{trimmed}</p>;
                                            })}
                                        </div>
                                    </div>
                                ))}
                            </div>
                        ) : (
                            <div className="p-5 rounded-xl bg-white/5 border border-white/10">
                                <div className="text-gray-300 text-sm leading-relaxed whitespace-pre-wrap">{roadmapText}</div>
                            </div>
                        )}
                    </div>
                )}

                {analysisType === "chad" && canCompare && (
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

function ScoreBox({ title, value, max, highlight = false }: {
    title: string; value: number; max: number; highlight?: boolean;
}) {
    const percentage = (value / max) * 100;
    return (
        <div className={`rounded-xl p-4 text-center border transition-all ${highlight
            ? "bg-linear-to-br from-white/10 to-white/5 border-white/20"
            : "bg-white/5 border-white/10 hover:bg-white/10"
            }`}>
            <p className="text-gray-400 text-xs uppercase tracking-wider mb-2">{title}</p>
            <div className="relative mb-2">
                <div className="w-full h-2 bg-gray-700 rounded-full overflow-hidden">
                    <div
                        className="h-full bg-linear-to-r from-blue-500 to-purple-500 rounded-full transition-all duration-500"
                        style={{ width: `${percentage}%` }}
                    />
                </div>
            </div>
            <div className="flex items-baseline justify-center">
                <span className="text-3xl font-bold text-white">{value.toFixed(1)}</span>
                <span className="text-gray-500 text-sm ml-1">/{max}</span>
            </div>
        </div>
    );
}