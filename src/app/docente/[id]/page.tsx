"use client";

import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import { getAsignaturas } from "../../api/asignaturasApi";
import { getAllCursosWithEstudiantes, getCursoEstudiantes } from "../../api/estudiantesCursos.api";
import TableEstudiantes from "../../components/TableEstudiantes";
import { actualizarCalificacion, getCalificaciones, registrarCalificacion } from "../../api/calificacionesApi";
import { getAuthStatus } from "../../api/authApi";

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

// Unificar selector de periodo (igual que en gradoGestion)
const periodosDisponibles: string[] = [];
for (const ano of ANOS) {
  for (const p of PERIODOS) {
    periodosDisponibles.push(`${ano.value}-${p.value}`);
  }
}

export default function DocenteDetallePage() {
  const params = useParams();
  const id = params.id as string;
  const [profesor, setProfesor] = useState<any>(null);
  const [asignaturas, setAsignaturas] = useState<any[]>([]); // Todas las asignaturas del profesor
  const [asignatura, setAsignatura] = useState<any>(null); // Asignatura seleccionada
  const [gradosOriginales, setGradosOriginales] = useState<any[]>([]); // Datos originales de los cursos
  const [estudiantesOriginales, setEstudiantesOriginales] = useState<Record<number, any[]>>({}); // Datos originales de los estudiantes
  const [grados, setGrados] = useState<any[]>([]); // Cursos visibles
  const [estudiantesPorGrado, setEstudiantesPorGrado] = useState<Record<number, any[]>>({}); // Estudiantes visibles
  const [gradoSeleccionado, setGradoSeleccionado] = useState<number | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [periodo, setPeriodo] = useState<string>(periodosDisponibles[0]);
  const [feedback, setFeedback] = useState<{ type: "success" | "error"; message: string } | null>(null);

  useEffect(() => {
    async function fetchData() {
      setLoading(true);
      // Validar autenticación y rol antes de cargar datos
      const auth = await getAuthStatus();
      if (!auth.isAuthenticated || auth.user.role !== "PROFESOR") {
        window.location.href = "/login";
        return;
      }
      try {
        // Buscar profesor por nombre (no por id)
        const profsRes = await import("../../api/profesoresApi").then(api => api.getProfesores());
        const profesores = (profsRes as { profesores: any[] }).profesores || [];
        // Buscar por nombre exacto (case sensitive, igual que auth.user.name)
        const prof = profesores.find((p: any) => p.nombre === auth.user.name);
        if (!prof) throw new Error("Profesor no encontrado para el usuario autenticado");
        setProfesor(prof);

        // Obtener asignaturas asignadas a este profesor (por su id de Mongo)
        const asigRes = await getAsignaturas();
        const todasAsignaturas = (asigRes as { asignaturas: any[] }).asignaturas || [];
        // Buscar todas las asignaturas donde el id del profesor esté en profesorIds
        const asignaturasDelProfesor = todasAsignaturas.filter((a: any) => a.profesorIds && a.profesorIds.includes(prof.id));
        setAsignaturas(asignaturasDelProfesor);
        // Seleccionar la primera asignatura por defecto
        setAsignatura(asignaturasDelProfesor[0] || null);

        // Obtener cursos y estudiantes desde REST
        const cursos = await getAllCursosWithEstudiantes();
        // Guardar los datos originales
        setGradosOriginales(cursos);
        const estudiantesPorGradoTmp: Record<number, any[]> = {};
        cursos.forEach((curso: any) => {
          estudiantesPorGradoTmp[curso.id] = curso.estudiantes || [];
        });
        setEstudiantesOriginales(estudiantesPorGradoTmp);
        // Refrescar cursos y estudiantes SOLO para el periodo actual (filtrando por profesor)
        setTimeout(() => refrescarCursosYEstudiantes(periodo), 0);
      } catch (error) {
        console.error("Error al cargar el docente:", error);
        setError(typeof error === 'string' ? error : "Error al cargar el docente");
      } finally {
        setLoading(false);
      }
    }
    fetchData();
  }, [id]);

  async function refrescarNotas(gradoId: string, asignaturaId: string, periodo: string) {
    const periodoCompleto = periodo;
    //console.log(`Consultando calificaciones con periodo: ${periodoCompleto}`);
    
    const res = await getCalificaciones({
      cursoId: String(gradoId),
      asignaturaId: asignaturaId,
      periodo: periodoCompleto,
    });
    const calificaciones = (res as { calificaciones: any[] }).calificaciones || [];
    //console.log(`Calificaciones encontradas: ${calificaciones.length}`);
    
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

  async function refrescarCursosYEstudiantes(periodo: string) {
    const periodoCompleto = periodo;
    //console.log(`Refrescando cursos y estudiantes para el periodo: ${periodoCompleto}`);

    try {
      // Obtener calificaciones para el periodo completo
      const res = await getCalificaciones({ periodo: periodoCompleto });
      const calificaciones = (res as { calificaciones: any[] }).calificaciones || [];

      // Filtrar calificaciones donde el profesor aparece en las observaciones
      let calificacionesProfesor = calificaciones;
      if (profesor) {
        calificacionesProfesor = calificaciones.filter((cal: any) =>
          cal.observaciones && cal.observaciones.includes(`Profesor: ${profesor.nombre}`)
        );
      }

      // Filtrar cursos con calificaciones del profesor en este periodo
      const cursosIds = [...new Set(calificacionesProfesor.map((cal: any) => cal.cursoId))];
      let cursosAsignados = gradosOriginales.filter((curso) => cursosIds.includes(String(curso.id)));

      // Si hay un grado seleccionado pero no está en cursosAsignados, lo agregamos para mostrar sus estudiantes
      let gradoExtra = null;
      if (gradoSeleccionado && !cursosAsignados.find((g) => g.id === gradoSeleccionado)) {
        gradoExtra = gradosOriginales.find((g) => g.id === gradoSeleccionado);
        if (gradoExtra) {
          cursosAsignados.push(gradoExtra);
        }
      }

      // Obtener estudiantes de cada curso usando el endpoint GraphQL
      const estudiantesPorGradoAsignados: Record<number, any[]> = {};
      await Promise.all(
        cursosAsignados.map(async (curso: any) => {
          try {
            //console.log("aqui se hace el fetch a getCursoEstudiantes(curso.id); curso.id--> " + curso.id)
            const resEst = await getCursoEstudiantes(curso.id);
            estudiantesPorGradoAsignados[curso.id] = resEst || [];
          } catch (e) {
            estudiantesPorGradoAsignados[curso.id] = [];
          }
        })
      );

      setGrados([...cursosAsignados]);
      setEstudiantesPorGrado({ ...estudiantesPorGradoAsignados });
    } catch (error) {
      console.error("Error al refrescar cursos y estudiantes:", error);
      setGrados([]);
      setEstudiantesPorGrado({});
    }
  }

  // Effect to refresh notes when periodo o gradoSeleccionado cambian
  useEffect(() => {
    if (gradoSeleccionado && asignatura) {
      refrescarNotas(String(gradoSeleccionado), asignatura.id, periodo);
    }
  }, [gradoSeleccionado, periodo, asignatura]);

  // Effect to refresh courses and students when periodo cambia
  useEffect(() => {
    refrescarCursosYEstudiantes(periodo);
  }, [periodo]);

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
      {/* Selector de asignatura si hay más de una */}
      {asignaturas.length > 1 && (
        <div className="mb-4">
          <label className="font-semibold mr-2">Asignatura:</label>
          <select
            className="input-modern"
            value={asignatura?.id || ""}
            onChange={e => {
              const found = asignaturas.find(a => a.id === e.target.value);
              setAsignatura(found || null);
            }}
          >
            {asignaturas.map(a => (
              <option key={a.id} value={a.id}>{a.nombre}</option>
            ))}
          </select>
        </div>
      )}
      {asignatura && (
        <div className="text-lg mb-2">
          <strong>Asignatura:</strong>{" "}
          <span className="inline-block bg-blue-100 text-blue-800 px-3 py-1 rounded font-semibold">
            {asignatura.nombre}
          </span>
        </div>
      )}

      {/* Selector de periodo unificado */}
      <div className="w-full max-w-md mb-6">
        <div className="card-modern p-6 shadow-lg border border-blue-100">
          <h3 className="font-bold text-xl mb-4 text-center text-blue-800">Periodo Académico</h3>
          <div className="flex flex-col gap-4 justify-center">
            <div className="w-full">
              <label htmlFor="periodo-select" className="font-semibold block mb-2 text-gray-700">Periodo:</label>
              <select
                id="periodo-select"
                className="border border-gray-300 rounded-md px-3 py-2 w-full bg-white focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                value={periodo}
                onChange={e => setPeriodo(e.target.value)}
              >
                <option value="" disabled>Seleccione periodo</option>
                {periodosDisponibles.map((p) => (
                  <option key={p} value={p}>{p}</option>
                ))}
              </select>
            </div>
          </div>
          <div className="text-center text-sm text-gray-500 mt-4 bg-blue-50 p-2 rounded-md">
            Seleccione el periodo para ver y guardar calificaciones
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
                  <span className="font-bold">{periodo.split('-')[0]}</span> - {PERIODOS.find(p => p.value === periodo.split('-')[1])?.label}
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
                    nombre: est.nombreCompleto || est.nombre_completo || est.nombre || "",
                    documento: est.documento,
                    grado: grados.find(g => g.id === gradoSeleccionado)?.nombre || "",
                    nota: est.nota ?? undefined,
                    nacimiento: est.fechaNacimiento || est.nacimiento || "",
                    acudiente: est.acudiente ?? "",
                  }))
                }
                onGuardar={async (estudiantesEditados) => {
                  setFeedback(null);
                  // Validación: solo permitir enteros positivos desde 0
                  const invalid = estudiantesEditados.find(est =>
                    est.nota !== undefined && (!Number.isInteger(est.nota) || est.nota < 0)
                  );
                  if (invalid) {
                    setFeedback({ type: "error", message: "Solo se permiten calificaciones enteras positivas (0 o mayor)." });
                    return;
                  }
                  try {
                    // 1. Obtener las calificaciones actuales de este grado, asignatura y periodo
                    // Formar el periodo completo (año + periodo)
                    const periodoCompleto = `${periodo}`;
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
                          //console.log(`Registrando calificación - Estudiante: ${est.id}, Periodo Completo: ${periodoCompleto}`);
                          await registrarCalificacion({
                            estudianteId: String(est.id),
                            asignaturaId: String(asignatura.id),
                            cursoId: String(gradoSeleccionado),
                            nota: est.nota,
                            periodo: periodoCompleto,
                            observaciones: `Profesor: ${profesor.nombre} (${profesor.id}) | Año: ${periodo.split('-')[0]}`
                          });
                        }
                      })
                    );
                    // 3. Refresca las notas en la tabla
                    await refrescarNotas(String(gradoSeleccionado), asignatura.id, periodo);
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