import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

export function middleware(request: NextRequest) {
    const token = request.cookies.get("token");
    const { pathname } = request.nextUrl;

    // Публичные страницы
    const publicPaths = [
        "/",
        "/login",
    ];

    const isPublic =
        publicPaths.includes(pathname) ||
        pathname.startsWith("/auth") ||
        pathname.startsWith("/api") ||
        pathname.startsWith("/_next") ||
        pathname.startsWith("/favicon") ||
        pathname.includes(".");

    const isProtected =
        pathname.startsWith("/dashboard") ||
        pathname.startsWith("/analysis") ||
        pathname.startsWith("/reports");

    // ❌ не авторизован → защищённая страница
    if (!token && isProtected) {
        const url = new URL("/login", request.url);
        url.searchParams.set("from", pathname);
        return NextResponse.redirect(url);
    }

    // ✅ авторизован → не должен идти на login
    if (token && pathname === "/login") {
        return NextResponse.redirect(new URL("/dashboard", request.url));
    }

    return NextResponse.next();
}

export const config = {
    matcher: ["/((?!_next|favicon.ico|logo.png).*)"],
};