// components/pricing-button.tsx — упрощенная версия
"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Loader2 } from "lucide-react";
import { useAuth } from "@/lib/hooks/useAuth";
import { createPaymentWithBinding } from "@/lib/api"; // ← Используем функцию из api.ts

interface PricingButtonProps {
    tariff: "analysis" | "htn" | "chad";
    variant?: "default" | "outline" | "popular";
    fullWidth?: boolean;
    showAuthModal?: () => void;
}

// ID тарифов в БД (проверьте и обновите!)
const TARIFF_IDS: Record<string, number> = {
    analysis: 1,
    htn: 2,      // Создайте в БД если нет
    chad: 3,     // Создайте в БД если нет
};

const TARIFF_CONFIG = {
    analysis: { label: "Купить за 199₽", loadingLabel: "Переход к оплате..." },
    htn: { label: "Оформить подписку", loadingLabel: "Переход к оплате..." },
    chad: { label: "Стать CHAD", loadingLabel: "Переход к оплате..." },
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
            const data = await createPaymentWithBinding(tariffId);

            if (data.confirmation_url) {
                window.location.href = data.confirmation_url;
            } else {
                throw new Error("No confirmation_url in response");
            }
        } catch (error) {
            console.error("Payment error:", error);
            alert("Ошибка при создании платежа. Попробуйте позже.");
        } finally {
            setLoading(false);
        }
    };

    const getButtonClass = () => {
        if (variant === "popular") return "bg-white text-black hover:bg-gray-200";
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