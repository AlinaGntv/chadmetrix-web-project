// app/login/page.tsx
import Link from "next/link";
import { Chrome } from "lucide-react";
import { Button } from "@/components/ui/button";

export default function LoginPage() {
    return (
        <div className="min-h-screen flex items-center justify-center py-12 px-4 sm:px-6 lg:px-8">
            <div className="max-w-md w-full space-y-8 glass rounded-2xl p-8 border border-white/10">
                <div className="text-center">
                    <div className="mx-auto h-12 w-12 rounded-lg bg-linear-to-br from-white to-gray-600 flex items-center justify-center mb-4">
                        <Chrome className="h-6 w-6 text-black" />
                    </div>
                    <h2 className="text-3xl font-bold text-white mb-2">
                        Добро пожаловать
                    </h2>
                    <p className="text-gray-400">
                        Войдите через Google, чтобы получить доступ к анализу
                    </p>
                </div>

                <div className="mt-8 space-y-4">
                    <Button
                        className="w-full bg-white text-black hover:bg-gray-200 h-12 text-base font-medium group"
                        asChild
                    >
                        <Link href="/api/auth/login/google">
                            <Chrome className="mr-2 h-5 w-5 group-hover:scale-110 transition-transform" />
                            Войти через Google
                        </Link>
                    </Button>

                    <p className="text-center text-sm text-gray-500">
                        Продолжая, вы соглашаетесь с{" "}
                        <Link href="/terms" className="text-blue-400 hover:text-blue-300">
                            Условиями использования
                        </Link>
                    </p>
                </div>

                <div className="mt-6 text-center">
                    <Link href="/" className="text-sm text-gray-400 hover:text-white transition-colors">
                        ← Вернуться на главную
                    </Link>
                </div>
            </div>
        </div>
    );
}