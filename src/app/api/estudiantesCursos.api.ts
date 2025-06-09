import { graphQLClient } from "./graphqlClient";

const API_URL = process.env.NEXT_PUBLIC_SIA_API_URL || "http://localhost:8000/api";

// Tipos para cursos y estudiantes
export interface Curso {
  id?: string;
  nombre: string;
  codigo: string;
}

export interface Estudiante {
  id?: string;
  nombreCompleto: string;
  documento: string;
  fechaNacimiento: string;
  acudiente: string;
  curso: string | Curso;
}

// --- GraphQL Queries & Mutations ---
const QUERY_LISTAR_CURSOS = `
  query($search: String, $ordering: String, $page: Int) {
    cursos(search: $search, ordering: $ordering, page: $page) {
      results { id nombre codigo estudiantes { id nombreCompleto documento } }
    }
  }
`;

const QUERY_LISTAR_ESTUDIANTES = `
  query($search: String, $ordering: String, $page: Int) {
    estudiantes(search: $search, ordering: $ordering, page: $page) {
      count
      next
      previous
      results { id nombreCompleto documento fechaNacimiento acudiente curso { id nombre codigo } }
    }
  }
`;

const MUTATION_CREAR_ESTUDIANTE = `
  mutation($input: CrearEstudianteInput!) {
    crearEstudiante(input: $input) {
      id nombreCompleto documento fechaNacimiento acudiente curso { id nombre codigo }
    }
  }
`;

const MUTATION_ACTUALIZAR_ESTUDIANTE = `
  mutation($id: ID!, $input: ActualizarEstudianteInput!) {
    actualizarEstudiante(id: $id, input: $input) {
      id nombreCompleto documento fechaNacimiento acudiente curso { id nombre codigo }
    }
  }
`;

const MUTATION_ELIMINAR_ESTUDIANTE = `
  mutation($id: ID!) {
    eliminarEstudiante(id: $id)
  }
`;

// --- Funciones GraphQL ---
export async function getAllCursos() {
  const res = await graphQLClient.request(QUERY_LISTAR_CURSOS, { search: "", ordering: "nombre", page: 1 }) as { cursos: { results: Curso[] } };
  return res.cursos.results;
}

export async function getAllEstudiantes({ search = "", ordering = "nombreCompleto", page = 1 } = {}) {
  const res = await graphQLClient.request(QUERY_LISTAR_ESTUDIANTES, { search, ordering, page }) as { estudiantes: { results: any[], count: number, next?: number, previous?: number } };
  return res.estudiantes;
}

export async function createEstudiante(data: Estudiante) {
  const input = {
    nombreCompleto: data.nombreCompleto,
    documento: data.documento,
    fechaNacimiento: data.fechaNacimiento,
    acudiente: data.acudiente,
    curso: typeof data.curso === "object" ? data.curso.id : data.curso
  };
  // Construir el input como string de campos
  const inputFields = [
    input.nombreCompleto !== undefined ? `nombreCompleto: \"${input.nombreCompleto.replace(/"/g, '\\"')}\"` : null,
    input.documento !== undefined ? `documento: \"${input.documento.replace(/"/g, '\\"')}\"` : null,
    input.fechaNacimiento !== undefined ? `fechaNacimiento: \"${input.fechaNacimiento}\"` : null,
    input.acudiente !== undefined ? `acudiente: \"${input.acudiente.replace(/"/g, '\\"')}\"` : null,
    input.curso !== undefined ? `curso: \"${input.curso}\"` : null
  ].filter(Boolean).join("\n          ");

  const mutation = `
    mutation {
      crearEstudiante(
        input: {
          ${inputFields}
        }
      ) {
        id
        nombreCompleto
        documento
        fechaNacimiento
        acudiente
        curso { id nombre codigo }
      }
    }
  `;
  return graphQLClient.request(mutation);
}

export async function updateEstudiante(id: string, data: Partial<Estudiante>) {
  // Solo incluir campos definidos y válidos
  const input: any = {};
  if (typeof data.nombreCompleto === "string") input.nombreCompleto = data.nombreCompleto;
  if (typeof data.documento === "string") input.documento = data.documento;
  if (typeof data.fechaNacimiento === "string") input.fechaNacimiento = data.fechaNacimiento;
  if (typeof data.acudiente === "string") input.acudiente = data.acudiente;
  if (data.curso) {
    let cursoId = typeof data.curso === "object" ? data.curso.id : data.curso;
    input.curso = String(cursoId);
  }
  // Construir el input como string de campos
  const inputFields = [
    input.nombreCompleto !== undefined ? `nombreCompleto: \"${input.nombreCompleto.replace(/"/g, '\\"')}\"` : null,
    input.documento !== undefined ? `documento: \"${input.documento.replace(/"/g, '\\"')}\"` : null,
    input.fechaNacimiento !== undefined ? `fechaNacimiento: \"${input.fechaNacimiento}\"` : null,
    input.acudiente !== undefined ? `acudiente: \"${input.acudiente.replace(/"/g, '\\"')}\"` : null,
    input.curso !== undefined ? `curso: \"${input.curso}\"` : null
  ].filter(Boolean).join("\n          ");

  const mutation = `
    mutation {
      actualizarEstudiante(
        id: \"${id}\",
        input: {
          ${inputFields}
        }
      ) {
        id
        nombreCompleto
        documento
        fechaNacimiento
        acudiente
        curso { id nombre codigo }
      }
    }
  `;
  return graphQLClient.request(mutation);
}

export async function deleteEstudiante(id: string) {
  return graphQLClient.request(MUTATION_ELIMINAR_ESTUDIANTE, { id });
}
