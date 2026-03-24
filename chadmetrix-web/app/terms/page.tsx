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
                                Настоящие Условия использования (далее — «Условия») регулируют отношения между Оператором
                                (ИП/ООО [ФИО/Наименование], ИНН [номер], ОГРН [номер], адрес: [адрес],
                                контактный email: support@chadmetrix.ru) и Пользователем сервиса chadmetrix.ru.
                            </p>
                            <p>
                                Используя сервис, вы подтверждаете согласие с настоящими Условиями и
                                Политикой конфиденциальности в соответствии с Федеральным законом № 152-ФЗ
                                «О персональных данных».
                            </p>
                        </section>

                        <section>
                            <h2 className="text-xl font-semibold text-white mb-4">2. Персональные данные (152-ФЗ)</h2>
                            <p className="mb-4">
                                <strong>2.1.</strong> Оператор обрабатывает следующие персональные данные:
                                email, имя пользователя, фотографии лица (биометрические данные),
                                историю анализов, платёжную информацию (через платёжные шлюзы).
                            </p>
                            <p className="mb-4">
                                <strong>2.2.</strong> Цели обработки: предоставление услуг анализа внешности,
                                улучшение качества сервиса, защита от мошенничества, соблюдение требований закона.
                            </p>
                            <p className="mb-4">
                                <strong>2.3.</strong> Правовые основания: согласие Пользователя (ст. 6 152-ФЗ),
                                договор на оказание услуг (ст. 6 152-ФЗ).
                            </p>
                            <p>
                                <strong>2.4.</strong> Срок хранения: в течение действия учётной записи и 3 лет
                                после удаления (для защиты прав в судебном порядке).
                            </p>
                        </section>

                        <section>
                            <h2 className="text-xl font-semibold text-white mb-4">3. Согласие на обработку биометрических данных</h2>
                            <p className="mb-4">
                                Загружая фотографии лица, вы даёте согласие на обработку биометрических
                                персональных данных (ч. 1 ст. 11 152-ФЗ) с целью предоставления услуг
                                анализа внешности.
                            </p>
                            <p>
                                Обработка осуществляется с применением шифрования (AES-256).
                                Данные не передаются третьим лицам, кроме случаев, предусмотренных законом.
                            </p>
                        </section>

                        <section>
                            <h2 className="text-xl font-semibold text-white mb-4">4. Услуги и оплата</h2>
                            <p className="mb-4">
                                <strong>4.1.</strong> Сервис предоставляет анализ внешности с использованием
                                искусственного интеллекта. Результаты носят рекомендательный характер
                                и не являются медицинской диагностикой.
                            </p>
                            <p className="mb-4">
                                <strong>4.2.</strong> Цены указаны на сайте. Оплата производится через
                                платёжные системы ЮКасса/Тинькофф (в зависимости от подключения).
                            </p>
                            <p>
                                <strong>4.3.</strong> Возврат средств: в течение 14 дней с момента покупки
                                при условии неиспользования услуги (Закон о защите прав потребителей).
                                Если анализ уже выполнен — возврат невозможен.
                            </p>
                        </section>

                        <section>
                            <h2 className="text-xl font-semibold text-white mb-4">5. Cookies и технологии отслеживания</h2>
                            <p>
                                Сайт использует cookies для авторизации, аналитики и персонализации.
                                Продолжая использовать сайт, вы соглашаетесь с использованием cookies
                                в соответствии с Политикой в отношении обработки файлов cookie.
                            </p>
                        </section>

                        <section>
                            <h2 className="text-xl font-semibold text-white mb-4">6. Права пользователя</h2>
                            <p className="mb-4">
                                Вы имеете право на: доступ к своим данным (ст. 14 152-ФЗ),
                                уточнение/удаление данных (ст. 14 152-ФЗ), отзыв согласия (ч. 2 ст. 9 152-ФЗ),
                                переносимость данных.
                            </p>
                            <p>
                                Для реализации прав обращайтесь на support@chadmetrix.ru с темой «ПДн».
                            </p>
                        </section>

                        <section>
                            <h2 className="text-xl font-semibold text-white mb-4">7. Ответственность</h2>
                            <p>
                                Оператор не несёт ответственности за результаты анализа, принятые
                                пользователем решения на их основе, а также за технические сбои,
                                вызванные неполадками на стороне пользователя или форс-мажором.
                            </p>
                        </section>

                        <section>
                            <h2 className="text-xl font-semibold text-white mb-4">8. Контакты</h2>
                            <p className="mb-2">Оператор: [Ваши ФИО/наименование]</p>
                            <p className="mb-2">Email: support@chadmetrix.ru</p>
                            <p className="mb-2">Телефон: [ваш телефон]</p>
                            <p>Дата последнего обновления: 25.03.2026</p>
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