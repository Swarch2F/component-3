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
            <Link href="/administrador/grados" className="btn-primary px-6 py-3 text-lg">Gestionar Grados</Link>
            <Link href="/administrador/asignaturas" className="btn-primary px-6 py-3 text-lg">Gestionar Asignaturas</Link>
            <Link href="/administrador/profesores" className="btn-primary px-6 py-3 text-lg">Gestionar Profesores</Link>
          </div>
        </div>
      </div>
    </div>
  );
}
