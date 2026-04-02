// components/navbar.tsx
"use client";

import Link from "next/link";
import { useState, Suspense } from "react";
import { Menu, X, LogOut, User, CreditCard, Shield } from "lucide-react";
import { Button } from "@/components/ui/button";
import Image from "next/image";
import { useAuth } from "@/lib/hooks/useAuth";
import { useSearchParams } from "next/navigation";

// Отдельный компонент для кнопки логина с реферальным кодом
function LoginButton() {
    const searchParams = useSearchParams();
    const refCode = searchParams.get("ref");
    const { loginWithGoogle } = useAuth();

    const handleLogin = () => {
        loginWithGoogle(refCode || undefined);
    };

    return (
        <Button
            variant="outline"
            size="sm"
            onClick={handleLogin}
            className="glass hover:bg-white/10"
        >
            Войти
        </Button>
    );
}

// Fallback для Suspense
function LoginButtonFallback() {
    return (
        <Button
            variant="outline"
            size="sm"
            disabled
            className="glass hover:bg-white/10"
        >
            Войти
        </Button>
    );
}

export function Navbar() {
    const [isOpen, setIsOpen] = useState(false);

    const {
        user,
        isLoading,
        isAuthenticated,
        logout,
    } = useAuth();

    const isAdmin = user?.email === "gntv.surname@gmail.com";
    const userName = user?.full_name
        ? user.full_name
        : user?.email
            ? user.email.split("@")[0]
            : "User";

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

                    {/* DESKTOP NAV LINKS */}
                    <div className="hidden md:flex items-center space-x-8">
                        <Link href="/" className="text-sm text-gray-300 hover:text-white transition-colors">
                            Главная
                        </Link>
                        <Link href="/analysis/new" className="text-sm text-gray-300 hover:text-white transition-colors">
                            Анализ
                        </Link>
                        <Link href="/reports" className="text-sm text-gray-300 hover:text-white transition-colors">
                            Отчёты
                        </Link>
                        <Link href="/reviews" className="text-sm text-gray-300 hover:text-white transition-colors">
                            Отзывы
                        </Link>
                        <Link href="/dashboard" className="text-sm text-gray-300 hover:text-white transition-colors">
                            Кабинет
                        </Link>
                    </div>

                    {/* DESKTOP RIGHT SIDE */}
                    <div className="hidden md:flex items-center space-x-4">
                        {isLoading ? (
                            <div className="w-8 h-8 rounded-full bg-gray-800 animate-pulse" />
                        ) : isAuthenticated ? (
                            <div className="flex items-center space-x-3">
                                {/* USER NAME BOX */}
                                <div className="px-3 py-1.5 rounded-lg border border-white/15 bg-white/5 backdrop-blur text-sm text-white max-w-40 truncate">
                                    {userName}
                                </div>

                                {isAdmin && (
                                    <Link href="/admin" className="text-sm text-gray-300 hover:text-white transition-colors">
                                        Админ
                                    </Link>
                                )}

                                <Link href="/dashboard/subscription" className="text-sm text-gray-300 hover:text-white transition-colors">
                                    Подписка
                                </Link>

                                <Button variant="ghost" size="sm" onClick={logout} className="text-gray-300 hover:text-white">
                                    <LogOut className="w-4 h-4 mr-2" />
                                    Выйти
                                </Button>
                            </div>
                        ) : (
                            <Suspense fallback={<LoginButtonFallback />}>
                                <LoginButton />
                            </Suspense>
                        )}
                    </div>

                    {/* MOBILE MENU BUTTON */}
                    <button className="md:hidden p-2" onClick={() => setIsOpen(!isOpen)}>
                        {isOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
                    </button>
                </div>
            </div>

            {/* MOBILE MENU */}
            {isOpen && (
                <div className="md:hidden glass border-t border-white/10">
                    <div className="px-4 pt-2 pb-3 space-y-2">
                        {/* Информация о пользователе в мобильной версии */}
                        {isAuthenticated && (
                            <div className="px-3 py-3 mb-2 rounded-xl bg-white/5 border border-white/10">
                                <div className="flex items-center gap-3">
                                    <div className="w-10 h-10 rounded-full bg-linear-to-br from-gray-700 to-gray-900 flex items-center justify-center">
                                        <User className="w-5 h-5 text-gray-400" />
                                    </div>
                                    <div className="flex-1">
                                        <p className="text-white font-medium">{userName}</p>
                                        <p className="text-xs text-gray-500">{user?.email}</p>
                                    </div>
                                </div>
                            </div>
                        )}

                        {/* Навигационные ссылки */}
                        <Link
                            href="/"
                            className="flex items-center gap-3 px-3 py-2 text-base text-gray-300 hover:text-white hover:bg-white/5 rounded-lg transition-colors"
                            onClick={() => setIsOpen(false)}
                        >
                            Главная
                        </Link>

                        <Link
                            href="/analysis/new"
                            className="flex items-center gap-3 px-3 py-2 text-base text-gray-300 hover:text-white hover:bg-white/5 rounded-lg transition-colors"
                            onClick={() => setIsOpen(false)}
                        >
                            Анализ
                        </Link>

                        <Link
                            href="/reports"
                            className="flex items-center gap-3 px-3 py-2 text-base text-gray-300 hover:text-white hover:bg-white/5 rounded-lg transition-colors"
                            onClick={() => setIsOpen(false)}
                        >
                            Отчёты
                        </Link>

                        <Link
                            href="/reviews"
                            className="flex items-center gap-3 px-3 py-2 text-base text-gray-300 hover:text-white hover:bg-white/5 rounded-lg transition-colors"
                            onClick={() => setIsOpen(false)}
                        >
                            Отзывы
                        </Link>

                        <Link
                            href="/dashboard"
                            className="flex items-center gap-3 px-3 py-2 text-base text-gray-300 hover:text-white hover:bg-white/5 rounded-lg transition-colors"
                            onClick={() => setIsOpen(false)}
                        >
                            Кабинет
                        </Link>

                        {/* Ссылка на подписку для мобильной версии */}
                        {isAuthenticated && (
                            <Link
                                href="/dashboard/subscription"
                                className="flex items-center gap-3 px-3 py-2 text-base text-gray-300 hover:text-white hover:bg-white/5 rounded-lg transition-colors"
                                onClick={() => setIsOpen(false)}
                            >
                                <CreditCard className="w-5 h-5" />
                                Подписка
                            </Link>
                        )}

                        {/* Ссылка на админку для мобильной версии */}
                        {isAdmin && (
                            <Link
                                href="/admin"
                                className="flex items-center gap-3 px-3 py-2 text-base text-gray-300 hover:text-white hover:bg-white/5 rounded-lg transition-colors"
                                onClick={() => setIsOpen(false)}
                            >
                                <Shield className="w-5 h-5" />
                                Админ-панель
                            </Link>
                        )}

                        {/* Кнопка выхода для мобильной версии */}
                        {isAuthenticated && (
                            <button
                                onClick={() => {
                                    logout();
                                    setIsOpen(false);
                                }}
                                className="flex items-center gap-3 w-full px-3 py-2 text-base text-red-400 hover:text-red-300 hover:bg-red-500/10 rounded-lg transition-colors"
                            >
                                <LogOut className="w-5 h-5" />
                                Выйти
                            </button>
                        )}

                        {/* Кнопка входа для мобильной версии */}
                        {!isAuthenticated && (
                            <Suspense fallback={
                                <button className="flex items-center gap-3 w-full px-3 py-2 text-base text-white/50 font-medium" disabled>
                                    Войти
                                </button>
                            }>
                                <MobileLoginButton />
                            </Suspense>
                        )}
                    </div>
                </div>
            )}
        </nav>
    );
}

// Мобильная версия кнопки логина
function MobileLoginButton() {
    const searchParams = useSearchParams();
    const refCode = searchParams.get("ref");
    const { loginWithGoogle } = useAuth();

    const handleLogin = () => {
        loginWithGoogle(refCode || undefined);
    };

    return (
        <button
            onClick={handleLogin}
            className="flex items-center gap-3 w-full px-3 py-2 text-base text-white font-medium hover:bg-white/5 rounded-lg transition-colors"
        >
            Войти
        </button>
    );
}