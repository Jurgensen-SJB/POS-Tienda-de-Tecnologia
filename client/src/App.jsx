import React from 'react';
import { useApp } from './context/AppContext';
import { useKeyboardShortcuts } from './hooks/useKeyboardShortcuts';

// Layout
import { Sidebar } from './components/layout/Sidebar';
import { Header } from './components/layout/Header';
import { Toast } from './components/layout/Toast';

// Views
import { LoginView } from './components/views/LoginView';
import { PosView } from './components/views/PosView';
import { CajaView } from './components/views/CajaView';
import { StockView } from './components/views/StockView';
import { CategoriasView } from './components/views/CategoriasView';
import { ComprasView } from './components/views/ComprasView';
import { ProveedoresView } from './components/views/ProveedoresView';
import { ClientesView } from './components/views/ClientesView';
import { EmpleadosView } from './components/views/EmpleadosView';
import { AuditoriaView } from './components/views/AuditoriaView';
import { EstadisticasView } from './components/views/EstadisticasView';
import { AccessRestrictedView } from './components/views/AccessRestrictedView';

// Modals
import { CheckoutSuccessModal } from './components/modals/CheckoutSuccessModal';
import { ShortcutsModal } from './components/modals/ShortcutsModal';
import { TurnoModal } from './components/modals/TurnoModal';
import { ManualItemModal } from './components/modals/ManualItemModal';
import { PromoModal } from './components/modals/PromoModal';
import { ClientModal } from './components/modals/ClientModal';
import { AnularModal } from './components/modals/AnularModal';
import { NewUserModal } from './components/modals/NewUserModal';
import { EditUserModal } from './components/modals/EditUserModal';
import { EmployeeDetailModal } from './components/modals/EmployeeDetailModal';
import { DeactivateUserModal } from './components/modals/DeactivateUserModal';
import { NewProductModal } from './components/modals/NewProductModal';
import { EditProductModal } from './components/modals/EditProductModal';
import { DeleteProductModal } from './components/modals/DeleteProductModal';
import { ProductDetailModal } from './components/modals/ProductDetailModal';
import { DeactivateProductModal } from './components/modals/DeactivateProductModal';
import { NewClientModal } from './components/modals/NewClientModal';
import { ClientDetailModal } from './components/modals/ClientDetailModal';
import { EditClientModal } from './components/modals/EditClientModal';
import { DeactivateClientModal } from './components/modals/DeactivateClientModal';
import { InvoiceDetailModal } from './components/modals/InvoiceDetailModal';
import { PaymentMethodsModal } from './components/modals/PaymentMethodsModal';
import { CorteXModal } from './components/modals/CorteXModal';
import { CierreZModal } from './components/modals/CierreZModal';
import { NewPurchaseModal } from './components/modals/NewPurchaseModal';

export function AppContent() {
  const { currentView, currentUser, hasPermiso } = useApp();

  // Listen to keyboard shortcuts (F12, F2, F4, F7, F9, Escape)
  useKeyboardShortcuts();

  // If not logged in, render Login page
  if (!currentUser) {
    return (
      <div className="h-screen w-screen overflow-hidden bg-slate-50 text-slate-800 font-sans antialiased select-none">
        <Toast />
        <LoginView />
      </div>
    );
  }

  const VIEW_CONFIG = {
    pos:         { perm: 'ver_pos',         name: 'Terminal POS' },
    caja:        { perm: 'ver_caja',        name: 'Control de Caja' },
    facturacion: { perm: 'ver_caja',        name: 'Facturación e Historial' },
    stock:       { perm: 'ver_inventario',  name: 'Catálogo & Stock' },
    categorias:  { perm: 'ver_inventario',  name: 'Gestión de Categorías' },
    proveedores: { perm: 'ver_compras',     name: 'Gestión de Proveedores' },
    compras:     { perm: 'ver_compras',     name: 'Compras & Proveedores' },
    clientes:    { perm: 'ver_clientes',    name: 'Clientes' },
    empleados:   { perm: 'ver_empleados',   name: 'Empleados & Permisos' },
    auditoria:   { perm: 'ver_auditoria',   name: 'Auditoría del Sistema' },
    estadisticas:{ perm: 'ver_auditoria',   name: 'Estadísticas & BI' },
  };

  const renderView = () => {
    const config = VIEW_CONFIG[currentView];
    if (config && config.perm && !hasPermiso(config.perm)) {
      return <AccessRestrictedView requiredPermiso={config.perm} moduleName={config.name} />;
    }

    switch (currentView) {
      case 'pos':
        return <PosView />;
      case 'caja':
      case 'facturacion':
        return <CajaView />;
      case 'stock':
        return <StockView />;
      case 'categorias':
        return <CategoriasView />;
      case 'proveedores':
        return <ProveedoresView />;
      case 'compras':
        return <ComprasView />;
      case 'clientes':
        return <ClientesView />;
      case 'empleados':
        return <EmpleadosView />;
      case 'auditoria':
        return <AuditoriaView />;
      case 'estadisticas':
        return <EstadisticasView />;
      default:
        return <PosView />;
    }
  };

  return (
    <div className="flex h-screen w-screen overflow-hidden bg-slate-50 text-slate-800 font-sans antialiased select-none">
      {/* Toast notifications */}
      <Toast />

      {/* Navigation Sidebar */}
      <Sidebar />

      {/* Main App Container */}
      <div className="flex-1 flex flex-col h-screen overflow-hidden">
        {/* Top Header */}
        <Header />

        {/* Dynamic View Content */}
        <main className="flex-1 overflow-hidden p-3.5 bg-slate-50 relative">
          {renderView()}
        </main>
      </div>

      {/* Global Modals */}
      <CheckoutSuccessModal />
      <ShortcutsModal />
      <TurnoModal />
      <ManualItemModal />
      <PromoModal />
      <ClientModal />
      <AnularModal />
      <NewUserModal />
      <EditUserModal />
      <EmployeeDetailModal />
      <DeactivateUserModal />
      <NewProductModal />
      <EditProductModal />
      <DeleteProductModal />
      <ProductDetailModal />
      <DeactivateProductModal />
      <NewClientModal />
      <ClientDetailModal />
      <EditClientModal />
      <DeactivateClientModal />
      <InvoiceDetailModal />
      <PaymentMethodsModal />
      <CorteXModal />
      <CierreZModal />
      <NewPurchaseModal />
    </div>
  );
}

export default function App() {
  return <AppContent />;
}
