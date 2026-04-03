// app/faq/page.tsx
import { Metadata } from "next";
import Link from "next/link";

export const metadata: Metadata = {
    title: "FAQ — Часто задаваемые вопросы | chadmetrix",
    description: "Ответы на частые вопросы об AI-анализе внешности. Как работает анализ, какие метрики оцениваются, как отслеживать прогресс.",
};

const faqs = [
    {
        question: "Как работает AI-анализ внешности?",
        answer: "Нейросеть анализирует загруженное фото по 17 ключевым метрикам: пропорции лица, симметрия, состояние кожи, форма челюсти, скулы, нос, глаза, губы и другие. Результат — объективная оценка и персональный план улучшений."
    },
    {
        question: "Сколько стоит анализ?",
        answer: "Разовый анализ стоит 199₽. Также доступны подписки HTN (249₽/мес, 2 анализа) и CHAD (349₽/мес, 3 анализа + LLM сравнение)."
    },
    {
        question: "Какие метрики оцениваются?",
        answer: "17 метрик: пропорции лица, симметрия, состояние кожи, форма челюсти, скулы, нос, глаза, губы, отношение лба к лицу, глубина глаз, контрастность черт, текстура волос, тон кожи, овал лица, дефекты, пропорции носа и подбородка, линия роста волос."
    },
    {
        question: "Как отслеживать прогресс?",
        answer: "Все анализы сохраняются в личном кабинете. Вы можете видеть динамику по каждой метрике и отслеживать улучшения с течением времени."
    },
    {
        question: "Можно ли сравнивать фото до и после?",
        answer: "Да! Для пользователей подписок HTN и CHAD доступно системное сравнение метрик и LLM сравнение фото для глубокого анализа прогресса."
    },
    {
        question: "Безопасны ли мои фотографии?",
        answer: "Да, все фотографии хранятся в зашифрованном виде и используются только для анализа. Вы можете удалить их в любой момент."
    },
];

export default function FAQPage() {
    return (
        <div className="min-h-screen pt-24 pb-12 px-4">
            <div className="max-w-4xl mx-auto">
                <div className="text-center mb-12">
                    <h1 className="text-4xl md:text-5xl font-bold text-gradient mb-4">
                        Часто задаваемые вопросы
                    </h1>
                    <p className="text-gray-400 text-lg">
                        Всё, что нужно знать о chadmetrix
                    </p>
                </div>

                <div className="space-y-4">
                    {faqs.map((faq, index) => (
                        <div
                            key={index}
                            className="glass rounded-2xl p-6 border border-white/10 hover:border-white/20 transition-all"
                        >
                            <h2 className="text-xl font-semibold text-white mb-3">
                                {faq.question}
                            </h2>
                            <p className="text-gray-400 leading-relaxed">
                                {faq.answer}
                            </p>
                        </div>
                    ))}
                </div>

                <div className="mt-12 text-center">
                    <Link href="/">
                        <button className="text-gray-400 hover:text-white transition-colors">
                            ← На главную
                        </button>
                    </Link>
                </div>
            </div>
        </div>
    );
}