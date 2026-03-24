// app/demo/page.tsx
"use client";

import Link from "next/link";
import { Lock, Sparkles, ArrowRight, Check, X } from "lucide-react";
import { Button } from "@/components/ui/button";

// Демо-данные — полноценный отчёт с "замыленными" местами
const demoReport = {
    objective: 7.2,
    potential: 8.5,
    tier: "HTN",
    summary: "Лицо находится в зоне High-Tier Normie. Хорошие пропорции и симметрия. Основной потенциал роста — в состоянии кожи и чёткости овала.",
    photo: "/demo-face.jpg", // Позже заменишь на реальное демо-фото
    metrics: [
        { name: "Пропорции лица", score: 7.5, comment: "Гармоничные соотношения" },
        { name: "Симметрия", score: 7.8, comment: "Хорошая балансировка" },
        { name: "Кожа", score: 6.5, comment: "Есть потенциал улучшения", weak: true },
        { name: "Челюсть", score: 7.2, comment: "Чёткий контур" },
        { name: "Скулы", score: 7.0, comment: "Хорошая проекция" },
        { name: "Нос", score: 7.4, comment: "Пропорционален лицу" },
        { name: "Глаза", score: 7.6, comment: "Выразительные", strong: true },
        { name: "Губы", score: 7.0, comment: "Сбалансированы" },
        { name: "Лоб", score: 7.3, comment: "Оптимальные пропорции" },
        { name: "Глазницы", score: 7.1, comment: "Нормальная глубина" },
        { name: "Контрастность", score: 7.4, comment: "Хороший контраст", strong: true },
        { name: "Волосы", score: 7.5, comment: "Здоровая линия" },
        { name: "Тон кожи", score: 6.8, comment: "Небольшая неравномерность", weak: true },
        { name: "Овал", score: 7.2, comment: "Чёткий контур" },
        { name: "Дефекты", score: 7.0, comment: "Минимальны" },
        { name: "Нос/подбородок", score: 7.3, comment: "Хороший баланс" },
        { name: "Линия волос", score: 7.4, comment: "Симметричная" },
    ],
    weakZones: ["Кожа", "Тон кожи"], // Для акцентированного отчёта (CHAD)
    roadmapPreview: [
        { week: 1, title: "Детокс и база", tasks: ["Диета без сахара", "Double cleanse", "Мьюинг 2x15 мин"] },
        { week: 2, title: "Активация", tasks: ["Ретинол 0.1%", "Силовые тренировки", "Гуаша"] },
        { week: 3, title: "Контур", tasks: ["Mastic gum", "Лимфодренаж", "Контуринг"] },
        { week: 4, title: "Фиксация", tasks: ["TCA пилинг", "Микротоки", "Итоговая оценка"] },
    ]
};

