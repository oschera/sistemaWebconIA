import React, { useState, useEffect } from 'react';
import inventoryApi from '../api/inventoryApi';
import { ShoppingCart, Plus, CheckCircle, UserPlus, Search, X } from 'lucide-react';
import Swal from 'sweetalert2';
import withReactContent from 'sweetalert2-react-content';
import '../styles/sales.css'; // Asegúrate de crear este archivo con los estilos adecuados

const MySwal = withReactContent(Swal);

const Sales = () => {
    // --- ESTADOS ---
    const [products, setProducts] = useState([]);
    const [cart, setCart] = useState([]);
    const [paymentMethods, setPaymentMethods] = useState([]);
    const [selectedPaymentMethod, setSelectedPaymentMethod] = useState(1);
    const [searchTerm, setSearchTerm] = useState('');

    // Cliente por defecto (Asegúrate de que en tu DB el ID 2 sea Venta Mostrador)
    const [selectedClient, setSelectedClient] = useState({ id: 2, full_name: 'Venta Mostrador' });

    // --- CARGA DE DATOS ---
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
            MySwal.fire('Error', 'No se pudo sincronizar con el servidor', 'error');
        }
    };

    useEffect(() => {
        fetchInitialData();
    }, []);

    // --- LÓGICA DE CLIENTES (Sincronizada con tus Schemas) ---
    const handleAddClient = async () => {
        const { value: formValues } = await MySwal.fire({
            title: 'Identificar Cliente',
            html: `
              <div className="modal-overlay">
                    <div className="modal-container">
                        <header className="modal-header">
                            <h2>Registrar Nuevo Cliente</h2>
                            <button className="close-btn" onClick={closeModal}>&times;</button>
                        </header>

                        <div className="modal-body">
                            {/* DNI con botón de consulta */}
                            <div className="modal-group full-width">
                                <label>DNI (8 dígitos)</label>
                                <div className="input-with-button">
                                    <input 
                                        id="swal-dni" 
                                        className="modal-input" 
                                        placeholder="44556677" 
                                        maxLength="8" 
                                    />
                                    <button id="btn-dni" type="button" className="btn-action-primary">
                                        Consultar
                                    </button>
                                </div>
                            </div>

                            {/* Nombre Completo */}
                            <div className="modal-group full-width">
                                <label>Nombre Completo</label>
                                <input 
                                    id="swal-fullname" 
                                    className="modal-input" 
                                    placeholder="Se completará automáticamente..." 
                                    readOnly 
                                />
                            </div>

                            {/* Dirección */}
                            <div className="modal-group full-width">
                                <label>Dirección (Opcional)</label>
                                <input 
                                    id="swal-address" 
                                    className="modal-input" 
                                    placeholder="Calle, Av, Jr..." 
                                />
                            </div>

                            {/* Teléfono */}
                            <div className="modal-group">
                                <label>Teléfono</label>
                                <input 
                                    id="swal-phone" 
                                    className="modal-input" 
                                    placeholder="999888777" 
                                />
                            </div>

                            {/* Email */}
                            <div className="modal-group">
                                <label>Email (Obligatorio)</label>
                                <input 
                                    id="swal-email" 
                                    type="email" 
                                    className="modal-input" 
                                    placeholder="correo@gmail.com" 
                                />
                            </div>
                        </div>

                        <footer className="modal-footer">
                            <button className="btn-secondary" onClick={closeModal}>Cancelar</button>
                            <button className="btn-primary" onClick={handleSaveClient}>Registrar Cliente</button>
                        </footer>
                    </div>
                </div>
            `,
            didOpen: () => {
                const btnDni = document.getElementById('btn-dni');
                btnDni.addEventListener('click', async () => {
                    const dni = document.getElementById('swal-dni').value;
                    if (dni.length !== 8) return MySwal.showValidationMessage('El DNI debe tener 8 números');

                    btnDni.innerText = '...';
                    try {
                        const res = await inventoryApi.get(`/clients/dni/${dni}`);
                        // Usamos full_name porque así viene en tu DniResponse
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
                return {
                    dni: dni,
                    full_name: full_name,
                    address: document.getElementById('swal-address').value || null,
                    phone: document.getElementById('swal-phone').value || null,
                    email: email
                };
            },
            showCancelButton: true,
            confirmButtonText: 'Registrar Cliente',
            confirmButtonColor: '#1e40af'
        });

        if (formValues) {
            try {
                // Llamada a tu router: @router.post("/clients/")
                const response = await inventoryApi.post('/clients/', formValues);
                setSelectedClient(response.data);
                MySwal.fire('¡Cliente Vinculado!', response.data.full_name, 'success');
            } catch (error) {
                const msg = error.response?.data?.detail || 'Error al guardar';
                MySwal.fire('Error', msg, 'error');
            }
        }
    };

    // --- PROCESAR VENTA ---
    const handleProcessSale = async () => {
        if (cart.length === 0) return;

        const total = cart.reduce((acc, i) => acc + (i.price * i.quantity), 0);

        // 1. Confirmación previa a la venta
        const result = await MySwal.fire({
            title: '¿Confirmar Orden?',
            html: `<b>Cliente:</b> ${selectedClient.full_name}<br><b>Total:</b> $${total.toFixed(2)}`,
            icon: 'question',
            showCancelButton: true,
            confirmButtonText: 'Sí, vender',
            confirmButtonColor: '#16a34a',
            cancelButtonText: 'Cancelar'
        });

        if (result.isConfirmed) {
            try {
                const saleData = {
                    client_id: selectedClient.id,
                    payment_method_id: selectedPaymentMethod,
                    items: cart.map(item => ({
                        product_id: item.product_id,
                        quantity: item.quantity,
                        price: item.price
                    }))
                };

                const response = await inventoryApi.post('/create_order/', saleData);

                if (response.status === 201 || response.status === 200) {
                    const orderData = response.data; // Datos que retorna FastAPI

                    // 2. Alerta de éxito con opción de impresión inteligente
                    await MySwal.fire({
                        icon: 'success',
                        title: 'Venta Exitosa',
                        text: selectedClient.id !== 2
                            ? `Venta registrada para ${selectedClient.full_name}. ¿Deseas el ticket?`
                            : 'Stock actualizado correctamente',
                        showCancelButton: selectedClient.id !== 2, // Solo muestra "No imprimir" si hay cliente
                        confirmButtonText: selectedClient.id !== 2 ? '🖨️ Imprimir Ticket' : 'Aceptar',
                        cancelButtonText: 'Cerrar sin ticket',
                        confirmButtonColor: '#2563eb'
                    }).then((res) => {
                        // 3. Si el usuario eligió imprimir (o es el botón principal del admin)
                        if (res.isConfirmed && selectedClient.id !== 2) {
                            imprimirTicket(orderData, selectedClient.full_name);
                        }
                    });

                    // 4. Limpieza de interfaz para la siguiente venta
                    setCart([]);
                    setSelectedClient({ id: 2, full_name: 'Venta Mostrador' });
                    fetchInitialData();
                }
            } catch (error) {
                console.error("Error en venta:", error);
                MySwal.fire('Error', error.response?.data?.detail || 'No se pudo completar la operación', 'error');
            }
        }
    };

    // --- LOGICA DE CARRITO ---
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
        <div className="sales-container">
            {/* PANEL IZQUIERDO: BUSCADOR Y PRODUCTOS */}
            <div className="sales-main-panel">
                <div className="search-container">
                    <div className="search-wrapper">
                        <Search className="search-icon" size={20} />
                        <input
                            className="search-input"
                            placeholder="Buscar producto por nombre..."
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                        />
                    </div>
                </div>

                <div className="products-grid">
                    {filtered.map(p => (
                        <div key={p.id} className="product-card">
                            <div className="product-info">
                                <h3 className="product-name">{p.name_product}</h3>
                                <p className="product-details">
                                    $ {p.price.toFixed(2)} | Stock: {p.stock}
                                </p>
                            </div>
                            <button onClick={() => addToCart(p)} className="add-product-btn">
                                <Plus size={20} />
                            </button>
                        </div>
                    ))}
                </div>
            </div>

            {/* PANEL DERECHO: CLIENTE Y CARRITO */}
            <div className="sales-sidebar">
                <div className="sidebar-header">
                    <h2 className="sidebar-title"><ShoppingCart /> Carrito</h2>
                    <button onClick={handleAddClient} className="client-action-btn">
                        <UserPlus size={14} /> {selectedClient.id === 1 ? 'Identificar' : 'Cambiar'}
                    </button>
                </div>

                <div className={`client-status-card ${selectedClient.id === 1 ? 'client-default' : 'client-active'}`}>
                    <p className="status-label">Cliente de la venta</p>
                    <p className="client-name">
                        {selectedClient.full_name}
                    </p>
                </div>

                <div className="cart-items-list">
                    {cart.map(item => (
                        <div key={item.product_id} className="cart-item">
                            <span className="cart-item-name">{item.name_product} (x{item.quantity})</span>
                            <div className="cart-item-actions">
                                <span className="cart-item-price">$ {(item.price * item.quantity).toFixed(2)}</span>
                                <X size={14} className="remove-item-icon" onClick={() => setCart(cart.filter(i => i.product_id !== item.product_id))} />
                            </div>
                        </div>
                    ))}
                </div>

                <div className="checkout-section">
                    <div className="total-display">
                        <span className="total-label">Total</span>
                        <span className="total-amount">$ {cart.reduce((acc, i) => acc + (i.price * i.quantity), 0).toFixed(2)}</span>
                    </div>

                    <label className="input-label">Método de Pago</label>
                    <select
                        className="payment-select"
                        value={selectedPaymentMethod}
                        onChange={e => setSelectedPaymentMethod(Number(e.target.value))}
                    >
                        {paymentMethods.map(m => <option key={m.id} value={m.id}>{m.name_payment_method}</option>)}
                    </select>

                    <button
                        onClick={handleProcessSale}
                        disabled={cart.length === 0}
                        className={`complete-sale-btn ${cart.length === 0 ? 'btn-disabled' : 'btn-active'}`}
                    >
                        <CheckCircle size={20} /> Completar Venta
                    </button>
                </div>
            </div>
        </div>
    );
};
const imprimirTicket = (orderData, clientName) => {
    const ventanaImpresion = window.open('', '_blank');

    // Formatear los productos para el ticket
    const itemsHtml = orderData.order_items_order.map(item => `
        <div style="display: flex; justify-content: space-between; margin-bottom: 5px;">
            <div style="flex: 2;">${item.product.name_product.substring(0, 20)}</div>
            <div style="flex: 1; text-align: center;">x${item.quantity}</div>
            <div style="flex: 1; text-align: right;">${item.sub_amount.toFixed(2)}</div>
        </div>
    `).join('');

    ventanaImpresion.document.write(`
        <html>
            <head>
                <style>
                    @page { margin: 0; }
                    body { 
                        font-family: 'Courier New', Courier, monospace; 
                        width: 280px; /* Ancho ideal para ticketera estándar */
                        margin: 0; 
                        padding: 10px;
                        color: #000;
                    }
                    .text-center { text-align: center; }
                    .linea { border-top: 1px dashed #000; margin: 10px 0; }
                    .header { font-size: 14px; font-weight: bold; margin-bottom: 5px; }
                    .info { font-size: 11px; margin-bottom: 10px; }
                    .items { font-size: 11px; }
                    .total { font-size: 14px; font-weight: bold; text-align: right; margin-top: 10px; }
                    .footer { font-size: 10px; margin-top: 20px; }
                </style>
            </head>
            <body onload="window.print(); window.close();">
                <div class="text-center">
                    <div class="header">SHOP PRO</div>
                    <div class="info">
                        RUC: 10758493021<br>
                        Calle Las Begonias 123, Trujillo<br>
                        Tel: 987 654 321
                    </div>
                </div>

                <div class="linea"></div>
                
                <div class="info">
                    Ticket: #00${orderData.id}<br>
                    Fecha: ${new Date(orderData.order_date).toLocaleString('es-PE')}<br>
                    Cliente: ${clientName.toUpperCase()}
                </div>

                <div class="linea"></div>

                <div class="items">
                    <div style="display: flex; justify-content: space-between; font-weight: bold; margin-bottom: 5px;">
                        <div style="flex: 2;">DESCRIPCIÓN</div>
                        <div style="flex: 1; text-align: center;">CANT</div>
                        <div style="flex: 1; text-align: right;">SUB</div>
                    </div>
                    ${itemsHtml}
                </div>

                <div class="linea"></div>

                <div class="total">
                    TOTAL: S/ ${orderData.total_amount.toFixed(2)}
                </div>

                <div class="footer text-center">
                    ¡GRACIAS POR SU PREFERENCIA!<br>
                    No se aceptan devoluciones después de 24h.
                </div>
                <div style="height: 50px;"></div> </body>
        </html>
    `);
    ventanaImpresion.document.close();
};

export default Sales;