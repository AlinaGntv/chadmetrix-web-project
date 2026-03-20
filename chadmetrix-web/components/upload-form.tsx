"use client"

import { useState, useCallback } from "react"
import { useRouter } from "next/navigation"
import Image from "next/image"
import { Button } from "@/components/ui/button"
import { createAnalysis } from "@/lib/api"
import { Upload, X, Loader2, ImageIcon } from "lucide-react"

export function UploadForm() {
    const router = useRouter()
    const [file, setFile] = useState<File | null>(null)
    const [preview, setPreview] = useState<string | null>(null)
    const [isLoading, setIsLoading] = useState(false)
    const [isDragOver, setIsDragOver] = useState(false)
    const [error, setError] = useState<string | null>(null)

    const handleFile = useCallback((file: File) => {
        if (!file.type.startsWith("image/")) {
            setError("Пожалуйста, загрузите изображение")
            return
        }

        if (file.size > 10 * 1024 * 1024) {
            setError("Размер файла не должен превышать 10MB")
            return
        }

        setError(null)
        setFile(file)
        const reader = new FileReader()
        reader.onload = (e) => setPreview(e.target?.result as string)
        reader.readAsDataURL(file)
    }, [])

    const handleDrop = useCallback(
        (e: React.DragEvent) => {
            e.preventDefault()
            setIsDragOver(false)
            const droppedFile = e.dataTransfer.files[0]
            if (droppedFile) handleFile(droppedFile)
        },
        [handleFile]
    )

    const handleSubmit = async () => {
        if (!file) return

        setIsLoading(true)
        setError(null)

        try {
            const formData = new FormData()
            formData.append("image", file)
            const result = await createAnalysis(formData)
            router.push(`/reports/${result.id}`)
        } catch {
            setError("Не удалось проанализировать изображение. Пожалуйста, попробуйте снова.")
        } finally {
            setIsLoading(false)
        }
    }

    const clearFile = () => {
        setFile(null)
        setPreview(null)
        setError(null)
    }

    return (
        <div className="w-full max-w-xl">
            {!preview ? (
                <div
                    onDragOver={(e) => {
                        e.preventDefault()
                        setIsDragOver(true)
                    }}
                    onDragLeave={() => setIsDragOver(false)}
                    onDrop={handleDrop}
                    className={`relative flex min-h-[300px] cursor-pointer flex-col items-center justify-center rounded-2xl border-2 border-dashed transition-all ${isDragOver
                            ? "border-blue-500 bg-blue-500/10"
                            : "border-white/20 bg-white/5 hover:border-white/40 hover:bg-white/10"
                        }`}
                >
                    <input
                        type="file"
                        accept="image/*"
                        onChange={(e) => {
                            const selectedFile = e.target.files?.[0]
                            if (selectedFile) handleFile(selectedFile)
                        }}
                        className="absolute inset-0 cursor-pointer opacity-0"
                    />

                    <div className="flex flex-col items-center gap-4 p-8 text-center">
                        <div className="rounded-2xl bg-white/10 p-4">
                            <Upload className="h-8 w-8 text-zinc-400" />
                        </div>
                        <div>
                            <p className="text-lg font-medium text-white">
                                Перетащите фото сюда
                            </p>
                            <p className="mt-1 text-sm text-zinc-500">
                                или нажмите для выбора файла
                            </p>
                        </div>
                        <p className="text-xs text-zinc-600">
                            Поддерживаются JPG, PNG, WebP до 10MB
                        </p>
                    </div>
                </div>
            ) : (
                <div className="overflow-hidden rounded-2xl border border-white/10 bg-white/5">
                    <div className="relative aspect-square w-full">
                        <Image
                            src={preview}
                            alt="Предпросмотр"
                            fill
                            className="object-cover"
                            unoptimized
                        />
                        <button
                            onClick={clearFile}
                            className="absolute top-4 right-4 rounded-full bg-black/50 p-2 backdrop-blur-sm transition-colors hover:bg-black/70"
                        >
                            <X className="h-5 w-5 text-white" />
                        </button>
                    </div>

                    <div className="flex items-center gap-4 border-t border-white/10 p-4">
                        <div className="flex flex-1 items-center gap-3">
                            <div className="rounded-lg bg-white/10 p-2">
                                <ImageIcon className="h-5 w-5 text-zinc-400" />
                            </div>
                            <div className="min-w-0 flex-1">
                                <p className="truncate text-sm font-medium text-white">
                                    {file?.name}
                                </p>
                                <p className="text-xs text-zinc-500">
                                    {file && (file.size / 1024 / 1024).toFixed(2)} MB
                                </p>
                            </div>
                        </div>

                        <Button
                            onClick={handleSubmit}
                            disabled={isLoading}
                            className="rounded-xl bg-white px-6 text-black hover:bg-zinc-200"
                        >
                            {isLoading ? (
                                <>
                                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                                    Анализируем...
                                </>
                            ) : (
                                "Анализировать"
                            )}
                        </Button>
                    </div>
                </div>
            )}

            {error && (
                <div className="mt-4 rounded-xl border border-red-500/20 bg-red-500/10 p-4">
                    <p className="text-sm text-red-400">{error}</p>
                </div>
            )}
        </div>
    )
}