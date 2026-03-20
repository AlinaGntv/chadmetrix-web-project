import Link from "next/link"

export function Footer() {
    return (
        <footer className="border-t border-white/10 bg-black">
            <div className="mx-auto max-w-6xl px-6 py-12">
                <div className="grid gap-8 md:grid-cols-4">
                    <div className="md:col-span-1">
                        <Link href="/" className="text-xl font-bold text-white">
                            ChadMetrix
                        </Link>
                        <p className="mt-4 text-sm text-zinc-500">
                            AI-анализ внешности по 17 метрикам
                        </p>
                    </div>

                    <div>
                        <h4 className="mb-4 text-sm font-semibold text-white">Продукт</h4>
                        <ul className="space-y-2">
                            <li>
                                <Link
                                    href="/#features"
                                    className="text-sm text-zinc-500 transition-colors hover:text-white"
                                >
                                    Возможности
                                </Link>
                            </li>
                            <li>
                                <Link
                                    href="/#pricing"
                                    className="text-sm text-zinc-500 transition-colors hover:text-white"
                                >
                                    Тарифы
                                </Link>
                            </li>
                            <li>
                                <Link
                                    href="/#faq"
                                    className="text-sm text-zinc-500 transition-colors hover:text-white"
                                >
                                    FAQ
                                </Link>
                            </li>
                        </ul>
                    </div>

                    <div>
                        <h4 className="mb-4 text-sm font-semibold text-white">Правовая информация</h4>
                        <ul className="space-y-2">
                            <li>
                                <Link
                                    href="/privacy"
                                    className="text-sm text-zinc-500 transition-colors hover:text-white"
                                >
                                    Политика конфиденциальности
                                </Link>
                            </li>
                            <li>
                                <Link
                                    href="/terms"
                                    className="text-sm text-zinc-500 transition-colors hover:text-white"
                                >
                                    Условия использования
                                </Link>
                            </li>
                        </ul>
                    </div>

                    <div>
                        <h4 className="mb-4 text-sm font-semibold text-white">Связь</h4>
                        <ul className="space-y-2">
                            <li>
                                <a
                                    href="https://twitter.com"
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    className="text-sm text-zinc-500 transition-colors hover:text-white"
                                >
                                    Twitter
                                </a>
                            </li>
                            <li>
                                <a
                                    href="https://discord.com"
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    className="text-sm text-zinc-500 transition-colors hover:text-white"
                                >
                                    Discord
                                </a>
                            </li>
                        </ul>
                    </div>
                </div>

                <div className="mt-12 border-t border-white/10 pt-8">
                    <p className="text-center text-sm text-zinc-600">
                        &copy; {new Date().getFullYear()} ChadMetrix. Все права защищены.
                    </p>
                </div>
            </div>
        </footer>
    )
}