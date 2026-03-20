import { LucideIcon } from "lucide-react"

interface FeatureCardProps {
    title: string
    description: string
    icon: LucideIcon
}

export function FeatureCard({ title, description, icon: Icon }: FeatureCardProps) {
    return (
        <div className="group relative overflow-hidden rounded-2xl border border-white/10 bg-white/5 p-6 backdrop-blur-sm transition-all hover:border-white/20 hover:bg-white/10">
            <div className="absolute inset-0 bg-gradient-to-br from-blue-500/10 via-transparent to-purple-500/10 opacity-0 transition-opacity group-hover:opacity-100" />

            <div className="relative">
                <div className="mb-4 inline-flex rounded-xl bg-white/10 p-3">
                    <Icon className="h-6 w-6 text-blue-400" />
                </div>

                <h3 className="mb-2 text-lg font-semibold text-white">{title}</h3>
                <p className="text-sm text-zinc-400 leading-relaxed">{description}</p>
            </div>
        </div>
    )
}