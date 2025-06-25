import { Suspense } from 'react';
import AuthClientComponent from './AuthClientComponent';

// Un componente de carga simple para el fallback
function Loading() {
  return (
    <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100vh' }}>
      <h2>Cargando...</h2>
    </div>
  );
}

export default function AuthPage() {
  return (
    // Envolvemos el componente cliente en Suspense
    <Suspense fallback={<Loading />}>
      <AuthClientComponent />
    </Suspense>
  );
}