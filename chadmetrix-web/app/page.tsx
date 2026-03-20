import { Navbar } from "@/components/navbar"
import { Hero } from "@/components/hero"
import { FeatureCard } from "@/components/feature-card"
import { Pricing } from "@/components/pricing"
import { FAQ } from "@/components/faq"
import { Footer } from "@/components/footer"
import {
  Scan,
  Sparkles,
  Target,
  Layers,
  Eye,
  Ruler,
  Palette,
  Brain,
  Zap,
  Shield,
  BarChart3,
  TrendingUp,
} from "lucide-react"

const features = [
  {
    title: "Анализ линии челюсти",
    description:
      "Передовое AI определение четкости, углов и пропорций линии челюсти для оценки мужественности.",
    icon: Scan,
  },
  {
    title: "Симметрия лица",
    description:
      "Точное измерение билатеральной симметрии всех черт и ориентиров лица.",
    icon: Layers,
  },
  {
    title: "Расположение глаз",
    description:
      "Анализ межзрачкового расстояния и положения глаз относительно ширины лица.",
    icon: Eye,
  },
  {
    title: "Золотое сечение",
    description:
      "Сравнение пропорций лица с математически идеальным золотым сечением.",
    icon: Ruler,
  },
  {
    title: "Качество кожи",
    description:
      "Оценка текстуры, чистоты и общего состояния здоровья кожи.",
    icon: Palette,
  },
  {
    title: "Гармония лица",
    description:
      "Общий баланс и эстетическая协调ность всех черт лица.",
    icon: Target,
  },
]

const demoCards = [
  {
    title: "Общая оценка",
    value: "8.4",
    subtitle: "Топ 15%",
    gradient: "from-blue-500/20 to-cyan-500/20",
    iconColor: "text-blue-400",
  },
  {
    title: "Индекс симметрии",
    value: "94%",
    subtitle: "Почти идеальный баланс",
    gradient: "from-purple-500/20 to-pink-500/20",
    iconColor: "text-purple-400",
  },
  {
    title: "Оценка гармонии",
    value: "9.1",
    subtitle: "Отличные пропорции",
    gradient: "from-green-500/20 to-emerald-500/20",
    iconColor: "text-green-400",
  },
]

const testimonials = [
  {
    quote:
      "ChadMetrix дал мне понимание моих черт лица, о которых я даже не задумывался. Детальные метрики помогли лучше понять свои особенности.",
    author: "Александр М.",
    role: "Фитнес-энтузиаст",
  },
  {
    quote:
      "Точность AI анализа впечатляет. Это как иметь профессиональную оценку под рукой в любое время.",
    author: "Джордан К.",
    role: "Модель",
  },
  {
    quote:
      "Использую ChadMetrix для отслеживания прогресса ухода за кожей. Сравнения до и после невероятно полезны.",
    author: "Сэм Р.",
    role: "Энтузиаст ухода за кожей",
  },
]

