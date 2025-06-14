import { NextResponse } from 'next/server';
import { cookies } from 'next/headers';

export async function POST(request: Request) {
  const { email, password } = await request.json();

  try {
    // Llamar al servicio de auth
    const response = await fetch(`${process.env.NEXT_PUBLIC_AUTH_URL}/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email, password }),
    });

    if (!response.ok) {
      throw new Error('Invalid credentials');
    }

    const data = await response.json();

    // Establecer cookie httpOnly
    (await cookies()).set('auth_token', data.token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'strict',
      maxAge: 60 * 60 * 24 // 24 horas
    });

    return NextResponse.json({ user: data.user });
  } catch (error) {
    return NextResponse.json(
      { error: 'Invalid credentials' },
      { status: 401 }
    );
  }
}

export async function GET() {
  const token = (await cookies()).get('auth_token');

  if (!token) {
    return NextResponse.json(
      { error: 'Not authenticated' },
      { status: 401 }
    );
  }

  try {
    // Verificar token con el servicio de auth
    const response = await fetch(`${process.env.NEXT_PUBLIC_AUTH_URL}/me`, {
      headers: {
        'Authorization': `Bearer ${token.value}`
      }
    });

    if (!response.ok) {
      throw new Error('Invalid token');
    }

    const userData = await response.json();
    return NextResponse.json(userData);
  } catch (error) {
    return NextResponse.json(
      { error: 'Invalid token' },
      { status: 401 }
    );
  }
}

export async function DELETE() {
  (await cookies()).delete('auth_token');
  return NextResponse.json({ success: true });
}