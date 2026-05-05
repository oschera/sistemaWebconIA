import React, { useState, useEffect } from 'react';
import inventoryApi from '../api/inventoryApi';
import { ShoppingCart, Plus, CheckCircle } from 'lucide-react';
import Swal from 'sweetalert2';
import withReactContent from 'sweetalert2-react-content';

const MySwal = withReactContent(Swal);

const Sales = () => {
    // --- 1. ESTADOS ---
    const [products, setProducts] = useState([]);
    const [cart, setCart] = useState([]);
    const [paymentMethods, setPaymentMethods] = useState([]);
    const [selectedPaymentMethod, setSelectedPaymentMethod] = useState(1);
    const [searchTerm, setSearchTerm] = useState('');


    // --- 2. CARGA DE DATOS ---
    const fetchInitialData = async () => {
        try {
            const [productsRes, paymentMethodsRes] = await Promise.all([
                inventoryApi.get('/products'),
                inventoryApi.get('/payment_methods')
            ]);
            setProducts(productsRes.data);
            setPaymentMethods(paymentMethodsRes.data);
        } catch (error) {
            console.error(error);
            MySwal.fire({
                icon: 'error',
                title: 'Error de conexión',
                text: 'No se pudieron cargar los productos del inventario.',
            });
        }
    };

    useEffect(() => {
        fetchInitialData();
    }, []);

    // --- 3. LÓGICA DEL CARRITO ---
    const addToCart = (product) => {
        setCart((prevCart) => {
            const existingItem = prevCart.find(item => Number(item.product_id) === Number(product.id));

            if (existingItem) {
                // Validación obligatoria de Stock al sumar
                if (existingItem.quantity >= product.stock) {
                    MySwal.fire({
                        icon: 'warning',
                        title: 'Stock insuficiente',
                        text: `Solo contamos con ${product.stock} unidades de este producto.`,
                    });
                    return prevCart;
                }

                return prevCart.map(item =>
                    Number(item.product_id) === Number(product.id)
                        ? { ...item, quantity: Number(item.quantity) + 1 }
                        : item
                );
            } else {
                // Validación obligatoria de Stock al agregar nuevo
                if (product.stock <= 0) {
                    MySwal.fire({
                        icon: 'error',
                        title: 'Producto Agotado',
                        text: 'No hay unidades disponibles en el inventario.',
                    });
                    return prevCart;
                }

                return [...prevCart, {
                    product_id: Number(product.id),
                    name_product: product.name_product,
                    price: parseFloat(product.price),
                    quantity: 1
                }];
            }
        });
    };

    const handleProcessSale = async () => {
        if (cart.length === 0) return;

        const result = await MySwal.fire({
            title: '¿Confirmar Venta?',
            text: `Se registrará la venta por un total de $${cart.reduce((acc, i) => acc + (i.price * i.quantity), 0).toFixed(2)}`,
            icon: 'question',
            showCancelButton: true,
            confirmButtonColor: '#16a34a',
            cancelButtonColor: '#d33',
            confirmButtonText: 'Sí, completar',
            cancelButtonText: 'Cancelar'
        });

        if (result.isConfirmed) {
            try {
                // --- AJUSTE SEGÚN TU SCHEMA 'OrderCreate' ---
                const saleData = {
                    // Tu backend espera: items: List[OrderItemCreate]
                    items: cart.map(item => ({
                        product_id: Number(item.product_id),
                        quantity: Number(item.quantity),
                        price: parseFloat(item.price)
                    })),
                    // Tu backend espera: payment_method_id: int
                    payment_method_id: Number(selectedPaymentMethod)
                };

                // Enviar al endpoint (ajusta la ruta según tu main.py de FastAPI)
                // Normalmente es algo como '/orders' o '/sales'
                const response = await inventoryApi.post('/create_order', saleData);

                if (response.status === 200 || response.status === 201) {
                    await MySwal.fire({
                        icon: 'success',
                        title: '¡Venta Realizada!',
                        text: 'El stock ha sido actualizado automáticamente.',
                        timer: 2000,
                        showConfirmButton: false
                    });

                    setCart([]); // Limpiar carrito
                    setSearchTerm(""); // Limpiar buscador
                    fetchInitialData(); // Refrescar lista de productos con stock nuevo
                }

            } catch (error) {
                console.error("Error en la venta:", error);

                // Capturamos el mensaje exacto que lanza tu HTTPException del backend
                const errorMsg = error.response?.data?.detail || 'Error interno del servidor';

                MySwal.fire({
                    icon: 'error',
                    title: 'No se pudo procesar',
                    text: errorMsg
                });
            }
        }
    };

    const filteredProducts = products.filter(product =>
        product.name_product.toLowerCase().includes(searchTerm.toLowerCase()));

    return (
        <div className="p-6 grid grid-cols-1 lg:grid-cols-3 gap-6">



            {/* LADO IZQUIERDO: LISTA DE PRODUCTOS */}
            <div className="lg:col-span-2 bg-white p-4 rounded-xl shadow-sm border border-gray-100">
                {/* BARRA DE BÚSQUEDA (FASE 2) */}
                <div className="relative mb-4">
                    <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                        <Plus className="h-5 w-5 text-gray-400 transform rotate-45" /> {/* Usamos Plus rotado como lupa */}
                    </div>
                    <input
                        type="text"
                        placeholder="Buscar producto..."
                        className="block w-full pl-10 pr-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 bg-gray-50 text-sm transition-all"
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)} // Guardamos cada letra que escribes
                    />
                </div>
                {/* LISTA DE PRODUCTOS FILTRADOS (PULIDO FASE 2) */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {filteredProducts.length > 0 ? (
                        // CASO 1: Sí hay productos que coinciden
                        filteredProducts.map(product => (
                            <div key={product.id} className="border p-4 rounded-lg flex justify-between items-center hover:shadow-md transition-shadow">
                                <div>
                                    <p className="font-bold text-gray-800 notranslate">{product.name_product}</p>
                                    <p className="text-sm text-gray-500">${product.price} - Stock: {product.stock}</p>
                                </div>
                                <button
                                    onClick={() => addToCart(product)}
                                    className="bg-blue-600 text-white p-2 rounded-full hover:bg-blue-700 transition-colors"
                                >
                                    <Plus size={20} />
                                </button>
                            </div>
                        ))
                    ) : (
                        // CASO 2: No se encontró nada (El pulido)
                        <div className="md:col-span-2 text-center py-10 bg-gray-50 rounded-lg border border-gray-100">
                            <Plus className="h-10 w-10 text-gray-300 mx-auto transform rotate-45 mb-2" />
                            <p className="text-gray-500 font-medium">No se encontraron productos.</p>
                            <p className="text-xs text-gray-400">Intenta buscar con otro nombre.</p>
                        </div>
                    )}
                </div>

            </div>

            {/* LADO DERECHO: CARRITO Y TOTALES */}
            <div className="bg-gray-50 p-5 rounded-xl shadow-inner border border-gray-200 h-fit text-gray-800">
                <h2 className="text-xl font-bold mb-4 flex items-center gap-2">
                    <ShoppingCart className="text-gray-700" /> Carrito ({cart.length})
                </h2>

                {cart.length === 0 ? (
                    <div className="py-12 text-center">
                        <p className="text-gray-400 italic">No hay productos seleccionados</p>
                    </div>
                ) : (
                    <div className="space-y-4">
                        <div className="space-y-2 max-h-96 overflow-y-auto">
                            {cart.map((item) => (
                                <div key={item.product_id} className="bg-white p-3 rounded shadow-sm flex justify-between items-center border border-gray-100">
                                    <div>
                                        <p className="font-bold text-gray-800">{item.name_product}</p>
                                        <p className="text-sm text-gray-600 font-medium">Cant: {item.quantity}</p>
                                    </div>
                                    <p className="font-bold text-green-700">
                                        ${(item.price * item.quantity).toFixed(2)}
                                    </p>
                                </div>
                            ))}
                        </div>

                        <div className="border-t-2 border-blue-200 pt-4 mt-4 text-right">
                            <p className="text-xs uppercase text-gray-500 font-bold">Total a pagar</p>
                            <p className="text-2xl font-black text-blue-800">
                                ${cart.reduce((acc, i) => acc + (i.price * i.quantity), 0).toFixed(2)}
                            </p>
                        </div>
                        {/* SELECTOR DE MÉTODO DE PAGO (FASE 3) */}
                        <div className="mt-6 p-3 bg-blue-50 rounded-lg border border-blue-100">
                            <label className="block text-xs font-black text-blue-800 uppercase mb-2">
                                Forma de Pago:
                            </label>
                            {paymentMethods.length > 0 ? (
                                <select
                                    className="w-full p-2 bg-white border border-blue-200 rounded-md text-sm font-bold text-gray-700 focus:ring-2 focus:ring-blue-500 outline-none"
                                    value={selectedPaymentMethod}
                                    onChange={(e) => setSelectedPaymentMethod(Number(e.target.value))}
                                >
                                    {paymentMethods.map((method) => (
                                        <option key={method.id} value={method.id}>
                                            {method.name_payment_method.toUpperCase()}
                                        </option>
                                    ))}
                                </select>
                            ) : (
                                <div className="animate-pulse text-xs text-blue-400 italic">
                                    Cargando métodos disponibles...
                                </div>
                            )}
                        </div>

                        <button
                            onClick={handleProcessSale}
                            disabled={cart.length === 0} // 🚨 SEGURO: Si no hay nada, el botón no hace nada
                            className={`w-full mt-4 py-3 rounded-lg font-bold transition-all flex items-center justify-center gap-2 shadow-md active:scale-95 
        ${cart.length === 0
                                    ? 'bg-gray-300 cursor-not-allowed text-gray-500'
                                    : 'bg-green-600 text-white hover:bg-green-700'
                                }`}
                        >
                            <CheckCircle size={20} />
                            {cart.length === 0 ? 'Carrito Vacío' : 'Completar Venta'}
                        </button>
                    </div>
                )}
            </div>
        </div>
    );
};

export default Sales;