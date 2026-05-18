import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { LogIn, User, Lock, Sparkles,ShieldCheck } from 'lucide-react';
import Swal from 'sweetalert2';
import { jwtDecode } from 'jwt-decode'; // - Importación necesaria
import api from '../api/axios';

const Login = () => {
    const [username, setUsername] = useState('');
    const [password, setPassword] = useState('');
    const [loading, setLoading] = useState(false);
    const navigate = useNavigate();

    const handleLogin = async (e) => {
        e.preventDefault();
        
        if (!username || !password) {
            Swal.fire('Error', 'Por favor ingresa usuario y contraseña', 'warning');
            return;
        }

        setLoading(true);
        
        try {
            const params = new URLSearchParams();
            params.append('username', username);
            params.append('password', password);

            const response = await api.post('/token', params, {
                headers: {
                    'Content-Type': 'application/x-www-form-urlencoded'
                }
            });

            const { access_token } = response.data;
            localStorage.setItem('token', access_token);
            
            // --- LÓGICA DE REDIRECCIÓN POR ROLES ---
            const decoded = jwtDecode(access_token); // - Decodificamos el token
            const userRole = decoded.role; // Obtenemos el rol (ej: 'admin' o 'vendedor')

            Swal.fire({
                icon: 'success',
                title: '¡Bienvenido!',
                text: 'Has iniciado sesión correctamente',
                timer: 1500,
                showConfirmButton: false
            });

            // - Redirección inteligente basada en la planificación
            if (userRole === 'admin') {
                navigate('/'); // Administrador va al Dashboard
            } else if (userRole === 'vendedor') {
                navigate('/ventas'); // Vendedor va a Ventas
            } else {
                navigate('/'); // Redirección por defecto
            }
            
        } catch (error) {
            console.error('Error de login:', error);
            Swal.fire({
                icon: 'error',
                title: 'Error de Autenticación',
                text: error.response?.data?.detail || 'Usuario o contraseña incorrectos'
            });
        } finally {
            setLoading(false);
        }
    };


    return (
        <div className="min-h-screen bg-slate-50 flex flex-col md:flex-row antialiased">
            
            {/* PANEL IZQUIERDO: Branding e Inteligencia Artificial (Oculto en móviles chicos, visible desde MD) */}
            <div className="hidden md:flex md:w-1/2 bg-gradient-to-br from-slate-900 via-indigo-950 to-blue-900 justify-center items-center p-12 relative overflow-hidden select-none">
                
                {/* Elementos decorativos de fondo (Efecto tecnológico abstracto) */}
                <div className="absolute top-0 left-0 w-full h-full opacity-10 pointer-events-none">
                    <div className="absolute top-[-20%] left-[-10%] w-[600px] h-[600px] rounded-full bg-blue-500 blur-[120px]"></div>
                    <div className="absolute bottom-[-20%] right-[-10%] w-[500px] h-[500px] rounded-full bg-indigo-500 blur-[100px]"></div>
                </div>

                <div className="max-w-md w-full text-center md:text-left z-10 space-y-6">
                    <div className="inline-flex items-center gap-2 px-3 py-1 bg-white/10 text-blue-300 rounded-full border border-white/10 text-xs font-semibold backdrop-blur-sm tracking-wide">
                        <Sparkles size={14} className="animate-pulse" />
                        <span>Sistema automatizado n8n</span>
                    </div>
                    
                    <div className="space-y-3">
                        <h1 className="text-4xl lg:text-5xl font-black text-white tracking-tight leading-none">
                            SISTEMA DE <br />
                            <span className="text-transparent bg-clip-text bg-gradient-to-r from-blue-400 to-indigo-300">
                                GESTIÓN COMERCIAL CON AUTOMATIZACION
                            </span>
                        </h1>
                        <p className="text-slate-400 text-sm lg:text-base font-medium leading-relaxed">
                            Automatiza tu inventario, analiza tus ventas en tiempo real y optimiza el rendimiento de tu negocio de forma inteligente.
                        </p>
                    </div>

                    <div className="pt-4 border-t border-white/10 flex items-center gap-3 text-xs text-slate-400 font-semibold">
                        <ShieldCheck size={16} className="text-emerald-400" />
                        <span>Conexión cifrada y control de accesos seguro</span>
                    </div>
                </div>
            </div>

            {/* PANEL DERECHO: Formulario de Login Limpio */}
            <div className="w-full md:w-1/2 flex items-center justify-center p-6 sm:p-12 md:p-16 bg-white">
                <div className="max-w-sm w-full space-y-8">
                    
                    {/* Encabezado móvil / Identificador */}
                    <div className="text-center md:text-left">
                        <h2 className="text-3xl font-black text-slate-800 tracking-tight">
                            ¡Bienvenido de nuevo!
                        </h2>
                        <p className="text-slate-500 text-sm mt-2 font-medium">
                            Por favor, ingresa tus credenciales para acceder.
                        </p>
                    </div>

                    <form onSubmit={handleLogin} className="space-y-5">
                        
                        {/* Input de Usuario */}
                        <div className="space-y-1.5">
                            <label className="text-xs font-bold text-slate-700 uppercase tracking-wider block">
                                Usuario
                            </label>
                            <div className="relative group">
                                <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400 group-focus-within:text-blue-600 transition-colors">
                                    <User className="h-5 w-5" />
                                </div>
                                <input
                                    type="text"
                                    value={username}
                                    onChange={(e) => setUsername(e.target.value)}
                                    className="block w-full pl-11 pr-4 py-3 bg-slate-50 border border-slate-200 rounded-xl font-medium text-slate-800 placeholder-slate-400 focus:bg-white focus:border-blue-600 focus:ring-4 focus:ring-blue-600/10 outline-none transition-all duration-200"
                                    placeholder="Nombre de usuario"
                                />
                            </div>
                        </div>

                        {/* Input de Contraseña */}
                        <div className="space-y-1.5">
                            <label className="text-xs font-bold text-slate-700 uppercase tracking-wider block">
                                Contraseña
                            </label>
                            <div className="relative group">
                                <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400 group-focus-within:text-blue-600 transition-colors">
                                    <Lock className="h-5 w-5" />
                                </div>
                                <input
                                    type="password"
                                    value={password}
                                    onChange={(e) => setPassword(e.target.value)}
                                    className="block w-full pl-11 pr-4 py-3 bg-slate-50 border border-slate-200 rounded-xl font-medium text-slate-800 placeholder-slate-400 focus:bg-white focus:border-blue-600 focus:ring-4 focus:ring-blue-600/10 outline-none transition-all duration-200"
                                    placeholder="••••••••"
                                />
                            </div>
                        </div>

                        {/* Botón de envío con feedback y microinteracciones */}
                        <button
                            type="submit"
                            disabled={loading}
                            className={`w-full flex justify-center items-center py-3.5 px-4 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white font-bold rounded-xl shadow-lg shadow-blue-600/20 active:scale-[0.98] outline-none focus:ring-4 focus:ring-blue-600/20 transition-all duration-150 ${
                                loading ? 'opacity-80 cursor-not-allowed' : ''
                            }`}
                        >
                            {loading ? (
                                <span className="flex items-center gap-2">
                                    <svg className="animate-spin h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                                    </svg>
                                    Autenticando...
                                </span>
                            ) : (
                                <span className="flex items-center gap-2">
                                    <LogIn className="w-5 h-5" />
                                    Ingresar al Sistema
                                </span>
                            )}
                        </button>
                    </form>
                </div>
            </div>
        </div>
    );
};
export default Login;