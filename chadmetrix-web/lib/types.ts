// lib/types.ts
export interface AnalysisResponse {
    id: string;
    report?: {
        overall_score?: number;
    } | null;
    created_at?: string;
    // добавьте другие поля при необходимости
}

export interface FormattedReport {
    id: string;
    score: number;
    date: string;
}