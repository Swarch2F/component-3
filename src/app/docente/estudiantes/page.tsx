"use client";

import { useState, useEffect } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import TableEstudiantes from "../../components/TableEstudiantes";
import DataContainer from "../../components/DataContainer";
import { type Student } from "../../types/student";

// Datos mockeados con varios grados
const mockStudents: Student[] = [
  { id: "1", nombre: "María Pérez", documento: "1001001", nacimiento: "2008-05-10", acudiente: "Ana Pérez", grado: "1A", nota: 8.5 },
  { id: "2", nombre: "Juan Gómez", documento: "1001002", nacimiento: "2008-06-11", acudiente: "Luis Gómez", grado: "1A", nota: 7.2 },
  { id: "3", nombre: "Laura Sánchez", documento: "1001003", nacimiento: "2008-07-12", acudiente: "Marta Sánchez", grado: "2B", nota: 9.1 },
  { id: "4", nombre: "Carlos Ruiz", documento: "1001004", nacimiento: "2008-08-13", acudiente: "Pedro Ruiz", grado: "3C", nota: 6.8 },
];

export default function EstudiantesPage() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const grado = searchParams.get("grado");

  const [students, setStudents] = useState<Student[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!grado) {
      setStudents([]);
      setLoading(false);
      return;
    }
    setLoading(true);
    setTimeout(() => {
      setStudents(mockStudents.filter((s) => s.grado === grado));
      setLoading(false);
    }, 500);
  }, [grado]);

  if (!grado) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="card-modern text-center">
          <p className="text-lg mb-4">No se ha seleccionado un grado.</p>
          <button className="btn-primary px-4 py-2" onClick={() => router.push("/docente")}>
            Volver a grados
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[var(--color-bg)] py-8">
      <div className="max-w-5xl mx-auto">
        <div className="card-modern text-center font-bold text-2xl tracking-wide mb-6 title-modern">
          Estudiantes de {grado}
        </div>
        <div className="card-modern space-y-6">
          <DataContainer
            loading={loading}
            error={error}
            onRetry={() => window.location.reload()}
          >
            <TableEstudiantes
              data={students}
            />
          </DataContainer>
            <button
              className="btn-secondary px-4 py-2 cursor-pointer"
              onClick={() => router.push("/docente")}
            >
              Volver a grados
            </button>
        </div>
      </div>
    </div>
  );
}