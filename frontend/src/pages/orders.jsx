import React, { useState, useEffect } from 'react';
import inventoryApi from '../api/inventoryApi';
import { Eye, Trash2, Calendar, Printer, FileText, Table as TableIcon } from 'lucide-react';
import Swal from 'sweetalert2';
import withReactContent from 'sweetalert2-react-content';
import { jwtDecode } from 'jwt-decode';
import './inventory.css'; // Reutilizamos los estilos

// Librerías para exportar
import { jsPDF } from 'jspdf';
import 'jspdf-autotable';
import * as XLSX from 'xlsx';

const MySwal = withReactContent(Swal);

const Orders = () => {
    const [orders, setOrders] = useState([]);
    const [userRole, setUserRole] = useState(null);

    useEffect(() => {
        const token = localStorage.getItem('token');
        if (token) {
            const decoded = jwtDecode(token);
            setUserRole(decoded.role);
        }
        fetchOrders();

    }, []);

    const fetchOrders = async () => {
        try {
            const response = await inventoryApi.get('/order/');
            setOrders(response.data);
        } catch (error) {
            console.error("Error al cargar órdenes:", error);
        }
    };

    // --- FUNCIÓN EXPORTAR A EXCEL ---
    const exportToExcel = () => {
        const dataToExport = orders.map(order => ({
            ID: order.id,
            Fecha: new Date(order.order_date).toLocaleString(),
            Cliente: order.client?.full_name || 'Venta Mostrador',
            Total: order.total_amount,
            Metodo: order.payment_method?.name_payment_method || 'N/A'
        }));

        const ws = XLSX.utils.json_to_sheet(dataToExport);
        const wb = XLSX.utils.book_new();
        XLSX.utils.book_append_sheet(wb, ws, "Ventas");
        XLSX.writeFile(wb, `Reporte_Ventas_${new Date().toLocaleDateString()}.xlsx`);
    };

    // --- FUNCIÓN EXPORTAR A PDF ---
    const exportToPDF = () => {
        const doc = new jsPDF();
        doc.text("Reporte de Ventas - SHOP PRO", 14, 15);

        const tableColumn = ["ID", "Fecha", "Cliente", "Método", "Total"];
        const tableRows = orders.map(order => [
            order.id,
            new Date(order.order_date).toLocaleString(),
            order.client?.full_name || 'Venta Mostrador',
            order.payment_method?.name_payment_method || 'N/A',
            `$${order.total_amount.toFixed(2)}`
        ]);

        doc.autoTable({
            head: [tableColumn],
            body: tableRows,
            startY: 20,
        });
        doc.save(`Reporte_Ventas_${new Date().toLocaleDateString()}.pdf`);
    };

    // --- FUNCIÓN REIMPRIMIR TICKET (La misma que en Sales) ---
    const handlePrintTicket = (order) => {
        const ventanaImpresion = window.open('', '_blank');
        const itemsHtml = order.order_items_order.map(item => `
            <div style="display: flex; justify-content: space-between; font-size: 11px;">
                <div style="flex: 2;">${item.product.name_product}</div>
                <div style="flex: 1; text-align: center;">x${item.quantity}</div>
                <div style="flex: 1; text-align: right;">${item.sub_amount.toFixed(2)}</div>
            </div>
        `).join('');

        ventanaImpresion.document.write(`
            <html>
                <body onload="window.print(); window.close();" style="font-family: 'Courier New'; width: 280px; padding: 10px;">
                    <h3 style="text-align: center; margin: 0;">SHOP PRO - COPIA</h3>
                    <p style="font-size: 11px;">Ticket: #${order.id}<br>Fecha: ${new Date(order.order_date).toLocaleString()}</p>
                    <hr>
                    ${itemsHtml}
                    <hr>
                    <div style="text-align: right; font-weight: bold;">TOTAL: $${order.total_amount.toFixed(2)}</div>
                </body>
            </html>
        `);
        ventanaImpresion.document.close();
    };
    const totalSales = orders.length;
    const totalRevenue = orders.reduce((acc, order) => acc + order.total_amount, 0);
    const counterSales = orders.filter(o => o.client?.id === 1 || !o.client).length;
    const avgOrderValue = totalSales > 0 ? totalRevenue / totalSales : 0;

    // --- LOGICA DE DETALLE Y ELIMINAR (Manteniendo tu base) ---
    const handleViewDetail = (order) => { /* Tu función SweetAlert actual */ };

    return (
        <div className="inventory-view">
            <header className="inventory-header">
                <h1 className="text-2xl font-bold flex items-center gap-2">
                    <Calendar className="text-blue-600" /> Historial de Ventas
                </h1>

                {/* BOTONES DE EXPORTACIÓN */}
                <div className="flex gap-2">
                    <button onClick={exportToPDF} className="flex items-center gap-2 bg-red-50 text-red-600 px-4 py-2 rounded-lg border border-red-100 hover:bg-red-100 transition-all font-bold text-sm">
                        <FileText size={18} /> PDF
                    </button>
                    <button onClick={exportToExcel} className="flex items-center gap-2 bg-green-50 text-green-600 px-4 py-2 rounded-lg border border-green-100 hover:bg-green-100 transition-all font-bold text-sm">
                        <TableIcon size={18} /> EXCEL
                    </button>
                </div>
            </header>

            {/* DASHBOARD DE VENTAS (Mismo estilo que Inventory) */}
            <div className="inventory-dashboard">
                <div className="stat-card">
                    <span className="stat-title">Total Ventas</span>
                    <span className="stat-value">{totalSales}</span>
                </div>
                
                <div className="stat-card">
                    <span className="stat-title">Ingresos Totales</span>
                    <span className="stat-value text-green-600">
                        ${totalRevenue.toLocaleString('en-US', { minimumFractionDigits: 2 })}
                    </span>
                </div>

                <div className="stat-card">
                    <span className="stat-title">Venta Promedio</span>
                    <span className="stat-value">
                        ${avgOrderValue.toLocaleString('en-US', { minimumFractionDigits: 2 })}
                    </span>
                </div>

                <div className="stat-card">
                    <span className="stat-title">Ventas Mostrador</span>
                    <span className="stat-value">{counterSales}</span>
                </div>
            </div>

            {/* TABLA ESTILIZADA CON custom-table */}
            <div className="px-8 pb-8"> {/* Contenedor para mantener márgenes */}
                <table className="custom-table shadow-sm">
                    <thead>
                        <tr>
                            <th>ID</th>
                            <th>Fecha</th>
                            <th>Cliente</th>
                            <th>Total</th>
                            <th className="text-center">Acciones</th>
                        </tr>
                    </thead>
                    <tbody>
                        {orders.map((order) => (
                            <tr key={order.id}>
                                <td className="font-bold text-gray-400">#{order.id}</td>
                                <td>
                                    <div className="text-sm">
                                        {new Date(order.order_date).toLocaleDateString()}
                                        <br />
                                        <span className="text-xs text-gray-400">
                                            {new Date(order.order_date).toLocaleTimeString()}
                                        </span>
                                    </div>
                                </td>
                                <td>
                                    <span className={`text-sm ${order.client?.id === 1 ? 'text-gray-400' : 'font-bold text-blue-600'}`}>
                                        {order.client?.full_name || 'Venta Mostrador'}
                                    </span>
                                </td>
                                <td className="font-bold text-green-700">
                                    ${order.total_amount.toFixed(2)}
                                </td>
                                <td>
                                    <div className="flex justify-center gap-2">
                                        <button onClick={() => handleViewDetail(order)} className="text-blue-500 hover:bg-blue-50 p-2 rounded-md transition-colors" title="Ver Detalle">
                                            <Eye size={18} />
                                        </button>

                                        <button onClick={() => handlePrintTicket(order)} className="text-gray-500 hover:bg-gray-100 p-2 rounded-md transition-colors" title="Reimprimir Ticket">
                                            <Printer size={18} />
                                        </button>

                                        {userRole === 'admin' && (
                                            <button onClick={() => {}} className="text-red-500 hover:bg-red-50 p-2 rounded-md transition-colors" title="Anular Orden">
                                                <Trash2 size={18} />
                                            </button>
                                        )}
                                    </div>
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