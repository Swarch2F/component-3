import { useState } from 'react';
import { type Student } from '../types/student';

type TableEstudiantesProps = {
  data: Student[];
  onEdit: (id: string, newNota: number) => void;
  onDelete: (id: string) => void;
};

export default function TableEstudiantes({ 
  data, 
  onEdit, 
  onDelete 
}: TableEstudiantesProps) {
  // Estado para las notas editadas: { [id]: string }
  const [notasEditadas, setNotasEditadas] = useState<{ [id: string]: string }>({});

  // Maneja el cambio en el input de nota
  const handleNotaChange = (id: string, value: string) => {
    if (/^\d{0,1}(\.\d{0,1})?$|^5(\.0?)?$/.test(value)) {
      setNotasEditadas(prev => ({
        ...prev,
        [id]: value
      }));
    }
  };

  // Guardar todos los cambios
  const handleGuardarCambios = () => {
    let hayError = false;
    Object.entries(notasEditadas).forEach(([id, notaStr]) => {
      const notaNum = parseFloat(notaStr);
      if (isNaN(notaNum) || notaNum < 0 || notaNum > 5) {
        hayError = true;
      }
    });
    if (hayError) {
      alert('Todas las notas deben estar entre 0.0 y 5.0');
      return;
    }
    Object.entries(notasEditadas).forEach(([id, notaStr]) => {
      const notaNum = parseFloat(notaStr);
      onEdit(id, parseFloat(notaNum.toFixed(1)));
    });
    setNotasEditadas({});
  };

  return (
    <div className="overflow-x-auto card-modern p-0">
      <table className="min-w-full divide-y divide-[var(--color-gray)] table-modern">
        <thead>
          <tr>
            <th className="px-6 py-3 text-left text-xs font-bold uppercase tracking-wider">Estudiante</th>
            <th className="px-6 py-3 text-left text-xs font-bold uppercase tracking-wider">Nota</th>
            <th className="px-6 py-3 text-left text-xs font-bold uppercase tracking-wider">Acciones</th>
          </tr>
        </thead>
        <tbody>
          {data.map((estudiante) => (
            <tr key={estudiante.id} className="hover:bg-[var(--color-gray)] transition">
              <td className="px-6 py-4 whitespace-nowrap text-base font-medium">{estudiante.nombre}</td>
              <td className="px-6 py-4 whitespace-nowrap text-base">
                <input
                  type="number"
                  step="0.1"
                  min={0}
                  max={5}
                  value={notasEditadas[estudiante.id] ?? estudiante.nota.toFixed(1)}
                  onChange={e => handleNotaChange(estudiante.id, e.target.value)}
                  className="border-2 border-[var(--color-secondary)] rounded-lg px-3 py-1 w-24 focus:outline-none focus:border-[var(--color-accent)] transition"
                />
              </td>
              <td className="px-6 py-4 whitespace-nowrap text-base space-x-2">
                <button 
                  onClick={() => onDelete(estudiante.id)}
                  className="text-red-500 hover:text-red-700 font-semibold transition"
                >
                  Eliminar
                </button>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
      <div className="p-4 flex justify-end">
        <button
          onClick={handleGuardarCambios}
          className="btn-primary px-6 py-2 text-base"
          disabled={Object.keys(notasEditadas).length === 0}
        >
          Guardar cambios
        </button>
      </div>
    </div>
  );
}