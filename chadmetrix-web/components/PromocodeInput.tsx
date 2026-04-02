// components/PromocodeInput.tsx
"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Gift, X, Loader2 } from "lucide-react";
import { api } from "@/lib/api";

interface PromocodeInputProps {
    onPromocodeApplied: (code: string, discountPercent: number) => void;
    onPromocodeCleared: () => void;
    disabled?: boolean;
}

// Тип для ошибки от API
interface ApiError {
    response?: {
        data?: {
            detail?: string;
        };
    };
}

export function PromocodeInput({
    onPromocodeApplied,
    onPromocodeCleared,
    disabled = false
}: PromocodeInputProps) {
    const [promocode, setPromocode] = useState("");
    const [isValidating, setIsValidating] = useState(false);
    const [isApplied, setIsApplied] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [discountPercent, setDiscountPercent] = useState(0);

    const validatePromocode = async () => {
        if (!promocode.trim()) {
            setError("Введите промокод");
            return;
        }

        setIsValidating(true);
        setError(null);

        try {
            // Валидируем промокод через специальный эндпоинт
            const response = await api.get(`/payments/validate-promocode`, {
                params: { code: promocode.trim() }
            });

            if (response.data.valid) {
                setIsApplied(true);
                setDiscountPercent(response.data.discount_percent);
                onPromocodeApplied(promocode.trim(), response.data.discount_percent);
                setError(null);
            } else {
                setError(response.data.message || "Промокод недействителен");
            }
        } catch (err: unknown) {
            const error = err as ApiError;
            setError(error.response?.data?.detail || "Ошибка проверки промокода");
        } finally {
            setIsValidating(false);
        }
    };

    const clearPromocode = () => {
        setPromocode("");
        setIsApplied(false);
        setDiscountPercent(0);
        setError(null);
        onPromocodeCleared();
    };

    if (isApplied) {
        return (
            <div className="flex items-center justify-between p-3 rounded-lg bg-green-500/10 border border-green-500/20">
                <div className="flex items-center gap-2">
                    <Gift className="w-4 h-4 text-green-400" />
                    <span className="text-green-400 text-sm">
                        Промокод применён! Скидка {discountPercent}%
                    </span>
                </div>
                <button
                    type="button"
                    onClick={clearPromocode}
                    className="text-gray-400 hover:text-white transition-colors"
                    disabled={disabled}
                >
                    <X className="w-4 h-4" />
                </button>
            </div>
        );
    }

    return (
        <div className="space-y-2">
            <div className="flex gap-2">
                <input
                    type="text"
                    value={promocode}
                    onChange={(e) => setPromocode(e.target.value.toUpperCase())}
                    placeholder="Введите промокод"
                    disabled={disabled || isValidating}
                    className="flex-1 px-4 py-2 bg-black/30 border border-white/10 rounded-lg text-white placeholder-gray-500 focus:outline-none focus:border-white/30 transition-colors"
                />
                <Button
                    type="button"
                    onClick={validatePromocode}
                    disabled={disabled || isValidating || !promocode.trim()}
                    variant="outline"
                    className="glass border-white/20"
                >
                    {isValidating ? (
                        <Loader2 className="w-4 h-4 animate-spin" />
                    ) : (
                        "Применить"
                    )}
                </Button>
            </div>
            {error && (
                <p className="text-red-400 text-xs flex items-center gap-1">
                    <X className="w-3 h-3" />
                    {error}
                </p>
            )}
        </div>
    );
}