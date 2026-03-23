import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

export function middleware(request: NextRequest) {
    const token = request.cookies.get('token'); // Было 'access_token', стало 'token'
    const pathname = request.nextUrl.pathname;

    const isAuthPage = pathname === '/login' || pathname.startsWith('/auth/');
    const isProtectedPage =
        pathname.startsWith('/dashboard') ||
        pathname.startsWith('/analysis') ||
        pathname.startsWith('/reports');

    // Если нет токена и пытаемся зайти на защищенную страницу
    if (!token && isProtectedPage) {
        return NextResponse.redirect(new URL('/login', request.url));
    }

    // Если есть токен и пытаемся зайти на страницу логина
    if (token && isAuthPage) {
        return NextResponse.redirect(new URL('/dashboard', request.url));
    }

    return NextResponse.next();
}

export const config = {
    matcher: ['/((?!api|_next/static|_next/image|favicon.ico|logo.png).*)'],
};