import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

export function middleware(request: NextRequest) {
    const token = request.cookies.get('token');
    const pathname = request.nextUrl.pathname;

    // Публичные маршруты
    const isPublicPage =
        pathname === '/' ||
        pathname === '/login' ||
        pathname.startsWith('/auth/') ||
        pathname.startsWith('/_next') ||
        pathname.includes('.'); // статические файлы

    // Защищенные маршруты
    const isProtectedPage =
        pathname.startsWith('/dashboard') ||
        pathname.startsWith('/analysis') ||
        pathname.startsWith('/reports');

    // Если пользователь не авторизован и пытается зайти на защищенную страницу
    if (!token && isProtectedPage) {
        const loginUrl = new URL('/login', request.url);
        loginUrl.searchParams.set('from', pathname);
        return NextResponse.redirect(loginUrl);
    }

    // Если пользователь авторизован и пытается зайти на страницу логина
    if (token && pathname === '/login') {
        return NextResponse.redirect(new URL('/dashboard', request.url));
    }

    // Если пользователь авторизован и пытается зайти на /auth/callback
    if (token && pathname.startsWith('/auth/')) {
        return NextResponse.redirect(new URL('/dashboard', request.url));
    }

    return NextResponse.next();
}

export const config = {
    matcher: ['/((?!api|_next/static|_next/image|favicon.ico|logo.png).*)'],
};