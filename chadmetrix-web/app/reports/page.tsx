// app/reports/page.tsx
"use client";

import { ReportCard } from "@/components/report-card";
import { Filter, Search } from "lucide-react";

const mockReports = [
    { id: "1", score: 8.4, date: new Date() },
    { id: "2", score: 7.2, date: new Date(Date.now() - 86400000) },
    { id: "3", score: 9.1, date: new Date(Date.now() - 172800000) },
    { id: "4", score: 6.8, date: new Date(Date.now() - 259200000) },
    { id: "5", score: 8.9, date: new Date(Date.now() - 345600000) },
    { id: "6", score: 7.5, date: new Date(Date.now() - 432000000) },
];

export default function ReportsPage() {
    return (
        <div className="min-h-screen pt-24 pb-12 px-4 sm:px-6 lg:px-8">
            <div className="max-w-7xl mx-auto">
                <div className="flex flex-col md:flex-row md:items-center md:justify-between mb-8">
                    <div>
                        <h1 className="text-3xl font-bold text-white mb-2">Мои отчёты</h1>
                        <p className="text-gray-400">История всех проведённых анализов</p>
                    </div>

                    <div className="mt-4 md:mt-0 flex space-x-3">
                        <div className="relative">
                            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-500" />
                            <input
                                type="text"
                                placeholder="Поиск отчётов..."
                                className="pl-10 pr-4 py-2 bg-white/5 border border-white/10 rounded-lg text-white placeholder-gray-500 focus:outline-none focus:border-blue-500"
                            />
                        </div>
                        <button className="p-2 glass rounded-lg border border-white/10 hover:bg-white/10">
                            <Filter className="w-5 h-5 text-gray-400" />
                        </button>
                    </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {mockReports.map((report) => (
                        <ReportCard key={report.id} {...report} />
                    ))}
                </div>
            </div>
        </div>
    );
}