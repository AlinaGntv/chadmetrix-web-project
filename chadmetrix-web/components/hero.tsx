// components/hero.tsx
"use client";

import Link from "next/link";
import { ArrowRight, Play, Star } from "lucide-react";
import { Button } from "@/components/ui/button";

export function Hero() {
    return (
        <section className="relative pt-32 pb-20 lg:pt-48 lg:pb-32 overflow-hidden">
            <div className="absolute inset-0 bg-linear-to-b from-white/5 via-transparent to-transparent pointer-events-none" />

            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative">
                <div className="text-center max-w-4xl mx-auto">
                    <div className="inline-flex items-center space-x-2 glass rounded-full px-4 py-1.5 mb-8 border border-white/20">
                        <Star className="w-4 h-4 text-yellow-400 fill-yellow-400" />
                        <span className="text-sm text-gray-300">AI-анализ по 17 метрикам качества</span>
                    </div>

                    <h1 className="text-5xl md:text-7xl font-bold tracking-tight mb-6 text-gradient leading-tight">
                        Узнай свою <br />
                        <span className="text-transparent bg-clip-text bg-linear-to-r from-white via-gray-400 to-gray-600">
                            объективную оценку
                        </span>
                    </h1>

                    <p className="text-xl text-gray-400 mb-10 max-w-2xl mx-auto leading-relaxed">
                        ChadMetrix использует передовые нейросети для анализа черт лица.
                        Получи детальный разбор симметрии, пропорций и рекомендации по улучшению внешности.
                    </p>

                    <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
                        <Link href="/analysis/new">
                            <Button size="lg" className="bg-white text-black hover:bg-gray-200 px-8 py-6 text-lg font-semibold group">
                                Начать анализ
                                <ArrowRight className="ml-2 w-5 h-5 group-hover:translate-x-1 transition-transform" />
                            </Button>
                        </Link>
                        <Button variant="outline" size="lg" className="glass px-8 py-6 text-lg border-white/20 hover:bg-white/10">
                            <Play className="mr-2 w-5 h-5" />
                            Смотреть демо
                        </Button>
                    </div>

                    <div className="mt-16 flex items-center justify-center space-x-8 text-gray-500">
                        <div className="flex items-center space-x-2">
                            <div className="flex -space-x-2">
                                {[1, 2, 3, 4].map((i) => (
                                    <div key={i} className="w-8 h-8 rounded-full bg-linear-to-br from-gray-700 to-gray-900 border-2 border-black" />
                                ))}
                            </div>
                            <span className="text-sm">10,000+ анализов</span>
                        </div>
                        <div className="h-4 w-px bg-gray-800" />
                        <div className="flex items-center space-x-1">
                            {[1, 2, 3, 4, 5].map((i) => (
                                <Star key={i} className="w-4 h-4 text-yellow-400 fill-yellow-400" />
                            ))}
                            <span className="text-sm ml-2">4.9 рейтинг</span>
                        </div>
                    </div>
                </div>
            </div>
        </section>
    );
}