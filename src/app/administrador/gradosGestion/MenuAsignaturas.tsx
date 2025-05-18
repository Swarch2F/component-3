"use client";
import { useState } from "react";

export interface Asignatura {
  id: number;
  nombre: string;
}

// Datos simulados de asignaturas disponibles
const asignaturasDisponibles: Asignatura[] = [
  { id: 1, nombre: "Matemáticas" },
  { id: 2, nombre: "Inglés" },
  { id: 3, nombre: "Ciencias" },
  { id: 4, nombre: "Historia" },
  { id: 5, nombre: "Arte" },
];

export default function MenuAsignaturas({
  asignaturasSeleccionadas,
  onAgregar,
  onEliminar,
}: {
  asignaturasSeleccionadas: Asignatura[];
  onAgregar: (asig: Asignatura) => void;
  onEliminar: (id: number) => void;
}) {
  // Profesores simulados por asignatura
  const profesoresPorAsignatura: Record<number, string> = {
    1: "Prof. López",
    2: "Prof. Smith",
    3: "Prof. Torres",
    4: "Prof. Ramírez",
    5: "Prof. Gómez",
  };

  const [open, setOpen] = useState(false);
  const disponiblesParaAgregar = asignaturasDisponibles.filter(
    (asig) => !asignaturasSeleccionadas.some((a) => a.id === asig.id)
  );

  return (
    <div className="space-y-4">
      <ul className="mb-2">
        {asignaturasSeleccionadas.length === 0 ? (
          <li className="text-gray-400">No hay asignaturas asignadas.</li>
        ) : (
          asignaturasSeleccionadas.map((asig) => (
            <li key={asig.id} className="flex items-center justify-between border-b py-1">
              <span>{asig.nombre}</span>
              <span className="text-xs text-primary-600 font-semibold ml-2">{profesoresPorAsignatura[asig.id]}</span>
              <button className="btn-danger px-2 py-1 text-xs ml-2" onClick={() => onEliminar(asig.id)}>Quitar</button>
            </li>
          ))
        )}
      </ul>
      <div className="relative">
        <button
          className="btn-primary px-4 py-2 text-sm w-full"
          onClick={() => setOpen((v) => !v)}
        >
          Añadir asignatura
        </button>
        {open && (
          <div className="absolute z-10 mt-2 w-full bg-white rounded shadow-lg border border-gray-200 max-h-60 overflow-y-auto">
            {disponiblesParaAgregar.length === 0 ? (
              <div className="px-4 py-2 text-gray-400">No hay asignaturas disponibles</div>
            ) : (
              disponiblesParaAgregar.map((asig) => (
                <div
                  key={asig.id}
                  className="flex items-center justify-between px-4 py-2 hover:bg-primary-100 cursor-pointer"
                  onClick={() => {
                    onAgregar({ ...asig });
                    setOpen(false);
                  }}
                >
                  <span>{asig.nombre}</span>
                  <span className="text-xs text-primary-600 font-semibold ml-2">{profesoresPorAsignatura[asig.id]}</span>
                </div>
              ))
            )}
          </div>
        )}
      </div>
    </div>
  );
}
