import { graphQLClient } from './graphqlClient';

// --- Queries ---
export const GET_CALIFICACIONES = `
  query($estudianteId: ID, $asignaturaId: ID, $cursoId: ID, $periodo: String) {
    calificaciones(estudianteId: $estudianteId, asignaturaId: $asignaturaId, cursoId: $cursoId, periodo: $periodo) {
      id
      estudianteId
      asignaturaId
      cursoId
      periodo
      nota
      observaciones
    }
  }
`;

// --- Mutations ---
export const REGISTRAR_CALIFICACION = `
  mutation($input: CalificacionInput!) {
    registrarCalificacion(input: $input) {
      calificacion {
        id
        nota
        observaciones
      }
      success
      message
      errors
    }
  }
`;

export const ACTUALIZAR_CALIFICACION = `
  mutation($id: ID!, $nota: Float, $observaciones: String) {
    actualizarCalificacion(id: $id, nota: $nota, observaciones: $observaciones) {
      id
      nota
      observaciones
    }
  }
`;

export const ELIMINAR_CALIFICACION = `
  mutation($id: ID!) {
  eliminarCalificacion(id: $id) {
    success
    message
    errors
  }
}
`;

// --- Funciones para consumir el API ---
export async function getCalificaciones(params: { estudianteId?: string; asignaturaId?: string; cursoId?: string; periodo?: string }) {
  return graphQLClient.request(GET_CALIFICACIONES, params);
}

export async function registrarCalificacion(input: { estudianteId: string; asignaturaId: string; cursoId: string; periodo: string; nota: number; observaciones?: string }) {
  return graphQLClient.request(REGISTRAR_CALIFICACION, { input });
}

export async function actualizarCalificacion(id: string, nota?: number, observaciones?: string) {
  return graphQLClient.request(ACTUALIZAR_CALIFICACION, { id, nota, observaciones });
}

export async function eliminarCalificacion(id: string) {
  return graphQLClient.request(ELIMINAR_CALIFICACION, { id });
}
