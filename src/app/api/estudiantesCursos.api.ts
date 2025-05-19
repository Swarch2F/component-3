const API_URL = process.env.NEXT_PUBLIC_SIA_API_URL || "http://localhost:8000/api";

// Tipos para cursos y estudiantes
export interface Curso {
  id?: number;
  nombre: string;
  codigo: string;
}

export interface Estudiante {
  id?: number;
  nombre_completo: string;
  documento: string;
  fecha_nacimiento: string;
  acudiente: string;
  curso: number;
}

export async function getCursos(params: string = "") {
  const res = await fetch(`${API_URL}/cursos/${params}`, { cache: "no-store" });
  if (!res.ok) throw new Error("Error al obtener cursos");
  return res.json();
}

export async function createCurso(data: Curso) {
  const res = await fetch(`${API_URL}/cursos/`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(data),
  });
  if (!res.ok) throw new Error("Error al crear curso");
  return res.json();
}

export async function updateCurso(id: number, data: Partial<Curso>, method: "PATCH" | "PUT" = "PATCH") {
  const res = await fetch(`${API_URL}/cursos/${id}/`, {
    method,
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(data),
  });
  if (!res.ok) throw new Error("Error al actualizar curso");
  return res.json();
}

export async function deleteCurso(id: number) {
  const res = await fetch(`${API_URL}/cursos/${id}/`, { method: "DELETE" });
  if (!res.ok) throw new Error("Error al eliminar curso");
  return true;
}

export async function getEstudiantes(params: string = "") {
  const res = await fetch(`${API_URL}/estudiantes/${params}`, { cache: "no-store" });
  if (!res.ok) throw new Error("Error al obtener estudiantes");
  return res.json();
}

export async function createEstudiante(data: Estudiante) {
  const res = await fetch(`${API_URL}/estudiantes/`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(data),
  });
  if (!res.ok) throw new Error("Error al crear estudiante");
  return res.json();
}

export async function updateEstudiante(id: number, data: Partial<Estudiante>, method: "PATCH" | "PUT" = "PATCH") {
  const res = await fetch(`${API_URL}/estudiantes/${id}/`, {
    method,
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(data),
  });
  if (!res.ok) throw new Error("Error al actualizar estudiante");
  return res.json();
}

export async function deleteEstudiante(id: number) {
  const res = await fetch(`${API_URL}/estudiantes/${id}/`, { method: "DELETE" });
  if (!res.ok) throw new Error("Error al eliminar estudiante");
  return true;
}
