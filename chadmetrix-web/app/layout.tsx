import type { Metadata } from "next";
import { Onest } from "next/font/google"; // или Manrope
import "./globals.css";
import { Navbar } from "@/components/navbar";
import { Footer } from "@/components/footer";

const onest = Onest({
  subsets: ["latin", "cyrillic"],
  variable: "--font-onest",
  display: "swap",
  weight: ["400", "500", "600", "700", "800"],
});

export const metadata: Metadata = {
  title: "ChadMetrix — AI-анализ внешности",
  description: "200+ анализов. 17 метрик, роадмап на 30 дней и сравнение прогресса. Разовый анализ от 199₽.",
};

export default function RootLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="ru" className="dark">
      <body className={`${onest.variable} font-sans antialiased`}>
        <div className="relative min-h-screen flex flex-col">
          <div className="fixed inset-0 bg-[url('/grid.svg')] bg-center [mask-image:linear-gradient(180deg,white,rgba(255,255,255,0))] pointer-events-none opacity-20" />
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