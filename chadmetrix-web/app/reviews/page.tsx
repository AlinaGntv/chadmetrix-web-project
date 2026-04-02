// app/reviews/page.tsx
"use client";

import { useState, useEffect } from "react";
import { useAuth } from "@/lib/hooks/useAuth";
import { ReviewsSection } from "@/components/reviews/ReviewsSection";
import { ReviewForm } from "@/components/reviews/ReviewForm";
import { api } from "@/lib/api";
import { Button } from "@/components/ui/button";
import Link from "next/link";

export default function ReviewsPage() {
    const { user, isAuthenticated, refreshUser } = useAuth();
    const [hasReview, setHasReview] = useState(false);
    const [showForm, setShowForm] = useState(false);
    const [isLoading, setIsLoading] = useState(true);

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
                {isAuthenticated && hasReview && (
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