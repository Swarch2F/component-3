// layout.tsx para mostrar el Navbar solo con botón de cerrar sesión en /docente
import Navbar from "../components/Navbar";

export default function DocenteLayout({ children }: { children: React.ReactNode }) {
  return (
    <>
      <Navbar onlyLogout />
      {children}
    </>
  );
}
