"use client";

import { useState, useEffect, useRef, useCallback } from "react";
import DataContainer from "../../components/DataContainer";
import { type Student } from "../../types/student";
import {
  getEstudiantesPage,
  getCursosPage,
  createEstudiante,
  updateEstudiante,
  deleteEstudiante,
  Curso,
  Estudiante,
  getAllCursos,
  getAllEstudiantes
} from "../../api/estudiantesCursos.api";

export default function EstudiantesGestionPage() {
  const [students, setStudents] = useState<Student[]>([]);
  const [cursos, setCursos] = useState<Curso[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [showAddModal, setShowAddModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [editStudent, setEditStudent] = useState<Student | null>(null);
  const [newStudent, setNewStudent] = useState({ nombre: "", documento: "", nacimiento: "", acudiente: "", grado: "" });
  const [showDeleteConfirm, setShowDeleteConfirm] = useState<{ id: string; nombre: string } | null>(null);
  const [search, setSearch] = useState("");

  // Paginación para infinite scroll
  const [page, setPage] = useState(1);
  const [hasMore, setHasMore] = useState(true);
  const [totalEstudiantes, setTotalEstudiantes] = useState(0);
  const observerRef = useRef<IntersectionObserver | null>(null);
  const loadingRef = useRef<HTMLDivElement>(null);

  // Filtrado frontend por nombre
  const filteredStudents = search.trim().length > 0
    ? students.filter(s => s.nombre.toLowerCase().includes(search.trim().toLowerCase()))
    : students;

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
  // Función para ordenar grados por orden numérico
  const ordenarGradosNumerico = (grados: Curso[]) => {

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

  // Función para cargar la primera página y cursos
  const fetchInitialData = async () => {
    // ////console.log("🔄 [fetchInitialData] Iniciando carga inicial de datos...");
    setLoading(true);
    try {
      // ✅ Usar función paginada optimizada en lugar de getAllCursos()
      // ////console.log("📚 [fetchInitialData] Llamando a getCursosPage(1)...");
      const cursosResponse = await getCursosPage(1);
      ////console.log("✅ [fetchInitialData] getCursosPage(1) completado:", cursosResponse);
      
      const cursosOrdenados = ordenarGradosNumerico(cursosResponse.cursos);
      setCursos(cursosOrdenados);
      ////console.log("📋 [fetchInitialData] Cursos ordenados y guardados:", cursosOrdenados.length, "cursos");
      
      // ✅ Usar función paginada optimizada en lugar de getAllEstudiantes()
      ////console.log("👥 [fetchInitialData] Llamando a getEstudiantesPage({ page: 1 })...");
      const estudiantesRes = await getEstudiantesPage({ page: 1 });
      ////console.log("✅ [fetchInitialData] getEstudiantesPage({ page: 1 }) completado:", estudiantesRes);
      
      const estudiantes = (estudiantesRes.estudiantes || []).map(e => ({
        id: e.id,
        nombre: e.nombreCompleto,
        documento: e.documento,
        nacimiento: e.fechaNacimiento,
        acudiente: e.acudiente,
        grado: e.curso?.nombre || "", // ✅ Mostrar nombre del curso, no el ID
        curso: e.curso
      }));
      setStudents(estudiantes);
      setTotalEstudiantes(estudiantesRes.count || 0);
      ////console.log("👥 [fetchInitialData] Estudiantes procesados y guardados:", estudiantes.length, "estudiantes");
    } catch (err) {
      console.error("❌ [fetchInitialData] Error:", err);
      setError("Error cargando los datos de estudiantes");
    } finally {
      setLoading(false);
      ////console.log("🏁 [fetchInitialData] Carga inicial completada");
    }
  };

  // Función para cargar más estudiantes (infinite scroll)
  const loadMoreEstudiantes = async (pageNum: number, isInitial: boolean = false) => {
    ////console.log(`🔄 [loadMoreEstudiantes] Iniciando carga de página ${pageNum}, isInitial: ${isInitial}`);
    if (loadingMore) {
      ////console.log("⏸️ [loadMoreEstudiantes] Ya está cargando, saltando...");
      return;
    }
    
    setLoadingMore(true);
    try {
      ////console.log(`👥 [loadMoreEstudiantes] Llamando a getEstudiantesPage({ page: ${pageNum} })...`);
      const res = await getEstudiantesPage({ page: pageNum });
      ////console.log(`✅ [loadMoreEstudiantes] getEstudiantesPage({ page: ${pageNum} }) completado:`, res);
      
      const estudiantesList = res.estudiantes || [];
      
      // Mapear los estudiantes con sus grados (optimizado para select_related)
      const mappedEstudiantes = estudiantesList.map((e: any) => {
        // Con select_related, el curso ya viene como objeto completo
        const grado = e.curso?.nombre || ""; // ✅ Mostrar nombre del curso, no el ID
        
        return {
          id: String(e.id),
          nombre: e.nombreCompleto,
          documento: e.documento,
          nacimiento: e.fechaNacimiento,
          acudiente: e.acudiente,
          grado
        };
      });

      if (isInitial) {
        setStudents(mappedEstudiantes);
        setTotalEstudiantes(res.count || 0);
        ////console.log(`👥 [loadMoreEstudiantes] Estudiantes iniciales guardados: ${mappedEstudiantes.length} estudiantes`);
      } else {
        setStudents(prev => [...prev, ...mappedEstudiantes]);
        ////console.log(`👥 [loadMoreEstudiantes] Estudiantes adicionales agregados: ${mappedEstudiantes.length} estudiantes`);
      }

      // Verificar si hay más páginas
      setHasMore(res.hasNext);
      setPage(pageNum + 1);
      ////console.log(`📄 [loadMoreEstudiantes] Página actualizada a ${pageNum + 1}, hasMore: ${res.hasNext}`);
    } catch (err) {
      console.error(`❌ [loadMoreEstudiantes] Error en página ${pageNum}:`, err);
      setError("Error cargando más estudiantes");
    } finally {
      setLoadingMore(false);
      ////console.log(`🏁 [loadMoreEstudiantes] Carga de página ${pageNum} completada`);
    }
  };

  // Callback para el observer del infinite scroll
  const lastElementRef = useCallback((node: HTMLTableRowElement | null) => {
    ////console.log("👁️ [lastElementRef] Observer callback ejecutado, node:", !!node);
    if (loadingMore) {
      ////console.log("⏸️ [lastElementRef] Ya está cargando, saltando...");
      return;
    }
    
    if (observerRef.current) observerRef.current.disconnect();
    
    observerRef.current = new IntersectionObserver(entries => {
      ////console.log("👁️ [lastElementRef] Intersection observer detectado:", entries[0].isIntersecting);
      if (entries[0].isIntersecting && hasMore) {
        ////console.log("🔄 [lastElementRef] Iniciando carga de más estudiantes desde observer...");
        loadMoreEstudiantes(page);
      }
    });
    
    if (node) observerRef.current.observe(node);
  }, [loadingMore, hasMore, page]);

  // Función para refrescar todos los datos
  const refreshData = async () => {
    ////console.log("🔄 [refreshData] Iniciando refresh de datos...");
    setStudents([]);
    setPage(1);
    setHasMore(true);
    await fetchInitialData();
    ////console.log("🏁 [refreshData] Refresh completado");
  };

  useEffect(() => {
    ////console.log("🚀 [useEffect] Componente montado, iniciando fetchInitialData...");
    fetchInitialData();
  }, []); // Solo al montar

  const handleEdit = (student: Student) => {
    ////console.log("✏️ [handleEdit] Editando estudiante:", student);
    // Con select_related, ya tenemos el ID del curso directamente
    // Buscar el curso por ID (más eficiente que por nombre)
    const cursoObj = cursos.find(c => c.id === student.grado || c.nombre === student.grado);
    setEditStudent({ ...student, grado: cursoObj?.id ?? "" });
    setShowEditModal(true);
  };

  const handleEditSave = async () => {
    ////console.log("🔄 [handleEditSave] Iniciando edición de estudiante:", editStudent);
    if (!editStudent) return;
    // Buscar el curso por id (ahora grado almacena el id)
    const cursoObj = cursos.find(c => c.id === editStudent.grado);
    if (!cursoObj) {
      console.error("❌ [handleEditSave] Grado inválido:", editStudent.grado);
      alert("Grado inválido. El curso seleccionado no existe.");
      return;
    }
    try {
      ////console.log("📝 [handleEditSave] Llamando a updateEstudiante...");
      const result = await updateEstudiante(editStudent.id, {
        nombreCompleto: editStudent.nombre,
        documento: editStudent.documento,
        fechaNacimiento: editStudent.nacimiento,
        acudiente: editStudent.acudiente,
        curso: cursoObj.id
      }) as any;
      ////console.log("✅ [handleEditSave] updateEstudiante completado:", result);
      
      if (result.actualizarEstudiante.success) {
        setShowEditModal(false);
        setEditStudent(null);
        ////console.log("🔄 [handleEditSave] Refrescando datos después de edición...");
        // Refrescar todos los estudiantes
        await refreshData();
      } else {
        console.error("❌ [handleEditSave] Error en respuesta:", result.actualizarEstudiante.message);
        alert(`Error al actualizar estudiante: ${result.actualizarEstudiante.message}`);
      }
    } catch (error) {
      console.error("❌ [handleEditSave] Error al actualizar estudiante:", error);
      alert("Error al actualizar estudiante");
    }
  };

  const handleDelete = (id: string) => {
    ////console.log("🗑️ [handleDelete] Iniciando eliminación de estudiante:", id);
    const estudiante = students.find(s => s.id === id);
    if (!estudiante) return;
    setShowDeleteConfirm({ id, nombre: estudiante.nombre });
  };

  const confirmarEliminar = async () => {
    ////console.log("🗑️ [confirmarEliminar] Confirmando eliminación:", showDeleteConfirm);
    if (!showDeleteConfirm) return;
    try {
      ////console.log("🗑️ [confirmarEliminar] Llamando a deleteEstudiante...");
      const result = await deleteEstudiante(showDeleteConfirm.id) as any;
      ////console.log("✅ [confirmarEliminar] deleteEstudiante completado:", result);
      
      if (result.eliminarEstudiante.success) {
        setShowDeleteConfirm(null);
        ////console.log("🔄 [confirmarEliminar] Refrescando datos después de eliminación...");
        // Refrescar todos los estudiantes
        await refreshData();
      } else {
        console.error("❌ [confirmarEliminar] Error en respuesta:", result.eliminarEstudiante.message);
        alert(`Error al eliminar estudiante: ${result.eliminarEstudiante.message}`);
      }
    } catch (error) {
      console.error("❌ [confirmarEliminar] Error al eliminar estudiante:", error);
      alert("Error al eliminar estudiante");
    }
  };

  const cancelarEliminar = () => setShowDeleteConfirm(null);

  const handleAddStudent = async () => {
    ////console.log("➕ [handleAddStudent] Iniciando creación de estudiante:", newStudent);
    if (!newStudent.nombre.trim() || !newStudent.documento.trim() || !newStudent.nacimiento.trim() || !newStudent.acudiente.trim() || !newStudent.grado.trim()) return;
    // Buscar el curso por ID o nombre (más eficiente)
    const cursoObj = cursos.find(c => c.id === newStudent.grado || c.nombre === newStudent.grado);
    if (!cursoObj) return alert("Grado inválido");
    try {
      ////console.log("➕ [handleAddStudent] Llamando a createEstudiante...");
      const result = await createEstudiante({
        nombreCompleto: newStudent.nombre,
        documento: newStudent.documento,
        fechaNacimiento: newStudent.nacimiento,
        acudiente: newStudent.acudiente,
        curso: cursoObj.id!
      }) as any;
      ////console.log("✅ [handleAddStudent] createEstudiante completado:", result);
      
      if (result.crearEstudiante.success) {
        setShowAddModal(false);
        setNewStudent({ nombre: "", documento: "", nacimiento: "", acudiente: "", grado: "" });
        ////console.log("🔄 [handleAddStudent] Refrescando datos después de creación...");
        // Refrescar todos los estudiantes
        await refreshData();
      } else {
        console.error("❌ [handleAddStudent] Error en respuesta:", result.crearEstudiante.message);
        alert(`Error al crear estudiante: ${result.crearEstudiante.message}`);
      }
    } catch (error) {
      console.error("❌ [handleAddStudent] Error al crear estudiante:", error);
      alert("Error al crear estudiante");
    }
  };

  return (
    <div className="min-h-screen bg-[var(--color-bg)] py-8">
      <div className="max-w-5xl mx-auto">
        <div className="card-modern text-center font-bold text-2xl tracking-wide mb-6 title-modern">
          GESTIÓN DE ESTUDIANTES
        </div>
        <div className="card-modern space-y-6">
          <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center gap-4">
            <div>
              <h1 className="text-3xl font-extrabold mb-1 title-modern">Estudiantes</h1>
              <p className="subtitle-modern text-base">Administra estudiantes: agregar, editar, eliminar.</p>
              {totalEstudiantes > 0 && (
                <p className="text-sm text-gray-600 mt-1">Total: {totalEstudiantes} estudiantes</p>
              )}
            </div>
            <div className="flex flex-col gap-2 sm:flex-row sm:items-center">
              <input
                type="text"
                placeholder="Buscar por nombre..."
                className="border rounded px-3 py-2 w-full sm:w-64"
                value={search}
                onChange={e => setSearch(e.target.value)}
              />
              <button className="btn-primary px-5 py-2 text-base" onClick={() => setShowAddModal(true)}>
                Añadir Estudiante
              </button>
            </div>
          </div>
          <DataContainer loading={loading} error={error} onRetry={refreshData}>
            <div className="card-modern p-0 w-full" style={{ overflowX: 'auto' }}>
              <table className="w-full border-separate border-spacing-y-2" style={{ minWidth: 0 }}>
                <thead>
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-bold uppercase tracking-wider">Nombre</th>
                    <th className="px-6 py-3 text-left text-xs font-bold uppercase tracking-wider">N. Documento</th>
                    <th className="px-6 py-3 text-left text-xs font-bold uppercase tracking-wider">Fecha Nac.</th>
                    <th className="px-6 py-3 text-left text-xs font-bold uppercase tracking-wider">Acudiente</th>
                    <th className="px-6 py-3 text-left text-xs font-bold uppercase tracking-wider">Grado</th>
                    <th className="px-6 py-3 text-left text-xs font-bold uppercase tracking-wider">Acciones</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredStudents.map((estudiante, index) => (
                    <tr 
                      key={estudiante.id} 
                      className="hover:bg-[var(--color-gray)] transition"
                      ref={index === filteredStudents.length - 1 ? lastElementRef : null}
                    >
                      <td className="px-6 py-4 whitespace-nowrap text-base font-medium">{estudiante.nombre}</td>
                      <td className="px-6 py-4 whitespace-nowrap text-base">{estudiante.documento}</td>
                      <td className="px-6 py-4 whitespace-nowrap text-base">{estudiante.nacimiento}</td>
                      <td className="px-6 py-4 whitespace-nowrap text-base">{estudiante.acudiente}</td>
                      <td className="px-6 py-4 whitespace-nowrap text-base">{estudiante.grado}</td>
                      <td className="px-6 py-4 whitespace-nowrap text-base space-x-2">
                        <button onClick={() => handleEdit(estudiante)} className="text-blue-600 hover:text-blue-800 font-semibold transition">Editar</button>
                        <button onClick={() => handleDelete(estudiante.id)} className="text-red-500 hover:text-red-700 font-semibold transition">Eliminar</button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
              {/* Indicador de carga para infinite scroll */}
              {loadingMore && (
                <div className="flex justify-center py-4">
                  <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
                  <span className="ml-2 text-gray-600">Cargando más estudiantes...</span>
                </div>
              )}
              {/* Mensaje cuando no hay más datos */}
              {!hasMore && students.length > 0 && (
                <div className="text-center py-4 text-gray-500">
                  No hay más estudiantes para cargar
                </div>
              )}
            </div>
          </DataContainer>
        </div>
      </div>
      {/* Modal para añadir estudiante */}
      {showAddModal && (
        <div className="fixed inset-0 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-8 shadow-lg w-full max-w-md">
            <h2 className="text-xl font-bold mb-4">Añadir Estudiante</h2>
            <input
              type="text"
              placeholder="Grado"
              className="border rounded px-3 py-2 w-full mb-3"
              value={newStudent.grado}
              onChange={e => setNewStudent(s => ({ ...s, grado: e.target.value }))}
              style={{ display: "none" }}
            />
            <select
              className="border rounded px-3 py-2 w-full mb-3"
              value={newStudent.grado}
              onChange={e => setNewStudent(s => ({ ...s, grado: e.target.value }))}
            >
              <option value="">Selecciona un grado</option>
              {cursos.map(curso => (
                <option key={curso.id} value={curso.nombre}>{curso.nombre}</option>
              ))}
            </select>
            <input
              type="text"
              placeholder="Nombre"
              className="border rounded px-3 py-2 w-full mb-3"
              value={newStudent.nombre}
              onChange={e => setNewStudent(s => ({ ...s, nombre: e.target.value }))}
            />
            <input
              type="text"
              placeholder="N. Documento"
              className="border rounded px-3 py-2 w-full mb-3"
              value={newStudent.documento}
              onChange={e => setNewStudent(s => ({ ...s, documento: e.target.value }))}
            />
            <input
              type="date"
              placeholder="Fecha de nacimiento"
              className="border rounded px-3 py-2 w-full mb-3"
              value={newStudent.nacimiento}
              onChange={e => setNewStudent(s => ({ ...s, nacimiento: e.target.value }))}
            />
            <input
              type="text"
              placeholder="Acudiente"
              className="border rounded px-3 py-2 w-full mb-3"
              value={newStudent.acudiente}
              onChange={e => setNewStudent(s => ({ ...s, acudiente: e.target.value }))}
            />
            <div className="flex justify-end gap-2">
              <button className="btn-secondary px-4 py-2" onClick={() => setShowAddModal(false)}>Cancelar</button>
              <button className="btn-primary px-4 py-2" onClick={handleAddStudent}>Agregar</button>
            </div>
          </div>
        </div>
      )}
      {/* Modal para editar estudiante */}
      {showEditModal && editStudent && (
        <div className="fixed inset-0 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-8 shadow-lg w-full max-w-md">
            <h2 className="text-xl font-bold mb-4">Editar Estudiante</h2>
            {/* Menú desplegable solo con cursos válidos */}
            <select
              className="border rounded px-3 py-2 w-full mb-3"
              value={editStudent.grado || ""}
              onChange={e => {
                setEditStudent(s => s ? { ...s, grado: e.target.value } : s);
              }}
            >
              <option value="">Selecciona un grado</option>
              {cursos.map(curso => (
                <option key={curso.id} value={curso.id}>{curso.nombre}</option>
              ))}
            </select>
            <input
              type="text"
              placeholder="Nombre"
              className="border rounded px-3 py-2 w-full mb-3"
              value={editStudent.nombre}
              onChange={e => setEditStudent(s => s ? { ...s, nombre: e.target.value } : s)}
            />
            <input
              type="text"
              placeholder="N. Documento"
              className="border rounded px-3 py-2 w-full mb-3"
              value={editStudent.documento}
              onChange={e => setEditStudent(s => s ? { ...s, documento: e.target.value } : s)}
            />
            <input
              type="date"
              placeholder="Fecha de nacimiento"
              className="border rounded px-3 py-2 w-full mb-3"
              value={editStudent.nacimiento}
              onChange={e => setEditStudent(s => s ? { ...s, nacimiento: e.target.value } : s)}
            />
            <input
              type="text"
              placeholder="Acudiente"
              className="border rounded px-3 py-2 w-full mb-3"
              value={editStudent.acudiente}
              onChange={e => setEditStudent(s => s ? { ...s, acudiente: e.target.value } : s)}
            />
            <div className="flex justify-end gap-2">
              <button className="btn-secondary px-4 py-2" onClick={() => setShowEditModal(false)}>Cancelar</button>
              <button className="btn-primary px-4 py-2" onClick={handleEditSave}>Guardar</button>
            </div>
          </div>
        </div>
      )}
      {/* Modal de confirmación para eliminar estudiante */}
      {showDeleteConfirm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center">
          <div className="bg-white rounded-lg shadow-lg p-8 max-w-sm w-full text-center border-2 border-primary-200">
            <h3 className="text-xl font-bold mb-4 text-primary-600">¿Eliminar estudiante?</h3>
            <p className="mb-6 text-gray-700">¿Estás seguro de que deseas eliminar al estudiante <span className="font-semibold text-primary-500">&quot;{showDeleteConfirm.nombre}&quot;</span>?<br/>Esta acción no se puede deshacer.</p>
            <div className="flex justify-center gap-4">
              <button className="btn-danger px-4 py-2" onClick={confirmarEliminar}>Eliminar</button>
              <button className="btn-secondary px-4 py-2" onClick={cancelarEliminar}>Cancelar</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
