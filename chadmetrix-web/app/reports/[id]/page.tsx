// app/reports/[id]/page.tsx
"use client";

import { useParams } from "next/navigation";
import Link from "next/link";
import Image from "next/image";
import { ArrowLeft, GitCompare, Lock } from "lucide-react";
import { Button } from "@/components/ui/button";

// Заглушка данных — потом заменишь на API
const mockReport = {
    id: "123",
    objective: 6.4,
    potential: 7.8,
    summary:
        "Лицо находится в зоне HTN. Пропорции выше среднего, но есть слабые зоны. Потенциал высокий при правильной работе. Основные проблемы — кожа и челюсть. Общая гармония хорошая.",
    photo: "/test.jpg",
    created_at: "2024-03-15",
    metrics: [
        { name: "Пропорции лица", score: 6.5, comment: "небольшая дисгармония" },
        { name: "Симметрия", score: 7.2, comment: "хорошая" },
        { name: "Кожа", score: 5.8, comment: "есть дефекты" },
        { name: "Челюсть", score: 6.0, comment: "слабая линия" },
        { name: "Скулы", score: 7.0, comment: "средняя выраженность" },
        { name: "Нос", score: 6.8, comment: "хорошие пропорции" },
        { name: "Глаза", score: 7.5, comment: "выразительные" },
        { name: "Губы", score: 6.2, comment: "недостаточный объём" },
        { name: "Лоб", score: 6.5, comment: "пропорционален" },
        { name: "Глазницы", score: 7.0, comment: "оптимальная глубина" },
        { name: "Контрастность", score: 6.8, comment: "средняя" },
        { name: "Волосы", score: 7.5, comment: "хорошая линия" },
        { name: "Тон кожи", score: 6.0, comment: "неровный" },
        { name: "Овал", score: 6.5, comment: "чёткий контур" },
        { name: "Дефекты", score: 5.5, comment: "постакне" },
        { name: "Нос/подбородок", score: 6.8, comment: "хороший баланс" },
        { name: "Линия волос", score: 7.0, comment: "симметричная" },
    ],
    roadmap: {
        week1: "Детокс, уход за кожей, базовый мьюинг",
        week2: "Интенсификация мьюинга, ретинол, коррекция бровей",
        week3: "Челюстной тренинг, лимфодренаж, контуринг",
        week4: "Фиксация результатов, TCA пилинг, микротоки"
    }
};

// Заглушка пользователя — потом из API
const mockUser = {
    tariff: "HTN", // "free", "HTN", "CHAD"
    comparisons_used: 0,
    comparisons_total: 1 // 0 для free, 1 для HTN, 3 для CHAD
};

export default function ReportDetailPage() {
    const params = useParams();
    const report = mockReport;

    const canCompare = mockUser.comparisons_total > 0;
    const comparisonsLeft = mockUser.comparisons_total - mockUser.comparisons_used;

    const getScoreColor = (score: number) => {
        if (score >= 7) return "text-white";
        if (score >= 5) return "text-gray-300";
        return "text-gray-500";
    };

    return (
        <div className="min-h-screen pt-24 pb-12 px-4">
            <div className="max-w-5xl mx-auto">

                {/* HEADER с кнопкой сравнения */}

                <div className="flex items-center justify-between mb-6">
                    <Link href="/reports">
                        <Button variant="ghost" className="text-gray-400 hover:text-white">
                            <ArrowLeft className="w-4 h-4 mr-2" />
                            Назад к отчётам
                        </Button>
                    </Link>

                    {/* КНОПКА СРАВНЕНИЯ */}
                    {canCompare ? (
                        <Link href={`/reports/${params.id}/compare`}>
                            <Button
                                variant="outline"
                                className="glass border-white/20 hover:bg-white/10"
                            >
                                <GitCompare className="w-4 h-4 mr-2" />
                                Сравнить
                                {comparisonsLeft > 0 && (
                                    <span className="ml-2 text-xs bg-white/10 px-2 py-0.5 rounded-full">
                                        {comparisonsLeft}
                                    </span>
                                )}
                            </Button>
                        </Link>
                    ) : (
                        <Button
                            variant="outline"
                            disabled
                            className="glass border-white/10 text-gray-500 cursor-not-allowed"
                        >
                            <Lock className="w-4 h-4 mr-2" />
                            Сравнение
                            <span className="ml-2 text-xs">Требуется подписка</span>
                        </Button>
                    )}
                </div>

                {/* MAIN CARD */}

                <div className="glass rounded-3xl p-8 border border-white/10">
                    <div className="flex items-center justify-between mb-6">
                        <h1 className="text-3xl font-bold text-white">
                            Отчёт от {report.created_at}
                        </h1>
                        <span className="text-sm text-gray-500">#{params.id}</span>
                    </div>

                    <div className="grid md:grid-cols-3 gap-6">

                        {/* PHOTO */}

                        <div className="aspect-square relative rounded-xl overflow-hidden border border-white/10 bg-gray-900">
                            <Image
                                src={report.photo}
                                alt="Анализ"
                                fill
                                className="object-cover"
                            />
                        </div>

                        {/* SCORES */}

                        <div className="flex flex-col justify-center gap-4">
                            <ScoreBox
                                title="Объективная оценка"
                                value={report.objective}
                                max={10}
                            />
                            <ScoreBox
                                title="Потенциальная оценка"
                                value={report.potential}
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
                                {report.summary}
                            </p>
                        </div>

                    </div>
                </div>

                {/* METRICS */}

                <div className="glass rounded-3xl p-8 border border-white/10 mt-6">
                    <h2 className="text-xl font-semibold text-white mb-6">
                        Детальные метрики
                    </h2>
                    <div className="grid md:grid-cols-2 gap-4">
                        {report.metrics.map((metric, i) => (
                            <div
                                key={i}
                                className="flex items-center justify-between p-3 rounded-lg bg-white/5 border border-white/5"
                            >
                                <span className="text-gray-400 text-sm">{metric.name}</span>
                                <div className="text-right">
                                    <span className={`font-bold ${getScoreColor(metric.score)}`}>
                                        {metric.score}
                                    </span>
                                    <span className="text-gray-600 text-xs ml-2">
                                        /10
                                    </span>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>

                {/* ROADMAP */}

                <div className="glass rounded-3xl p-8 border border-white/10 mt-6">
                    <h2 className="text-xl font-semibold text-white mb-6">
                        Роадмап на 30 дней
                    </h2>
                    <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-4">
                        {Object.entries(report.roadmap).map(([week, tasks], i) => (
                            <div key={week} className="p-4 rounded-xl bg-white/5 border border-white/5">
                                <div className="text-xs text-gray-500 uppercase tracking-wider mb-2">
                                    Неделя {i + 1}
                                </div>
                                <p className="text-gray-300 text-sm">{tasks}</p>
                            </div>
                        ))}
                    </div>
                </div>

                {/* CTA для сравнения если нет подписки */}

                {!canCompare && (
                    <div className="glass rounded-2xl p-6 border border-white/10 mt-6 text-center">
                        <p className="text-gray-400 mb-4">
                            Сравнение отчётов доступно в подписках
                        </p>
                        <div className="flex justify-center gap-4">
                            <Link href="/#pricing">
                                <Button className="bg-white text-black hover:bg-gray-200">
                                    Оформить подписку HTN
                                </Button>
                            </Link>
                        </div>
                    </div>
                )}

            </div>
        </div>
    );
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
                    {value}
                </span>
                <span className="text-gray-500 text-sm ml-1">
                    /{max}
                </span>
            </div>
        </div>
    );
}