import { graphQLClient } from './graphqlClient';

// --- Queries ---
export const GET_PROFESORES = `
  query {
    profesores {
      id
      nombre
      documento
      area
    }
  }
`;

export const GET_PROFESOR_POR_ID = `
  query($id: ID!) {
    profesorPorId(id: $id) {
      id
      nombre
      documento
      area
    }
  }
`;

// --- Mutations ---
export const CREAR_PROFESOR = `
  mutation($nombre: String!, $documento: String!, $area: String!) {
    crearProfesor(nombre: $nombre, documento: $documento, area: $area) {
      id
      nombre
      documento
      area
    }
  }
`;

export const ACTUALIZAR_PROFESOR = `
  mutation($id: ID!, $nombre: String, $area: String) {
    actualizarProfesor(id: $id, nombre: $nombre, area: $area) {
      id
      nombre
      area
    }
  }
`;

export const ELIMINAR_PROFESOR = `
  mutation($id: ID!) {
    eliminarProfesor(id: $id)
  }
`;

// --- Funciones para consumir el API ---
export async function getProfesores() {
  return graphQLClient.request(GET_PROFESORES);
}

export async function getProfesorPorId(id: string) {
  return graphQLClient.request(GET_PROFESOR_POR_ID, { id });
}

export async function crearProfesor(nombre: string, documento: string, area: string) {
  return graphQLClient.request(CREAR_PROFESOR, { nombre, documento, area });
}

export async function actualizarProfesor(id: string, nombre?: string, area?: string) {
  return graphQLClient.request(ACTUALIZAR_PROFESOR, { id, nombre, area });
}

export async function eliminarProfesor(id: string) {
  return graphQLClient.request(ELIMINAR_PROFESOR, { id });
}

export async function getGradosPorProfesorYAsignatura(profesorId: string, asignatura: string) {
  const query = `
    query($profesorId: ID!, $asignatura: String!) {
      gradosPorProfesorYAsignatura(profesorId: $profesorId, asignatura: $asignatura) {
        id
        nombre
      }
    }
  `;
  return graphQLClient.request(query, { profesorId, asignatura });
}
