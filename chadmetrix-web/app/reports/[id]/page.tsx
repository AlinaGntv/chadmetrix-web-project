// app/reports/[id]/page.tsx
"use client";

import { useParams } from "next/navigation";
import { ArrowLeft, Download, Share2, Info } from "lucide-react";
import Link from "next/link";
import { Button } from "@/components/ui/button";

const metrics = [
    { name: "Симметрия лица", score: 8.5, description: "Соотношение левой и правой половин лица", max: 10 },
    { name: "Золотое сечение", score: 7.8, description: "Соответствие пропорциям золотого сечения", max: 10 },
    { name: "Межглазичное расстояние", score: 9.2, description: "Оптимальное расстояние между зрачками", max: 10 },
    { name: "Форма лица", score: 8.0, description: "Соотношение ширины и длины лица", max: 10 },
    { name: "Линия подбородка", score: 7.5, description: "Чёткость и симметрия овала", max: 10 },
    { name: "Форма носа", score: 8.3, description: "Пропорции носа относительно лица", max: 10 },
    { name: "Губы", score: 8.8, description: "Соотношение верхней и нижней губы", max: 10 },
    { name: "Глаза", score: 9.0, description: "Размер, форма и расположение глаз", max: 10 },
    { name: "Брови", score: 7.2, description: "Форма и симметрия бровей", max: 10 },
    { name: "Скулы", score: 8.6, description: "Высота и выраженность скул", max: 10 },
    { name: "Кожа", score: 8.4, description: "Однородность тона и текстуры", max: 10 },
    { name: "Лоб", score: 7.9, description: "Пропорции и форма лба", max: 10 },
    { name: "Уши", score: 8.1, description: "Симметрия и прилегание к голове", max: 10 },
    { name: "Шея", score: 8.7, description: "Пропорции шеи к лицу", max: 10 },
    { name: "Улыбка", score: 9.1, description: "Симметрия и эстетика улыбки", max: 10 },
    { name: "Профиль", score: 7.6, description: "Соотношение лба, носа и подбородка", max: 10 },
    { name: "Гармония", score: 8.5, description: "Общая сбалансированность черт", max: 10 },
];

export default function ReportDetailPage() {
    const params = useParams();
    const totalScore = (metrics.reduce((acc, m) => acc + m.score, 0) / metrics.length).toFixed(1);

    const getScoreColor = (score: number) => {
        if (score >= 8) return "from-gray-300 to-white";
        if (score >= 6) return "from-gray-500 to-gray-300";
        return "from-gray-700 to-gray-500";
    };

    const getScoreTextColor = (score: number) => {
        if (score >= 8) return "text-white";
        if (score >= 6) return "text-gray-300";
        return "text-gray-500";
    };

    return (
        <div className="min-h-screen pt-24 pb-12 px-4 sm:px-6 lg:px-8">
            <div className="max-w-5xl mx-auto">
                <div className="flex items-center space-x-4 mb-8">
                    <Link href="/reports">
                        <Button variant="ghost" size="sm" className="text-gray-400 hover:text-white">
                            <ArrowLeft className="w-4 h-4 mr-2" />
                            Назад
                        </Button>
                    </Link>
                </div>

                <div className="glass rounded-3xl p-8 border border-white/10 mb-8">
                    <div className="flex flex-col md:flex-row md:items-center justify-between mb-8">
                        <div>
                            <h1 className="text-3xl font-bold text-white mb-2">Отчёт анализа #{params.id}</h1>
                            <p className="text-gray-400">Создан 23 марта 2024 в 14:30</p>
                        </div>
                        <div className="flex space-x-3 mt-4 md:mt-0">
                            <Button variant="outline" size="sm" className="glass border-white/20">
                                <Share2 className="w-4 h-4 mr-2" />
                                Поделиться
                            </Button>
                            <Button variant="outline" size="sm" className="glass border-white/20">
                                <Download className="w-4 h-4 mr-2" />
                                Скачать PDF
                            </Button>
                        </div>
                    </div>

                    <div className="flex items-center justify-center py-8">
                        <div className="text-center">
                            <div className="relative inline-flex items-center justify-center">
                                <svg className="w-40 h-40 transform -rotate-90">
                                    <circle
                                        cx="80"
                                        cy="80"
                                        r="70"
                                        stroke="currentColor"
                                        strokeWidth="8"
                                        fill="transparent"
                                        className="text-gray-800"
                                    />
                                    <circle
                                        cx="80"
                                        cy="80"
                                        r="70"
                                        stroke="currentColor"
                                        strokeWidth="8"
                                        fill="transparent"
                                        strokeDasharray={440}
                                        strokeDashoffset={440 - (440 * Number(totalScore)) / 10}
                                        className={`${getScoreTextColor(Number(totalScore))} transition-all duration-1000`}
                                    />
                                </svg>
                                <div className="absolute inset-0 flex flex-col items-center justify-center">
                                    <span className={`text-5xl font-bold ${getScoreTextColor(Number(totalScore))}`}>
                                        {totalScore}
                                    </span>
                                    <span className="text-gray-500 text-sm">из 10</span>
                                </div>
                            </div>
                            <p className="mt-4 text-lg text-gray-300">Общая оценка</p>
                        </div>
                    </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {metrics.map((metric, index) => (
                        <div key={index} className="glass rounded-xl p-6 border border-white/10 hover:border-white/20 transition-colors">
                            <div className="flex items-start justify-between mb-4">
                                <div>
                                    <h3 className="font-semibold text-white mb-1">{metric.name}</h3>
                                    <p className="text-sm text-gray-500">{metric.description}</p>
                                </div>
                                <div className="flex items-center space-x-2">
                                    <span className={`text-2xl font-bold ${getScoreTextColor(metric.score)}`}>
                                        {metric.score}
                                    </span>
                                    <Info className="w-4 h-4 text-gray-600" />
                                </div>
                            </div>
                            <div className="h-2 bg-gray-800 rounded-full overflow-hidden">
                                <div
                                    className={`h-full bg-linear-to-r ${getScoreColor(metric.score)} transition-all duration-500`}
                                    style={{ width: `${(metric.score / metric.max) * 100}%` }}
                                />
                            </div>
                        </div>
                    ))}
                </div>

                <div className="mt-8 glass rounded-2xl p-8 border border-white/10">
                    <h2 className="text-xl font-semibold text-white mb-4">Рекомендации по улучшению</h2>
                    <div className="space-y-4 text-gray-300">
                        <p>• Для улучшения симметрии лица рекомендуем специальную гимнастику для мышц лица (фейсбилдинг)</p>
                        <p>• Добейтесь лучшего качества кожи с помощью регулярного ухода и достаточного увлажнения</p>
                        <p>• Форма бровей может быть скорректирована для достижения более гармоничного вида</p>
                        <p>• Ваши пропорции близки к идеальным, продолжайте поддерживать текущий уход</p>
                    </div>
                </div>
            </div>
        </div>
    );
}