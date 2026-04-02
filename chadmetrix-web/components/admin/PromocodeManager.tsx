// components/admin/PromocodeManager.tsx
"use client";

import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { api } from "@/lib/api";
import { Plus, Trash2, Copy, Check, Loader2 } from "lucide-react";

interface Promocode {
    id: string;
    code: string;
    discount_percent: number;
    description: string | null;
    active: boolean;
    max_uses: number | null;
    uses_count: number;
    expires_at: string | null;
    created_at: string;
}

// Тип для ошибки API
interface ApiError {
    response?: {
        data?: {
            detail?: string;
        };
    };
}

export function PromocodeManager() {
    const [promocodes, setPromocodes] = useState<Promocode[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [showCreateForm, setShowCreateForm] = useState(false);
    const [copiedCode, setCopiedCode] = useState<string | null>(null);

    // Форма создания
    const [newCode, setNewCode] = useState("");
    const [newDiscount, setNewDiscount] = useState(20);
    const [newDescription, setNewDescription] = useState("");
    const [newMaxUses, setNewMaxUses] = useState<number | null>(null);
    const [newExpiresDays, setNewExpiresDays] = useState(30);
    const [isSubmitting, setIsSubmitting] = useState(false);

    useEffect(() => {
        fetchPromocodes();
    }, []);

    const fetchPromocodes = async () => {
        try {
            const response = await api.get("/payments/admin/promocodes?limit=100");
            setPromocodes(response.data.promocodes);
        } catch (err) {
            console.error("Failed to fetch promocodes:", err);
        } finally {
            setIsLoading(false);
        }
    };

    const handleCreatePromocode = async () => {
        if (!newCode.trim()) {
            alert("Введите код промокода");
            return;
        }

        setIsSubmitting(true);
        try {
            await api.post("/payments/admin/promocodes", {
                code: newCode.toUpperCase(),
                discount_percent: newDiscount,
                description: newDescription || null,
                max_uses: newMaxUses,
                expires_days: newExpiresDays
            });

            setShowCreateForm(false);
            resetForm();
            fetchPromocodes();
        } catch (err) {
            const error = err as ApiError;
            alert(error.response?.data?.detail || "Ошибка при создании промокода");
        } finally {
            setIsSubmitting(false);
        }
    };

    const handleToggleActive = async (promocode: Promocode) => {
        try {
            await api.put(`/payments/admin/promocodes/${promocode.id}`, {
                active: !promocode.active
            });
            fetchPromocodes();
        } catch (err) {
            console.error("Failed to update promocode:", err);
            alert("Ошибка при обновлении промокода");
        }
    };

    const handleDelete = async (promocode: Promocode) => {
        if (confirm(`Удалить промокод ${promocode.code}?`)) {
            try {
                await api.delete(`/payments/admin/promocodes/${promocode.id}`);
                fetchPromocodes();
            } catch (err) {
                console.error("Failed to delete promocode:", err);
                alert("Ошибка при удалении промокода");
            }
        }
    };

    const copyToClipboard = (code: string) => {
        navigator.clipboard.writeText(code);
        setCopiedCode(code);
        setTimeout(() => setCopiedCode(null), 2000);
    };

    const resetForm = () => {
        setNewCode("");
        setNewDiscount(20);
        setNewDescription("");
        setNewMaxUses(null);
        setNewExpiresDays(30);
    };

    const formatDate = (dateStr: string | null) => {
        if (!dateStr) return "—";
        return new Date(dateStr).toLocaleDateString('ru-RU');
    };

    if (isLoading) {
        return (
            <div className="flex justify-center py-12">
                <Loader2 className="w-8 h-8 animate-spin text-white" />
            </div>
        );
    }

    return (
        <div className="space-y-6">
            {/* Заголовок и кнопка создания */}
            <div className="flex justify-between items-center">
                <h2 className="text-xl font-semibold text-white">Промокоды</h2>
                <Button
                    onClick={() => setShowCreateForm(!showCreateForm)}
                    className="bg-white text-black hover:bg-gray-200"
                >
                    <Plus className="w-4 h-4 mr-2" />
                    Создать промокод
                </Button>
            </div>

            {/* Форма создания */}
            {showCreateForm && (
                <div className="glass rounded-xl p-6 border border-white/10">
                    <h3 className="text-lg font-semibold text-white mb-4">Создать новый промокод</h3>
                    <div className="grid gap-4">
                        <div>
                            <label className="block text-sm text-gray-400 mb-1">Код промокода</label>
                            <input
                                type="text"
                                value={newCode}
                                onChange={(e) => setNewCode(e.target.value.toUpperCase())}
                                placeholder="например: WELCOME20"
                                className="w-full px-4 py-2 bg-black/30 border border-white/10 rounded-lg text-white placeholder-gray-500 focus:outline-none focus:border-white/30"
                            />
                        </div>
                        <div>
                            <label className="block text-sm text-gray-400 mb-1">Скидка (%)</label>
                            <input
                                type="number"
                                value={newDiscount}
                                onChange={(e) => setNewDiscount(Number(e.target.value))}
                                min={1}
                                max={100}
                                className="w-full px-4 py-2 bg-black/30 border border-white/10 rounded-lg text-white focus:outline-none focus:border-white/30"
                            />
                        </div>
                        <div>
                            <label className="block text-sm text-gray-400 mb-1">Описание (опционально)</label>
                            <input
                                type="text"
                                value={newDescription}
                                onChange={(e) => setNewDescription(e.target.value)}
                                placeholder="Скидка 20% на первый анализ"
                                className="w-full px-4 py-2 bg-black/30 border border-white/10 rounded-lg text-white placeholder-gray-500 focus:outline-none focus:border-white/30"
                            />
                        </div>
                        <div className="grid grid-cols-2 gap-4">
                            <div>
                                <label className="block text-sm text-gray-400 mb-1">Макс. использований</label>
                                <input
                                    type="number"
                                    value={newMaxUses || ""}
                                    onChange={(e) => setNewMaxUses(e.target.value ? Number(e.target.value) : null)}
                                    placeholder="Без ограничений"
                                    className="w-full px-4 py-2 bg-black/30 border border-white/10 rounded-lg text-white placeholder-gray-500 focus:outline-none focus:border-white/30"
                                />
                            </div>
                            <div>
                                <label className="block text-sm text-gray-400 mb-1">Срок действия (дней)</label>
                                <input
                                    type="number"
                                    value={newExpiresDays}
                                    onChange={(e) => setNewExpiresDays(Number(e.target.value))}
                                    min={1}
                                    max={365}
                                    className="w-full px-4 py-2 bg-black/30 border border-white/10 rounded-lg text-white focus:outline-none focus:border-white/30"
                                />
                            </div>
                        </div>
                        <div className="flex gap-3 pt-2">
                            <Button
                                onClick={handleCreatePromocode}
                                disabled={isSubmitting}
                                className="bg-white text-black hover:bg-gray-200"
                            >
                                {isSubmitting ? <Loader2 className="w-4 h-4 animate-spin" /> : "Создать"}
                            </Button>
                            <Button
                                onClick={() => {
                                    setShowCreateForm(false);
                                    resetForm();
                                }}
                                variant="outline"
                                className="glass border-white/20"
                            >
                                Отмена
                            </Button>
                        </div>
                    </div>
                </div>
            )}

            {/* Список промокодов */}
            <div className="space-y-3">
                {promocodes.map((promocode) => (
                    <div
                        key={promocode.id}
                        className={`glass rounded-xl p-4 border transition-all ${promocode.active
                                ? "border-white/10 hover:border-white/20"
                                : "border-red-500/20 opacity-60"
                            }`}
                    >
                        <div className="flex items-center justify-between flex-wrap gap-3">
                            <div className="flex-1">
                                <div className="flex items-center gap-2 mb-1">
                                    <code className="text-lg font-mono font-bold text-amber-400">
                                        {promocode.code}
                                    </code>
                                    <button
                                        onClick={() => copyToClipboard(promocode.code)}
                                        className="p-1 rounded hover:bg-white/10 transition-colors"
                                        title="Копировать"
                                    >
                                        {copiedCode === promocode.code ? (
                                            <Check className="w-4 h-4 text-green-400" />
                                        ) : (
                                            <Copy className="w-4 h-4 text-gray-400" />
                                        )}
                                    </button>
                                </div>
                                {promocode.description && (
                                    <p className="text-sm text-gray-400">{promocode.description}</p>
                                )}
                                <div className="flex gap-4 mt-2 text-xs text-gray-500">
                                    <span>Скидка: <span className="text-green-400">{promocode.discount_percent}%</span></span>
                                    <span>Использований: {promocode.uses_count}/{promocode.max_uses || "∞"}</span>
                                    <span>Действует до: {formatDate(promocode.expires_at)}</span>
                                </div>
                            </div>
                            <div className="flex items-center gap-2">
                                <span className={`text-xs px-2 py-1 rounded-full ${promocode.active
                                        ? "bg-green-500/20 text-green-400"
                                        : "bg-red-500/20 text-red-400"
                                    }`}>
                                    {promocode.active ? "Активен" : "Неактивен"}
                                </span>
                                <Button
                                    onClick={() => handleToggleActive(promocode)}
                                    variant="outline"
                                    size="sm"
                                    className="glass border-white/20"
                                >
                                    {promocode.active ? "Деактивировать" : "Активировать"}
                                </Button>
                                <Button
                                    onClick={() => handleDelete(promocode)}
                                    variant="outline"
                                    size="sm"
                                    className="border-red-500/50 text-red-400 hover:bg-red-500/10"
                                >
                                    <Trash2 className="w-4 h-4" />
                                </Button>
                            </div>
                        </div>
                    </div>
                ))}
            </div>

            {promocodes.length === 0 && (
                <div className="text-center py-12 text-gray-400">
                    Нет созданных промокодов
                </div>
            )}
        </div>
    );
}