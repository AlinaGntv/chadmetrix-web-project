// components/faq.tsx
"use client";

import { useState } from "react";
import { ChevronDown, HelpCircle } from "lucide-react";

const faqs = [
    {
        question: "Насколько точен AI-анализ внешности?",
        answer: "Наш алгоритм обучен на миллионах фотографий и использует 17 объективных метрик, включая симметрию лица, золотое сечение, пропорции черт. Точность составляет 94% при хорошем качестве фото."
    },
    {
        question: "Какое фото лучше загружать для анализа?",
        answer: "Используйте фото анфас при хорошем освещении, без очков и головных уборов. Лицо должно занимать не менее 50% кадра. Избегайте сильных фильтров и редактирования."
    },
    {
        question: "Сохраняются ли мои фотографии?",
        answer: "Ваши фото хранятся в зашифрованном виде только для создания отчёта. Вы можете удалить их в любой момент из личного кабинета. Мы не передаём данные третьим лицам."
    },
    {
        question: "Что включает детальный отчёт?",
        answer: "Отчёт содержит оценку по 17 параметрам: симметрия лица, форма скул, расстояние между глазами, форма носа, линия подбородка и другие. Каждая метрика сопровождается рекомендациями."
    },
    {
        question: "Можно ли получить возврат средств?",
        answer: "Да, если вы недовольны качеством анализа, мы возвращаем средства в течение 7 дней. Просто свяжитесь с нашей поддержкой через раздел 'Контакты'."
    }
];

export function FAQ() {
    const [openIndex, setOpenIndex] = useState<number | null>(0);

    return (
        <section className="py-24 relative">
            <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8">
                <div className="text-center mb-16">
                    <div className="inline-flex items-center space-x-2 glass rounded-full px-4 py-1.5 mb-4">
                        <HelpCircle className="w-4 h-4 text-blue-400" />
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
            </div>
        </section>
    );
}