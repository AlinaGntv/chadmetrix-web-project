// components/navbar.tsx
"use client";

import Link from "next/link";
import { useState } from "react";
import { Menu, X, User } from "lucide-react";
import Image from "next/image";
import { Button } from "@/components/ui/button";

export function Navbar() {
    const [isOpen, setIsOpen] = useState(false);
    const [isLoggedIn] = useState(false);

    return (
        <nav className="fixed top-0 w-full z-50 glass border-b border-white/10">
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                <div className="flex justify-between items-center h-16">
                    <Link href="/" className="flex items-center space-x-3 group">
                        {/* Логотип с рамкой и свечением */}
                        <div className="relative w-9 h-9 rounded-full overflow-hidden ring-2 ring-white/20 group-hover:ring-white/40 transition-all shadow-[0_0_15px_rgba(255,255,255,0.3)]">
                            <Image
                                src="/logo.png"
                                alt="ChadMetrix"
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