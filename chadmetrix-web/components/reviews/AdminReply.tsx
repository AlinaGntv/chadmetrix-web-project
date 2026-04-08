// components/reviews/AdminReply.tsx
"use client";

import { useState } from "react";
import { MessageCircle, Edit, Trash2, Loader2 } from "lucide-react";
import { api } from "@/lib/api";

interface AdminReplyProps {
    reviewId: string;
    existingReply?: string | null;
    existingReplyAt?: string | null;
    onReplyAdded?: () => void;
    onReplyDeleted?: () => void;
    onReplyEdited?: () => void;
}

export function AdminReply({
    reviewId,
    existingReply,
    existingReplyAt,
    onReplyAdded,
    onReplyDeleted,
    onReplyEdited
}: AdminReplyProps) {
    const [isReplying, setIsReplying] = useState(false);
    const [isEditing, setIsEditing] = useState(false);
    const [replyText, setReplyText] = useState(existingReply || "");
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);

    const handleAddReply = async () => {
        if (!replyText.trim()) return;

        setIsSubmitting(true);
        try {
            await api.post(`/reviews/${reviewId}/reply`, { reply: replyText });
            setIsReplying(false);
            setReplyText("");
            onReplyAdded?.();
        } catch (error) {
            console.error("Failed to add reply:", error);
            alert("Ошибка при добавлении ответа");
        } finally {
            setIsSubmitting(false);
        }
    };

    const handleEditReply = async () => {
        if (!replyText.trim()) return;

        setIsSubmitting(true);
        try {
            await api.put(`/reviews/${reviewId}/reply`, { reply: replyText });
            setIsEditing(false);
            onReplyEdited?.();
        } catch (error) {
            console.error("Failed to edit reply:", error);
            alert("Ошибка при редактировании ответа");
        } finally {
            setIsSubmitting(false);
        }
    };

    const handleDeleteReply = async () => {
        setIsSubmitting(true);
        try {
            await api.delete(`/reviews/${reviewId}/reply`);
            setShowDeleteConfirm(false);
            onReplyDeleted?.();
        } catch (error) {
            console.error("Failed to delete reply:", error);
            alert("Ошибка при удалении ответа");
        } finally {
            setIsSubmitting(false);
        }
    };

    const formatDate = (dateString: string) => {
        const date = new Date(dateString);
        return date.toLocaleDateString('ru-RU', {
            day: 'numeric',
            month: 'long',
            hour: '2-digit',
            minute: '2-digit'
        });
    };

    // Если есть существующий ответ и не в режиме редактирования
    if (existingReply && !isEditing && !isReplying) {
        return (
            <div className="mt-3 pl-3 border-l-2 border-blue-500/30">
                <div className="flex items-start justify-between">
                    <div className="flex items-center gap-2 text-xs text-blue-400 mb-1">
                        <MessageCircle className="w-3 h-3" />
                        <span>Ответ администратора</span>
                        {existingReplyAt && (
                            <span className="text-gray-500 text-xs">
                                • {formatDate(existingReplyAt)}
                            </span>
                        )}
                    </div>
                    <div className="flex gap-1">
                        <button
                            onClick={() => {
                                setIsEditing(true);
                                setReplyText(existingReply);
                            }}
                            className="p-1 hover:bg-white/10 rounded transition-colors"
                            title="Редактировать"
                        >
                            <Edit className="w-3 h-3 text-gray-400" />
                        </button>
                        <button
                            onClick={() => setShowDeleteConfirm(true)}
                            className="p-1 hover:bg-red-500/20 rounded transition-colors"
                            title="Удалить"
                        >
                            <Trash2 className="w-3 h-3 text-red-400" />
                        </button>
                    </div>
                </div>
                <p className="text-gray-300 text-sm leading-relaxed">{existingReply}</p>

                {/* Confirm delete modal */}
                {showDeleteConfirm && (
                    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
                        <div className="glass rounded-xl p-6 max-w-sm mx-4">
                            <h3 className="text-white font-semibold mb-2">Удалить ответ?</h3>
                            <p className="text-gray-400 text-sm mb-4">Это действие нельзя отменить.</p>
                            <div className="flex gap-3">
                                <button
                                    onClick={handleDeleteReply}
                                    disabled={isSubmitting}
                                    className="flex-1 px-4 py-2 bg-red-500 hover:bg-red-600 rounded-lg text-white text-sm"
                                >
                                    {isSubmitting ? <Loader2 className="w-4 h-4 animate-spin mx-auto" /> : "Удалить"}
                                </button>
                                <button
                                    onClick={() => setShowDeleteConfirm(false)}
                                    className="flex-1 px-4 py-2 bg-gray-700 hover:bg-gray-600 rounded-lg text-white text-sm"
                                >
                                    Отмена
                                </button>
                            </div>
                        </div>
                    </div>
                )}
            </div>
        );
    }

    // Режим редактирования
    if (isEditing) {
        return (
            <div className="mt-3 pl-3 border-l-2 border-blue-500/30">
                <div className="flex items-center gap-2 text-xs text-blue-400 mb-2">
                    <MessageCircle className="w-3 h-3" />
                    <span>Редактирование ответа</span>
                </div>
                <textarea
                    value={replyText}
                    onChange={(e) => setReplyText(e.target.value.slice(0, 1000))}
                    placeholder="Введите ответ на отзыв..."
                    rows={3}
                    maxLength={1000}
                    className="w-full px-3 py-2 bg-black/30 border border-white/10 rounded-lg text-white text-sm placeholder-gray-500 focus:outline-none focus:border-blue-500/50"
                />
                <div className="flex gap-2 mt-2">
                    <button
                        onClick={handleEditReply}
                        disabled={isSubmitting || !replyText.trim()}
                        className="px-3 py-1.5 bg-blue-500 hover:bg-blue-600 rounded-lg text-white text-xs"
                    >
                        {isSubmitting ? <Loader2 className="w-3 h-3 animate-spin" /> : "Сохранить"}
                    </button>
                    <button
                        onClick={() => {
                            setIsEditing(false);
                            setReplyText(existingReply || "");
                        }}
                        className="px-3 py-1.5 bg-gray-700 hover:bg-gray-600 rounded-lg text-white text-xs"
                    >
                        Отмена
                    </button>
                </div>
            </div>
        );
    }

    // Режим добавления нового ответа
    if (isReplying) {
        return (
            <div className="mt-3">
                <div className="flex items-center gap-2 text-xs text-blue-400 mb-2">
                    <MessageCircle className="w-3 h-3" />
                    <span>Добавить ответ</span>
                </div>
                <textarea
                    value={replyText}
                    onChange={(e) => setReplyText(e.target.value.slice(0, 1000))}
                    placeholder="Введите ответ на отзыв..."
                    rows={3}
                    maxLength={1000}
                    className="w-full px-3 py-2 bg-black/30 border border-white/10 rounded-lg text-white text-sm placeholder-gray-500 focus:outline-none focus:border-blue-500/50"
                />
                <div className="flex gap-2 mt-2">
                    <button
                        onClick={handleAddReply}
                        disabled={isSubmitting || !replyText.trim()}
                        className="px-3 py-1.5 bg-blue-500 hover:bg-blue-600 rounded-lg text-white text-xs"
                    >
                        {isSubmitting ? <Loader2 className="w-3 h-3 animate-spin" /> : "Отправить"}
                    </button>
                    <button
                        onClick={() => {
                            setIsReplying(false);
                            setReplyText("");
                        }}
                        className="px-3 py-1.5 bg-gray-700 hover:bg-gray-600 rounded-lg text-white text-xs"
                    >
                        Отмена
                    </button>
                </div>
            </div>
        );
    }

    // Кнопка "Ответить" (только для админов)
    return (
        <button
            onClick={() => setIsReplying(true)}
            className="mt-3 text-xs text-gray-500 hover:text-blue-400 transition-colors flex items-center gap-1"
        >
            <MessageCircle className="w-3 h-3" />
            Ответить
        </button>
    );
}