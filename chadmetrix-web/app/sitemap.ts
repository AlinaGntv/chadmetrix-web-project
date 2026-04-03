// app/sitemap.ts
import { MetadataRoute } from 'next'

// Типы для данных
interface Report {
    id: string;
    created_at: string;
}

async function getReports(): Promise<Report[]> {
    // Здесь можно добавить запрос к API, если нужно динамически генерировать страницы отчётов
    // Для базовой версии возвращаем пустой массив
    return [];
}

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
    const baseUrl = 'https://chadmetrix.ru';

    // Статические страницы
    const staticPages = [
        {
            url: baseUrl,
            lastModified: new Date(),
            changeFrequency: 'weekly' as const,
            priority: 1.0,
        },
        {
            url: `${baseUrl}/reviews`,
            lastModified: new Date(),
            changeFrequency: 'daily' as const,
            priority: 0.9,
        },
        {
            url: `${baseUrl}/dashboard`,
            lastModified: new Date(),
            changeFrequency: 'weekly' as const,
            priority: 0.8,
        },
        {
            url: `${baseUrl}/reports`,
            lastModified: new Date(),
            changeFrequency: 'daily' as const,
            priority: 0.8,
        },
        {
            url: `${baseUrl}/referral`,
            lastModified: new Date(),
            changeFrequency: 'weekly' as const,
            priority: 0.7,
        },
        {
            url: `${baseUrl}/terms`,
            lastModified: new Date(),
            changeFrequency: 'monthly' as const,
            priority: 0.5,
        },
    ];

    // Динамические страницы отчётов (если нужно индексировать)
    const reports = await getReports();
    const reportPages = reports.map((report) => ({
        url: `${baseUrl}/reports/${report.id}`,
        lastModified: new Date(report.created_at),
        changeFrequency: 'never' as const,
        priority: 0.6,
    }));

    return [...staticPages, ...reportPages];
}