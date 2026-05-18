import React, { useState, useEffect } from 'react';
import { Link, Outlet, useNavigate, useLocation } from 'react-router-dom';
import { jwtDecode } from 'jwt-decode';
import { LayoutDashboard, Package, ShoppingCart, LogOut, ClipboardList, Wallet, Sparkles, Shield } from 'lucide-react'; 
import Swal from 'sweetalert2';

const MainLayout = () => {
    const navigate = useNavigate();
    const location = useLocation();
    const [userRole, setUserRole] = useState(null);

    useEffect(() => {
        const token = localStorage.getItem('token');
        if (token) {
            try {
                const decoded = jwtDecode(token);
                setUserRole(decoded.role); 
            } catch (error) {
                console.error("Error decodificando token:", error);
            }
        }
    }, []);

    const handleLogout = () => {
        Swal.fire({
            title: '¿Cerrar sesión?',
            text: "Tendrás que ingresar tus credenciales nuevamente.",
            icon: 'warning',
            showCancelButton: true,
            confirmButtonColor: '#2563eb',
            cancelButtonColor: '#6b7280',
            confirmButtonText: 'Sí, salir',
            cancelButtonText: 'Cancelar',
            customClass: { popup: '!rounded-2xl' }
        }).then((result) => {
            if (result.isConfirmed) {
                localStorage.removeItem('token');
                navigate('/login');
            }
        });
    };

    // Función de diseño senior para renderizar enlaces dinámicos con estados microanimados
    const renderNavLink = (to, icon, label) => {
        const isActive = location.pathname === to;
        
        return (
            <Link 
                to={to} 
                className={`
                    relative flex items-center gap-3 px-4 py-2.5 rounded-xl font-semibold text-sm 
                    transition-all duration-200 group select-none outline-none
                    ${isActive 
                        ? 'bg-blue-600 text-white shadow-md shadow-blue-600/10' 
                        : 'text-slate-500 hover:text-slate-900 hover:bg-slate-100/80 active:scale-[0.98]'
                    }
                `}
            >
                {/* Indicador Lateral Flotante Estilo Premium */}
                {isActive && (
                    <div className="absolute left-0 top-1/4 w-1 h-1/2 bg-white rounded-r-full" />
                )}

                {/* Icono con Microinteracción */}
                <div className={`
                    transition-transform duration-200 
                    ${isActive ? 'text-white' : 'text-slate-400 group-hover:text-slate-700 group-hover:scale-105'}
                `}>
                    {icon}
                </div>

                <span>{label}</span>
            </Link>
        );
    };

    return (
        <div className="flex bg-slate-50 min-h-screen antialiased">
            
            {/* COMPONENTE SIDEBAR PREMIUM */}
            <aside className="w-64 bg-white border-r border-slate-200/80 flex flex-col h-screen sticky top-0 shrink-0 shadow-[1px_0_10px_rgba(15,23,42,0.01)]">
                
                {/* Branding / Header con Jerarquía */}
                <div className="p-6 border-b border-slate-100 flex items-center justify-between">
                    <div className="flex items-center gap-2">
                        <div className="bg-gradient-to-tr from-blue-600 to-indigo-600 p-1.5 rounded-lg text-white shadow-sm">
                            <Sparkles size={16} className="animate-pulse" />
                        </div>
                        <span className="font-black text-slate-800 tracking-tight text-lg">LIBRERIA-BAZAR</span>
                    </div>
                    {userRole && (
                        <span className="text-[9px] font-bold uppercase tracking-widest px-2 py-0.5 rounded-md bg-slate-100 text-slate-500 border border-slate-200/50">
                            {userRole}
                        </span>
                    )}
                </div>

                {/* Navegación Modular */}
                <nav className="flex flex-col gap-1.5 flex-grow px-3 py-6 overflow-y-auto">
                    {userRole === 'admin' && renderNavLink('/', <LayoutDashboard size={18} />, 'Dashboard')}
                    
                    {(userRole === 'admin' || userRole === 'vendedor') && (
                        <>
                            {renderNavLink('/inventario', <Package size={18} />, 'Inventario')}
                            {renderNavLink('/ventas', <ShoppingCart size={18} />, 'Ventas')}
                            {renderNavLink('/detalle', <ClipboardList size={18} />, 'Órdenes')}
                            {renderNavLink('/cierre', <Wallet size={18} />, 'Cierre de Caja')}
                        </>
                    )}
                </nav>

                {/* Footer de la Barra Lateral con Perfil / Cierre */}
                <div className="p-4 border-t border-slate-100 bg-slate-50/50">
                    <button 
                        onClick={handleLogout}
                        className="w-full flex items-center gap-3 text-slate-500 hover:text-red-600 font-semibold text-sm rounded-xl px-4 py-2.5 hover:bg-red-50 transition-all duration-150 active:scale-[0.98] group outline-none"
                    >
                        <LogOut size={18} className="text-slate-400 group-hover:text-red-500 transition-colors" />
                        <span>Cerrar Sesión</span>
                    </button>
                </div>
            </aside>

            {/* CONTENEDOR DE CONTENIDO PRINCIPAL */}
            <main className="flex-grow overflow-x-hidden">
                <div className="p-1 max-w-[1600px] mx-auto">
                    <Outlet />
                </div>
            </main>
        </div>
    );
};

export default MainLayout;