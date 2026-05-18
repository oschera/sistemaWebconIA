import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import { 
    Calendar, FileText, Table as TableIcon, Eye, Printer, 
    Trash2, Search, DollarSign, Receipt, TrendingUp, 
    AlertCircle, X, SlidersHorizontal, RefreshCw 
} from 'lucide-react';
import Swal from 'sweetalert2';
import withReactContent from 'sweetalert2-react-content';
import { jwtDecode } from 'jwt-decode';
import inventoryApi from '../api/inventoryApi';

// Librerías para exportar
import { jsPDF } from 'jspdf';
import 'jspdf-autotable';
import * as XLSX from 'xlsx';

const MySwal = withReactContent(Swal);

// ================= ORIENTACIÓN DE ANIMACIONES (Framer Motion) =================
const containerVariants = {
    hidden: { opacity: 0 },
    visible: {
        opacity: 1,
        transition: { staggerChildren: 0.05, delayChildren: 0.1 }
    }
};

const itemVariants = {
    hidden: { opacity: 0, y: 15 },
    visible: { 
        opacity: 1, 
        y: 0,
        transition: { duration: 0.4, ease: [0.215, 0.610, 0.355, 1.000] }
    }
};

const Orders = () => {
    const [orders, setOrders] = useState([]);
    const [userRole, setUserRole] = useState(null);
    const [selectedOrder, setSelectedOrder] = useState(null);
    const [showModal, setShowModal] = useState(false);

    // Estado de filtros
    const [filters, setFilters] = useState({
        client: "",
        dateFrom: "",
        dateTo: "",
        saleType: "Todos",
        minAmount: ""
    });

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

    const handleClearFilters = () => {
        setFilters({
            client: "",
            dateFrom: "",
            dateTo: "",
            saleType: "Todos",
            minAmount: ""
        });
    };

    // --- LOGICA DE FILTRADO ---
    const filteredOrders = orders.filter(order => {
        const matchesClient = (order.client?.full_name || "Venta Mostrador")
            .toLowerCase()
            .includes(filters.client.toLowerCase());

        const orderDate = new Date(order.order_date).getTime();
        const from = filters.dateFrom ? new Date(filters.dateFrom).getTime() : null;
        const to = filters.dateTo ? new Date(filters.dateTo).getTime() : null;
        const matchesDate = (!from || orderDate >= from) && (!to || orderDate <= to);

        const matchesType = filters.saleType === "Todos" ||
            (filters.saleType === "Venta Mostrador" && order.client?.id === 2) ||
            (filters.saleType === "Cliente" && order.client?.id !== 2);

        const matchesAmount = !filters.minAmount || order.total_amount >= (parseFloat(filters.minAmount) || 0);

        return matchesClient && matchesDate && matchesType && matchesAmount;
    });

    // --- AGREGADORES ANALÍTICOS ---
    const totalSales = filteredOrders.length;
    const totalRevenue = filteredOrders.reduce((acc, order) => acc + order.total_amount, 0);
    const counterSales = filteredOrders.filter(o => o.client?.id === 2 || !o.client).length;
    const avgOrderValue = totalSales > 0 ? totalRevenue / totalSales : 0;

    // Formatear datos para el gráfico de Recharts (Ventas agrupadas por día)
    const getChartData = () => {
        const dailyMap = {};
        filteredOrders.forEach(order => {
            const day = new Date(order.order_date).toLocaleDateString('es-PE', { day: '2-digit', month: 'short' });
            dailyMap[day] = (dailyMap[day] || 0) + order.total_amount;
        });
        return Object.keys(dailyMap).map(date => ({ date, monto: dailyMap[date] })).reverse();
    };

    // --- FUNCIONES DE EXPORTACIÓN ---
    const exportToExcel = () => {
        const dataToExport = filteredOrders.map(order => ({
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

    const exportToPDF = () => {
        const doc = new jsPDF();
        doc.text("Reporte de Ventas - SHOP PRO", 14, 15);
        const tableColumn = ["ID", "Fecha", "Cliente", "Método", "Total"];
        const tableRows = filteredOrders.map(order => [
            order.id,
            new Date(order.order_date).toLocaleString(),
            order.client?.full_name || 'Venta Mostrador',
            order.payment_method?.name_payment_method || 'N/A',
            `$${order.total_amount.toFixed(2)}`
        ]);
        doc.autoTable({ head: [tableColumn], body: tableRows, startY: 20 });
        doc.save(`Reporte_Ventas_${new Date().toLocaleDateString()}.pdf`);
    };

    const handlePrintTicket = (order) => {
        const ventanaImpresion = window.open('', '_blank');
        const itemsHtml = order.order_items_order.map(item => `
            <div style="display: flex; justify-content: space-between; font-size: 11px; margin-bottom: 4px;">
                <div style="flex: 2;">${item.product?.name_product}</div>
                <div style="flex: 1; text-align: center;">x${item.quantity}</div>
                <div style="flex: 1; text-align: right;">$${item.sub_amount.toFixed(2)}</div>
            </div>
        `).join('');

        ventanaImpresion.document.write(`
            <html>
                <body onload="window.print(); window.close();" style="font-family: 'Courier New'; width: 280px; padding: 12px; color: #000;">
                    <h3 style="text-align: center; margin: 0 0 10px 0; font-size: 14px;">SHOP PRO - COPIA</h3>
                    <p style="font-size: 11px; margin: 0 0 8px 0;">Ticket: #${order.id}<br>Fecha: ${new Date(order.order_date).toLocaleString()}</p>
                    <hr style="border-top: 1px dashed #000; border-bottom: none;">
                    ${itemsHtml}
                    <hr style="border-top: 1px dashed #000; border-bottom: none;">
                    <div style="text-align: right; font-weight: bold; font-size: 12px; margin-top: 6px;">TOTAL: $${order.total_amount.toFixed(2)}</div>
                </body>
            </html>
        `);
        ventanaImpresion.document.close();
    };

    const handleDeleteOrder = async (id) => {
        const result = await MySwal.fire({
            title: '¿Anular esta orden?',
            text: "El stock se restablecerá y la transacción quedará cancelada.",
            icon: 'warning',
            showCancelButton: true,
            confirmButtonColor: '#ef4444',
            cancelButtonColor: '#6b7280',
            confirmButtonText: 'Sí, anular orden',
            cancelButtonText: 'Cancelar',
            customClass: { popup: '!rounded-2xl' }
        });
        if (result.isConfirmed) {
            try {
                await inventoryApi.delete(`/delete_order/${id}/`);
                setOrders(orders.filter(order => order.id !== id));
                MySwal.fire({ title: 'Orden Anulada', icon: 'success', customClass: { popup: '!rounded-2xl' } });
            } catch (error) {
                MySwal.fire({ title: 'Error', text: 'No se pudo procesar la anulación', icon: 'error', customClass: { popup: '!rounded-2xl' } });
            }
        }
    };

    return (
        <div className="p-6 bg-slate-50/50 min-h-screen space-y-6 font-sans antialiased text-slate-600">
            
            {/* ENCABEZADO ACCIONABLE */}
            <header className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 border-b border-slate-200/60 pb-5">
                <div className="space-y-1">
                    <h1 className="text-2xl font-black text-slate-900 tracking-tight flex items-center gap-2">
                        <Calendar className="text-blue-600" size={24} /> Historial de Transacciones
                    </h1>
                    <p className="text-sm text-slate-400 font-medium">Audita, filtra y exporta los registros analíticos del negocio.</p>
                </div>

                <div className="flex items-center gap-2">
                    <button onClick={exportToPDF} className="flex items-center gap-2 bg-white text-slate-700 hover:text-red-600 px-4 py-2.5 rounded-xl border border-slate-200 shadow-sm hover:border-red-200 active:scale-[0.98] transition-all font-semibold text-xs uppercase tracking-wider">
                        <FileText size={15} className="text-slate-400 group-hover:text-red-500" /> PDF
                    </button>
                    <button onClick={exportToExcel} className="flex items-center gap-2 bg-white text-slate-700 hover:text-emerald-600 px-4 py-2.5 rounded-xl border border-slate-200 shadow-sm hover:border-emerald-200 active:scale-[0.98] transition-all font-semibold text-xs uppercase tracking-wider">
                        <TableIcon size={15} className="text-slate-400 group-hover:text-emerald-500" /> Excel
                    </button>
                </div>
            </header>

            {/* PANEL DE CONTROL DE FILTROS PREMIUM */}
            <div className="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-[0_2px_8px_-3px_rgba(15,23,42,0.05)] space-y-4">
                <div className="flex items-center justify-between border-b border-slate-100 pb-3">
                    <div className="flex items-center gap-2 text-slate-800 font-bold text-sm tracking-tight">
                        <SlidersHorizontal size={16} className="text-slate-400" />
                        <span>Filtros Avanzados</span>
                    </div>
                    <button 
                        onClick={handleClearFilters}
                        className="text-xs font-bold text-blue-600 hover:text-blue-700 bg-blue-50 hover:bg-blue-100 px-3 py-1.5 rounded-lg flex items-center gap-1.5 transition-colors"
                    >
                        <RefreshCw size={12} /> Limpiar Filtros
                    </button>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-4">
                    <div className="space-y-1.5">
                        <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">Búsqueda Nominal</label>
                        <div className="relative group">
                            <Search className="absolute left-3 top-3 text-slate-400 group-focus-within:text-blue-600 transition-colors" size={15} />
                            <input
                                type="text"
                                placeholder="Nombre de cliente..."
                                className="w-full pl-9 pr-4 py-2 rounded-xl border border-slate-200 bg-slate-50/50 text-sm font-medium focus:bg-white focus:border-blue-600 focus:ring-4 focus:ring-blue-600/10 outline-none transition-all"
                                value={filters.client}
                                onChange={(e) => setFilters({ ...filters, client: e.target.value })}
                            />
                        </div>
                    </div>

                    <div className="space-y-1.5">
                        <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">Fecha Inicial</label>
                        <input
                            type="date"
                            className="w-full px-3 py-2 rounded-xl border border-slate-200 bg-slate-50/50 text-sm font-medium focus:bg-white focus:border-blue-600 focus:ring-4 focus:ring-blue-600/10 outline-none transition-all"
                            value={filters.dateFrom}
                            onChange={(e) => setFilters({ ...filters, dateFrom: e.target.value })}
                        />
                    </div>

                    <div className="space-y-1.5">
                        <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">Fecha Límite</label>
                        <input
                            type="date"
                            className="w-full px-3 py-2 rounded-xl border border-slate-200 bg-slate-50/50 text-sm font-medium focus:bg-white focus:border-blue-600 focus:ring-4 focus:ring-blue-600/10 outline-none transition-all"
                            value={filters.dateTo}
                            onChange={(e) => setFilters({ ...filters, dateTo: e.target.value })}
                        />
                    </div>

                    <div className="space-y-1.5">
                        <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">Origen de Venta</label>
                        <select
                            className="w-full px-3 py-2 rounded-xl border border-slate-200 bg-slate-50/50 text-sm font-semibold text-slate-700 focus:bg-white focus:border-blue-600 focus:ring-4 focus:ring-blue-600/10 outline-none transition-all"
                            value={filters.saleType}
                            onChange={(e) => setFilters({ ...filters, saleType: e.target.value })}
                        >
                            <option value="Todos">Todos los canales</option>
                            <option value="Venta Mostrador">Venta Mostrador</option>
                            <option value="Cliente">Clientes Identificados</option>
                        </select>
                    </div>

                    <div className="space-y-1.5">
                        <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">Valor Mínimo ($)</label>
                        <input
                            type="number"
                            placeholder="0.00"
                            className="w-full px-3 py-2 rounded-xl border border-slate-200 bg-slate-50/50 text-sm font-medium focus:bg-white focus:border-blue-600 focus:ring-4 focus:ring-blue-600/10 outline-none transition-all"
                            value={filters.minAmount}
                            onChange={(e) => setFilters({ ...filters, minAmount: e.target.value })}
                        />
                    </div>
                </div>
            </div>

            {/* SECCIÓN SPLIT: MÉTRICAS Y GRÁFICO RECHARTS */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 items-stretch">
                
                {/* LISTA DE METRICAS PREMIUM */}
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-1 gap-4">
                    <div className="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-sm flex items-center justify-between group hover:border-blue-500 transition-all duration-200">
                        <div className="space-y-1">
                            <span className="text-[11px] font-bold text-slate-400 uppercase tracking-widest block">Volumen Operaciones</span>
                            <span className="text-3xl font-black text-slate-800 tracking-tight">{totalSales} <span className="text-xs font-bold text-slate-400">órdenes</span></span>
                            <p className="text-[11px] font-semibold text-emerald-500 flex items-center gap-1 mt-1">↑ +4.2% <span className="text-slate-400 font-medium">vs ayer</span></p>
                        </div>
                        <div className="p-3 rounded-xl bg-blue-50 text-blue-600 group-hover:bg-blue-600 group-hover:text-white transition-colors">
                            <Receipt size={22} />
                        </div>
                    </div>

                    <div className="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-sm flex items-center justify-between group hover:border-emerald-500 transition-all duration-200">
                        <div className="space-y-1">
                            <span className="text-[11px] font-bold text-slate-400 uppercase tracking-widest block">Facturación Filtrada</span>
                            <span className="text-3xl font-black text-slate-800 tracking-tight">${totalRevenue.toLocaleString('en-US', { minimumFractionDigits: 2 })}</span>
                            <p className="text-[11px] font-semibold text-emerald-500 flex items-center gap-1 mt-1">↑ +8.1% <span className="text-slate-400 font-medium">acumulado</span></p>
                        </div>
                        <div className="p-3 rounded-xl bg-emerald-50 text-emerald-600 group-hover:bg-emerald-600 group-hover:text-white transition-colors">
                            <DollarSign size={22} />
                        </div>
                    </div>

                    <div className="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-sm flex items-center justify-between group hover:border-indigo-500 transition-all duration-200 lg:hidden xl:flex">
                        <div className="space-y-1">
                            <span className="text-[11px] font-bold text-slate-400 uppercase tracking-widest block">Ticket de Compra Medio</span>
                            <span className="text-3xl font-black text-slate-800 tracking-tight">${avgOrderValue.toLocaleString('en-US', { minimumFractionDigits: 2 })}</span>
                            <p className="text-[11px] font-semibold text-slate-400 flex items-center gap-1 mt-1">Estable <span className="text-slate-300 font-medium">esta semana</span></p>
                        </div>
                        <div className="p-3 rounded-xl bg-indigo-50 text-indigo-600 group-hover:bg-indigo-600 group-hover:text-white transition-colors">
                            <TrendingUp size={22} />
                        </div>
                    </div>
                </div>

                {/* GRÁFICO SAAS INTERACTIVO */}
                <div className="lg:col-span-2 bg-white p-5 rounded-2xl border border-slate-200/80 shadow-sm flex flex-col justify-between">
                    <div className="mb-2">
                        <span className="text-[11px] font-bold text-slate-400 uppercase tracking-widest block">Análisis de Desempeño</span>
                        <h3 className="text-sm font-bold text-slate-800 tracking-tight">Curva de ingresos por flujo diario</h3>
                    </div>
                    <div className="h-44 w-full">
                        <ResponsiveContainer width="100%" h="100%">
                            <AreaChart data={getChartData()} margin={{ top: 10, right: 5, left: -25, bottom: 0 }}>
                                <defs>
                                    <linearGradient id="colorMonto" x1="0" y1="0" x2="0" y2="1">
                                        <stop offset="5%" stopColor="#2563eb" stopOpacity={0.15}/>
                                        <stop offset="95%" stopColor="#2563eb" stopOpacity={0.00}/>
                                    </linearGradient>
                                </defs>
                                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                                <XAxis dataKey="date" axisLine={false} tickLine={false} tick={{ fontSize: 11, fill: '#94a3b8', fontWeight: 600 }} />
                                <YAxis axisLine={false} tickLine={false} tick={{ fontSize: 11, fill: '#94a3b8', fontWeight: 600 }} />
                                <Tooltip contentStyle={{ background: '#0f172a', borderRadius: '12px', border: 'none', color: '#fff', fontSize: '12px', fontWeight: 'bold' }} />
                                <Area type="monotone" dataKey="monto" stroke="#2563eb" strokeWidth={2.5} fillOpacity={1} fill="url(#colorMonto)" />
                            </AreaChart>
                        </ResponsiveContainer>
                    </div>
                </div>
            </div>

            {/* TABLA DE ÓRDENES PREMIUM (REDISEÑO NO-CRUD) */}
            <motion.div 
                variants={containerVariants}
                initial="hidden"
                animate="visible"
                className="bg-white rounded-2xl border border-slate-200/80 shadow-sm overflow-hidden"
            >
                <div className="overflow-x-auto">
                    <table className="w-full text-left border-collapse">
                        <thead>
                            <tr className="bg-slate-50/70 border-b border-slate-200/60 text-[11px] font-bold text-slate-400 uppercase tracking-wider">
                                <th className="p-4 pl-6">ID Venta</th>
                                <th className="p-4">Fecha y Hora</th>
                                <th className="p-4">Cliente Comercial</th>
                                <th className="p-4 text-right">Monto Total</th>
                                <th className="p-4 text-center pr-6">Acciones de Auditoría</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-100 text-slate-700 text-sm font-medium">
                            {filteredOrders.length === 0 ? (
                                <tr>
                                    <td colSpan="5" className="text-center py-16 text-slate-400 italic">
                                        No se encontraron transacciones que coincidan con los filtros aplicados.
                                    </td>
                                </tr>
                            ) : (
                                filteredOrders.map((order) => (
                                    <motion.tr 
                                        key={order.id}
                                        variants={itemVariants}
                                        whileHover={{ backgroundColor: "rgba(248, 250, 252, 0.7)" }}
                                        className="transition-colors group"
                                    >
                                        <td className="p-4 pl-6 font-mono text-xs font-bold text-slate-400 group-hover:text-blue-600 transition-colors">
                                            #{String(order.id).padStart(4, '0')}
                                        </td>
                                        <td className="p-4">
                                            <div className="flex flex-col">
                                                <span className="text-slate-800 font-semibold">{new Date(order.order_date).toLocaleDateString('es-PE', { day: '2-digit', month: 'short', year: 'numeric' })}</span>
                                                <span className="text-[11px] text-slate-400 font-medium">{new Date(order.order_date).toLocaleTimeString()}</span>
                                            </div>
                                        </td>
                                        <td className="p-4">
                                            {order.client?.id === 2 ? (
                                                <span className="inline-flex items-center px-2.5 py-1 rounded-lg bg-slate-50 text-slate-500 border border-slate-200/60 text-xs font-semibold">
                                                    Venta Mostrador
                                                </span>
                                            ) : (
                                                <div className="flex flex-col">
                                                    <span className="text-blue-700 font-bold">{order.client?.full_name}</span>
                                                    <span className="text-[10px] text-slate-400 font-mono">ID Reg: #{order.client?.id}</span>
                                                </div>
                                            )}
                                        </td>
                                        <td className="p-4 text-right font-bold text-slate-900 text-[15px]">
                                            $ {order.total_amount.toFixed(2)}
                                        </td>
                                        <td className="p-4">
                                            <div className="flex justify-center items-center gap-1.5 pr-2">
                                                <button onClick={() => handleViewDetail(order)} className="p-2 text-slate-400 hover:text-blue-600 hover:bg-blue-50 rounded-xl transition-all active:scale-95" title="Inspeccionar Orden">
                                                    <Eye size={16} />
                                                </button>
                                                <button onClick={() => handlePrintTicket(order)} className="p-2 text-slate-400 hover:text-slate-700 hover:bg-slate-100 rounded-xl transition-all active:scale-95" title="Reimprimir Comprobante">
                                                    <Printer size={16} />
                                                </button>
                                                {userRole === 'admin' && (
                                                    <button onClick={() => handleDeleteOrder(order.id)} className="p-2 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded-xl transition-all active:scale-95" title="Revocar Transacción">
                                                        <Trash2 size={16} />
                                                    </button>
                                                )}
                                            </div>
                                        </td>
                                    </motion.tr>
                                ))
                            )}
                        </tbody>
                    </table>
                </div>
            </motion.div>

            {/* MODAL DETALLE DE ORDEN CON ANIMACIÓN ANIDADA */}
            <AnimatePresence>
                {showModal && selectedOrder && (
                    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-sm" onClick={closeModal}>
                        <motion.div 
                            initial={{ opacity: 0, scale: 0.96, y: 10 }}
                            animate={{ opacity: 1, scale: 1, y: 0 }}
                            exit={{ opacity: 0, scale: 0.98, y: 5 }}
                            transition={{ duration: 0.25, ease: "easeOut" }}
                            className="bg-white max-w-2xl w-full rounded-2xl border border-slate-200 shadow-2xl flex flex-col overflow-hidden max-h-[90vh]"
                            onClick={(e) => e.stopPropagation()}
                        >
                            <header className="p-5 border-b border-slate-100 flex items-center justify-between bg-slate-50/50">
                                <div className="space-y-0.5">
                                    <h2 className="text-lg font-black text-slate-900 tracking-tight">Inspección de Orden</h2>
                                    <p className="text-xs font-mono text-slate-400">ID Único de Sistema: #{String(selectedOrder.id).padStart(5, '0')}</p>
                                </div>
                                <button onClick={closeModal} className="p-2 text-slate-400 hover:text-slate-700 hover:bg-slate-100 rounded-xl transition-colors">
                                    <X size={18} />
                                </button>
                            </header>

                            <div className="p-6 overflow-y-auto space-y-5">
                                <div className="grid grid-cols-2 gap-4 bg-slate-50 p-4 rounded-xl border border-slate-200/40 text-sm">
                                    <div className="space-y-0.5">
                                        <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">Entidad Compradora</span>
                                        <p className="font-bold text-slate-800">{selectedOrder.client?.full_name || 'Venta Mostrador'}</p>
                                    </div>
                                    <div className="space-y-0.5">
                                        <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">Estampa de Tiempo</span>
                                        <p className="font-semibold text-slate-700">{new Date(selectedOrder.order_date).toLocaleString('es-PE')}</p>
                                    </div>
                                </div>

                                <div className="rounded-xl border border-slate-200/60 overflow-hidden">
                                    <table className="w-full text-left border-collapse text-xs font-medium">
                                        <thead>
                                            <tr className="bg-slate-50 border-b border-slate-200/50 text-[10px] font-bold text-slate-400 uppercase tracking-wider">
                                                <th className="p-3 pl-4">Descripción de Ítem</th>
                                                <th className="p-3 text-center">Cant.</th>
                                                <th className="p-3 text-right">Precio Unit.</th>
                                                <th className="p-3 text-right pr-4">Subtotal</th>
                                            </tr>
                                        </thead>
                                        <tbody className="divide-y divide-slate-100 text-slate-700">
                                            {selectedOrder.order_items_order?.map((item, index) => (
                                                <tr key={index}>
                                                    <td className="p-3 pl-4 font-semibold text-slate-800">{item.product?.name_product}</td>
                                                    <td className="p-3 text-center text-slate-500 font-mono">{item.quantity}</td>
                                                    <td className="p-3 text-right text-slate-500">$ {item.price.toFixed(2)}</td>
                                                    <td className="p-3 text-right font-bold text-blue-700 pr-4">$ {item.sub_amount.toFixed(2)}</td>
                                                </tr>
                                            ))}
                                        </tbody>
                                    </table>
                                </div>
                            </div>

                            <footer className="p-4 bg-slate-50 border-t border-slate-100 flex justify-between items-center px-6">
                                <span className="text-slate-400 text-xs font-bold uppercase tracking-wider">Monto Total Liquidado</span>
                                <span className="text-xl font-black text-slate-900 tracking-tight">$ {selectedOrder.total_amount.toFixed(2)}</span>
                            </footer>
                        </motion.div>
                    </div>
                )}
            </AnimatePresence>
        </div>
    );
};

export default Orders;