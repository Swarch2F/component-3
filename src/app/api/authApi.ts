import { GraphQLClient } from 'graphql-request';
import { tokenService } from './tokenService';

// URL base para las peticiones GraphQL - se obtiene dinámicamente
let API_BASE = 'https://localhost:444/graphql'; // valor por defecto para desarrollo

// Función para obtener la configuración dinámica
async function getConfig() {
  try {
    const response = await fetch('/config.json');
    const config = await response.json();
    API_BASE = config.apiBase;
    //console.log('Auth API Config loaded:', config);
  } catch (error) {
    console.warn('Could not load config for auth API, using default:', error);
  }
}

// Cliente GraphQL con configuración dinámica
const client = new GraphQLClient(API_BASE, {
  headers: tokenService.getAuthHeader()
});

// Función para actualizar el cliente con nueva configuración
export const updateAuthClientConfig = async () => {
  await getConfig();
  client.setEndpoint(API_BASE);
};

// --- Queries ---
export const GET_AUTH_STATUS = `
  query {
    authStatus {
      user {
        id
        name
        email
        role
      }
      isAuthenticated
    }
  }
`;

export const GET_GOOGLE_LOGIN_URL = `
  query {
    getGoogleLoginUrl {
      googleUrl
      message
    }
  }
`;

// --- Mutations ---
export const LOGIN_USER = `
  mutation LoginUser($input: LoginInput!) {
    loginUser(input: $input) {
      message
      token
    }
  }
`;

export const REGISTER_USER = `
  mutation RegisterUser($input: RegisterInput!) {
    registerUser(input: $input) {
      message
    }
  }
`;

export const LOGOUT = `
  mutation {
    logout {
      message
    }
  }
`;

// --- Interfaces ---
export interface User {
  id: string;
  name: string;
  email: string;
  role: string;
}

export interface AuthStatus {
  user: User;
  isAuthenticated: boolean;
}

export interface LoginResponse {
  message: string;
  token: string;
}

export interface RegisterResponse {
  message: string;
}

export interface GoogleLoginResponse {
  googleUrl: string;
  message: string;
}

export interface LogoutResponse {
  message: string;
}

interface GraphQLResponse<T> {
  [key: string]: T;
}

interface AuthStatusResponse {
    authStatus: AuthStatus;
}

// --- Funciones para consumir el API ---
export async function loginUser(email: string, password: string): Promise<LoginResponse> {
  //console.log('Iniciando login con:', { email });
  try {
    const response = await client.request<GraphQLResponse<LoginResponse>>(`
      mutation LoginUser($input: LoginInput!) {
        loginUser(input: $input) {
          message
          token
        }
      }
    `, {
      input: { email, password }
    });

    //console.log('Respuesta del login desde aithApi.ts:', response);
    
    if (response.loginUser?.token) {
      tokenService.setToken(response.loginUser.token);
      // Actualizar el cliente con el nuevo token
      client.setHeader('Authorization', `Bearer ${response.loginUser.token}`);
    }

    return {
      message: response.loginUser?.message || 'Error al iniciar sesión',
      token: response.loginUser?.token || ''
    };
  } catch (error) {
    console.error('Error en login:', error);
    return {
      message: 'Error al iniciar sesión',
      token: ''
    };
  }
}

export async function registerUser(email: string, password: string, name: string, role: string): Promise<RegisterResponse> {
  try {
    //console.log('Iniciando registro con:', { email, name, role });
    const result = await client.request<GraphQLResponse<RegisterResponse>>(REGISTER_USER, {
      input: { email, password, name, role }
    });
    //console.log('Respuesta del registro:', result);
    return result.registerUser;
  } catch (error) {
    console.error('Error en registerUser:', error);
    return { message: 'Error al registrar usuario' };
  }
}

export async function getAuthStatus(): Promise<AuthStatus> {
  //console.log('Verificando estado de autenticación...');
  try {
    const response = await client.request<GraphQLResponse<AuthStatus>>(`
      query {
        authStatus {
          user {
            id
            name
            email
            role
          }
          isAuthenticated
        }
      }
    `);
    //console.log('Respuesta de auth status:', response);
    return response.authStatus;
  } catch (error) {
    console.error('Error al verificar estado de autenticación:', error);
    return {
      user: { id: '', name: 'Anónimo', email: '', role: 'guest' },
      isAuthenticated: false
    };
  }
}

export async function getGoogleLoginUrl(): Promise<GoogleLoginResponse> {
  try {
    //console.log('Obteniendo URL de login con Google...');
    const result = await client.request<GraphQLResponse<GoogleLoginResponse>>(GET_GOOGLE_LOGIN_URL);
    //console.log('Respuesta de Google URL:', result);
    return result.getGoogleLoginUrl;
  } catch (error) {
    console.error('Error en getGoogleLoginUrl:', error);
    return { googleUrl: '', message: 'Error al obtener URL de Google' };
  }
}

export async function logout(): Promise<LogoutResponse> {
  try {
    const response = await client.request<GraphQLResponse<LogoutResponse>>(`
      mutation {
        logout {
          message
        }
      }
    `);
    tokenService.removeToken();
    client.setHeader('Authorization', '');
    return response.logout;
  } catch (error) {
    console.error('Error en logout:', error);
    return { message: 'Error al cerrar sesión' };
  }
}

export async function checkAuthStatus(): Promise<AuthStatus> {
    try {
        const response = await client.request<AuthStatusResponse>(`
            query {
                authStatus {
                    user {
                        id
                        name
                        email
                        role
                    }
                    isAuthenticated
                }
            }
        `);
        return response.authStatus;
    } catch (error) {
        console.error('Error al verificar estado de autenticación:', error);
        return {
            user: {
                id: '',
                name: 'Anónimo',
                email: '',
                role: ''
            },
            isAuthenticated: false
        };
    }
}

export async function checkEmailExists(email: string): Promise<boolean> {
  try {
    const response = await client.request<{ emailExists: boolean }>(
      `mutation($email: String!) { emailExists(email: $email) }`,
      { email }
    );
    return !!response.emailExists;
  } catch (error) {
    console.error('Error verificando existencia de email:', error);
    return false;
  }
}