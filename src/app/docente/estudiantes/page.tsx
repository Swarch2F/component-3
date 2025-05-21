"use client";

import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import { getProfesorPorId } from "../../api/profesoresApi";
import { getAsignaturas } from "../../api/asignaturasApi";
import { getAllCursos, getAllEstudiantes } from "../../api/estudiantesCursos.api";
import TableEstudiantes from "../../components/TableEstudiantes";
import { getCalificaciones } from "../../api/calificacionesApi";

export default function DocenteDetallePage() {
  const params = useParams();
  const id = params.id as string;
  const [profesor, setProfesor] = useState<any>(null);
  const [asignatura, setAsignatura] = useState<any>(null);
  const [grados, setGrados] = useState<any[]>([]);
  const [estudiantesPorGrado, setEstudiantesPorGrado] = useState<Record<number, any[]>>({});
  const [gradoSeleccionado, setGradoSeleccionado] = useState<number | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function fetchData() {
      setLoading(true);
      try {
        // 1. Obtener profesor
        const profRes = await getProfesorPorId(id);
        const prof = (profRes as { profesorPorId: any }).profesorPorId;
        if (!prof) {
          throw new Error("Profesor no encontrado");
        }
        setProfesor(prof);

        // 2. Obtener asignatura asignada a este profesor
        const asigRes = await getAsignaturas();
        const asignaturas = (asigRes as { asignaturas: any[] }).asignaturas || [];
        const asignaturaEncontrada = asignaturas.find(
          (a: any) => a.profesorIds && a.profesorIds.includes(id)
        );
        setAsignatura(asignaturaEncontrada || null);

        // 3. Obtener cursos y estudiantes desde REST
        const cursos = await getAllCursos();
        const estudiantes = await getAllEstudiantes();

        // 4. Obtener todos los cursos donde el profesor ha puesto calificaciones
        let cursosAsignados: any[] = [];
        if (asignaturaEncontrada) {
          try {
            // Obtener calificaciones para esta asignatura
            const calRes = await getCalificaciones({
              asignaturaId: asignaturaEncontrada.id
            });
            const calificaciones = (calRes as { calificaciones: any[] }).calificaciones || [];
            
            // Filtrar calificaciones donde este profesor aparece en las observaciones
            const calProfesor = calificaciones.filter((cal: any) => 
              cal.observaciones && cal.observaciones.includes(`Profesor: ${prof.nombre}`)
            );
            
            // Obtener los IDs únicos de los cursos donde el profesor ha puesto calificaciones
            const cursosIds = [...new Set(calProfesor.map(cal => cal.cursoId))];
            
            // Filtrar los cursos basados en las calificaciones encontradas
            cursosAsignados = cursos.filter(curso => cursosIds.includes(String(curso.id)));
          } catch (error) {
            console.error("Error al obtener calificaciones:", error);
          }
        }

        console.log(`Mostrando cursos con calificaciones del profesor (${cursosAsignados.length} en total)`);
        setGrados(cursosAsignados);

        // 5. Relacionar estudiantes por grado SOLO para los cursos con calificaciones
        const porGrado: Record<number, any[]> = {};
        cursosAsignados.forEach((curso: any) => {
          porGrado[curso.id] = estudiantes.filter((e: any) => e.curso === curso.id);
        });
        setEstudiantesPorGrado(porGrado);

      } catch (error) {
        console.error("Error al cargar el docente:", error);
        setError(typeof error === 'string' ? error : "Error al cargar el docente");
      } finally {
        setLoading(false);
      }
    }
    fetchData();
  }, [id]);

  if (loading) {
    return <div className="min-h-screen flex items-center justify-center"><div className="text-lg">Cargando docente...</div></div>;
  }

  if (error || !profesor) {
    return <div className="min-h-screen flex items-center justify-center"><div className="text-lg text-red-600">{error || "Docente no encontrado"}</div></div>;
  }

  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-[var(--color-bg)] py-8">
      <div className="card-modern text-center font-bold text-2xl tracking-wide mb-6 title-modern">
        {profesor.nombre}
      </div>
      <div className="text-lg mb-2">
        <strong>Documento:</strong> {profesor.documento}
      </div>
      <div className="text-lg mb-2">
        <strong>Asignatura:</strong>{" "}
        {asignatura ? (
          <span className="inline-block bg-blue-100 text-blue-800 px-3 py-1 rounded font-semibold">
            {asignatura.nombre}
          </span>
        ) : (
          <span className="text-gray-400">Sin asignar</span>
        )}
      </div>
      <div className="w-full max-w-4xl flex flex-col md:flex-row gap-8 mt-8">
        {/* Panel izquierdo: lista de cursos */}
        <div className="md:w-1/3 w-full">
          <div className="font-semibold mb-2 text-lg">Grados donde dicta {asignatura ? asignatura.nombre : ""}:</div>
          {!asignatura ? (
            <div className="mt-2 text-gray-500">No tiene asignatura asignada.</div>
          ) : grados.length === 0 ? (
            <div className="mt-2 text-gray-500">No tiene grados asignados.</div>
          ) : (
            <ul className="flex flex-col gap-2">
              {grados.map((grado: any) => (
                <li key={grado.id}>
                  <button
                    className={`w-full text-left px-4 py-2 rounded ${gradoSeleccionado === grado.id ? "bg-blue-200 font-bold" : "bg-gray-100 hover:bg-blue-50"}`}
                    onClick={() => setGradoSeleccionado(grado.id)}
                  >
                    {grado.nombre}
                  </button>
                </li>
              ))}
            </ul>
          )}
        </div>
        {/* Panel derecho: estudiantes */}
        <div className="md:w-2/3 w-full">
          {gradoSeleccionado ? (
            <div className="card-modern">
              <div className="font-semibold mb-2">
                Estudiantes de {grados.find(g => g.id === gradoSeleccionado)?.nombre}:
              </div>
              {estudiantesPorGrado[gradoSeleccionado]?.length === 0 ? (
                <div className="text-gray-500">No hay estudiantes en este grado.</div>
              ) : (
                <ul className="list-disc pl-6">
                  {estudiantesPorGrado[gradoSeleccionado]?.map((est: any) => (
                    <li key={est.id}>
                      {est.nombre_completo} <span className="text-gray-500">({est.documento})</span>
                    </li>
                  ))}
                </ul>
              )}
              <button className="btn-secondary mt-4" onClick={() => setGradoSeleccionado(null)}>
                Cerrar
              </button>
            </div>
          ) : (
            <div className="text-gray-400 text-center mt-12">Selecciona un grado para ver estudiantes</div>
          )}
        </div>
      </div>
    </div>
  );
}