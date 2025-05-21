"use client";

import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import { getProfesorPorId } from "../../api/profesoresApi";
import { getAsignaturas } from "../../api/asignaturasApi";
import { getAllCursos, getAllEstudiantes } from "../../api/estudiantesCursos.api";
import TableEstudiantes from "../../components/TableEstudiantes";
import { actualizarCalificacion, getCalificaciones, registrarCalificacion } from "../../api/calificacionesApi";

// Periodos disponibles
const PERIODOS = [
  { value: "1", label: "Primer Periodo" },
  { value: "2", label: "Segundo Periodo" },
  { value: "3", label: "Tercer Periodo" },
  { value: "4", label: "Cuarto Periodo" },
];

// Años disponibles (desde 2023 hasta el año actual)
const currentYear = new Date().getFullYear();
const ANOS = Array.from({ length: currentYear - 2022 }, (_, i) => {
  const year = 2023 + i;
  return { value: String(year), label: `${year}` };
});

export default function DocenteDetallePage() {
  const params = useParams();
  const id = params.id as string;
  const [profesor, setProfesor] = useState<any>(null);
  const [asignatura, setAsignatura] = useState<any>(null);
  const [gradosOriginales, setGradosOriginales] = useState<any[]>([]); // Datos originales de los cursos
  const [estudiantesOriginales, setEstudiantesOriginales] = useState<Record<number, any[]>>({}); // Datos originales de los estudiantes
  const [grados, setGrados] = useState<any[]>([]); // Cursos visibles
  const [estudiantesPorGrado, setEstudiantesPorGrado] = useState<Record<number, any[]>>({}); // Estudiantes visibles
  const [gradoSeleccionado, setGradoSeleccionado] = useState<number | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [anoSeleccionado, setAnoSeleccionado] = useState<string>(ANOS[0].value);
  const [periodo, setPeriodo] = useState<string>(PERIODOS[0].value);
  const [feedback, setFeedback] = useState<{ type: "success" | "error"; message: string } | null>(null);

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

        // Guardar los datos originales
        setGradosOriginales(cursos);
        const estudiantesPorGradoTmp: Record<number, any[]> = {};
        cursos.forEach((curso: any) => {
          estudiantesPorGradoTmp[curso.id] = estudiantes.filter((e: any) => e.curso === curso.id);
        });
        setEstudiantesOriginales(estudiantesPorGradoTmp);

        // Filtrar los cursos iniciales según el periodo actual
        await refrescarCursosYEstudiantes(anoSeleccionado, periodo);

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
        const estudiantesPorGradoAsignados: Record<number, any[]> = {};
        cursosAsignados.forEach((curso: any) => {
          estudiantesPorGradoAsignados[curso.id] = estudiantes.filter((e: any) => e.curso === curso.id);
        });
        setEstudiantesPorGrado(estudiantesPorGradoAsignados);

      } catch (error) {
        console.error("Error al cargar el docente:", error);
        setError(typeof error === 'string' ? error : "Error al cargar el docente");
      } finally {
        setLoading(false);
      }
    }
    fetchData();
  }, [id]);

  async function refrescarNotas(gradoId: string, asignaturaId: string, anoSeleccionado: string, periodo: string) {
    // Formar el periodo completo (año + periodo)
    const periodoCompleto = `${anoSeleccionado}-${periodo}`;
    console.log(`Consultando calificaciones con periodo: ${periodoCompleto}`);
    
    const res = await getCalificaciones({
      cursoId: String(gradoId),
      asignaturaId: asignaturaId,
      periodo: periodoCompleto,
    });
    const calificaciones = (res as { calificaciones: any[] }).calificaciones || [];
    console.log(`Calificaciones encontradas: ${calificaciones.length}`);
    
    setEstudiantesPorGrado((prev) => {
      const estudiantes = prev[Number(gradoId)] || [];
      const actualizados = estudiantes.map((est: any) => {
        const cal = calificaciones.find(
          (c: any) => String(c.estudianteId) === String(est.id)
        );
        return { ...est, nota: cal ? cal.nota : undefined };
      });
      return { ...prev, [gradoId]: actualizados };
    });
  }

  async function refrescarCursosYEstudiantes(anoSeleccionado: string, periodo: string) {
    const periodoCompleto = `${anoSeleccionado}-${periodo}`;
    console.log(`Refrescando cursos y estudiantes para el periodo: ${periodoCompleto}`);

    try {
      // Obtener calificaciones para el periodo completo
      const res = await getCalificaciones({ periodo: periodoCompleto });
      const calificaciones = (res as { calificaciones: any[] }).calificaciones || [];

      // Filtrar cursos con calificaciones en este periodo
      const cursosIds = [...new Set(calificaciones.map((cal: any) => cal.cursoId))];
      const cursosAsignados = gradosOriginales.filter((curso) => cursosIds.includes(String(curso.id)));

      // Relacionar estudiantes por grado SOLO para los cursos con calificaciones
      const estudiantesPorGradoAsignados: Record<number, any[]> = {};
      cursosAsignados.forEach((curso: any) => {
        estudiantesPorGradoAsignados[curso.id] = estudiantesOriginales[curso.id] || [];
      });

      setGrados(cursosAsignados);
      setEstudiantesPorGrado(estudiantesPorGradoAsignados);
    } catch (error) {
      console.error("Error al refrescar cursos y estudiantes:", error);
      setGrados([]);
      setEstudiantesPorGrado({});
    }
  }

  // Effect to refresh notes when period, year, or grade selection changes
  useEffect(() => {
    if (gradoSeleccionado && asignatura) {
      console.log(`Refrescando notas - Grado: ${gradoSeleccionado}, Año: ${anoSeleccionado}, Periodo: ${periodo}`);
      refrescarNotas(String(gradoSeleccionado), asignatura.id, anoSeleccionado, periodo);
    }
  }, [gradoSeleccionado, anoSeleccionado, periodo, asignatura]);

  // Effect to refresh courses and students when year or period changes
  useEffect(() => {
    refrescarCursosYEstudiantes(anoSeleccionado, periodo);
  }, [anoSeleccionado, periodo]);

  // Obtener periodos únicos con calificaciones para el grado y asignatura seleccionados
  const periodosConCalificaciones = gradoSeleccionado && asignatura
    ? (() => {
        const estudiantes = estudiantesPorGrado[gradoSeleccionado] || [];
        const periodosSet = new Set<string>();
        estudiantes.forEach((est: any) => {
          if (est.calificaciones && Array.isArray(est.calificaciones)) {
            est.calificaciones.forEach((cal: any) => {
              if (String(cal.asignaturaId) === String(asignatura.id) && cal.periodo) {
                // Ahora el periodo incluye año y periodo, formato como "2023-1", "2024-2", etc.
                periodosSet.add(cal.periodo);
              }
            });
          }
        });
        return Array.from(periodosSet).sort();
      })()
    : [];

  useEffect(() => {
    if (feedback && feedback.type === "success") {
      const timer = setTimeout(() => {
        setFeedback(null);
      }, 3000);
      return () => clearTimeout(timer);
    }
  }, [feedback]);

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

      {/* Selectores de año y periodo */}
      <div className="w-full max-w-md mb-6">
        <div className="card-modern p-6 shadow-lg border border-blue-100">
          <h3 className="font-bold text-xl mb-4 text-center text-blue-800">Periodo Académico</h3>
          <div className="flex flex-col sm:flex-row sm:items-end gap-4 justify-center">
            <div className="w-full sm:w-1/2">
              <label htmlFor="ano-select" className="font-semibold block mb-2 text-gray-700">Año:</label>
              <select
                id="ano-select"
                className="border border-gray-300 rounded-md px-3 py-2 w-full bg-white focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                value={anoSeleccionado}
                onChange={e => {
                  console.log("Año seleccionado:", e.target.value);
                  setAnoSeleccionado(e.target.value);
                }}
              >
                <option value="">Seleccione año</option>
                {ANOS.map((ano) => (
                  <option key={ano.value} value={ano.value}>
                    {ano.label}
                  </option>
                ))}
              </select>
            </div>
            
            <div className="w-full sm:w-1/2">
              <label htmlFor="periodo-select" className="font-semibold block mb-2 text-gray-700">Periodo:</label>
              <select
                id="periodo-select"
                className="border border-gray-300 rounded-md px-3 py-2 w-full bg-white focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                value={periodo}
                onChange={e => {
                  console.log("Periodo seleccionado:", e.target.value);
                  setPeriodo(e.target.value);
                }}
              >
                <option value="">Seleccione periodo</option>
                {PERIODOS.map((p) => (
                  <option key={p.value} value={p.value}>
                    {p.label}
                  </option>
                ))}
              </select>
            </div>
          </div>
          <div className="text-center text-sm text-gray-500 mt-4 bg-blue-50 p-2 rounded-md">
            Seleccione el año y periodo para ver y guardar calificaciones
          </div>
        </div>
      </div>

      <div className="w-full max-w-5xl flex flex-col md:flex-row gap-8 mt-8">
        {/* Panel izquierdo: lista de grados */}
        <div className="md:w-1/4 w-full">
          <div className="font-semibold mb-2 text-lg">Grados donde dicta {asignatura ? asignatura.nombre : ""}:</div>
          {!asignatura ? (
            <div className="mt-2 text-gray-500">No tiene asignatura asignada.</div>
          ) : grados.length === 0 ? (
            <div className="mt-2 text-gray-500">No hay grados asignados para este periodo.</div>
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
        <div className="md:w-3/4 w-full">
          {gradoSeleccionado ? (
            <div className="card-modern">
              <h2 className="text-2xl font-bold mb-2 text-center title-modern">
                Estudiantes de {grados.find(g => g.id === gradoSeleccionado)?.nombre}
              </h2>
              <div className="text-center mb-6">
                <span className="inline-block bg-blue-100 text-blue-800 px-4 py-2 rounded-full font-semibold text-sm">
                  <span className="font-bold">{anoSeleccionado}</span> - {PERIODOS.find(p => p.value === periodo)?.label}
                </span>
              </div>
              {feedback && (
                <div className={`mb-4 text-center font-semibold ${feedback.type === "success" ? "text-green-600" : "text-red-600"}`}>
                  {feedback.message}
                </div>
              )}
              <TableEstudiantes
                data={
                  (estudiantesPorGrado[gradoSeleccionado] || []).map((est: any) => ({
                    id: String(est.id),
                    nombre: est.nombre_completo,
                    documento: est.documento,
                    grado: grados.find(g => g.id === gradoSeleccionado)?.nombre || "",
                    nota: est.nota ?? undefined,
                    nacimiento: est.nacimiento ?? "",
                    acudiente: est.acudiente ?? "",
                  }))
                }
                onGuardar={async (estudiantesEditados) => {
                  setFeedback(null);
                  try {
                    // 1. Obtener las calificaciones actuales de este grado, asignatura y periodo
                    // Formar el periodo completo (año + periodo)
                    const periodoCompleto = `${anoSeleccionado}-${periodo}`;
                    const res = await getCalificaciones({
                      cursoId: String(gradoSeleccionado),
                      asignaturaId: asignatura.id,
                      periodo: periodoCompleto,
                    });
                    const calificaciones = (res as { calificaciones: any[] }).calificaciones || [];

                    // 2. Actualizar o registrar cada calificación
                    await Promise.all(
                      estudiantesEditados.map(async (est) => {
                        const cal = calificaciones.find(
                          (c: any) => String(c.estudianteId) === String(est.id)
                        );
                        if (cal) {
                          // Si existe, actualiza solo si cambió la nota
                          if (est.nota !== undefined && est.nota !== cal.nota) {
                            await actualizarCalificacion(cal.id, est.nota);
                          }
                        } else if (est.nota !== undefined) {
                          // Si NO existe, crea la calificación
                          console.log(`Registrando calificación - Estudiante: ${est.id}, Periodo Completo: ${periodoCompleto}`);
                          await registrarCalificacion({
                            estudianteId: String(est.id),
                            asignaturaId: String(asignatura.id),
                            cursoId: String(gradoSeleccionado),
                            nota: est.nota,
                            periodo: periodoCompleto,
                            observaciones: `Profesor: ${profesor.nombre} (${profesor.id}) | Año: ${anoSeleccionado}`
                          });
                        }
                      })
                    );
                    // 3. Refresca las notas en la tabla
                    await refrescarNotas(String(gradoSeleccionado), asignatura.id, anoSeleccionado, periodo);
                    setFeedback({ type: "success", message: "Notas guardadas correctamente." });
                  } catch (e) {
                    setFeedback({ type: "error", message: "Error al guardar las notas." });
                  }
                }}
              />
              <button
                className="btn-secondary mt-4"
                onClick={() => setGradoSeleccionado(null)}
              >
                Volver a grados
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