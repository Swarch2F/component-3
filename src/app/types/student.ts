// types/student.ts
export type Student = {
  id: string;
  nombre: string;
  documento: string;
  nacimiento: string;
  acudiente: string;
  grado: string;
  nota?: number; // nota es opcional para compatibilidad
};