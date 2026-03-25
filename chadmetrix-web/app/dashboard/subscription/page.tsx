// app/dashboard/subscription/page.tsx
"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/lib/hooks/useAuth";
import { Button } from "@/components/ui/button";
import { CreditCard, Trash2, Check, X, AlertCircle } from "lucide-react";
import Link from "next/link";

interface SavedCard {
    id: string;
    type: string;
    last4: string;
    expiry_month: string;
    expiry_year: string;
}

// Расширенный тип User с tariff_expire
interface ExtendedUser {
    id: string;
    email: string;
    full_name: string;
    avatar_url: string;
    tariff_type: string;
    tariff_expire?: string;
    photo_uses_remaining: number;
}

export default function SubscriptionPage() {
    const { isAuthenticated, isLoading, user } = useAuth();
    const router = useRouter();
    const [cards, setCards] = useState<SavedCard[]>([]);
    const [loading, setLoading] = useState(true);
    const [showDeleteConfirm, setShowDeleteConfirm] = useState<string | null>(null);

    useEffect(() => {
        if (!isLoading && !isAuthenticated) {
            router.push("/login?redirect=/dashboard/subscription");
        }
    }, [isLoading, isAuthenticated, router]);

    useEffect(() => {
        if (isAuthenticated) {
            loadCards();
        }
    }, [isAuthenticated]);

    const loadCards = async () => {
        try {
            // Для скриншота — демо-данные
            setCards([
                {
                    id: "pm-1234567890",
                    type: "Visa",
                    last4: "4242",
                    expiry_month: "12",
                    expiry_year: "2027"
                },
                {
                    id: "pm-0987654321",
                    type: "MasterCard",
                    last4: "8888",
                    expiry_month: "08",
                    expiry_year: "2026"
                }
            ]);
        } catch (error) {
            console.error("Failed to load cards:", error);
        } finally {
            setLoading(false);
        }
    };

    const handleDeleteCard = async (cardId: string) => {
        try {
            console.log("Deleting card:", cardId);
            setCards(cards.filter(c => c.id !== cardId));
            setShowDeleteConfirm(null);
        } catch (error) {
            console.error("Failed to delete card:", error);
        }
    };

    // Приводим user к ExtendedUser для доступа к tariff_expire
    const extendedUser = user as ExtendedUser | null;

    if (isLoading || !isAuthenticated) {
        return (
            <div className="min-h-screen flex items-center justify-center">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-white"></div>
            </div>
        );
    }

    return (
        <div className="min-h-screen pt-24 pb-12 px-4">
            <div className="max-w-2xl mx-auto">
                {/* Хлебные крошки */}
                <div className="mb-6">
                    <Link href="/dashboard">
                        <Button variant="ghost" className="text-gray-400 hover:text-white pl-0">
                            ← Вернуться в кабинет
                        </Button>
                    </Link>
                </div>

                <div className="glass rounded-3xl p-8 border border-white/10">
                    <h1 className="text-3xl font-bold text-white mb-2">
                        Управление подпиской
                    </h1>
                    <p className="text-gray-400 mb-8">
                        Управляйте сохраненными картами и настройками автоплатежей
                    </p>

                    {/* Блок сохраненных карт */}
                    <div className="mb-8">
                        <h2 className="text-xl font-semibold text-white mb-4 flex items-center gap-2">
                            <CreditCard className="w-5 h-5" />
                            Сохраненные карты
                        </h2>

                        {loading ? (
                            <div className="text-gray-400">Загрузка...</div>
                        ) : cards.length === 0 ? (
                            <div className="p-6 rounded-xl bg-white/5 border border-white/10 text-center">
                                <p className="text-gray-400">Нет сохраненных карт</p>
                            </div>
                        ) : (
                            <div className="space-y-3">
                                {cards.map((card) => (
                                    <div
                                        key={card.id}
                                        className="flex items-center justify-between p-4 rounded-xl bg-white/5 border border-white/10 hover:bg-white/10 transition-colors"
                                    >
                                        <div className="flex items-center gap-4">
                                            <div className="w-12 h-8 bg-linear-to-r from-gray-600 to-gray-500 rounded flex items-center justify-center text-xs font-bold text-white">
                                                {card.type}
                                            </div>
                                            <div>
                                                <p className="text-white font-medium">
                                                    •••• {card.last4}
                                                </p>
                                                <p className="text-gray-500 text-sm">
                                                    Истекает {card.expiry_month}/{card.expiry_year}
                                                </p>
                                            </div>
                                        </div>

                                        {/* Чек-бокс с кнопкой удаления карты */}
                                        {showDeleteConfirm === card.id ? (
                                            <div className="flex items-center gap-3">
                                                <span className="text-gray-400 text-sm">Удалить?</span>
                                                <Button
                                                    size="sm"
                                                    onClick={() => handleDeleteCard(card.id)}
                                                    className="bg-red-500 hover:bg-red-600 text-white"
                                                >
                                                    <Check className="w-4 h-4" />
                                                </Button>
                                                <Button
                                                    size="sm"
                                                    variant="outline"
                                                    onClick={() => setShowDeleteConfirm(null)}
                                                    className="border-gray-600"
                                                >
                                                    <X className="w-4 h-4" />
                                                </Button>
                                            </div>
                                        ) : (
                                            <Button
                                                size="sm"
                                                variant="outline"
                                                onClick={() => setShowDeleteConfirm(card.id)}
                                                className="border-red-500/50 text-red-400 hover:bg-red-500/10 hover:text-red-300"
                                            >
                                                <Trash2 className="w-4 h-4 mr-2" />
                                                Удалить карту
                                            </Button>
                                        )}
                                    </div>
                                ))}
                            </div>
                        )}
                    </div>

                    {/* Информация о подписке */}
                    <div className="p-6 rounded-xl bg-white/5 border border-white/10">
                        <h3 className="text-lg font-semibold text-white mb-3">
                            Текущая подписка
                        </h3>
                        <div className="space-y-2">
                            <div className="flex justify-between text-sm">
                                <span className="text-gray-400">Тариф:</span>
                                <span className="text-white">{extendedUser?.tariff_type || "Бесплатный"}</span>
                            </div>
                            <div className="flex justify-between text-sm">
                                <span className="text-gray-400">Активна до:</span>
                                <span className="text-white">
                                    {extendedUser?.tariff_expire
                                        ? new Date(extendedUser.tariff_expire).toLocaleDateString('ru-RU')
                                        : "—"}
                                </span>
                            </div>
                            <div className="flex justify-between text-sm">
                                <span className="text-gray-400">Автопродление:</span>
                                <span className="text-yellow-400 flex items-center gap-1">
                                    <AlertCircle className="w-4 h-4" />
                                    Ожидает подключения
                                </span>
                            </div>
                        </div>
                    </div>

                    {/* Примечание для ЮKassa */}
                    <div className="mt-6 p-4 rounded-xl bg-blue-500/10 border border-blue-500/20">
                        <p className="text-blue-400 text-sm">
                            <strong>Примечание:</strong> Для включения автоплатежей необходимо
                            подтвердить возможность отвязки карты. Выше показан интерфейс
                            управления сохраненными картами.
                        </p>
                    </div>
                </div>
            </div>
        </div>
    );
}