// components/footer.tsx
import Link from "next/link";
import Image from "next/image";
import { Github, Twitter, Instagram } from "lucide-react";

export function Footer() {
    return (
        <footer className="border-t border-white/10 bg-black/50 backdrop-blur-xl">
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
                <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
                    <div className="col-span-1 md:col-span-2">
                        <Link href="/" className="flex items-center space-x-3 mb-4 group">
                            {/* Логотип с таким же стилем */}
                            <div className="relative w-8 h-8 rounded-full overflow-hidden ring-2 ring-white/20 group-hover:ring-white/40 transition-all shadow-[0_0_15px_rgba(255,255,255,0.3)]">
                                <Image
                                    src="/logo.png"
                                    alt="ChadMetrix"
                                    fill
                                    className="object-cover"
                                />
                            </div>
                            <span className="text-xl font-bold tracking-tight">
                                <span className="text-white">chad</span>
                                <span className="text-gray-500">metrix</span>
                            </span>
                        </Link>
                        <p className="text-gray-400 text-sm max-w-xs">
                            Профессиональный ИИ-анализ внешности по 17 метрикам качества.
                            Получите объективную оценку и персональные рекомендации.
                        </p>
                    </div>

                    <div>
                        <h3 className="text-sm font-semibold mb-4">Навигация</h3>
                        <ul className="space-y-2 text-sm text-gray-400">
                            <li><Link href="/" className="hover:text-white">Главная</Link></li>
                            <li><Link href="/analysis/new" className="hover:text-white">Новый анализ</Link></li>
                            <li><Link href="/reports" className="hover:text-white">Мои отчёты</Link></li>
                            <li><Link href="/dashboard" className="hover:text-white">Личный кабинет</Link></li>
                        </ul>
                    </div>

                    <div>
                        <h3 className="text-sm font-semibold mb-4">Контакты</h3>
                        <div className="flex space-x-4">
                            <a href="#" className="text-gray-400 hover:text-white">
                                <Twitter className="w-5 h-5" />
                            </a>
                            <a href="#" className="text-gray-400 hover:text-white">
                                <Instagram className="w-5 h-5" />
                            </a>
                            <a href="#" className="text-gray-400 hover:text-white">
                                <Github className="w-5 h-5" />
                            </a>
                        </div>
                    </div>
                </div>

                <div className="mt-8 pt-8 border-t border-white/10 text-center text-sm text-gray-500">
                    © 2026 chadmetrix
                </div>
            </div>
        </footer>
    );
}