// components/upload-form.tsx
"use client";

import { useState, useCallback } from "react";
import { useRouter } from "next/navigation";
import Image from "next/image";
import { Upload, X, ImageIcon, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";

export function UploadForm() {
    const [dragActive, setDragActive] = useState(false);
    const [preview, setPreview] = useState<string | null>(null);
    const [isLoading, setIsLoading] = useState(false);
    const router = useRouter();

    // Сначала объявляем handleFile
    const handleFile = useCallback((file: File) => {
        if (file.type.startsWith("image/")) {
            const reader = new FileReader();
            reader.onloadend = () => {
                setPreview(reader.result as string);
            };
            reader.readAsDataURL(file);
        }
    }, []);

    // Потом handleDrop, который использует handleFile
    const handleDrop = useCallback((e: React.DragEvent) => {
        e.preventDefault();
        e.stopPropagation();
        setDragActive(false);

        if (e.dataTransfer.files && e.dataTransfer.files[0]) {
            handleFile(e.dataTransfer.files[0]);
        }
    }, [handleFile]);

    const handleDrag = useCallback((e: React.DragEvent) => {
        e.preventDefault();
        e.stopPropagation();
        if (e.type === "dragenter" || e.type === "dragover") {
            setDragActive(true);
        } else if (e.type === "dragleave") {
            setDragActive(false);
        }
    }, []);

    const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        e.preventDefault();
        if (e.target.files && e.target.files[0]) {
            handleFile(e.target.files[0]);
        }
    };

    const handleSubmit = async () => {
        if (!preview) return;
        setIsLoading(true);
        // Имитация загрузки на сервер
        setTimeout(() => {
            setIsLoading(false);
            router.push("/reports/123");
        }, 2000);
    };

    const clearPreview = () => setPreview(null);

    return (
        <div className="w-full max-w-2xl mx-auto">
            {!preview ? (
                <div
                    className={`relative border-2 border-dashed rounded-3xl p-12 text-center transition-all duration-300 ${dragActive
                        ? "border-blue-500 bg-blue-500/10"
                        : "border-gray-700 bg-white/5 hover:border-gray-500"
                        }`}
                    onDragEnter={handleDrag}
                    onDragLeave={handleDrag}
                    onDragOver={handleDrag}
                    onDrop={handleDrop}
                >
                    <input
                        type="file"
                        className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
                        onChange={handleChange}
                        accept="image/*"
                    />

                    <div className="flex flex-col items-center">
                        <div className="w-20 h-20 rounded-2xl bg-linear-to-br from-gray-800 to-gray-900 flex items-center justify-center mb-6">
                            <Upload className="w-10 h-10 text-gray-400" />
                        </div>

                        <h3 className="text-xl font-semibold mb-2 text-white">
                            Загрузите фото лица
                        </h3>
                        <p className="text-gray-400 mb-6 max-w-sm">
                            Перетащите изображение сюда или нажмите для выбора.
                            Поддерживаются JPG, PNG до 10MB.
                        </p>

                        <div className="flex items-center space-x-2 text-sm text-gray-500">
                            <ImageIcon className="w-4 h-4" />
                            <span>Рекомендуемое разрешение: 1024×1024</span>
                        </div>
                    </div>
                </div>
            ) : (
                <div className="glass rounded-3xl p-8 border border-white/10">
                    <div className="relative aspect-square max-w-md mx-auto rounded-2xl overflow-hidden mb-6">
                        <Image
                            src={preview}
                            alt="Preview"
                            fill
                            className="object-cover"
                            sizes="(max-width: 768px) 100vw, 448px"
                        />
                        <button
                            onClick={clearPreview}
                            className="absolute top-4 right-4 p-2 bg-black/50 backdrop-blur-md rounded-full hover:bg-black/70 transition-colors"
                        >
                            <X className="w-5 h-5" />
                        </button>
                    </div>

                    <div className="flex justify-center space-x-4">
                        <Button
                            variant="outline"
                            onClick={clearPreview}
                            className="glass border-white/20"
                        >
                            Изменить фото
                        </Button>
                        <Button
                            onClick={handleSubmit}
                            disabled={isLoading}
                            className="bg-white text-black hover:bg-gray-200"
                        >
                            {isLoading ? (
                                <>
                                    <Loader2 className="mr-2 w-4 h-4 animate-spin" />
                                    Анализируем...
                                </>
                            ) : (
                                "Начать анализ"
                            )}
                        </Button>
                    </div>
                </div>
            )}
        </div>
    );
}