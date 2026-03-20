"use client"

import { useEffect, useState } from "react"
import { useRouter } from "next/navigation"
import Link from "next/link"
import { Navbar } from "@/components/navbar"
import { UploadForm } from "@/components/upload-form"
import { useAuth } from "@/lib/hooks/useAuth"
import { ArrowLeft, Zap, Shield, Lock } from "lucide-react"

export default function NewAnalysisPage() {
    const router = useRouter()
    const { isLoading: authLoading, isAuthenticated } = useAuth()
    const [isLoading, setIsLoading] = useState(true)

    useEffect(() => {
        const checkAuth = () => {
            if (!authLoading && !isAuthenticated) {
                router.push("/login")
                return
            }

            if (!authLoading && isAuthenticated) {
                Promise.resolve().then(() => {
                    setIsLoading(false)
                })
            }
        }

        checkAuth()
    }, [authLoading, isAuthenticated, router])

    if (isLoading) {
        return (
            <main className="min-h-screen bg-black">
                <Navbar />
                <div className="flex min-h-screen items-center justify-center pt-16">
                    <div className="text-center">
                        <div className="mx-auto h-8 w-8 animate-spin rounded-full border-2 border-white/20 border-t-white" />
                        <p className="mt-4 text-zinc-500">Загрузка...</p>
                    </div>
                </div>
            </main>
        )
    }

    return (
        <main className="min-h-screen bg-black">
            <Navbar />

            <div className="mx-auto max-w-6xl px-6 pt-24 pb-16">
                <Link
                    href="/dashboard"
                    className="mb-8 inline-flex items-center gap-2 text-sm text-zinc-500 transition-colors hover:text-white"
                >
                    <ArrowLeft className="h-4 w-4" />
                    Назад в кабинет
                </Link>

                <div className="grid gap-12 lg:grid-cols-2">
                    <div>
                        <h1 className="text-4xl font-bold text-white md:text-5xl">
                            Новый{" "}
                            <span className="bg-gradient-to-r from-blue-400 to-purple-400 bg-clip-text text-transparent">
                                анализ
                            </span>
                        </h1>
                        <p className="mt-4 text-lg text-zinc-400">
                            Загрузите четкое фото анфас для наиболее точных результатов.
                            Наш AI проанализирует 17 различных метрик лица.
                        </p>

                        <div className="mt-8 space-y-4">
                            <div className="flex items-center gap-4 rounded-xl border border-white/10 bg-white/5 p-4">
                                <div className="rounded-lg bg-blue-500/20 p-2">
                                    <Zap className="h-5 w-5 text-blue-400" />
                                </div>
                                <div>
                                    <div className="font-medium text-white">Мгновенные результаты</div>
                                    <div className="text-sm text-zinc-500">
                                        Получите анализ за секунды
                                    </div>
                                </div>
                            </div>

                            <div className="flex items-center gap-4 rounded-xl border border-white/10 bg-white/5 p-4">
                                <div className="rounded-lg bg-purple-500/20 p-2">
                                    <Shield className="h-5 w-5 text-purple-400" />
                                </div>
                                <div>
                                    <div className="font-medium text-white">17 метрик</div>
                                    <div className="text-sm text-zinc-500">
                                        Полный анализ черт лица
                                    </div>
                                </div>
                            </div>

                            <div className="flex items-center gap-4 rounded-xl border border-white/10 bg-white/5 p-4">
                                <div className="rounded-lg bg-green-500/20 p-2">
                                    <Lock className="h-5 w-5 text-green-400" />
                                </div>
                                <div>
                                    <div className="font-medium text-white">Приватно и безопасно</div>
                                    <div className="text-sm text-zinc-500">
                                        Ваши фото зашифрованы
                                    </div>
                                </div>
                            </div>
                        </div>

                        <div className="mt-8 rounded-xl border border-white/10 bg-white/5 p-6">
                            <h3 className="mb-4 font-medium text-white">Советы для лучших результатов:</h3>
                            <ul className="space-y-2 text-sm text-zinc-400">
                                <li className="flex items-start gap-2">
                                    <span className="text-blue-400">•</span>
                                    <span>Используйте фото анфас с хорошим освещением</span>
                                </li>
                                <li className="flex items-start gap-2">
                                    <span className="text-blue-400">•</span>
                                    <span>Сохраняйте нейтральное выражение лица</span>
                                </li>
                                <li className="flex items-start gap-2">
                                    <span className="text-blue-400">•</span>
                                    <span>Снимите очки и аксессуары</span>
                                </li>
                                <li className="flex items-start gap-2">
                                    <span className="text-blue-400">•</span>
                                    <span>Убедитесь, что лицо хорошо видно</span>
                                </li>
                            </ul>
                        </div>
                    </div>

                    <div className="flex items-center justify-center">
                        <UploadForm />
                    </div>
                </div>
            </div>
        </main>
    )
}