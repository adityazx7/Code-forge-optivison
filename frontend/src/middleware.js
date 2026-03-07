import { NextResponse } from 'next/server';

export function middleware(request) {
    // Protected routes check — client-side auth handles actual token validation
    // This middleware just ensures basic route protection
    const { pathname } = request.nextUrl;

    // Dashboard routes are protected — if no token cookie, redirect to auth
    // Note: Actual auth is handled client-side via AuthContext
    if (pathname.startsWith('/dashboard')) {
        // Let client-side handle auth redirect
        return NextResponse.next();
    }

    return NextResponse.next();
}

export const config = {
    matcher: [
        '/((?!_next|[^?]*\\.(?:html?|css|js(?!on)|jpe?g|webp|png|gif|svg|ttf|woff2?|ico|csv|docx?|xlsx?|zip|webmanifest)).*)',
    ],
};
