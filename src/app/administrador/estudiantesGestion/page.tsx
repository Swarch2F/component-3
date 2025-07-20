"use client";

import { useState, useEffect, useRef, useCallback } from "react";
import DataContainer from "../../components/DataContainer";
import { type Student } from "../../types/student";
import {
  getAllEstudiantes,
  getAllCursos,
  createEstudiante,
  updateEstudiante,
  deleteEstudiante,
  Curso,
  Estudiante
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

  // Función para cargar la primera página y cursos
  const fetchInitialData = async () => {
    setLoading(true);
    try {
      const cursosList: Curso[] = await getAllCursos();
      setCursos(cursosList);
      await loadMoreEstudiantes(1, true);
    } catch (err) {
      setError("Error cargando los datos de estudiantes");
    } finally {
      setLoading(false);
    }
  };

  // Función para cargar más estudiantes (infinite scroll)
  const loadMoreEstudiantes = async (pageNum: number, isInitial: boolean = false) => {
    if (loadingMore) return;
    
    setLoadingMore(true);
    try {
      const res: any = await getAllEstudiantes({ page: pageNum });
      const estudiantesData = res.estudiantes || res;
      const estudiantesList = estudiantesData.results || [];
      
      // Mapear los estudiantes con sus grados
      const mappedEstudiantes = estudiantesList.map((e: any) => {
        let grado = "";
        if (e.curso && typeof e.curso === "object" && "nombre" in e.curso) {
          grado = (e.curso as { nombre: string }).nombre;
        } else {
          const cursoObj = cursos.find((c) => c.id === e.curso);
          grado = cursoObj?.nombre || "";
        }
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
        setTotalEstudiantes(estudiantesData.count || 0);
      } else {
        setStudents(prev => [...prev, ...mappedEstudiantes]);
      }

      // Verificar si hay más páginas
      setHasMore(!!estudiantesData.next);
      setPage(pageNum + 1);
    } catch (err) {
      setError("Error cargando más estudiantes");
    } finally {
      setLoadingMore(false);
    }
  };

  // Callback para el observer del infinite scroll
  const lastElementRef = useCallback((node: HTMLTableRowElement | null) => {
    if (loadingMore) return;
    
    if (observerRef.current) observerRef.current.disconnect();
    
    observerRef.current = new IntersectionObserver(entries => {
      if (entries[0].isIntersecting && hasMore) {
        loadMoreEstudiantes(page);
      }
    });
    
    if (node) observerRef.current.observe(node);
  }, [loadingMore, hasMore, page]);

  // Función para refrescar todos los datos
  const refreshData = async () => {
    setStudents([]);
    setPage(1);
    setHasMore(true);
    await fetchInitialData();
  };

  useEffect(() => {
    fetchInitialData();
  }, []); // Solo al montar

  const handleEdit = (student: Student) => {
    // Buscar el id del curso por el nombre
    const cursoObj = cursos.find(c => c.nombre === student.grado);
    setEditStudent({ ...student, grado: cursoObj?.id ?? "" });
    setShowEditModal(true);
  };

  const handleEditSave = async () => {
    if (!editStudent) return;
    // Buscar el curso por id (ahora grado almacena el id)
    const cursoObj = cursos.find(c => c.id === editStudent.grado);
    if (!cursoObj) {
      alert("Grado inválido. El curso seleccionado no existe.");
      return;
    }
    await updateEstudiante(editStudent.id, {
      nombreCompleto: editStudent.nombre,
      documento: editStudent.documento,
      fechaNacimiento: editStudent.nacimiento,
      acudiente: editStudent.acudiente,
      curso: cursoObj.id
    });
    setShowEditModal(false);
    setEditStudent(null);
    // Refrescar todos los estudiantes
    await refreshData();
  };

  const handleDelete = (id: string) => {
    const estudiante = students.find(s => s.id === id);
    if (!estudiante) return;
    setShowDeleteConfirm({ id, nombre: estudiante.nombre });
  };

  const confirmarEliminar = async () => {
    if (!showDeleteConfirm) return;
    await deleteEstudiante(showDeleteConfirm.id);
    setShowDeleteConfirm(null);
    // Refrescar todos los estudiantes
    await refreshData();
  };

  const cancelarEliminar = () => setShowDeleteConfirm(null);

  const handleAddStudent = async () => {
    if (!newStudent.nombre.trim() || !newStudent.documento.trim() || !newStudent.nacimiento.trim() || !newStudent.acudiente.trim() || !newStudent.grado.trim()) return;
    const cursoObj = cursos.find(c => c.nombre === newStudent.grado);
    if (!cursoObj) return alert("Grado inválido");
    await createEstudiante({
      nombreCompleto: newStudent.nombre,
      documento: newStudent.documento,
      fechaNacimiento: newStudent.nacimiento,
      acudiente: newStudent.acudiente,
      curso: cursoObj.id!
    });
    setShowAddModal(false);
    setNewStudent({ nombre: "", documento: "", nacimiento: "", acudiente: "", grado: "" });
    // Refrescar todos los estudiantes
    await refreshData();
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
              value={editStudent.grado}
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
