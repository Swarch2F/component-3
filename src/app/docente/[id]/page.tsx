"use client";

import { useParams } from "next/navigation";
import { useState } from "react";
import TableEstudiantes from "../../components/TableEstudiantes";

// Mocks
const mockDocentes = [
  {
    id: "d1",
    nombre: "Ana Docente",
    asignaturas: [
      { id: "mat", nombre: "Matemáticas" },
      { id: "len", nombre: "Lengua Castellana" },
    ],
    cursos: ["1A", "2B"],
  },
  {
    id: "d2",
    nombre: "Luis Profesor",
    asignaturas: [
      { id: "ing", nombre: "Inglés" },
    ],
    cursos: ["3C"],
  },
];

const mockPeriodos = [
  { id: "1", nombre: "Primer Periodo" },
  { id: "2", nombre: "Segundo Periodo" },
  { id: "3", nombre: "Tercer Periodo" },
];

const mockGrados = [
  { id: "1A", nombre: "1A" },
  { id: "2B", nombre: "2B" },
  { id: "3C", nombre: "3C" },
];

const mockStudents = [
  { id: "1", nombre: "María Pérez", documento: "1001001", nacimiento: "2008-05-10", acudiente: "Ana Pérez", grado: "1A", nota: 4.5 },
  { id: "2", nombre: "Juan Gómez", documento: "1001002", nacimiento: "2008-06-11", acudiente: "Luis Gómez", grado: "1A", nota: 3.2 },
  { id: "3", nombre: "Laura Sánchez", documento: "1001003", nacimiento: "2008-07-12", acudiente: "Marta Sánchez", grado: "2B", nota: 4.1 },
  { id: "4", nombre: "Carlos Ruiz", documento: "1001004", nacimiento: "2008-08-13", acudiente: "Pedro Ruiz", grado: "3C", nota: 2.8 },
];

export default function DocentePage() {
  const params = useParams();
  const docenteId = params.id as string;
  const docente = mockDocentes.find(d => d.id === docenteId);

  const [periodo, setPeriodo] = useState<string>("");
  const [asignatura, setAsignatura] = useState<string>("");
  const [grado, setGrado] = useState<string>("");

  if (!docente) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="card-modern text-center">
          <p className="text-lg mb-4">Docente no encontrado.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[var(--color-bg)] py-8">
      <div className="max-w-3xl mx-auto">
        <div className="card-modern text-center font-bold text-2xl tracking-wide mb-6 title-modern">
          {docente.nombre}
        </div>
        <div className="card-modern flex flex-col items-center gap-6">
          {/* Selector de periodo */}
          <div className="w-full">
            <label className="block mb-2 font-semibold">Selecciona un periodo:</label>
            <select
              className="border rounded px-3 py-2 w-full"
              value={periodo}
              onChange={e => {
                setPeriodo(e.target.value);
                setAsignatura("");
                setGrado("");
              }}
            >
              <option value="">-- Selecciona periodo --</option>
              {mockPeriodos.map(p => (
                <option key={p.id} value={p.id}>{p.nombre}</option>
              ))}
            </select>
          </div>

          {/* Selector de asignatura */}
          {periodo && (
            <div className="w-full">
              <label className="block mb-2 font-semibold">Selecciona una asignatura:</label>
              <select
                className="border rounded px-3 py-2 w-full"
                value={asignatura}
                onChange={e => {
                  setAsignatura(e.target.value);
                  setGrado("");
                }}
              >
                <option value="">-- Selecciona asignatura --</option>
                {docente.asignaturas.map(a => (
                  <option key={a.id} value={a.id}>{a.nombre}</option>
                ))}
              </select>
            </div>
          )}

          {/* Selector de grado */}
          {periodo && asignatura && (
            <div className="w-full">
              <label className="block mb-2 font-semibold">Selecciona un grado:</label>
              <div className="flex flex-col gap-3 items-center">
                {mockGrados
                  .filter(g => docente.cursos.includes(g.id))
                  .map(g => (
                    <button
                      key={g.id}
                      className={`btn-primary px-6 py-3 text-lg w-40 ${grado === g.id ? "ring-2 ring-accent-500" : ""}`}
                      onClick={() => setGrado(g.id)}
                    >
                      {g.nombre}
                    </button>
                  ))}
              </div>
            </div>
          )}

          {/* Lista de estudiantes solo filtrando por grado */}
          {periodo && asignatura && grado && (
            <div className="w-full mt-6">
              <div className="text-center text-lg font-semibold mb-4">
                Lista de estudiantes de {grado} para {docente.asignaturas.find(a => a.id === asignatura)?.nombre} en {mockPeriodos.find(p => p.id === periodo)?.nombre}
              </div>
              <TableEstudiantes
                data={mockStudents.filter(
                  s => s.grado === grado
                )}
              />
            </div>
          )}
        </div>
      </div>
    </div>
  );
}