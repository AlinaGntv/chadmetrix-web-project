// components/pricing-button.tsx
"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Loader2 } from "lucide-react";
import { useAuth } from "@/lib/hooks/useAuth";
import { api } from "@/lib/api";
import { AxiosError } from "axios";

interface PricingButtonProps {
    tariff: "analysis" | "htn" | "chad";
    variant?: "default" | "outline" | "popular";
    fullWidth?: boolean;
    showAuthModal?: () => void;
}

// ID тарифов в БД (проверено: 1=Разовый анализ)
// Добавьте остальные когда создадите в БД!
const TARIFF_IDS: Record<string, number> = {
    analysis: 1,  // Разовый анализ - 199₽
    htn: 2,       // Создайте в БД: INSERT INTO tariffs (id, name, price, reports_count) VALUES (2, 'Подписка HTN', 249, 2);
    chad: 3       // Создайте в БД: INSERT INTO tariffs (id, name, price, reports_count) VALUES (3, 'Подписка CHAD', 349, 3);
};

const TARIFF_CONFIG = {
    analysis: {
        label: "Купить за 199₽",
        loadingLabel: "Переход к оплате...",
    },
    htn: {
        label: "Оформить подписку",
        loadingLabel: "Переход к оплате...",
    },
    chad: {
        label: "Стать CHAD",
        loadingLabel: "Переход к оплате...",
    }
};

export function PricingButton({
    tariff,
    variant = "default",
    fullWidth = true,
    showAuthModal
}: PricingButtonProps) {
    const [loading, setLoading] = useState(false);
    const { isAuthenticated } = useAuth();
    const config = TARIFF_CONFIG[tariff];

    const handlePay = async () => {
        if (!isAuthenticated) {
            showAuthModal?.();
            return;
        }

        const tariffId = TARIFF_IDS[tariff];
        if (!tariffId) {
            alert("Тариф не найден в системе");
            return;
        }

        setLoading(true);
        try {
            // Правильный эндпоинт из payments.py: /create-with-binding
            const response = await api.post(`/api/payments/create-with-binding?tariff_id=${tariffId}`);
            const { confirmation_url } = response.data;

            if (confirmation_url) {
                window.location.href = confirmation_url;
            } else {
                throw new Error("No confirmation_url in response");
            }
        } catch (error) {
            // Типизированная обработка ошибки вместо any
            const axiosError = error as AxiosError<{ detail?: string }>;
            console.error("Payment error:", error);
            const message = axiosError.response?.data?.detail || "Ошибка при создании платежа. Попробуйте позже.";
            alert(message);
        } finally {
            setLoading(false);
        }
    };

    const getButtonClass = () => {
        if (variant === "popular") {
            return "bg-white text-black hover:bg-gray-200";
        }
        return "glass border-white/20 hover:bg-white/10 text-white";
    };

    return (
        <Button
            onClick={handlePay}
            disabled={loading}
            className={`${fullWidth ? 'w-full' : ''} ${getButtonClass()}`}
        >
            {loading ? (
                <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    {config.loadingLabel}
                </>
            ) : (
                config.label
            )}
        </Button>
    );
}