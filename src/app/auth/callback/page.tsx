// /auth/callback/page.js
import { Suspense } from 'react';
import AuthCallbackClient from './AuthCallbackClient'; // Asegúrate que la ruta sea correcta

// Este es el componente de carga que se mostrará mientras se resuelve el `Suspense`
function LoadingSpinner() {
    return (
        <div className="min-h-screen flex items-center justify-center bg-gray-100">
            <div className="text-center">
                <h1 className="text-2xl font-semibold text-gray-800 mb-4">
                    Procesando autenticación...
                </h1>
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500 mx-auto"></div>
            </div>
        </div>
    );
}

export default function AuthCallbackPage() {
    return (
        <Suspense fallback={<LoadingSpinner />}>
            <AuthCallbackClient />
        </Suspense>
    );
}