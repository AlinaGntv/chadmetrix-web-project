// app/dashboard/subscription/page.tsx
"use client";

import { useEffect, useState, Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { useAuth } from "@/lib/hooks/useAuth";
import { Button } from "@/components/ui/button";
import { CreditCard, Trash2, Check, X, AlertCircle, Loader2, Plus } from "lucide-react";
import Link from "next/link";
import { api } from "@/lib/api";
import { AxiosError } from "axios";

interface PaymentMethod {
    has_payment_method: boolean;
    payment_method_id?: string;
    auto_payment_enabled: boolean;
    last4?: string;
    card_type?: string;
    expiry_month?: string;
    expiry_year?: string;
}

// Расширенный тип User 
interface ExtendedUser {
    id: string;
    email: string;
    full_name: string;
    avatar_url: string;
    tariff_type: string;
    tariff_expire?: string;
    photo_uses_remaining: number;
    payment_method_id?: string;
    auto_payment_enabled?: boolean;
}

// Компонент для работы с query params (оборачиваем в Suspense)
function SubscriptionContent() {
    const { isAuthenticated, isLoading, user, refreshUser } = useAuth();
    const router = useRouter();
    const searchParams = useSearchParams();

    const [paymentMethod, setPaymentMethod] = useState<PaymentMethod | null>(null);
    const [loading, setLoading] = useState(true);
    const [actionLoading, setActionLoading] = useState(false);
    const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
    const [message, setMessage] = useState<{ type: 'success' | 'error', text: string } | null>(null);

    // Приводим user к ExtendedUser
    const extendedUser = user as ExtendedUser | null;

    // Проверяем query params при загрузке (возврат с ЮKassa)
    useEffect(() => {
        const bind = searchParams.get("bind");
        const payment = searchParams.get("payment");
        const error = searchParams.get("error");

        if (bind === "success") {
            setMessage({ type: 'success', text: 'Карта успешно привязана!' });
            router.replace("/dashboard/subscription");
            refreshUser?.();
        } else if (payment === "success") {
            setMessage({ type: 'success', text: 'Оплата прошла успешно! Карта сохранена для автоплатежей.' });
            router.replace("/dashboard/subscription");
            refreshUser?.();
        } else if (error) {
            setMessage({ type: 'error', text: 'Произошла ошибка при обработке платежа' });
            router.replace("/dashboard/subscription");
        }
    }, [searchParams, router, refreshUser]);

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

    const loadPaymentMethod = async () => {
        try {
            setLoading(true);
            const response = await api.get("/api/payments/payment-method");
            setPaymentMethod(response.data);
        } catch (error) {
            console.error("Failed to load payment method:", error);
            setMessage({ type: 'error', text: 'Не удалось загрузить данные о карте' });
        } finally {
            setLoading(false);
        }
    };

    const handleBindCard = async () => {
        try {
            setActionLoading(true);
            const response = await api.post("/api/payments/bind-card");
            if (response.data.confirmation_url) {
                window.location.href = response.data.confirmation_url;
            }
        } catch (error) {
            const axiosError = error as AxiosError<{ detail?: string }>;
            console.error("Failed to bind card:", error);
            setMessage({
                type: 'error',
                text: axiosError.response?.data?.detail || 'Не удалось начать привязку карты'
            });
            setActionLoading(false);
        }
    };

    const handleDeleteCard = async () => {
        try {
            setActionLoading(true);
            await api.delete("/api/payments/payment-method");
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

                {/* Уведомления */}
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
                            Способ оплаты
                        </h2>

                        {loading ? (
                            <div className="flex items-center justify-center p-8 rounded-xl bg-white/5 border border-white/10">
                                <Loader2 className="w-6 h-6 text-gray-400 animate-spin" />
                            </div>
                        ) : !paymentMethod?.has_payment_method ? (
                            <div className="p-6 rounded-xl bg-white/5 border border-white/10">
                                <p className="text-gray-400 mb-4">
                                    Привяжите банковскую карту для автоматического продления подписки
                                </p>
                                <Button
                                    onClick={handleBindCard}
                                    disabled={actionLoading}
                                    className="bg-blue-600 hover:bg-blue-700 text-white"
                                >
                                    {actionLoading ? (
                                        <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                                    ) : (
                                        <Plus className="w-4 h-4 mr-2" />
                                    )}
                                    Привязать карту
                                </Button>
                            </div>
                        ) : (
                            <div className="space-y-3">
                                <div className="flex items-center justify-between p-4 rounded-xl bg-white/5 border border-white/10 hover:bg-white/10 transition-colors">
                                    <div className="flex items-center gap-4">
                                        <div className="w-12 h-8 bg-linear-to-r from-blue-600 to-blue-500 rounded flex items-center justify-center text-xs font-bold text-white shadow-lg">
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

                                    {/* Чек-бокс с кнопкой удаления карты */}
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

                                {/* Информация о статусе */}
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

                    {/* Информация о подписке */}
                    <div className="p-6 rounded-xl bg-white/5 border border-white/10 mb-6">
                        <h3 className="text-lg font-semibold text-white mb-3">
                            Текущая подписка
                        </h3>
                        <div className="space-y-3">
                            <div className="flex justify-between text-sm items-center">
                                <span className="text-gray-400">Тариф:</span>
                                <span className="text-white font-medium">
                                    {getTariffName(extendedUser?.tariff_type)}
                                </span>
                            </div>
                            <div className="flex justify-between text-sm items-center">
                                <span className="text-gray-400">Активна до:</span>
                                <span className="text-white font-medium">
                                    {formatDate(extendedUser?.tariff_expire)}
                                </span>
                            </div>
                            <div className="flex justify-between text-sm items-center">
                                <span className="text-gray-400">Автопродление:</span>
                                <span className={`flex items-center gap-1 ${paymentMethod?.auto_payment_enabled
                                    ? 'text-green-400'
                                    : 'text-yellow-400'
                                    }`}>
                                    <AlertCircle className="w-4 h-4" />
                                    {paymentMethod?.auto_payment_enabled
                                        ? "Подключено"
                                        : "Требуется привязка карты"
                                    }
                                </span>
                            </div>
                            <div className="flex justify-between text-sm items-center">
                                <span className="text-gray-400">Осталось анализов:</span>
                                <span className="text-white font-medium">
                                    {extendedUser?.photo_uses_remaining || 0}
                                </span>
                            </div>
                        </div>
                    </div>

                    {/* Кнопки управления */}
                    {paymentMethod?.has_payment_method && (
                        <div className="flex gap-3">
                            <Button
                                variant="outline"
                                className="flex-1 border-gray-600 hover:bg-white/5"
                                onClick={() => router.push('/dashboard')}
                            >
                                Перейти к анализу
                            </Button>
                        </div>
                    )}

                    {/* Примечание */}
                    <div className="mt-6 p-4 rounded-xl bg-blue-500/10 border border-blue-500/20">
                        <p className="text-blue-400 text-sm leading-relaxed">
                            <strong>Как работают автоплатежи:</strong><br />
                            При привязке карты вы соглашаетесь на автоматическое списание
                            средств за продление подписки. Вы можете отвязать карту в любой момент —
                            автоплатежи будут отключены немедленно.
                        </p>
                    </div>
                </div>
            </div>
        </div>
    );
}

// Оборачиваем в Suspense из-за useSearchParams
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