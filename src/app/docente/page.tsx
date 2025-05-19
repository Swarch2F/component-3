"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import GradosDocenteSelector from "./GradosDocenteSelector";

// Mock de grados asignados al docente
const mockGrados = [
  { id: "1A", nombre: "1A" },
  { id: "2B", nombre: "2B" },
  { id: "3C", nombre: "3C" },
];

export default function GradosDocentePage() {
  const router = useRouter();
  const [gradoSeleccionado, setGradoSeleccionado] = useState<string | null>(null);

  const handleSeleccionar = (gradoId: string) => {
    setGradoSeleccionado(gradoId);
    router.push(`/docente/estudiantes?grado=${gradoId}`);
  };

  return (
    <div className="min-h-screen bg-[var(--color-bg)] py-8">
      <div className="max-w-3xl mx-auto">
        <div className="card-modern text-center font-bold text-2xl tracking-wide mb-6 title-modern">
          MIS GRADOS ASIGNADOS
        </div>
        <div className="card-modern flex flex-col items-center gap-6">
          <h1 className="text-3xl font-extrabold mb-1 title-modern">Selecciona un grado</h1>
          <GradosDocenteSelector
            grados={mockGrados}
            onSeleccionar={handleSeleccionar}
            gradoSeleccionado={gradoSeleccionado}
          />
        </div>
      </div>
    </div>
  );
}