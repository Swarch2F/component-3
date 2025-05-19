"use client";

import { useState, useEffect } from "react";
import DataContainer from "../../components/DataContainer";
import { type Student } from "../../types/student";

// Datos mockeados temporalmente
const mockStudents: Student[] = [
  { id: "1", nombre: "María Pérez", documento: "12345678", nacimiento: "2008-05-10", acudiente: "Ana Pérez", grado: "1C" },
  { id: "2", nombre: "Juan Gómez", documento: "87654321", nacimiento: "2007-11-22", acudiente: "Luis Gómez", grado: "2A" },
  { id: "3", nombre: "Laura Sánchez", documento: "11223344", nacimiento: "2008-01-15", acudiente: "Marta Sánchez", grado: "3V" },
  { id: "4", nombre: "Carlos Ruiz", documento: "44332211", nacimiento: "2007-09-30", acudiente: "Pedro Ruiz", grado: "5A" },
];

export default function EstudiantesGestionPage() {
  const [students, setStudents] = useState<Student[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [showAddModal, setShowAddModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [editStudent, setEditStudent] = useState<Student | null>(null);
  const [newStudent, setNewStudent] = useState({ nombre: "", documento: "", nacimiento: "", acudiente: "", grado: "" });
  const [showDeleteConfirm, setShowDeleteConfirm] = useState<{ id: string; nombre: string } | null>(null);

  // Obtener lista de grados únicos
  const gradosUnicos = Array.from(new Set([
    ...students.map(s => s.grado),
    ...mockStudents.map(s => s.grado)
  ])).filter(Boolean);

  useEffect(() => {
    const fetchData = async () => {
      try {
        await new Promise(resolve => setTimeout(resolve, 1000));
        setStudents(mockStudents);
      } catch (err) {
        setError("Error cargando los datos de estudiantes");
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, []);

  const handleEdit = (student: Student) => {
    setEditStudent(student);
    setShowEditModal(true);
  };

  const handleEditSave = () => {
    if (!editStudent) return;
    setStudents(prev => prev.map(s => s.id === editStudent.id ? editStudent : s));
    setShowEditModal(false);
    setEditStudent(null);
  };

  const handleDelete = (id: string) => {
    const estudiante = students.find(s => s.id === id);
    if (!estudiante) return;
    setShowDeleteConfirm({ id, nombre: estudiante.nombre });
  };

  const confirmarEliminar = () => {
    if (!showDeleteConfirm) return;
    setStudents(prev => prev.filter(s => s.id !== showDeleteConfirm.id));
    setShowDeleteConfirm(null);
  };

  const cancelarEliminar = () => setShowDeleteConfirm(null);

  const handleAddStudent = () => {
    if (!newStudent.nombre.trim() || !newStudent.documento.trim() || !newStudent.nacimiento.trim() || !newStudent.acudiente.trim() || !newStudent.grado.trim()) return;
    setStudents(prev => [
      ...prev,
      { id: (Date.now()).toString(), ...newStudent }
    ]);
    setShowAddModal(false);
    setNewStudent({ nombre: "", documento: "", nacimiento: "", acudiente: "", grado: "" });
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
            <button className="btn-primary px-5 py-2 text-base" onClick={() => setShowAddModal(true)}>
              Añadir Estudiante
            </button>
          </div>
          <DataContainer loading={loading} error={error} onRetry={() => window.location.reload()}>
            <div className="overflow-x-auto card-modern p-0">
              <table className="min-w-full divide-y divide-[var(--color-gray)] table-modern">
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
                  {students.map((estudiante) => (
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
              {gradosUnicos.map(grado => (
                <option key={grado} value={grado}>{grado}</option>
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
            <input
              type="text"
              placeholder="Grado"
              className="border rounded px-3 py-2 w-full mb-3"
              value={editStudent.grado}
              onChange={e => setEditStudent(s => s ? { ...s, grado: e.target.value } : s)}
              style={{ display: "none" }}
            />
            <select
              className="border rounded px-3 py-2 w-full mb-3"
              value={editStudent.grado}
              onChange={e => setEditStudent(s => s ? { ...s, grado: e.target.value } : s)}
            >
              <option value="">Selecciona un grado</option>
              {gradosUnicos.map(grado => (
                <option key={grado} value={grado}>{grado}</option>
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
