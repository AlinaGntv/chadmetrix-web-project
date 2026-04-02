// components/upload-form.tsx
"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import Image from "next/image";
import { Upload, X, Loader2, Lock, AlertCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/lib/hooks/useAuth";
import Link from "next/link";

export function UploadForm() {
    const router = useRouter();
    const { user, refreshUser, isLoading: isAuthLoading } = useAuth();

    const [front, setFront] = useState<File | null>(null);
    const [side, setSide] = useState<File | null>(null);
    const [frontPreview, setFrontPreview] = useState<string | null>(null);
    const [sidePreview, setSidePreview] = useState<string | null>(null);
    const [isUploading, setIsUploading] = useState(false);

    // Обновляем данные пользователя при монтировании компонента
    useEffect(() => {
        refreshUser();
    }, []); // eslint-disable-line react-hooks/exhaustive-deps

    // Используем total_uses_remaining из API (агрегированное поле)
    const totalUses = user?.total_uses_remaining ?? 0;
    const bonusUses = user?.bonus_uses_remaining ?? 0;
    const hasRemainingUses = totalUses > 0;

    // Разблокируем профиль для всех, у кого есть анализы (включая бонусные)
    // Или для подписок HTN/CHAD
    const canUseSidePhoto = hasRemainingUses ||
        user?.tariff_type === "htn" ||
        user?.tariff_type === "chad" ||
        user?.tariff_type === "HTN" ||
        user?.tariff_type === "CHAD";

    const readFile = (file: File, type: "front" | "side") => {
        const reader = new FileReader();
        reader.onloadend = () => {
            if (type === "front") {
                setFront(file);
                setFrontPreview(reader.result as string);
            } else {
                setSide(file);
                setSidePreview(reader.result as string);
            }
        };
        reader.readAsDataURL(file);
    };

    const handleChange =
        (type: "front" | "side") =>
            (e: React.ChangeEvent<HTMLInputElement>) => {
                if (!e.target.files?.[0]) return;
                readFile(e.target.files[0], type);
            };

    // Функция для проверки статуса анализа и получения report_id
    const waitForReport = async (analysisId: string): Promise<string | null> => {
        const maxAttempts = 30;
        const delay = 1000;

        for (let i = 0; i < maxAttempts; i++) {
            try {
                const res = await fetch(`/api/analysis/${analysisId}/status`, {
                    credentials: "include",
                });

                if (!res.ok) {
                    await new Promise(resolve => setTimeout(resolve, delay));
                    continue;
                }

                const data = await res.json();

                if (data.has_report && data.report_id) {
                    return data.report_id;
                }

                if (data.status === "failed") {
                    console.error("Analysis failed");
                    return null;
                }
            } catch (e) {
                console.error("Status check failed:", e);
            }

            await new Promise(resolve => setTimeout(resolve, delay));
        }
        return null;
    };

    const handleSubmit = async () => {
        if (!front) return;

        if (!hasRemainingUses) {
            alert("У вас закончились анализы. Приобретите тариф для продолжения.");
            return;
        }

        setIsUploading(true);

        try {
            const formData = new FormData();
            formData.append("photo_front", front);
            if (side && canUseSidePhoto) {
                formData.append("photo_side", side);
            }

            const res = await fetch("/api/analysis", {
                method: "POST",
                body: formData,
                credentials: "include",
            });

            if (res.status === 403) {
                alert("У вас закончились анализы. Приобретите тариф для продолжения.");
                await refreshUser();
                return;
            }

            if (!res.ok) {
                const errorData = await res.json().catch(() => ({}));
                throw new Error(errorData.detail || "Upload failed");
            }

            const data = await res.json();
            const analysisId = data.analysis_id;

            await refreshUser();

            const reportId = await waitForReport(analysisId);

            if (reportId) {
                router.push(`/reports/${reportId}`);
            } else {
                router.push("/reports");
            }

        } catch (e) {
            console.error(e);
            alert(e instanceof Error ? e.message : "Ошибка загрузки");
        } finally {
            setIsUploading(false);
        }
    };

    const clear = (type: "front" | "side") => {
        if (type === "front") {
            setFront(null);
            setFrontPreview(null);
        } else {
            setSide(null);
            setSidePreview(null);
        }
    };

    if (isAuthLoading) {
        return (
            <div className="flex justify-center items-center py-12">
                <Loader2 className="w-8 h-8 animate-spin text-white" />
            </div>
        );
    }

    return (
        <div className="space-y-6">
            <PhotoSlot
                title="Фото анфас"
                preview={frontPreview}
                onChange={handleChange("front")}
                onClear={() => clear("front")}
                locked={!hasRemainingUses}
                lockMessage={
                    !hasRemainingUses
                        ? "Нет доступных анализов. Купите тариф."
                        : undefined
                }
            />

            <PhotoSlot
                title="Фото профиль"
                preview={sidePreview}
                onChange={handleChange("side")}
                onClear={() => clear("side")}
                locked={!canUseSidePhoto}
                lockMessage={!hasRemainingUses ? "Сначала купите анализ" : "Загрузите фото анфас"}
            />

            <div className="flex items-center justify-center gap-2 text-sm">
                <AlertCircle className="w-4 h-4 text-gray-400" />
                <span className="text-gray-400">
                    Осталось анализов: <span className="text-white font-semibold">{totalUses}</span>
                    {bonusUses > 0 && (
                        <span className="text-green-400 ml-1">
                            (+{bonusUses} бонусных)
                        </span>
                    )}
                </span>
            </div>

            <div className="flex flex-col items-center gap-3">
                {!hasRemainingUses ? (
                    <Link href="/dashboard/subscription">
                        <Button className="bg-white text-black hover:bg-gray-200">
                            Купить анализ
                        </Button>
                    </Link>
                ) : (
                    <Button
                        onClick={handleSubmit}
                        disabled={!front || isUploading}
                        className="bg-white text-black hover:bg-gray-200"
                    >
                        {isUploading ? (
                            <>
                                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                                Анализируем...
                            </>
                        ) : (
                            "Начать анализ"
                        )}
                    </Button>
                )}
            </div>
        </div>
    );
}

interface PhotoSlotProps {
    title: string;
    preview: string | null;
    onChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
    onClear: () => void;
    locked?: boolean;
    lockMessage?: string;
}

function PhotoSlot({
    title,
    preview,
    onChange,
    onClear,
    locked = false,
    lockMessage = "Доступно в подписке",
}: PhotoSlotProps) {
    return (
        <div className={`glass rounded-2xl p-6 border border-white/10 ${locked ? 'opacity-60' : ''}`}>
            <h3 className="text-white mb-3">{title}</h3>

            {locked && (
                <div className="text-xs text-gray-400 mb-2 flex items-center gap-2">
                    <Lock className="w-4 h-4" />
                    {lockMessage}
                </div>
            )}

            {!preview ? (
                <div className="relative border border-dashed border-gray-600 rounded-xl p-8 text-center">
                    <input
                        type="file"
                        accept="image/*"
                        onChange={onChange}
                        disabled={locked}
                        className="absolute inset-0 opacity-0 cursor-pointer disabled:cursor-not-allowed"
                    />

                    <Upload className={`mx-auto mb-2 ${locked ? 'text-gray-600' : 'text-gray-400'}`} />

                    <p className={`text-sm ${locked ? 'text-gray-500' : 'text-gray-400'}`}>
                        {locked ? "Заблокировано" : "Нажмите или перетащите фото"}
                    </p>
                </div>
            ) : (
                <div className="relative aspect-square max-w-sm rounded-xl overflow-hidden">
                    <Image
                        src={preview}
                        alt="preview"
                        fill
                        className="object-cover"
                    />

                    <button
                        onClick={onClear}
                        className="absolute top-2 right-2 bg-black/50 p-2 rounded-full hover:bg-black/70 transition-colors"
                    >
                        <X className="w-4 h-4" />
                    </button>
                </div>
            )}
        </div>
    );
}