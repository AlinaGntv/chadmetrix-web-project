"use client"

import { useEffect, useState } from "react"
import { useRouter, useParams } from "next/navigation"
import Link from "next/link"
import Image from "next/image"
import { Navbar } from "@/components/navbar"
import { Button } from "@/components/ui/button"
import { useAuth } from "@/lib/hooks/useAuth"
import { getReport } from "@/lib/api"
import { ArrowLeft, Download, Share2, TrendingUp, Sparkles } from "lucide-react"

interface Metric {
    name: string
    score: number
    description: string
}

interface ReportData {
    id: string
    overallScore: number
    percentile: number
    createdAt: string
    imageUrl?: string
    metrics: Metric[]
}

export default function ReportDetailPage() {
    const router = useRouter()
    const params = useParams()
    const { isLoading: authLoading, isAuthenticated } = useAuth()
    const [report, setReport] = useState<ReportData | null>(null)
    const [isLoading, setIsLoading] = useState(true)

    useEffect(() => {
        if (!authLoading && !isAuthenticated) {
            router.push("/login")
            return
        }

        if (isAuthenticated && params.id) {
            getReport(params.id as string)
                .then(setReport)
                .catch(console.error)
                .finally(() => setIsLoading(false))
        }
    }, [authLoading, isAuthenticated, router, params.id])

    const getScoreColor = (score: number) => {
        if (score >= 80) return "text-green-400"
        if (score >= 60) return "text-blue-400"
        if (score >= 40) return "text-yellow-400"
        return "text-red-400"
    }

    const getScoreGradient = (score: number) => {
        if (score >= 80) return "from-green-500 to-emerald-500"
        if (score >= 60) return "from-blue-500 to-cyan-500"
        if (score >= 40) return "from-yellow-500 to-orange-500"
        return "from-red-500 to-pink-500"
    }

    if (isLoading) {
        return (
            <main className="min-h-screen bg-black">
                <Navbar />
                <div className="flex min-h-screen items-center justify-center pt-16">
                    <div className="text-center">
                        <div className="mx-auto h-8 w-8 animate-spin rounded-full border-2 border-white/20 border-t-white" />
                        <p className="mt-4 text-zinc-500">Загрузка отчета...</p>
                    </div>
                </div>
            </main>
        )
    }

    if (!report) {
        return (
            <main className="min-h-screen bg-black">
                <Navbar />
                <div className="flex min-h-screen items-center justify-center pt-16">
                    <div className="text-center">
                        <h2 className="text-xl font-bold text-white">Отчет не найден</h2>
                        <Link href="/reports">
                            <Button className="mt-4 rounded-xl bg-white text-black hover:bg-zinc-200">
                                К списку отчетов
                            </Button>
                        </Link>
                    </div>
                </div>
            </main>
        )
    }

    const overallScore = report.overallScore
    const overallPercent = overallScore * 10

    return (
        <main className="min-h-screen bg-black">
            <Navbar />

            <div className="mx-auto max-w-6xl px-6 pt-24 pb-16">
                <Link
                    href="/reports"
                    className="mb-8 inline-flex items-center gap-2 text-sm text-zinc-500 transition-colors hover:text-white"
                >
                    <ArrowLeft className="h-4 w-4" />
                    К списку отчетов
                </Link>

                <div className="mb-8 flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
                    <div>
                        <h1 className="text-3xl font-bold text-white md:text-4xl">
                            Отчет{" "}
                            <span className="bg-gradient-to-r from-blue-400 to-purple-400 bg-clip-text text-transparent">
                                об анализе
                            </span>
                        </h1>
                        <p className="mt-2 text-zinc-500">
                            {new Date(report.createdAt).toLocaleDateString("ru-RU", {
                                year: "numeric",
                                month: "long",
                                day: "numeric",
                            })}
                        </p>
                    </div>

                    <div className="flex items-center gap-3">
                        <Button
                            variant="outline"
                            className="rounded-xl border-white/20 bg-white/5 text-white hover:bg-white/10"
                        >
                            <Share2 className="mr-2 h-4 w-4" />
                            Поделиться
                        </Button>
                        <Button
                            variant="outline"
                            className="rounded-xl border-white/20 bg-white/5 text-white hover:bg-white/10"
                        >
                            <Download className="mr-2 h-4 w-4" />
                            Экспорт
                        </Button>
                    </div>
                </div>

                <div className="grid gap-8 lg:grid-cols-3">
                    <div className="lg:col-span-1">
                        <div className="overflow-hidden rounded-2xl border border-white/10 bg-white/5">
                            {report.imageUrl && (
                                <div className="relative aspect-square w-full">
                                    <Image
                                        src={report.imageUrl}
                                        alt="Анализируемое фото"
                                        fill
                                        className="object-cover"
                                        sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
                                        priority={false}
                                    />
                                </div>
                            )}

                            <div className="p-6">
                                <div className="text-center">
                                    <div className="mb-2 flex items-center justify-center gap-2">
                                        <Sparkles className="h-5 w-5 text-blue-400" />
                                        <span className="text-sm text-zinc-500">Общая оценка</span>
                                    </div>
                                    <div
                                        className={`text-6xl font-bold ${getScoreColor(overallPercent)}`}
                                    >
                                        {overallScore.toFixed(1)}
                                    </div>
                                    <div className="mt-2 text-zinc-500">из 10</div>
                                </div>

                                <div className="mt-6 flex items-center justify-center gap-2 rounded-xl bg-white/5 py-3">
                                    <TrendingUp className="h-5 w-5 text-green-400" />
                                    <span className="text-sm text-zinc-300">
                                        Топ {100 - report.percentile}% пользователей
                                    </span>
                                </div>
                            </div>
                        </div>
                    </div>

                    <div className="lg:col-span-2">
                        <div className="rounded-2xl border border-white/10 bg-white/5 p-6">
                            <h2 className="mb-6 text-lg font-semibold text-white">
                                Детальные метрики
                            </h2>

                            <div className="space-y-6">
                                {report.metrics.map((metric) => (
                                    <div key={metric.name}>
                                        <div className="mb-2 flex items-center justify-between">
                                            <span className="text-sm font-medium text-white">
                                                {metric.name}
                                            </span>
                                            <span
                                                className={`text-sm font-bold ${getScoreColor(metric.score)}`}
                                            >
                                                {metric.score}%
                                            </span>
                                        </div>
                                        <div className="mb-2 h-3 overflow-hidden rounded-full bg-white/10">
                                            <div
                                                className={`h-full rounded-full bg-gradient-to-r ${getScoreGradient(metric.score)}`}
                                                style={{ width: `${metric.score}%` }}
                                            />
                                        </div>
                                        <p className="text-xs text-zinc-500">{metric.description}</p>
                                    </div>
                                ))}
                            </div>
                        </div>

                        <div className="mt-6 rounded-2xl border border-white/10 bg-gradient-to-br from-blue-500/10 to-purple-500/10 p-6">
                            <h2 className="mb-4 text-lg font-semibold text-white">
                                Рекомендации
                            </h2>
                            <ul className="space-y-3 text-sm text-zinc-300">
                                <li className="flex items-start gap-2">
                                    <span className="text-blue-400">•</span>
                                    Сосредоточьтесь на уходе за кожей для улучшения показателей качества кожи
                                </li>
                                <li className="flex items-start gap-2">
                                    <span className="text-blue-400">•</span>
                                    Рассмотрите упражнения для лица для улучшения линии челюсти
                                </li>
                                <li className="flex items-start gap-2">
                                    <span className="text-blue-400">•</span>
                                    Поддерживайте водный баланс для лучшей общей гармонии лица
                                </li>
                            </ul>
                        </div>
                    </div>
                </div>
            </div>
        </main>
    )
}