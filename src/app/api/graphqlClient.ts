import { GraphQLClient } from 'graphql-request';
import { tokenService } from './tokenService';

// URL base para las peticiones GraphQL
const API_BASE = process.env.NEXT_PUBLIC_API_BASE || 'http://localhost:9000';

// Cliente GraphQL con manejo automático de tokens
const client = new GraphQLClient(`${API_BASE}/graphql`, {
  headers: {
    'Content-Type': 'application/json',
    ...tokenService.getAuthHeader()
  },
  requestMiddleware: (request) => {
    const token = typeof window !== 'undefined' ? localStorage.getItem('auth_token') : null;
    if (token && request.headers) {
      const headers = new Headers(request.headers);
      headers.set('Authorization', `Bearer ${token}`);
      request.headers = headers;
    }
    return request;
  }
});

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
