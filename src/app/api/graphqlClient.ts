import { GraphQLClient } from 'graphql-request';
import { tokenService } from './tokenService';

// Un valor inicial que sea una URL válida, aunque sea temporal
let API_BASE = 'http://localhost/graphql'; 

// --- CORRECCIÓN ---
// Ahora esta función construye la URL completa y correcta.
async function getConfig() {
  // Solo se ejecuta en el navegador
  if (typeof window === 'undefined') return;
  
  try {
    // 1. Obtiene la ruta base de la API (ej: "/graphql") desde el config.json
    const response = await fetch('/config.json');
    const config = await response.json();
    const apiPath = config.apiBase; // Debería ser "/graphql"

    // 2. Construye la URL completa usando el dominio actual de la ventana
    //    Esto resulta en "https://gradex.space/graphql"
    API_BASE = `${window.location.origin}${apiPath}`;
    
  } catch (error) {
    console.warn('No se pudo cargar la configuración, usando valores por defecto:', error);
    // Como fallback, intenta usar el path relativo (puede que no funcione con esta librería)
    API_BASE = '/graphql';
  }
}

// Cliente GraphQL con manejo automático de tokens
const client = new GraphQLClient(API_BASE, {
  headers: {
    'Content-Type': 'application/json',
    ...tokenService.getAuthHeader()
  },
  requestMiddleware: (request: any) => {
    const token = typeof window !== 'undefined' ? localStorage.getItem('auth_token') : null;
    if (token && request.headers) {
      const headers = new Headers(request.headers);
      headers.set('Authorization', `Bearer ${token}`);
      request.headers = headers;
    }
    return request;
  }
});

// Función para actualizar el cliente con nueva configuración
export const updateClientConfig = async () => {
  await getConfig();
  // Actualizar el cliente con la nueva URL completa
  client.setEndpoint(API_BASE);
};

// Función para actualizar el header de autorización
export const updateAuthHeader = () => {
    const authHeader = tokenService.getAuthHeader();
    if ('Authorization' in authHeader) {
        client.setHeader('Authorization', authHeader.Authorization);
    } else {
        client.setHeader('Authorization', '');
    }
};

export { client as graphQLClient };