export default function LandingPage() {
  return (
    <main className="min-h-screen bg-black">
      <Navbar />
      <Hero />

      <section id="features" className="bg-zinc-950 py-24">
        <div className="mx-auto max-w-6xl px-6">
          <div className="mb-16 text-center">
            <h2 className="text-4xl font-bold text-white md:text-5xl">
              17 точных{" "}
              <span className="bg-gradient-to-r from-blue-400 to-purple-400 bg-clip-text text-transparent">
                метрик
              </span>
            </h2>
            <p className="mx-auto mt-4 max-w-2xl text-zinc-400">
              Наш AI анализирует черты вашего лица по 17 научно обоснованным
              метрикам для получения полной картины.
            </p>
          </div>

          <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
            {features.map((feature) => (
              <FeatureCard key={feature.title} {...feature} />
            ))}
          </div>

          <div className="mt-12 grid gap-6 md:grid-cols-3">
            <div className="flex items-center gap-4 rounded-2xl border border-white/10 bg-white/5 p-6">
              <div className="rounded-xl bg-blue-500/20 p-3">
                <Brain className="h-6 w-6 text-blue-400" />
              </div>
              <div>
                <div className="text-2xl font-bold text-white">AI-движок</div>
                <div className="text-sm text-zinc-500">Глубокое обучение</div>
              </div>
            </div>
            <div className="flex items-center gap-4 rounded-2xl border border-white/10 bg-white/5 p-6">
              <div className="rounded-xl bg-purple-500/20 p-3">
                <Zap className="h-6 w-6 text-purple-400" />
              </div>
              <div>
                <div className="text-2xl font-bold text-white">Мгновенно</div>
                <div className="text-sm text-zinc-500">Результаты за секунды</div>
              </div>
            </div>
            <div className="flex items-center gap-4 rounded-2xl border border-white/10 bg-white/5 p-6">
              <div className="rounded-xl bg-green-500/20 p-3">
                <Shield className="h-6 w-6 text-green-400" />
              </div>
              <div>
                <div className="text-2xl font-bold text-white">Приватно</div>
                <div className="text-sm text-zinc-500">Сквозное шифрование</div>
              </div>
            </div>
          </div>
        </div>
      </section>

      <section className="bg-black py-24">
        <div className="mx-auto max-w-6xl px-6">
          <div className="mb-16 text-center">
            <h2 className="text-4xl font-bold text-white md:text-5xl">
              Посмотрите на свои{" "}
              <span className="bg-gradient-to-r from-blue-400 to-purple-400 bg-clip-text text-transparent">
                результаты
              </span>
            </h2>
            <p className="mx-auto mt-4 max-w-2xl text-zinc-400">
              Получите детальную информацию в красивом, понятном формате.
            </p>
          </div>

          <div className="grid gap-6 md:grid-cols-3">
            {demoCards.map((card) => (
              <div
                key={card.title}
                className={`relative overflow-hidden rounded-2xl border border-white/10 bg-gradient-to-br ${card.gradient} p-8`}
              >
                <div className="absolute inset-0 bg-black/40" />
                <div className="relative">
                  <div className="mb-2 flex items-center gap-2">
                    <BarChart3 className={`h-5 w-5 ${card.iconColor}`} />
                    <span className="text-sm text-zinc-400">{card.title}</span>
                  </div>
                  <div className="text-5xl font-bold text-white">{card.value}</div>
                  <div className="mt-2 flex items-center gap-1 text-sm text-zinc-400">
                    <TrendingUp className="h-4 w-4 text-green-400" />
                    {card.subtitle}
                  </div>
                </div>
              </div>
            ))}
          </div>

          <div className="mt-8 overflow-hidden rounded-2xl border border-white/10 bg-white/5 p-8">
            <div className="mb-6 flex items-center justify-between">
              <h3 className="text-lg font-semibold text-white">
                Детальная разбивка метрик
              </h3>
              <Sparkles className="h-5 w-5 text-blue-400" />
            </div>
            <div className="space-y-4">
              {[
                { name: "Линия челюсти", score: 85 },
                { name: "Симметрия лица", score: 94 },
                { name: "Пропорции глаз", score: 78 },
                { name: "Баланс носа", score: 88 },
                { name: "Соотношение губ", score: 82 },
              ].map((metric) => (
                <div key={metric.name}>
                  <div className="mb-2 flex items-center justify-between">
                    <span className="text-sm text-zinc-400">{metric.name}</span>
                    <span className="text-sm font-medium text-white">
                      {metric.score}%
                    </span>
                  </div>
                  <div className="h-2 overflow-hidden rounded-full bg-white/10">
                    <div
                      className="h-full rounded-full bg-gradient-to-r from-blue-500 to-purple-500"
                      style={{ width: `${metric.score}%` }}
                    />
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      <section className="bg-zinc-950 py-24">
        <div className="mx-auto max-w-6xl px-6">
          <div className="mb-16 text-center">
            <h2 className="text-4xl font-bold text-white md:text-5xl">
              Что говорят{" "}
              <span className="bg-gradient-to-r from-blue-400 to-purple-400 bg-clip-text text-transparent">
                пользователи
              </span>
            </h2>
          </div>

          <div className="grid gap-6 md:grid-cols-3">
            {testimonials.map((testimonial, index) => (
              <div
                key={index}
                className="rounded-2xl border border-white/10 bg-white/5 p-8"
              >
                <p className="mb-6 text-zinc-300 leading-relaxed">
                  &ldquo;{testimonial.quote}&rdquo;
                </p>
                <div>
                  <div className="font-semibold text-white">
                    {testimonial.author}
                  </div>
                  <div className="text-sm text-zinc-500">{testimonial.role}</div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      <Pricing />
      <FAQ />
      <Footer />
    </main>
  )
}