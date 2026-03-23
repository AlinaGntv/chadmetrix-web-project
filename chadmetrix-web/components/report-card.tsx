// components/report-card.tsx
import Link from "next/link";
import Image from "next/image";
import { Calendar, TrendingUp, ChevronRight } from "lucide-react";
import { format } from "date-fns";
import { ru } from "date-fns/locale";

interface ReportCardProps {
    id: string;
    score: number;
    date: Date;
    thumbnail?: string;
    metricsCount?: number;
}

export function ReportCard({ id, score, date, thumbnail, metricsCount = 17 }: ReportCardProps) {
    const getScoreColor = (s: number) => {
        if (s >= 8) return "text-green-400";
        if (s >= 6) return "text-yellow-400";
        return "text-red-400";
    };

    return (
        <Link href={`/reports/${id}`}>
            <div className="group glass rounded-2xl p-6 hover:bg-white/10 transition-all duration-300 hover:-translate-y-1 border border-white/10 hover:border-white/20">
                <div className="flex items-start justify-between mb-4">
                    <div className="flex items-center space-x-3">
                        <div className="w-12 h-12 rounded-xl bg-linear-to-br from-gray-800 to-gray-900 flex items-center justify-center overflow-hidden relative">
                            {thumbnail ? (
                                <Image
                                    src={thumbnail}
                                    alt=""
                                    fill
                                    className="object-cover"
                                    sizes="48px"
                                />
                            ) : (
                                <TrendingUp className="w-6 h-6 text-gray-400" />
                            )}
                        </div>
                        <div>
                            <h3 className="font-semibold text-white group-hover:text-gray-300 transition-colors">
                                Анализ #{id.slice(-4)}
                            </h3>
                            <div className="flex items-center text-sm text-gray-500">
                                <Calendar className="w-3 h-3 mr-1" />
                                {format(date, "d MMMM yyyy", { locale: ru })}
                            </div>
                        </div>
                    </div>
                    <ChevronRight className="w-5 h-5 text-gray-600 group-hover:text-white transition-colors" />
                </div>

                <div className="flex items-end justify-between">
                    <div>
                        <p className="text-sm text-gray-500 mb-1">Общий балл</p>
                        <p className={`text-3xl font-bold ${getScoreColor(score)}`}>
                            {score.toFixed(1)}
                            <span className="text-lg text-gray-600">/10</span>
                        </p>
                    </div>
                    <div className="text-right">
                        <p className="text-sm text-gray-500 mb-1">Метрик</p>
                        <p className="text-lg font-semibold text-white">{metricsCount}</p>
                    </div>
                </div>

                <div className="mt-4 h-2 bg-gray-800 rounded-full overflow-hidden">
                    <div
                        className="h-full bg-linear-to-r from-gray-400 via-gray-300 to-white transition-all duration-500"
                        style={{ width: `${score * 10}%` }}
                    />
                </div>
            </div>
        </Link>
    );
}