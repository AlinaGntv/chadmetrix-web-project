// app/terms/page.tsx
import { Button } from "@/components/ui/button";
import Link from "next/link";

export const metadata = {
    title: "Условия использования — chadmetrix",
    description: "Условия использования и политика конфиденциальности в соответствии с законодательством РФ",
};

export default function TermsPage() {
    return (
        <div className="min-h-screen pt-24 pb-12 px-4">
            <div className="max-w-3xl mx-auto">
                <div className="glass rounded-3xl p-8 md:p-12 border border-white/10">
                    <h1 className="text-3xl font-bold text-white mb-8">
                        Условия использования и политика конфиденциальности
                    </h1>

                    <div className="space-y-8 text-gray-300 text-sm leading-relaxed">

                        <section>
                            <h2 className="text-xl font-semibold text-white mb-4">1. Общие положения</h2>
                            <p className="mb-4">
                                Настоящие Условия использования регулируют отношения между Оператором —
                                физическим лицом, применяющим специальный налоговый режим «Налог на
                                профессиональный доход» Игнатьева Алина Николаевна, ИНН 213012607206,
                                зарегистрированным в реестре самозанятых, email: gntv.surname@gmail.com
                                (далее — «Оператор») и Пользователем сервиса chadmetrix.ru.
                            </p>
                            <p>
                                Используя сервис, вы подтверждаете согласие с настоящими Условиями в
                                соответствии с ФЗ № 152-ФЗ «О персональных данных» и ФЗ № 2300-1
                                «О защите прав потребителей».
                            </p>
                        </section>

                        <section>
                            <h2 className="text-xl font-semibold text-white mb-4">2. Персональные данные (152-ФЗ)</h2>
                            <p className="mb-4">
                                <strong>2.1.</strong> Оператор обрабатывает: email, имя, фотографии лица
                                (биометрические ПДн), историю анализов, платёжные реквизиты (через ЮKassa).
                            </p>
                            <p className="mb-4">
                                <strong>2.2.</strong> Цели: предоставление услуг, улучшение сервиса, защита от мошенничества.
                            </p>
                            <p className="mb-4">
                                <strong>2.3.</strong> Правовые основания: согласие Пользователя (ст. 6 152-ФЗ).
                            </p>
                            <p>
                                <strong>2.4.</strong> Срок хранения: в течение действия учётной записи и 3 года
                                после удаления (для защиты прав в суде).
                            </p>
                        </section>

                        <section>
                            <h2 className="text-xl font-semibold text-white mb-4">3. Согласие на биометрические данные</h2>
                            <p className="mb-4">
                                Загружая фото, вы даёте согласие на обработку биометрических ПДн
                                (ч. 1 ст. 11 152-ФЗ) для анализа внешности.
                            </p>
                            <p>
                                Данные шифруются (AES-256), не передаются третьим лицам.
                            </p>
                        </section>

                        <section>
                            <h2 className="text-xl font-semibold text-white mb-4">4. Услуги и оплата</h2>
                            <p className="mb-4">
                                <strong>4.1.</strong> Услуга: ИИ-анализ внешности. Результаты рекомендательные,
                                не являются медицинской диагностикой.
                            </p>
                            <p className="mb-4">
                                <strong>4.2.</strong> Оплата через ЮKassa (ООО «ЮКасса», ИНН 7736333969).
                                Принимаются: карты РФ, СБП, кошельки. Данные карт не хранятся на наших серверах.
                            </p>
                            <p className="mb-4">
                                <strong>4.3.</strong> Чек на email в течение 24 часов. Оператор применяет НПД
                                (специальный налоговый режим для самозанятых, ФЗ № 422-ФЗ).
                            </p>
                            <p>
                                <strong>4.4.</strong> Возврат: 14 дней если услуга не оказана (ст. 26.1 ЗоЗПП).
                                Если анализ выполнен — возврат невозможен, кроме технических сбоев (подтверждаются логами).
                            </p>
                        </section>

                        <section>
                            <h2 className="text-xl font-semibold text-white mb-4">5. Cookies</h2>
                            <p>
                                Используем cookies для авторизации и аналитики. Продолжая использовать сайт,
                                вы соглашаетесь с обработкой cookies.
                            </p>
                        </section>

                        <section>
                            <h2 className="text-xl font-semibold text-white mb-4">6. Права пользователя</h2>
                            <p className="mb-4">
                                Вы имеете право: получить доступ к данным, потребовать уточнения/удаления,
                                отозвать согласие (ст. 14, ч. 2 ст. 9 152-ФЗ).
                            </p>
                            <p>
                                Запросы направляйте на gntv.surname@gmail.com с темой «ПДн».
                            </p>
                        </section>

                        <section>
                            <h2 className="text-xl font-semibold text-white mb-4">7. Ответственность</h2>
                            <p>
                                Оператор не отвечает за решения, принятые на основе анализа,
                                и технические сбои на стороне пользователя.
                            </p>
                        </section>

                        <section>
                            <h2 className="text-xl font-semibold text-white mb-4">8. Контакты и реквизиты</h2>
                            <p className="mb-2">Самозанятый: Игнатьева Алина Николаевна</p>
                            <p className="mb-2">ИНН: 213012607206</p>
                            <p className="mb-2">Email: gntv.surname@gmail.com</p>
                            <p className="mb-2">Телефон: [+7 995 301 31 96]</p>
                            <p>Дата обновления: 25.03.2026</p>
                        </section>

                    </div>

                    <div className="mt-12 pt-8 border-t border-white/10 flex justify-center">
                        <Link href="/">
                            <Button variant="outline" className="glass border-white/20">
                                ← Вернуться на главную
                            </Button>
                        </Link>
                    </div>
                </div>
            </div>
        </div>
    );
}