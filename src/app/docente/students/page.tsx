"use client";

import { useState, useEffect } from 'react';
import TableEstudiantes from '../../components/TableEstudiantes';
import DataContainer from '../../components/DataContainer';
import { type Student } from '../../types/student';

// Datos mockeados temporalmente
const mockStudents: Student[] = [
  { id: "1", nombre: "María Pérez", nota: 8.5 },
  { id: "2", nombre: "Juan Gómez", nota: 7.2 },
  { id: "3", nombre: "Laura Sánchez", nota: 9.1 },
  { id: "4", nombre: "Carlos Ruiz", nota: 6.8 },
];

export default function EstudiantesPage() {
  const [students, setStudents] = useState<Student[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Simular fetch de datos
  useEffect(() => {
    const fetchData = async () => {
      try {
        await new Promise(resolve => setTimeout(resolve, 1000)); // Simular delay
        setStudents(mockStudents);
      } catch (err) {
        setError('Error cargando los datos de estudiantes');
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, []);

  return (
    <div className="min-h-screen bg-[var(--color-bg)] py-8">
      <div className="max-w-5xl mx-auto">
        <div className="card-modern text-center font-bold text-2xl tracking-wide mb-6 title-modern">
          REPORTES ACADÉMICOS
        </div>
        <div className="card-modern space-y-6">
          <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center gap-4">
            <div>
              <h1 className="text-3xl font-extrabold mb-1 title-modern">Gestión de Estudiantes</h1>
              <p className="subtitle-modern text-base">Planilla de calificaciones - Séptimo Lenguaje</p>
            </div>
            <button className="btn-primary px-5 py-2 text-base">Añadir Estudiante</button>
          </div>
          <DataContainer
            loading={loading}
            error={error}
            onRetry={() => window.location.reload()}
          >
            <TableEstudiantes 
              data={students}
              onEdit={(id) => console.log('Editar:', id)}
              onDelete={(id) => console.log('Eliminar:', id)}
            />
          </DataContainer>
        </div>
      </div>
    </div>
  );
}