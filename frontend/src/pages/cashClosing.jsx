import React, { useState, useEffect } from 'react';
import inventoryApi from '../api/inventoryApi'; // Tu configuración de axios
import Swal from 'sweetalert2';
import withReactContent from 'sweetalert2-react-content';

const MySwal = withReactContent(Swal);

const CashClosing = () => {
  const [summary, setSummary] = useState([]);
  const [physicalAmount, setPhysicalAmount] = useState(0);
  const [notes, setNotes] = useState("");
  const [loading, setLoading] = useState(true);

  // 1. Cargar el resumen del backend
  const fetchSummary = async () => {
    try {
      setLoading(true);
      const response = await inventoryApi.get('/summary');
      setSummary(response.data);
    } catch (error) {
      MySwal.fire('Error', 'No se pudo cargar el resumen de caja', 'error');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchSummary();
  }, []);

  // ... dentro de tu componente, añade este nuevo estado y useEffect
  const [history, setHistory] = useState([]);

  const fetchHistory = async () => {
    try {
      const response = await inventoryApi.get('/history');
      setHistory(response.data);
    } catch (error) {
      console.error("Error cargando el historial", error);
    }
  };

  useEffect(() => {
    fetchHistory();
  }, []); // Se ejecuta al cargar y puedes llamarlo de nuevo tras un cierre exitoso

  // 2. Cálculos automáticos
  const totalExpected = summary.reduce((acc, curr) => acc + parseFloat(curr.total), 0);
  const difference = physicalAmount - totalExpected;

  // 3. Función para enviar el cierre
  const handleFinalizeClosing = async () => {
    // Validación básica
    if (physicalAmount < 0) {
      return MySwal.fire('Atención', 'El monto físico no puede ser negativo', 'warning');
    }

    const confirm = await MySwal.fire({
      title: '¿Confirmar cierre de caja?',
      text: "Esta acción sellará todos los pagos actuales y no se puede deshacer.",
      icon: 'warning',
      showCancelButton: true,
      confirmButtonText: 'Sí, cerrar caja',
      cancelButtonText: 'Cancelar'
    });

    if (confirm.isConfirmed) {
      try {
        const closingData = {
          expected_amount: totalExpected.toFixed(2),
          actual_amount: parseFloat(physicalAmount).toFixed(2),
          differences: difference.toFixed(2),
          notes: notes
        };

        await inventoryApi.post('/close', closingData);

        await MySwal.fire('¡Éxito!', 'La caja ha sido cerrada correctamente.', 'success');

        // Limpiar para el siguiente turno
        setPhysicalAmount(0);
        setNotes("");
        fetchSummary(); // Debería volver vacío ahora
      } catch (error) {
        MySwal.fire('Error', 'Hubo un problema al procesar el cierre en el servidor', 'error');
      }
    }
  };

  if (loading) return <div className="p-10 text-center">Cargando resumen...</div>;

  return (
    <div className="p-6 max-w-4xl mx-auto">
      <h1 className="text-2xl font-bold mb-6 text-gray-800">Cierre de Caja Diario</h1>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* TABLA DE RESUMEN */}
        <div className="bg-white p-6 rounded-lg shadow-md">
          <h2 className="text-lg font-semibold mb-4 border-b pb-2">Ventas por Método</h2>
          <table className="w-full">
            <thead>
              <tr className="text-left text-gray-500 text-sm">
                <th className="pb-2">Método</th>
                <th className="pb-2 text-right">Monto Esperado</th>
              </tr>
            </thead>
            <tbody>
              {summary.map((item, index) => (
                <tr key={index} className="border-t">
                  <td className="py-2 text-gray-700">{item.method}</td>
                  <td className="py-2 text-right font-medium">S/ {parseFloat(item.total).toFixed(2)}</td>
                </tr>
              ))}
              {summary.length === 0 && (
                <tr><td colSpan="2" className="py-4 text-center text-gray-400">No hay ventas pendientes</td></tr>
              )}
            </tbody>
            <tfoot>
              <tr className="border-t-2 border-gray-800">
                <td className="py-2 font-bold text-gray-800">Total Sistema</td>
                <td className="py-2 text-right font-bold text-blue-600">S/ {totalExpected.toFixed(2)}</td>
              </tr>
            </tfoot>
          </table>
        </div>

        {/* PANEL DE ARQUEO */}
        <div className="bg-white p-6 rounded-lg shadow-md flex flex-col justify-between">
          <div>
            <h2 className="text-lg font-semibold mb-4 border-b pb-2">Arqueo Físico</h2>

            <div className="mb-4">
              <label className="block text-sm text-gray-600 mb-1">Monto contado en efectivo/vouchers:</label>
              <input
                type="number"
                className="w-full p-3 border rounded-lg text-xl font-bold"
                value={physicalAmount}
                onChange={(e) => setPhysicalAmount(e.target.value)}
              />
            </div>

            <div className={`p-4 rounded-lg mb-4 ${difference < 0 ? 'bg-red-50 text-red-700' : 'bg-green-50 text-green-700'}`}>
              <div className="text-sm">Diferencia (Sobrante/Faltante):</div>
              <div className="text-2xl font-bold">S/ {difference.toFixed(2)}</div>
            </div>

            <div className="mb-4">
              <label className="block text-sm text-gray-600 mb-1">Notas u Observaciones:</label>
              <textarea
                className="w-full p-2 border rounded-lg h-24"
                placeholder="Ej: Faltó vuelto de 0.10 céntimos..."
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
              />
            </div>
          </div>

          <button
            onClick={handleFinalizeClosing}
            disabled={summary.length === 0}
            className={`w-full py-3 rounded-lg font-bold text-white transition ${summary.length === 0 ? 'bg-gray-400' : 'bg-indigo-600 hover:bg-indigo-700'}`}
          >
            FINALIZAR CIERRE DE CAJA
          </button>
        </div>
        <div className="mt-12 bg-white p-6 rounded-lg shadow-lg border border-gray-100">
          <div className="flex justify-between items-center mb-6">
            <h2 className="text-xl font-bold text-gray-800">Historial de Cierres de Caja</h2>
            <button
              onClick={fetchHistory}
              className="text-indigo-600 hover:text-indigo-800 text-sm font-medium"
            >
              🔄 Actualizar historial
            </button>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-sm text-left text-gray-500">
              <thead className="text-xs text-gray-700 uppercase bg-gray-50">
                <tr>
                  <th className="px-4 py-3">Fecha y Hora</th>
                  <th className="px-4 py-3 text-right">Esperado</th>
                  <th className="px-4 py-3 text-right">Real</th>
                  <th className="px-4 py-3 text-right">Diferencia</th>
                  <th className="px-4 py-3">Notas</th>
                </tr>
              </thead>
              <tbody>
                {history.map((close) => (
                  <tr key={close.id} className="bg-white border-b hover:bg-gray-50 transition">
                    <td className="px-4 py-4 font-medium text-gray-900">
                      {new Date(close.closing_date).toLocaleString('es-PE', {
                        day: '2-digit', month: '2-digit', year: 'numeric',
                        hour: '2-digit', minute: '2-digit'
                      })}
                    </td>
                    <td className="px-4 py-4 text-right">S/ {parseFloat(close.expected_amount).toFixed(2)}</td>
                    <td className="px-8 py-4 text-right">S/ {parseFloat(close.actual_amount).toFixed(2)}</td>
                    <td className={`px-4 py-4 text-right font-bold ${parseFloat(close.differences) < 0 ? 'text-red-600' :
                        parseFloat(close.differences) > 0 ? 'text-blue-600' : 'text-green-600'
                      }`}>
                      S/ {parseFloat(close.differences).toFixed(2)}
                    </td>
                    <td className="px-4 py-4 italic text-gray-400 max-w-xs truncate">
                      {close.notes || "Sin observaciones"}
                    </td>
                  </tr>
                ))}
                {history.length === 0 && (
                  <tr>
                    <td colSpan="5" className="px-4 py-10 text-center text-gray-400">
                      Aún no se han registrado cierres de caja.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  );
};

export default CashClosing;