export default function DemoPage() {
    return (
        <div className="min-h-screen pt-24 pb-12 px-4">
            <div className="max-w-5xl mx-auto">

                {/* HEADER */}

                <div className="text-center mb-12">
                    <div className="inline-flex items-center gap-2 glass rounded-full px-4 py-2 mb-6">
                        <Sparkles className="w-4 h-4 text-gray-400" />
                        <span className="text-sm text-gray-300">Пример полного отчёта</span>
                    </div>
                    <h1 className="text-4xl md:text-5xl font-bold text-gradient mb-4">
                        Что вы получите
                    </h1>
                    <p className="text-gray-400 max-w-2xl mx-auto">
                        Полный разбор вашей внешности по 17 метрикам с персональным планом улучшений на 30 дней
                    </p>
                </div>

                {/* DEMO BADGE */}

                <div className="relative mb-8">
                    <div className="absolute -top-4 left-1/2 -translate-x-1/2 z-10">
                        <span className="bg-white text-black px-4 py-1 rounded-full text-sm font-bold flex items-center gap-2">
                            <Lock className="w-4 h-4" />
                            Демо-версия
                        </span>
                    </div>
                </div>

                {/* MAIN REPORT CARD */}

                <div className="glass rounded-3xl p-8 border border-white/10 relative overflow-hidden">
                    {/* Watermark overlay */}
                    <div className="absolute inset-0 flex items-center justify-center pointer-events-none z-10">
                        <div className="transform -rotate-45 text-6xl font-bold text-white/5 uppercase tracking-widest">
                            Демо
                        </div>
                    </div>

                    <div className="relative z-0">
                        {/* SCORES GRID */}

                        <div className="grid md:grid-cols-3 gap-6 mb-8">
                            {/* Photo with blur */}
                            <div className="aspect-square relative rounded-xl overflow-hidden border border-white/10 bg-gray-900">
                                <div className="absolute inset-0 bg-gray-800 flex items-center justify-center">
                                    <div className="text-center">
                                        <Lock className="w-12 h-12 text-gray-600 mx-auto mb-2" />
                                        <span className="text-gray-500 text-sm">Ваше фото</span>
                                    </div>
                                </div>
                                {/* Blur overlay */}
                                <div className="absolute inset-0 backdrop-blur-xl bg-black/30" />
                                <div className="absolute inset-0 flex items-center justify-center">
                                    <span className="text-white/50 text-sm font-medium">Доступно после оплаты</span>
                                </div>
                            </div>

                            {/* Scores */}
                            <div className="flex flex-col justify-center gap-4">
                                <DemoScoreBox
                                    title="Объективная оценка"
                                    value={demoReport.objective}
                                    tier={demoReport.tier}
                                />
                                <DemoScoreBox
                                    title="Потенциальная оценка"
                                    value={demoReport.potential}
                                    highlight
                                />
                            </div>

                            {/* Summary with partial blur */}
                            <div className="flex flex-col justify-center">
                                <h3 className="text-white font-semibold mb-3 text-sm uppercase tracking-wider">
                                    Резюме
                                </h3>
                                <p className="text-gray-300 text-sm leading-relaxed">
                                    {demoReport.summary}
                                </p>
                                <div className="mt-4 p-3 rounded-lg bg-white/5 border border-white/10">
                                    <span className="text-xs text-gray-500">Категория: </span>
                                    <span className="text-sm text-white font-medium">{demoReport.tier}</span>
                                </div>
                            </div>
                        </div>

                        {/* METRICS */}

                        <div className="mb-8">
                            <h3 className="text-white font-semibold mb-4 text-sm uppercase tracking-wider">
                                17 детальных метрик
                            </h3>
                            <div className="grid md:grid-cols-2 gap-3">
                                {demoReport.metrics.map((metric) => (
                                    <div
                                        key={metric.name}
                                        className={`flex items-center justify-between p-3 rounded-lg border ${metric.strong
                                            ? "bg-white/10 border-white/20"
                                            : metric.weak
                                                ? "bg-white/5 border-red-500/20"
                                                : "bg-white/5 border-white/10"
                                            }`}
                                    >
                                        <div className="flex items-center gap-2">
                                            <span className="text-gray-400 text-sm">{metric.name}</span>
                                            {metric.strong && <span className="text-xs text-green-400">★</span>}
                                            {metric.weak && <span className="text-xs text-red-400">!</span>}
                                        </div>
                                        <div className="text-right">
                                            <span className={`font-bold ${metric.strong ? "text-white" : metric.weak ? "text-red-400" : "text-gray-300"
                                                }`}>
                                                {metric.score}
                                            </span>
                                            <span className="text-gray-600 text-xs ml-1">/10</span>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </div>

                        {/* WEAK ZONES — только для CHAD тарифа */}

                        <div className="mb-8 p-4 rounded-xl bg-red-500/5 border border-red-500/20">
                            <div className="flex items-center gap-2 mb-3">
                                <span className="text-xs font-medium text-red-400 uppercase tracking-wider">
                                    Акцентированный отчёт
                                </span>
                                <span className="text-xs bg-red-500/20 text-red-400 px-2 py-0.5 rounded">
                                    Только в подписке CHAD
                                </span>
                            </div>
                            <h4 className="text-white font-medium mb-2">Слабые зоны для проработки:</h4>
                            <div className="flex gap-2">
                                {demoReport.weakZones.map(zone => (
                                    <span key={zone} className="text-sm text-red-400 bg-red-500/10 px-3 py-1 rounded-full">
                                        {zone}
                                    </span>
                                ))}
                            </div>
                        </div>

                        {/* ROADMAP PREVIEW */}

                        <div className="mb-8">
                            <h3 className="text-white font-semibold mb-4 text-sm uppercase tracking-wider">
                                Персональный роадмап на 30 дней
                            </h3>
                            <div className="grid md:grid-cols-4 gap-4">
                                {demoReport.roadmapPreview.map((week, idx) => (
                                    <div key={idx} className="p-4 rounded-xl bg-white/5 border border-white/10 relative">
                                        {/* Blur last 2 weeks for demo */}
                                        {idx >= 2 && (
                                            <div className="absolute inset-0 backdrop-blur-md bg-black/20 rounded-xl flex items-center justify-center">
                                                <Lock className="w-6 h-6 text-gray-500" />
                                            </div>
                                        )}
                                        <div className="text-xs text-gray-500 uppercase tracking-wider mb-2">
                                            Неделя {week.week}
                                        </div>
                                        <h4 className="text-white font-medium text-sm mb-2">{week.title}</h4>
                                        <ul className="space-y-1">
                                            {week.tasks.map((task, tidx) => (
                                                <li key={tidx} className="text-xs text-gray-400 flex items-start gap-1">
                                                    <Check className="w-3 h-3 text-gray-600 mt-0.5 shrink-0" />
                                                    {task}
                                                </li>
                                            ))}
                                        </ul>
                                    </div>
                                ))}
                            </div>
                        </div>

                        {/* CTA */}

                        <div className="flex flex-col sm:flex-row items-center justify-center gap-4 pt-6 border-t border-white/10">
                            <Link href="/analysis/new">
                                <Button size="lg" className="bg-white text-black hover:bg-gray-200 px-8">
                                    Получить свой отчёт за 199₽
                                    <ArrowRight className="w-4 h-4 ml-2" />
                                </Button>
                            </Link>
                            <Link href="/#pricing">
                                <Button variant="outline" size="lg" className="glass border-white/20">
                                    Сравнить тарифы
                                </Button>
                            </Link>
                        </div>
                    </div>
                </div>

                {/* FEATURES COMPARISON */}

                <div className="mt-12 glass rounded-2xl p-8 border border-white/10">
                    <h2 className="text-xl font-bold text-white text-center mb-8">
                        Что включено в каждый тариф
                    </h2>
                    <div className="grid md:grid-cols-3 gap-6">
                        <TariffCard
                            name="Разовый"
                            price="199₽"
                            features={[
                                { text: "17 метрик", included: true },
                                { text: "Роадмап 30 дней", included: true },
                                { text: "1 фото (анфас)", included: true },
                                { text: "Сравнение отчётов", included: false },
                                { text: "Акцент на слабые зоны", included: false },
                            ]}
                            cta="Купить"
                            href="/analysis/new"
                        />
                        <TariffCard
                            name="HTN"
                            price="249₽/мес"
                            popular
                            features={[
                                { text: "17 метрик", included: true },
                                { text: "Роадмап 30 дней", included: true },
                                { text: "2 фото (анфас + профиль)", included: true },
                                { text: "1 сравнение/мес", included: true },
                                { text: "Акцент на слабые зоны", included: false },
                            ]}
                            cta="Оформить"
                            href="/#pricing"
                        />
                        <TariffCard
                            name="CHAD"
                            price="349₽/мес"
                            features={[
                                { text: "17 метрик", included: true },
                                { text: "Роадмап 30 дней", included: true },
                                { text: "2 фото + анализ профиля", included: true },
                                { text: "3 сравнения/мес", included: true },
                                { text: "Акцент на слабые зоны", included: true },
                            ]}
                            cta="Стать CHAD"
                            href="/#pricing"
                        />
                    </div>
                </div>

            </div>
        </div>
    );
}

// Компоненты

function DemoScoreBox({ title, value, tier, highlight = false }: {
    title: string;
    value: number;
    tier?: string;
    highlight?: boolean;
}) {
    return (
        <div className={`rounded-xl p-4 text-center border ${highlight ? "bg-white/10 border-white/20" : "bg-white/5 border-white/10"
            }`}>
            <p className="text-gray-400 text-xs uppercase tracking-wider mb-1">{title}</p>
            <div className="flex items-baseline justify-center gap-2">
                <span className="text-3xl font-bold text-white">{value}</span>
                <span className="text-gray-500 text-sm">/10</span>
            </div>
            {tier && <span className="text-xs text-gray-500 mt-1 block">{tier}</span>}
        </div>
    );
}

function TariffCard({ name, price, features, cta, href, popular = false }: {
    name: string;
    price: string;
    features: { text: string; included: boolean }[];
    cta: string;
    href: string;
    popular?: boolean;
}) {
    return (
        <div className={`rounded-xl p-6 border ${popular ? "bg-white/10 border-white/30" : "bg-white/5 border-white/10"
            }`}>
            {popular && (
                <span className="text-xs bg-white text-black px-2 py-1 rounded-full font-medium mb-3 inline-block">
                    Популярный
                </span>
            )}
            <h3 className="text-lg font-semibold text-white mb-1">{name}</h3>
            <p className="text-2xl font-bold text-white mb-4">{price}</p>
            <ul className="space-y-2 mb-6">
                {features.map((f, i) => (
                    <li key={i} className="flex items-center gap-2 text-sm">
                        {f.included ? (
                            <Check className="w-4 h-4 text-gray-400" />
                        ) : (
                            <X className="w-4 h-4 text-gray-600" />
                        )}
                        <span className={f.included ? "text-gray-300" : "text-gray-500"}>{f.text}</span>
                    </li>
                ))}
            </ul>
            <Link href={href}>
                <Button className={`w-full ${popular ? "bg-white text-black hover:bg-gray-200" : "glass border-white/20"}`}>
                    {cta}
                </Button>
            </Link>
        </div>
    );
}