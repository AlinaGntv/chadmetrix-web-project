// components/admin/ReviewManager.tsx
"use client";

import { useState, useEffect, useCallback } from "react";
import { Star, Search, Calendar, Loader2, RefreshCw, CheckCircle, UserPlus, Users } from "lucide-react";
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

interface FakeUser {
    id: string;
    name: string;
    avatar_url: string | null;
    review_count: number;
    created_at: string;
}

interface CreateReviewPayload {
    user_id: string;
    rating: number;
    comment: string;
    created_at?: string;
}

interface CreateFakeReviewPayload {
    fake_user_id: string;
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
    const [activeTab, setActiveTab] = useState<"real" | "fake">("real");
    const [users, setUsers] = useState<User[]>([]);
    const [fakeUsers, setFakeUsers] = useState<FakeUser[]>([]);
    const [search, setSearch] = useState("");
    const [isLoading, setIsLoading] = useState(false);
    const [selectedUser, setSelectedUser] = useState<User | null>(null);
    const [selectedFakeUser, setSelectedFakeUser] = useState<FakeUser | null>(null);
    const [rating, setRating] = useState(5);
    const [comment, setComment] = useState("");
    const [customDate, setCustomDate] = useState("");
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [success, setSuccess] = useState<string | null>(null);
    const [error, setError] = useState<string | null>(null);

    // Для создания нового фейкового пользователя
    const [newFakeUserName, setNewFakeUserName] = useState("");
    const [isCreatingFakeUser, setIsCreatingFakeUser] = useState(false);

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

    const fetchFakeUsers = useCallback(async () => {
        setIsLoading(true);
        try {
            const response = await api.get("/reviews/admin/fake-users");
            setFakeUsers(response.data);
        } catch (err) {
            console.error("Failed to fetch fake users:", err);
            setError("Не удалось загрузить список фейковых пользователей");
        } finally {
            setIsLoading(false);
        }
    }, []);

    useEffect(() => {
        if (isAdmin) {
            if (activeTab === "real") {
                fetchUsers();
            } else {
                fetchFakeUsers();
            }
        }
    }, [isAdmin, activeTab, search, fetchUsers, fetchFakeUsers]);

    const createFakeUser = async () => {
        if (!newFakeUserName.trim()) {
            setError("Введите имя фейкового пользователя");
            return;
        }

        setIsCreatingFakeUser(true);
        setError(null);

        try {
            await api.post("/reviews/admin/fake-users", { name: newFakeUserName.trim() });
            setNewFakeUserName("");
            fetchFakeUsers();
            setSuccess(`Фейковый пользователь "${newFakeUserName}" создан!`);
            setTimeout(() => setSuccess(null), 3000);
        } catch (err) {
            const apiError = err as ApiError;
            setError(apiError.response?.data?.detail || "Ошибка при создании фейкового пользователя");
        } finally {
            setIsCreatingFakeUser(false);
        }
    };

