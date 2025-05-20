"use client";
import { useState, useEffect } from "react";
import { getProfesores } from "../../api/profesoresApi";
import { getAsignaturas } from "../../api/asignaturasApi";

export interface Profesor {
  id: string;
  nombre: string;
  documento: string;
  area?: string;
}

export interface Asignatura {
  id: number | string;
  nombre: string;
  profesorIds?: string[];
}

export interface MenuAsignaturasProps {
  asignaturasSeleccionadas: Asignatura[];
  asignaturasDisponibles: Asignatura[];
  profesoresPorAsignatura?: Record<string | number, string>;
  onAgregar: (asig: Asignatura & { profesor?: Profesor }) => void;
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
  const [profesores, setProfesores] = useState<Profesor[]>([]);
  const [profesorSeleccionado, setProfesorSeleccionado] = useState<string>("");
  const [asignaturaSeleccionada, setAsignaturaSeleccionada] = useState<string>("");
  const [asignaturasFull, setAsignaturasFull] = useState<Asignatura[]>([]);
  const [eliminandoId, setEliminandoId] = useState<string | number | null>(null);

  useEffect(() => {
    getProfesores().then((res: any) => setProfesores(res.profesores || []));
  }, []);

  // Cargar asignaturasFull siempre al montar y también al abrir el modal
  useEffect(() => {
    getAsignaturas().then((res: any) => setAsignaturasFull(res.asignaturas || []));
  }, []);
  useEffect(() => {
    if (open) {
      getAsignaturas().then((res: any) => setAsignaturasFull(res.asignaturas || []));
    }
  }, [open]);

  // Filtrar profesores según la asignatura seleccionada y sus profesorIds (usando asignaturasFull)
  let profesoresFiltrados = profesores;
  if (asignaturaSeleccionada) {
    const asig = asignaturasFull.find((a) => String(a.id) === String(asignaturaSeleccionada));
    let profesorIdsAsignatura: string[] = [];
    if (asig && asig.profesorIds && Array.isArray(asig.profesorIds)) {
      profesorIdsAsignatura = asig.profesorIds;
    }
    if (profesorIdsAsignatura.length > 0) {
      profesoresFiltrados = profesores.filter(p => profesorIdsAsignatura.includes(p.id));
    } else {
      profesoresFiltrados = [];
    }
  }

  const disponiblesParaAgregar = asignaturasDisponibles.filter(
    (asig: Asignatura) => !asignaturasSeleccionadas.some((a) => a.id === asig.id)
  );

  return (
    <div className="space-y-4">
      <ul className="mb-2">
        {asignaturasSeleccionadas.length === 0 ? (
          <li className="text-gray-400">No hay asignaturas asignadas.</li>
        ) : (
          asignaturasSeleccionadas.map((asig) => {
            // Buscar el nombre del profesor realmente asignado usando asignaturasFull
            let nombreProfesor = "";
            const asigFull = asignaturasFull.find(a => String(a.id) === String(asig.id));
            if (asigFull && asigFull.profesorIds && asigFull.profesorIds.length > 0) {
              const nombres: string[] = [];
              asigFull.profesorIds.forEach(pid => {
                const profe = profesores.find(p => p.id === pid);
                if (profe) nombres.push(profe.nombre);
              });
              if (nombres.length > 0) nombreProfesor = nombres.join(", ");
            }
            return (
              <li key={asig.id} className="flex items-center justify-between border-b py-1">
                <span>{asig.nombre}</span>
                {nombreProfesor && (
                  <span className="text-xs text-primary-600 font-semibold ml-2">{nombreProfesor}</span>
                )}
                <button
                  className={`btn-danger px-2 py-1 text-xs ml-2 ${eliminandoId === asig.id ? 'opacity-50 cursor-not-allowed' : ''}`}
                  disabled={eliminandoId === asig.id}
                  onClick={async () => {
                    setEliminandoId(asig.id);
                    await onEliminar(asig.id);
                    setEliminandoId(null);
                  }}
                >{eliminandoId === asig.id ? 'Quitando...' : 'Quitar'}</button>
              </li>
            );
          })
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
          <div className="absolute z-10 mt-2 w-full bg-white rounded shadow-lg border border-gray-200 max-h-96 overflow-y-auto p-4">
            <div className="mb-2">
              <label className="block text-sm font-semibold mb-1">Asignatura</label>
              <select
                className="input-modern w-full"
                value={asignaturaSeleccionada}
                onChange={e => {
                  setAsignaturaSeleccionada(e.target.value);
                  setProfesorSeleccionado("");
                }}
              >
                <option value="">Selecciona una asignatura</option>
                {disponiblesParaAgregar.map((asig: Asignatura) => (
                  <option key={asig.id} value={asig.id}>{asig.nombre}</option>
                ))}
              </select>
            </div>
            {asignaturaSeleccionada && (
              <div className="mb-2">
                <label className="block text-sm font-semibold mb-1">Profesor asignado</label>
                <select
                  className="input-modern w-full"
                  value={profesorSeleccionado}
                  onChange={e => setProfesorSeleccionado(e.target.value)}
                >
                  <option value="">Selecciona un profesor</option>
                  {profesoresFiltrados.map((prof) => (
                    <option key={prof.id} value={prof.id}>{prof.nombre} ({prof.documento})</option>
                  ))}
                </select>
              </div>
            )}
            <div className="flex gap-2 mt-2">
              <button
                className="btn-primary flex-1"
                disabled={!asignaturaSeleccionada || !profesorSeleccionado}
                onClick={() => {
                  const asig = disponiblesParaAgregar.find((a: Asignatura) => a.id === asignaturaSeleccionada);
                  const prof = profesores.find(p => p.id === profesorSeleccionado);
                  if (asig && prof) {
                    onAgregar({ ...asig, profesor: prof });
                    setOpen(false);
                    setAsignaturaSeleccionada("");
                    setProfesorSeleccionado("");
                  }
                }}
              >Agregar</button>
              <button className="btn-secondary flex-1" onClick={() => setOpen(false)}>Cancelar</button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
