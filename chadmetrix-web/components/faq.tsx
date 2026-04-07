"use client";

import { useState } from "react";
import { ChevronDown, HelpCircle, Gift, RotateCcw } from "lucide-react";

const faqs = [
    {
        question: "Что входит в разовый анализ за 199₽?",
        answer: "Полный отчёт по 17 метрикам на основе фото в анфас, персональный роадмап улучшений на 30 дней с поэтапным планом, список конкретных действий по неделям. Отчёт сохраняется в вашем личном кабинете навсегда. За оставленный отзыв вернём 20% стоимости на следующую покупку."
    },
    {
        question: "Как работает подписка HTN и CHAD?",
        answer: "Подписка HTN (249₽/мес) включает 2 полных анализа в месяц: можно загрузить анфас и профиль. Также вы получаете доступ к истории с графиками динамики и системному сравнению отчётов. Подписка CHAD (349₽/мес) включает 3 анализа в месяц, безлимитное системное сравнение, 1 AI-сравнение фото в месяц (нейросеть анализирует изменения между вашими снимками), а также акцентированный отчёт на слабые зоны."
    },
    {
        question: "Как получить бесплатный анализ через реферальную программу?",
        answer: "В личном кабинете есть кнопка «Пригласить друга». Отправьте другу уникальную ссылку. Когда он зарегистрируется и оплатит любой анализ, на ваш баланс начислится +1 бесплатный анализ. Вы можете накопить несколько бонусов и использовать их вместо оплаты."
    },
    {
        question: "Можно ли вернуть деньги, если я не отправил фото?",
        answer: "Да. Если вы оплатили, но не загрузили фото для анализа, возврат средств возможен в течение 24 часов. Если анализ уже выполнен, возврат невозможен, но мы можем пересчитать бонусы на ваш баланс."
    },
    {
        question: "Как работает сравнение «до/после»?",
        answer: "У нас два типа сравнения: системное (доступно на HTN и CHAD) — сравнивает динамику по 17 метрикам и показывает прогресс в графиках. AI-сравнение фото (только CHAD, 1 раз в месяц) — нейросеть анализирует визуальные изменения между вашими фото, показывает, что именно улучшилось, и даёт детальные рекомендации."
    },
    {
        question: "Что такое акцентированный отчёт в подписке CHAD?",
        answer: "Это расширенный анализ, который детально разбирает 3-4 самые слабые метрики вашего лица. Вместо общих рекомендаций вы получаете углублённый роадмап конкретно по этим зонам: упражнения, уход, коррекция. Доступен только в тарифе CHAD."
    },
    {
        question: "Какие фото лучше загружать?",
        answer: "Для разового анализа — анфас при хорошем освещении. Для подписок — анфас + профиль (в идеале в одинаковых условиях освещения для точного сравнения). Избегайте фильтров, очков и головных уборов."
    }
];

export function FAQ() {
    const [openIndex, setOpenIndex] = useState<number | null>(0);

    return (
        <section className="py-24 relative">
            <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8">
                <div className="text-center mb-16">
                    <div className="inline-flex items-center space-x-2 glass rounded-full px-4 py-1.5 mb-4">
                        <HelpCircle className="w-4 h-4 text-gray-400" />
                        <span className="text-sm text-gray-300">Вопросы и ответы</span>
                    </div>
                    <h2 className="text-3xl md:text-5xl font-bold text-gradient">
                        Часто задаваемые вопросы
                    </h2>
                </div>

                <div className="space-y-4">
                    {faqs.map((faq, index) => (
                        <div
                            key={index}
                            className="glass rounded-xl border border-white/10 overflow-hidden"
                        >
                            <button
                                className="w-full px-6 py-4 flex items-center justify-between text-left hover:bg-white/5 transition-colors"
                                onClick={() => setOpenIndex(openIndex === index ? null : index)}
                            >
                                <span className="font-medium text-white">{faq.question}</span>
                                <ChevronDown
                                    className={`w-5 h-5 text-gray-400 transition-transform duration-200 ${openIndex === index ? "rotate-180" : ""
                                        }`}
                                />
                            </button>
                            <div
                                className={`px-6 overflow-hidden transition-all duration-200 ${openIndex === index ? "pb-4 max-h-96" : "max-h-0"
                                    }`}
                            >
                                <p className="text-gray-400 leading-relaxed">{faq.answer}</p>
                            </div>
                        </div>
                    ))}
                </div>

                {/* Блок с рефералкой в FAQ */}
                <div className="mt-12 grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="glass rounded-xl p-6 border border-white/10">
                        <Gift className="w-6 h-6 text-gray-400 mb-3" />
                        <h3 className="font-semibold text-white mb-2">Реферальная программа</h3>
                        <p className="text-sm text-gray-400">
                            Пригласи друга → получи бесплатный анализ. Друг получит 20% скидку на первый заказ.
                        </p>
                    </div>
                    <div className="glass rounded-xl p-6 border border-white/10">
                        <RotateCcw className="w-6 h-6 text-gray-400 mb-3" />
                        <h3 className="font-semibold text-white mb-2">Отзыв = скидка 20%</h3>
                        <p className="text-sm text-gray-400">
                            Оставь отзыв после анализа и получи промокод на 20% скидку на следующую покупку.
                        </p>
                    </div>
                </div>
            </div>
        </section>
    );
}