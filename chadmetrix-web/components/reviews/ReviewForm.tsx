// components/reviews/ReviewForm.tsx
"use client";

import { useState } from "react";
import { Star, AlertCircle, Gift } from "lucide-react";
import { Button } from "@/components/ui/button";
import { api } from "@/lib/api";
import { useAuth } from "@/lib/hooks/useAuth";

interface ReviewFormProps {
    onSuccess?: () => void;
}

// Тип для ошибки от API
interface ApiError {
    response?: {
        status?: number;
        data?: {
            detail?: string;
        };
    };
}

export function ReviewForm({ onSuccess }: ReviewFormProps) {
    const { refreshUser } = useAuth(); // Убрали неиспользуемый user
    const [rating, setRating] = useState(0);
    const [hoveredRating, setHoveredRating] = useState(0);
    const [comment, setComment] = useState("");
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [success, setSuccess] = useState<{ hasDiscount: boolean; discountCode?: string } | null>(null);

    const handleSubmit = async () => {
        if (rating === 0) {
            setError("Пожалуйста, поставьте оценку");
            return;
        }

        setIsSubmitting(true);
        setError(null);

        try {
            const response = await api.post("/reviews/create", {
                rating,
                comment: comment.trim() || null
            });

            setSuccess({
                hasDiscount: response.data.has_discount,
                discountCode: response.data.discount_code
            });

            await refreshUser();

            if (onSuccess) {
                setTimeout(() => onSuccess(), 2000);
            }
        } catch (err: unknown) {
            const error = err as ApiError;
            if (error.response?.status === 400) {
                setError(error.response.data?.detail || "Ошибка при отправке отзыва");
            } else {
                setError("Произошла ошибка. Попробуйте позже.");
            }
        } finally {
            setIsSubmitting(false);
        }
    };

    if (success) {
        return (
            <div className="glass rounded-2xl p-8 border border-green-500/20 text-center">
                <div className="w-16 h-16 bg-green-500/10 rounded-full flex items-center justify-center mx-auto mb-4">
                    <Star className="w-8 h-8 text-green-500 fill-green-500" />
                </div>
                <h3 className="text-xl font-bold text-white mb-2">Спасибо за отзыв!</h3>
                <p className="text-gray-400 mb-4">
                    Ваше мнение очень важно для нас и помогает делать сервис лучше.
                </p>
                {success.hasDiscount && success.discountCode && (
                    <div className="bg-linear-to-r from-amber-500/10 to-orange-500/10 border border-amber-500/20 rounded-xl p-4">
                        <div className="flex items-center gap-2 justify-center mb-2">
                            <Gift className="w-5 h-5 text-amber-500" />
                            <span className="text-amber-400 font-semibold">Вы получили скидку 20%!</span>
                        </div>
                        <p className="text-sm text-gray-300 mb-2">
                            Промокод на следующую покупку:
                        </p>
                        <code className="bg-black/50 px-4 py-2 rounded-lg text-amber-400 font-mono text-sm break-all">
                            {success.discountCode}
                        </code>
                        <p className="text-xs text-gray-500 mt-3">
                            Скидка действует 1 год и может быть использована только один раз
                        </p>
                    </div>
                )}
            </div>
        );
    }

    return (
        <div className="glass rounded-2xl p-6 border border-white/10">
            <h3 className="text-xl font-bold text-white mb-4 text-center">
                Оставить отзыв
            </h3>

            {error && (
                <div className="mb-4 p-3 bg-red-500/10 border border-red-500/20 rounded-lg flex items-center gap-2 text-red-400 text-sm">
                    <AlertCircle className="w-4 h-4 shrink-0" />
                    <span>{error}</span>
                </div>
            )}

            {/* Rating stars */}
            <div className="mb-6">
                <p className="text-gray-400 text-sm mb-2 text-center">Ваша оценка</p>
                <div className="flex justify-center gap-2">
                    {[1, 2, 3, 4, 5].map((star) => (
                        <button
                            key={star}
                            type="button"
                            onClick={() => setRating(star)}
                            onMouseEnter={() => setHoveredRating(star)}
                            onMouseLeave={() => setHoveredRating(0)}
                            className="focus:outline-none transition-transform hover:scale-110"
                            aria-label={`Оценка ${star} из 5`}
                        >
                            <Star
                                className={`w-8 h-8 ${star <= (hoveredRating || rating)
                                    ? "text-yellow-500 fill-yellow-500"
                                    : "text-gray-600"
                                    } transition-colors`}
                            />
                        </button>
                    ))}
                </div>
            </div>

            {/* Comment textarea */}
            <div className="mb-6">
                <textarea
                    value={comment}
                    onChange={(e) => setComment(e.target.value)}
                    placeholder="Расскажите о вашем опыте использования сервиса..."
                    rows={4}
                    className="w-full px-4 py-3 bg-black/30 border border-white/10 rounded-lg text-white placeholder-gray-500 focus:outline-none focus:border-white/30 transition-colors resize-none"
                />
            </div>

            {/* Submit button */}
            <Button
                onClick={handleSubmit}
                disabled={isSubmitting || rating === 0}
                className="w-full bg-white text-black hover:bg-gray-200"
            >
                {isSubmitting ? "Отправка..." : "Отправить отзыв"}
            </Button>

            <p className="text-xs text-gray-500 text-center mt-4">
                * За отзыв вы получите промокод на скидку 20% на следующую покупку
            </p>
        </div>
    );
}