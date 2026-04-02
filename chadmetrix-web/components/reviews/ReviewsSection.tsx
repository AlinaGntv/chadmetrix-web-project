// components/reviews/ReviewsSection.tsx
"use client";

import { useState, useEffect } from "react";
import { Star, MessageCircle, User as UserIcon, Trash2, Loader2 } from "lucide-react";
import Image from "next/image";
import { api } from "@/lib/api";
import { useAuth } from "@/lib/hooks/useAuth";

interface Review {
    id: string;
    user_id: string;
    user_name: string;
    user_avatar?: string;
    rating: number;
    comment?: string;
    created_at: string;
}

interface ReviewStats {
    average_rating: number;
    total_reviews: number;
    rating_distribution: Record<number, number>;
}

// Компонент кнопки удаления для админа
function AdminDeleteButton({ reviewId, onDelete }: { reviewId: string; onDelete: () => void }) {
    const [isDeleting, setIsDeleting] = useState(false);
    const [showConfirm, setShowConfirm] = useState(false);

    const handleDelete = async () => {
        setIsDeleting(true);
        try {
            await api.delete(`/reviews/${reviewId}`);
            onDelete();
        } catch (error) {
            console.error("Failed to delete review:", error);
            alert("Ошибка при удалении отзыва");
        } finally {
            setIsDeleting(false);
            setShowConfirm(false);
        }
    };

    if (showConfirm) {
        return (
            <div className="absolute top-2 right-2 flex gap-1 bg-black/80 rounded-lg p-1 z-10">
                <button
                    onClick={handleDelete}
                    disabled={isDeleting}
                    className="px-2 py-1 rounded bg-red-500 hover:bg-red-600 text-white text-xs"
                >
                    {isDeleting ? <Loader2 className="w-3 h-3 animate-spin" /> : "Удалить"}
                </button>
                <button
                    onClick={() => setShowConfirm(false)}
                    className="px-2 py-1 rounded bg-gray-600 hover:bg-gray-500 text-white text-xs"
                >
                    Отмена
                </button>
            </div>
        );
    }

    return (
        <button
            onClick={() => setShowConfirm(true)}
            className="absolute top-2 right-2 p-1.5 rounded-lg bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity hover:bg-red-500/50 z-10"
            title="Удалить отзыв"
        >
            <Trash2 className="w-3.5 h-3.5 text-white" />
        </button>
    );
}

export function ReviewsSection() {
    const { user } = useAuth();
    const [reviews, setReviews] = useState<Review[]>([]);
    const [stats, setStats] = useState<ReviewStats | null>(null);
    const [isLoading, setIsLoading] = useState(true);

    // Проверка на админа - ЗАМЕНИТЕ НА СВОИ EMAIL
    const isAdmin = user?.email === "gntv.surname@gmail.com";

    const fetchReviews = async () => {
        try {
            const response = await api.get("/reviews/list?limit=50");
            setReviews(response.data);
        } catch (error) {
            console.error("Failed to fetch reviews:", error);
        } finally {
            setIsLoading(false);
        }
    };

    const fetchStats = async () => {
        try {
            const response = await api.get("/reviews/stats");
            setStats(response.data);
        } catch (error) {
            console.error("Failed to fetch stats:", error);
        }
    };

    const handleReviewDeleted = () => {
        fetchReviews();
        fetchStats();
    };

    useEffect(() => {
        fetchReviews();
        fetchStats();
    }, []);

    const formatDate = (dateString: string) => {
        const date = new Date(dateString);
        return date.toLocaleDateString('ru-RU', {
            year: 'numeric',
            month: 'long',
            day: 'numeric'
        });
    };

    if (isLoading) {
        return (
            <div className="flex justify-center py-12">
                <div className="w-8 h-8 border-2 border-gray-600 border-t-white rounded-full animate-spin" />
            </div>
        );
    }

    return (
        <div className="space-y-8">
            {/* Статистика */}
            {stats && stats.total_reviews > 0 && (
                <div className="text-center">
                    <div className="flex items-center justify-center gap-2 mb-2">
                        <div className="flex">
                            {[1, 2, 3, 4, 5].map((star) => (
                                <Star
                                    key={star}
                                    className={`w-6 h-6 ${star <= Math.round(stats.average_rating)
                                        ? "text-yellow-500 fill-yellow-500"
                                        : "text-gray-600"
                                        }`}
                                />
                            ))}
                        </div>
                        <span className="text-2xl font-bold text-white">
                            {stats.average_rating}
                        </span>
                    </div>
                    <p className="text-gray-400">
                        {stats.total_reviews} {stats.total_reviews === 1 ? "отзыв" : "отзывов"}
                    </p>
                </div>
            )}

            {/* Список отзывов */}
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                {reviews.map((review) => (
                    <div
                        key={review.id}
                        className="glass rounded-xl p-5 border border-white/10 hover:border-white/20 transition-all relative group"
                    >
                        {/* Админ-кнопка удаления */}
                        {isAdmin && (
                            <AdminDeleteButton
                                reviewId={review.id}
                                onDelete={handleReviewDeleted}
                            />
                        )}

                        {/* User info */}
                        <div className="flex items-center gap-3 mb-3">
                            <div className="w-10 h-10 rounded-full bg-linear-to-br from-gray-700 to-gray-900 overflow-hidden shrink-0">
                                {review.user_avatar ? (
                                    <Image
                                        src={review.user_avatar}
                                        alt={review.user_name}
                                        width={40}
                                        height={40}
                                        className="object-cover"
                                    />
                                ) : (
                                    <div className="w-full h-full flex items-center justify-center">
                                        <UserIcon className="w-5 h-5 text-gray-400" />
                                    </div>
                                )}
                            </div>
                            <div className="flex-1 min-w-0">
                                <p className="text-white font-medium truncate">
                                    {review.user_name}
                                </p>
                                <p className="text-xs text-gray-500">
                                    {formatDate(review.created_at)}
                                </p>
                            </div>
                        </div>

                        {/* Rating */}
                        <div className="flex gap-0.5 mb-2">
                            {[1, 2, 3, 4, 5].map((star) => (
                                <Star
                                    key={star}
                                    className={`w-4 h-4 ${star <= review.rating
                                        ? "text-yellow-500 fill-yellow-500"
                                        : "text-gray-600"
                                        }`}
                                />
                            ))}
                        </div>

                        {/* Comment */}
                        {review.comment && (
                            <p className="text-gray-300 text-sm leading-relaxed line-clamp-3">
                                {review.comment}
                            </p>
                        )}
                    </div>
                ))}
            </div>

            {reviews.length === 0 && (
                <div className="text-center py-12">
                    <MessageCircle className="w-12 h-12 text-gray-600 mx-auto mb-3" />
                    <p className="text-gray-400">Пока нет отзывов</p>
                    <p className="text-sm text-gray-500 mt-1">Будьте первым, кто оставит отзыв!</p>
                </div>
            )}
        </div>
    );
}