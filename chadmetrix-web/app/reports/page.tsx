"use client"

import { useEffect, useState } from "react"
import { useRouter } from "next/navigation"
import Link from "next/link"
import { Navbar } from "@/components/navbar"
import { ReportCard } from "@/components/report-card"
import { Button } from "@/components/ui/button"
import { useAuth } from "@/lib/hooks/useAuth"
import { getReports } from "@/lib/api"
import { ArrowLeft, Plus, BarChart3 } from "lucide-react"

interface Report {
    id: string
    score: number
    createdAt: string
    thumbnail?: string
}

export default function ReportsPage() {
    const router = useRouter()
    const { isLoading: authLoading, isAuthenticated } = useAuth()
    const [reports, setReports] = useState<Report[]>([])
    const [isLoading, setIsLoading] = useState(true)

    useEffect(() => {
        if (!authLoading && !isAuthenticated) {
            router.push("/login")
            return
        }

        if (isAuthenticated) {
            getReports()
                .then(setReports)
                .catch(console.error)
                .finally(() => setIsLoading(false))
        }
    }, [authLoading, isAuthenticated, router])

    if (isLoading) {
        return (
            <main className="min-h-screen bg-black">
                <Navbar />
                <div className="flex min-h-screen items-center justify-center pt-16">
                    <div className="text-center">
                        <div className="mx-auto h-8 w-8 animate-spin rounded-full border-2 border-white/20 border-t-white" />
                        <p className="mt-4 text-zinc-500">Загрузка отчетов...</p>
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

                <div className="mb-8 flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
                    <div>
                        <h1 className="text-3xl font-bold text-white md:text-4xl">
                            Мои{" "}
                            <span className="bg-gradient-to-r from-blue-400 to-purple-400 bg-clip-text text-transparent">
                                отчеты
                            </span>
                        </h1>
                        <p className="mt-2 text-zinc-500">
                            Просматривайте и управляйте всеми вашими отчетами анализа лица
                        </p>
                    </div>

                    <Link href="/analysis/new">
                        <Button className="rounded-xl bg-gradient-to-r from-blue-500 to-purple-500 px-6 text-white hover:from-blue-600 hover:to-purple-600">
                            <Plus className="mr-2 h-5 w-5" />
                            Новый анализ
                        </Button>
                    </Link>
                </div>

                {reports.length === 0 ? (
                    <div className="rounded-2xl border border-white/10 bg-white/5 py-16 text-center">
                        <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-2xl bg-white/10">
                            <BarChart3 className="h-8 w-8 text-zinc-500" />
                        </div>
                        <h3 className="text-lg font-medium text-white">Пока нет отчетов</h3>
                        <p className="mt-2 text-zinc-500">
                            Начните первый анализ, чтобы увидеть результаты здесь
                        </p>
                        <Link href="/analysis/new">
                            <Button className="mt-6 rounded-xl bg-white px-6 text-black hover:bg-zinc-200">
                                Начать анализ
                            </Button>
                        </Link>
                    </div>
                ) : (
                    <div className="grid gap-4 md:grid-cols-2">
                        {reports.map((report) => (
                            <ReportCard
                                key={report.id}
                                id={report.id}
                                score={report.score}
                                date={report.createdAt}
                                thumbnail={report.thumbnail}
                            />
                        ))}
                    </div>
                )}
            </div>
        </main>
    )
}