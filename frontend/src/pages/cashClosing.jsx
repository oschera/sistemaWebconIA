import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import { 
    Coins, Receipt, Scale, CreditCard, ArrowUpRight, ArrowDownRight, 
    SlidersHorizontal, Search, FileText, CheckCircle2, AlertTriangle, 
    XCircle, RefreshCw, User, ShieldAlert, Moon, Sun, Filter, HelpCircle
} from 'lucide-react';
import Swal from 'sweetalert2';
import withReactContent from 'sweetalert2-react-content';
import inventoryApi from '../api/inventoryApi';

const MySwal = withReactContent(Swal);

// ================= VARIANTES DE ANIMACIÓN CONFIGURADAS =================
const containerVariants = {
    hidden: { opacity: 0 },
    visible: {
        opacity: 1,
        transition: { staggerChildren: 0.04, delayChildren: 0.05 }
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

const CashClosing = () => {
    // --- ESTADOS DE MÓDULO ---
    const [history, setHistory] = useState([]);
    const [loading, setLoading] = useState(true);
    const [darkMode, setDarkMode] = useState(false);
    
    // --- FILTROS DE HISTORIAL ---
    const [filters, setFilters] = useState({
        user: '',
        status: 'Todos',
        date: ''
    });

    // --- FORMULARIO DE ARQUEO EN TIEMPO REAL ---
    const [cashCalculated, setCashCalculated] = useState(1420.50); // Dinámico del sistema (Ventas efectivo + fondo)
    const [cashCounted, setCashCounted] = useState('');
    const [observations, setObservations] = useState('');

    // --- DATOS MOCK DE MÉTODOS Y GRÁFICOS (Librería & Bazar) ---
    const [metrics, setMetrics] = useState({
        totalSales: 2845.20,
        transactionsCount: 142,
        difference: 0,
        topMethod: 'Transferencia / QR'
    });

    const chartData = [
        { name: 'Lun', efectivo: 820, digital: 1100 },
        { name: 'Mar', efectivo: 940, digital: 1300 },
        { name: 'Mié', efectivo: 1100, digital: 1250 },
        { name: 'Jue', efectivo: 780, digital: 1400 },
        { name: 'Vie', efectivo: 1300, digital: 1900 },
        { name: 'Sáb', efectivo: 1520, digital: 2200 },
        { name: 'Dom', efectivo: 600, digital: 950 },
    ];

    useEffect(() => {
        // Simulación de carga de datos desde API
        setTimeout(() => {
            setHistory([
                { id: 1042, date: '2026-05-17T14:30:00', user: 'Carlos Mendoza', branch: 'Central - Bazar', expected: 1850.00, actual: 1850.00, diff: 0, status: 'Cuadrado' },
                { id: 1041, date: '2026-05-16T21:00:00', user: 'Ana Paula Silva', branch: 'Central - Bazar', expected: 2420.30, actual: 2415.30, diff: -5.00, status: 'Faltante' },
                { id: 1040, date: '2026-05-15T21:15:00', user: 'Carlos Mendoza', branch: 'Sucursal Norte - Libros', expected: 1210.00, actual: 1218.50, diff: 8.50, status: 'Sobrante' },
                { id: 1039, date: '2026-05-14T21:00:00', user: 'Admin General', branch: 'Central - Bazar', expected: 3150.00, actual: 3150.00, diff: 0, status: 'Cuadrado' },
            ]);
            setLoading(false);
        }, 800);
    }, []);

    // --- CÁLCULO EN TIEMPO REAL ---
    const parsedCounted = parseFloat(cashCounted) || 0;
    const difference = parsedCounted - cashCalculated;

    const getDiffStatus = () => {
        if (cashCounted === '') return { color: 'text-slate-400 dark:text-slate-500', bg: 'bg-slate-50 dark:bg-slate-800/40', text: 'Esperando arqueo...', icon: <Scale size={16} /> };
        if (difference === 0) return { color: 'text-emerald-600 dark:text-emerald-400', bg: 'bg-emerald-50 dark:bg-emerald-950/30 border border-emerald-500/20', text: 'Caja Cuadrada Perfecta', icon: <CheckCircle2 size={16} /> };
        if (difference < 0) return { color: 'text-rose-600 dark:text-rose-400', bg: 'bg-rose-50 dark:bg-rose-950/30 border border-rose-500/20', text: `Faltante de $${Math.abs(difference).toFixed(2)}`, icon: <ShieldAlert size={16} /> };
        return { color: 'text-indigo-600 dark:text-indigo-400', bg: 'bg-indigo-50 dark:bg-indigo-950/30 border border-indigo-500/20', text: `Sobrante de $${difference.toFixed(2)}`, icon: <Sparkles size={16} /> };
    };

    const diffStatus = getDiffStatus();

    // --- ACCIONES TRIBUTARIAS ---
    const handleClearFilters = () => {
        setFilters({ user: '', status: 'Todos', date: '' });
    };

    const handleProcessClosing = async (e) => {
        e.preventDefault();
        if (cashCounted === '') {
            return MySwal.fire({ title: 'Campo requerido', text: 'Por favor, ingresa el monto total contado en caja física.', icon: 'warning', customClass: { popup: '!rounded-2xl' } });
        }

        const result = await MySwal.fire({
            title: '¿Proceder con el Cierre de Turno?',
            html: `<div class="text-sm space-y-1 text-left p-2 bg-slate-50 rounded-xl">
                    <p><b>Efectivo esperado:</b> $${cashCalculated.toFixed(2)}</p>
                    <p><b>Efectivo declarado:</b> $${parsedCounted.toFixed(2)}</p>
                    <p><b>Resultado:</b> <span class="font-bold">${diffStatus.text}</span></p>
                   </div>`,
            icon: 'question',
            showCancelButton: true,
            confirmButtonColor: '#2563eb',
            cancelButtonColor: '#6b7280',
            confirmButtonText: 'Sí, cerrar caja',
            customClass: { popup: '!rounded-2xl' }
        });

        if (result.isConfirmed) {
            MySwal.fire({
                title: 'Consolidando Turno',
                text: 'Procesando auditoría y reiniciando saldo base...',
                icon: 'success',
                timer: 2000,
                showConfirmButton: false,
                customClass: { popup: '!rounded-2xl' }
            });
            
            // Simular inserción en historial
            const newClosing = {
                id: Math.floor(Math.random() * 1000) + 1100,
                date: new Date().toISOString(),
                user: 'Supervisor Activo',
                branch: 'Central - Bazar',
                expected: cashCalculated,
                actual: parsedCounted,
                diff: difference,
                status: difference === 0 ? 'Cuadrado' : difference < 0 ? 'Faltante' : 'Sobrante'
            };
            setHistory([newClosing, ...history]);
            setCashCounted('');
            setObservations('');
        }
    };

    const exportPDF = (item) => {
        MySwal.fire({
            title: 'Exportando Voucher',
            text: `Generando comprobante de auditoría de arqueo #${item.id}`,
            icon: 'info',
            toast: true,
            position: 'top-end',
            timer: 2500,
            showConfirmButton: false
        });
    };

    // --- FILTRADO DE COMPROBANTES ---
    const filteredHistory = history.filter(item => {
        const matchesUser = item.user.toLowerCase().includes(filters.user.toLowerCase());
        const matchesStatus = filters.status === 'Todos' || item.status === filters.status;
        const matchesDate = !filters.date || item.date.startsWith(filters.date);
        return matchesUser && matchesStatus && matchesDate;
    });

    return (
        <div className={`transition-colors duration-300 ${darkMode ? 'dark bg-slate-950 text-slate-100' : 'bg-slate-50/50 text-slate-600'} min-h-screen p-6 font-sans antialiased space-y-6`}>
            
            {/* ================= TOPBAR ESTRUCTURAL SAAS ================= */}
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 border-b border-slate-200/60 dark:border-slate-800 pb-5">
                <div className="space-y-1">
                    <div className="flex items-center gap-2">
                        <span className="text-xs font-bold uppercase tracking-wider bg-indigo-50 dark:bg-indigo-950/50 text-indigo-600 dark:text-indigo-400 px-2.5 py-1 rounded-md border border-indigo-100 dark:border-indigo-900/30">Módulo de Auditoría</span>
                        <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
                        <span className="text-xs text-slate-400 font-semibold">Turno de Tarde</span>
                    </div>
                    <h1 className="text-2xl font-black text-slate-900 dark:text-white tracking-tight">Cierre de Caja y Arqueo</h1>
                </div>

                <div className="flex items-center gap-3">
                    {/* Dark Mode Toggle Switch */}
                    <button 
                        onClick={() => setDarkMode(!darkMode)}
                        className="p-2.5 rounded-xl bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 shadow-sm text-slate-400 hover:text-slate-900 dark:hover:text-white transition-all outline-none"
                    >
                        {darkMode ? <Sun size={18} /> : <Moon size={18} />}
                    </button>
                    <button className="flex items-center gap-2 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white font-bold px-4 py-2.5 rounded-xl shadow-md shadow-blue-600/10 transition-all text-xs uppercase tracking-wider outline-none active:scale-[0.98]">
                        <Coins size={14} /> Retirar Efectivo parcial
                    </button>
                </div>
            </div>

            {/* ================= SECCIÓN 1: KPI CARDS STRIPE STYLE ================= */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                {/* CARD 1: VENTAS DEL DÍA */}
                <div className="bg-white dark:bg-slate-900 p-5 rounded-2xl border border-slate-200/80 dark:border-slate-800 shadow-sm flex items-center justify-between group hover:border-slate-400 dark:hover:border-slate-700 transition-all duration-200 cursor-pointer select-none">
                    <div className="space-y-1">
                        <span className="text-[10px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-widest block">Caja Teórica Total</span>
                        <span className="text-2xl font-black text-slate-800 dark:text-white tracking-tight">$ {metrics.totalSales.toLocaleString('en-US', { minimumFractionDigits: 2 })}</span>
                        <span className="text-[11px] text-emerald-500 font-semibold flex items-center gap-0.5">
                            <ArrowUpRight size={12}/> +8.4% <span className="text-slate-400 dark:text-slate-500 font-medium">vs proyección</span>
                        </span>
                    </div>
                    <div className="p-3 rounded-xl bg-slate-50 dark:bg-slate-800 text-slate-400 dark:text-slate-500 group-hover:bg-slate-900 dark:group-hover:bg-white dark:group-hover:text-slate-900 group-hover:text-white transition-colors duration-150">
                        <Receipt size={20} />
                    </div>
                </div>

                {/* CARD 2: TOTAL TRANSACCIONES */}
                <div className="bg-white dark:bg-slate-900 p-5 rounded-2xl border border-slate-200/80 dark:border-slate-800 shadow-sm flex items-center justify-between group hover:border-slate-400 dark:hover:border-slate-700 transition-all duration-200 cursor-pointer select-none">
                    <div className="space-y-1">
                        <span className="text-[10px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-widest block">Transacciones Emitidas</span>
                        <span className="text-2xl font-black text-slate-800 dark:text-white tracking-tight">{metrics.transactionsCount} <span className="text-xs font-bold text-slate-400 dark:text-slate-500">tickets</span></span>
                        <span className="text-[11px] text-emerald-500 font-semibold flex items-center gap-0.5">
                            <ArrowUpRight size={12}/> +14 u. <span className="text-slate-400 dark:text-slate-500 font-medium">flujo estable</span>
                        </span>
                    </div>
                    <div className="p-3 rounded-xl bg-slate-50 dark:bg-slate-800 text-slate-400 dark:text-slate-500 group-hover:bg-slate-900 dark:group-hover:bg-white dark:group-hover:text-slate-900 group-hover:text-white transition-colors duration-150">
                        <Coins size={20} />
                    </div>
                </div>

                {/* CARD 3: DIFERENCIA DE CAJA ACUMULADA */}
                <div className="bg-white dark:bg-slate-900 p-5 rounded-2xl border border-slate-200/80 dark:border-slate-800 shadow-sm flex items-center justify-between group hover:border-slate-400 dark:hover:border-slate-700 transition-all duration-200 cursor-pointer select-none">
                    <div className="space-y-1">
                        <span className="text-[10px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-widest block">Balance Descuadres</span>
                        <span className="text-2xl font-black text-slate-800 dark:text-white tracking-tight">$ 0.00</span>
                        <span className="text-[11px] text-slate-400 dark:text-slate-500 font-medium block">Turnos previos en orden</span>
                    </div>
                    <div className="p-3 rounded-xl bg-slate-50 dark:bg-slate-800 text-slate-400 dark:text-slate-500 group-hover:bg-slate-900 dark:group-hover:bg-white dark:group-hover:text-slate-900 group-hover:text-white transition-colors duration-150">
                        <Scale size={20} />
                    </div>
                </div>

                {/* CARD 4: METODO MAS USADO */}
                <div className="bg-white dark:bg-slate-900 p-5 rounded-2xl border border-slate-200/80 dark:border-slate-800 shadow-sm flex items-center justify-between group hover:border-slate-400 dark:hover:border-slate-700 transition-all duration-200 cursor-pointer select-none">
                    <div className="space-y-1">
                        <span className="text-[10px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-widest block">Canal Predominante</span>
                        <span className="text-md font-black text-slate-800 dark:text-white tracking-tight block pt-1.5 truncate max-w-[180px]">{metrics.topMethod}</span>
                        <span className="text-[11px] text-indigo-500 font-semibold block">64% del volumen total</span>
                    </div>
                    <div className="p-3 rounded-xl bg-slate-50 dark:bg-slate-800 text-slate-400 dark:text-slate-500 group-hover:bg-slate-900 dark:group-hover:bg-white dark:group-hover:text-slate-900 group-hover:text-white transition-colors duration-150">
                        <CreditCard size={20} />
                    </div>
                </div>
            </div>

            {/* ================= SECCIÓN 2: GRID COMPUESTO (ARQUEO & GRÁFICO FLUJO) ================= */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 items-stretch">
                
                {/* PANEL FINTECH DE ARQUEO EN TIEMPO REAL */}
                <div className="bg-white dark:bg-slate-900 p-6 rounded-2xl border border-slate-200/80 dark:border-slate-800 shadow-sm flex flex-col justify-between space-y-4">
                    <div className="border-b border-slate-100 dark:border-slate-800 pb-3">
                        <h2 className="text-base font-black text-slate-900 dark:text-white tracking-tight flex items-center gap-2">
                            <Scale className="text-blue-600" size={18} /> Conciliación del Turno Activo
                        </h2>
                        <p className="text-xs text-slate-400 font-medium mt-0.5">Digita el efectivo total contado en caja física.</p>
                    </div>

                    <div className="space-y-3">
                        {/* Monitor base de lectura */}
                        <div className="p-3.5 rounded-xl bg-slate-50/70 dark:bg-slate-800/40 border border-slate-100 dark:border-slate-800 flex justify-between items-center text-sm">
                            <span className="font-semibold text-slate-500 dark:text-slate-400">Efectivo del Sistema (Esperado)</span>
                            <span className="font-mono font-black text-slate-900 dark:text-white text-base">$ {cashCalculated.toFixed(2)}</span>
                        </div>

                        {/* Input Premium de Monto Contado */}
                        <div className="space-y-1.5">
                            <label className="text-[10px] text-slate-400 font-bold uppercase tracking-wider block">Monto Contado Real ($)</label>
                            <div className="relative group">
                                <span className="absolute left-4 top-3 text-slate-400 font-bold text-sm group-focus-within:text-blue-600 transition-colors">$</span>
                                <input
                                    type="number"
                                    step="0.01"
                                    placeholder="0.00"
                                    className="w-full pl-8 pr-4 py-2.5 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-950 font-mono font-bold text-sm text-slate-900 dark:text-white focus:bg-white dark:focus:bg-slate-900 focus:border-blue-500 focus:ring-4 focus:ring-blue-500/10 outline-none transition-all duration-150"
                                    value={cashCounted}
                                    onChange={(e) => setCashCounted(e.target.value)}
                                />
                            </div>
                        </div>

                        {/* Feedback Visual en Tiempo Real */}
                        <AnimatePresence mode="wait">
                            <motion.div 
                                key={difference}
                                initial={{ opacity: 0, y: -4 }}
                                animate={{ opacity: 1, y: 0 }}
                                className={`p-3 rounded-xl flex items-center gap-2.5 text-xs font-bold transition-all ${diffStatus.bg} ${diffStatus.color}`}
                            >
                                {diffStatus.icon}
                                <span>{diffStatus.text}</span>
                            </motion.div>
                        </AnimatePresence>

                        {/* Campo Observaciones */}
                        <div className="space-y-1.5">
                            <label className="text-[10px] text-slate-400 font-bold uppercase tracking-wider block">Bitácora / Observaciones de Novedades</label>
                            <textarea
                                placeholder="Escribe detalles del descuadre, billetes rotos o justificaciones de menudo de librería..."
                                rows="2"
                                className="w-full px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-950 text-xs font-medium focus:bg-white dark:focus:bg-slate-900 focus:border-blue-500 focus:ring-4 focus:ring-blue-500/10 outline-none transition-all resize-none text-slate-700 dark:text-slate-300"
                                value={observations}
                                onChange={(e) => setObservations(e.target.value)}
                            />
                        </div>
                    </div>

                    <motion.button
                        whileHover={{ scale: 1.01 }}
                        whileTap={{ scale: 0.99 }}
                        onClick={handleProcessClosing}
                        className="w-full py-3 rounded-xl font-bold bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white shadow-md shadow-blue-600/10 text-xs uppercase tracking-wider outline-none transition-all mt-2"
                    >
                        Consolidar y Cerrar Turno
                    </motion.button>
                </div>

                {/* GRÁFICO INTEGRADO DE COMPORTAMIENTO FINANCIERO SEMANAL */}
                <div className="lg:col-span-2 bg-white dark:bg-slate-900 p-6 rounded-2xl border border-slate-200/80 dark:border-slate-800 shadow-sm flex flex-col justify-between">
                    <div className="flex justify-between items-start mb-2">
                        <div className="space-y-0.5">
                            <span className="text-[10px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-widest block">Monitoreo Semanal</span>
                            <h3 className="text-sm font-bold text-slate-800 dark:text-white tracking-tight">Comportamiento del Flujo de Caja</h3>
                        </div>
                        <div className="flex gap-4 text-[11px] font-bold">
                            <span className="flex items-center gap-1.5 text-blue-600"><div className="w-2 h-2 rounded-full bg-blue-600"/> Efectivo</span>
                            <span className="flex items-center gap-1.5 text-indigo-500"><div className="w-2 h-2 rounded-full bg-indigo-500"/> Digital / QR</span>
                        </div>
                    </div>
                    
                    <div className="h-48 w-full mt-4">
                        <ResponsiveContainer width="100%" height="100%">
                            <AreaChart data={chartData} margin={{ top: 10, right: 5, left: -25, bottom: 0 }}>
                                <defs>
                                    <linearGradient id="colorEfectivo" x1="0" y1="0" x2="0" y2="1">
                                        <stop offset="5%" stopColor="#2563eb" stopOpacity={0.15}/>
                                        <stop offset="95%" stopColor="#2563eb" stopOpacity={0.00}/>
                                    </linearGradient>
                                    <linearGradient id="colorDigital" x1="0" y1="0" x2="0" y2="1">
                                        <stop offset="5%" stopColor="#6366f1" stopOpacity={0.15}/>
                                        <stop offset="95%" stopColor="#6366f1" stopOpacity={0.00}/>
                                    </linearGradient>
                                </defs>
                                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke={darkMode ? '#1e293b' : '#f1f5f9'} />
                                <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{ fontSize: 11, fill: '#94a3b8', fontWeight: 600 }} />
                                <YAxis axisLine={false} tickLine={false} tick={{ fontSize: 11, fill: '#94a3b8', fontWeight: 600 }} />
                                <Tooltip contentStyle={{ background: '#0f172a', borderRadius: '12px', border: 'none', color: '#fff', fontSize: '12px', fontWeight: 'bold' }} />
                                <Area type="monotone" dataKey="efectivo" stroke="#2563eb" strokeWidth={2.5} fillOpacity={1} fill="url(#colorEfectivo)" />
                                <Area type="monotone" dataKey="digital" stroke="#6366f1" strokeWidth={2.5} fillOpacity={1} fill="url(#colorDigital)" />
                            </AreaChart>
                        </ResponsiveContainer>
                    </div>
                </div>
            </div>

            {/* ================= SECCIÓN 3: FILTROS Y HISTORIAL DE ARQUEOS (NO-CRUD) ================= */}
            <div className="bg-white dark:bg-slate-900 p-5 rounded-2xl border border-slate-200/80 dark:border-slate-800 shadow-[0_2px_8px_-3px_rgba(15,23,42,0.05)] space-y-4">
                <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800 pb-3">
                    <div className="flex items-center gap-2 text-slate-800 dark:text-white font-bold text-sm tracking-tight">
                        <Filter size={15} className="text-slate-400" />
                        <span>Filtros Históricos</span>
                    </div>
                    <button 
                        onClick={handleClearFilters}
                        className="text-xs font-bold text-blue-600 dark:text-blue-400 bg-blue-50 dark:bg-blue-950/40 hover:bg-blue-100 px-3 py-1.5 rounded-lg flex items-center gap-1.5 transition-colors"
                    >
                        <RefreshCw size={12} /> Limpiar Filtros
                    </button>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                    <div className="space-y-1.5">
                        <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">Auditor / Cajero</label>
                        <div className="relative group">
                            <Search className="absolute left-3.5 top-3.5 text-slate-400 group-focus-within:text-blue-600" size={15} />
                            <input
                                type="text"
                                placeholder="Buscar por cajero..."
                                value={filters.user}
                                onChange={(e) => setFilters({ ...filters, user: e.target.value })}
                                className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-950 text-sm font-medium focus:bg-white dark:focus:bg-slate-900 focus:border-blue-500 focus:ring-4 focus:ring-blue-500/10 outline-none transition-all"
                            />
                        </div>
                    </div>

                    <div className="space-y-1.5">
                        <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">Estado del Cierre</label>
                        <select
                            className="w-full px-3 py-2.5 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-950 text-sm font-semibold text-slate-700 dark:text-slate-300 focus:bg-white dark:focus:bg-slate-900 focus:border-blue-500 focus:ring-4 focus:ring-blue-500/10 outline-none transition-all"
                            value={filters.status}
                            onChange={(e) => setFilters({ ...filters, status: e.target.value })}
                        >
                            <option value="Todos">Todos los estados</option>
                            <option value="Cuadrado">Cuadrados Perfectos</option>
                            <option value="Faltante">Faltantes de Caja</option>
                            <option value="Sobrante">Sobrantes / Excedentes</option>
                        </select>
                    </div>

                    <div className="space-y-1.5">
                        <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">Día de Auditoría</label>
                        <input
                            type="date"
                            value={filters.date}
                            onChange={(e) => setFilters({ ...filters, date: e.target.value })}
                            className="w-full px-3 py-2.5 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-950 text-sm font-medium text-slate-700 dark:text-slate-300 focus:bg-white dark:focus:bg-slate-900 focus:border-blue-500 focus:ring-4 focus:ring-blue-500/10 outline-none transition-all"
                        />
                    </div>
                </div>
            </div>

            {/* TABLA DE HISTORIAL DE ARQUEOS PREMIUM */}
            <motion.div 
                variants={containerVariants}
                initial="hidden"
                animate="visible"
                className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200/80 dark:border-slate-800 shadow-sm overflow-hidden"
            >
                <div className="overflow-x-auto">
                    <table className="w-full text-left border-collapse">
                        <thead>
                            <tr className="bg-slate-50/70 dark:bg-slate-800/50 border-b border-slate-200/60 dark:border-slate-800 text-[11px] font-bold text-slate-400 uppercase tracking-wider">
                                <th className="p-4 pl-6">ID Arqueo</th>
                                <th className="p-4">Fecha y Cierre</th>
                                <th className="p-4">Auditor / Cajero</th>
                                <th className="p-4">Sucursal / Punto</th>
                                <th className="p-4 text-right">Efectivo Sistema</th>
                                <th className="p-4 text-right">Contado Real</th>
                                <th className="p-4 text-center">Estado Auditoría</th>
                                <th className="p-4 text-center pr-6">Acciones</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-100 dark:divide-slate-800 text-slate-700 dark:text-slate-300 text-sm font-medium">
                            {filteredHistory.length === 0 ? (
                                <tr>
                                    <td colSpan="8" className="text-center py-12 text-slate-400 italic">
                                        Ninguna planilla de arqueo coincide con los parámetros de búsqueda.
                                    </td>
                                </tr>
                            ) : (
                                filteredHistory.map((item) => (
                                    <motion.tr 
                                        key={item.id}
                                        variants={itemVariants}
                                        whileHover={{ backgroundColor: darkMode ? "rgba(30, 41, 59, 0.4)" : "rgba(248, 250, 252, 0.7)" }}
                                        className="transition-colors group"
                                    >
                                        <td className="p-4 pl-6 font-mono text-xs font-bold text-slate-400 group-hover:text-blue-600 transition-colors">
                                            #{item.id}
                                        </td>
                                        <td className="p-4">
                                            <div className="flex flex-col">
                                                <span className="text-slate-800 dark:text-white font-semibold">{new Date(item.date).toLocaleDateString('es-PE', { day: '2-digit', month: 'short', year: 'numeric' })}</span>
                                                <span className="text-[11px] text-slate-400 dark:text-slate-500 font-medium">{new Date(item.date).toLocaleTimeString()}</span>
                                            </div>
                                        </td>
                                        <td className="p-4">
                                            <div className="flex items-center gap-2">
                                                <div className="w-7 h-7 rounded-full bg-slate-100 dark:bg-slate-800 text-slate-500 dark:text-slate-400 flex items-center justify-center font-bold text-xs">
                                                    {item.user.charAt(0)}
                                                </div>
                                                <span className="font-semibold text-slate-800 dark:text-slate-200">{item.user}</span>
                                            </div>
                                        </td>
                                        <td className="p-4 text-xs font-semibold text-slate-400">{item.branch}</td>
                                        <td className="p-4 text-right font-mono text-slate-500 dark:text-slate-400">$ {item.expected.toFixed(2)}</td>
                                        <td className="p-4 text-right font-mono font-bold text-slate-900 dark:text-white">$ {item.actual.toFixed(2)}</td>
                                        <td className="p-4 text-center">
                                            <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold border ${
                                                item.status === 'Cuadrado' 
                                                    ? 'bg-emerald-50 dark:bg-emerald-950/30 text-emerald-700 dark:text-emerald-400 border-emerald-200/60 dark:border-emerald-900/30' 
                                                    : item.status === 'Faltante'
                                                    ? 'bg-rose-50 dark:bg-rose-950/30 text-rose-700 dark:text-rose-400 border-rose-200/60 dark:border-rose-900/30'
                                                    : 'bg-indigo-50 dark:bg-indigo-950/30 text-indigo-700 dark:text-indigo-400 border-indigo-200/60 dark:border-indigo-900/30'
                                            }`}>
                                                <div className={`w-1.5 h-1.5 rounded-full ${item.status === 'Cuadrado' ? 'bg-emerald-500' : item.status === 'Faltante' ? 'bg-rose-500' : 'bg-indigo-500'}`} />
                                                {item.status}
                                            </span>
                                        </td>
                                        <td className="p-4 text-center pr-6">
                                            <button 
                                                onClick={() => exportPDF(item)}
                                                className="p-2 text-slate-400 hover:text-blue-600 dark:hover:text-blue-400 hover:bg-blue-50 dark:hover:bg-slate-800 rounded-xl transition-all active:scale-95" 
                                                title="Exportar Comprobante de Turno"
                                            >
                                                <FileText size={15} />
                                            </button>
                                        </td>
                                    </motion.tr>
                                ))
                            )}
                        </tbody>
                    </table>
                </div>
            </motion.div>
        </div>
    );
};

export default CashClosing;