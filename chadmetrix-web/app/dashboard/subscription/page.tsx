// app/dashboard/subscription/page.tsx
"use client";

import { useEffect, useState, Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { useAuth } from "@/lib/hooks/useAuth";
import { Button } from "@/components/ui/button";
import { CreditCard, Trash2, Check, X, AlertCircle, Loader2, Crown, Zap, Star } from "lucide-react";
import Link from "next/link";
import { getPaymentMethod, removePaymentMethod } from "@/lib/api";
import { AxiosError } from "axios";

interface PaymentMethod {
    has_payment_method: boolean;
    payment_method_id?: string;
    auto_payment_enabled: boolean;
    last4?: string;
    card_type?: string;
}

const TARIFFS = [
    {
        id: "analysis",
        name: "Разовый анализ",
        price: "199₽",
        description: "Один полный анализ внешности",
        features: ["1 анализ фото", "17 метрик оценки", "Роадмап на 30 дней"],
        icon: Zap,
        popular: false,
    },
    {
        id: "htn",
        name: "Подписка HTN",
        price: "249₽/мес",
        description: "2 анализа в месяц + история",
        features: ["2 анализа в месяц", "История с графиками", "1 сравнение до/после"],
        icon: Star,
        popular: true,
    },
    {
        id: "chad",
        name: "Подписка CHAD",
        price: "349₽/мес",
        description: "Максимум возможностей",
        features: ["Всё из HTN", "Акцент на слабые зоны", "3 сравнения"],
        icon: Crown,
        popular: false,
    },
];

function SubscriptionContent() {
    const { isAuthenticated, isLoading, user, refreshUser } = useAuth();
    const router = useRouter();
    const searchParams = useSearchParams();

    const [paymentMethod, setPaymentMethod] = useState<PaymentMethod | null>(null);
    const [loading, setLoading] = useState(true);
    const [actionLoading, setActionLoading] = useState(false);
    const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
    const [message, setMessage] = useState<{ type: 'success' | 'error', text: string } | null>(null);

    useEffect(() => {
        if (!isLoading && !isAuthenticated) {
            router.push("/login?redirect=/dashboard/subscription");
        }
    }, [isLoading, isAuthenticated, router]);

    useEffect(() => {
        if (isAuthenticated) {
            loadPaymentMethod();
        }
    }, [isAuthenticated]);

    useEffect(() => {
        const payment = searchParams.get("payment");
        const error = searchParams.get("error");

        if (payment === "success") {
            setMessage({ type: 'success', text: 'Оплата прошла успешно! Карта сохранена для автоплатежей.' });
            router.replace("/dashboard/subscription");
            refreshUser?.();
            loadPaymentMethod();
        } else if (error) {
            setMessage({ type: 'error', text: 'Произошла ошибка при обработке платежа' });
            router.replace("/dashboard/subscription");
        }
    }, [searchParams, router, refreshUser]);

    const loadPaymentMethod = async () => {
        try {
            setLoading(true);
            const data = await getPaymentMethod();
            setPaymentMethod(data);
        } catch (error) {
            console.error("Failed to load payment method:", error);
            setMessage({ type: 'error', text: 'Не удалось загрузить данные о карте' });
        } finally {
            setLoading(false);
        }
    };

    const handleDeleteCard = async () => {
        try {
            setActionLoading(true);
            await removePaymentMethod();
            setPaymentMethod({
                has_payment_method: false,
                auto_payment_enabled: false
            });
            setShowDeleteConfirm(false);
            setMessage({ type: 'success', text: 'Карта отвязана, автоплатежи отключены' });
            refreshUser?.();
        } catch (error) {
            const axiosError = error as AxiosError<{ detail?: string }>;
            console.error("Failed to delete card:", error);
            setMessage({
                type: 'error',
                text: axiosError.response?.data?.detail || 'Не удалось отвязать карту'
            });
        } finally {
            setActionLoading(false);
        }
    };

    const getTariffName = (type: string | undefined) => {
        const names: Record<string, string> = {
            'free': 'Бесплатный',
            'analysis': 'Разовый анализ',
            'htn': 'Подписка HTN',
            'chad': 'Подписка CHAD'
        };
        return names[type || 'free'] || type || "Бесплатный";
    };

    const formatDate = (dateStr: string | undefined) => {
        if (!dateStr) return "—";
        return new Date(dateStr).toLocaleDateString('ru-RU');
    };

    const currentTariff = user?.tariff_type || 'free';
    const isFree = currentTariff === 'free';

    if (isLoading || !isAuthenticated) {
        return (
            <div className="min-h-screen flex items-center justify-center">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-white"></div>
            </div>
        );
    }

    return (
        <div className="min-h-screen pt-24 pb-12 px-4">
            <div className="max-w-4xl mx-auto">
                <div className="mb-6">
                    <Link href="/dashboard">
                        <Button variant="ghost" className="text-gray-400 hover:text-white pl-0">
                            ← Вернуться в кабинет
                        </Button>
                    </Link>
                </div>

                {message && (
                    <div className={`mb-6 p-4 rounded-xl border ${message.type === 'success'
                        ? 'bg-green-500/10 border-green-500/20 text-green-400'
                        : 'bg-red-500/10 border-red-500/20 text-red-400'
                        }`}>
                        <div className="flex items-center gap-2">
                            {message.type === 'success' ? <Check className="w-5 h-5" /> : <AlertCircle className="w-5 h-5" />}
                            {message.text}
                        </div>
                    </div>
                )}

                {/* БЛОК ТАРИФОВ */}

                {isFree && (
                    <div className="glass rounded-3xl p-8 border border-white/10 mb-6">
                        <div className="text-center mb-8">
                            <h2 className="text-2xl font-bold text-white mb-2">
                                Выберите тариф
                            </h2>
                            <p className="text-gray-400">
                                У вас бесплатный тариф. Приобретите подписку для доступа к анализам.
                            </p>
                        </div>

                        <div className="grid md:grid-cols-3 gap-4">
                            {TARIFFS.map((tariff) => {
                                const Icon = tariff.icon;
                                return (
                                    <div
                                        key={tariff.id}
                                        className={`relative rounded-2xl p-6 border transition-all ${tariff.popular
                                            ? 'bg-white/10 border-white/30'
                                            : 'bg-white/5 border-white/10 hover:bg-white/10'
                                            }`}
                                    >
                                        {tariff.popular && (
                                            <div className="absolute -top-3 left-1/2 -translate-x-1/2">
                                                <span className="bg-white text-black text-xs font-bold px-3 py-1 rounded-full">
                                                    Популярный
                                                </span>
                                            </div>
                                        )}

                                        <div className="flex items-center gap-3 mb-4">
                                            <div className={`p-2 rounded-lg ${tariff.popular ? 'bg-white/20' : 'bg-white/10'
                                                }`}>
                                                <Icon className="w-5 h-5 text-white" />
                                            </div>
                                            <div>
                                                <h3 className="font-semibold text-white">{tariff.name}</h3>
                                                <p className="text-xl font-bold text-white">{tariff.price}</p>
                                            </div>
                                        </div>

                                        <p className="text-gray-400 text-sm mb-4">{tariff.description}</p>

                                        <ul className="space-y-2 mb-6">
                                            {tariff.features.map((feature, idx) => (
                                                <li key={idx} className="flex items-center gap-2 text-sm text-gray-300">
                                                    <Check className="w-4 h-4 text-gray-500" />
                                                    {feature}
                                                </li>
                                            ))}
                                        </ul>

                                        <Link href={`/?tariff=${tariff.id}`}>
                                            <Button
                                                className={`w-full ${tariff.popular
                                                    ? 'bg-white text-black hover:bg-gray-200'
                                                    : 'bg-white/10 text-white hover:bg-white/20 border border-white/20'
                                                    }`}
                                            >
                                                Выбрать
                                            </Button>
                                        </Link>
                                    </div>
                                );
                            })}
                        </div>

                        <div className="mt-6 text-center">
                            <Link href="/#pricing">
                                <Button variant="ghost" className="text-gray-400 hover:text-white">
                                    Подробнее о тарифах →
                                </Button>
                            </Link>
                        </div>
                    </div>
                )}

                {/* ТЕКУЩАЯ ПОДПИСКА (если не free) */}

                {!isFree && (
                    <div className="glass rounded-3xl p-8 border border-white/10 mb-6">
                        <div className="flex items-center justify-between mb-6">
                            <div>
                                <h2 className="text-2xl font-bold text-white">
                                    Ваша подписка
                                </h2>
                                <p className="text-gray-400">
                                    {getTariffName(currentTariff)} • Активна до {formatDate(user?.tariff_expire)}
                                </p>
                            </div>
                            <div className="p-3 bg-white/10 rounded-xl">
                                <Crown className="w-6 h-6 text-white" />
                            </div>
                        </div>

                        <div className="flex gap-3">
                            <Link href="/#pricing">
                                <Button variant="outline" className="border-white/20 text-white hover:bg-white/10">
                                    Изменить тариф
                                </Button>
                            </Link>
                        </div>
                    </div>
                )}

                {/* СПОСОБ ОПЛАТЫ */}

                <div className="glass rounded-3xl p-8 border border-white/10 mb-6">
                    <h2 className="text-xl font-semibold text-white mb-4 flex items-center gap-2">
                        <CreditCard className="w-5 h-5" />
                        Способ оплаты
                    </h2>

                    {loading ? (
                        <div className="flex items-center justify-center p-8 rounded-xl bg-white/5 border border-white/10">
                            <Loader2 className="w-6 h-6 text-gray-400 animate-spin" />
                        </div>
                    ) : !paymentMethod?.has_payment_method ? (
                        <div className="p-6 rounded-xl bg-white/5 border border-white/10">
                            <p className="text-gray-400">
                                Карта будет автоматически сохранена при оплате подписки.
                                Вы сможете управлять ей здесь после покупки.
                            </p>
                        </div>
                    ) : (
                        <div className="space-y-3">
                            <div className="flex items-center justify-between p-4 rounded-xl bg-white/5 border border-white/10 hover:bg-white/10 transition-colors">
                                <div className="flex items-center gap-4">
                                    <div className="w-12 h-8 bg-linear-to-r from-gray-700 to-gray-600 rounded flex items-center justify-center text-xs font-bold text-white shadow-lg">
                                        {paymentMethod.card_type || "CARD"}
                                    </div>
                                    <div>
                                        <p className="text-white font-medium">
                                            •••• {paymentMethod.last4 || "****"}
                                        </p>
                                        <p className="text-gray-500 text-sm">
                                            {paymentMethod.auto_payment_enabled
                                                ? "Автоплатежи включены"
                                                : "Автоплатежи отключены"
                                            }
                                        </p>
                                    </div>
                                </div>

                                {showDeleteConfirm ? (
                                    <div className="flex items-center gap-3">
                                        <span className="text-gray-400 text-sm">Удалить карту?</span>
                                        <Button
                                            size="sm"
                                            onClick={handleDeleteCard}
                                            disabled={actionLoading}
                                            className="bg-red-500 hover:bg-red-600 text-white"
                                        >
                                            {actionLoading ? (
                                                <Loader2 className="w-4 h-4 animate-spin" />
                                            ) : (
                                                <Check className="w-4 h-4" />
                                            )}
                                        </Button>
                                        <Button
                                            size="sm"
                                            variant="outline"
                                            onClick={() => setShowDeleteConfirm(false)}
                                            disabled={actionLoading}
                                            className="border-gray-600"
                                        >
                                            <X className="w-4 h-4" />
                                        </Button>
                                    </div>
                                ) : (
                                    <Button
                                        size="sm"
                                        variant="outline"
                                        onClick={() => setShowDeleteConfirm(true)}
                                        className="border-red-500/50 text-red-400 hover:bg-red-500/10 hover:text-red-300"
                                    >
                                        <Trash2 className="w-4 h-4 mr-2" />
                                        Удалить карту
                                    </Button>
                                )}
                            </div>

                            {paymentMethod.auto_payment_enabled && (
                                <div className="p-3 rounded-lg bg-green-500/10 border border-green-500/20">
                                    <p className="text-green-400 text-sm flex items-center gap-2">
                                        <Check className="w-4 h-4" />
                                        Автопродление подписки активно
                                    </p>
                                </div>
                            )}
                        </div>
                    )}
                </div>

                {/* ИНФО БЛОК */}

                <div className="p-4 rounded-xl bg-white/5 border border-white/10">
                    <p className="text-gray-400 text-sm leading-relaxed">
                        <strong className="text-white">Как работают автоплатежи:</strong><br />
                        При оплате подписки ваша карта автоматически сохраняется для будущих платежей.
                        Вы можете отвязать карту в любой момент — автоплатежи будут отключены немедленно.
                    </p>
                </div>
            </div>
        </div>
    );
}

export default function SubscriptionPage() {
    return (
        <Suspense fallback={
            <div className="min-h-screen flex items-center justify-center">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-white"></div>
            </div>
        }>
            <SubscriptionContent />
        </Suspense>
    );
}