import React from 'react';
import { Link, Outlet } from 'react-router-dom';
import './MainLayout.css'; // 👈 Importamos su propio CSS
import { LayoutDashboard, Package, ShoppingCart } from 'lucide-react';



const MainLayout = ({ children }) => {
    return (
        <div className="layout-wrapper">
            <aside className="sidebar-container">
                <div className="sidebar-title">SHOP PRO</div>

                <nav className="flex flex-col gap-4">

                    <Link to="/dashboard" className="flex items-center gap-3 text-blue-500 font-bold cursor-pointer hover:bg-gray-50 rounded-md px-3 py-2">
                        <LayoutDashboard size={20} />
                        <span>Dashboard</span>
                    </Link>
                    <Link to="/inventario" className="flex items-center gap-3 text-blue-500 font-bold cursor-pointer hover:bg-gray-50 rounded-md px-3 py-2">
                        <Package size={20} />
                        <span>Inventario</span>
                    </Link>
                    <Link to="/ventas" className="flex items-center gap-3 text-blue-500 font-bold cursor-pointer hover:bg-gray-50 rounded-md px-3 py-2">
                        <ShoppingCart size={20} />
                        <span>Ventas</span>
                    </Link>
                    <Link to="/detalle" className="flex items-center gap-3 text-blue-500 font-bold cursor-pointer hover:bg-gray-50 rounded-md px-3 py-2">
                        <ShoppingCart size={20} />
                        <span>Ordenes</span>
                    </Link>
                    <Link to="/cierre" className="flex items-center gap-3 text-blue-500 font-bold cursor-pointer hover:bg-gray-50 rounded-md px-3 py-2">
                        <ShoppingCart size={20} />
                        <span>Cierre Caja</span>
                    </Link>

                </nav>
            </aside>

            <main className="main-content">
                {children}
                <Outlet />
            </main>
        </div>
    );
};

export default MainLayout;