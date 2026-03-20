"use client"

import { useEffect, useState } from "react"
import Link from "next/link"
import { useRouter } from "next/navigation"
import { Navbar } from "@/components/navbar"
import { ReportCard } from "@/components/report-card"
import { Button } from "@/components/ui/button"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { useAuth } from "@/lib/hooks/useAuth"
import { getReports } from "@/lib/api"
import { Plus, BarChart3, Sparkles, LogOut } from "lucide-react"

interface Report {
    id: string
    score: number
    createdAt: string
    thumbnail?: string
}

export default function DashboardPage() {
    const router = useRouter()
    const { user, isLoading: authLoading, isAuthenticated, logout } = useAuth()
    const [reports, setReports] = useState<Report[]>([])
    const [reportsLoading, setReportsLoading] = useState(true)

    useEffect(() => {
        if (!authLoading && !isAuthenticated) {
            router.push("/login")
            return
        }

        if (isAuthenticated) {
            getReports()
                .then(setReports)
                .catch(console.error)
                .finally(() => setReportsLoading(false))
        }
    }, [authLoading, isAuthenticated, router])

    if (authLoading || reportsLoading) {
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

    if (!user) return null

    const averageScore = reports.length > 0
        ? (reports.reduce((acc, r) => acc + r.score, 0) / reports.length).toFixed(1)
        : "Н/Д"

    const bestScore = reports.length > 0
        ? Math.max(...reports.map((r) => r.score)).toFixed(1)
        : "Н/Д"

    return (
        <main className="min-h-screen bg-black">
            <Navbar />

            <div className="mx-auto max-w-6xl px-6 pt-24 pb-16">
                <div className="mb-12 flex flex-col gap-6 md:flex-row md:items-center md:justify-between">
                    <div className="flex items-center gap-4">
                        <Avatar className="h-16 w-16 border-2 border-white/10">
                            <AvatarImage src={user.avatar_url} />
                            <AvatarFallback className="bg-gradient-to-br from-blue-500 to-purple-500 text-2xl font-bold text-white">
                                {user.full_name?.charAt(0).toUpperCase()}
                            </AvatarFallback>
                        </Avatar>
                        <div>
                            <h1 className="text-2xl font-bold text-white">{user.full_name}</h1>
                            <p className="text-zinc-500">{user.email}</p>
                        </div>
                    </div>

                    <div className="flex items-center gap-3">
                        <Link href="/analysis/new">
                            <Button className="rounded-xl bg-gradient-to-r from-blue-500 to-purple-500 px-6 text-white hover:from-blue-600 hover:to-purple-600">
                                <Plus className="mr-2 h-5 w-5" />
                                Новый анализ
                            </Button>
                        </Link>
                        <Button
                            onClick={logout}
                            variant="outline"
                            className="rounded-xl border-white/20 bg-white/5 text-white hover:bg-white/10"
                        >
                            <LogOut className="h-5 w-5" />
                        </Button>
                    </div>
                </div>

                <div className="mb-8 grid gap-6 md:grid-cols-3">
                    <div className="rounded-2xl border border-white/10 bg-white/5 p-6">
                        <div className="flex items-center gap-3">
                            <div className="rounded-xl bg-blue-500/20 p-3">
                                <BarChart3 className="h-6 w-6 text-blue-400" />
                            </div>
                            <div>
                                <div className="text-2xl font-bold text-white">{reports.length}</div>
                                <div className="text-sm text-zinc-500">Всего анализов</div>
                            </div>
                        </div>
                    </div>

                    <div className="rounded-2xl border border-white/10 bg-white/5 p-6">
                        <div className="flex items-center gap-3">
                            <div className="rounded-xl bg-purple-500/20 p-3">
                                <Sparkles className="h-6 w-6 text-purple-400" />
                            </div>
                            <div>
                                <div className="text-2xl font-bold text-white">{averageScore}</div>
                                <div className="text-sm text-zinc-500">Средняя оценка</div>
                            </div>
                        </div>
                    </div>

                    <div className="rounded-2xl border border-white/10 bg-white/5 p-6">
                        <div className="flex items-center gap-3">
                            <div className="rounded-xl bg-green-500/20 p-3">
                                <BarChart3 className="h-6 w-6 text-green-400" />
                            </div>
                            <div>
                                <div className="text-2xl font-bold text-white">{bestScore}</div>
                                <div className="text-sm text-zinc-500">Лучшая оценка</div>
                            </div>
                        </div>
                    </div>
                </div>

                <div className="rounded-2xl border border-white/10 bg-white/5 p-6">
                    <div className="mb-6 flex items-center justify-between">
                        <h2 className="text-lg font-semibold text-white">Последние отчеты</h2>
                        <Link
                            href="/reports"
                            className="text-sm text-blue-400 hover:underline"
                        >
                            Все отчеты
                        </Link>
                    </div>

                    {reports.length === 0 ? (
                        <div className="py-12 text-center">
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
                        <div className="space-y-4">
                            {reports.slice(0, 5).map((report) => (
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
            </div>
        </main>
    )
}