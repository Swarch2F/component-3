import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

export async function middleware(request: NextRequest) {
  const token = request.cookies.get('auth_token');

  // Rutas que requieren autenticación
  if (
    request.nextUrl.pathname.startsWith('/administrador') ||
    request.nextUrl.pathname.startsWith('/docente')
  ) {
    if (!token) {
      return NextResponse.redirect(new URL('/login', request.url));
    }

    try {
      // Verificar token con el servicio de auth
      const response = await fetch(`${process.env.NEXT_PUBLIC_AUTH_URL}/verify`, {
        headers: {
          'Authorization': `Bearer ${token.value}`
        }
      });

      if (!response.ok) {
        throw new Error('Invalid token');
      }
    } catch (error) {
      return NextResponse.redirect(new URL('/login', request.url));
    }
  }

  return NextResponse.next();
}

export const config = {
  matcher: ['/administrador/:path*', '/docente/:path*']
};