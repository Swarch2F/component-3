"use client";
import { useState, useEffect } from "react";
import {
  getProfesores,
  crearProfesor,
  actualizarProfesor,
  eliminarProfesor as eliminarProfesorApi,
} from "../../api/profesoresApi";
import {
  getAsignaturas,
  crearAsignatura,
  actualizarAsignatura,
  eliminarAsignatura as eliminarAsignaturaApi,
} from "../../api/asignaturasApi";

interface Asignatura {
  id: string;
  nombre: string;
  profesorIds?: string[];
}
interface Profesor {
  id: string;
  nombre: string;
  documento: string;
  area?: string;
  asignatura?: Asignatura;
  asignaturaId?: string;
}

// Tipos de respuesta para las funciones API
interface GetProfesoresResponse {
  profesores: Profesor[];
}
interface GetAsignaturasResponse {
  asignaturas: Asignatura[];
}

export default function GestionAsignaturasProfesores() {
  const [profesores, setProfesores] = useState<Profesor[]>([]);
  const [asignaturas, setAsignaturas] = useState<Asignatura[]>([]);
  const [nuevoProfesor, setNuevoProfesor] = useState({ nombre: "", documento: "", asignaturaId: "" });
  const [editandoId, setEditandoId] = useState<string | null>(null);
  const [editando, setEditando] = useState<{ nombre: string; documento: string; asignaturaId: string }>({ nombre: "", documento: "", asignaturaId: "" });
  const [showConfirm, setShowConfirm] = useState<{ tipo: 'profesor' | 'asignatura', id: string, nombre: string, asignaturaId?: string } | null>(null);
  const [nuevaAsignatura, setNuevaAsignatura] = useState("");
  const [editandoAsignaturaId, setEditandoAsignaturaId] = useState<string | null>(null);
  const [nuevoNombreAsignatura, setNuevoNombreAsignatura] = useState<string>("");

  useEffect(() => {
    async function fetchData() {
      const asigRes = (await getAsignaturas()) as GetAsignaturasResponse;
      setAsignaturas(asigRes.asignaturas);
      const profRes = (await getProfesores()) as GetProfesoresResponse;
      setProfesores(profRes.profesores);
    }
    fetchData();
  }, []);

  // Validaciones
  const validarNombreProfesor = (nombre: string) => nombre.trim().length > 0 && nombre.trim().length <= 30;
  const validarDocumento = (doc: string) => /^[0-9A-Za-z]{1,15}$/.test(doc);
  const validarNombreAsignatura = (nombre: string) => {
    const nombreTrim = nombre.trim();
    if (nombreTrim.length === 0 || nombreTrim.length > 20) return false;
    // No permitir nombres repetidos (case insensitive)
    return !asignaturas.some(a => a.nombre.trim().toLowerCase() === nombreTrim.toLowerCase());
  };

  // Crear profesor
  const agregarProfesor = async () => {
    if (!validarNombreProfesor(nuevoProfesor.nombre)) {
      alert("El nombre del profesor es obligatorio y debe tener máximo 30 caracteres.");
      return;
    }
    if (!validarDocumento(nuevoProfesor.documento)) {
      alert("El número de documento debe tener máximo 15 caracteres, sin espacios ni puntos.");
      return;
    }
    if (!nuevoProfesor.asignaturaId) {
      alert("Debe seleccionar una asignatura.");
      return;
    }
    const res = (await crearProfesor(nuevoProfesor.nombre, nuevoProfesor.documento, "")) as { crearProfesor: Profesor };
    await import("../../api/asignaturasApi").then(api =>
      api.asignarProfesorAAsignatura(res.crearProfesor.id, nuevoProfesor.asignaturaId)
    );
    // Refrescar tanto profesores como asignaturas para que la relación se vea reflejada de inmediato
    const [profRes, asigRes] = await Promise.all([
      getProfesores(),
      getAsignaturas()
    ]);
    setProfesores((profRes as GetProfesoresResponse).profesores);
    setAsignaturas((asigRes as GetAsignaturasResponse).asignaturas);
    setNuevoProfesor({ nombre: "", documento: "", asignaturaId: "" });
  };

  // Editar profesor
  const iniciarEdicion = (prof: Profesor) => {
    setEditandoId(prof.id);
    setEditando({ nombre: prof.nombre, documento: prof.documento, asignaturaId: prof.asignatura?.id || "" });
  };
  const guardarEdicion = async (id: string) => {
    await actualizarProfesor(id, editando.nombre);
    const profRes = (await getProfesores()) as GetProfesoresResponse;
    setProfesores(profRes.profesores);
    setEditandoId(null);
    setEditando({ nombre: "", documento: "", asignaturaId: "" });
  };

  // Eliminar profesor
  const eliminarProfesor = (id: string) => {
    const prof = profesores.find(p => p.id === id);
    if (!prof) return;
    // Buscar la asignatura donde está asignado el profesor
    const asignatura = asignaturas.find(a => a.profesorIds && a.profesorIds.includes(id));
    setShowConfirm({ tipo: 'profesor', id, nombre: prof.nombre, asignaturaId: asignatura?.id });
  };

  // Crear asignatura
  const agregarAsignatura = async () => {
    if (!validarNombreAsignatura(nuevaAsignatura)) {
      alert("El nombre de la asignatura es obligatorio, único y debe tener máximo 20 caracteres.");
      return;
    }
    await crearAsignatura(nuevaAsignatura);
    const asigRes = (await getAsignaturas()) as GetAsignaturasResponse;
    setAsignaturas(asigRes.asignaturas);
    setNuevaAsignatura("");
  };

  // Eliminar asignatura
  const eliminarAsignatura = (id: string) => {
    const asig = asignaturas.find(a => a.id === id);
    if (!asig) return;
    setShowConfirm({ tipo: 'asignatura', id, nombre: asig.nombre });
  };

  const confirmarEliminar = async () => {
    if (!showConfirm) return;
    if (showConfirm.tipo === 'profesor') {
      // Desasignar de la asignatura si corresponde
      if (showConfirm.asignaturaId) {
        await import("../../api/asignaturasApi").then(api =>
          api.desasignarProfesorDeAsignatura(showConfirm.id, showConfirm.asignaturaId!)
        );
      }
      await eliminarProfesorApi(showConfirm.id);
      const profRes = (await getProfesores()) as GetProfesoresResponse;
      setProfesores(profRes.profesores);
      const asigRes = (await getAsignaturas()) as GetAsignaturasResponse;
      setAsignaturas(asigRes.asignaturas);
    } else if (showConfirm.tipo === 'asignatura') {
      await eliminarAsignaturaApi(showConfirm.id);
      const asigRes = (await getAsignaturas()) as GetAsignaturasResponse;
      setAsignaturas(asigRes.asignaturas);
      const profRes = (await getProfesores()) as GetProfesoresResponse;
      setProfesores(profRes.profesores);
    }
    setShowConfirm(null);
  };

  const cancelarEliminar = () => setShowConfirm(null);

  // Función para ordenar por nombre
  const ordenarPorNombre = () => {
    const profesoresOrdenados = [...profesores].sort((a, b) => a.nombre.localeCompare(b.nombre));
    setProfesores(profesoresOrdenados);
  };

  // Función para manejar el botón "Ver más"
  const verCursos = (id: string) => {
    console.log(`Accediendo a los cursos del profesor con ID: ${id}`);
    // Aquí puedes redirigir o realizar alguna acción específica
  };

  return (
    <div className="min-h-screen bg-[var(--color-bg)] py-8 flex flex-col items-center">
      {/* Modal de confirmación */}
      {showConfirm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40">
          <div className="bg-white rounded-lg shadow-lg p-8 max-w-sm w-full text-center border-2 border-primary-200">
            <h3 className="text-xl font-bold mb-4 text-primary-600">¿Eliminar {showConfirm.tipo === 'profesor' ? 'profesor' : 'asignatura'}?</h3>
            <p className="mb-6 text-gray-700">¿Estás seguro de que deseas eliminar {showConfirm.tipo === 'profesor' ? 'al profesor' : 'la asignatura'} <span className="font-semibold text-primary-500">
              &quot;{showConfirm.nombre}&quot;</span>?<br/>Esta acción no se puede deshacer.</p>
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
              <th className="px-2 py-1 border cursor-pointer" onClick={() => ordenarPorNombre()}>Nombre</th>
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
                    {prof.documento}
                  </td>
                  <td className="px-2 py-1 border">
                    {asignaturas.find(a => a.profesorIds && a.profesorIds.includes(prof.id))?.nombre || "Sin asignar"}
                  </td>
                  <td className="px-2 py-1 border text-center flex justify-center gap-2">
                    {editandoId === prof.id ? (
                      <button className="btn-primary px-2 py-1 text-xs" onClick={() => guardarEdicion(editandoId)}>Guardar</button>
                    ) : (
                      <button className="btn-secondary px-2 py-1 text-xs" onClick={() => iniciarEdicion(prof)}>Editar</button>
                    )}
                    <button className="btn-danger px-2 py-1 text-xs" onClick={() => eliminarProfesor(prof.id)}>Eliminar</button>
                    <button className="btn-primary px-2 py-1 text-xs" onClick={() => verCursos(prof.id)}>Ver más</button>
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
              <th className="px-2 py-1 border">Nombre</th>
              <th className="px-2 py-1 border">Acciones</th>
            </tr>
          </thead>
          <tbody>
            {asignaturas.length === 0 ? (
              <tr><td colSpan={2} className="text-center text-gray-400 py-2">No hay asignaturas registradas.</td></tr>
            ) : (
              asignaturas.map((asig) => (
                <tr key={asig.id}>
                  <td className="px-2 py-1 border">
                    {editandoAsignaturaId === asig.id ? (
                      <input
                        value={nuevoNombreAsignatura}
                        onChange={e => setNuevoNombreAsignatura(e.target.value)}
                        className="input-modern w-full"
                      />
                    ) : (
                      asig.nombre
                    )}
                  </td>
                  <td className="px-2 py-1 border text-center">
                    {editandoAsignaturaId === asig.id ? (
                      <>
                        <button
                          className="btn-primary px-2 py-1 text-xs mr-2"
                          onClick={async () => {
                            if (!validarNombreAsignatura(nuevoNombreAsignatura) || nuevoNombreAsignatura.trim().toLowerCase() === asignaturas.find(a => a.id === editandoAsignaturaId)?.nombre.trim().toLowerCase()) {
                              alert("El nombre de la asignatura es obligatorio, único y debe tener máximo 20 caracteres.");
                              return;
                            }
                            await actualizarAsignatura(asig.id, nuevoNombreAsignatura);
                            const asigRes = (await getAsignaturas()) as GetAsignaturasResponse;
                            setAsignaturas(asigRes.asignaturas);
                            setEditandoAsignaturaId(null);
                            setNuevoNombreAsignatura("");
                          }}
                        >Guardar</button>
                        <button
                          className="btn-secondary px-2 py-1 text-xs"
                          onClick={() => {
                            setEditandoAsignaturaId(null);
                            setNuevoNombreAsignatura("");
                          }}
                        >Cancelar</button>
                      </>
                    ) : (
                      <>
                        <button
                          className="btn-secondary px-2 py-1 text-xs mr-2"
                          onClick={() => {
                            setEditandoAsignaturaId(asig.id);
                            setNuevoNombreAsignatura(asig.nombre);
                          }}
                        >Editar</button>
                        <button className="btn-danger px-2 py-1 text-xs" onClick={() => eliminarAsignatura(asig.id)}>Eliminar</button>
                      </>
                    )}
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
