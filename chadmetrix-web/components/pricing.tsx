// components/pricing.tsx
"use client";

import { Check } from "lucide-react";
import { Button } from "@/components/ui/button";

const plans = [
    {
        name: "Базовый",
        price: "0",
        description: "Попробуй базовый анализ бесплатно",
        features: ["1 анализ в день", "5 базовых метрик", "Общий балл", "Базовые рекомендации"],
        cta: "Начать бесплатно",
        popular: false,
    },
    {
        name: "Pro",
        price: "599",
        description: "Полный анализ для серьёзных результатов",
        features: [
            "Безлимитные анализы",
            "17 детальных метрик",
            "Сравнение с идеалом",
            "Персональные рекомендации",
            "История всех отчётов",
            "Приоритетная обработка",
        ],
        cta: "Получить Pro",
        popular: true,
    },
    {
        name: "Premium",
        price: "1499",
        description: "Для профессионалов индустрии красоты",
        features: [
            "Всё из Pro",
            "API доступ",
            "White-label отчёты",
            "Консультация эксперта",
            "Экспорт PDF",
            "Поддержка 24/7",
        ],
        cta: "Связаться",
        popular: false,
    },
];

export function Pricing() {
    return (
        <section className="py-24 relative">
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                <div className="text-center mb-16">
                    <h2 className="text-3xl md:text-5xl font-bold text-gradient mb-4">
                        Тарифы для каждого
                    </h2>
                    <p className="text-gray-400 max-w-2xl mx-auto">
                        Выберите подходящий план и начните своё путешествие к совершенству уже сегодня
                    </p>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-8 max-w-6xl mx-auto">
                    {plans.map((plan) => (
                        <div
                            key={plan.name}
                            className={`relative rounded-2xl p-8 ${plan.popular
                                    ? "glass-strong border border-white/20"
                                    : "glass border border-white/10"
                                }`}
                        >
                            {plan.popular && (
                                <div className="absolute -top-4 left-1/2 -translate-x-1/2">
                                    <span className="bg-white text-black px-4 py-1 rounded-full text-sm font-medium">
                                        Популярный
                                    </span>
                                </div>
                            )}

                            <div className="mb-6">
                                <h3 className="text-xl font-semibold text-white mb-2">{plan.name}</h3>
                                <p className="text-gray-400 text-sm">{plan.description}</p>
                            </div>

                            <div className="mb-6">
                                <span className="text-4xl font-bold text-white">₽{plan.price}</span>
                                <span className="text-gray-500">/мес</span>
                            </div>

                            <ul className="space-y-3 mb-8">
                                {plan.features.map((feature) => (
                                    <li key={feature} className="flex items-start text-gray-300">
                                        <Check className="w-5 h-5 text-white mr-3 shrink-0" />
                                        <span className="text-sm">{feature}</span>
                                    </li>
                                ))}
                            </ul>

                            <Button
                                className={`w-full ${plan.popular
                                        ? "bg-white text-black hover:bg-gray-200"
                                        : "glass border-white/20 hover:bg-white/10"
                                    }`}
                            >
                                {plan.cta}
                            </Button>
                        </div>
                    ))}
                </div>
            </div>
        </section>
    );
}