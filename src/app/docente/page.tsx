"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import TableEstudiantes from "../components/TableEstudiantes";

// Mocks de periodos, asignaturas y grados
const mockPeriodos = [
  { id: "1", nombre: "Primer Periodo" },
  { id: "2", nombre: "Segundo Periodo" },
  { id: "3", nombre: "Tercer Periodo" },
];

const mockAsignaturasDocente = [
  { id: "mat", nombre: "Matemáticas" },
  { id: "len", nombre: "Lengua Castellana" },
  // Solo las que dicta el docente
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
  // ...otros estudiantes...
];
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

export default function DocenteSelectorPage() {
  const router = useRouter();

  return (
    <div className="min-h-screen bg-[var(--color-bg)] py-8 flex flex-col items-center justify-center">
      <div className="card-modern text-center font-bold text-2xl tracking-wide mb-6 title-modern">
        Selecciona un docente
      </div>
      <div className="flex flex-col gap-4 items-center">
        {mockDocentes.map((docente) => (
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