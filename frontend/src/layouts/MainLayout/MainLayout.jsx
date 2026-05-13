import React, { useState, useEffect } from 'react';
import { Link, Outlet, useNavigate } from 'react-router-dom';
import { jwtDecode } from 'jwt-decode'; // Importamos el decodificador
import './MainLayout.css';
import { LayoutDashboard, Package, ShoppingCart, LogOut, ClipboardList, Wallet } from 'lucide-react'; 
import Swal from 'sweetalert2';

const MainLayout = () => {
    const navigate = useNavigate();
    const [userRole, setUserRole] = useState(null);

    useEffect(() => {
        const token = localStorage.getItem('token');
        if (token) {
            try {
                const decoded = jwtDecode(token);
                // Extraemos el rol. Asegúrate de que tu backend use la clave 'role'
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
            confirmButtonColor: '#3085d6',
            cancelButtonColor: '#d33',
            confirmButtonText: 'Sí, salir',
            cancelButtonText: 'Cancelar'
        }).then((result) => {
            if (result.isConfirmed) {
                localStorage.removeItem('token');
                navigate('/login');
            }
        });
    };

    return (
        <div className="layout-wrapper">
            <aside className="sidebar-container flex flex-col h-screen">
                <div className="sidebar-title">SHOP PRO</div>

                <nav className="flex flex-col gap-4 flex-grow px-2">
                    {/* Dashboard: Solo Admin */}
                    {userRole === 'admin' && (
                        <Link to="/" className="flex items-center gap-3 text-blue-500 font-bold cursor-pointer hover:bg-gray-50 rounded-md px-3 py-2">
                            <LayoutDashboard size={20} />
                            <span>Dashboard</span>
                        </Link>
                    )}

                    {/* Inventario: Admin y Vendedor (Visualización) */}
                    {(userRole === 'admin' || userRole === 'vendedor') && (
                        <Link to="/inventario" className="flex items-center gap-3 text-blue-500 font-bold cursor-pointer hover:bg-gray-50 rounded-md px-3 py-2">
                            <Package size={20} />
                            <span>Inventario</span>
                        </Link>
                    )}

                    {/* Ventas: Admin y Vendedor */}
                    {(userRole === 'admin' || userRole === 'vendedor') && (
                        <Link to="/ventas" className="flex items-center gap-3 text-blue-500 font-bold cursor-pointer hover:bg-gray-50 rounded-md px-3 py-2">
                            <ShoppingCart size={20} />
                            <span>Ventas</span>
                        </Link>
                    )}

                    {/* Órdenes: Admin y Vendedor */}
                    {(userRole === 'admin' || userRole === 'vendedor') && (
                        <Link to="/detalle" className="flex items-center gap-3 text-blue-500 font-bold cursor-pointer hover:bg-gray-50 rounded-md px-3 py-2">
                            <ClipboardList size={20} />
                            <span>Ordenes</span>
                        </Link>
                    )}

                    {/* Cierre de Caja: Admin y Vendedor */}
                    {(userRole === 'admin' || userRole === 'vendedor') && (
                        <Link to="/cierre" className="flex items-center gap-3 text-blue-500 font-bold cursor-pointer hover:bg-gray-50 rounded-md px-3 py-2">
                            <Wallet size={20} />
                            <span>Cierre Caja</span>
                        </Link>
                    )}
                </nav>

                <div className="mt-auto p-4">
                    <button 
                        onClick={handleLogout}
                        className="w-full flex items-center gap-3 text-red-500 font-bold cursor-pointer hover:bg-red-50 rounded-md px-3 py-2 transition-colors"
                    >
                        <LogOut size={20} />
                        <span>Cerrar Sesión</span>
                    </button>
                </div>
            </aside>

            <main className="main-content">
                <Outlet />
            </main>
        </div>
    );
};

export default MainLayout;