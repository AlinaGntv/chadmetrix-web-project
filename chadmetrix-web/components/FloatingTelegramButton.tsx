"use client";

import { useState, useEffect } from "react";
import { Send, ChevronRight, Gift, Zap, Bell, X } from "lucide-react";

export function FloatingTelegramButton() {
    const [isExpanded, setIsExpanded] = useState(false);
    const [isVisible, setIsVisible] = useState(true);

    useEffect(() => {
        const dismissed = localStorage.getItem("telegram_button_dismissed");
        if (dismissed === "true") {
            setIsVisible(false);
        }
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, []);

    const handleDismiss = () => {
        setIsVisible(false);
        localStorage.setItem("telegram_button_dismissed", "true");
    };

    if (!isVisible) return null;

    return (
        <div className="fixed bottom-6 right-6 z-50">
            {isExpanded && (
                <div className="absolute bottom-16 right-0 mb-2 w-80 animate-fade-in">
                    <div className="glass rounded-xl border border-white/10 shadow-xl relative overflow-hidden">
                        <div className="flex items-center justify-between p-4 border-b border-white/10">
                            <div className="flex items-center gap-3">
                                <div className="w-10 h-10 rounded-full bg-white/10 flex items-center justify-center">
                                    <Send className="w-5 h-5 text-white" />
                                </div>
                                <div>
                                    <p className="text-white font-medium text-sm">Telegram-канал</p>
                                    <p className="text-gray-500 text-xs">chadmetrix</p>
                                </div>
                            </div>
                            <button
                                onClick={handleDismiss}
                                className="p-1 rounded-lg hover:bg-white/10 transition-colors"
                                aria-label="Закрыть"
                            >
                                <X className="w-4 h-4 text-gray-500" />
                            </button>
                        </div>

                        <div className="p-4">
                            <p className="text-gray-400 text-sm mb-3">
                                В Telegram-канале публикуем:
                            </p>
                            <ul className="space-y-2 mb-4">
                                <li className="flex items-center gap-2 text-sm text-gray-300">
                                    <Gift className="w-4 h-4 text-white/60" />
                                    Промокоды на скидку
                                </li>
                                <li className="flex items-center gap-2 text-sm text-gray-300">
                                    <Zap className="w-4 h-4 text-white/60" />
                                    Анонсы новых функций
                                </li>
                                <li className="flex items-center gap-2 text-sm text-gray-300">
                                    <Bell className="w-4 h-4 text-white/60" />
                                    Советы по луксмаксингу
                                </li>
                            </ul>

                            <a
                                href="https://t.me/chadmetrix"
                                target="_blank"
                                rel="noopener noreferrer"
                                className="block w-full py-2.5 bg-white/10 hover:bg-white/15 border border-white/20 rounded-lg text-white text-sm text-center font-medium transition-all"
                                onClick={() => setIsExpanded(false)}
                            >
                                Подписаться →
                            </a>

                            <button
                                onClick={() => setIsExpanded(false)}
                                className="w-full mt-2 text-xs text-gray-500 hover:text-gray-400 transition-colors"
                            >
                                Закрыть
                            </button>
                        </div>
                    </div>
                </div>
            )}

            <button
                onClick={() => setIsExpanded(!isExpanded)}
                className="group relative w-14 h-14 rounded-full bg-white/10 backdrop-blur-sm border border-white/20 shadow-lg flex items-center justify-center hover:bg-white/20 transition-all duration-300 hover:scale-105"
                aria-label="Telegram канал"
            >
                {isExpanded ? (
                    <ChevronRight className="w-6 h-6 text-gray-400 group-hover:text-white transition-colors" />
                ) : (
                    <Send className="w-6 h-6 text-gray-400 group-hover:text-white transition-colors" />
                )}
            </button>
        </div>
    );
}