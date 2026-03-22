// app/page.tsx
import { Hero } from "@/components/hero";
import { FeatureCard } from "@/components/feature-card";
import { Pricing } from "@/components/pricing";
import { FAQ } from "@/components/faq";
import { Scan, Sparkles, Shield, Zap, Target, Brain } from "lucide-react";

const features = [
  {
    icon: Brain,
    title: "Нейросетевой анализ",
    description: "Используем state-of-the-art модели компьютерного зрения для точного распознавания черт лица",
    metric: "Точность",
    value: "94%"
  },
  {
    icon: Target,
    title: "17 метрик качества",
    description: "От симметрии до золотого сечения — полный разбор вашей внешности по научным параметрам",
    metric: "Параметров",
    value: "17"
  },
  {
    icon: Zap,
    title: "Мгновенный результат",
    description: "Получите детальный отчёт за считанные секунды без ожидания",
    metric: "Время",
    value: "<3с"
  },
  {
    icon: Shield,
    title: "Приватность",
    description: "Все фотографии шифруются и хранятся безопасно. Удаляйте данные в любой момент",
    metric: "Защита",
    value: "AES-256"
  },
  {
    icon: Sparkles,
    title: "Персональные советы",
    description: "AI генерирует индивидуальные рекомендации по стилю, уходу и макияжу",
    metric: "Уникальность",
    value: "100%"
  },
  {
    icon: Scan,
    title: "Сравнение с идеалом",
    description: "Узнайте, насколько ваши пропорции близки к классическим канонам красоты",
    metric: "База",
    value: "10M+"
  }
];

export default function Home() {
  return (
    <div className="relative">
      <Hero />

      <section className="py-24 relative">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-3xl md:text-5xl font-bold text-gradient mb-4">
              Почему выбирают ChadMetrix
            </h2>
            <p className="text-gray-400 max-w-2xl mx-auto">
              Сочетаем передовые технологии искусственного интеллекта с научным подходом к анализу внешности
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {features.map((feature, index) => (
              <FeatureCard key={index} {...feature} />
            ))}
          </div>
        </div>
      </section>

      <Pricing />
      <FAQ />
    </div>
  );
}