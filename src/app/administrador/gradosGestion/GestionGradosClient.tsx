"use client";
import { useState, useEffect, useRef, useCallback } from "react";
import MenuAsignaturas, { Asignatura as AsignaturaMenu } from "./MenuAsignaturas";
import { getAsignaturas } from "../../api/asignaturasApi";
import { getCursosPage, getCursoEstudiantes, Curso, Estudiante as EstudianteApi, updateCursoParcial } from '../../api/estudiantesCursos.api';
import { getCalificaciones, registrarCalificacion } from "../../api/calificacionesApi";

// Definir tipos para los datos
interface Asignatura {
  id: number | string;
  nombre: string;
  profesor?: string;
}

// Estudiante local para el componente (con notas)
interface EstudianteLocal {
  nombre: string;
  notas: Record<string | number, number>; // id de asignatura -> nota
}

interface Grado {
  id: number | string;
  nombre: string;
  estudiantes: EstudianteLocal[];
  asignaturas: Asignatura[];
}

// Años disponibles (desde 2023 hasta el año actual)
const currentYear = new Date().getFullYear();
const ANOS = Array.from({ length: currentYear - 2022 }, (_, i) => `${2023 + i}`);

// Periodos disponibles (solo uno a la vez, simplificado)
const PERIODOS_DESCRIPTIVOS = [
  { value: "1", label: "Primer Periodo" },
  { value: "2", label: "Segundo Periodo" },
  { value: "3", label: "Tercer Periodo" },
  { value: "4", label: "Cuarto Periodo" },
];

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
  const [loadingEstudiantes, setLoadingEstudiantes] = useState(false);
  const [periodoError, setPeriodoError] = useState<string>("");
  const [errorGrado, setErrorGrado] = useState<string>("");
  const [anoSeleccionado, setAnoSeleccionado] = useState<string>("");

  // Estados para infinite scroll de grados
  const [cursosPage, setCursosPage] = useState(1);
  const [hasMoreCursos, setHasMoreCursos] = useState(true);
  const [loadingMoreCursos, setLoadingMoreCursos] = useState(false);

  // Estados para infinite scroll de estudiantes
  const [estudiantesPage, setEstudiantesPage] = useState(1);
  const [hasMoreEstudiantes, setHasMoreEstudiantes] = useState(true);
  const [loadingMoreEstudiantes, setLoadingMoreEstudiantes] = useState(false);

  // Referencias para infinite scroll
  const observerRef = useRef<IntersectionObserver | null>(null);
  const estudiantesObserverRef = useRef<IntersectionObserver | null>(null);

  // Opciones de periodo (ahora simplificadas: año-periodo)
  const periodosDisponibles = [];
  for (const ano of ANOS) {
    for (const p of PERIODOS_DESCRIPTIVOS) {
      periodosDisponibles.push(`${ano}-${p.value}`);
    }
  }

  // Función para ordenar grados por orden numérico
  const ordenarGradosNumerico = (grados: Grado[]) => {
    const ordenNumerico: { [key: string]: number } = {
      'preescolar': 0,
      'primero': 1,
      'segundo': 2,
      'tercero': 3,
      'cuarto': 4,
      'quinto': 5,
      'sexto': 6,
      'septimo': 7,
      'octavo': 8,
      'noveno': 9,
      'decimo': 10,
      'undecimo': 11,
      'duodecimo': 12
    };

    return grados.sort((a, b) => {
      const nombreA = a.nombre.toLowerCase();
      const nombreB = b.nombre.toLowerCase();
      
      // Buscar el número en el nombre del grado
      const numeroA = Object.keys(ordenNumerico).find(key => nombreA.includes(key));
      const numeroB = Object.keys(ordenNumerico).find(key => nombreB.includes(key));
      
      if (numeroA && numeroB) {
        return ordenNumerico[numeroA] - ordenNumerico[numeroB];
      } else if (numeroA) {
        return -1; // Los que tienen número van primero
      } else if (numeroB) {
        return 1;
      } else {
        // Si no tienen número, ordenar alfabéticamente
        return nombreA.localeCompare(nombreB);
      }
    });
  };

  // Función para cargar más cursos (infinite scroll) - versión con estudiantes
  const loadMoreCursos = async (pageNum: number, isInitial: boolean = false) => {
    if (loadingMoreCursos) return;
    
    setLoadingMoreCursos(true);
    try {
      const res = await getCursosPage(pageNum); // Usar versión con estudiantes
      const cursosList = res.cursos || [];
      
      // Mapear los cursos y sus estudiantes
      const mappedCursos = cursosList.map((c: Curso) => ({ 
        id: c.id!, 
        nombre: c.nombre, 
        estudiantes: (c.estudiantes || []).map((est: EstudianteApi) => ({
          nombre: est.nombreCompleto,
          notas: {}
        })), 
        asignaturas: [] 
      }));

      // Construir el mapeo de estudiantes por grado (usando EstudianteApi para el estado)
      const porGrado: Record<number | string, EstudianteApi[]> = {};
      cursosList.forEach((curso: Curso) => {
        porGrado[curso.id!] = curso.estudiantes || [];
      });

      if (isInitial) {
        const cursosOrdenados = ordenarGradosNumerico(mappedCursos);
        setGrados(cursosOrdenados);
        setEstudiantesPorGrado(porGrado);
      } else {
        setGrados((prev: Grado[]) => {
          const nuevosGrados = [...prev, ...mappedCursos];
          return ordenarGradosNumerico(nuevosGrados);
        });
        setEstudiantesPorGrado((prev: Record<number | string, EstudianteApi[]>) => {
          const updated = { ...prev };
          Object.keys(porGrado).forEach((cursoId: string) => {
            if (!updated[cursoId]) {
              updated[cursoId] = [];
            }
            updated[cursoId] = [...updated[cursoId], ...porGrado[cursoId]];
          });
          return updated;
        });
      }

      setHasMoreCursos(res.hasNext);
      setCursosPage(pageNum + 1);
    } catch (err) {
      console.error("Error cargando más cursos:", err);
    } finally {
      setLoadingMoreCursos(false);
    }
  };



  // Callback para el observer del infinite scroll de grados
  const lastGradoRef = useCallback((node: HTMLDivElement | null) => {
    if (loadingMoreCursos) return;
    
    if (observerRef.current) observerRef.current.disconnect();
    
    observerRef.current = new IntersectionObserver(entries => {
      if (entries[0].isIntersecting && hasMoreCursos) {
        loadMoreCursos(cursosPage);
      }
    });
    
    if (node) observerRef.current.observe(node);
  }, [loadingMoreCursos, hasMoreCursos, cursosPage]);



  // Función para refrescar todos los datos
  const refreshData = async () => {
    setGrados([]);
    setEstudiantesPorGrado({});
    setCursosPage(1);
    setHasMoreCursos(true);
    await loadMoreCursos(1, true);
  };

  // Estados de caché para estudiantes y asignaturas por curso
  const [estudiantesPorCurso, setEstudiantesPorCurso] = useState<Record<string, EstudianteApi[]>>({});
  const [asignaturasPorCurso, setAsignaturasPorCurso] = useState<Record<string, AsignaturaMenu[]>>({});

  // Estado para estudiantes y asignaturas del grado seleccionado
  const [estudiantesSeleccionados, setEstudiantesSeleccionados] = useState<EstudianteApi[]>([]);

  // Al mapear cursos para el estado, asegúrate de que tengan 'asignaturas' (vacío por defecto)
  const mapCursosToGrados = (cursos: Curso[]): Grado[] => cursos.map((c: Curso) => ({
    id: c.id!,
    nombre: c.nombre,
    estudiantes: [],
    asignaturas: []
  }));

  // Cargar solo cursos al inicio
  useEffect(() => {
    async function fetchInitialCursos() {
      setLoadingGrados(true);
      try {
        const res = await getCursosPage(1);
        setGrados(ordenarGradosNumerico(mapCursosToGrados(res.cursos)));
        setHasMoreCursos(res.hasNext);
        setCursosPage(2);
      } finally {
        setLoadingGrados(false);
      }
    }
    fetchInitialCursos();
  }, []);

  // Cuando se selecciona un grado, cargar estudiantes y asignaturas solo si no están en caché
  useEffect(() => {
    if (!gradoSeleccionado) return;
    const cursoId = String(gradoSeleccionado.id);

    if (estudiantesPorCurso[cursoId] && asignaturasPorCurso[cursoId]) {
      setEstudiantesSeleccionados(estudiantesPorCurso[cursoId]);
      setAsignaturasDisponibles(asignaturasPorCurso[cursoId]);
      setLoadingEstudiantes(false); // Asegurar que no esté cargando si ya está en caché
      return;
    }

    async function fetchEstudiantesYAsignaturas(id: string | number) {
      setLoadingEstudiantes(true);
      try {
        const estudiantes = await getCursoEstudiantes(id);
        const res = await getAsignaturas();
        const asignaturas = (res as any).asignaturas.map((a: any) => ({ id: a.id, nombre: a.nombre }));
        setEstudiantesSeleccionados(estudiantes);
        setAsignaturasDisponibles(asignaturas);
        setEstudiantesPorCurso(prev => ({ ...prev, [cursoId]: estudiantes }));
        setAsignaturasPorCurso(prev => ({ ...prev, [cursoId]: asignaturas }));
      } catch (e) {
        console.error("Error al cargar estudiantes/asignaturas:", e);
      } finally {
        setLoadingEstudiantes(false);
      }
    }
    fetchEstudiantesYAsignaturas(gradoSeleccionado.id);
  }, [gradoSeleccionado]);

  // Cuando agregues, edites o elimines estudiantes/asignaturas, invalida el caché de ese curso:
  // Ejemplo para después de una operación de modificación:
  // setEstudiantesPorCurso(prev => { const newCache = { ...prev }; delete newCache[cursoId]; return newCache; });
  // setAsignaturasPorCurso(prev => { const newCache = { ...prev }; delete newCache[cursoId]; return newCache; });

  // Cargar calificaciones y reconstruir asignaturas al cambiar grado, periodo o calificaciones
  useEffect(() => {
    async function fetchCalificacionesYAsignaturas() {
      if (!gradoSeleccionado || !periodo) {
        setCalificaciones([]);
        setGradoSeleccionado((prev: Grado | null) => prev ? { ...prev, asignaturas: [] } : null);
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
        Object.values(asignaturasMap).forEach((a: any) => {
          const found = asignaturasDisponibles.find((ad: any) => String(ad.id) === String(a.id));
          if (found) a.nombre = found.nombre;
        });
        setGradoSeleccionado((prev: Grado | null) => prev ? {
          ...prev,
          asignaturas: Object.values(asignaturasMap)
        } : null);
      } catch (e) {
        setCalificaciones([]);
        setGradoSeleccionado((prev: Grado | null) => prev ? { ...prev, asignaturas: [] } : null);
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
      // await createCurso({ nombre: nuevoGrado, codigo }); // Assuming createCurso is available
      // await refreshData();
      setNuevoGrado("");
    } catch (e: any) {
      setErrorGrado(e.message || "Error al crear grado");
    }
  };

  // Eliminar grado con confirmación
  const eliminarGrado = (id: number) => {
    const grado = grados.find((g: Grado) => g.id === id);
    if (!grado) return;
    setShowConfirm({ tipo: 'grado', id, nombre: grado.nombre });
  };
  
  const confirmarEliminar = async () => {
    if (!showConfirm) return;
    if (showConfirm.tipo === 'grado') {
      // await deleteCurso(showConfirm.id); // Assuming deleteCurso is available
      await refreshData();
      if (gradoSeleccionado && gradoSeleccionado.id === showConfirm.id) setGradoSeleccionado(null);
    } else if (showConfirm.tipo === 'asignatura' && gradoSeleccionado) {
      setGrados(grados.map((g: Grado) =>
        g.id === gradoSeleccionado.id
          ? { ...g, asignaturas: g.asignaturas.filter((a: Asignatura) => a.id !== showConfirm.id) }
          : g
      ));
      setGradoSeleccionado({
        ...gradoSeleccionado,
        asignaturas: gradoSeleccionado.asignaturas.filter((a: Asignatura) => a.id !== showConfirm.id),
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
    try {
      // Usar la mutación parcial para solo actualizar el nombre
      const result = await updateCursoParcial(id, nombreEditado) as any;
      
      // Verificar si la operación fue exitosa
      if (result.actualizarCursoParcial.success) {
        await refreshData();
        setEditando(null);
        setNombreEditado("");
      } else {
        console.error("Error al actualizar curso:", result.actualizarCursoParcial.message);
        // Aquí podrías mostrar un mensaje de error al usuario
      }
    } catch (error) {
      console.error("Error al actualizar curso:", error);
      // Aquí podrías mostrar un mensaje de error al usuario
    }
  };

  // Eliminar asignatura y profesor del grado (elimina solo las calificaciones de esa asignatura en el periodo actual)
  const eliminarAsignaturaDeGrado = async (asignaturaId: number | string) => {
    if (!gradoSeleccionado || !periodo) return;
    const cursoId = String(gradoSeleccionado.id);
    // Buscar solo las calificaciones de esa asignatura, grado y periodo actual
    const res = await getCalificaciones({ cursoId, asignaturaId: String(asignaturaId), periodo });
    const calificacionesAEliminar = (res as any).calificaciones || [];
    // Eliminar solo las calificaciones encontradas para este periodo
    for (const cal of calificacionesAEliminar) {
      if (cal.periodo === periodo) {
        await import("../../api/calificacionesApi").then(api => api.eliminarCalificacion(cal.id));
      }
    }
    // Refrescar calificaciones y asignaturas SOLO del periodo actual
    const res2 = await getCalificaciones({ cursoId, periodo });
    const nuevasCalificaciones = (res2 as any).calificaciones || [];
    setCalificaciones(nuevasCalificaciones);
    // Reconstruir asignaturas del grado seleccionado SOLO según las calificaciones del periodo actual
    const asignaturasMap: Record<string, { id: string, nombre: string, profesor?: string }> = {};
    nuevasCalificaciones.forEach((c: any) => {
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
    Object.values(asignaturasMap).forEach((a: any) => {
      const found = asignaturasDisponibles.find((ad: any) => String(ad.id) === String(a.id));
      if (found) a.nombre = found.nombre;
    });
    setGradoSeleccionado((prev: Grado | null) => prev ? {
      ...prev,
      asignaturas: Object.values(asignaturasMap)
    } : null);
    // Invalida el caché del curso
    setEstudiantesPorCurso(prev => { const newCache = { ...prev }; delete newCache[cursoId]; return newCache; });
    setAsignaturasPorCurso(prev => { const newCache = { ...prev }; delete newCache[cursoId]; return newCache; });
  };
  
  const handleAnoChange = (ano: string) => {
    setAnoSeleccionado(ano);
    // Si ya hay un periodo seleccionado, actualiza el periodo completo
    if (periodo.split("-")[1]) {
      setPeriodo(`${ano}-${periodo.split("-")[1]}`);
    }
  };

  const handlePeriodoChange = (p: string) => {
    // Si no hay año seleccionado, selecciona el primer año disponible
    const ano = anoSeleccionado || (ANOS.length > 0 ? ANOS[0] : "2023");
    if (!anoSeleccionado) {
      setAnoSeleccionado(ano);
    }
    setPeriodo(`${ano}-${p}`);
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
              {grados.map((grado, index) => (
                <div 
                  key={grado.id} 
                  className={`flex items-center justify-between rounded px-3 py-2 cursor-pointer transition border ${gradoSeleccionado && gradoSeleccionado.id === grado.id ? 'bg-primary-100 border-primary-400' : 'bg-white/10 border-white/20'}`}
                  onClick={() => setGradoSeleccionado(grado)}
                  ref={index === grados.length - 1 ? lastGradoRef : null}
                >
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
              {/* Indicador de carga para infinite scroll de grados */}
              {loadingMoreCursos && (
                <div className="flex justify-center py-2">
                  <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-blue-600"></div>
                  <span className="ml-2 text-gray-600 text-sm">Cargando más grados...</span>
                </div>
              )}
              {/* Mensaje cuando no hay más grados */}
              {!hasMoreCursos && grados.length > 0 && (
                <div className="text-center py-2 text-gray-500 text-sm">
                  No hay más grados para cargar
                </div>
              )}
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
                {/* Selector de periodo simplificado */}
                <div className="mb-4 flex flex-col sm:flex-row sm:items-end gap-4">
                  <div className="w-full">
                    <label htmlFor="periodo-select" className="font-semibold block mb-2 text-gray-700">Periodo:</label>
                    <div className="relative">
                      <select
                        id="periodo-select"
                        className="border border-gray-300 rounded-md px-3 py-2 w-full bg-white focus:ring-2 focus:ring-blue-500 focus:border-blue-500 appearance-none"
                        value={periodo}
                        onChange={e => setPeriodo(e.target.value)}
                      >
                        <option value="" disabled>Seleccione periodo</option>
                        {periodosDisponibles.map((p) => (
                          <option key={p} value={p} className="py-1">{p}</option>
                        ))}
                      </select>
                      <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center px-2 text-gray-700">
                        <svg className="fill-current h-4 w-4" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20"><path d="M9.293 12.95l.707.707L15.657 8l-1.414-1.414L10 10.828 5.757 6.586 4.343 8z"/></svg>
                      </div>
                    </div>
                  </div>
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
                      {gradoSeleccionado && (estudiantesSeleccionados || []).length === 0 ? (
                        loadingEstudiantes ? (
                          <tr>
                            <td colSpan={2 + gradoSeleccionado.asignaturas.length} className="text-center py-4">
                              <div className="flex justify-center">
                                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
                                <span className="ml-2 text-gray-600">Cargando estudiantes...</span>
                              </div>
                            </td>
                          </tr>
                        ) : (
                          <tr><td colSpan={2 + gradoSeleccionado.asignaturas.length} className="text-center text-gray-400 py-2">No hay estudiantes.</td></tr>
                        )
                      ) : loadingCalificaciones ? (
                        <tr><td colSpan={2 + gradoSeleccionado.asignaturas.length} className="text-center py-4">Cargando calificaciones...</td></tr>
                      ) : (
                        gradoSeleccionado && (estudiantesSeleccionados || []).map((est, i) => (
                          <tr 
                            key={est.id}
                          >
                            <td className="px-2 py-1 border font-semibold">{est.nombreCompleto}</td>
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
                  {/* Indicador de carga para infinite scroll de estudiantes */}
                  {loadingMoreEstudiantes && (
                    <tr>
                      <td colSpan={2 + (gradoSeleccionado?.asignaturas.length || 0)} className="text-center py-2">
                        <div className="flex justify-center">
                          <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-blue-600"></div>
                          <span className="ml-2 text-gray-600 text-sm">Cargando más estudiantes...</span>
                        </div>
                      </td>
                    </tr>
                  )}
                  {/* Mensaje cuando no hay más estudiantes */}
                  {!hasMoreEstudiantes && (estudiantesSeleccionados || []).length > 0 && (
                    <tr>
                      <td colSpan={2 + (gradoSeleccionado?.asignaturas.length || 0)} className="text-center py-2 text-gray-500 text-sm">
                        No hay más estudiantes para cargar
                      </td>
                    </tr>
                  )}
                </div>
                <h2 className="font-bold text-lg mb-2 mt-8">Asignaturas y Profesores</h2>
                <MenuAsignaturas
                  asignaturasSeleccionadas={gradoSeleccionado.asignaturas}
                  asignaturasDisponibles={asignaturasDisponibles}
                  profesoresPorAsignatura={profesoresPorAsignatura}
                  onAgregar={async (asig: AsignaturaMenu & { profesor?: any }) => {
                    if (!gradoSeleccionado) {
                      setPeriodoError("Debes seleccionar un grado antes de agregar una asignatura.");
                      return;
                    }
                    if (!periodo) {
                      setPeriodoError("Debes seleccionar un periodo antes de agregar una asignatura.");
                      return;
                    }
                    setPeriodoError("");

                    // Log para depuración: estudiantesSeleccionados
                    //console.log("[DEBUG] estudiantesSeleccionados:", estudiantesSeleccionados);

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

                    // Crear calificaciones solo para el periodo seleccionado
                    if (!asig.id || !asig.profesor) return;
                    const estudiantes = estudiantesSeleccionados;
                    const cursoId = String(gradoSeleccionado.id);
                    const asignaturaId = String(asig.id);
                    const profesorId = asig.profesor.id;

                    // Obtener calificaciones existentes para este periodo
                    let existentes: any[] = [];
                    try {
                      const res = await getCalificaciones({ cursoId, asignaturaId, periodo });
                      existentes = (res as any).calificaciones || [];
                    } catch {}

                    // Crear solo las calificaciones que no existen para este periodo
                    await Promise.all(
                      estudiantes.map(async (est) => {
                        const yaExiste = existentes.some(
                          (c) => c.estudianteId == est.id && c.periodo === periodo
                        );
                        // Log para depuración: datos de cada estudiante antes de registrar
                        //console.log("[DEBUG] Intentando registrar calificación para:", {
                         // estudianteId: est.id,
                         // asignaturaId,
                         // cursoId,
                         // periodo,
                         // nota: 0,
                        //  observaciones: `Profesor: ${asig.profesor.nombre} (${profesorId})`,
                        //});
                        if (!yaExiste) {
                          try {
                            await registrarCalificacion({
                              estudianteId: String(est.id),
                              asignaturaId,
                              cursoId,
                              periodo,
                              nota: 0,
                              observaciones: `Profesor: ${asig.profesor.nombre} (${profesorId})`,
                            });
                          } catch (e) {
                            // Ignorar error si ya existe
                          }
                        }
                      })
                    );

                    // Refrescar calificaciones y asignaturas desde la API
                    const resCalif = await getCalificaciones({ cursoId, periodo });
                    setCalificaciones((resCalif as any).calificaciones || []);
                    // Invalida el caché del curso
                    setEstudiantesPorCurso(prev => { const newCache = { ...prev }; delete newCache[cursoId]; return newCache; });
                    setAsignaturasPorCurso(prev => { const newCache = { ...prev }; delete newCache[cursoId]; return newCache; });
                  }}
                  onEliminar={eliminarAsignaturaDeGrado}
                  disabled={!(estudiantesSeleccionados && estudiantesSeleccionados.length > 0)}
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
