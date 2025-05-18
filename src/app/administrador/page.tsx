import Link from "next/link";

export default function Administrador() {
  return (
    <div className="min-h-screen bg-[var(--color-bg)] py-8">
      <div className="max-w-5xl mx-auto">
        <div className="card-modern text-center font-bold text-2xl tracking-wide mb-6 title-modern">
          Panel de Administrador
        </div>
        <div className="card-modern flex flex-col items-center space-y-6">
          <p className="subtitle-modern mb-4 text-lg">Gestiona grados, asignaturas y profesores desde aquí.</p>
          <div className="flex flex-col gap-4 w-full max-w-xs">
            <Link href="/administrador/gradosGestion" className="btn-primary px-6 py-3 text-lg">Gestionar Grados</Link>
            <Link href="/administrador/asignaturasProfesores" className="btn-primary px-6 py-3 text-lg">Gestionar Asignaturas y Profesores</Link>
            <Link href="/administrador/estudiantesGestion" className="btn-primary px-6 py-3 text-lg">Gestionar Estudiantes</Link>
          </div>
        </div>
      </div>
    </div>
  );
}
