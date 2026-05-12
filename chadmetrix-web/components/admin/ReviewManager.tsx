// components/admin/ReviewManager.tsx
"use client";

import { useState, useEffect, useCallback } from "react";
import { Star, Search, Calendar, Loader2, RefreshCw, CheckCircle } from "lucide-react";
import { api } from "@/lib/api";
import { useAuth } from "@/lib/hooks/useAuth";

interface User {
    id: string;
    email: string;
    full_name: string | null;
    avatar_url: string | null;
    has_review: boolean;
    created_at: string;
}

interface CreateReviewPayload {
    user_id: string;
    rating: number;
    comment: string;
    created_at?: string;
}

interface ApiError {
    response?: {
        data?: {
            detail?: string;
        };
    };
}

export function ReviewManager() {
    const { user } = useAuth();
    const [users, setUsers] = useState<User[]>([]);
    const [search, setSearch] = useState("");
    const [isLoading, setIsLoading] = useState(false);
    const [selectedUser, setSelectedUser] = useState<User | null>(null);
    const [rating, setRating] = useState(5);
    const [comment, setComment] = useState("");
    const [customDate, setCustomDate] = useState("");
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [success, setSuccess] = useState<string | null>(null);
    const [error, setError] = useState<string | null>(null);

    const isAdmin = user?.email === "gntv.surname@gmail.com";

    const fetchUsers = useCallback(async () => {
        setIsLoading(true);
        try {
            const response = await api.get("/reviews/admin/users", {
                params: { search: search || undefined, limit: 50 }
            });
            setUsers(response.data);
        } catch (err) {
            console.error("Failed to fetch users:", err);
            setError("Не удалось загрузить список пользователей");
        } finally {
            setIsLoading(false);
        }
    }, [search]);

    useEffect(() => {
        if (isAdmin) {
            fetchUsers();
        }
    }, [isAdmin, search, fetchUsers]);

    const handleSubmit = async () => {
        if (!selectedUser) {
            setError("Выберите пользователя");
            return;
        }
        if (!comment.trim()) {
            setError("Введите текст отзыва");
            return;
        }

        setIsSubmitting(true);
        setError(null);
        setSuccess(null);

        try {
            const payload: CreateReviewPayload = {
                user_id: selectedUser.id,
                rating: rating,
                comment: comment.trim()
            };

            if (customDate) {
                payload.created_at = new Date(customDate).toISOString();
            }

            await api.post("/reviews/admin/fake", payload);

            setSuccess(`Отзыв для ${selectedUser.email} успешно создан!`);
            setSelectedUser(null);
            setComment("");
            setRating(5);
            setCustomDate("");
            fetchUsers();
        } catch (err) {
            const apiError = err as ApiError;
            console.error("Failed to create review:", apiError);
            setError(apiError.response?.data?.detail || "Ошибка при создании отзыва");
        } finally {
            setIsSubmitting(false);
        }
    };

    if (!isAdmin) {
        return null;
    }

    return (
        <div className="space-y-6">
            <div className="flex items-center justify-between">
                <h2 className="text-xl font-semibold text-white">Управление отзывами</h2>
                <button
                    onClick={fetchUsers}
                    className="p-2 rounded-lg bg-white/10 hover:bg-white/20 transition-colors"
                    title="Обновить список"
                >
                    <RefreshCw className="w-4 h-4 text-gray-400" />
                </button>
            </div>

            {/* Поиск пользователей */}
            <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-500" />
                <input
                    type="text"
                    value={search}
                    onChange={(e) => setSearch(e.target.value)}
                    placeholder="Поиск пользователей по email или имени..."
                    className="w-full pl-10 pr-4 py-2 bg-black/30 border border-white/10 rounded-lg text-white placeholder-gray-500 focus:outline-none focus:border-white/30"
                />
            </div>

            {/* Список пользователей */}
            {isLoading ? (
                <div className="flex justify-center py-8">
                    <Loader2 className="w-6 h-6 animate-spin text-gray-400" />
                </div>
            ) : (
                <div className="grid gap-2 max-h-80 overflow-y-auto">
                    {users.map((u) => (
                        <div
                            key={u.id}
                            onClick={() => setSelectedUser(u)}
                            className={`flex items-center justify-between p-3 rounded-lg cursor-pointer transition-all ${selectedUser?.id === u.id
                                    ? "bg-blue-500/20 border border-blue-500/50"
                                    : "bg-white/5 border border-white/10 hover:bg-white/10"
                                }`}
                        >
                            <div className="flex items-center gap-3 min-w-0">
                                <div className="w-8 h-8 rounded-full bg-gray-700 shrink-0 flex items-center justify-center">
                                    <span className="text-xs text-white">
                                        {u.full_name?.[0] || u.email[0] || "?"}
                                    </span>
                                </div>
                                <div className="min-w-0">
                                    <p className="text-sm text-white font-medium truncate">
                                        {u.full_name || "Без имени"}
                                    </p>
                                    <p className="text-xs text-gray-500 truncate">{u.email}</p>
                                </div>
                            </div>
                            {u.has_review ? (
                                <span className="text-xs text-green-400 flex items-center gap-1 shrink-0">
                                    <CheckCircle className="w-3 h-3" /> есть отзыв
                                </span>
                            ) : (
                                <span className="text-xs text-gray-500 shrink-0">нет отзыва</span>
                            )}
                        </div>
                    ))}
                </div>
            )}

            {/* Форма создания отзыва */}
            {selectedUser && (
                <div className="mt-6 p-4 rounded-xl bg-white/5 border border-white/10">
                    <h3 className="text-lg font-medium text-white mb-4">
                        Создать отзыв для {selectedUser.full_name || selectedUser.email}
                    </h3>

                    {/* Rating */}
                    <div className="mb-4">
                        <label className="block text-sm text-gray-400 mb-2">Оценка</label>
                        <div className="flex gap-2">
                            {[1, 2, 3, 4, 5].map((star) => (
                                <button
                                    key={star}
                                    type="button"
                                    onClick={() => setRating(star)}
                                    className="focus:outline-none"
                                >
                                    <Star
                                        className={`w-8 h-8 ${star <= rating
                                                ? "text-yellow-500 fill-yellow-500"
                                                : "text-gray-600"
                                            } transition-colors`}
                                    />
                                </button>
                            ))}
                        </div>
                    </div>

                    {/* Comment */}
                    <div className="mb-4">
                        <label className="block text-sm text-gray-400 mb-2">Текст отзыва</label>
                        <textarea
                            value={comment}
                            onChange={(e) => setComment(e.target.value.slice(0, 1000))}
                            placeholder="Напишите текст отзыва от имени пользователя..."
                            rows={4}
                            maxLength={1000}
                            className="w-full px-4 py-3 bg-black/30 border border-white/10 rounded-lg text-white placeholder-gray-500 focus:outline-none focus:border-white/30 resize-none"
                        />
                        <p className="text-right text-xs text-gray-500 mt-1">
                            {comment.length}/1000 символов
                        </p>
                    </div>

                    {/* Custom date (optional) */}
                    <div className="mb-4">
                        <label className="flex items-center gap-2 text-sm text-gray-400 mb-2">
                            <Calendar className="w-4 h-4" />
                            Дата отзыва (опционально)
                        </label>
                        <input
                            type="datetime-local"
                            value={customDate}
                            onChange={(e) => setCustomDate(e.target.value)}
                            className="w-full px-4 py-2 bg-black/30 border border-white/10 rounded-lg text-white focus:outline-none focus:border-white/30"
                        />
                        <p className="text-xs text-gray-500 mt-1">
                            Если не указано — будет использована текущая дата
                        </p>
                    </div>

                    {error && (
                        <div className="mb-4 p-3 bg-red-500/10 border border-red-500/20 rounded-lg text-red-400 text-sm">
                            {error}
                        </div>
                    )}

                    {success && (
                        <div className="mb-4 p-3 bg-green-500/10 border border-green-500/20 rounded-lg text-green-400 text-sm flex items-center gap-2">
                            <CheckCircle className="w-4 h-4" />
                            {success}
                        </div>
                    )}

                    <div className="flex gap-3">
                        <button
                            onClick={handleSubmit}
                            disabled={isSubmitting || !comment.trim()}
                            className="px-4 py-2 bg-blue-500 hover:bg-blue-600 rounded-lg text-white text-sm disabled:opacity-50 disabled:cursor-not-allowed"
                        >
                            {isSubmitting ? (
                                <Loader2 className="w-4 h-4 animate-spin" />
                            ) : (
                                "Создать отзыв"
                            )}
                        </button>
                        <button
                            onClick={() => {
                                setSelectedUser(null);
                                setComment("");
                                setRating(5);
                                setCustomDate("");
                                setError(null);
                                setSuccess(null);
                            }}
                            className="px-4 py-2 bg-gray-700 hover:bg-gray-600 rounded-lg text-white text-sm"
                        >
                            Отмена
                        </button>
                    </div>
                </div>
            )}
        </div>
    );
}