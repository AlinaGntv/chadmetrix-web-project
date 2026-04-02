// components/reviews/AdminReviewControls.tsx
"use client";

import { useState } from "react";
import { Trash2, Loader2 } from "lucide-react";

interface AdminReviewControlsProps {
    reviewId: string;
    onDelete?: () => void;
}

export function AdminReviewControls({ reviewId, onDelete }: AdminReviewControlsProps) {
    const [isDeleting, setIsDeleting] = useState(false);
    const [showConfirm, setShowConfirm] = useState(false);

    const handleDelete = async () => {
        setIsDeleting(true);
        try {
            const response = await fetch(`/api/reviews/${reviewId}`, {
                method: "DELETE",
                credentials: "include",
            });

            if (!response.ok) {
                throw new Error("Failed to delete review");
            }

            onDelete?.();
        } catch (error) {
            console.error("Failed to delete review:", error);
            alert("Ошибка при удалении отзыва");
        } finally {
            setIsDeleting(false);
            setShowConfirm(false);
        }
    };

    if (!showConfirm) {
        return (
            <button
                type="button"
                onClick={() => setShowConfirm(true)}
                className="absolute top-2 right-2 p-1.5 rounded-lg bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity hover:bg-red-500/50"
                title="Удалить отзыв"
            >
                <Trash2 className="w-3.5 h-3.5 text-white" />
            </button>
        );
    }

    return (
        <div className="absolute top-2 right-2 flex gap-1 bg-black/80 rounded-lg p-1 z-10">
            <button
                type="button"
                onClick={handleDelete}
                disabled={isDeleting}
                className="px-2 py-1 rounded bg-red-500 hover:bg-red-600 text-white text-xs"
            >
                {isDeleting ? <Loader2 className="w-3 h-3 animate-spin" /> : "Удалить"}
            </button>
            <button
                type="button"
                onClick={() => setShowConfirm(false)}
                className="px-2 py-1 rounded bg-gray-600 hover:bg-gray-500 text-white text-xs"
            >
                Отмена
            </button>
        </div>
    );
}