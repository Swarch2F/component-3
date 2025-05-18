import Link from "next/link";

export default function Administrador() {
  return (
    <div className="flex flex-col items-center justify-center min-h-screen py-2 bg-[var(--color-bg)]">
      <div className="card-modern w-full max-w-xl text-center mt-12">
        <h1 className="text-5xl font-extrabold mb-4 title-modern drop-shadow">Panel de Administrador</h1>
        <p className="subtitle-modern mb-8 text-lg">Aquí puedes gestionar la información de los estudiantes y profesores.</p>
        {/* Aquí puedes agregar más opciones específicas del administrador */}
      </div>
    </div>
  );
}
