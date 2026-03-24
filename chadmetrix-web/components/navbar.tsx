"use client";

import Link from "next/link";
import { useState } from "react";
import { Menu, X, LogOut } from "lucide-react";
import { Button } from "@/components/ui/button";
import Image from "next/image";
import { useAuth } from "@/lib/hooks/useAuth";
import { useSearchParams } from "next/navigation";

export function Navbar() {
    const [isOpen, setIsOpen] = useState(false);

    // Получаем реферальный код из URL (?ref=xxx)
    const searchParams = useSearchParams();
    const refCode = searchParams.get("ref");

    const {
        user,
        isLoading,
        isAuthenticated,
        loginWithGoogle,
        logout,
    } = useAuth();

    // Обработчик логина с передачей реферального кода
    const handleLogin = () => {
        loginWithGoogle(refCode || undefined);
    };

    return (
        <nav className="fixed top-0 w-full z-50 glass border-b border-white/10">
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">

                <div className="flex justify-between items-center h-16">

                    {/* LOGO */}

                    <Link
                        href="/"
                        className="flex items-center space-x-3 group"
                    >
                        <div className="relative w-9 h-9 rounded-full overflow-hidden ring-2 ring-white/20 group-hover:ring-white/40 transition-all shadow-[0_0_15px_rgba(255,255,255,0.3)]">
                            <Image
                                src="/logo.png"
                                alt="chadmetrix"
                                fill
                                className="object-cover"
                                priority
                            />
                        </div>

                        <span className="text-xl font-bold tracking-tight">
                            <span className="text-white group-hover:text-gray-300 transition-colors">
                                chad
                            </span>
                            <span className="text-gray-500 group-hover:text-gray-400 transition-colors">
                                metrix
                            </span>
                        </span>
                    </Link>

                    {/* NAV LINKS */}

                    <div className="hidden md:flex items-center space-x-8">

                        <Link
                            href="/"
                            className="text-sm text-gray-300 hover:text-white transition-colors"
                        >
                            Главная
                        </Link>

                        <Link
                            href="/analysis/new"
                            className="text-sm text-gray-300 hover:text-white transition-colors"
                        >
                            Анализ
                        </Link>

                        <Link
                            href="/reports"
                            className="text-sm text-gray-300 hover:text-white transition-colors"
                        >
                            Отчёты
                        </Link>

                        <Link
                            href="/dashboard"
                            className="text-sm text-gray-300 hover:text-white transition-colors"
                        >
                            Кабинет
                        </Link>

                    </div>

                    {/* RIGHT SIDE */}

                    <div className="hidden md:flex items-center space-x-4">

                        {isLoading ? (

                            <div className="w-8 h-8 rounded-full bg-gray-800 animate-pulse" />

                        ) : isAuthenticated ? (

                            <div className="flex items-center space-x-3">

                                {/* USER NAME BOX */}

                                <div
                                    className="
                                        px-3 py-1.5
                                        rounded-lg
                                        border border-white/15
                                        bg-white/5
                                        backdrop-blur
                                        text-sm
                                        text-white
                                        max-w-40
                                        truncate
                                    "
                                >
                                    {user?.full_name
                                        ? user.full_name
                                        : user?.email
                                            ? user.email.split("@")[0]
                                            : "User"}
                                </div>

                                {/* LOGOUT */}

                                <Button
                                    variant="ghost"
                                    size="sm"
                                    onClick={logout}
                                    className="text-gray-300 hover:text-white"
                                >
                                    <LogOut className="w-4 h-4 mr-2" />
                                    Выйти
                                </Button>

                            </div>

                        ) : (

                            <Button
                                variant="outline"
                                size="sm"
                                onClick={handleLogin}  // ← изменено: handleLogin вместо loginWithGoogle
                                className="glass hover:bg-white/10"
                            >
                                Войти
                            </Button>

                        )}

                    </div>

                    {/* MOBILE BUTTON */}

                    <button
                        className="md:hidden p-2"
                        onClick={() => setIsOpen(!isOpen)}
                    >
                        {isOpen ? (
                            <X className="w-6 h-6" />
                        ) : (
                            <Menu className="w-6 h-6" />
                        )}
                    </button>

                </div>
            </div>

            {/* MOBILE MENU */}

            {isOpen && (

                <div className="md:hidden glass border-t border-white/10">

                    <div className="px-4 pt-2 pb-3 space-y-1">

                        <Link
                            href="/"
                            className="block px-3 py-2 text-base text-gray-300 hover:text-white"
                        >
                            Главная
                        </Link>

                        <Link
                            href="/analysis/new"
                            className="block px-3 py-2 text-base text-gray-300 hover:text-white"
                        >
                            Анализ
                        </Link>

                        <Link
                            href="/reports"
                            className="block px-3 py-2 text-base text-gray-300 hover:text-white"
                        >
                            Отчёты
                        </Link>

                        <Link
                            href="/dashboard"
                            className="block px-3 py-2 text-base text-gray-300 hover:text-white"
                        >
                            Кабинет
                        </Link>

                        {!isAuthenticated && (

                            <button
                                onClick={handleLogin}  // ← изменено: handleLogin вместо loginWithGoogle
                                className="block w-full text-left px-3 py-2 text-base text-white font-medium"
                            >
                                Войти
                            </button>

                        )}

                    </div>

                </div>

            )}

        </nav>
    );
}