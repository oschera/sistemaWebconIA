import React, { useState, useEffect } from 'react';
import inventoryApi from '../api/inventoryApi';
import { Eye, Trash2, Calendar, DollarSign } from 'lucide-react';
import Swal from 'sweetalert2';
import withReactContent from 'sweetalert2-react-content';

const MySwal = withReactContent(Swal);

const Orders = () => {
    const [orders, setOrders] = useState([]);

    // 1. Cargar Órdenes desde FastAPI
    const fetchOrders = async () => {
        try {
            const response = await inventoryApi.get('/order'); // Asegúrate que coincida con tu router.get
            setOrders(response.data);
        } catch (error) {
            console.error("Error al cargar órdenes:", error);
        }
    };

    useEffect(() => {
        fetchOrders();
    }, []);
    const handleViewDetail = (order) => {
        // 1. Construimos el cuerpo del detalle en HTML
        // Usamos 'order_items_order' que es como lo llama tu backend
        const itemsHtml = order.order_items_order.map(item => `
        <tr style="border-bottom: 1px solid #eee;">
            <td style="padding: 8px; text-align: left;">${item.product.name_product}</td>
            <td style="padding: 8px; text-align: center;">${item.quantity}</td>
            <td style="padding: 8px; text-align: right;">$${item.price.toFixed(2)}</td>
            <td style="padding: 8px; text-align: right; font-weight: bold;">$${item.sub_amount.toFixed(2)}</td>
        </tr>
    `).join('');

        // 2. Disparamos el modal con SweetAlert2
        MySwal.fire({
            title: `Detalle de la Orden #${order.id}`,
            html: `
            <div style="margin-top: 15px;">
                <p style="text-align: left; font-size: 0.9em; color: #666;">
                    <b>Fecha:</b> ${new Date(order.order_date).toLocaleString()}
                </p>
                <table style="width: 100%; border-collapse: collapse; margin-top: 10px; font-size: 0.85em;">
                    <thead style="background: #f8f9fa;">
                        <tr>
                            <th style="padding: 8px; text-align: left;">Producto</th>
                            <th style="padding: 8px; text-align: center;">Cant.</th>
                            <th style="padding: 8px; text-align: right;">Precio</th>
                            <th style="padding: 8px; text-align: right;">Subtotal</th>
                        </tr>
                    </thead>
                    <tbody>
                        ${itemsHtml}
                    </tbody>
                </table>
                <div style="margin-top: 15px; text-align: right; font-size: 1.1em;">
                    <span style="color: #666;">TOTAL:</span>
                    <span style="font-weight: 900; color: #1e40af; margin-left: 10px;">
                        $${order.total_amount.toFixed(2)}
                    </span>
                </div>
            </div>
        `,
            width: '600px',
            confirmButtonText: 'Cerrar',
            confirmButtonColor: '#3b82f6'
        });
    };
    const handleDeleteOrder = async (orderId) => {
        // 1. Pedir confirmación al usuario
        const result = await MySwal.fire({
            title: '¿Anular esta venta?',
            text: `Se eliminará la Orden #${orderId} y los productos volverán al inventario.`,
            icon: 'warning',
            showCancelButton: true,
            confirmButtonColor: '#d33',
            cancelButtonColor: '#3085d6',
            confirmButtonText: 'Sí, anular venta',
            cancelButtonText: 'Cancelar',
            reverseButtons: true
        });

        // 2. Si confirma, ejecutamos el borrado
        if (result.isConfirmed) {
            try {
                // Llamamos a tu endpoint de FastAPI (Asegúrate que la ruta sea /delete_order/{id})
                await inventoryApi.delete(`/delete_order/${orderId}`);

                // 3. 🚨 REFRESCAR LA LISTA: Filtramos la orden borrada del estado actual
                setOrders(orders.filter(order => order.id !== orderId));

                MySwal.fire(
                    '¡Anulada!',
                    'La venta ha sido eliminada y el stock restaurado.',
                    'success'
                );
            } catch (error) {
                console.error("Error al anular orden:", error);
                const errorMessage = error.response?.data?.detail || 'No se pudo anular la orden.';
                MySwal.fire('Error', errorMessage, 'error');
            }
        }
    };

    return (
        <div className="p-6">
            <h1 className="text-2xl font-bold mb-6 flex items-center gap-2">
                <Calendar className="text-blue-600" /> Historial de Ventas
            </h1>

            {/* Aquí irá nuestra tabla de la Fase 1 */}
            <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
                <table className="w-full text-left border-collapse">
                    <thead className="bg-gray-50 border-b border-gray-100">
                        <tr>
                            <th className="p-4 font-bold text-gray-600">ID Orden</th>
                            <th className="p-4 font-bold text-gray-600">Fecha</th>
                            <th className="p-4 font-bold text-gray-600">Total</th>
                            <th className="p-4 font-bold text-gray-600">Acciones</th>
                        </tr>
                    </thead>
                    <tbody>
                        {orders.map((order) => (
                            <tr key={order.id} className="border-b border-gray-50 hover:bg-gray-50 transition-colors">
                                <td className="p-4 font-medium">{order.id}</td>
                                <td className="p-4">
                                    {new Date(order.order_date).toLocaleString('es-PE', {
                                        day: '2-digit',
                                        month: '2-digit',
                                        year: 'numeric',
                                        hour: '2-digit',
                                        minute: '2-digit',
                                        hour12: true
                                    })}
                                </td>
                                <td className="p-4 font-bold text-green-700">
                                    ${order.total_amount.toFixed(2)}
                                </td>
                                <td className="p-4 flex gap-3">
                                    <button
                                        onClick={() => handleViewDetail(order)} // 🚨 CONEXIÓN AQUÍ
                                        className="text-blue-600 hover:bg-blue-50 p-2 rounded-lg"
                                        title="Ver Detalle"
                                    >
                                        <Eye size={18} />
                                    </button>
                                    <button
                                        onClick={() => handleDeleteOrder(order.id)} // 🚨 CONEXIÓN AQUÍ
                                        className="text-red-600 hover:bg-red-50 p-2 rounded-lg"
                                        title="Anular Venta"
                                    >
                                        <Trash2 size={18} />
                                    </button>
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>
        </div>
    );
};

export default Orders;