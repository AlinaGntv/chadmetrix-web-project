// components/navbar.tsx
"use client";

import Link from "next/link";
import { useState } from "react";
import { Menu, X, User, Sparkles } from "lucide-react";
import { Button } from "@/components/ui/button";

export function Navbar() {
    const [isOpen, setIsOpen] = useState(false);
    const [isLoggedIn] = useState(false); // Заглушка для авторизации

    return (
        <nav className="fixed top-0 w-full z-50 glass border-b border-white/10">
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                <div className="flex justify-between items-center h-16">
                    <Link href="/" className="flex items-center space-x-2 group">
                        <div className="w-8 h-8 rounded-lg bg-linear-to-br from-white to-gray-600 flex items-center justify-center">
                            <Sparkles className="w-5 h-5 text-black" />
                        </div>
                        <span className="text-xl font-bold tracking-tight text-gradient">
                            ChadMetrix
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
                        {isLoggedIn ? (
                            <Button variant="ghost" size="sm" className="glass">
                                <User className="w-4 h-4 mr-2" />
                                Профиль
                            </Button>
                        ) : (
                            <Link href="/login">
                                <Button variant="outline" size="sm" className="glass hover:bg-white/10">
                                    Войти
                                </Button>
                            </Link>
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
                        <Link href="/login" className="block px-3 py-2 text-base text-white font-medium">
                            Войти
                        </Link>
                    </div>
                </div>
            )}
        </nav>
    );
}