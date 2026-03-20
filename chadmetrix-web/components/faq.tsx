"use client"

import {
    Accordion,
    AccordionContent,
    AccordionItem,
    AccordionTrigger,
} from "@/components/ui/accordion"

const faqs = [
    {
        question: "Что такое ChadMetrix?",
        answer:
            "ChadMetrix - это сервис AI-анализа внешности, который оценивает ваше лицо по 17 различным метрикам. Наши алгоритмы анализируют симметрию лица, пропорции и другие ключевые особенности, предоставляя детальную информацию и персональные рекомендации.",
    },
    {
        question: "Как работает анализ?",
        answer:
            "Просто загрузите четкое фото лица анфас. Наш AI обработает изображение за несколько секунд, анализируя 17 различных метрик лица, включая форму челюсти, симметрию, расположение глаз, качество кожи и многое другое. Вы получите подробный отчет с оценками и персональными рекомендациями.",
    },
    {
        question: "Безопасны ли мои данные?",
        answer:
            "Абсолютно. Мы серьезно относимся к конфиденциальности. Ваши фотографии шифруются при загрузке и обработке. Мы никогда не передаем данные третьим лицам, и вы можете удалить свои данные в любой момент. Наши серверы защищены современными протоколами безопасности.",
    },
    {
        question: "Насколько точен AI анализ?",
        answer:
            "Наш AI обучен на миллионах изображений лиц и достигает 99% точности в определении метрик. Однако важно помнить, что красота субъективна, и наши оценки предоставляют объективные измерения черт лица, а не окончательные суждения о привлекательности.",
    },
    {
        question: "Могу ли я отслеживать прогресс?",
        answer:
            "Да! Пользователи Pro и Premium могут отслеживать результаты своих анализов с течением времени. Это идеально подходит для мониторинга эффекта от ухода за кожей, фитнес-программ или других усилий по саморазвитию.",
    },
    {
        question: "Какие способы оплаты вы принимаете?",
        answer:
            "Мы принимаем все основные кредитные карты (Visa, Mastercard, American Express), PayPal и Apple Pay. Все платежи обрабатываются безопасно через Stripe.",
    },
]

export function FAQ() {
    return (
        <section id="faq" className="bg-zinc-950 py-24">
            <div className="mx-auto max-w-3xl px-6">
                <div className="mb-16 text-center">
                    <h2 className="text-4xl font-bold text-white md:text-5xl">
                        Часто задаваемые{" "}
                        <span className="bg-gradient-to-r from-blue-400 to-purple-400 bg-clip-text text-transparent">
                            вопросы
                        </span>
                    </h2>
                    <p className="mx-auto mt-4 max-w-2xl text-zinc-400">
                        Всё, что нужно знать о ChadMetrix
                    </p>
                </div>

                <Accordion type="single" collapsible className="space-y-4">
                    {faqs.map((faq, index) => (
                        <AccordionItem
                            key={index}
                            value={`item-${index}`}
                            className="overflow-hidden rounded-2xl border border-white/10 bg-white/5 px-6"
                        >
                            <AccordionTrigger className="py-6 text-left text-white hover:text-zinc-300 hover:no-underline">
                                {faq.question}
                            </AccordionTrigger>
                            <AccordionContent className="pb-6 text-zinc-400 leading-relaxed">
                                {faq.answer}
                            </AccordionContent>
                        </AccordionItem>
                    ))}
                </Accordion>
            </div>
        </section>
    )
}