"use client";

import { useState, useEffect } from "react";
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
  const [error, setError] = useState<string | null>(null);
  const [showAddModal, setShowAddModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [editStudent, setEditStudent] = useState<Student | null>(null);
  const [newStudent, setNewStudent] = useState({ nombre: "", documento: "", nacimiento: "", acudiente: "", grado: "" });
  const [showDeleteConfirm, setShowDeleteConfirm] = useState<{ id: string; nombre: string } | null>(null);
  const [search, setSearch] = useState("");

  // Paginación remota (sin búsqueda)
  const PAGE_SIZE = 15;
  const [page, setPage] = useState(1);
  const [totalEstudiantes, setTotalEstudiantes] = useState(0);
  // Eliminar totalPages

  // Filtrado frontend por nombre
  const filteredStudents = search.trim().length > 0
    ? students.filter(s => s.nombre.toLowerCase().includes(search.trim().toLowerCase()))
    : students;

  // --- NUEVO: función reutilizable para traer todos los estudiantes ---
  const fetchAllEstudiantes = async () => {
    setLoading(true);
    try {
      const cursosList: Curso[] = await getAllCursos();
      setCursos(cursosList);
      let allEstudiantes: any[] = [];
      let currentPage = 1;
      let keepFetching = true;
      while (keepFetching) {
        const res: any = await getAllEstudiantes({ page: currentPage });
        const estudiantesData = res.estudiantes || res;
        const estudiantesList = estudiantesData.results || [];
        allEstudiantes = allEstudiantes.concat(estudiantesList);
        // Si 'next' es null, no hay más páginas
        if (!estudiantesData.next) {
          keepFetching = false;
        } else {
          currentPage++;
        }
      }
      setTotalEstudiantes(allEstudiantes.length);
      setStudents(
        allEstudiantes.map((e: any) => {
          let grado = "";
          if (e.curso && typeof e.curso === "object" && "nombre" in e.curso) {
            grado = (e.curso as { nombre: string }).nombre;
          } else {
            const cursoObj = cursosList.find((c) => c.id === e.curso);
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
        })
      );
    } catch (err) {
      setError("Error cargando los datos de estudiantes");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchAllEstudiantes();
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
    await fetchAllEstudiantes();
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
    await fetchAllEstudiantes();
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
    await fetchAllEstudiantes();
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
          <DataContainer loading={loading} error={error} onRetry={() => window.location.reload()}>
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
                  {filteredStudents.map((estudiante) => (
                    <tr key={estudiante.id} className="hover:bg-[var(--color-gray)] transition">
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
              {/* Controles de paginación */}
              {/* Eliminados porque ahora se muestran todos los estudiantes */}
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
