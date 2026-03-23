// components/feature-card.tsx
import { LucideIcon } from "lucide-react";

interface FeatureCardProps {
    icon: LucideIcon;
    title: string;
    description: string;
    metric?: string;
    value?: string;
}

export function FeatureCard({ icon: Icon, title, description, metric, value }: FeatureCardProps) {
    return (
        <div className="group relative glass rounded-2xl p-6 hover:bg-white/10 transition-all duration-300 hover:-translate-y-1">
            <div className="absolute inset-0 bg-linear-to-br from-white/10 to-gray-500/10 opacity-0 group-hover:opacity-100 transition-opacity rounded-2xl" />

            <div className="relative">
                <div className="w-12 h-12 rounded-xl bg-linear-to-br from-gray-800 to-gray-900 flex items-center justify-center mb-4 group-hover:scale-110 transition-transform">
                    <Icon className="w-6 h-6 text-white" />
                </div>

                <h3 className="text-lg font-semibold mb-2 text-white">{title}</h3>
                <p className="text-gray-400 text-sm leading-relaxed mb-4">{description}</p>

                {metric && value && (
                    <div className="flex items-center justify-between pt-4 border-t border-white/10">
                        <span className="text-xs text-gray-500 uppercase tracking-wider">{metric}</span>
                        <span className="text-lg font-bold text-white">{value}</span>
                    </div>
                )}
            </div>
        </div>
    );
}