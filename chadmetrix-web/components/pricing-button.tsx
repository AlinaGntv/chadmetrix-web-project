// components/pricing-button.tsx
"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Loader2 } from "lucide-react";
import { useAuth } from "@/lib/hooks/useAuth";
import { api } from "@/lib/api";

interface PricingButtonProps {
    tariff: "analysis" | "htn" | "chad";
    variant?: "default" | "outline" | "popular";
    fullWidth?: boolean;
    showAuthModal?: () => void;
}

const TARIFF_CONFIG = {
    analysis: {
        price: 199,
        label: "Купить за 199₽",
        loadingLabel: "Переход к оплате...",
    },
    htn: {
        price: 249,
        label: "Оформить подписку",
        loadingLabel: "Переход к оплате...",
    },
    chad: {
        price: 349,
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

        setLoading(true);
        try {
            const response = await api.post(`/payments/create?tariff_slug=${tariff}`);
            const { confirmation_url } = response.data;

            window.location.href = confirmation_url;
        } catch (error) {
            console.error("Payment error:", error);
            alert("Ошибка при создании платежа. Попробуйте позже.");
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