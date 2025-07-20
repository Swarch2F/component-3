import { GraphQLClient } from 'graphql-request';
import { tokenService } from './tokenService';

// URL base para las peticiones GraphQL - se obtiene dinámicamente
let API_BASE = 'https://localhost:444/graphql'; // valor por defecto para desarrollo

// Función para obtener la configuración dinámica
async function getConfig() {
  try {
    const response = await fetch('/api/config');
    const config = await response.json();
    API_BASE = config.apiBase;
    console.log('Config loaded:', config);
  } catch (error) {
    console.warn('Could not load config, using default:', error);
  }
}

// Cliente GraphQL con manejo automático de tokens
const client = new GraphQLClient(`${API_BASE}/graphql`, {
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
  // Actualizar el cliente con la nueva URL
  client.setEndpoint(`${API_BASE}/graphql`);
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
