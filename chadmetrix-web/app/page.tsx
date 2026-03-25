import { Hero } from "@/components/hero";
import { FeatureCard } from "@/components/feature-card";
import { Pricing } from "@/components/pricing";
import { FAQ } from "@/components/faq";
import { Scan, History, GitCompare, Gift, Bell, Target } from "lucide-react";

const features = [
  {
    icon: Target,
    title: "17 метрик качества",
    description: "От симметрии до золотого сечения — полный разбор вашей внешности по научным параметрам",
    metric: "Точность",
    value: "94%"
  },
  {
    icon: Scan,
    title: "Два ракурса",
    description: "Загрузка фото в анфас и профиль для максимально точного анализа пропорций",
    metric: "Формат",
    value: "2 фото"
  },
  {
    icon: History,
    title: "История прогресса",
    description: "Все ваши анализы сохраняются. Следите за динамикой улучшений по каждой метрике",
    metric: "Хранение",
    value: "∞"
  },
  {
    icon: GitCompare,
    title: "Сравнение до/после",
    description: "Визуальное сравнение двух отчётов с графиками изменений по 17 параметрам",
    metric: "Доступно",
    value: "В подписке"
  },
  {
    icon: Gift,
    title: "Реферальная система",
    description: "Пригласите друга — получите бесплатный анализ. Друг получит скидку 20% на первый заказ",
    metric: "Бонус",
    value: "+1 анализ"
  },
  {
    icon: Bell,
    title: "Push-напоминания",
    description: "Уведомления на 14-й и 30-й день роадмапа, чтобы не сбиться с плана улучшений",
    metric: "Контроль",
    value: "24/7"
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
              Почему chadmetrix
            </h2>
            <p className="text-gray-400 max-w-2xl mx-auto">
              Не просто оценка, а полноценная система для тех, кто работает над собой.
              Сравнивайте прогресс, получайте бонусы, следуйте роадмапу.
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