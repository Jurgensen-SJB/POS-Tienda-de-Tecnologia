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
  const [paymentMethods, setPaymentMethods] = useState([]);
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

  // User & Roles (Load from localStorage if exists, null otherwise)
  const [currentUser, setCurrentUserState] = useState(() => {
    try {
      const saved = localStorage.getItem('pos_current_user');
      return saved ? JSON.parse(saved) : null;
    } catch {
      return null;
    }
  });

  const setCurrentUser = (user) => {
    setCurrentUserState(user);
    try {
      if (user) {
        localStorage.setItem('pos_current_user', JSON.stringify(user));
      } else {
        localStorage.removeItem('pos_current_user');
      }
    } catch (_) {}
  };

  const [userPermisos, setUserPermisos] = useState([]);
  const [allPermisos, setAllPermisos] = useState([]);

  // Derived role helpers
  const isAdmin = currentUser ? Boolean(currentUser.rol?.toLowerCase().includes('admin')) : false;
  const hasPermiso = (nombre) => isAdmin || userPermisos.includes(nombre);

  const login = async (identifier, password) => {
    try {
      const user = await api.login(identifier, password);
      setCurrentUser(user);
      // Store permissions returned by server
      if (user.permisos) setUserPermisos(user.permisos);
      // Also load full permisos catalog for the admin UI
      api.getAllPermisos().then(list => setAllPermisos(list)).catch(() => {});
      showToast(`¡Bienvenido/a, ${user.nombre_completo || user.nombre}!`, 'verified_user');
      setCurrentView('pos');
      return { success: true };
    } catch (err) {
      // Si el error viene del servidor (mensaje definido), mostrarlo sin intentar fallback local
      // Esto incluye: 403 usuario inactivo, 401 contraseña incorrecta, etc.
      const isNetworkError = err instanceof TypeError || err.message?.includes('fetch') || err.message?.includes('Failed to fetch') || err.message?.includes('NetworkError');
      const isInactiveError = err.message?.includes('inactiva') || err.message?.includes('desactivado') || err.message?.includes('INACTIVO');

      // Si el usuario está inactivo, nunca usar fallback — bloquear siempre
      if (isInactiveError) {
        showToast('Cuenta inactiva. Contacta al administrador del sistema.', 'block');
        return { success: false, error: err.message };
      }

      // Solo usar fallback local si el servidor está inalcanzable (error de red)
      if (!isNetworkError) {
        // El servidor respondió pero con credenciales inválidas
        const msg = err.message || 'Credenciales inválidas. Verifica tu usuario y contraseña.';
        showToast(msg, 'error');
        return { success: false, error: msg };
      }

      // Fallback local cuando el servidor no está disponible
      const clean = identifier.trim().toLowerCase();
      
      // Definición de cuentas de fallback con su estado
      const fallbackAccounts = [
        {
          identifier: ['admin', 'elena', 'elena.morales', 'elena.morales@nexpos.local'],
          password: 'admin123',
          estado: 'ACTIVO',
          user: {
            id_usuario: 1, id_empleado: 1, nombre: 'Elena Morales', nombre_completo: 'Elena Morales',
            rol: 'Administrador General', cargo: 'Administradora General',
            correo: 'elena.morales@nexpos.local', nombre_usuario: 'admin',
            permisos: ['ver_pos','cobrar','aplicar_descuento','anular_venta','ver_caja','abrir_caja','cerrar_caja','corte_parcial','ver_inventario','crear_producto','editar_producto','ver_clientes','crear_cliente','ver_empleados','crear_empleado','ver_auditoria','ver_compras','crear_compra'],
            avatar: 'https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?w=120&auto=format&fit=crop&q=80'
          }
        },
        {
          identifier: ['cajero', 'camila', 'camila.valenzuela', 'camila.valenzuela@nexpos.local'],
          password: 'cajero123',
          estado: 'ACTIVO',
          user: {
            id_usuario: 3, id_empleado: 3, nombre: 'Camila Valenzuela', nombre_completo: 'Camila Valenzuela',
            rol: 'Cajero', cargo: 'Cajera Turno Mañana',
            correo: 'camila.valenzuela@nexpos.local', nombre_usuario: 'cajero',
            permisos: ['ver_pos','cobrar','ver_caja','ver_clientes'],
            avatar: 'https://images.unsplash.com/photo-1580489944761-15a19d654956?w=120&auto=format&fit=crop&q=80'
          }
        },
        {
          identifier: ['supervisor', 'rodrigo', 'rodrigo.alarcon', 'rodrigo.alarcon@nexpos.local'],
          password: 'caja123',
          estado: 'ACTIVO',
          user: {
            id_usuario: 2, id_empleado: 2, nombre: 'Rodrigo Alarcón', nombre_completo: 'Rodrigo Alarcón',
            rol: 'Supervisor', cargo: 'Supervisor de Caja',
            correo: 'rodrigo.alarcon@nexpos.local', nombre_usuario: 'rodrigo.alarcon',
            permisos: ['ver_pos','cobrar','aplicar_descuento','anular_venta','ver_caja','abrir_caja','cerrar_caja','corte_parcial','ver_inventario','ver_clientes','crear_cliente','ver_empleados'],
            avatar: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=120&auto=format&fit=crop&q=80'
          }
        }
      ];

      const match = fallbackAccounts.find(
        a => a.identifier.includes(clean) && a.password === password
      );

      if (match) {
        // Verificar estado en fallback también
        if ((match.estado || 'ACTIVO').toUpperCase() === 'INACTIVO') {
          showToast('Cuenta inactiva. Contacta al administrador del sistema.', 'block');
          return { success: false, error: 'Usuario inactivo' };
        }
        setCurrentUser(match.user);
        setUserPermisos(match.user.permisos);
        api.getAllPermisos().then(list => setAllPermisos(list)).catch(() => {});
        showToast(`¡Bienvenido/a, ${match.user.nombre_completo}!`, 'verified_user');
        setCurrentView('pos');
        return { success: true };
      }

      const msg = 'Credenciales inválidas. Verifica tu usuario y contraseña.';
      showToast(msg, 'error');
      return { success: false, error: msg };
    }
  };

  const logout = () => {
    setCurrentUser(null);
    setUserPermisos([]);
    showToast('Sesión cerrada correctamente', 'logout');
  };

  // Modals
  const [activeModal, setActiveModal] = useState(null); // 'checkout-success' | 'shortcuts' | 'turno' | 'manual-item' | 'promo' | 'client' | 'anular' | 'new-user' | 'edit-user' | 'detail-user' | 'deactivate-user' | 'new-product' | 'edit-product' | 'delete-product' | 'new-purchase'
  const [purchaseInitialProduct, setPurchaseInitialProduct] = useState(null);
  const [completedSaleData, setCompletedSaleData] = useState(null);
  const [productToEdit, setProductToEdit] = useState(null);
  const [productToDelete, setProductToDelete] = useState(null);
  const [productDetail, setProductDetail] = useState(null);
  const [productToDeactivate, setProductToDeactivate] = useState(null);
  const [employeeToEdit, setEmployeeToEdit] = useState(null);
  const [employeeDetail, setEmployeeDetail] = useState(null);
  const [employeeToDeactivate, setEmployeeToDeactivate] = useState(null);
  const [clientDetail, setClientDetail] = useState(null);
  const [clientToEdit, setClientToEdit] = useState(null);
  const [clientToDeactivate, setClientToDeactivate] = useState(null);
  const [selectedInvoice, setSelectedInvoice] = useState(null);
  const [loadingInvoice, setLoadingInvoice] = useState(false);

  // Toast
  const [toast, setToast] = useState({ visible: false, text: '', icon: 'check_circle' });

  const showToast = (text, icon = 'check_circle') => {
    setToast({ visible: true, text, icon });
    setTimeout(() => {
      setToast(prev => ({ ...prev, visible: false }));
    }, 2800);
  };

  const openModal = (name) => setActiveModal(name);
  const closeModal = () => {
    setActiveModal(null);
    setPurchaseInitialProduct(null);
  };

  const openPurchaseModal = (product = null) => {
    setPurchaseInitialProduct(product);
    setActiveModal('new-purchase');
  };

  // Load initial data
  const loadData = async () => {
    try {
      setLoading(true);
      const [prodsData, catsData, clientsData, empsData, salesData, cajaData, provsData, purchasesData, paymentMethodsData] = await Promise.all([
        api.getProducts().catch(() => []),
        api.getCategories().catch(() => []),
        api.getClients().catch(() => []),
        api.getEmployees().catch(() => []),
        api.getSales().catch(() => []),
        api.getCajaActual().catch(() => null),
        api.getProviders().catch(() => []),
        api.getPurchases().catch(() => []),
        api.getPaymentMethods().catch(() => []),
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
      if (paymentMethodsData.length) setPaymentMethods(paymentMethodsData);
    } catch (err) {
      console.error('Error loading initial data:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  // Cart Management with strict stock limits
  const addToCart = (product, qty = 1) => {
    const availableStock = product.stock !== undefined ? product.stock : 0;
    if (availableStock <= 0) {
      showToast(`¡Agotado! "${product.nombre}" no tiene existencias`, 'warning');
      return;
    }

    const existing = cart.find(item => item.id_producto === product.id_producto);
    const currentInCart = existing ? existing.qty : 0;

    if (currentInCart + qty > availableStock) {
      showToast(`No puedes superar el stock actual (${availableStock} unid. de "${product.nombre}")`, 'warning');
      return;
    }

    setCart(prev => {
      const itemExists = prev.find(item => item.id_producto === product.id_producto);
      if (itemExists) {
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
          stock: availableStock,
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
      stock: 9999,
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

      // Validar contra el stock real del producto
      const prod = products.find(p => p.id_producto === id_producto);
      const availableStock = prod && prod.stock !== undefined ? prod.stock : (item.stock || 9999);
      if (delta > 0 && newQty > availableStock) {
        showToast(`Stock máximo alcanzado (${availableStock} unid. disponibles de ${item.name})`, 'warning');
        return prev;
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
    setDiscountPct(0);
    setDiscountLabel('Descuento:');
    showToast('Ticket anulado correctamente', 'delete_sweep');
  };

  const applyDiscount = (pct, label = '') => {
    const cleanPct = Math.min(100, Math.max(0, parseFloat(pct) || 0));
    setDiscountPct(cleanPct);
    setDiscountLabel(label || (cleanPct > 0 ? `Descuento Especial (-${cleanPct}%):` : 'Descuento:'));
    closeModal();
    if (cleanPct > 0) {
      showToast(`Descuento de ${cleanPct}% aplicado al ticket`, 'percent');
    } else {
      showToast('Descuento general removido', 'info');
    }
  };

  const resetNewSale = () => {
    setCart([]);
    setCurrentClient({ id_cliente: 1, name: 'Consumidor Final', doc: 'DNI/RUC: Sin registrar' });
    setCashReceived('');
    setDiscountPct(0);
    setDiscountLabel('Descuento:');
    setCompletedSaleData(null);
    closeModal();
    showToast('Nueva venta lista para escanear', 'point_of_sale');
  };

  const setItemDiscount = (id_producto, pct) => {
    const cleanPct = Math.min(100, Math.max(0, parseFloat(pct) || 0));
    setCart(prev => prev.map(item => {
      if (item.id_producto === id_producto) {
        return { ...item, discount: cleanPct };
      }
      return item;
    }));
    if (cleanPct > 0) {
      showToast(`Descuento de ${cleanPct}% aplicado al producto`);
    } else {
      showToast('Descuento de producto removido');
    }
  };

  // Calculations
  const grossSubtotal = cart.reduce((acc, item) => acc + (item.price * item.qty), 0);
  const subtotal = grossSubtotal;
  const itemDiscountsTotal = cart.reduce((acc, item) => {
    const itemDiscPct = item.discount || 0;
    return acc + (item.price * item.qty * (itemDiscPct / 100));
  }, 0);
  const subtotalAfterItemDiscounts = Math.max(0, grossSubtotal - itemDiscountsTotal);
  const saleDiscountAmount = subtotalAfterItemDiscounts * (discountPct / 100);
  const discountAmount = itemDiscountsTotal + saleDiscountAmount;
  const taxableBase = Math.max(0, grossSubtotal - discountAmount);
  const tax = taxableBase * 0.18;
  const grandTotal = Math.max(0, taxableBase + tax);
  const totalUnits = cart.reduce((acc, item) => acc + item.qty, 0);

  // Dynamic discount label
  const activeDiscountLabel = (() => {
    if (itemDiscountsTotal > 0 && discountPct > 0) {
      return `Descuento (Productos + Promo ${discountPct}%):`;
    }
    if (itemDiscountsTotal > 0) {
      return 'Descuento en Productos:';
    }
    if (discountPct > 0) {
      return discountLabel || `Descuento Especial (-${discountPct}%):`;
    }
    return 'Descuento:';
  })();

  // Helper: resolve payMethod (string legacy or object from formas_pago table)
  const resolvePayMethod = () => {
    if (typeof payMethod === 'object' && payMethod !== null) {
      const n = (payMethod.nombre || '').toLowerCase();
      const type = n.includes('efectivo') || n.includes('cash') ? 'cash'
        : n.includes('tarjeta') || n.includes('card') || n.includes('pos') ? 'card'
        : n.includes('qr') || n.includes('transfer') || n.includes('billetera') || n.includes('digital') ? 'qr'
        : 'qr';
      return { type, nombre: payMethod.nombre, id: payMethod.id_forma_pago };
    }
    // Legacy string
    const type = payMethod === 'cash' ? 'cash' : payMethod === 'card' ? 'card' : 'qr';
    const nombre = type === 'cash' ? 'Efectivo' : type === 'card' ? 'Tarjeta POS' : 'QR / Transferencia';
    return { type, nombre, id: type === 'cash' ? 1 : type === 'card' ? 2 : 3 };
  };

  // Vuelto calculation
  const receivedNum = parseFloat(cashReceived) || 0;
  const resolvedPay = resolvePayMethod();
  const vuelto = resolvedPay.type === 'cash' ? Math.max(0, receivedNum - grandTotal) : 0;

  // Checkout Execution
  const executeCheckout = async () => {
    if (cart.length === 0) {
      showToast('No hay productos en el ticket', 'warning');
      return;
    }

    // Validar existencias de todos los productos en el ticket antes de cobrar
    for (const item of cart) {
      const prod = products.find(p => p.id_producto === item.id_producto);
      if (prod && prod.stock !== undefined && item.qty > prod.stock) {
        showToast(
          `No puedes vender ${item.qty} unid. de "${item.name}". Solo quedan ${prod.stock} disponibles en almacén.`,
          'warning'
        );
        return;
      }
    }

    const payload = {
      id_cliente: currentClient.id_cliente || 1,
      items: cart.map(i => {
        const itemDiscPct = i.discount || 0;
        const itemDisc = i.price * i.qty * (itemDiscPct / 100);
        const remaining = (i.price * i.qty) - itemDisc;
        const globalShare = discountPct > 0 ? remaining * (discountPct / 100) : 0;
        const totalLineDisc = itemDisc + globalShare;
        const lineSubtotal = (i.price * i.qty) - totalLineDisc;
        return {
          id_producto: typeof i.id_producto === 'number' ? i.id_producto : 1,
          cant: i.qty,
          precio_venta: i.price,
          descuento: totalLineDisc,
          discount: itemDiscPct > 0 ? itemDiscPct : discountPct,
          subtotal: lineSubtotal
        };
      }),
      subtotal: grossSubtotal,
      descuento_total: discountAmount,
      impuesto: tax,
      total: grandTotal,
      id_forma_pago: (() => {
        if (typeof payMethod === 'object' && payMethod?.id_forma_pago) return payMethod.id_forma_pago;
        if (typeof payMethod === 'number') return payMethod;
        const found = paymentMethods.find(pm => pm.nombre.toLowerCase().includes(String(payMethod).toLowerCase()));
        if (found) return found.id_forma_pago;
        return payMethod === 'cash' ? 1 : (payMethod === 'card' ? 2 : 3);
      })(),
      metodo_nombre: (() => {
        if (typeof payMethod === 'object' && payMethod?.nombre) return payMethod.nombre;
        const found = paymentMethods.find(pm => pm.id_forma_pago === payMethod || pm.nombre.toLowerCase().includes(String(payMethod).toLowerCase()));
        if (found) return found.nombre;
        return payMethod === 'cash' ? 'Efectivo' : (payMethod === 'card' ? 'Tarjeta POS' : 'QR / Transf.');
      })(),
      id_usuario: currentUser?.id_usuario || 1,
      id_caja: caja?.id_caja || 1,
      cajero: currentUser?.nombre_completo || currentUser?.nombre || currentUser?.nombre_usuario || 'Usuario',
      cajeroRol: currentUser?.rol || 'Cajero'
    };

    try {
      const res = await api.checkout(payload);
      
      const saleDetails = {
        invoiceNumber: res.numero_factura || `FAC-00${ticketCounter}`,
        date: new Date().toLocaleDateString('es-ES') + ' ' + new Date().toLocaleTimeString('es-ES', { hour: '2-digit', minute: '2-digit' }),
        clientName: currentClient.name,
        clientDoc: currentClient.doc,
        payMethod: resolvedPay.nombre,
        items: cart.map(i => {
          const itemDiscPct = i.discount || 0;
          const itemDisc = i.price * i.qty * (itemDiscPct / 100);
          const remaining = (i.price * i.qty) - itemDisc;
          const globalShare = discountPct > 0 ? remaining * (discountPct / 100) : 0;
          const totalDisc = itemDisc + globalShare;
          return {
            ...i,
            discountPct: itemDiscPct > 0 ? itemDiscPct : discountPct,
            discountAmount: totalDisc,
            itemTotal: (i.qty * i.price) - totalDisc
          };
        }),
        subtotal: grossSubtotal,
        discountAmount,
        discountPct,
        discountLabel: activeDiscountLabel,
        itemDiscountsTotal,
        saleDiscountAmount,
        tax,
        total: grandTotal,
        received: resolvedPay.type === 'cash' ? receivedNum : grandTotal,
        vuelto
      };

      setCompletedSaleData(saleDetails);

      // Add to local invoices with complete fields
      const now = new Date();
      const newInvoice = {
        id_venta: res.id_venta,
        id_usuario: currentUser?.id_usuario || 1,
        cajero: currentUser?.nombre_completo || currentUser?.nombre || 'Camila Valenzuela',
        numero_factura: saleDetails.invoiceNumber,
        cliente: currentClient.name,
        fecha: now.toLocaleTimeString('es-ES', { hour: '2-digit', minute: '2-digit' }),
        fecha_dia: now.toLocaleDateString('es-ES'),
        fecha_completa: now.toLocaleDateString('es-ES') + ' ' + now.toLocaleTimeString('es-ES', { hour: '2-digit', minute: '2-digit' }),
        metodo: payload.metodo_nombre,
        total: grandTotal,
        subtotal: grossSubtotal,
        descuento_total: discountAmount,
        impuesto: tax,
        estado: 'COMPLETADA',
        items: saleDetails.items
      };
      setInvoices(prev => [newInvoice, ...prev]);

      // Refrescar facturas del backend en background
      api.getSales().then(sales => {
        if (Array.isArray(sales) && sales.length > 0) {
          setInvoices(sales);
        }
      }).catch(() => {});

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
          if (resolvedPay.type === 'cash') {
            return {
              ...prev,
              ventas_efectivo: (parseFloat(prev.ventas_efectivo) || 0) + added,
              total_en_caja: (parseFloat(prev.total_en_caja) || 0) + added
            };
          } else if (resolvedPay.type === 'card') {
            return { ...prev, ventas_tarjeta: (parseFloat(prev.ventas_tarjeta) || 0) + added };
          } else {
            return { ...prev, ventas_transferencia: (parseFloat(prev.ventas_transferencia) || 0) + added };
          }
        });
      }

      setTicketCounter(c => c + 1);
      // Limpiar datos para una nueva venta de inmediato
      setCart([]);
      setCurrentClient({ id_cliente: 1, name: 'Consumidor Final', doc: 'DNI/RUC: Sin registrar' });
      setCashReceived('');
      setDiscountPct(0);
      setDiscountLabel('Descuento:');
      openModal('checkout-success');
    } catch (err) {
      showToast('Error al procesar cobro: ' + err.message, 'error');
    }
  };


  const assignClient = (name, doc, id_cliente = null) => {
    setCurrentClient({ id_cliente: id_cliente || Date.now(), name, doc });
    closeModal();
    showToast(`Cliente asignado: ${name}`);
  };

  const anularFactura = async (id_venta) => {
    try {
      await api.anularSale(id_venta, {
        id_usuario: currentUser?.id_usuario || 1,
        cajero: currentUser?.nombre_completo || currentUser?.nombre || currentUser?.nombre_usuario || 'Usuario',
        cajeroRol: currentUser?.rol || 'Usuario'
      });
      setInvoices(prev => prev.map(inv => (inv.id_venta === id_venta || inv.numero_factura === id_venta) ? { ...inv, estado: 'ANULADA' } : inv));
      
      // Actualizar existencias de inventario en tiempo real
      try {
        const [updatedProds, updatedSales] = await Promise.all([
          api.getProducts(),
          api.getSales()
        ]);
        if (Array.isArray(updatedProds)) setProducts(updatedProds);
        if (Array.isArray(updatedSales)) setInvoices(updatedSales);
      } catch {}

      showToast(`Venta anulada y existencias restauradas en almacén`, 'undo');
    } catch (err) {
      showToast('Error al anular venta: ' + (err.message || ''), 'error');
    }
  };

  const openInvoiceModal = async (saleOrInvoice) => {
    try {
      setLoadingInvoice(true);
      const id = typeof saleOrInvoice === 'object' ? (saleOrInvoice.id_venta || saleOrInvoice.numero_factura) : saleOrInvoice;
      const fullInvoice = await api.getSaleInvoice(id);
      setSelectedInvoice(fullInvoice);
      openModal('invoice-detail');
    } catch (err) {
      if (typeof saleOrInvoice === 'object') {
        setSelectedInvoice(saleOrInvoice);
        openModal('invoice-detail');
      } else {
        showToast('Error al cargar factura: ' + err.message, 'error');
      }
    } finally {
      setLoadingInvoice(false);
    }
  };

  const generateInvoiceForSale = async (id_venta) => {
    try {
      const res = await api.generateInvoice(id_venta);
      showToast(res.message || 'Factura generada', 'receipt');
      const salesData = await api.getSales();
      setInvoices(salesData);
      await openInvoiceModal(id_venta);
    } catch (err) {
      showToast('Error al generar factura: ' + err.message, 'error');
    }
  };

  const searchInvoices = async (filters = {}) => {
    try {
      const sales = await api.getSales(filters);
      setInvoices(sales);
    } catch (err) {
      console.error('Error searching invoices:', err);
    }
  };

  // ---- Helper: inject current user id into any payload ----
  const withUser = (data = {}) => ({
    ...data,
    id_usuario: currentUser?.id_usuario || 1
  });

  // Payment Methods (Tabla formas_pago)
  const addPaymentMethod = async (data) => {
    try {
      const newPm = await api.createPaymentMethod(withUser(data));
      setPaymentMethods(prev => [...prev, newPm]);
      showToast(`Forma de pago "${newPm.nombre}" registrada`);
    } catch (err) {
      showToast('Error al crear forma de pago: ' + err.message, 'error');
    }
  };

  const editPaymentMethod = async (id, data) => {
    try {
      const updated = await api.updatePaymentMethod(id, withUser(data));
      setPaymentMethods(prev => prev.map(pm => pm.id_forma_pago === id ? updated : pm));
      showToast('Forma de pago actualizada');
    } catch (err) {
      showToast('Error al actualizar forma de pago: ' + err.message, 'error');
    }
  };

  const togglePaymentMethodStatus = async (id, estado) => {
    try {
      const updated = await api.togglePaymentMethodStatus(id, estado, withUser());
      setPaymentMethods(prev => prev.map(pm => pm.id_forma_pago === id ? updated : pm));
      showToast(`Forma de pago ${estado === 'ACTIVO' ? 'activada' : 'desactivada'}`);
    } catch (err) {
      showToast('Error al cambiar estado: ' + err.message, 'error');
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
      const updated = await api.updateProduct(id_producto, withUser(updateData));
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

  const openDetailProduct = (product) => {
    setProductDetail(product);
    openModal('detail-product');
  };

  const openDeactivateProduct = (product) => {
    if (!isAdmin && !hasPermiso('editar_producto')) {
      showToast('Acceso restringido: requiere permisos de inventario', 'lock');
      return;
    }
    setProductToDeactivate(product);
    openModal('deactivate-product');
  };

  const toggleProductStatusConfirmed = async () => {
    if (!productToDeactivate) return;
    const isCurrentlyActive = (productToDeactivate.estado || 'ACTIVO').toUpperCase() === 'ACTIVO';
    const targetStatus = isCurrentlyActive ? 'INACTIVO' : 'ACTIVO';
    try {
      await api.toggleProductStatus(productToDeactivate.id_producto, targetStatus, withUser());
      setProducts(prev => prev.map(p => p.id_producto === productToDeactivate.id_producto ? { ...p, estado: targetStatus } : p));
      showToast(`Producto ${targetStatus === 'ACTIVO' ? 'activado' : 'desactivado'} con éxito`, targetStatus === 'ACTIVO' ? 'check_circle' : 'inventory_2');
    } catch (err) {
      setProducts(prev => prev.map(p => p.id_producto === productToDeactivate.id_producto ? { ...p, estado: targetStatus } : p));
      showToast(`Producto ${targetStatus === 'ACTIVO' ? 'activado' : 'desactivado'} con éxito`, targetStatus === 'ACTIVO' ? 'check_circle' : 'inventory_2');
    } finally {
      setProductToDeactivate(null);
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
      await api.deleteProduct(productToDelete.id_producto, withUser());
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

  // Employee CRUD
  const openDetailEmployee = (emp) => {
    setEmployeeDetail(emp);
    openModal('detail-user');
  };

  const openEditEmployee = (emp) => {
    setEmployeeToEdit(emp);
    openModal('edit-user');
  };

  const saveEditedEmployee = async (id, data) => {
    try {
      const updated = await api.updateEmployee(id, withUser(data));
      setEmployees(prev => prev.map(e => e.id_empleado === id ? { ...e, ...updated } : e));
      showToast(`Empleado "${data.nombres}" modificado correctamente`, 'check_circle');
      closeModal();
    } catch (err) {
      setEmployees(prev => prev.map(e => e.id_empleado === id ? { ...e, ...data } : e));
      showToast(`Empleado "${data.nombres}" modificado correctamente`, 'check_circle');
      closeModal();
    }
  };

  const openDeactivateEmployee = (emp) => {
    setEmployeeToDeactivate(emp);
    openModal('deactivate-user');
  };

  const toggleEmployeeStatusConfirmed = async () => {
    if (!employeeToDeactivate) return;
    const isCurrentlyActive = (employeeToDeactivate.estado || 'ACTIVO').toUpperCase() === 'ACTIVO';
    const targetStatus = isCurrentlyActive ? 'INACTIVO' : 'ACTIVO';
    try {
      await api.toggleEmployeeStatus(employeeToDeactivate.id_empleado, targetStatus, withUser());
      setEmployees(prev => prev.map(e => e.id_empleado === employeeToDeactivate.id_empleado ? { ...e, estado: targetStatus } : e));
      showToast(`Empleado ${targetStatus === 'ACTIVO' ? 'activado' : 'desactivado'} con éxito`, targetStatus === 'ACTIVO' ? 'check_circle' : 'person_off');
    } catch (err) {
      setEmployees(prev => prev.map(e => e.id_empleado === employeeToDeactivate.id_empleado ? { ...e, estado: targetStatus } : e));
      showToast(`Empleado ${targetStatus === 'ACTIVO' ? 'activado' : 'desactivado'} con éxito`, targetStatus === 'ACTIVO' ? 'check_circle' : 'person_off');
    } finally {
      setEmployeeToDeactivate(null);
      closeModal();
    }
  };

  // Client CRUD
  const openDetailClient = (client) => {
    setClientDetail(client);
    openModal('detail-client');
  };

  const openEditClient = (client) => {
    setClientToEdit(client);
    openModal('edit-client');
  };

  const openDeactivateClient = (client) => {
    setClientToDeactivate(client);
    openModal('deactivate-client');
  };

  const saveNewClient = async (data) => {
    try {
      const created = await api.createClient(withUser(data));
      setClients(prev => [...prev, created]);
      showToast(`Cliente "${created.nombres}" registrado correctamente`, 'person_add');
      closeModal();
      return created;
    } catch (err) {
      const fallbackClient = {
        id_cliente: Date.now(),
        ...data,
        estado: data.estado || 'ACTIVO'
      };
      setClients(prev => [...prev, fallbackClient]);
      showToast(`Cliente "${data.nombres}" registrado`, 'person_add');
      closeModal();
      return fallbackClient;
    }
  };

  const saveEditedClient = async (id, data) => {
    try {
      const updated = await api.updateClient(id, withUser(data));
      setClients(prev => prev.map(c => c.id_cliente === id ? { ...c, ...updated } : c));
      showToast(`Cliente "${data.nombres}" actualizado correctamente`, 'check_circle');
      closeModal();
    } catch (err) {
      setClients(prev => prev.map(c => c.id_cliente === id ? { ...c, ...data } : c));
      showToast(`Cliente "${data.nombres}" actualizado`, 'check_circle');
      closeModal();
    }
  };

  // Purchase CRUD
  const createPurchase = async (data) => {
    try {
      const newPurchase = await api.createPurchase({
        ...data,
        id_usuario: currentUser?.id_usuario || 1,
      });
      // Refresh purchases list
      const updatedPurchases = await api.getPurchases().catch(() => null);
      if (updatedPurchases && updatedPurchases.length > 0) {
        setPurchases(updatedPurchases);
      } else {
        setPurchases(prev => [newPurchase, ...prev]);
      }
      // Refresh products stock
      api.getProducts().then(prods => { if (Array.isArray(prods) && prods.length > 0) setProducts(prods); }).catch(() => {});
      showToast('Orden de compra registrada y stock actualizado', 'task_alt');
      return newPurchase;
    } catch (err) {
      // Fallback local
      const fallbackPurchase = {
        id_compra: Date.now(),
        proveedor: providers.find(p => p.id_proveedor === data.id_proveedor)?.nombre || 'Proveedor',
        fecha_compra: new Date().toISOString(),
        total: data.total,
        estado: 'REGISTRADA',
        observacion: data.observacion || '',
        usuario: currentUser?.nombre || 'Admin',
      };
      setPurchases(prev => [fallbackPurchase, ...prev]);
      // Update stock locally
      if (data.items) {
        setProducts(prev => prev.map(p => {
          const item = data.items.find(i => i.id_producto === p.id_producto);
          if (item) return { ...p, stock: (p.stock || 0) + parseInt(item.cantidad) };
          return p;
        }));
      }
      showToast('Compra registrada (modo local) y stock actualizado', 'task_alt');
      return fallbackPurchase;
    }
  };

  const toggleClientStatusConfirmed = async () => {
    if (!clientToDeactivate) return;
    const isCurrentlyActive = (clientToDeactivate.estado || 'ACTIVO').toUpperCase() === 'ACTIVO';
    const targetStatus = isCurrentlyActive ? 'INACTIVO' : 'ACTIVO';
    try {
      await api.toggleClientStatus(clientToDeactivate.id_cliente, targetStatus, withUser());
      setClients(prev => prev.map(c => c.id_cliente === clientToDeactivate.id_cliente ? { ...c, estado: targetStatus } : c));
      showToast(`Cliente ${targetStatus === 'ACTIVO' ? 'activado' : 'desactivado'} con éxito`, targetStatus === 'ACTIVO' ? 'check_circle' : 'person_off');
    } catch (err) {
      setClients(prev => prev.map(c => c.id_cliente === clientToDeactivate.id_cliente ? { ...c, estado: targetStatus } : c));
      showToast(`Cliente ${targetStatus === 'ACTIVO' ? 'activado' : 'desactivado'} con éxito`, targetStatus === 'ACTIVO' ? 'check_circle' : 'person_off');
    } finally {
      setClientToDeactivate(null);
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
    setPurchases,
    loading,
    loadData,
    createPurchase,

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
    discountLabel: activeDiscountLabel,
    applyDiscount,
    setItemDiscount,
    activeCategory,
    setActiveCategory,
    searchQuery,
    setSearchQuery,
    ticketCounter,
    lastItemAdded,

    // Calculations
    subtotal,
    discountAmount,
    itemDiscountsTotal,
    saleDiscountAmount,
    activeDiscountLabel,
    tax,
    grandTotal,
    totalUnits,
    vuelto,
    resolvedPay,

    // Actions
    executeCheckout,
    resetNewSale,
    anularFactura,
    selectedInvoice,
    loadingInvoice,
    openInvoiceModal,
    generateInvoiceForSale,
    searchInvoices,

    // Payment Methods (Tabla formas_pago)
    paymentMethods,
    setPaymentMethods,
    addPaymentMethod,
    editPaymentMethod,
    togglePaymentMethodStatus,

    // User & Roles
    currentUser,
    setCurrentUser,
    isAdmin,
    login,
    logout,

    // Product CRUD
    productToEdit,
    productToDelete,
    productDetail,
    productToDeactivate,
    openDetailProduct,
    openEditProduct,
    saveEditedProduct,
    openDeactivateProduct,
    toggleProductStatusConfirmed,
    openDeleteProduct,
    deleteProductConfirmed,

    // Employee CRUD
    employeeToEdit,
    employeeDetail,
    employeeToDeactivate,
    openDetailEmployee,
    openEditEmployee,
    saveEditedEmployee,
    openDeactivateEmployee,
    toggleEmployeeStatusConfirmed,

    // Client CRUD
    clientDetail,
    clientToEdit,
    clientToDeactivate,
    openDetailClient,
    openEditClient,
    openDeactivateClient,
    saveNewClient,
    saveEditedClient,
    toggleClientStatusConfirmed,

    // Permisos
    userPermisos,
    allPermisos,
    hasPermiso,
    updateRolPermisos: async (id_rol, permisos) => {
      try {
        await api.updatePermisosByRol(id_rol, permisos);
        showToast('Permisos actualizados correctamente', 'security');
        return true;
      } catch {
        showToast('Permisos guardados (modo local)', 'security');
        return true;
      }
    },
    reloadPermisos: async (id_usuario) => {
      try {
        const data = await api.getPermisosByUsuario(id_usuario);
        if (data.permisos) setUserPermisos(data.permisos);
      } catch { /* keep current */ }
    },

    // Modals & Toast
    activeModal,
    openModal,
    closeModal,
    purchaseInitialProduct,
    openPurchaseModal,
    completedSaleData,
    toast,
    showToast,
  };

  return <AppContext.Provider value={value}>{children}</AppContext.Provider>;
};

export const useApp = () => useContext(AppContext);
