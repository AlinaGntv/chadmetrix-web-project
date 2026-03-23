"use client";

import { Check, Gift } from "lucide-react";
import { Button } from "@/components/ui/button";

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
        cta: "Купить за 199₽",
        popular: false,
        bonus: null
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
        cta: "Оформить подписку",
        popular: true,
        bonus: "Выгода 149₽"
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
        cta: "Стать CHAD",
        popular: false,
        bonus: "Лучший выбор"
    },
];

export function Pricing() {
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

                            {plan.bonus && !plan.popular && (
                                <div className="absolute -top-4 right-4">
                                    <span className="glass px-3 py-1 rounded-full text-xs text-gray-300 border border-white/10">
                                        {plan.bonus}
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

                {/* Реферальный блок */}
                <div className="mt-12 glass rounded-2xl p-8 border border-white/10 max-w-3xl mx-auto text-center">
                    <Gift className="w-8 h-8 text-gray-400 mx-auto mb-4" />
                    <h3 className="text-lg font-semibold text-white mb-2">Пригласи друга — получи бонус</h3>
                    <p className="text-gray-400 text-sm mb-4">
                        Отправь реферальную ссылку. Когда друг оплатит первый анализ,
                        ты получишь +1 бесплатный анализ на свой баланс.
                    </p>
                    <Button variant="outline" className="glass border-white/20">
                        Получить реферальную ссылку
                    </Button>
                </div>
            </div>
        </section>
    );
}