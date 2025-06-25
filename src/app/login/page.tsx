"use client";

import { useState } from "react";
import { loginUser, getAuthStatus } from "../api/authApi";
import { useRouter } from "next/navigation";

export default function LoginPage() {
  const [correo, setCorreo] = useState("");
  const [contrasena, setContrasena] = useState("");
  const [error, setError] = useState("");
  const router = useRouter();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    const res = await loginUser(correo, contrasena);
    if (res.token) {
      // Consultar estado de autenticación para saber el rol
      const status = await getAuthStatus();
      if (status && status.isAuthenticated) {
        const userRole = status.user.role?.toUpperCase();
        if (userRole === "ADMINISTRADOR") {
          router.push("/administrador");
        } else if (userRole === "PROFESOR") {
          router.push(`/docente/${status.user.id}`);
        } else {
          router.push("/");
        }
      } else {
        setError("No se pudo obtener el estado de autenticación");
      }
    } else {
      setError(res.message || "Error al iniciar sesión");
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-[var(--color-bg)]">
      <form onSubmit={handleSubmit} className="card-modern p-8 w-full max-w-md flex flex-col gap-4">
        <h1 className="text-2xl font-bold mb-2 text-center">Iniciar sesión</h1>
        <input
          type="email"
          placeholder="Correo"
          className="input-modern"
          value={correo}
          onChange={e => setCorreo(e.target.value)}
          required
        />
        <input
          type="password"
          placeholder="Contraseña"
          className="input-modern"
          value={contrasena}
          onChange={e => setContrasena(e.target.value)}
          required
        />
        {error && <div className="text-red-500 text-sm text-center">{error}</div>}
        <button type="submit" className="btn-primary w-full mt-2">Ingresar</button>
      </form>
    </div>
  );
}
