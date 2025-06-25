"use client";

import React, { useState, useEffect } from 'react';
import styles from './AuthPage.module.css';
import { 
  loginUser, 
  registerUser, 
  getAuthStatus, 
  logout, 
  getGoogleLoginUrl,
  LoginResponse,
  RegisterResponse,
  AuthStatus,
  LogoutResponse,
  GoogleLoginResponse,
  checkAuthStatus,
  User
} from '../api/authApi';
import { useRouter, useSearchParams } from 'next/navigation';
import { tokenService } from '../api/tokenService';

// ... (Aquí van tus definiciones de tipos: UserInfo, MessageResponse, etc. No las repito por brevedad) ...

// Cambiamos el nombre del componente
export default function AuthClientComponent() {
  const router = useRouter();
  const searchParams = useSearchParams();

  // ... TODO tu código existente va aquí sin cambios ...
  // (useState, handleRegisterSubmit, handleLoginSubmit, verifyAuthStatus, handleGoogleLogin, handleLogout, useEffects, y todo el JSX)
  const [registerEmail, setRegisterEmail] = useState('');
  const [registerName, setRegisterName] = useState('');
  const [registerPassword, setRegisterPassword] = useState('');
  const [registerRole, setRegisterRole] = useState('ESTUDIANTE');

  const [loginEmail, setLoginEmail] = useState('');
  const [loginPassword, setLoginPassword] = useState('');

  // Estado para los resultados
  const [registerResult, setRegisterResult] = useState<{ message: string; isError: boolean } | null>(null);
  const [loginResult, setLoginResult] = useState<{ message: string; isError: boolean } | null>(null);
  const [authStatusResult, setAuthStatusResult] = useState<{ message: string; isError: boolean } | null>(null);
  const [userInfo, setUserInfo] = useState<User | null>(null);
  const [isAuthenticated, setIsAuthenticated] = useState<boolean>(false);

  const showResult = (
    setter: React.Dispatch<React.SetStateAction<{ message: string; isError: boolean } | null>>,
    message: string,
    isError = false
  ) => {
    setter({ message, isError });
    // Limpiar el mensaje después de un tiempo si no es un error
    if (!isError) {
      setTimeout(() => setter(null), 5000);
    }
  };

  const handleRegisterSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setRegisterResult(null);
    try {
      const result = await registerUser(
        registerEmail,
        registerPassword,
        registerName,
        registerRole
      ) as RegisterResponse;
    

      if ('error' in result) {
        showResult(setRegisterResult, `Error: ${result.error}`, true);
      } else {
        showResult(setRegisterResult, '¡Registro exitoso! Ahora puedes iniciar sesión.');
        setRegisterEmail('');
        setRegisterName('');
        setRegisterPassword('');
        setRegisterRole('ESTUDIANTE');
      }
    } catch (error) {
      showResult(setRegisterResult, 'Error de conexión', true);
      console.error('Error de registro:', error);
    }
  };

  const handleLoginSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoginResult(null);
    setUserInfo(null);
    setIsAuthenticated(false);

    try {
      console.log('Intentando login con:', { email: loginEmail });
      const result = await loginUser(loginEmail, loginPassword) as LoginResponse;
      console.log('Respuesta del login desde page.tsx:', result);

      // Verificar cookies después del login
      console.log('Cookies después del login:', document.cookie);

      if ('error' in result) {
        showResult(setLoginResult, `Error: ${result.error}`, true);
      } else {
        showResult(setLoginResult, '¡Inicio de sesión exitoso! El token JWT ha sido establecido en una cookie.');
        setLoginEmail('');
        setLoginPassword('');
        // Vuelve a verificar el estado de autenticación después del login
        verifyAuthStatus();
      }
    } catch (error) {
      console.error('Error completo del login:', error);
      showResult(setLoginResult, 'Error de conexión', true);
    }
  };

  const verifyAuthStatus = async () => {
    setAuthStatusResult(null);
    setUserInfo(null);
    setIsAuthenticated(false);

    try {
      console.log('Verificando estado de autenticación...');
      console.log('Cookies antes de verificar estado:', document.cookie);
      
      const result = await getAuthStatus() as AuthStatus;
      console.log('Respuesta del estado de autenticación:', result);
      
      if ('error' in result) {
        console.error('Error en estado de autenticación:', result.error);
        showResult(setAuthStatusResult, `Error: ${result.error}`, true);
        setUserInfo(null);
        setIsAuthenticated(false);
      } else {
        showResult(setAuthStatusResult, 'Estado de autenticación obtenido exitosamente');
        setUserInfo(result.user as User);
        setIsAuthenticated(result.isAuthenticated);
      }
    } catch (error) {
      console.error('Error completo al verificar estado:', error);
      showResult(setAuthStatusResult, 'Error de conexión', true);
      setUserInfo(null);
      setIsAuthenticated(false);
    }
  };

  const handleGoogleLogin = async () => {
    try {
      const result = await getGoogleLoginUrl() as GoogleLoginResponse;
      if ('error' in result) {
        showResult(setLoginResult, `Error: ${result.error}`, true);
      } else {
        window.location.href = result.googleUrl;
      }
    } catch (error) {
      showResult(setLoginResult, 'Error al obtener URL de Google', true);
      console.error('Error al obtener URL de Google:', error);
    }
  };

  const handleLogout = async () => {
    setLoginResult(null);
    setAuthStatusResult(null);
    setUserInfo(null);
    setIsAuthenticated(false);

    try {
      console.log('Cookies antes del logout:', document.cookie);
      const result = await logout() as LogoutResponse;
      console.log('Respuesta del logout:', result);
      console.log('Cookies después del logout:', document.cookie);
      
      if ('error' in result) {
        showResult(setAuthStatusResult, `Error al cerrar sesión: ${result.error}`, true);
      } else {
        showResult(setAuthStatusResult, 'Sesión cerrada exitosamente.', false);
      }
    } catch (error) {
      console.error('Error completo al cerrar sesión:', error);
      showResult(setAuthStatusResult, 'Error de conexión al cerrar sesión.', true);
    }
    verifyAuthStatus();
  };

  // Ejecutar verifyAuthStatus al cargar la página
  useEffect(() => {
    verifyAuthStatus();
  }, []);

  useEffect(() => {
    const handleGoogleCallback = async () => {
      const token = searchParams.get('token');
      if (token) {
        // Guardar el token
        tokenService.setToken(token);
        
        // Verificar el estado de autenticación
        const status = await checkAuthStatus();
        if (status && status.isAuthenticated) {
          // Redirigir a la página principal
          router.push('/');
        }
      }
    };

    handleGoogleCallback();
  }, [searchParams, router]);

  return (
    <div className={styles.body}>
      <h1 className={styles.h1}>Prueba de Autenticación</h1>

      <div className={styles.container}>
        {/* Registro */}
        <section id="register" className={styles.section}>
          <h2 className={styles.h2}>Registro</h2>
          <form onSubmit={handleRegisterSubmit}>
            <label className={styles.label}>
              Email:
              <input
                type="email"
                name="email"
                required
                className={styles.input}
                value={registerEmail}
                onChange={(e) => setRegisterEmail(e.target.value)}
              />
            </label>
            <label className={styles.label}>
              Nombre:
              <input
                type="text"
                name="name"
                required
                className={styles.input}
                value={registerName}
                onChange={(e) => setRegisterName(e.target.value)}
              />
            </label>
            <label className={styles.label}>
              Contraseña:
              <input
                type="password"
                name="password"
                required
                className={styles.input}
                value={registerPassword}
                onChange={(e) => setRegisterPassword(e.target.value)}
              />
            </label>
            <label className={styles.label}>
              Rol:
              <select
                name="role"
                required
                className={styles.select}
                value={registerRole}
                onChange={(e) => setRegisterRole(e.target.value)}
              >
                <option value="ESTUDIANTE">Estudiante</option>
                <option value="PROFESOR">Profesor</option>
              </select>
            </label>
            <button type="submit" className={styles.button}>
              Registrar
            </button>
          </form>
          {registerResult && (
            <div className={`${styles.result} ${registerResult.isError ? styles.error : styles.success}`}>
              {registerResult.message}
            </div>
          )}
        </section>

        {/* Login */}
        <section id="login" className={styles.section}>
          <h2 className={styles.h2}>Login</h2>
          <form onSubmit={handleLoginSubmit}>
            <label className={styles.label}>
              Email:
              <input
                type="email"
                name="email"
                required
                className={styles.input}
                value={loginEmail}
                onChange={(e) => setLoginEmail(e.target.value)}
              />
            </label>
            <label className={styles.label}>
              Contraseña:
              <input
                type="password"
                name="password"
                required
                className={styles.input}
                value={loginPassword}
                onChange={(e) => setLoginPassword(e.target.value)}
              />
            </label>
            <button type="submit" className={styles.button}>
              Iniciar Sesión
            </button>
          </form>
          {loginResult && (
            <div className={`${styles.result} ${loginResult.isError ? styles.error : styles.success}`}>
              {loginResult.message}
            </div>
          )}
        </section>
      </div>

      {/* Estado de Autenticación */}
      <section id="authStatus" className={styles.section}>
        <h2 className={styles.h2}>Estado de Autenticación</h2>
        <button onClick={verifyAuthStatus} className={styles.button}>
          Obtener Estado de Autenticación
        </button>
        {authStatusResult && (
          <div className={`${styles.result} ${authStatusResult.isError ? styles.error : styles.success}`} style={{ color: '#000000' }}>
            {authStatusResult.message}
          </div>
        )}
        {userInfo && (
          <div className={styles['user-info']} style={{ display: userInfo ? 'block' : 'none', color: '#000000' }}>
            <h3>Información del Usuario:</h3>
            <pre style={{ color: '#000000' }}>{JSON.stringify({ user: userInfo, isAuthenticated }, null, 2)}</pre>
          </div>
        )}
        {isAuthenticated && (
          <button onClick={handleLogout} className={styles.button} style={{ marginTop: '1rem', backgroundColor: '#dc3545' }}>
            Cerrar Sesión
          </button>
        )}
      </section>

      {/* Google OAuth */}
      <section id="google" className={styles.section}>
        <h2 className={styles.h2}>Google OAuth</h2>
        <button onClick={handleGoogleLogin} className={styles.button}>
          Iniciar sesión con Google
        </button>
      </section>
    </div>
  );
}