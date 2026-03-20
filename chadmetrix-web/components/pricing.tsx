import Link from "next/link"
import { Button } from "@/components/ui/button"
import { Check } from "lucide-react"

const plans = [
    {
        name: "Бесплатный",
        price: "0 ₽",
        period: "навсегда",
        description: "Идеально для знакомства с сервисом",
        features: [
            "3 анализа в месяц",
            "Базовый отчет с метриками",
            "Стандартная обработка",
            "Email поддержка",
        ],
        cta: "Начать бесплатно",
        popular: false,
    },
    {
        name: "Pro",
        price: "799 ₽",
        period: "в месяц",
        description: "Для тех, кто серьезно занимается саморазвитием",
        features: [
            "Неограниченное количество анализов",
            "Полный отчет из 17 метрик",
            "Приоритетная обработка",
            "Детальные рекомендации",
            "Отслеживание прогресса",
            "Приоритетная поддержка",
        ],
        cta: "Выбрать Pro",
        popular: true,
    },
    {
        name: "Premium",
        price: "2490 ₽",
        period: "в месяц",
        description: "Для профессионалов и активных пользователей",
        features: [
            "Все возможности Pro",
            "API доступ",
            "Кастомизируемые отчеты",
            "White-label экспорт",
            "Командная работа",
            "Выделенная поддержка",
        ],
        cta: "Выбрать Premium",
        popular: false,
    },
]

export function Pricing() {
    return (
        <section id="pricing" className="bg-black py-24">
            <div className="mx-auto max-w-6xl px-6">
                <div className="mb-16 text-center">
                    <h2 className="text-4xl font-bold text-white md:text-5xl">
                        Прозрачные{" "}
                        <span className="bg-gradient-to-r from-blue-400 to-purple-400 bg-clip-text text-transparent">
                            тарифы
                        </span>
                    </h2>
                    <p className="mx-auto mt-4 max-w-2xl text-zinc-400">
                        Выберите тариф, который подходит именно вам. Все планы включают
                        нашу передовую AI технологию.
                    </p>
                </div>

                <div className="grid gap-8 md:grid-cols-3">
                    {plans.map((plan) => (
                        <div
                            key={plan.name}
                            className={`relative overflow-hidden rounded-2xl border p-8 transition-all ${plan.popular
                                    ? "border-blue-500/50 bg-gradient-to-b from-blue-500/10 to-purple-500/10"
                                    : "border-white/10 bg-white/5 hover:border-white/20"
                                }`}
                        >
                            {plan.popular && (
                                <div className="absolute top-0 right-0 rounded-bl-xl bg-gradient-to-r from-blue-500 to-purple-500 px-4 py-1 text-xs font-semibold text-white">
                                    Популярный
                                </div>
                            )}

                            <div className="mb-6">
                                <h3 className="text-xl font-semibold text-white">{plan.name}</h3>
                                <p className="mt-2 text-sm text-zinc-500">{plan.description}</p>
                            </div>

                            <div className="mb-6">
                                <span className="text-4xl font-bold text-white">{plan.price}</span>
                                <span className="ml-2 text-zinc-500">/{plan.period}</span>
                            </div>

                            <ul className="mb-8 space-y-3">
                                {plan.features.map((feature) => (
                                    <li key={feature} className="flex items-center gap-3">
                                        <Check className="h-5 w-5 flex-shrink-0 text-blue-400" />
                                        <span className="text-sm text-zinc-300">{feature}</span>
                                    </li>
                                ))}
                            </ul>

                            <Link href="/login">
                                <Button
                                    className={`w-full rounded-xl py-6 ${plan.popular
                                            ? "bg-gradient-to-r from-blue-500 to-purple-500 text-white hover:from-blue-600 hover:to-purple-600"
                                            : "bg-white/10 text-white hover:bg-white/20"
                                        }`}
                                >
                                    {plan.cta}
                                </Button>
                            </Link>
                        </div>
                    ))}
                </div>
            </div>
        </section>
    )
}