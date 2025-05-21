"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { getProfesores } from "../api/profesoresApi";

interface Profesor {
  id: string;
  nombre: string;
  documento?: string;
  area?: string;
}

export default function DocenteSelectorPage() {
  const router = useRouter();
  const [profesores, setProfesores] = useState<Profesor[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    getProfesores()
      .then((res: any) => {
        setProfesores(res.profesores || []);
        setLoading(false);
      })
      .catch(() => {
        setError("Error al cargar los docentes");
        setLoading(false);
      });
  }, []);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-lg">Cargando docentes...</div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-lg text-red-600">{error}</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[var(--color-bg)] py-8 flex flex-col items-center justify-center">
      <div className="card-modern text-center font-bold text-2xl tracking-wide mb-6 title-modern">
        Selecciona un docente
      </div>
      <div className="flex flex-col gap-4 items-center">
        {profesores.map((docente) => (
          <button
            key={docente.id}
            className="btn-primary px-8 py-4 text-lg w-60 cursor-pointer"
            onClick={() => router.push(`/docente/${docente.id}`)}
          >
            {docente.nombre}
          </button>
        ))}
      </div>
    </div>
  );
}