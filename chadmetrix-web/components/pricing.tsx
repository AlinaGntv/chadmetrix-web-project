// components/pricing.tsx
"use client";

import { useState } from "react";
import Link from "next/link";
import { Check, Gift, Lock } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/lib/hooks/useAuth";
import { PricingButton } from "./pricing-button";

const plans = [
    {
        name: "Разовый анализ",
        price: "199",
        period: "разово",
        description: "Полный отчёт по одному фото в анфас",
        features: [
            "17 детальных метрик",
            "Фото в анфас",
            "Персональный роадмап на 30 дней",
            "Список улучшений по неделям",
            "Сохранение отчёта в личном кабинете",
            "20% скидка за отзыв"
        ],
        tariff: "analysis" as const,
        popular: false,
        requiresAuth: true,
    },
    {
        name: "Подписка HTN",
        price: "249",
        period: "месяц",
        description: "Для тех, кто отслеживает прогресс",
        features: [
            "2 полных анализа в месяц",
            "Анфас + профиль (2 фото)",
            "1 бесплатное сравнение «до/после»",
            "История всех анализов с графиками",
            "Отслеживание динамики по метрикам",
            "Push-напоминания (14/30 дней)",
            "Приоритетная обработка"
        ],
        tariff: "htn" as const,
        popular: true,
        requiresAuth: true,
    },
    {
        name: "Подписка CHAD",
        price: "349",
        period: "месяц",
        description: "Максимальный результат",
        features: [
            "Всё из подписки HTN",
            "Акцентированный отчёт на слабые зоны",
            "Углублённый роадмап по проблемным метрикам",
            "3 сравнения «до/после» в месяц",
            "Персональные push-уведомления",
            "Ранний доступ к новым фичам",
            "Поддержка 24/7"
        ],
        tariff: "chad" as const,
        popular: false,
        requiresAuth: true,
    },
];

export function Pricing() {
    const { isAuthenticated } = useAuth();
    const [showAuthModal, setShowAuthModal] = useState(false);

    return (
        <section className="py-24 relative">
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                <div className="text-center mb-16">
                    <h2 className="text-3xl md:text-5xl font-bold text-gradient mb-4">
                        Тарифы
                    </h2>
                    <p className="text-gray-400 max-w-2xl mx-auto">
                        Разовый анализ для знакомства или подписка для отслеживания прогресса.
                        Пригласи друга — получи бесплатный анализ в подарок.
                    </p>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-8 max-w-6xl mx-auto">
                    {plans.map((plan) => (
                        <div
                            key={plan.name}
                            className={`relative rounded-2xl p-8 ${plan.popular
                                ? "glass-strong border border-white/20 scale-105 z-10"
                                : "glass border border-white/10"
                                }`}
                        >
                            {plan.popular && (
                                <div className="absolute -top-4 left-1/2 -translate-x-1/2">
                                    <span className="bg-white text-black px-4 py-1 rounded-full text-sm font-bold">
                                        Популярный
                                    </span>
                                </div>
                            )}

                            <div className="mb-6">
                                <h3 className="text-xl font-semibold text-white mb-2">{plan.name}</h3>
                                <p className="text-gray-400 text-sm">{plan.description}</p>
                            </div>

                            <div className="mb-6 flex items-baseline">
                                <span className="text-4xl font-bold text-white">₽{plan.price}</span>
                                <span className="text-gray-500 ml-2">/{plan.period}</span>
                            </div>

                            <ul className="space-y-3 mb-8">
                                {plan.features.map((feature) => (
                                    <li key={feature} className="flex items-start text-gray-300">
                                        <Check className="w-5 h-5 text-white mr-3 shrink-0" />
                                        <span className="text-sm">{feature}</span>
                                    </li>
                                ))}
                            </ul>

                            <PricingButton
                                tariff={plan.tariff}
                                variant={plan.popular ? "popular" : "outline"}
                                fullWidth={true}
                                showAuthModal={() => setShowAuthModal(true)}
                            />
                        </div>
                    ))}
                </div>

                {/* Модальное окно для неавторизованных */}
                {showAuthModal && (
                    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm">
                        <div className="glass rounded-2xl p-8 max-w-md w-full border border-white/10">
                            <div className="flex items-center gap-3 mb-4">
                                <Lock className="w-6 h-6 text-gray-400" />
                                <h3 className="text-xl font-semibold text-white">Требуется авторизация</h3>
                            </div>
                            <p className="text-gray-400 mb-6">
                                Для покупки анализа необходимо войти через Google. Это займёт 10 секунд.
                            </p>
                            <div className="flex gap-3">
                                <Link href="/login" className="flex-1">
                                    <Button className="w-full bg-white text-black hover:bg-gray-200">
                                        Войти
                                    </Button>
                                </Link>
                                <Button
                                    variant="outline"
                                    onClick={() => setShowAuthModal(false)}
                                    className="flex-1 glass border-white/20"
                                >
                                    Отмена
                                </Button>
                            </div>
                        </div>
                    </div>
                )}

                {/* Реферальный блок */}
                <div className="mt-12 glass rounded-2xl p-8 border border-white/10 max-w-3xl mx-auto text-center">
                    <Gift className="w-8 h-8 text-gray-400 mx-auto mb-4" />
                    <h3 className="text-lg font-semibold text-white mb-2">Пригласи друга — получи бонус</h3>
                    <p className="text-gray-400 text-sm mb-4">
                        Отправь реферальную ссылку. Когда друг оплатит первый анализ,
                        ты получишь +1 бесплатный анализ на свой баланс.
                    </p>
                    <Link href={isAuthenticated ? "/referral" : "/login"}>
                        <Button variant="outline" className="glass border-white/20">
                            {isAuthenticated ? "Получить реферальную ссылку" : "Войти для получения ссылки"}
                        </Button>
                    </Link>
                </div>
            </div>
        </section>
    );
}