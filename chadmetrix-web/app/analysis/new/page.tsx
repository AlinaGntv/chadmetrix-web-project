// app/analysis/new/page.tsx
import { UploadForm } from "@/components/upload-form";
import { Shield, Clock, Sparkles } from "lucide-react";

export default function NewAnalysisPage() {
    return (
        <div className="min-h-screen pt-24 pb-12 px-4 sm:px-6 lg:px-8">
            <div className="max-w-4xl mx-auto">
                <div className="text-center mb-12">
                    <h1 className="text-4xl font-bold text-gradient mb-4">
                        Новый анализ внешности
                    </h1>
                    <p className="text-gray-400 text-lg max-w-2xl mx-auto">
                        Загрузите чёткое фото лица анфас, и наш ИИ проведёт детальный анализ по 17 параметрам
                    </p>
                </div>

                <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                    <div className="lg:col-span-2">
                        <UploadForm />
                    </div>

                    <div className="space-y-4">
                        <div className="glass rounded-xl p-6 border border-white/10">
                            <Shield className="w-6 h-6 text-green-400 mb-3" />
                            <h3 className="font-semibold text-white mb-2">Безопасность</h3>
                            <p className="text-sm text-gray-400">
                                Ваши фото защищены шифрованием и не передаются третьим лицам
                            </p>
                        </div>

                        <div className="glass rounded-xl p-6 border border-white/10">
                            <Clock className="w-6 h-6 text-gray-400 mb-3" />
                            <h3 className="font-semibold text-white mb-2">Скорость</h3>
                            <p className="text-sm text-gray-400">
                                Анализ занимает 2-3 секунды. Результат сохранится в вашем кабинете
                            </p>
                        </div>

                        <div className="glass rounded-xl p-6 border border-white/10">
                            <Sparkles className="w-6 h-6 text-gray-300 mb-3" />
                            <h3 className="font-semibold text-white mb-2">Точность</h3>
                            <p className="text-sm text-gray-400">
                                Алгоритм обучен на 10+ миллионах фотографий высокого качества
                            </p>
                        </div>
                    </div>
                </div>

                <div className="mt-12 glass rounded-2xl p-8 border border-white/10">
                    <h3 className="text-lg font-semibold text-white mb-4">Советы для лучшего результата:</h3>
                    <ul className="grid grid-cols-1 md:grid-cols-2 gap-3 text-gray-400">
                        <li className="flex items-center space-x-2">
                            <span className="w-1.5 h-1.5 bg-white rounded-full" />
                            <span>Хорошее освещение лица без теней</span>
                        </li>
                        <li className="flex items-center space-x-2">
                            <span className="w-1.5 h-1.5 bg-white rounded-full" />
                            <span>Нейтральное выражение лица</span>
                        </li>
                        <li className="flex items-center space-x-2">
                            <span className="w-1.5 h-1.5 bg-white rounded-full" />
                            <span>Анфас, взгляд в камеру</span>
                        </li>
                        <li className="flex items-center space-x-2">
                            <span className="w-1.5 h-1.5 bg-white rounded-full" />
                            <span>Без очков и головных уборов</span>
                        </li>
                        <li className="flex items-center space-x-2">
                            <span className="w-1.5 h-1.5 bg-white rounded-full" />
                            <span>Разрешение не менее 512×512</span>
                        </li>
                        <li className="flex items-center space-x-2">
                            <span className="w-1.5 h-1.5 bg-white rounded-full" />
                            <span>Одно лицо в кадре</span>
                        </li>
                    </ul>
                </div>
            </div>
        </div>
    );
}