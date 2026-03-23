// components/navbar.tsx
"use client";

import Link from "next/link";
import { useState } from "react";
import { Menu, X, User, LogOut } from "lucide-react";
import { Button } from "@/components/ui/button";
import Image from "next/image";
import { useAuth } from "@/lib/hooks/useAuth";

export function Navbar() {
    const [isOpen, setIsOpen] = useState(false);
    const { user, isLoading, isAuthenticated, loginWithGoogle, logout } = useAuth();

    return (
        <nav className="fixed top-0 w-full z-50 glass border-b border-white/10">
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                <div className="flex justify-between items-center h-16">
                    <Link href="/" className="flex items-center space-x-3 group">
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
                            <span className="text-white group-hover:text-gray-300 transition-colors">chad</span>
                            <span className="text-gray-500 group-hover:text-gray-400 transition-colors">metrix</span>
                        </span>
                    </Link>

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
                        <Link href="/dashboard" className="text-sm text-gray-300 hover:text-white transition-colors">
                            Кабинет
                        </Link>
                    </div>

                    <div className="hidden md:flex items-center space-x-4">
                        {isLoading ? (
                            <div className="w-8 h-8 rounded-full bg-gray-800 animate-pulse" />
                        ) : isAuthenticated ? (
                            <div className="flex items-center space-x-3">
                                {user?.avatar_url ? (
                                    <Image
                                        src={user.avatar_url}
                                        alt={user.full_name || "User"}
                                        width={32}
                                        height={32}
                                        className="rounded-full"
                                    />
                                ) : (
                                    <div className="w-8 h-8 rounded-full bg-gray-700 flex items-center justify-center">
                                        <User className="w-4 h-4 text-gray-300" />
                                    </div>
                                )}
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
                                onClick={loginWithGoogle}
                                className="glass hover:bg-white/10"
                            >
                                Войти
                            </Button>
                        )}
                    </div>

                    <button
                        className="md:hidden p-2"
                        onClick={() => setIsOpen(!isOpen)}
                    >
                        {isOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
                    </button>
                </div>
            </div>

            {isOpen && (
                <div className="md:hidden glass border-t border-white/10">
                    <div className="px-4 pt-2 pb-3 space-y-1">
                        <Link href="/" className="block px-3 py-2 text-base text-gray-300 hover:text-white">
                            Главная
                        </Link>
                        <Link href="/analysis/new" className="block px-3 py-2 text-base text-gray-300 hover:text-white">
                            Анализ
                        </Link>
                        <Link href="/reports" className="block px-3 py-2 text-base text-gray-300 hover:text-white">
                            Отчёты
                        </Link>
                        <Link href="/dashboard" className="block px-3 py-2 text-base text-gray-300 hover:text-white">
                            Кабинет
                        </Link>
                        {!isAuthenticated && (
                            <button
                                onClick={loginWithGoogle}
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