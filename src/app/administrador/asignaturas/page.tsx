"use client";
import { useState } from "react";

interface Asignatura {
  id: number;
  nombre: string;
}

const asignaturasIniciales: Asignatura[] = [
  { id: 1, nombre: "Matemáticas" },
  { id: 2, nombre: "Inglés" },
  { id: 3, nombre: "Ciencias" },
  { id: 4, nombre: "Historia" },
  { id: 5, nombre: "Arte" },
];

export default function GestionAsignaturas() {
  const [asignaturas, setAsignaturas] = useState<Asignatura[]>(asignaturasIniciales);
  const [nuevaAsignatura, setNuevaAsignatura] = useState("");
  const [editandoId, setEditandoId] = useState<number | null>(null);
  const [nombreEditado, setNombreEditado] = useState("");
  const [showConfirm, setShowConfirm] = useState<{id: number, nombre: string} | null>(null);

  // Crear asignatura
  const agregarAsignatura = () => {
    if (nuevaAsignatura.trim() === "") return;
    setAsignaturas([
      ...asignaturas,
      { id: Date.now(), nombre: nuevaAsignatura }
    ]);
    setNuevaAsignatura("");
  };

  // Eliminar asignatura
  const eliminarAsignatura = (id: number) => {
    const asig = asignaturas.find(a => a.id === id);
    if (!asig) return;
    setShowConfirm({ id, nombre: asig.nombre });
  };
  const confirmarEliminar = () => {
    if (showConfirm) {
      setAsignaturas(asignaturas.filter(a => a.id !== showConfirm.id));
      setShowConfirm(null);
    }
  };
  const cancelarEliminar = () => setShowConfirm(null);

  // Editar asignatura
  const iniciarEdicion = (asig: Asignatura) => {
    setEditandoId(asig.id);
    setNombreEditado(asig.nombre);
  };
  const guardarEdicion = (id: number) => {
    setAsignaturas(asignaturas.map(a => a.id === id ? { ...a, nombre: nombreEditado } : a));
    setEditandoId(null);
    setNombreEditado("");
  };

  return (
    <div className="min-h-screen bg-[var(--color-bg)] py-8 flex flex-col items-center">
      {/* Modal de confirmación */}
      {showConfirm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40">
          <div className="bg-white rounded-lg shadow-lg p-8 max-w-sm w-full text-center border-2 border-primary-200">
            <h3 className="text-xl font-bold mb-4 text-primary-600">¿Eliminar asignatura?</h3>
            <p className="mb-6 text-gray-700">¿Estás seguro de que deseas eliminar la asignatura <span className="font-semibold text-primary-500">"{showConfirm.nombre}"</span>?<br/>Esta acción no se puede deshacer.</p>
            <div className="flex justify-center gap-4">
              <button className="btn-danger px-4 py-2" onClick={confirmarEliminar}>Eliminar</button>
              <button className="btn-secondary px-4 py-2" onClick={cancelarEliminar}>Cancelar</button>
            </div>
          </div>
        </div>
      )}
      <div className="card-modern w-full max-w-xl text-center mt-0 mb-8">
        <h1 className="text-4xl font-bold mb-2 title-modern drop-shadow">Gestión de Asignaturas</h1>
        <p className="subtitle-modern mb-4 text-lg">Crea, edita o elimina asignaturas fácilmente.</p>
      </div>
      <div className="card-modern w-full max-w-xl p-6">
        <div className="mb-6">
          <h2 className="font-bold text-lg mb-2">Asignaturas registradas</h2>
          <table className="min-w-full border text-sm">
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
                    <td className="px-2 py-1 border">
                      {editandoId === asig.id ? (
                        <input
                          value={nombreEditado}
                          onChange={e => setNombreEditado(e.target.value)}
                          className="input-modern w-full"
                        />
                      ) : (
                        asig.nombre
                      )}
                    </td>
                    <td className="px-2 py-1 border text-center">
                      {editandoId === asig.id ? (
                        <button className="btn-primary px-2 py-1 text-xs mr-2" onClick={() => guardarEdicion(asig.id)}>Guardar</button>
                      ) : (
                        <button className="btn-secondary px-2 py-1 text-xs mr-2" onClick={() => iniciarEdicion(asig)}>Editar</button>
                      )}
                      <button className="btn-danger px-2 py-1 text-xs" onClick={() => eliminarAsignatura(asig.id)}>Eliminar</button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
        <div className="flex gap-2 mt-4">
          <input
            value={nuevaAsignatura}
            onChange={e => setNuevaAsignatura(e.target.value)}
            placeholder="Nueva asignatura"
            className="input-modern flex-1"
          />
          <button className="btn-primary px-4" onClick={agregarAsignatura}>Agregar</button>
        </div>
      </div>
    </div>
  );
}
