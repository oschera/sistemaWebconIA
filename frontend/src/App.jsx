import { useState } from 'react'
import reactLogo from './assets/react.svg'
import viteLogo from './assets/vite.svg'
import heroImg from './assets/hero.png'
import './App.css'
import Dashboard from './pages/dashboard';
import Sales from './pages/sales';
import Inventory from './pages/inventory';
import MainLayout from './layouts/MainLayout/MainLayout';
import Orders from './pages/orders';
import CashClosing from './pages/cashClosing'
import Login from './pages/Login'; // Importamos el Login
import ProtectedRouter from './components/ProtectedRouter'; // Importamos el Guardián
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';

function App() {
  return (
    <Router>
      <Routes>
        {/* Ruta Pública */}
        <Route path="/login" element={<Login />} />

        {/* Rutas Protegidas (Solo accesibles si hay token) */}
        <Route element={<ProtectedRouter />}>
          {/* MainLayout envuelve a todas estas vistas */}
          <Route path="/" element={<MainLayout />}>
            <Route index element={<Dashboard />} />
            <Route path="ventas" element={<Sales />} />
            <Route path="inventario" element={<Inventory />} />
            <Route path="detalle" element={<Orders />} />
            <Route path="cierre" element={<CashClosing />} />
          </Route>
        </Route>

        {/* Captura cualquier ruta que no exista y la manda a la raíz */}
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </Router>
  );
}


export default App;
