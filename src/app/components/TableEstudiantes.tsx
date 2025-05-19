import { useState } from "react";
import { Student } from "../types/student";

interface Props {
  data: Student[];
}

type SortKey = keyof Pick<Student, "nombre" | "nota" | "grado">;

export default function TableEstudiantes({ data }: Props) {
  const [sortKey, setSortKey] = useState<SortKey>("nombre");
  const [sortAsc, setSortAsc] = useState(true);
  const [selected, setSelected] = useState<Student | null>(null);
  const [students, setStudents] = useState<Student[]>(data);

  // Para detectar cambios y habilitar el botón de guardar
  const [edited, setEdited] = useState(false);

  const sorted = [...students].sort((a, b) => {
    if (sortKey === "nota") {
      return sortAsc
        ? (a.nota ?? 0) - (b.nota ?? 0)
        : (b.nota ?? 0) - (a.nota ?? 0);
    }
    return sortAsc
      ? String(a[sortKey]).localeCompare(String(b[sortKey]))
      : String(b[sortKey]).localeCompare(String(a[sortKey]));
  });

  const handleSort = (key: SortKey) => {
    if (sortKey === key) setSortAsc(!sortAsc);
    else {
      setSortKey(key);
      setSortAsc(true);
    }
  };

  const handleNotaChange = (id: string, value: string) => {
    const nota = value === "" ? undefined : Number(value);
    setStudents((prev) =>
      prev.map((s) => (s.id === id ? { ...s, nota } : s))
    );
    setEdited(true);
  };

  const handleGuardar = () => {
    // Aquí podrías hacer una petición a la API para guardar los cambios
    // Por ahora solo resetea el estado de editado
    setEdited(false);
    alert("¡Cambios guardados!");
  };

  return (
    <div className="overflow-x-auto">
      <table className="min-w-full border-separate border-spacing-y-2">
        <thead>
          <tr className="text-left text-primary-900 font-bold">
            <th
              className="cursor-pointer px-4 py-2"
              onClick={() => handleSort("nombre")}
            >
              Nombre {sortKey === "nombre" ? (sortAsc ? "▲" : "▼") : ""}
            </th>
            <th className="px-4 py-2">Documento</th>
            <th
              className="cursor-pointer px-4 py-2"
              onClick={() => handleSort("grado")}
            >
              Grado {sortKey === "grado" ? (sortAsc ? "▲" : "▼") : ""}
            </th>
            <th
              className="cursor-pointer px-4 py-2"
              onClick={() => handleSort("nota")}
            >
              Nota {sortKey === "nota" ? (sortAsc ? "▲" : "▼") : ""}
            </th>
            <th className="px-4 py-2">Acciones</th>
          </tr>
        </thead>
        <tbody>
          {sorted.map((s) => (
            <tr
              key={s.id}
              className="bg-white hover:bg-primary-50 transition rounded shadow-sm"
            >
              <td className="px-4 py-2">{s.nombre}</td>
              <td className="px-4 py-2">{s.documento}</td>
              <td className="px-4 py-2">{s.grado}</td>
              <td className="px-4 py-2">
                <input
                  type="number"
                  min={0}
                  max={5}
                  step={0.1}
                  value={s.nota ?? ""}
                  onChange={(e) => {
                    let value = e.target.value;
                    // Limitar el valor entre 0 y 5
                    if (value !== "") {
                      let num = Number(value);
                      if (num < 0) value = "0";
                      if (num > 5) value = "5";
                    }
                    handleNotaChange(s.id, value);
                  }}
                  className="border rounded px-2 py-1 w-20 text-right"
                />
              </td>
              <td className="px-4 py-2">
                <button
                  className="btn-secondary px-3 py-1 rounded cursor-pointer"
                  onClick={() => setSelected(s)}
                >
                  Ver info
                </button>
              </td>
            </tr>
          ))}
        </tbody>
      </table>

      <div className="mt-4 flex justify-end">
        <button
          className={`btn-primary px-5 py-2 rounded ${!edited ? "opacity-50 cursor-not-allowed" : ""}`}
          onClick={handleGuardar}
          disabled={!edited}
        >
          Guardar cambios
        </button>
      </div>

      {/* Modal de información */}
      {selected && (
        <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-8 min-w-[320px] shadow-lg relative">
            <button
              className="absolute top-2 right-2 text-gray-500 hover:text-primary-600 text-xl"
              onClick={() => setSelected(null)}
              title="Cerrar"
            >
              ×
            </button>
            <h2 className="text-2xl font-bold mb-4 text-primary-700">
              {selected.nombre}
            </h2>
            <div className="space-y-2 text-primary-900">
              <div>
                <span className="font-semibold">Documento:</span> {selected.documento}
              </div>
              <div>
                <span className="font-semibold">Nacimiento:</span> {selected.nacimiento}
              </div>
              <div>
                <span className="font-semibold">Acudiente:</span> {selected.acudiente}
              </div>
              <div>
                <span className="font-semibold">Grado:</span> {selected.grado}
              </div>
              <div>
                <span className="font-semibold">Nota:</span> {selected.nota ?? "-"}
              </div>
            </div>
            <div className="mt-6 flex justify-end">
              <button
                className="btn-primary px-5 py-2 rounded"
                onClick={() => setSelected(null)}
              >
                Cerrar
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}