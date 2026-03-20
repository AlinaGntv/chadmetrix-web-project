"use client"

import Link from "next/link"
import { Button } from "@/components/ui/button"
import { useAuth } from "@/lib/hooks/useAuth"
import { ArrowRight, Sparkles } from "lucide-react"

export function Hero() {
    const { isAuthenticated } = useAuth()

    return (
        <section className="relative overflow-hidden bg-black pt-32 pb-20">
            <div className="absolute inset-0 bg-gradient-to-b from-zinc-900/50 via-black to-black" />
            <div className="absolute top-0 left-1/2 h-[500px] w-[800px] -translate-x-1/2 rounded-full bg-gradient-to-r from-blue-500/20 via-purple-500/20 to-pink-500/20 blur-3xl" />

            <div className="relative mx-auto max-w-6xl px-6">
                <div className="flex flex-col items-center text-center">
                    <div className="mb-6 inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/5 px-4 py-2 text-sm text-zinc-400 backdrop-blur-sm">
                        <Sparkles className="h-4 w-4 text-blue-400" />
                        <span>Работает на передовых AI алгоритмах</span>
                    </div>

                    <h1 className="max-w-4xl text-5xl font-bold leading-tight tracking-tight text-white md:text-7xl">
                        AI Анализ{" "}
                        <span className="bg-gradient-to-r from-blue-400 via-purple-400 to-pink-400 bg-clip-text text-transparent">
                            Внешности
                        </span>
                    </h1>

                    <p className="mt-6 max-w-2xl text-lg text-zinc-400 md:text-xl">
                        17 метрик лица на основе AI. Получите детальный анализ ваших черт лица
                        с помощью передовой системы компьютерного зрения.
                    </p>

                    <div className="mt-10 flex flex-col items-center gap-4 sm:flex-row">
                        <Link href={isAuthenticated ? "/dashboard" : "/login"}>
                            <Button
                                size="lg"
                                className="group relative overflow-hidden rounded-xl bg-white px-8 py-6 text-base font-semibold text-black transition-all hover:bg-zinc-200"
                            >
                                Начать анализ
                                <ArrowRight className="ml-2 h-5 w-5 transition-transform group-hover:translate-x-1" />
                            </Button>
                        </Link>
                        <Link href="/#features">
                            <Button
                                size="lg"
                                variant="outline"
                                className="rounded-xl border-white/20 bg-white/5 px-8 py-6 text-base text-white backdrop-blur-sm hover:bg-white/10 hover:text-white"
                            >
                                Узнать больше
                            </Button>
                        </Link>
                    </div>

                    <div className="mt-16 grid grid-cols-3 gap-8 md:gap-16">
                        <div className="text-center">
                            <div className="text-3xl font-bold text-white md:text-4xl">17</div>
                            <div className="mt-1 text-sm text-zinc-500">Метрик анализируется</div>
                        </div>
                        <div className="text-center">
                            <div className="text-3xl font-bold text-white md:text-4xl">99%</div>
                            <div className="mt-1 text-sm text-zinc-500">Точность анализа</div>
                        </div>
                        <div className="text-center">
                            <div className="text-3xl font-bold text-white md:text-4xl">50K+</div>
                            <div className="mt-1 text-sm text-zinc-500">Выполнено анализов</div>
                        </div>
                    </div>
                </div>
            </div>
        </section>
    )
}