import React, { useState, useEffect } from 'react';
import inventoryApi from '../api/inventoryApi';
import { ShoppingCart, Plus, CheckCircle, UserPlus, Search, X, DollarSign, Receipt, TrendingUp, AlertCircle } from 'lucide-react';
import Swal from 'sweetalert2';
import withReactContent from 'sweetalert2-react-content';
import '../styles/sales.css';

const MySwal = withReactContent(Swal);

const Sales = () => {
    // --- ESTADOS ---
    const [products, setProducts] = useState([]);
    const [cart, setCart] = useState([]);
    const [paymentMethods, setPaymentMethods] = useState([]);
    const [selectedPaymentMethod, setSelectedPaymentMethod] = useState(1);
    const [searchTerm, setSearchTerm] = useState('');

    // Estado para Métricas Dinámicas del Dashboard
    const [metrics, setMetrics] = useState({
        totalSalesToday: 0,
        totalOrdersToday: 0,
        averageTicket: 0,
        lowStockCount: 0
    });

    const [selectedClient, setSelectedClient] = useState({ id: 2, full_name: 'Venta Mostrador' });
    const [dniSearch, setDniSearch] = useState('');

    // --- CARGA DE DATOS ---
    const fetchInitialData = async () => {
        try {
            const [productsRes, paymentMethodsRes, reportRes] = await Promise.all([
                inventoryApi.get('/products'),
                inventoryApi.get('/payment_methods'),
                inventoryApi.get('/sales_report/').catch(() => ({ data: { total_sales: 0, total_orders: 0 } }))
            ]);
            
            setProducts(productsRes.data);
            setPaymentMethods(paymentMethodsRes.data);

            // Cálculo automatizado de productos con bajo stock (0 a 5 unidades)
            const lowStockItems = productsRes.data.filter(p => p.stock >= 0 && p.stock <= 5).length;
            
            // Asignación de métricas combinando reporte histórico del día y tiempo real
            const salesToday = reportRes.data?.total_sales || 0;
            const ordersToday = reportRes.data?.total_orders || 0;
            const avgTicket = ordersToday > 0 ? (salesToday / ordersToday) : 0;

            setMetrics({
                totalSalesToday: salesToday,
                totalOrdersToday: ordersToday,
                averageTicket: avgTicket,
                lowStockCount: lowStockItems
            });

        } catch (error) {
            console.error(error);
            MySwal.fire('Error', 'No se pudo sincronizar con el servidor', 'error');
        }
    };

    useEffect(() => {
        fetchInitialData();
    }, []);

    const handleDniChange = async (e) => {
        const value = e.target.value.replace(/\D/g, '').substring(0, 8);
        setDniSearch(value);

        if (value.length === 8) {
            try {
                const response = await inventoryApi.get(`/clients/${value}`);
                setSelectedClient(response.data);
            } catch (error) {
                setSelectedClient({ id: 2, full_name: 'Venta Mostrador' });
            }
        } else if (value.length < 8 && selectedClient.id !== 2) {
            setSelectedClient({ id: 2, full_name: 'Venta Mostrador' });
        }
    };

    const handleRegisterNewClient = async () => {
        const { value: formValues } = await MySwal.fire({
            title: 'Identificar Cliente',
            html: `
                <div class="modal-body text-left space-y-4" style="font-family: inherit;">
                    <div class="modal-group full-width">
                        <label class="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">DNI (8 dígitos)</label>
                        <div class="input-with-button flex gap-2">
                            <input 
                                id="swal-dni" 
                                type="text"
                                pattern="[0-9]*"
                                inputmode="numeric"
                                class="modal-input swal2-input !m-0 !w-full !rounded-xl !border-slate-200 !bg-slate-50 focus:!border-blue-600 focus:!ring-4 focus:!ring-blue-600/10 transition-all duration-200" 
                                placeholder="44556677" 
                                maxlength="8"
                                value="${dniSearch.length === 8 ? dniSearch : ''}"
                            />
                            <button 
                                id="btn-dni" 
                                type="button" 
                                class="btn-action-primary bg-blue-600 hover:bg-blue-700 active:scale-95 text-white font-bold px-4 rounded-xl transition-all duration-150 shadow-sm outline-none"
                            >
                                Consultar
                            </button>
                        </div>
                    </div>
                    <div class="modal-group full-width">
                        <label class="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">Nombre Completo</label>
                        <input 
                            id="swal-fullname" 
                            type="text"
                            class="modal-input swal2-input !m-0 !w-full !rounded-xl !border-slate-200 !bg-slate-100 text-slate-500 font-medium cursor-not-allowed outline-none" 
                            placeholder="Datos consultados desde RENIEC" 
                            readonly 
                        />
                    </div>
                    <div class="modal-group full-width">
                        <label class="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">Dirección (Opcional)</label>
                        <input 
                            id="swal-address" 
                            type="text"
                            class="modal-input swal2-input !m-0 !w-full !rounded-xl !border-slate-200 !bg-slate-50 focus:!border-blue-600 focus:!ring-4 focus:!ring-blue-600/10 transition-all duration-200" 
                            placeholder="Calle, Av, Jr..." 
                        />
                    </div>
                    <div class="grid grid-cols-1 sm:grid-cols-2 gap-4">
                        <div class="modal-group">
                            <label class="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">Teléfono</label>
                            <input 
                                id="swal-phone" 
                                type="tel"
                                class="modal-input swal2-input !m-0 !w-full !rounded-xl !border-slate-200 !bg-slate-50 focus:!border-blue-600 focus:!ring-4 focus:!ring-blue-600/10 transition-all duration-200" 
                                placeholder="999888777" 
                            />
                        </div>
                        <div class="modal-group">
                            <label class="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">Email (Obligatorio)</label>
                            <input 
                                id="swal-email" 
                                type="email" 
                                class="modal-input swal2-input !m-0 !w-full !rounded-xl !border-slate-200 !bg-slate-50 focus:!border-blue-600 focus:!ring-4 focus:!ring-blue-600/10 transition-all duration-200" 
                                placeholder="correo@gmail.com" 
                            />
                        </div>
                    </div>
                </div>
            `,
            customClass: {
                popup: '!rounded-2xl !p-6 !max-w-md',
                title: '!text-2xl !font-black !text-slate-800 !tracking-tight !pt-2 !pb-0',
                actions: '!mt-6 !gap-3 !w-full !justify-end',
                confirmButton: 'bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 !text-white !font-bold !py-3 !px-6 !rounded-xl !shadow-md !shadow-blue-600/10 active:scale-[0.98] !transition-all !m-0',
                cancelButton: 'bg-slate-100 hover:bg-slate-200 !text-slate-700 !font-bold !py-3 !px-6 !rounded-xl active:scale-[0.98] !transition-all !m-0'
            },
            buttonsStyling: false,
            showCancelButton: true,
            confirmButtonText: 'Registrar Cliente',
            cancelButtonText: 'Cancelar',
            didOpen: () => {
                const btnDni = document.getElementById('btn-dni');
                btnDni.addEventListener('click', async () => {
                    const dni = document.getElementById('swal-dni').value;
                    if (dni.length !== 8) return MySwal.showValidationMessage('El DNI debe tener 8 números');

                    btnDni.innerText = '...';
                    try {
                        const res = await inventoryApi.get(`/clients/dni/${dni}`);
                        document.getElementById('swal-fullname').value = res.data.full_name;
                    } catch (e) {
                        MySwal.showValidationMessage('DNI no encontrado en RENIEC');
                    } finally {
                        btnDni.innerText = 'Consultar';
                    }
                });
            },
            preConfirm: () => {
                const dni = document.getElementById('swal-dni').value;
                const full_name = document.getElementById('swal-fullname').value;
                const email = document.getElementById('swal-email').value;

                if (!dni || !full_name || !email) {
                    MySwal.showValidationMessage('DNI, Nombre y Email son obligatorios');
                    return false;
                }
                return { dni, full_name, address: document.getElementById('swal-address').value || null, phone: document.getElementById('swal-phone').value || null, email };
            }
        });

        if (formValues) {
            try {
                const response = await inventoryApi.post('/clients/', formValues);
                setSelectedClient(response.data);
                MySwal.fire('¡Cliente Vinculado!', response.data.full_name, 'success');
            } catch (error) {
                const msg = error.response?.data?.detail || 'Error al guardar';
                MySwal.fire('Error', msg, 'error');
            }
        }
    };

    const handleProcessSale = async () => {
        if (cart.length === 0) return;
        const total = cart.reduce((acc, i) => acc + (i.price * i.quantity), 0);

        const result = await MySwal.fire({
            title: '¿Confirmar Orden?',
            html: `<b>Cliente:</b> ${selectedClient.full_name}<br><b>Total:</b> $${total.toFixed(2)}`,
            icon: 'question',
            showCancelButton: true,
            confirmButtonText: 'Sí, vender',
            confirmButtonColor: '#16a34a'
        });

        if (result.isConfirmed) {
            try {
                const saleData = {
                    client_id: selectedClient.id,
                    payment_method_id: selectedPaymentMethod,
                    items: cart.map(item => ({ product_id: item.product_id, quantity: item.quantity, price: item.price }))
                };

                const response = await inventoryApi.post('/create_order/', saleData);

                if (response.status === 201 || response.status === 200) {
                    await MySwal.fire({
                        icon: 'success',
                        title: 'Venta Exitosa',
                        text: selectedClient.id !== 2 ? `Generando nota para ${selectedClient.full_name}` : 'Stock actualizado',
                        confirmButtonText: 'Aceptar'
                    });

                    setCart([]);
                    setSelectedClient({ id: 2, full_name: 'Venta Mostrador' });
                    setDniSearch('');
                    fetchInitialData(); // Al refrescar, las métricas del dashboard se recalculan solas
                }
            } catch (error) {
                MySwal.fire('Error', error.response?.data?.detail || 'No se pudo completar', 'error');
            }
        }
    };

    const addToCart = (product) => {
        setCart(prev => {
            const exists = prev.find(i => i.product_id === product.id);
            if (exists) {
                if (exists.quantity >= product.stock) return prev;
                return prev.map(i => i.product_id === product.id ? { ...i, quantity: i.quantity + 1 } : i);
            }
            if (product.stock <= 0) return prev;
            return [...prev, { product_id: product.id, name_product: product.name_product, price: product.price, quantity: 1 }];
        });
    };

    const filtered = products.filter(p => p.name_product.toLowerCase().includes(searchTerm.toLowerCase()));

    return (
        <div className="p-6 bg-slate-50/50 min-h-screen space-y-6 font-sans">
            
            {/* ================= SECCIÓN KPI ADMIN DASHBOARD PREMIUM ================= */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                
                {/* CARD 1: VENTAS DEL DÍA */}
                <div className="bg-white p-5 rounded-2xl border border-slate-200/60 shadow-sm flex items-center justify-between group hover:border-emerald-400 transition-all duration-200">
                    <div className="space-y-1">
                        <span className="text-[11px] font-bold text-slate-400 uppercase tracking-widest block">Ventas del Día</span>
                        <span className="text-2xl font-black text-slate-800 tracking-tight">$ {metrics.totalSalesToday.toFixed(2)}</span>
                    </div>
                    <div className="p-3 rounded-xl bg-emerald-50 text-emerald-600 transition-colors duration-200 group-hover:bg-emerald-600 group-hover:text-white">
                        <DollarSign size={22} />
                    </div>
                </div>

                {/* CARD 2: ÓRDENES DEL DÍA */}
                <div className="bg-white p-5 rounded-2xl border border-slate-200/60 shadow-sm flex items-center justify-between group hover:border-blue-500 transition-all duration-200">
                    <div className="space-y-1">
                        <span className="text-[11px] font-bold text-slate-400 uppercase tracking-widest block">Órdenes Realizadas</span>
                        <span className="text-2xl font-black text-slate-800 tracking-tight">{metrics.totalOrdersToday} u.</span>
                    </div>
                    <div className="p-3 rounded-xl bg-blue-50 text-blue-600 transition-colors duration-200 group-hover:bg-blue-500 group-hover:text-white">
                        <Receipt size={22} />
                    </div>
                </div>

                {/* CARD 3: TICKET PROMEDIO */}
                <div className="bg-white p-5 rounded-2xl border border-slate-200/60 shadow-sm flex items-center justify-between group hover:border-indigo-500 transition-all duration-200">
                    <div className="space-y-1">
                        <span className="text-[11px] font-bold text-slate-400 uppercase tracking-widest block">Ticket Promedio</span>
                        <span className="text-2xl font-black text-slate-800 tracking-tight">$ {metrics.averageTicket.toFixed(2)}</span>
                    </div>
                    <div className="p-3 rounded-xl bg-indigo-50 text-indigo-600 transition-colors duration-200 group-hover:bg-indigo-500 group-hover:text-white">
                        <TrendingUp size={22} />
                    </div>
                </div>

                {/* CARD 4: CRÍTICO DE STOCK */}
                <div className={`p-5 rounded-2xl border shadow-sm flex items-center justify-between group transition-all duration-200 ${metrics.lowStockCount > 0 ? 'bg-amber-50/40 border-amber-200/70 hover:border-amber-500' : 'bg-white border-slate-200/60 hover:border-slate-400'}`}>
                    <div className="space-y-1">
                        <span className="text-[11px] font-bold text-slate-400 uppercase tracking-widest block">Bajo Inventario</span>
                        <span className={`text-2xl font-black tracking-tight ${metrics.lowStockCount > 0 ? 'text-amber-700' : 'text-slate-800'}`}>
                            {metrics.lowStockCount} {metrics.lowStockCount === 1 ? 'Producto' : 'Productos'}
                        </span>
                    </div>
                    <div className={`p-3 rounded-xl transition-colors duration-200 ${metrics.lowStockCount > 0 ? 'bg-amber-100 text-amber-700 group-hover:bg-amber-600 group-hover:text-white' : 'bg-slate-50 text-slate-500 group-hover:bg-slate-800 group-hover:text-white'}`}>
                        <AlertCircle size={22} className={metrics.lowStockCount > 0 ? 'animate-pulse' : ''} />
                    </div>
                </div>
            </div>

            {/* ================= CONTENEDOR PRINCIPAL MODULAR ================= */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 items-start">

                {/* PANEL IZQUIERDO: PRODUCTOS */}
                <div className="lg:col-span-2 space-y-4">
                    <div className="bg-white p-4 rounded-2xl shadow-sm border border-slate-200/60">
                        <div className="relative">
                            <Search className="absolute left-3.5 top-3.5 text-slate-400" size={18} />
                            <input
                                className="w-full pl-11 pr-4 py-2.5 rounded-xl border border-slate-200 bg-slate-50/50 font-medium text-sm focus:bg-white focus:border-blue-500 focus:ring-4 focus:ring-blue-500/10 outline-none transition-all duration-200"
                                placeholder="Buscar producto por nombre..."
                                value={searchTerm}
                                onChange={(e) => setSearchTerm(e.target.value)}
                            />
                        </div>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-4">
                        {filtered.map(p => {
                            const isOutOfStock = p.stock <= 0;
                            const isLowStock = p.stock > 0 && p.stock <= 5;

                            return (
                                <div
                                    key={p.id}
                                    onClick={() => !isOutOfStock && addToCart(p)}
                                    className={`
                                        relative flex flex-col justify-between p-4 bg-white 
                                        rounded-2xl border transition-all duration-200 select-none
                                        ${isOutOfStock
                                            ? 'border-slate-100 bg-slate-50/60 opacity-65 cursor-not-allowed'
                                            : 'border-slate-200/80 cursor-pointer hover:border-slate-400 hover:shadow-[0_8px_20px_-12px_rgba(15,23,42,0.08)] hover:-translate-y-0.5 active:scale-[0.99]'
                                        }
                                        group
                                    `}
                                >
                                    <div className="space-y-2">
                                        <div className="flex items-start justify-between gap-2">
                                            <h3 className="font-semibold text-slate-800 leading-snug tracking-tight text-[15px] max-w-[75%] group-hover:text-blue-600 transition-colors duration-150">
                                                {p.name_product}
                                            </h3>

                                            {isOutOfStock ? (
                                                <span className="inline-flex items-center px-2 py-0.5 rounded-full bg-slate-100 text-slate-600 border border-slate-200 text-[10px] font-bold tracking-wide uppercase whitespace-nowrap">
                                                    Agotado
                                                </span>
                                            ) : isLowStock ? (
                                                <span className="inline-flex items-center px-2 py-0.5 rounded-full bg-amber-50 text-amber-700 border border-amber-200 text-[10px] font-bold tracking-wide uppercase whitespace-nowrap animate-pulse">
                                                    {p.stock} disp.
                                                </span>
                                            ) : (
                                                <span className="inline-flex items-center px-2 py-0.5 rounded-full bg-slate-50 text-slate-400 border border-slate-100 text-[10px] font-medium whitespace-nowrap">
                                                    Stock: {p.stock}
                                                </span>
                                            )}
                                        </div>
                                    </div>

                                    <div className="flex items-end justify-between mt-5">
                                        <div className="space-y-0.5">
                                            <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest block">Precio</span>
                                            <span className="text-lg font-black text-slate-900 tracking-tight">$ {p.price.toFixed(2)}</span>
                                        </div>
                                        <div className={`p-2 rounded-xl transition-all duration-150 ${isOutOfStock ? 'bg-slate-200 text-slate-400' : 'bg-slate-50 text-slate-700 border border-slate-200 group-hover:bg-blue-600 group-hover:text-white group-hover:border-blue-600 group-hover:shadow-md group-hover:shadow-blue-600/10'}`}>
                                            <Plus size={16} className="transition-transform duration-200 group-hover:rotate-90" />
                                        </div>
                                    </div>
                                </div>
                            );
                        })}
                    </div>
                </div>

                {/* PANEL DERECHO: DETALLE DE COMPRA */}
                <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-200/60 sticky top-6">
                    <h2 className="text-xl font-bold text-slate-800 flex items-center gap-2 mb-5">
                        <ShoppingCart className="text-blue-600" size={22} /> Resumen de Venta
                    </h2>

                    <div className="space-y-1.5 mb-4">
                        <label className="text-[10px] text-slate-400 font-bold uppercase tracking-wider block">Buscar Cliente por DNI</label>
                        <div className="flex gap-2">
                            <input
                                type="text"
                                maxLength="8"
                                placeholder="Digita DNI de 8 números..."
                                className="flex-grow px-3.5 py-2.5 border border-slate-200 rounded-xl text-sm font-medium bg-slate-50/50 outline-none focus:bg-white focus:border-blue-600 focus:ring-4 focus:ring-blue-600/10 transition-all duration-150"
                                value={dniSearch}
                                onChange={handleDniChange}
                            />
                            <button
                                type="button"
                                onClick={handleRegisterNewClient}
                                className="bg-blue-50 hover:bg-blue-100 text-blue-600 p-2.5 rounded-xl transition-all duration-150 border border-blue-100 flex items-center justify-center active:scale-95"
                                title="Registrar Nuevo Cliente con RENIEC"
                            >
                                <UserPlus size={18} />
                            </button>
                        </div>
                    </div>

                    <div className={`p-3.5 rounded-xl mb-6 border transition-all ${selectedClient.id === 2 ? 'bg-slate-50/70 border-slate-200/80' : 'bg-emerald-50/60 border-emerald-100'}`}>
                        <p className="text-[10px] text-slate-400 font-bold uppercase tracking-wider">Cliente de la Orden</p>
                        <p className={`text-[14px] font-black mt-0.5 ${selectedClient.id === 2 ? 'text-slate-700' : 'text-emerald-700'}`}>
                            {selectedClient.full_name}
                        </p>
                    </div>

                    <div className="space-y-3 mb-6 max-h-52 overflow-y-auto pr-2 custom-scrollbar">
                        {cart.length === 0 ? (
                            <div className="text-center py-8 text-slate-400 text-sm font-medium">El carrito está vacío</div>
                        ) : (
                            cart.map(item => (
                                <div key={item.product_id} className="flex justify-between items-center text-sm border-b border-slate-100 pb-2.5 group">
                                    <div className="max-w-[65%]">
                                        <p className="font-semibold text-slate-800 truncate">{item.name_product}</p>
                                        <span className="text-xs text-slate-400 font-medium">Cant: {item.quantity} × ${item.price.toFixed(2)}</span>
                                    </div>
                                    <div className="flex items-center gap-3">
                                        <span className="font-bold text-slate-900">$ {(item.price * item.quantity).toFixed(2)}</span>
                                        <X size={15} className="text-slate-300 hover:text-red-500 cursor-pointer transition-colors" onClick={() => setCart(cart.filter(i => i.product_id !== item.product_id))} />
                                    </div>
                                </div>
                            ))
                        )}
                    </div>

                    <div className="border-t border-slate-100 pt-4 space-y-4">
                        <div className="flex justify-between items-center">
                            <span className="text-slate-400 text-sm font-medium">Total Neto:</span>
                            <span className="text-2xl font-black text-blue-700 tracking-tight">$ {cart.reduce((acc, i) => acc + (i.price * i.quantity), 0).toFixed(2)}</span>
                        </div>

                        <div className="space-y-1">
                            <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Método de Pago</label>
                            <select 
                                className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm font-semibold text-slate-800 outline-none focus:bg-white focus:border-blue-600 focus:ring-4 focus:ring-blue-600/10 transition-all duration-150" 
                                value={selectedPaymentMethod} 
                                onChange={e => setSelectedPaymentMethod(Number(e.target.value))}
                            >
                                {paymentMethods.map(m => <option key={m.id} value={m.id}>{m.name_payment_method}</option>)}
                            </select>
                        </div>

                        <button
                            onClick={handleProcessSale}
                            disabled={cart.length === 0}
                            className={`w-full py-3.5 rounded-xl font-bold flex items-center justify-center gap-2 transition-all duration-150 shadow-md ${cart.length === 0 ? 'bg-slate-100 text-slate-400 shadow-none cursor-not-allowed' : 'bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-700 hover:to-teal-700 text-white shadow-emerald-600/10 active:scale-[0.98]'}`}
                        >
                            <CheckCircle size={18} /> Completar Transacción
                        </button>
                    </div>
                </div>

            </div>
        </div>
    );
};

export default Sales;