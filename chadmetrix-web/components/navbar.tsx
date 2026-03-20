"use client"

import Link from "next/link"
import { Button } from "@/components/ui/button"
import { useAuth } from "@/lib/hooks/useAuth"
import { Menu, X, Sparkles } from "lucide-react"
import { useState } from "react"

export function Navbar() {
    const { isAuthenticated, logout } = useAuth()
    const [isOpen, setIsOpen] = useState(false)

    return (
        <nav className="fixed top-0 left-0 right-0 z-50 border-b border-white/10 bg-black/50 backdrop-blur-xl">
            <div className="mx-auto flex h-16 max-w-6xl items-center justify-between px-6">
                <Link href="/" className="flex items-center gap-2 text-xl font-bold tracking-tight text-white">
                    <Sparkles className="h-5 w-5 text-blue-400" />
                    ChadMetrix
                </Link>

                <div className="hidden items-center gap-6 md:flex">
                    <Link
                        href="/#features"
                        className="text-sm text-zinc-400 transition-colors hover:text-white"
                    >
                        Возможности
                    </Link>
                    <Link
                        href="/#pricing"
                        className="text-sm text-zinc-400 transition-colors hover:text-white"
                    >
                        Тарифы
                    </Link>
                    <Link
                        href="/#faq"
                        className="text-sm text-zinc-400 transition-colors hover:text-white"
                    >
                        FAQ
                    </Link>
                    {isAuthenticated ? (
                        <>
                            <Link href="/dashboard">
                                <Button className="rounded-xl bg-white text-black hover:bg-zinc-200">
                                    Личный кабинет
                                </Button>
                            </Link>
                            <Button
                                onClick={logout}
                                variant="outline"
                                className="rounded-xl border-white/20 bg-white/5 text-white hover:bg-white/10"
                            >
                                Выйти
                            </Button>
                        </>
                    ) : (
                        <Link href="/login">
                            <Button className="rounded-xl bg-white text-black hover:bg-zinc-200">
                                Начать
                            </Button>
                        </Link>
                    )}
                </div>

                <button
                    className="text-white md:hidden"
                    onClick={() => setIsOpen(!isOpen)}
                >
                    {isOpen ? <X className="h-6 w-6" /> : <Menu className="h-6 w-6" />}
                </button>
            </div>

            {isOpen && (
                <div className="border-t border-white/10 bg-black/90 backdrop-blur-xl md:hidden">
                    <div className="flex flex-col gap-4 px-6 py-4">
                        <Link
                            href="/#features"
                            className="text-sm text-zinc-400 transition-colors hover:text-white"
                            onClick={() => setIsOpen(false)}
                        >
                            Возможности
                        </Link>
                        <Link
                            href="/#pricing"
                            className="text-sm text-zinc-400 transition-colors hover:text-white"
                            onClick={() => setIsOpen(false)}
                        >
                            Тарифы
                        </Link>
                        <Link
                            href="/#faq"
                            className="text-sm text-zinc-400 transition-colors hover:text-white"
                            onClick={() => setIsOpen(false)}
                        >
                            FAQ
                        </Link>
                        {isAuthenticated ? (
                            <>
                                <Link href="/dashboard" onClick={() => setIsOpen(false)}>
                                    <Button className="w-full rounded-xl bg-white text-black hover:bg-zinc-200">
                                        Личный кабинет
                                    </Button>
                                </Link>
                                <Button
                                    onClick={() => {
                                        logout()
                                        setIsOpen(false)
                                    }}
                                    variant="outline"
                                    className="w-full rounded-xl border-white/20 bg-white/5 text-white hover:bg-white/10"
                                >
                                    Выйти
                                </Button>
                            </>
                        ) : (
                            <Link href="/login" onClick={() => setIsOpen(false)}>
                                <Button className="w-full rounded-xl bg-white text-black hover:bg-zinc-200">
                                    Начать
                                </Button>
                            </Link>
                        )}
                    </div>
                </div>
            )}
        </nav>
    )
}