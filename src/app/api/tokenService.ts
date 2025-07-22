const TOKEN_KEY = 'auth_token';

export const tokenService = {
  setToken: (token: string) => {
    if (typeof window !== 'undefined') {
      //console.log('Guardando token:', token);
      localStorage.setItem(TOKEN_KEY, token);
    }
  },

  getToken: (): string | null => {
    if (typeof window !== 'undefined') {
      const token = localStorage.getItem(TOKEN_KEY);
      //console.log('Obteniendo token:', token);
      return token;
    }
    return null;
  },

  removeToken: () => {
    if (typeof window !== 'undefined') {
      //console.log('Eliminando token');
      localStorage.removeItem(TOKEN_KEY);
    }
  },

  getAuthHeader: (): { Authorization: string } | {} => {
    const token = tokenService.getToken();
    if (token) {
      //console.log('Generando header con token:', token);
      return { Authorization: `Bearer ${token}` };
    }
    //console.log('No hay token para el header');
    return {};
  }
}; 