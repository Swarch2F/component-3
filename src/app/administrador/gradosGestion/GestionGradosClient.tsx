"use client";
import { useState } from "react";
import MenuAsignaturas, { Asignatura as AsignaturaMenu } from "./MenuAsignaturas";

// Definir tipos para los datos
interface Asignatura {
  id: number;
  nombre: string;
  profesor: string;
}

interface Estudiante {
  nombre: string;
  notas: Record<number, number>; // id de asignatura -> nota
}

interface Grado {
  id: number;
  nombre: string;
  estudiantes: Estudiante[];
  asignaturas: Asignatura[];
}

// Datos simulados de profesores por asignatura
const profesoresPorAsignatura: Record<number, string> = {
  1: "Prof. López",
  2: "Prof. Smith",
  3: "Prof. Torres",
  4: "Prof. Ramírez",
  5: "Prof. Gómez",
};

// Datos simulados para ejemplo
const gradosIniciales: Grado[] = [
  { id: 1, nombre: "1A", estudiantes: [
      { nombre: "María Pérez", notas: { 1: 8.5, 2: 7.2 } },
      { nombre: "Juan Gómez", notas: { 1: 6.9, 2: 8.0 } }
    ], asignaturas: [
      { id: 1, nombre: "Matemáticas", profesor: "Prof. López" },
      { id: 2, nombre: "Inglés", profesor: "Prof. Smith" }
    ] },
  { id: 2, nombre: "2B", estudiantes: [
      { nombre: "Laura Sánchez", notas: { 1: 9.1, 3: 7.5 } },
      { nombre: "Carlos Ruiz", notas: { 1: 6.8, 3: 8.2 } }
    ], asignaturas: [
      { id: 1, nombre: "Matemáticas", profesor: "Prof. López" },
      { id: 3, nombre: "Ciencias", profesor: "Prof. Torres" }
    ] },
];

export default function GestionGradosClient() {
  const [grados, setGrados] = useState<Grado[]>(gradosIniciales);
  const [gradoSeleccionado, setGradoSeleccionado] = useState<Grado | null>(null);
  const [nuevoGrado, setNuevoGrado] = useState("");
  const [editando, setEditando] = useState<number | null>(null);
  const [nombreEditado, setNombreEditado] = useState("");
  const [showConfirm, setShowConfirm] = useState<{ tipo: 'grado' | 'asignatura', id: number, nombre: string } | null>(null);

  // Agregar grado
  const agregarGrado = () => {
    if (nuevoGrado.trim() === "") return;
    setGrados([...grados, { id: Date.now(), nombre: nuevoGrado, estudiantes: [], asignaturas: [] }]);
    setNuevoGrado("");
  };

  // Eliminar grado con confirmación
  const eliminarGrado = (id: number) => {
    const grado = grados.find(g => g.id === id);
    if (!grado) return;
    setShowConfirm({ tipo: 'grado', id, nombre: grado.nombre });
  };
  const confirmarEliminar = () => {
    if (!showConfirm) return;
    if (showConfirm.tipo === 'grado') {
      setGrados(grados.filter(g => g.id !== showConfirm.id));
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
    setEditando(grado.id);
    setNombreEditado(grado.nombre);
  };
  const guardarEdicion = (id: number) => {
    setGrados(grados.map(g => g.id === id ? { ...g, nombre: nombreEditado } : g));
    setEditando(null);
    setNombreEditado("");
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
                      <button onClick={() => guardarEdicion(grado.id)} className="btn-primary px-2 py-1 text-xs">Guardar</button>
                    </>
                  ) : (
                    <>
                      <span className="font-semibold">{grado.nombre}</span>
                      <div className="flex gap-2">
                        <button onClick={e => { e.stopPropagation(); iniciarEdicion(grado); }} className="btn-secondary px-2 py-1 text-xs">Editar</button>
                        <button onClick={e => { e.stopPropagation(); eliminarGrado(grado.id); }} className="btn-danger px-2 py-1 text-xs">Eliminar</button>
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
          </div>

          {/* Detalle del grado seleccionado */}
          <div className="w-full md:w-2/3">
            {gradoSeleccionado ? (
              <div>
                <h2 className="font-bold text-lg mb-2">Estudiantes de {gradoSeleccionado.nombre}</h2>
                <div className="overflow-x-auto">
                  <table className="min-w-full border text-sm">
                    <thead>
                      <tr>
                        <th className="px-2 py-1 border">Estudiante</th>
                        {gradoSeleccionado.asignaturas.map((asig) => (
                          <th key={asig.id} className="px-2 py-1 border">{asig.nombre}</th>
                        ))}
                      </tr>
                    </thead>
                    <tbody>
                      {gradoSeleccionado.estudiantes.length === 0 ? (
                        <tr><td colSpan={1 + gradoSeleccionado.asignaturas.length} className="text-center text-gray-400 py-2">No hay estudiantes.</td></tr>
                      ) : (
                        gradoSeleccionado.estudiantes.map((est, i) => (
                          <tr key={i}>
                            <td className="px-2 py-1 border font-semibold">{est.nombre}</td>
                            {gradoSeleccionado.asignaturas.map((asig) => (
                              <td key={asig.id} className="px-2 py-1 border text-center">{typeof est.notas === 'object' && est.notas && asig.id in est.notas ? est.notas[asig.id] : '-'}</td>
                            ))}
                          </tr>
                        ))
                      )}
                    </tbody>
                  </table>
                </div>
                <h2 className="font-bold text-lg mb-2 mt-8">Asignaturas y Profesores</h2>
                <MenuAsignaturas
                  asignaturasSeleccionadas={gradoSeleccionado.asignaturas.map(({ id, nombre }) => ({ id, nombre }))}
                  onAgregar={(asig: AsignaturaMenu) => {
                    setGrados(grados.map(g =>
                      g.id === gradoSeleccionado.id
                        ? { ...g, asignaturas: [...g.asignaturas, { ...asig, profesor: profesoresPorAsignatura[asig.id] || "" }] }
                        : g
                    ));
                    setGradoSeleccionado({
                      ...gradoSeleccionado,
                      asignaturas: [...gradoSeleccionado.asignaturas, { ...asig, profesor: profesoresPorAsignatura[asig.id] || "" }],
                    });
                  }}
                  onEliminar={(id: number) => {
                    const asig = gradoSeleccionado.asignaturas.find(a => a.id === id);
                    if (!asig) return;
                    setShowConfirm({ tipo: 'asignatura', id, nombre: asig.nombre });
                  }}
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
