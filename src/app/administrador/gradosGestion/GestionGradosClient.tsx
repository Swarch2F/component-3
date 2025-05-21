"use client";
import { useState, useEffect } from "react";
import MenuAsignaturas, { Asignatura as AsignaturaMenu } from "./MenuAsignaturas";
import { getAsignaturas } from "../../api/asignaturasApi";
import { getAllCursos, createCurso, updateCurso, deleteCurso, Curso, getAllEstudiantes, Estudiante as EstudianteApi } from "../../api/estudiantesCursos.api";
import { getCalificaciones, registrarCalificacion } from "../../api/calificacionesApi";

// Definir tipos para los datos
interface Asignatura {
  id: number | string;
  nombre: string;
  profesor?: string;
}

interface Estudiante {
  nombre: string;
  notas: Record<string | number, number>; // id de asignatura -> nota
}

interface Grado {
  id: number | string;
  nombre: string;
  estudiantes: Estudiante[];
  asignaturas: Asignatura[];
}

export default function GestionGradosClient() {
  const [grados, setGrados] = useState<Grado[]>([]);
  const [loadingGrados, setLoadingGrados] = useState(true);
  const [gradoSeleccionado, setGradoSeleccionado] = useState<Grado | null>(null);
  const [nuevoGrado, setNuevoGrado] = useState("");
  const [editando, setEditando] = useState<number | null>(null);
  const [nombreEditado, setNombreEditado] = useState("");
  const [showConfirm, setShowConfirm] = useState<{ tipo: 'grado' | 'asignatura', id: number, nombre: string } | null>(null);
  const [asignaturasDisponibles, setAsignaturasDisponibles] = useState<AsignaturaMenu[]>([]);
  const [profesoresPorAsignatura, setProfesoresPorAsignatura] = useState<Record<string, string>>({});
  const [estudiantesPorGrado, setEstudiantesPorGrado] = useState<Record<number | string, EstudianteApi[]>>({});
  const [periodo, setPeriodo] = useState<string>("");
  const [calificaciones, setCalificaciones] = useState<any[]>([]);
  const [loadingCalificaciones, setLoadingCalificaciones] = useState(false);
  const [periodoError, setPeriodoError] = useState<string>("");
  const [errorGrado, setErrorGrado] = useState<string>("");

  // Opciones de periodo (puedes ajustar según tus periodos reales)
  const periodosDisponibles = [
    "2025-1",
    "2025-2",
    "2026-1",
    "2026-2"
  ];

  useEffect(() => {
    async function fetchGradosYEstudiantes() {
      setLoadingGrados(true);
      try {
        const cursos: Curso[] = await getAllCursos();
        const estudiantes: EstudianteApi[] = await getAllEstudiantes();
        setGrados(cursos.map(c => ({ id: c.id!, nombre: c.nombre, estudiantes: [], asignaturas: [] })));
        // Asociar estudiantes a cada grado
        const porGrado: Record<number | string, EstudianteApi[]> = {};
        cursos.forEach(curso => {
          porGrado[curso.id!] = estudiantes.filter(e => e.curso === curso.id);
        });
        setEstudiantesPorGrado(porGrado);
      } finally {
        setLoadingGrados(false);
      }
    }
    async function fetchAsignaturas() {
      const res = await getAsignaturas();
      const asignaturas = (res as any).asignaturas as { id: string; nombre: string; profesorIds?: string[] }[];
      setAsignaturasDisponibles(asignaturas.map((a) => ({ id: a.id, nombre: a.nombre })));
      const profMap: Record<string, string> = {};
      asignaturas.forEach((a) => {
        if (a.profesorIds && a.profesorIds.length > 0) {
          profMap[a.id] = `Profesor asignado (${a.profesorIds.length})`;
        }
      });
      setProfesoresPorAsignatura(profMap);
    }
    fetchGradosYEstudiantes();
    fetchAsignaturas();
  }, []);

  // Cargar calificaciones y reconstruir asignaturas al cambiar grado, periodo o calificaciones
  useEffect(() => {
    async function fetchCalificacionesYAsignaturas() {
      if (!gradoSeleccionado || !periodo) {
        setCalificaciones([]);
        setGradoSeleccionado(prev => prev ? { ...prev, asignaturas: [] } : null);
        return;
      }
      setLoadingCalificaciones(true);
      try {
        const res = await getCalificaciones({ cursoId: String(gradoSeleccionado.id), periodo });
        const calificaciones = (res as any).calificaciones || [];
        setCalificaciones(calificaciones);
        // Solo asignaturas con calificaciones en este periodo
        const asignaturasMap: Record<string, { id: string, nombre: string, profesor?: string }> = {};
        calificaciones.forEach((c: any) => {
          // Solo considerar calificaciones del periodo actual
          if (c.periodo !== periodo) return;
          if (!asignaturasMap[c.asignaturaId]) {
            let profesor = undefined;
            if (c.observaciones && c.observaciones.startsWith("Profesor:")) {
              // Extraer solo el nombre antes del paréntesis (si existe)
              const match = c.observaciones.match(/^Profesor:\s*(.+?)(?:\s*\(.*\))?$/);
              profesor = match ? match[1].trim() : c.observaciones.replace("Profesor:", "").trim();
            }
            asignaturasMap[c.asignaturaId] = {
              id: c.asignaturaId,
              nombre: "", // Se completará después
              profesor
            };
          }
        });
        Object.values(asignaturasMap).forEach(a => {
          const found = asignaturasDisponibles.find(ad => String(ad.id) === String(a.id));
          if (found) a.nombre = found.nombre;
        });
        setGradoSeleccionado(prev => prev ? {
          ...prev,
          asignaturas: Object.values(asignaturasMap)
        } : null);
      } catch (e) {
        setCalificaciones([]);
        setGradoSeleccionado(prev => prev ? { ...prev, asignaturas: [] } : null);
      } finally {
        setLoadingCalificaciones(false);
      }
    }
    fetchCalificacionesYAsignaturas();
  }, [gradoSeleccionado?.id, periodo, asignaturasDisponibles]);

  // Obtener periodos únicos con calificaciones para el grado seleccionado
  const periodosConCalificaciones = gradoSeleccionado && calificaciones.length > 0
    ? Array.from(new Set(calificaciones.map(c => c.periodo))).sort()
    : [];

  // Agregar grado
  const agregarGrado = async () => {
    if (nuevoGrado.trim() === "") return;
    setErrorGrado("");
    // Generar el código a partir del nombre, ejemplo: "Décimo C" -> "DECIMO-C"
    const codigo = nuevoGrado
      .normalize("NFD")
      .replace(/\p{Diacritic}/gu, "") // Quitar tildes
      .replace(/[^\w\s-]/g, "") // Quitar caracteres especiales
      .replace(/\s+/g, "-") // Espacios por guion
      .toUpperCase();
    try {
      await createCurso({ nombre: nuevoGrado, codigo });
      const cursos: Curso[] = await getAllCursos();
      setGrados(cursos.map(c => ({ id: c.id!, nombre: c.nombre, estudiantes: [], asignaturas: [] })));
      setNuevoGrado("");
    } catch (e: any) {
      setErrorGrado(e.message || "Error al crear grado");
    }
  };

  // Eliminar grado con confirmación
  const eliminarGrado = (id: number) => {
    const grado = grados.find(g => g.id === id);
    if (!grado) return;
    setShowConfirm({ tipo: 'grado', id, nombre: grado.nombre });
  };
  const confirmarEliminar = async () => {
    if (!showConfirm) return;
    if (showConfirm.tipo === 'grado') {
      await deleteCurso(showConfirm.id);
      const cursos: Curso[] = await getAllCursos();
      setGrados(cursos.map(c => ({ id: c.id!, nombre: c.nombre, estudiantes: [], asignaturas: [] })));
      if (gradoSeleccionado && gradoSeleccionado.id === showConfirm.id) setGradoSeleccionado(null);
    } else if (showConfirm.tipo === 'asignatura' && gradoSeleccionado) {
      setGrados(grados.map(g =>
        g.id === gradoSeleccionado.id
          ? { ...g, asignaturas: g.asignaturas.filter(a => a.id !== showConfirm.id) }
          : g
      ));
      setGradoSeleccionado({
        ...gradoSeleccionado,
        asignaturas: gradoSeleccionado.asignaturas.filter(a => a.id !== showConfirm.id),
      });
    }
    setShowConfirm(null);
  };
  const cancelarEliminar = () => setShowConfirm(null);

  // Editar grado
  const iniciarEdicion = (grado: Grado) => {
    setEditando(grado.id as number);
    setNombreEditado(grado.nombre);
  };
  const guardarEdicion = async (id: number) => {
    await updateCurso(id, { nombre: nombreEditado });
    const cursos: Curso[] = await getAllCursos();
    setGrados(cursos.map(c => ({ id: c.id!, nombre: c.nombre, estudiantes: [], asignaturas: [] })));
    setEditando(null);
    setNombreEditado("");
  };

  // Eliminar asignatura y profesor del grado (elimina todas las calificaciones de esa asignatura en el periodo actual)
  const eliminarAsignaturaDeGrado = async (asignaturaId: number | string) => {
    if (!gradoSeleccionado || !periodo) return;
    // Buscar todas las calificaciones de esa asignatura, grado y periodo
    const cursoId = String(gradoSeleccionado.id);
    const res = await getCalificaciones({ cursoId, asignaturaId: String(asignaturaId), periodo });
    const calificacionesAEliminar = (res as any).calificaciones || [];
    // Eliminar todas las calificaciones encontradas
    for (const cal of calificacionesAEliminar) {
      await import("../../api/calificacionesApi").then(api => api.eliminarCalificacion(cal.id));
    }
    // Refrescar calificaciones y asignaturas
    const res2 = await getCalificaciones({ cursoId, periodo });
    const nuevasCalificaciones = (res2 as any).calificaciones || [];
    setCalificaciones(nuevasCalificaciones);
    // Reconstruir asignaturas del grado seleccionado según las calificaciones actuales
    const asignaturasMap: Record<string, { id: string, nombre: string, profesor?: string }> = {};
    nuevasCalificaciones.forEach((c: any) => {
      if (c.periodo !== periodo) return;
      if (!asignaturasMap[c.asignaturaId]) {
        let profesor = undefined;
        if (c.observaciones && c.observaciones.startsWith("Profesor:")) {
          profesor = c.observaciones.replace("Profesor:", "").trim();
        }
        asignaturasMap[c.asignaturaId] = {
          id: c.asignaturaId,
          nombre: "", // Se completará después
          profesor
        };
      }
    });
    Object.values(asignaturasMap).forEach(a => {
      const found = asignaturasDisponibles.find(ad => String(ad.id) === String(a.id));
      if (found) a.nombre = found.nombre;
    });
    setGradoSeleccionado(prev => prev ? {
      ...prev,
      asignaturas: Object.values(asignaturasMap)
    } : null);
  };

  return (
    <div className="min-h-screen bg-[var(--color-bg)] py-8">
      {/* Modal de confirmación */}
      {showConfirm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40">
          <div className="bg-white rounded-lg shadow-lg p-8 max-w-sm w-full text-center border-2 border-primary-200">
            <h3 className="text-xl font-bold mb-4 text-primary-600">¿Eliminar {showConfirm.tipo === 'grado' ? 'grado' : 'asignatura'}?</h3>
            <p className="mb-6 text-gray-700">¿Estás seguro de que deseas eliminar {showConfirm.tipo === 'grado' ? 'el grado' : 'la asignatura'} <span className="font-semibold text-primary-500">&quot;{showConfirm.nombre}&quot;</span>?<br/>Esta acción no se puede deshacer.</p>
            <div className="flex justify-center gap-4">
              <button className="btn-danger px-4 py-2" onClick={confirmarEliminar}>Eliminar</button>
              <button className="btn-secondary px-4 py-2" onClick={cancelarEliminar}>Cancelar</button>
            </div>
          </div>
        </div>
      )}
      <div className="max-w-5xl mx-auto">
        <div className="card-modern text-center font-bold text-2xl tracking-wide mb-6 title-modern">
          Gestión de Grados
        </div>
        <div className="card-modern flex flex-col md:flex-row gap-8 p-6">
          {/* Lista de grados */}
          <div className="w-full md:w-1/3">
            <h2 className="font-bold text-lg mb-4">Grados</h2>
            <div className="space-y-2">
              {grados.map((grado) => (
                <div key={grado.id} className={`flex items-center justify-between rounded px-3 py-2 cursor-pointer transition border ${gradoSeleccionado && gradoSeleccionado.id === grado.id ? 'bg-primary-100 border-primary-400' : 'bg-white/10 border-white/20'}`}
                  onClick={() => setGradoSeleccionado(grado)}>
                  {editando === grado.id ? (
                    <>
                      <input value={nombreEditado} onChange={e => setNombreEditado(e.target.value)} className="input-modern mr-2" />
                      <button onClick={() => guardarEdicion(grado.id as number)} className="btn-primary px-2 py-1 text-xs">Guardar</button>
                    </>
                  ) : (
                    <>
                      <span className="font-semibold">{grado.nombre}</span>
                      <div className="flex gap-2">
                        <button onClick={e => { e.stopPropagation(); iniciarEdicion(grado); }} className="btn-secondary px-2 py-1 text-xs">Editar</button>
                        <button
                          onClick={e => { e.stopPropagation(); eliminarGrado(grado.id as number); }}
                          className={`btn-danger px-2 py-1 text-xs${(estudiantesPorGrado[grado.id] && estudiantesPorGrado[grado.id].length > 0) ? ' opacity-50 cursor-not-allowed' : ''}`}
                          disabled={!!(estudiantesPorGrado[grado.id] && estudiantesPorGrado[grado.id].length > 0)}
                          title={estudiantesPorGrado[grado.id] && estudiantesPorGrado[grado.id].length > 0 ? 'No se puede eliminar un grado con estudiantes' : ''}
                        >
                          Eliminar
                        </button>
                      </div>
                    </>
                  )}
                </div>
              ))}
            </div>
            <div className="flex mt-4 gap-2">
              <input value={nuevoGrado} onChange={e => setNuevoGrado(e.target.value)} placeholder="Nuevo grado" className="input-modern flex-1" />
              <button onClick={agregarGrado} className="btn-primary px-4">Agregar</button>
            </div>
            {errorGrado && (
              <div className="text-red-500 text-sm mt-2">{errorGrado}</div>
            )}
          </div>

          {/* Detalle del grado seleccionado */}
          <div className="w-full md:w-2/3">
            {gradoSeleccionado ? (
              <div>
                <h2 className="font-bold text-lg mb-2">Estudiantes de {gradoSeleccionado.nombre}</h2>
                {/* Selector de periodo */}
                <div className="mb-4 flex items-center gap-2">
                  <label className="font-semibold">Periodo:</label>
                  <input
                    className="border rounded px-2 py-1"
                    list="periodos-list"
                    value={periodo}
                    onChange={e => {
                      setPeriodo(e.target.value);
                      if (e.target.value) setPeriodoError("");
                    }}
                    placeholder="Ej: 2025-1"
                  />
                  <datalist id="periodos-list">
                    {periodosConCalificaciones.map(p => (
                      <option key={p} value={p} />
                    ))}
                  </datalist>
                </div>
                {periodoError && (
                  <div className="text-red-500 text-sm mb-2">{periodoError}</div>
                )}
                <div className="overflow-x-auto">
                  <table className="min-w-full border text-sm">
                    <thead>
                      <tr>
                        <th className="px-2 py-1 border">Estudiante</th>
                        <th className="px-2 py-1 border">Documento</th>
                        {gradoSeleccionado.asignaturas.map((asig) => (
                          <th key={asig.id} className="px-2 py-1 border">{asig.nombre}</th>
                        ))}
                      </tr>
                    </thead>
                    <tbody>
                      {gradoSeleccionado && (estudiantesPorGrado[gradoSeleccionado.id] || []).length === 0 ? (
                        <tr><td colSpan={2 + gradoSeleccionado.asignaturas.length} className="text-center text-gray-400 py-2">No hay estudiantes.</td></tr>
                      ) : loadingCalificaciones ? (
                        <tr><td colSpan={2 + gradoSeleccionado.asignaturas.length} className="text-center py-4">Cargando calificaciones...</td></tr>
                      ) : (
                        gradoSeleccionado && (estudiantesPorGrado[gradoSeleccionado.id] || []).map((est, i) => (
                          <tr key={est.id}>
                            <td className="px-2 py-1 border font-semibold">{est.nombre_completo}</td>
                            <td className="px-2 py-1 border">{est.documento}</td>
                            {gradoSeleccionado.asignaturas.map((asig) => {
                              // Buscar la calificación para este estudiante/asignatura/periodo
                              const cal = calificaciones.find(
                                c => c.estudianteId == est.id && c.asignaturaId == asig.id && c.periodo === periodo
                              );
                              return (
                                <td key={asig.id} className="px-2 py-1 border text-center">
                                  {cal ? cal.nota : <span className="text-gray-400">-</span>}
                                </td>
                              );
                            })}
                          </tr>
                        ))
                      )}
                    </tbody>
                  </table>
                </div>
                <h2 className="font-bold text-lg mb-2 mt-8">Asignaturas y Profesores</h2>
                <MenuAsignaturas
                  asignaturasSeleccionadas={gradoSeleccionado.asignaturas}
                  asignaturasDisponibles={asignaturasDisponibles}
                  profesoresPorAsignatura={profesoresPorAsignatura}
                  onAgregar={async (asig: AsignaturaMenu & { profesor?: any }) => {
                    if (!periodo) {
                      setPeriodoError("Debes ingresar o seleccionar un periodo antes de agregar una asignatura.");
                      return;
                    }
                    setPeriodoError("");
                    // Actualizar estado local
                    setGrados(grados.map(g =>
                      g.id === gradoSeleccionado.id
                        ? { ...g, asignaturas: [...g.asignaturas, { ...asig }] }
                        : g
                    ));
                    setGradoSeleccionado({
                      ...gradoSeleccionado,
                      asignaturas: [...gradoSeleccionado.asignaturas, { ...asig }],
                    });

                    // Crear calificaciones para cada estudiante del grado y periodo seleccionado
                    if (!periodo || !asig.id || !asig.profesor || !gradoSeleccionado) return;
                    const estudiantes = estudiantesPorGrado[gradoSeleccionado.id] || [];
                    const cursoId = String(gradoSeleccionado.id);
                    const asignaturaId = String(asig.id);
                    const profesorId = asig.profesor.id;
                    // Nota inicial: null (se usa 0 porque GraphQL espera Float, y null no es válido)
                    await Promise.all(estudiantes.map(est =>
                      registrarCalificacion({
                        estudianteId: String(est.id),
                        asignaturaId,
                        cursoId,
                        periodo,
                        nota: 0, // o null si la API lo permite
                        observaciones: `Profesor: ${asig.profesor.nombre} (${profesorId})`
                      })
                    ));
                    // Refrescar calificaciones
                    const res = await getCalificaciones({ cursoId, periodo });
                    setCalificaciones((res as any).calificaciones || []);
                  }}
                  onEliminar={eliminarAsignaturaDeGrado}
                  disabled={!(estudiantesPorGrado[gradoSeleccionado.id] && estudiantesPorGrado[gradoSeleccionado.id].length > 0)}
                />
              </div>
            ) : (
              <div className="text-gray-400 text-center mt-12">Selecciona un grado para ver detalles</div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
