// components/hero.tsx
"use client";

import Link from "next/link";
import { ArrowRight, Play, Star, Users } from "lucide-react";
import { Button } from "@/components/ui/button";

export function Hero() {
    return (
        <section className="relative pt-32 pb-20 lg:pt-48 lg:pb-32 overflow-hidden">
            <div className="absolute inset-0 bg-linear-to-b from-white/5 via-transparent to-transparent pointer-events-none" />

            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative">
                <div className="text-center max-w-4xl mx-auto">
                    <div className="inline-flex items-center space-x-2 glass rounded-full px-4 py-1.5 mb-8 border border-white/20">
                        <Users className="w-4 h-4 text-gray-400" />
                        <span className="text-sm text-gray-300">300+ анализов проведено</span>
                    </div>

                    <h1 className="text-5xl md:text-7xl font-bold tracking-tight mb-6 text-gradient leading-tight">
                        Объективный <br />
                        <span className="text-transparent bg-clip-text bg-linear-to-r from-white via-gray-200 to-gray-500">
                            AI-анализ внешности
                        </span>
                    </h1>

                    <p className="text-xl text-gray-400 mb-10 max-w-2xl mx-auto leading-relaxed">
                        17 метрик качества, персональный роадмап улучшений на 30 дней и сравнение прогресса «до/после».
                        Получите реальные рекомендации, а не пустые комплименты.
                    </p>

                    <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
                        <Link href="/analysis/new">
                            <Button size="lg" className="bg-white text-black hover:bg-gray-200 px-8 py-6 text-lg font-semibold group">
                                Начать анализ за 199₽
                                <ArrowRight className="ml-2 w-5 h-5 group-hover:translate-x-1 transition-transform" />
                            </Button>
                        </Link>
                        <Link href="/demo">
                            <Button variant="outline" size="lg" className="glass px-8 py-6 text-lg border-white/20 hover:bg-white/10">
                                <Play className="mr-2 w-5 h-5" />
                                Смотреть пример отчёта
                            </Button>
                        </Link>
                    </div>

                    <div className="mt-16 flex items-center justify-center space-x-8 text-gray-500">
                        {/* Кликабельная реферальная программа */}
                        <Link href="/referral" className="flex items-center space-x-2 hover:text-white transition-colors group">
                            <div className="flex -space-x-2">
                                {[1, 2, 3, 4].map((i) => (
                                    <div key={i} className="w-8 h-8 rounded-full bg-linear-to-br from-gray-700 to-gray-900 border-2 border-black group-hover:from-gray-600 group-hover:to-gray-800 transition-all" />
                                ))}
                            </div>
                            <span className="text-sm group-hover:text-white transition-colors">Реферальная программа</span>
                        </Link>

                        <div className="h-4 w-px bg-gray-800" />

                        {/* Кликабельные отзывы */}
                        <Link href="/reviews" className="flex items-center space-x-1 hover:text-white transition-colors group">
                            {[1, 2, 3, 4, 5].map((i) => (
                                <Star key={i} className="w-4 h-4 text-gray-300 fill-gray-300 group-hover:text-yellow-500 group-hover:fill-yellow-500 transition-colors" />
                            ))}
                            <span className="text-sm ml-2 group-hover:text-white transition-colors">4.9 рейтинг</span>
                        </Link>
                    </div>
                </div>
            </div>
        </section>
    );
}