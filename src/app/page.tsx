import Link from "next/link";

export default function Home() {
  return (
    <div className="flex flex-col items-center justify-center min-h-screen py-2 bg-[var(--color-bg)]">
      <div className="card-modern w-full max-w-xl text-center mt-12">
        <h1 className="text-5xl font-extrabold mb-4 title-modern drop-shadow">Bienvenido a Gradex</h1>
        <p className="subtitle-modern mb-8 text-lg">Gestión innovadora y moderna de calificaciones</p>
        <Link href="/administrador" className="btn-primary px-6 py-3 text-lg">Ingresar</Link>
      </div>
    </div>
  );
}