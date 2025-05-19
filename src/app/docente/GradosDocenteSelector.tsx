"use client";

import { useState } from "react";

type Grado = { id: string; nombre: string };

interface Props {
  grados: Grado[];
  onSeleccionar: (gradoId: string) => void;
  gradoSeleccionado?: string | null;
}

export default function GradosDocenteSelector({ grados, onSeleccionar, gradoSeleccionado }: Props) {
  return (
    <div className="flex flex-col gap-4 items-center">
      {grados.map((grado) => (
        <button
          key={grado.id}
          className={`btn-primary px-6 py-3 text-lg w-40 ${gradoSeleccionado === grado.id ? "ring-2 ring-accent-500" : ""}`}
          onClick={() => onSeleccionar(grado.id)}
        >
          {grado.nombre}
        </button>
      ))}
    </div>
  );
}