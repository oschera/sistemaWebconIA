import Swal from 'sweetalert2';
import withReactContent from 'sweetalert2-react-content';
const MySwal = withReactContent(Swal);

import React, { useState, useEffect } from 'react';
import './Inventory.css'; // 👈 Estilo separado
import inventoryApi from '../api/inventoryApi'; // 👈 El mensajero
import { Trash2, Plus } from 'lucide-react';
import { PenLine } from 'lucide-react';





const Inventory = () => {
    const [product, setProducts] = useState([]); // Estado para guardar los datos
    const [categories, setCategories] = useState([]); // Estado para guardar las categorías

    // Función para pedir los datos al Backend
    const fetchProducts = async () => {
        try {
            const response = await inventoryApi.get('/products'); // GET http://127.0.0.1:8000/products
            setProducts(response.data);
            console.log("¡Datos cargados con éxito!");
        } catch (error) {
            console.error("Error al traer productos:", error);
        }
    };
    const fetchCategories = async () => {
        try {
            const response = await inventoryApi.get('/categories/'); // GET http://127.0.0.1:8000/categories
            setCategories(response.data);
            console.log("¡Categorías cargadas con éxito!");
        } catch (error) {
            console.error("Error al traer categorías:", error);
        }
    };


    // Esto se ejecuta UNA vez al cargar la página
    useEffect(() => {
        fetchProducts();
        fetchCategories();
        const intervalo = setInterval(() => {
            console.log("Sincronizando inventario...");
            fetchProducts();
        }, 30000);

        return () => clearInterval(intervalo);
    }, []);

    const handleDelete = async (id) => {
        const result = await MySwal.fire({
            title: '¿Estás seguro?',
            text: "¡No podrás revertir esto!",
            icon: 'warning',
            showCancelButton: true,
            confirmButtonColor: '#d33',
            cancelButtonColor: '#3085d6',
            confirmButtonText: 'Sí, eliminar',
            cancelButtonText: 'Cancelar',
            reverseButtons: true

        });
        if (result.isConfirmed) {
            try {
                await inventoryApi.delete(`/delete_product/${id}`);
                const nuevaLista = product.filter((p) => p.id !== id);
                setProducts(nuevaLista);

                MySwal.fire('¡Eliminado!',
                    'El producto ha sido eliminado.',
                    'success'
                );
            } catch (error) {
                const errorMessage = error.response?.data?.detail || 'Error al eliminar el producto';
                MySwal.fire({
                    title: 'Error',
                    text: errorMessage,
                    icon: 'error'

                });
            }


        }

    }

    const handleEdit = async (item) => {
        const categoryOptions = categories.map(cat => `<option value="${cat.id}" ${cat.id === item.category_id ? 'selected' : ''}>${cat.name_category}</option>`).join('');
        const { value: formValues } = await MySwal.fire({
            title: 'Editar Producto',
            html: `
                <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 10px; text-align: left;">
                <div style="grid-column: span 2;">
                    <label>Nombre del Producto</label>
                    <input id="edit_name" class="swal2-input" style="width: 85%;" value="${item.name_product}">
                </div>
                <div>
                    <label>Precio ($)</label>
                    <input id="edit_price" type="number" class="swal2-input" style="width: 70%;" value="${item.price}">
                </div>
                <div>
                    <label>Stock</label>
                    <input id="edit_stock" type="number" class="swal2-input" style="width: 70%;" value="${item.stock}">
                </div>
                <div style="grid-column: span 2;">
                    <label>Categoría</label>
                    <select id="edit_category" class="swal2-input" style="width: 85%;">
                        ${categoryOptions}
                    </select>
                </div>
                <div style="grid-column: span 2;">
                    <label>Descripción</label>
                    <input id="edit_description" class="swal2-input" style="width: 85%;" value="${item.description || ''}">
                </div>
                <div style="grid-column: span 2; display: flex; align-items: center; justify-content: center; gap: 15px; margin-top: 10px;">
                    <span>¿Disponible?</span>
                    <label class="switch">
                        <input type="checkbox" id="edit_stockProduct" ${item.stockProduct ? 'checked' : ''}>
                        <span class="slider"></span>
                    </label>
                </div>
            </div>`,
            focusConfirm: false,
            showCancelButton: true,
            confirmButtonText: 'Guardar',
            cancelButtonText: 'Cancelar',
            preConfirm: () => {

                return {
                    name_product: document.getElementById('edit_name').value,
                    price: parseFloat(document.getElementById('edit_price').value),
                    stock: parseInt(document.getElementById('edit_stock').value),
                    description: document.getElementById('edit_description').value,
                    category_id: parseInt(document.getElementById('edit_category').value),
                    stockProduct: document.getElementById('edit_stockProduct').checked

                }



            }

        });
        if (formValues) {
            try {
                const response = await inventoryApi.put(`/update_product/${item.id}/`, formValues);
                setProducts(product.map(p => p.id === item.id ? response.data : p));
                MySwal.fire('¡Actualizado!',
                    'El producto ha sido actualizado exitosamente.',
                    'success'
                );

            }
            catch (error) {
                const errorMessage = error.response?.data?.detail || 'Error al actualizar el producto';
                MySwal.fire({
                    title: 'Error',
                    text: errorMessage,
                    icon: 'error'
                });

            }
        }
    };

    const handleCreate = async () => {
        const categoryOptions = categories.map(cat => `<option value="${cat.id}">${cat.name_category}</option>`).join('');
        const { value: formValues } = await MySwal.fire({
            title: 'Crear Nuevo Producto',
            html: `
            <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 10px; text-align: left;">
                <div style="grid-column: span 2;">
                    <label>Nombre del Producto</label>
                    <input id="name_product" class="swal2-input" style="width: 85%; margin: 5px auto;" placeholder="Ej. Laptop Dell">
                </div>
                <div>
                    <label>Precio ($)</label>
                    <input id="price" type="number" class="swal2-input" style="width: 70%;" placeholder="0.00">
                </div>
                <div>
                    <label>Stock Inicial</label>
                    <input id="stock" type="number" class="swal2-input" style="width: 70%;" placeholder="10">
                </div>
                <div style="grid-column: span 2;">
                    <label>Categoría</label>
                    <select id="category_id" class="swal2-input" style="width: 85%;">
                        <option value="">Seleccione una categoría</option>
                        ${categoryOptions}
                    </select>
                </div>
                <div style="grid-column: span 2;">
                    <label>Descripción</label>
                    <input id="description" class="swal2-input" style="width: 85%;" placeholder="Breve detalle...">
                </div>
                <div style="grid-column: span 2; display: flex; align-items: center; justify-content: center; gap: 15px; margin-top: 10px;">
                    <span>¿Disponible para venta?</span>
                    <label class="switch">
                        <input type="checkbox" id="stockProduct" checked> <span class="slider"></span>
                    </label>
                </div>
            </div>
        `,

            focusConfirm: false,
            showCancelButton: true,
            confirmButtonText: 'Crear',
            cancelButtonText: 'Cancelar',
            preConfirm: () => {
                const name = document.getElementById('name_product').value;
                const categoryId = document.getElementById('category_id').value;
                const price = parseFloat(document.getElementById('price').value);
                const stock = parseInt(document.getElementById('stock').value);


                if (!name || !categoryId || !price || !stock) {
                    MySwal.showValidationMessage('Por favor, completa todos los campos obligatorios.');
                    return false;
                }

                return {
                    name_product: name,
                    price: parseFloat(price),
                    stock: parseInt(stock),
                    description: document.getElementById('description').value,
                    stockProduct: document.getElementById('stockProduct').value === 'true',
                    category_id: parseInt(categoryId)


                }
            }
        });

        if (formValues) {
            try {
                const response = await inventoryApi.post('/create_products/', formValues);
                setProducts([...product, response.data]);
                MySwal.fire('¡Creado!',
                    'El producto ha sido creado exitosamente.',
                    'success'
                );


            }
            catch (error) {
                console.error(error);
                MySwal.fire('Error',
                    'Error al crear el producto.',
                    'error'
                );
            }
        }


    };
    const handleQuickStock = async (item) => {
        const { value: nuevoStock } = await MySwal.fire({
            title: `Actualizar Stock: ${item.name_product}`,
            input: 'number',
            inputLabel: 'Cantidad actual: ' + item.stock,
            inputValue: item.stock,
            showCancelButton: true,
            confirmButtonText: 'Actualizar',
            inputValidator: (value) => {
                if (!value || value < 0) {
                    return '¡Debes ingresar una cantidad válida!';
                }
            }
        });

        if (nuevoStock !== undefined) {
            try {
                // Preparamos los datos manteniendo lo demás igual
                const dataActualizada = {
                    ...item,
                    stock: parseInt(nuevoStock),
                    stockProduct: parseInt(nuevoStock) > 0 // Actualización automática de estado
                };

                await inventoryApi.put(`/update_product/${item.id}/`, dataActualizada);
                fetchProducts(); // Refrescamos la lista
                MySwal.fire({ title: '¡Listo!', icon: 'success', toast: true, position: 'top-end', timer: 2000, showConfirmButton: false });
            } catch (error) {
                MySwal.fire('Error', 'No se pudo actualizar el stock', 'error');
            }
        }
    };


    return (
        <div className="inventory-view">
            <header className="inventory-header">
                <h1 className="text-2xl font-bold">Gestión de Stock</h1>
                <button className="bg-blue-600 text-white px-4 py-2 rounded-lg flex items-center gap-2 hover:bg-blue-700 transition-all"
                    onClick={handleCreate}>
                    <Plus size={18} /> Nuevo Producto
                </button>
            </header>

            <table className="custom-table shadow-sm">
                <thead>
                    <tr>
                        <th>ID</th>
                        <th>Producto</th>
                        <th>Descripción</th>
                        <th>Categoría</th>
                        <th>Precio</th>
                        <th>Stock</th>
                        <th>Estado</th>
                        <th>Acciones</th>
                    </tr>
                </thead>
                <tbody>
                    {product.map((product) => (
                        <tr key={product.id}>
                            <td>{product.id}</td>
                            <td className="font-medium">{product.name_product}</td>
                            <td>{product.description}</td>
                            <td>{product.category_name || "General"}</td>
                            <td>${product.price.toFixed(2)}</td>
                            <td 
                                onClick={() => handleQuickStock(product)} 
                                className="cursor-pointer hover:bg-blue-50 font-bold text-blue-700 underline decoration-dotted"
                                title="Click para edición rápida"
                            >
                                {product.stock}
                            </td>
                            <td>
                                <span className={`badge- stock ${product.stockProduct ? 'badge-success' : 'badge-danger'}`}>
                                    {product.stockProduct ? 'Disponible' : 'Agotado'}
                                </span>
                            </td>
                            <td>
                                <button className="text-red-500 cursor-pointer hover:bg-red-50 p-2 rounded-md" onClick={() => handleEdit(product)}>
                                    <PenLine size={18} />
                                </button>
                                <button className="text-red-500 cursor-pointer hover:bg-red-50 p-2 rounded-md"
                                    onClick={() => handleDelete(product.id)}>
                                    <Trash2 size={18} />
                                </button>
                            </td>
                        </tr>
                    ))}
                </tbody>
            </table>
        </div>
    );
};

export default Inventory;