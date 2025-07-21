import { graphQLClient } from './graphqlClient';

// --- Queries ---
export const GET_ASIGNATURAS = `
  query {
    asignaturas {
      id
      nombre
      profesorIds
    }
  }
`;

// --- Mutations ---
export const CREAR_ASIGNATURA = `
  mutation($nombre: String!) {
    crearAsignatura(nombre: $nombre) {
      id
      nombre
      profesorIds
    }
  }
`;

export const ACTUALIZAR_ASIGNATURA = `
  mutation($id: ID!, $nombre: String) {
    actualizarAsignatura(id: $id, nombre: $nombre) {
      id
      nombre
    }
  }
`;

export const ELIMINAR_ASIGNATURA = `
  mutation($id: ID!) {
    eliminarAsignatura(id: $id)
  }
`;

export const ASIGNAR_PROFESOR = `
  mutation($profesorId: ID!, $asignaturaId: ID!) {
    asignarProfesorAAsignatura(profesorId: $profesorId, asignaturaId: $asignaturaId) {
      id
      profesorIds
    }
  }
`;

export const DESASIGNAR_PROFESOR = `
  mutation($profesorId: ID!, $asignaturaId: ID!) {
    desasignarProfesorDeAsignatura(profesorId: $profesorId, asignaturaId: $asignaturaId) {
      id
      profesorIds
    }
  }
`;

// --- Funciones para consumir el API ---
export async function getAsignaturas() {
  return graphQLClient.request(GET_ASIGNATURAS);
}

export async function crearAsignatura(nombre: string) {
  return graphQLClient.request(CREAR_ASIGNATURA, { nombre });
}

export async function actualizarAsignatura(id: string, nombre: string) {
  return graphQLClient.request(ACTUALIZAR_ASIGNATURA, { id, nombre });
}

export async function eliminarAsignatura(id: string) {
  return graphQLClient.request(ELIMINAR_ASIGNATURA, { id });
}

export async function asignarProfesorAAsignatura(profesorId: string, asignaturaId: string) {
  return graphQLClient.request(ASIGNAR_PROFESOR, { profesorId, asignaturaId });
}

export async function desasignarProfesorDeAsignatura(profesorId: string, asignaturaId: string) {
  return graphQLClient.request(DESASIGNAR_PROFESOR, { profesorId, asignaturaId });
}
