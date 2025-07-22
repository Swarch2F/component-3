// /auth/callback/AuthCallbackClient.js
'use client';

import { useEffect } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { tokenService } from '../../api/tokenService';
import { graphQLClient as client } from '../../api/graphqlClient';

export default function AuthCallbackClient() {
    const router = useRouter();
    const searchParams = useSearchParams();

    useEffect(() => {
        const handleCallback = async () => {
            try {
                //console.log('AuthCallback: Iniciando manejo de callback');
                
                // Primero intentamos obtener el token
                const token = searchParams.get('token');
                if (token) {
                    //console.log('AuthCallback: Token recibido del backend');
                    tokenService.setToken(token);
                    client.setHeader('Authorization', `Bearer ${token}`);
                    router.push('/');
                    return;
                }

                // Si no hay token, verificamos si es el callback de Google
                const code = searchParams.get('code');
                if (code) {
                    //console.log('AuthCallback: Código de Google recibido, redirigiendo al backend');
                    // Redirigir al backend para procesar el código
                    const backendURL = `http://localhost:8082/api/v1/auth/google/callback?code=${code}`;
                    window.location.href = backendURL;
                    return;
                }

                console.error('AuthCallback: No se recibió ni token ni código');
                router.push('/auth');
            } catch (error) {
                console.error('AuthCallback: Error en el callback:', error);
                router.push('/auth');
            }
        };

        handleCallback();
    }, [router, searchParams]);

    // Este componente no necesita renderizar nada visible, ya que su única
    // función es ejecutar el efecto y redirigir. Puedes devolver null.
    return null;
}