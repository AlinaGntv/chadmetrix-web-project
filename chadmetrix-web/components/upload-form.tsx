"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Image from "next/image";
import { Upload, X, Loader2, Lock, AlertCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/lib/hooks/useAuth";
import Link from "next/link";

export function UploadForm() {
    const router = useRouter();
    const { user } = useAuth();

    const [front, setFront] = useState<File | null>(null);
    const [side, setSide] = useState<File | null>(null);

    const [frontPreview, setFrontPreview] = useState<string | null>(null);
    const [sidePreview, setSidePreview] = useState<string | null>(null);

    const [isLoading, setIsLoading] = useState(false);

    // Проверка лимитов
    const hasRemainingUses = (user?.photo_uses_remaining || 0) > 0;

    // Профиль доступен только в подписках HTN/CHAD
    const canUseSidePhoto =
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

    const handleSubmit = async () => {
        if (!front) return;

        // Дополнительная проверка перед отправкой
        if (!hasRemainingUses) {
            alert("У вас закончились анализы. Приобретите тариф для продолжения.");
            return;
        }

        setIsLoading(true);

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
                return;
            }

            if (!res.ok) {
                throw new Error("Upload failed");
            }

            const data = await res.json();

            router.push(`/reports/${data.analysis_id}`);

        } catch (e) {
            console.error(e);
            alert("Ошибка загрузки");
        } finally {
            setIsLoading(false);
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

    return (
        <div className="space-y-6">

            {/* FRONT — блокируется если нет лимитов */}

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

            {/* SIDE — блокируется если нет подписки */}

            <PhotoSlot
                title="Фото профиль"
                preview={sidePreview}
                onChange={handleChange("side")}
                onClear={() => clear("side")}
                locked={!canUseSidePhoto}
                lockMessage="Доступно в подписке HTN/CHAD"
            />

            {/* ИНФО О ЛИМИТАХ */}

            <div className="flex items-center justify-center gap-2 text-sm text-gray-400">
                <AlertCircle className="w-4 h-4" />
                Осталось анализов: {user?.photo_uses_remaining || 0}
            </div>

            {/* КНОПКА */}

            <div className="flex flex-col items-center gap-3">

                {!hasRemainingUses ? (
                    <Link href="/dashboard/subscription">
                        <Button
                            className="bg-blue-600 hover:bg-blue-700 text-white"
                        >
                            Купить анализ
                        </Button>
                    </Link>
                ) : (
                    <Button
                        onClick={handleSubmit}
                        disabled={!front || isLoading}
                        className="bg-white text-black hover:bg-gray-200"
                    >
                        {isLoading ? (
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
    title: string
    preview: string | null
    onChange: (e: React.ChangeEvent<HTMLInputElement>) => void
    onClear: () => void
    locked?: boolean
    lockMessage?: string
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
                <div className="text-xs text-yellow-400 mb-2 flex items-center gap-2">
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
                        className="absolute top-2 right-2 bg-black/50 p-2 rounded-full"
                    >
                        <X className="w-4 h-4" />
                    </button>

                </div>
            )}
        </div>
    );
}