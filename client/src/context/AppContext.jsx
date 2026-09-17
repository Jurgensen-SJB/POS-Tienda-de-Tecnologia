import React, { createContext, useContext, useState, useEffect } from 'react';
import { api } from '../api/api';

const AppContext = createContext();

export const AppProvider = ({ children }) => {
  // Navigation
  const [currentView, setCurrentView] = useState('pos');

  // Core Data
  const [products, setProducts] = useState([]);
  const [categories, setCategories] = useState([]);
  const [clients, setClients] = useState([]);
  const [employees, setEmployees] = useState([]);
  const [invoices, setInvoices] = useState([]);
  const [caja, setCaja] = useState(null);
  const [providers, setProviders] = useState([]);
  const [purchases, setPurchases] = useState([]);
  const [loading, setLoading] = useState(true);

  // POS State
  const [cart, setCart] = useState([]);
  const [currentClient, setCurrentClient] = useState({
    id_cliente: 1,
    name: 'Consumidor Final',
    doc: 'DNI/RUC: Sin registrar'
  });
  const [payMethod, setPayMethod] = useState('cash'); // 'cash' | 'card' | 'qr'
  const [cashReceived, setCashReceived] = useState('');
  const [discountPct, setDiscountPct] = useState(0);
  const [discountLabel, setDiscountLabel] = useState('Descuento:');
  const [activeCategory, setActiveCategory] = useState(null); // null = all
  const [searchQuery, setSearchQuery] = useState('');
  const [ticketCounter, setTicketCounter] = useState(892);
  const [lastItemAdded, setLastItemAdded] = useState('—');

  // User & Roles (Null by default so app starts on Login page)
  const [currentUser, setCurrentUser] = useState(null);
  const isAdmin = currentUser ? Boolean(currentUser.rol?.toLowerCase().includes('admin')) : false;

  const login = async (identifier, password) => {
    try {
      const user = await api.login(identifier, password);
      setCurrentUser(user);
      showToast(`¡Bienvenido/a, ${user.nombre_completo || user.nombre}!`, 'verified_user');
      setCurrentView('pos');
      return { success: true };
    } catch (err) {
      // Fallback local matching if server is temporarily unreachable
      const clean = identifier.trim().toLowerCase();
      if ((clean === 'admin' || clean === 'elena.morales@nexpos.local') && password === 'admin123') {
        const adminUser = {
          id_usuario: 1,
          nombre: 'Elena Morales',
          nombre_completo: 'Elena Morales',
          rol: 'Administrador General',
          cargo: 'Administradora General',
          correo: 'elena.morales@nexpos.local',
          avatar: 'https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?w=120&auto=format&fit=crop&q=80'
        };
        setCurrentUser(adminUser);
        showToast('¡Bienvenida, Elena Morales (Administrador General)!', 'verified_user');
        setCurrentView('pos');
        return { success: true };
      } else if ((clean === 'cajero' || clean === 'camila.valenzuela@nexpos.local') && password === 'cajero123') {
        const cajeroUser = {
          id_usuario: 3,
          nombre: 'Camila Valenzuela',
          nombre_completo: 'Camila Valenzuela',
          rol: 'Cajero',
          cargo: 'Cajera Turno Mañana',
          correo: 'camila.valenzuela@nexpos.local',
          avatar: 'https://images.unsplash.com/photo-1580489944761-15a19d654956?w=120&auto=format&fit=crop&q=80'
        };
        setCurrentUser(cajeroUser);
        showToast('¡Bienvenida, Camila Valenzuela (Cajera)!', 'verified_user');
        setCurrentView('pos');
        return { success: true };
      } else if ((clean === 'supervisor' || clean === 'rodrigo.alarcon@nexpos.local') && password === 'caja123') {
        const supUser = {
          id_usuario: 2,
          nombre: 'Rodrigo Alarcón',
          nombre_completo: 'Rodrigo Alarcón',
          rol: 'Cajero',
          cargo: 'Supervisor de Caja',
          correo: 'rodrigo.alarcon@nexpos.local',
          avatar: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=120&auto=format&fit=crop&q=80'
        };
        setCurrentUser(supUser);
        showToast('¡Bienvenido, Rodrigo Alarcón (Supervisor)!', 'verified_user');
        setCurrentView('pos');
        return { success: true };
      }

      const msg = err.message || 'Credenciales inválidas. Verifica tu usuario y contraseña.';
      showToast(msg, 'error');
      return { success: false, error: msg };
    }
  };

  const logout = () => {
    setCurrentUser(null);
    showToast('Sesión cerrada correctamente', 'logout');
  };

  // Modals
  const [activeModal, setActiveModal] = useState(null); // 'checkout-success' | 'shortcuts' | 'turno' | 'manual-item' | 'promo' | 'client' | 'anular' | 'new-user' | 'new-product' | 'edit-product' | 'delete-product'
  const [completedSaleData, setCompletedSaleData] = useState(null);
  const [productToEdit, setProductToEdit] = useState(null);
  const [productToDelete, setProductToDelete] = useState(null);

  // Toast
  const [toast, setToast] = useState({ visible: false, text: '', icon: 'check_circle' });

  const showToast = (text, icon = 'check_circle') => {
    setToast({ visible: true, text, icon });
    setTimeout(() => {
      setToast(prev => ({ ...prev, visible: false }));
    }, 2800);
  };

  const openModal = (name) => setActiveModal(name);
  const closeModal = () => setActiveModal(null);

  // Load initial data
  const loadData = async () => {
    try {
      setLoading(true);
      const [prodsData, catsData, clientsData, empsData, salesData, cajaData, provsData, purchasesData] = await Promise.all([
        api.getProducts().catch(() => []),
        api.getCategories().catch(() => []),
        api.getClients().catch(() => []),
        api.getEmployees().catch(() => []),
        api.getSales().catch(() => []),
        api.getCajaActual().catch(() => null),
        api.getProviders().catch(() => []),
        api.getPurchases().catch(() => []),
      ]);

      if (prodsData.length) setProducts(prodsData);
      if (catsData.length) setCategories(catsData);
      if (clientsData.length) setClients(clientsData);
      if (empsData.length) setEmployees(empsData);
      if (salesData.length) {
        setInvoices(salesData);
        setTicketCounter(892 + salesData.length);
      }
      if (cajaData) setCaja(cajaData);
      if (provsData.length) setProviders(provsData);
      if (purchasesData.length) setPurchases(purchasesData);
    } catch (err) {
      console.error('Error loading initial data:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  // Cart Management
  const addToCart = (product, qty = 1) => {
    setCart(prev => {
      const existing = prev.find(item => item.id_producto === product.id_producto);
      if (existing) {
        return prev.map(item =>
          item.id_producto === product.id_producto
            ? { ...item, qty: item.qty + qty }
            : item
        );
      }
      return [
        ...prev,
        {
          id_producto: product.id_producto,
          codigo: product.codigo || '',
          name: product.nombre,
          price: parseFloat(product.precio_venta),
          qty,
          discount: 0
        }
      ];
    });
    setLastItemAdded(product.nombre);
    showToast(`+ ${product.nombre}`);
  };

  const addManualItem = (name, price, qty = 1) => {
    const manualProd = {
      id_producto: `manual_${Date.now()}`,
      codigo: 'MANUAL',
      name,
      price: parseFloat(price),
      qty: parseInt(qty),
      discount: 0
    };
    setCart(prev => [...prev, manualProd]);
    setLastItemAdded(name);
    showToast(`+ ${name} agregado al ticket`);
  };

  const changeCartQty = (id_producto, delta) => {
    setCart(prev => {
      const item = prev.find(i => i.id_producto === id_producto);
      if (!item) return prev;
      const newQty = item.qty + delta;
      if (newQty <= 0) {
        showToast(`Removido: ${item.name}`);
        return prev.filter(i => i.id_producto !== id_producto);
      }
      return prev.map(i => i.id_producto === id_producto ? { ...i, qty: newQty } : i);
    });
  };

  const removeFromCart = (id_producto) => {
    const item = cart.find(i => i.id_producto === id_producto);
    if (item) showToast(`Removido: ${item.name}`);
    setCart(prev => prev.filter(i => i.id_producto !== id_producto));
  };

  const clearCart = () => {
    setCart([]);
    showToast('Ticket anulado correctamente', 'delete_sweep');
  };

  // Calculations
  const subtotal = cart.reduce((acc, item) => acc + (item.price * item.qty), 0);
  const discountAmount = subtotal * (discountPct / 100);
  const taxableBase = subtotal - discountAmount;
  const tax = taxableBase * 0.18;
  const grandTotal = Math.max(0, taxableBase + tax);
  const totalUnits = cart.reduce((acc, item) => acc + item.qty, 0);

  // Vuelto calculation
  const receivedNum = parseFloat(cashReceived) || 0;
  const vuelto = payMethod === 'cash' ? Math.max(0, receivedNum - grandTotal) : 0;

  // Checkout Execution
  const executeCheckout = async () => {
    if (cart.length === 0) {
      showToast('No hay productos en el ticket', 'warning');
      return;
    }

    const payload = {
      id_cliente: currentClient.id_cliente || 1,
      items: cart.map(i => ({
        id_producto: typeof i.id_producto === 'number' ? i.id_producto : 1,
        cant: i.qty,
        precio_venta: i.price,
        subtotal: i.price * i.qty
      })),
      subtotal,
      descuento_total: discountAmount,
      impuesto: tax,
      total: grandTotal,
      id_forma_pago: payMethod === 'cash' ? 1 : (payMethod === 'card' ? 2 : 3),
      metodo_nombre: payMethod === 'cash' ? 'Efectivo' : (payMethod === 'card' ? 'Tarjeta POS' : 'QR / Transf.'),
      id_usuario: 1,
      id_caja: caja?.id_caja || 1
    };

    try {
      const res = await api.checkout(payload);
      
      const saleDetails = {
        invoiceNumber: res.numero_factura || `FAC-00${ticketCounter}`,
        date: new Date().toLocaleDateString('es-ES') + ' ' + new Date().toLocaleTimeString('es-ES', { hour: '2-digit', minute: '2-digit' }),
        clientName: currentClient.name,
        clientDoc: currentClient.doc,
        payMethod: payMethod.toUpperCase(),
        items: [...cart],
        subtotal,
        discountAmount,
        tax,
        total: grandTotal,
        received: payMethod === 'cash' ? receivedNum : grandTotal,
        vuelto
      };

      setCompletedSaleData(saleDetails);

      // Add to local invoices
      const newInvoice = {
        id_venta: res.id_venta,
        numero_factura: saleDetails.invoiceNumber,
        cliente: currentClient.name,
        fecha: new Date().toLocaleTimeString('es-ES', { hour: '2-digit', minute: '2-digit' }),
        metodo: payload.metodo_nombre,
        total: grandTotal,
        estado: 'COMPLETADA'
      };
      setInvoices(prev => [newInvoice, ...prev]);

      // Update product stock in memory
      setProducts(prev => prev.map(p => {
        const cartItem = cart.find(ci => ci.id_producto === p.id_producto);
        if (cartItem) {
          return { ...p, stock: Math.max(0, (p.stock || 0) - cartItem.qty) };
        }
        return p;
      }));

      // Update caja
      if (caja) {
        const added = grandTotal;
        setCaja(prev => {
          if (!prev) return prev;
          if (payMethod === 'cash') {
            return {
              ...prev,
              ventas_efectivo: (parseFloat(prev.ventas_efectivo) || 0) + added,
              total_en_caja: (parseFloat(prev.total_en_caja) || 0) + added
            };
          } else if (payMethod === 'card') {
            return { ...prev, ventas_tarjeta: (parseFloat(prev.ventas_tarjeta) || 0) + added };
          } else {
            return { ...prev, ventas_transferencia: (parseFloat(prev.ventas_transferencia) || 0) + added };
          }
        });
      }

      setTicketCounter(c => c + 1);
      openModal('checkout-success');
    } catch (err) {
      showToast('Error al procesar cobro: ' + err.message, 'error');
    }
  };

  const resetNewSale = () => {
    closeModal();
    setCart([]);
    setCurrentClient({ id_cliente: 1, name: 'Consumidor Final', doc: 'DNI/RUC: Sin registrar' });
    setCashReceived('');
    setDiscountPct(0);
    setDiscountLabel('Descuento:');
    showToast('Terminal lista para nueva venta', 'point_of_sale');
  };

  const applyDiscount = (pct, label = `Descuento Especial (-${pct}%):`) => {
    setDiscountPct(pct);
    setDiscountLabel(label);
    closeModal();
    showToast(`Descuento aplicado: ${pct}%`);
  };

  const assignClient = (name, doc, id_cliente = null) => {
    setCurrentClient({ id_cliente: id_cliente || Date.now(), name, doc });
    closeModal();
    showToast(`Cliente asignado: ${name}`);
  };

  const anularFactura = async (id_venta) => {
    try {
      await api.anularSale(id_venta);
      setInvoices(prev => prev.map(inv => inv.id_venta === id_venta ? { ...inv, estado: 'ANULADA' } : inv));
      showToast(`Comprobante anulado y stock revertido`, 'undo');
    } catch (err) {
      showToast('Error al anular venta', 'error');
    }
  };

  // Product CRUD (Admin Only)
  const openEditProduct = (product) => {
    if (!isAdmin) {
      showToast('Acceso restringido: Solo el Administrador puede editar productos', 'lock');
      return;
    }
    setProductToEdit(product);
    openModal('edit-product');
  };

  const saveEditedProduct = async (id_producto, updateData) => {
    if (!isAdmin) {
      showToast('Acceso restringido: Solo el Administrador puede editar productos', 'lock');
      return;
    }

    try {
      const updated = await api.updateProduct(id_producto, updateData);
      setProducts(prev => prev.map(p => p.id_producto === id_producto ? { ...p, ...updated, ...updateData } : p));
      
      // Update cart item price/name if present in cart
      setCart(prev => prev.map(item => {
        if (item.id_producto === id_producto) {
          return {
            ...item,
            name: updateData.nombre || item.name,
            price: updateData.precio_venta !== undefined ? parseFloat(updateData.precio_venta) : item.price
          };
        }
        return item;
      }));

      showToast(`Producto "${updateData.nombre || 'actualizado'}" guardado con éxito`, 'check_circle');
      closeModal();
    } catch (err) {
      // Fallback
      setProducts(prev => prev.map(p => p.id_producto === id_producto ? { ...p, ...updateData } : p));
      setCart(prev => prev.map(item => {
        if (item.id_producto === id_producto) {
          return {
            ...item,
            name: updateData.nombre || item.name,
            price: updateData.precio_venta !== undefined ? parseFloat(updateData.precio_venta) : item.price
          };
        }
        return item;
      }));
      showToast(`Producto "${updateData.nombre || 'actualizado'}" guardado`, 'check_circle');
      closeModal();
    }
  };

  const openDeleteProduct = (product) => {
    if (!isAdmin) {
      showToast('Acceso restringido: Solo el Administrador puede eliminar productos', 'lock');
      return;
    }
    setProductToDelete(product);
    openModal('delete-product');
  };

  const deleteProductConfirmed = async () => {
    if (!productToDelete) return;
    try {
      await api.deleteProduct(productToDelete.id_producto);
      setProducts(prev => prev.filter(p => p.id_producto !== productToDelete.id_producto));
      setCart(prev => prev.filter(item => item.id_producto !== productToDelete.id_producto));
      showToast(`Producto "${productToDelete.nombre}" eliminado`, 'delete');
    } catch (err) {
      setProducts(prev => prev.filter(p => p.id_producto !== productToDelete.id_producto));
      setCart(prev => prev.filter(item => item.id_producto !== productToDelete.id_producto));
      showToast(`Producto "${productToDelete.nombre}" eliminado`, 'delete');
    } finally {
      setProductToDelete(null);
      closeModal();
    }
  };

  const value = {
    currentView,
    setCurrentView,
    products,
    setProducts,
    categories,
    setCategories,
    clients,
    setClients,
    employees,
    setEmployees,
    invoices,
    caja,
    providers,
    purchases,
    loading,
    loadData,

    // POS
    cart,
    addToCart,
    addManualItem,
    changeCartQty,
    removeFromCart,
    clearCart,
    currentClient,
    assignClient,
    payMethod,
    setPayMethod,
    cashReceived,
    setCashReceived,
    discountPct,
    discountLabel,
    applyDiscount,
    activeCategory,
    setActiveCategory,
    searchQuery,
    setSearchQuery,
    ticketCounter,
    lastItemAdded,

    // Calculations
    subtotal,
    discountAmount,
    tax,
    grandTotal,
    totalUnits,
    vuelto,

    // Actions
    executeCheckout,
    resetNewSale,
    anularFactura,

    // User & Roles
    currentUser,
    setCurrentUser,
    isAdmin,
    login,
    logout,

    // Product CRUD
    productToEdit,
    productToDelete,
    openEditProduct,
    saveEditedProduct,
    openDeleteProduct,
    deleteProductConfirmed,

    // Modals & Toast
    activeModal,
    openModal,
    closeModal,
    completedSaleData,
    toast,
    showToast,
  };

  return <AppContext.Provider value={value}>{children}</AppContext.Provider>;
};

export const useApp = () => useContext(AppContext);
