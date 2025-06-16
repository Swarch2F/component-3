import { graphQLClient } from "./graphqlClient";



// Tipos para cursos y estudiantes
export interface Curso {
  id?: string;
  nombre: string;
  codigo: string;
  estudiantes?: Estudiante[]; // <-- Agregado para soportar la respuesta GraphQL
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
  let allCursos: Curso[] = [];
  let currentPage = 1;
  let keepFetching = true;
  try {
    while (keepFetching) {
      const res = await graphQLClient.request(
        `query { cursos(search: "", ordering: "nombre", page: ${currentPage}) { next results { id nombre codigo estudiantes { id nombreCompleto documento } } } }`
      ) as { cursos: { next: any, results: Curso[] } };
      if (!res || !res.cursos || !Array.isArray(res.cursos.results)) {
        console.error("Respuesta inesperada de cursos:", res);
        throw new Error("Error al obtener cursos: respuesta inesperada");
      }
      allCursos = allCursos.concat(res.cursos.results);
      if (!res.cursos.next) {
        keepFetching = false;
      } else {
        currentPage++;
      }
    }
    return allCursos;
  } catch (e) {
    console.error("Error en getAllCursos:", e);
    throw e;
  }
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

// --- Mutaciones para cursos (grados) usando API Gateway ---
export async function createCurso(data: { nombre: string; codigo: string }) {
  const mutation = `
    mutation {
      crearCurso(input: { nombre: "${data.nombre.replace(/"/g, '\"')}", codigo: "${data.codigo.replace(/"/g, '\"')}" }) {
        id
        nombre
        codigo
      }
    }
  `;
  return graphQLClient.request(mutation);
}

export async function updateCurso(id: string | number, data: { nombre: string; codigo: string }) {
  // Ambos campos son obligatorios para la mutación
  const mutation = `
    mutation {
      actualizarCurso(id: "${id}", input: { nombre: "${data.nombre.replace(/"/g, '\"')}", codigo: "${data.codigo.replace(/"/g, '\"')}" }) {
        id
        nombre
        codigo
      }
    }
  `;
  return graphQLClient.request(mutation);
}

// --- Mutación para actualizar solo el nombre del curso (parcial) ---
export async function updateCursoParcial(id: string | number, nombre: string) {
  const mutation = `
    mutation {
      actualizarCursoParcial(id: "${id}", nombre: "${nombre.replace(/"/g, '\"')}") {
        id
        nombre
        codigo
      }
    }
  `;
  return graphQLClient.request(mutation);
}

export async function deleteCurso(id: string | number) {
  const mutation = `
    mutation {
      eliminarCurso(id: "${id}")
    }
  `;
  return graphQLClient.request(mutation);
}

// Obtener estudiantes de un curso por ID usando GraphQL
export async function getCursoEstudiantes(id: string | number) {
  const query = `
    query($id: ID!) {
      cursoEstudiantes(id: $id) {
        id
        nombreCompleto
        documento
        fechaNacimiento
        acudiente
      }
    }
  `;
  const res = await graphQLClient.request(query, { id: String(id) }) as { cursoEstudiantes: any[] };
  return res.cursoEstudiantes || [];
}

// --- En tu componente, asegúrate de usar esto al obtener estudiantes ---
// Ejemplo para GestionGradosClient.tsx:
// const estudiantesRes = await getAllEstudiantes();
// const estudiantes: EstudianteApi[] = estudiantesRes.results || [];
// ...
// cursos.forEach(curso => {
//   porGrado[curso.id!] = estudiantes.filter(e => e.curso === curso.id);
// });
//
