"use client";
import { useState } from "react";

interface Asignatura {
  id: number;
  nombre: string;
}
interface Profesor {
  id: number;
  nombre: string;
  documento: string;
  asignatura: Asignatura;
}

const asignaturasIniciales: Asignatura[] = [
  { id: 1, nombre: "Matemáticas" },
  { id: 2, nombre: "Inglés" },
  { id: 3, nombre: "Ciencias" },
  { id: 4, nombre: "Historia" },
  { id: 5, nombre: "Arte" },
];
const profesoresIniciales: Profesor[] = [
  { id: 1, nombre: "Juan López", documento: "12345678", asignatura: asignaturasIniciales[0] },
  { id: 2, nombre: "Ana Smith", documento: "87654321", asignatura: asignaturasIniciales[1] },
  { id: 3, nombre: "Carlos Torres", documento: "11223344", asignatura: asignaturasIniciales[2] },
];

export default function GestionAsignaturasProfesores() {
  const [profesores, setProfesores] = useState<Profesor[]>(profesoresIniciales);
  const [asignaturas, setAsignaturas] = useState<Asignatura[]>(asignaturasIniciales);
  const [nuevoProfesor, setNuevoProfesor] = useState({ nombre: "", documento: "", asignaturaId: "" });
  const [editandoId, setEditandoId] = useState<number | null>(null);
  const [editando, setEditando] = useState<{ nombre: string; documento: string; asignaturaId: string }>({ nombre: "", documento: "", asignaturaId: "" });
  const [showConfirm, setShowConfirm] = useState<{ tipo: 'profesor' | 'asignatura', id: number, nombre: string } | null>(null);

  // Crear profesor
  const agregarProfesor = () => {
    if (!nuevoProfesor.nombre.trim() || !nuevoProfesor.documento.trim() || !nuevoProfesor.asignaturaId) return;
    const asignatura = asignaturas.find(a => a.id === Number(nuevoProfesor.asignaturaId));
    if (!asignatura) return;
    setProfesores([
      ...profesores,
      { id: Date.now(), nombre: nuevoProfesor.nombre, documento: nuevoProfesor.documento, asignatura }
    ]);
    setNuevoProfesor({ nombre: "", documento: "", asignaturaId: "" });
  };

  // Editar profesor
  const iniciarEdicion = (prof: Profesor) => {
    setEditandoId(prof.id);
    setEditando({ nombre: prof.nombre, documento: prof.documento, asignaturaId: String(prof.asignatura.id) });
  };
  const guardarEdicion = (id: number) => {
    const asignatura = asignaturas.find(a => a.id === Number(editando.asignaturaId));
    if (!asignatura) return;
    setProfesores(profesores.map(p => p.id === id ? { ...p, nombre: editando.nombre, documento: editando.documento, asignatura } : p));
    setEditandoId(null);
    setEditando({ nombre: "", documento: "", asignaturaId: "" });
  };

  // Eliminar profesor
  const eliminarProfesor = (id: number) => {
    const prof = profesores.find(p => p.id === id);
    if (!prof) return;
    setShowConfirm({ tipo: 'profesor', id, nombre: prof.nombre });
  };

  // Crear asignatura
  const [nuevaAsignatura, setNuevaAsignatura] = useState("");
  const agregarAsignatura = () => {
    if (!nuevaAsignatura.trim()) return;
    setAsignaturas([...asignaturas, { id: Date.now(), nombre: nuevaAsignatura }]);
    setNuevaAsignatura("");
  };
  // Eliminar asignatura
  const eliminarAsignatura = (id: number) => {
    const asig = asignaturas.find(a => a.id === id);
    if (!asig) return;
    setShowConfirm({ tipo: 'asignatura', id, nombre: asig.nombre });
  };
  const confirmarEliminar = () => {
    if (!showConfirm) return;
    if (showConfirm.tipo === 'profesor') {
      setProfesores(profesores.filter(p => p.id !== showConfirm.id));
    } else if (showConfirm.tipo === 'asignatura') {
      setAsignaturas(asignaturas.filter(a => a.id !== showConfirm.id));
      setProfesores(profesores.filter(p => p.asignatura.id !== showConfirm.id));
    }
    setShowConfirm(null);
  };
  const cancelarEliminar = () => setShowConfirm(null);

  return (
    <div className="min-h-screen bg-[var(--color-bg)] py-8 flex flex-col items-center">
      {/* Modal de confirmación */}
      {showConfirm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40">
          <div className="bg-white rounded-lg shadow-lg p-8 max-w-sm w-full text-center border-2 border-primary-200">
            <h3 className="text-xl font-bold mb-4 text-primary-600">¿Eliminar {showConfirm.tipo === 'profesor' ? 'profesor' : 'asignatura'}?</h3>
            <p className="mb-6 text-gray-700">¿Estás seguro de que deseas eliminar {showConfirm.tipo === 'profesor' ? 'al profesor' : 'la asignatura'} <span className="font-semibold text-primary-500">"{showConfirm.nombre}"</span>?<br/>Esta acción no se puede deshacer.</p>
            <div className="flex justify-center gap-4">
              <button className="btn-danger px-4 py-2" onClick={confirmarEliminar}>Eliminar</button>
              <button className="btn-secondary px-4 py-2" onClick={cancelarEliminar}>Cancelar</button>
            </div>
          </div>
        </div>
      )}
      <div className="card-modern w-full max-w-2xl text-center mt-0 mb-8">
        <h1 className="text-4xl font-bold mb-2 title-modern drop-shadow">Gestión de Profesores y Asignaturas</h1>
        <p className="subtitle-modern mb-4 text-lg">Crea, edita o elimina profesores y asignaturas fácilmente.</p>
      </div>
      <div className="card-modern w-full max-w-2xl p-6 mb-8">
        <h2 className="font-bold text-lg mb-4">Profesores registrados</h2>
        <table className="min-w-full border text-sm mb-4">
          <thead>
            <tr>
              <th className="px-2 py-1 border">Nombre</th>
              <th className="px-2 py-1 border">N. Documento</th>
              <th className="px-2 py-1 border">Asignatura</th>
              <th className="px-2 py-1 border">Acciones</th>
            </tr>
          </thead>
          <tbody>
            {profesores.length === 0 ? (
              <tr><td colSpan={4} className="text-center text-gray-400 py-2">No hay profesores registrados.</td></tr>
            ) : (
              profesores.map((prof) => (
                <tr key={prof.id}>
                  <td className="px-2 py-1 border">
                    {editandoId === prof.id ? (
                      <input value={editando.nombre} onChange={e => setEditando({ ...editando, nombre: e.target.value })} className="input-modern w-full" />
                    ) : prof.nombre}
                  </td>
                  <td className="px-2 py-1 border">
                    {editandoId === prof.id ? (
                      <input value={editando.documento} onChange={e => setEditando({ ...editando, documento: e.target.value })} className="input-modern w-full" />
                    ) : prof.documento}
                  </td>
                  <td className="px-2 py-1 border">
                    {editandoId === prof.id ? (
                      <select value={editando.asignaturaId} onChange={e => setEditando({ ...editando, asignaturaId: e.target.value })} className="input-modern w-full">
                        <option value="">Selecciona</option>
                        {asignaturas.map(a => <option key={a.id} value={a.id}>{a.nombre}</option>)}
                      </select>
                    ) : prof.asignatura.nombre}
                  </td>
                  <td className="px-2 py-1 border text-center">
                    {editandoId === prof.id ? (
                      <button className="btn-primary px-2 py-1 text-xs mr-2" onClick={() => guardarEdicion(prof.id)}>Guardar</button>
                    ) : (
                      <button className="btn-secondary px-2 py-1 text-xs mr-2" onClick={() => iniciarEdicion(prof)}>Editar</button>
                    )}
                    <button className="btn-danger px-2 py-1 text-xs" onClick={() => eliminarProfesor(prof.id)}>Eliminar</button>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
        <div className="flex gap-2 mt-4 flex-wrap">
          <input value={nuevoProfesor.nombre} onChange={e => setNuevoProfesor({ ...nuevoProfesor, nombre: e.target.value })} placeholder="Nombre del profesor" className="input-modern flex-1" />
          <input value={nuevoProfesor.documento} onChange={e => setNuevoProfesor({ ...nuevoProfesor, documento: e.target.value })} placeholder="N. Documento" className="input-modern flex-1" />
          <select value={nuevoProfesor.asignaturaId} onChange={e => setNuevoProfesor({ ...nuevoProfesor, asignaturaId: e.target.value })} className="input-modern flex-1">
            <option value="">Asignatura</option>
            {asignaturas.map(a => <option key={a.id} value={a.id}>{a.nombre}</option>)}
          </select>
          <button className="btn-primary px-4" onClick={agregarProfesor}>Agregar</button>
        </div>
      </div>
      <div className="card-modern w-full max-w-2xl p-6">
        <h2 className="font-bold text-lg mb-4">Asignaturas registradas</h2>
        <table className="min-w-full border text-sm mb-4">
          <thead>
            <tr>
              <th className="px-2 py-1 border">ID</th>
              <th className="px-2 py-1 border">Nombre</th>
              <th className="px-2 py-1 border">Acciones</th>
            </tr>
          </thead>
          <tbody>
            {asignaturas.length === 0 ? (
              <tr><td colSpan={3} className="text-center text-gray-400 py-2">No hay asignaturas registradas.</td></tr>
            ) : (
              asignaturas.map((asig) => (
                <tr key={asig.id}>
                  <td className="px-2 py-1 border text-center">{asig.id}</td>
                  <td className="px-2 py-1 border">{asig.nombre}</td>
                  <td className="px-2 py-1 border text-center">
                    <button className="btn-danger px-2 py-1 text-xs" onClick={() => eliminarAsignatura(asig.id)}>Eliminar</button>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
        <div className="flex gap-2 mt-4">
          <input value={nuevaAsignatura} onChange={e => setNuevaAsignatura(e.target.value)} placeholder="Nueva asignatura" className="input-modern flex-1" />
          <button className="btn-primary px-4" onClick={agregarAsignatura}>Agregar</button>
        </div>
      </div>
    </div>
  );
}
