// components/SEO.tsx
"use client";

import { useEffect } from "react";
import { usePathname } from "next/navigation";

interface SEOProps {
    title?: string;
    description?: string;
    // keywords и другие параметры оставлены для будущего использования
    // но пока закомментированы, чтобы избежать ошибок
}

export function SEO({ title, description }: SEOProps) {
    const pathname = usePathname();
    const baseUrl = "https://chadmetrix.ru";
    const fullUrl = `${baseUrl}${pathname}`;

    useEffect(() => {
        // Обновляем заголовок страницы
        if (title) {
            document.title = `${title} | chadmetrix`;
        }

        // Обновляем meta description
        if (description) {
            let metaDescription = document.querySelector('meta[name="description"]');
            if (!metaDescription) {
                metaDescription = document.createElement('meta');
                metaDescription.setAttribute('name', 'description');
                document.head.appendChild(metaDescription);
            }
            metaDescription.setAttribute("content", description);
        }

        // Обновляем OG теги
        let ogTitle = document.querySelector('meta[property="og:title"]');
        if (!ogTitle) {
            ogTitle = document.createElement('meta');
            ogTitle.setAttribute('property', 'og:title');
            document.head.appendChild(ogTitle);
        }
        if (title) ogTitle.setAttribute("content", title);

        let ogDescription = document.querySelector('meta[property="og:description"]');
        if (!ogDescription) {
            ogDescription = document.createElement('meta');
            ogDescription.setAttribute('property', 'og:description');
            document.head.appendChild(ogDescription);
        }
        if (description) ogDescription.setAttribute("content", description);

        let ogUrl = document.querySelector('meta[property="og:url"]');
        if (!ogUrl) {
            ogUrl = document.createElement('meta');
            ogUrl.setAttribute('property', 'og:url');
            document.head.appendChild(ogUrl);
        }
        ogUrl.setAttribute("content", fullUrl);
    }, [title, description, fullUrl]);

    return null;
}