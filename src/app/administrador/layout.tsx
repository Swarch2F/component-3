// layout.tsx para mostrar el Navbar solo con botón de cerrar sesión en /administrador
import Navbar from "../components/Navbar";

export default function AdministradorLayout({ children }: { children: React.ReactNode }) {
  return (
    <>
      <Navbar onlyLogout />
      {children}
    </>
  );
}
