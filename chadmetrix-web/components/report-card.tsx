import Link from "next/link"
import Image from "next/image"
import { ArrowRight, Calendar } from "lucide-react"

interface ReportCardProps {
    id: string
    score: number
    date: string
    thumbnail?: string
}

export function ReportCard({ id, score, date, thumbnail }: ReportCardProps) {
    const getScoreColor = (score: number) => {
        if (score >= 8) return "text-green-400"
        if (score >= 6) return "text-blue-400"
        if (score >= 4) return "text-yellow-400"
        return "text-red-400"
    }

    const getScoreGradient = (score: number) => {
        if (score >= 8) return "from-green-500/20 to-emerald-500/20"
        if (score >= 6) return "from-blue-500/20 to-cyan-500/20"
        if (score >= 4) return "from-yellow-500/20 to-orange-500/20"
        return "from-red-500/20 to-pink-500/20"
    }

    return (
        <Link href={`/reports/${id}`}>
            <div className="group relative overflow-hidden rounded-2xl border border-white/10 bg-white/5 p-6 backdrop-blur-sm transition-all hover:border-white/20 hover:bg-white/10">
                <div
                    className={`absolute inset-0 bg-gradient-to-br ${getScoreGradient(score)} opacity-0 transition-opacity group-hover:opacity-100`}
                />

                <div className="relative flex items-center gap-4">
                    {thumbnail ? (
                        <div className="relative h-16 w-16 shrink-0 overflow-hidden rounded-xl bg-white/10">
                            <Image
                                src={thumbnail}
                                alt="Миниатюра анализа"
                                fill
                                className="object-cover"
                                sizes="64px"
                            />
                        </div>
                    ) : (
                        <div className="flex h-16 w-16 shrink-0 items-center justify-center rounded-xl bg-white/10">
                            <span className={`text-2xl font-bold ${getScoreColor(score)}`}>
                                {score.toFixed(1)}
                            </span>
                        </div>
                    )}

                    <div className="flex-1">
                        <div className="flex items-center gap-2">
                            <span className="text-sm text-zinc-500">Оценка:</span>
                            <span className={`text-lg font-bold ${getScoreColor(score)}`}>
                                {score.toFixed(1)}/10
                            </span>
                        </div>
                        <div className="mt-1 flex items-center gap-1 text-xs text-zinc-600">
                            <Calendar className="h-3 w-3" />
                            <span>{new Date(date).toLocaleDateString("ru-RU")}</span>
                        </div>
                    </div>

                    <ArrowRight className="h-5 w-5 shrink-0 text-zinc-600 transition-all group-hover:translate-x-1 group-hover:text-white" />
                </div>
            </div>
        </Link>
    )
}