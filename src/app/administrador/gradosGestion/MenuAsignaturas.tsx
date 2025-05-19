"use client";
import { useState } from "react";

export interface Asignatura {
  id: number | string;
  nombre: string;
}

export interface MenuAsignaturasProps {
  asignaturasSeleccionadas: Asignatura[];
  asignaturasDisponibles: Asignatura[];
  profesoresPorAsignatura?: Record<string | number, string>;
  onAgregar: (asig: Asignatura) => void;
  onEliminar: (id: number | string) => void;
}

export default function MenuAsignaturas({
  asignaturasSeleccionadas,
  asignaturasDisponibles,
  profesoresPorAsignatura = {},
  onAgregar,
  onEliminar,
}: MenuAsignaturasProps) {
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
              {profesoresPorAsignatura[asig.id] && (
                <span className="text-xs text-primary-600 font-semibold ml-2">{profesoresPorAsignatura[asig.id]}</span>
              )}
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
                  {profesoresPorAsignatura[asig.id] && (
                    <span className="text-xs text-primary-600 font-semibold ml-2">{profesoresPorAsignatura[asig.id]}</span>
                  )}
                </div>
              ))
            )}
          </div>
        )}
      </div>
    </div>
  );
}