    const handleSubmit = async () => {
        if (activeTab === "real" && !selectedUser) {
            setError("Выберите пользователя");
            return;
        }
        if (activeTab === "fake" && !selectedFakeUser) {
            setError("Выберите фейкового пользователя");
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
            if (activeTab === "real" && selectedUser) {
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
            } else if (activeTab === "fake" && selectedFakeUser) {
                const payload: CreateFakeReviewPayload = {
                    fake_user_id: selectedFakeUser.id,
                    rating: rating,
                    comment: comment.trim()
                };
                if (customDate) {
                    payload.created_at = new Date(customDate).toISOString();
                }
                await api.post("/reviews/admin/fake-review", payload);
                setSuccess(`Отзыв от "${selectedFakeUser.name}" успешно создан!`);
                setSelectedFakeUser(null);
            }

            setComment("");
            setRating(5);
            setCustomDate("");

            if (activeTab === "real") {
                fetchUsers();
            } else {
                fetchFakeUsers();
            }
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
                    onClick={() => {
                        if (activeTab === "real") fetchUsers();
                        else fetchFakeUsers();
                    }}
                    className="p-2 rounded-lg bg-white/10 hover:bg-white/20 transition-colors"
                    title="Обновить список"
                >
                    <RefreshCw className="w-4 h-4 text-gray-400" />
                </button>
            </div>

            {/* Вкладки */}
            <div className="flex gap-2 border-b border-white/10 pb-2">
                <button
                    onClick={() => {
                        setActiveTab("real");
                        setSelectedUser(null);
                        setSelectedFakeUser(null);
                        setError(null);
                        setSuccess(null);
                    }}
                    className={`px-4 py-2 rounded-lg text-sm transition-colors ${activeTab === "real"
                        ? "bg-blue-500/20 text-blue-400 border border-blue-500/30"
                        : "text-gray-400 hover:text-white hover:bg-white/10"
                        }`}
                >
                    <Users className="w-4 h-4 inline mr-2" />
                    Реальные пользователи
                </button>
                <button
                    onClick={() => {
                        setActiveTab("fake");
                        setSelectedUser(null);
                        setSelectedFakeUser(null);
                        setError(null);
                        setSuccess(null);
                    }}
                    className={`px-4 py-2 rounded-lg text-sm transition-colors ${activeTab === "fake"
                        ? "bg-purple-500/20 text-purple-400 border border-purple-500/30"
                        : "text-gray-400 hover:text-white hover:bg-white/10"
                        }`}
                >
                    <UserPlus className="w-4 h-4 inline mr-2" />
                    Фейковые пользователи
                </button>
            </div>

            {/* Поиск (только для реальных) */}
            {activeTab === "real" && (
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
            )}

            {/* Создание фейкового пользователя */}
            {activeTab === "fake" && (
                <div className="p-4 rounded-xl bg-purple-500/10 border border-purple-500/20">
                    <h3 className="text-sm font-medium text-purple-400 mb-3">Создать фейкового пользователя</h3>
                    <div className="flex gap-2">
                        <input
                            type="text"
                            value={newFakeUserName}
                            onChange={(e) => setNewFakeUserName(e.target.value)}
                            placeholder="Имя пользователя (например: Александр, Дмитрий, Мария...)"
                            className="flex-1 px-4 py-2 bg-black/30 border border-white/10 rounded-lg text-white placeholder-gray-500 focus:outline-none focus:border-purple-500/30"
                        />
                        <button
                            onClick={createFakeUser}
                            disabled={isCreatingFakeUser || !newFakeUserName.trim()}
                            className="px-4 py-2 bg-purple-500 hover:bg-purple-600 rounded-lg text-white text-sm disabled:opacity-50"
                        >
                            {isCreatingFakeUser ? <Loader2 className="w-4 h-4 animate-spin" /> : "Создать"}
                        </button>
                    </div>
                    <p className="text-xs text-gray-500 mt-2">
                        Фейковый пользователь будет виден на сайте как обычный, но без привязки к реальному аккаунту.
                    </p>
                </div>
            )}

            {/* Список пользователей */}
            {isLoading ? (
                <div className="flex justify-center py-8">
                    <Loader2 className="w-6 h-6 animate-spin text-gray-400" />
                </div>
            ) : activeTab === "real" ? (
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
            ) : (
                <div className="grid gap-2 max-h-80 overflow-y-auto">
                    {fakeUsers.map((fu) => (
                        <div
                            key={fu.id}
                            onClick={() => setSelectedFakeUser(fu)}
                            className={`flex items-center justify-between p-3 rounded-lg cursor-pointer transition-all ${selectedFakeUser?.id === fu.id
                                ? "bg-purple-500/20 border border-purple-500/50"
                                : "bg-white/5 border border-white/10 hover:bg-white/10"
                                }`}
                        >
                            <div className="flex items-center gap-3 min-w-0">
                                <div className="w-8 h-8 rounded-full bg-purple-700 shrink-0 flex items-center justify-center">
                                    <span className="text-xs text-white">
                                        {fu.name[0] || "?"}
                                    </span>
                                </div>
                                <div className="min-w-0">
                                    <p className="text-sm text-white font-medium truncate">
                                        {fu.name}
                                    </p>
                                    <p className="text-xs text-gray-500">
                                        {fu.review_count} {fu.review_count === 1 ? "отзыв" : "отзывов"}
                                    </p>
                                </div>
                            </div>
                        </div>
                    ))}
                    {fakeUsers.length === 0 && (
                        <div className="text-center py-8 text-gray-500">
                            Нет фейковых пользователей. Создайте первого!
                        </div>
                    )}
                </div>
            )}

            {/* Форма создания отзыва */}
            {(selectedUser || selectedFakeUser) && (
                <div className="mt-6 p-4 rounded-xl bg-white/5 border border-white/10">
                    <h3 className="text-lg font-medium text-white mb-4">
                        Создать отзыв для {activeTab === "real"
                            ? (selectedUser?.full_name || selectedUser?.email)
                            : selectedFakeUser?.name}
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
                            placeholder="Напишите текст отзыва..."
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
                                setSelectedFakeUser(null);
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