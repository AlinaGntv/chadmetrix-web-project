"use client";

import { useParams } from "next/navigation";
import Link from "next/link";
import Image from "next/image";
import { ArrowLeft } from "lucide-react";
import { Button } from "@/components/ui/button";

export default function ReportDetailPage() {
    const params = useParams();

    // пока мок, потом будет из API
    const report = {
        id: params.id,
        objective: 6.4,
        potential: 7.8,
        summary:
            "Лицо находится в зоне HTN. Пропорции выше среднего, но есть слабые зоны. Потенциал высокий при правильной работе. Основные проблемы — кожа и челюсть. Общая гармония хорошая.",
        photo: "/test.jpg",
        metrics: [
            "Пропорции лица: 6.5/10 — небольшая дисгармония",
            "Симметрия: 7.2/10 — хорошая",
            "Кожа: 5.8/10 — есть дефекты",
            "Челюсть: 6.0/10 — слабая линия",
        ],
        roadmap:
            "Неделя 1: детокс, уход за кожей\nНеделя 2: мьюинг\nНеделя 3: тренировки\nНеделя 4: фиксация",
    };

    return (
        <div className="min-h-screen pt-24 pb-12 px-4">
            <div className="max-w-5xl mx-auto">

                {/* BACK */}

                <Link href="/reports">
                    <Button variant="ghost">
                        <ArrowLeft className="w-4 h-4 mr-2" />
                        Назад
                    </Button>
                </Link>

                {/* HEADER */}

                <div className="glass rounded-3xl p-8 border border-white/10 mt-6">

                    <h1 className="text-3xl font-bold text-white mb-6">
                        Отчёт #{report.id}
                    </h1>

                    <div className="grid md:grid-cols-3 gap-6">

                        {/* PHOTO */}

                        <div className="aspect-square relative rounded-xl overflow-hidden border border-white/10">
                            <Image
                                src={report.photo}
                                alt=""
                                fill
                                className="object-cover"
                            />
                        </div>

                        {/* SCORES */}

                        <div className="flex flex-col justify-center gap-4">

                            <ScoreBox
                                title="Объективная"
                                value={report.objective}
                            />

                            <ScoreBox
                                title="Потенциал"
                                value={report.potential}
                            />

                        </div>

                        {/* SUMMARY */}

                        <div>
                            <h3 className="text-white font-semibold mb-2">
                                Резюме
                            </h3>

                            <p className="text-gray-300 whitespace-pre-line">
                                {report.summary}
                            </p>
                        </div>

                    </div>

                </div>

                {/* METRICS */}

                <div className="glass rounded-3xl p-8 border border-white/10 mt-8">

                    <h2 className="text-xl font-semibold text-white mb-4">
                        Метрики
                    </h2>

                    <div className="space-y-2 text-gray-300">

                        {report.metrics.map((m, i) => (
                            <p key={i}>{m}</p>
                        ))}

                    </div>

                </div>

                {/* ROADMAP */}

                <div className="glass rounded-3xl p-8 border border-white/10 mt-8">

                    <h2 className="text-xl font-semibold text-white mb-4">
                        Роадмап
                    </h2>

                    <p className="text-gray-300 whitespace-pre-line">
                        {report.roadmap}
                    </p>

                </div>

            </div>
        </div>
    );
}



function ScoreBox({
    title,
    value,
}: {
    title: string;
    value: number;
}) {
    return (
        <div className="glass border border-white/10 rounded-xl p-4 text-center">

            <p className="text-gray-400 text-sm">
                {title}
            </p>

            <p className="text-3xl font-bold text-white">
                {value}
            </p>

        </div>
    );
}