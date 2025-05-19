"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import Image from "next/image";
export default function Navbar() {
  const pathname = usePathname();
  const isHome = pathname === "/";

  return (
    <nav className="navbar-modern text-white px-8 py-4 flex items-center justify-between shadow-lg relative">
      <div className="flex items-center space-x-6 relative">
        {/* Fondo circular translúcido para el logo, más grande */}
        <Link href="/">
          <div className="flex items-center justify-center rounded-full bg-white/10 border border-white/20 shadow-md h-20 w-20 mr-3 cursor-pointer">
            <Image
              src="/logo.png"
              alt="Logo"
              width={64}
              height={64}
              className="h-16 w-16 object-contain rounded-full"
              style={{ filter: "drop-shadow(0 2px 8px rgba(0,0,0,0.18))" }}
              priority
            />
          </div>
        </Link>
        <span className="font-extrabold text-3xl tracking-widest text-primary-400 drop-shadow-md mr-2">
          Gradex
        </span>
      </div>
      <div className="space-x-6 flex items-center">
        {isHome ? (
          <Link href="/administrador" className="navbar-link">Ingresar</Link>
        ) : (
          <>
            <Link href="/administrador" className="navbar-link">Administrador</Link>
            <Link href="/docente/students" className="navbar-link">Profesor</Link>
          </>
        )}
      </div>
    </nav>
  );
}