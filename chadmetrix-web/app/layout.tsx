// app/layout.tsx
import type { Metadata, Viewport } from "next";
import { Onest } from "next/font/google";
import "./globals.css";
import { Navbar } from "@/components/navbar";
import { Footer } from "@/components/footer";

const onest = Onest({
  subsets: ["latin", "cyrillic"],
  variable: "--font-onest",
  display: "swap",
  weight: ["400", "500", "600", "700"],
});

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  maximumScale: 5,
  themeColor: "#000000",
};

export const metadata: Metadata = {
  metadataBase: new URL("https://chadmetrix.ru"),
  title: {
    default: "chadmetrix — AI-анализ внешности | Объективная оценка 17 метрик",
    template: "%s | chadmetrix",
  },
  description: "AI-анализ внешности по 17 метрикам. Получите объективную оценку, персональный роадмап улучшений на 30 дней и отслеживайте прогресс. Разовый анализ от 199₽.",
  keywords: [
    "анализ внешности",
    "AI анализ лица",
    "оценка внешности",
    "луксмаксинг",
    "looksmaxing",
    "улучшение внешности",
    "роадмап улучшений",
    "оценка лица",
    "нейросеть оценка внешности",
    "chadmetrix",
  ],
  authors: [{ name: "chadmetrix", url: "https://chadmetrix.ru" }],
  creator: "chadmetrix",
  publisher: "chadmetrix",
  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
      "max-video-preview": -1,
      "max-image-preview": "large",
      "max-snippet": -1,
    },
  },
  openGraph: {
    title: "chadmetrix — AI-анализ внешности",
    description: "Объективная оценка внешности по 17 метрикам. Роадмап улучшений на 30 дней. Начните свой путь к лучшей версии себя.",
    url: "https://chadmetrix.ru",
    siteName: "chadmetrix",
    images: [
      {
        url: "/og-image.jpg",
        width: 1200,
        height: 630,
        alt: "chadmetrix — AI-анализ внешности",
      },
    ],
    locale: "ru_RU",
    type: "website",
  },
  twitter: {
    card: "summary_large_image",
    title: "chadmetrix — AI-анализ внешности",
    description: "Объективная оценка внешности по 17 метрикам. Роадмап улучшений на 30 дней.",
    images: ["/og-image.jpg"],
    creator: "@chadmetrix",
  },
  icons: {
    icon: "/favicon.ico",
    apple: "/apple-touch-icon.png",
  },
  manifest: "/site.webmanifest",
  alternates: {
    canonical: "https://chadmetrix.ru",
  },
  category: "technology",
};

export default function RootLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="ru" className="dark">
      <head>
        <link rel="sitemap" href="/sitemap.xml" type="application/xml" />
        <link rel="alternate" type="application/rss+xml" title="chadmetrix" href="/blog/rss.xml" />
        <meta name="yandex-verification" content="ваш-код-верификации" />
        <meta name="google-site-verification" content="ваш-код-верификации" />
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{
            __html: JSON.stringify({
              "@context": "https://schema.org",
              "@type": "WebSite",
              "name": "chadmetrix",
              "url": "https://chadmetrix.ru",
              "description": "AI-анализ внешности по 17 метрикам. Объективная оценка и персональный роадмап улучшений.",
              "potentialAction": {
                "@type": "SearchAction",
                "target": "https://chadmetrix.ru/search?q={search_term_string}",
                "query-input": "required name=search_term_string"
              }
            })
          }}
        />
      </head>
      <body className={`${onest.className} antialiased`}>
        <div className="relative min-h-screen flex flex-col">
          <div className="fixed inset-0 bg-[url('/grid.svg')] bg-center mask-[linear-gradient(180deg,white,rgba(255,255,255,0))] pointer-events-none opacity-20" />
          <Navbar />
          <main className="flex-1 relative z-10">
            {children}
          </main>
          <Footer />
        </div>
      </body>
    </html>
  );
}