// components/pricing-button.tsx
"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Loader2 } from "lucide-react";
import { useAuth } from "@/lib/hooks/useAuth";
import { createOnetimePayment, createPaymentWithBinding } from "@/lib/api";
import { PromocodeInput } from "./PromocodeInput";

interface PricingButtonProps {
    tariff: "analysis" | "htn" | "chad";
    variant?: "default" | "outline" | "popular";
    fullWidth?: boolean;
    showAuthModal?: () => void;
}

// Тип для ошибки от API
interface ApiError {
    response?: {
        data?: {
            detail?: string;
        };
    };
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
    const [showPromocode, setShowPromocode] = useState(false);
    const [appliedPromocode, setAppliedPromocode] = useState<string | null>(null);
    const [discountPercent, setDiscountPercent] = useState(0);
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
            let data;

            // Analysis = разовая оплата без сохранения карты
            // HTN/CHAD = с сохранением карты для автоплатежей
            if (tariff === "analysis") {
                data = await createOnetimePayment(tariffId, appliedPromocode || undefined);
            } else {
                data = await createPaymentWithBinding(tariffId, appliedPromocode || undefined);
            }

            if (data.confirmation_url) {
                window.location.href = data.confirmation_url;
            }
        } catch (err: unknown) {
            const error = err as ApiError;
            alert(error.response?.data?.detail || "Ошибка при создании платежа");
        } finally {
            setLoading(false);
        }
    };

    const handlePromocodeApplied = (code: string, discount: number) => {
        setAppliedPromocode(code);
        setDiscountPercent(discount);
        setShowPromocode(false);
    };

    const handlePromocodeCleared = () => {
        setAppliedPromocode(null);
        setDiscountPercent(0);
    };

    const getButtonClass = () => {
        if (variant === "popular") return "bg-white text-black hover:bg-gray-200";
        return "glass border-white/20 hover:bg-white/10 text-white";
    };

    // Цена со скидкой
    const originalPrice = tariff === "analysis" ? 199 : tariff === "htn" ? 249 : 349;
    const finalPrice = appliedPromocode ? Math.round(originalPrice * (100 - discountPercent) / 100) : originalPrice;
    const buttonLabel = appliedPromocode
        ? `${config.label} (${finalPrice}₽ вместо ${originalPrice}₽)`
        : config.label;

    return (
        <div className={`${fullWidth ? 'w-full' : ''} space-y-3`}>
            {!appliedPromocode && (
                <button
                    type="button"
                    onClick={() => setShowPromocode(!showPromocode)}
                    className="text-xs text-gray-500 hover:text-gray-300 transition-colors flex items-center gap-1"
                >
                    <span>🎁</span> Есть промокод?
                </button>
            )}

            {showPromocode && !appliedPromocode && (
                <PromocodeInput
                    onPromocodeApplied={handlePromocodeApplied}
                    onPromocodeCleared={handlePromocodeCleared}
                    disabled={loading}
                />
            )}

            {appliedPromocode && (
                <div className="flex items-center justify-between p-2 rounded-lg bg-green-500/10 border border-green-500/20">
                    <span className="text-green-400 text-xs">
                        Промокод применён: скидка {discountPercent}%
                    </span>
                    <button
                        type="button"
                        onClick={handlePromocodeCleared}
                        className="text-gray-400 hover:text-white text-xs"
                    >
                        Отменить
                    </button>
                </div>
            )}

            <Button
                onClick={handlePay}
                disabled={loading}
                className={`w-full ${getButtonClass()}`}
            >
                {loading ? (
                    <>
                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                        {config.loadingLabel}
                    </>
                ) : (
                    buttonLabel
                )}
            </Button>
        </div>
    );
}