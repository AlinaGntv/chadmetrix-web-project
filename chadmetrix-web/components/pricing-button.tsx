// components/pricing-button.tsx
"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Loader2 } from "lucide-react";
import { useAuth } from "@/lib/hooks/useAuth";
import { createOnetimePayment, createPaymentWithBinding } from "@/lib/api";

interface PricingButtonProps {
    tariff: "analysis" | "htn" | "chad";
    variant?: "default" | "outline" | "popular";
    fullWidth?: boolean;
    showAuthModal?: () => void;
}

const TARIFF_IDS: Record<string, number> = {
    analysis: 1,
    htn: 2,
    chad: 3,
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
            alert("Тариф не найден");
            return;
        }

        setLoading(true);
        try {
            // Analysis = разовая оплата без сохранения карты
            // HTN/CHAD = с сохранением карты для автоплатежей
            const data = tariff === "analysis"
                ? await createOnetimePayment(tariffId)
                : await createPaymentWithBinding(tariffId);

            if (data.confirmation_url) {
                window.location.href = data.confirmation_url;
            }
        } catch {
            alert("Ошибка при создании платежа");
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