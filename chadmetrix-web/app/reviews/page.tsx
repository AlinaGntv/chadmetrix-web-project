// app/reviews/page.tsx
"use client";

import { useState, useEffect } from "react";
import { useAuth } from "@/lib/hooks/useAuth";
import { ReviewsSection } from "@/components/reviews/ReviewsSection";
import { ReviewForm } from "@/components/reviews/ReviewForm";
import { api } from "@/lib/api";
import { Button } from "@/components/ui/button";
import Link from "next/link";
import { Gift, Copy, Check } from "lucide-react";

export default function ReviewsPage() {
    const { user, isAuthenticated, refreshUser } = useAuth();
    const [hasReview, setHasReview] = useState(false);
    const [showForm, setShowForm] = useState(false);
    const [isLoading, setIsLoading] = useState(true);
    const [discountCode, setDiscountCode] = useState<string | null>(null);
    const [copied, setCopied] = useState(false);

    useEffect(() => {
        if (isAuthenticated && user) {
            checkUserReview();
        } else {
            setIsLoading(false);
        }
    }, [isAuthenticated, user]);

    const checkUserReview = async () => {
        try {
            const response = await api.get("/reviews/my-review");
            setHasReview(response.data.has_review);
            if (response.data.discount_code) {
                setDiscountCode(response.data.discount_code);
            }
        } catch (error) {
            console.error("Failed to check review:", error);
        } finally {
            setIsLoading(false);
        }
    };

    const handleReviewSuccess = () => {
        setHasReview(true);
        setShowForm(false);
        refreshUser();
        checkUserReview(); // Перезагружаем данные, чтобы получить промокод
    };

    const copyToClipboard = async (text: string) => {
        await navigator.clipboard.writeText(text);
        setCopied(true);
        setTimeout(() => setCopied(false), 2000);
    };

    return (
        <div className="min-h-screen pt-24 pb-16 px-4">
            <div className="max-w-7xl mx-auto">
                {/* Header */}
                <div className="text-center mb-12">
                    <h1 className="text-4xl md:text-5xl font-bold mb-4 text-gradient">
                        Отзывы наших клиентов
                    </h1>
                    <p className="text-gray-400 text-lg max-w-2xl mx-auto">
                        Реальные люди, реальные результаты
                    </p>
                </div>

                {/* Блок с промокодом для тех, кто оставил отзыв */}
                {isAuthenticated && hasReview && discountCode && (
                    <div className="mb-8 max-w-md mx-auto">
                        <div className="bg-linear-to-r from-amber-500/10 to-orange-500/10 border border-amber-500/20 rounded-xl p-4 text-center">
                            <div className="flex items-center gap-2 justify-center mb-2">
                                <Gift className="w-5 h-5 text-amber-500" />
                                <span className="text-amber-400 font-semibold">Ваш промокод на скидку 20%</span>
                            </div>
                            <div className="flex items-center justify-center gap-2 mt-2">
                                <code className="bg-black/50 px-4 py-2 rounded-lg text-amber-400 font-mono text-sm">
                                    {discountCode}
                                </code>
                                <button
                                    onClick={() => copyToClipboard(discountCode)}
                                    className="p-2 rounded-lg bg-white/10 hover:bg-white/20 transition-colors"
                                    title="Копировать промокод"
                                >
                                    {copied ? (
                                        <Check className="w-4 h-4 text-green-400" />
                                    ) : (
                                        <Copy className="w-4 h-4 text-gray-400" />
                                    )}
                                </button>
                            </div>
                            <p className="text-xs text-gray-500 mt-3">
                                Скидка действует 1 год и может быть использована только один раз
                            </p>
                        </div>
                    </div>
                )}

                {/* Action button for authenticated users */}
                {isAuthenticated && !isLoading && !hasReview && !showForm && (
                    <div className="mb-12 flex justify-center">
                        <Button
                            onClick={() => setShowForm(true)}
                            className="bg-white text-black hover:bg-gray-200 px-8"
                        >
                            Оставить отзыв и получить скидку 20%
                        </Button>
                    </div>
                )}

                {/* Review form */}
                {isAuthenticated && showForm && !hasReview && (
                    <div className="mb-12 max-w-2xl mx-auto">
                        <ReviewForm onSuccess={handleReviewSuccess} />
                    </div>
                )}

                {/* Message for users who already left review */}
                {isAuthenticated && hasReview && !showForm && (
                    <div className="mb-12 text-center">
                        <div className="inline-flex items-center gap-2 px-4 py-2 bg-green-500/10 border border-green-500/20 rounded-full">
                            <span className="text-green-400">✓</span>
                            <span className="text-sm text-green-400">Вы уже оставили отзыв</span>
                        </div>
                    </div>
                )}

                {/* Login prompt */}
                {!isAuthenticated && (
                    <div className="mb-12 text-center">
                        <Link href="/login">
                            <Button variant="outline" className="glass border-white/20">
                                Войдите, чтобы оставить отзыв
                            </Button>
                        </Link>
                    </div>
                )}

                {/* Reviews list */}
                <ReviewsSection />
            </div>
        </div>
    );
}