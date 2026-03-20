import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

export function middleware(request: NextRequest) {
    const token = request.cookies.get('access_token');
    const isAuthPage = request.nextUrl.pathname === '/login';
    const isProtectedPage =
        request.nextUrl.pathname.startsWith('/dashboard') ||
        request.nextUrl.pathname.startsWith('/analysis') ||
        request.nextUrl.pathname.startsWith('/reports');

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
    matcher: ['/dashboard/:path*', '/analysis/:path*', '/reports/:path*', '/login'],
};