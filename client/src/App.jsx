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
import { ComprasView } from './components/views/ComprasView';
import { ClientesView } from './components/views/ClientesView';
import { EmpleadosView } from './components/views/EmpleadosView';
import { AuditoriaView } from './components/views/AuditoriaView';

// Modals
import { CheckoutSuccessModal } from './components/modals/CheckoutSuccessModal';
import { ShortcutsModal } from './components/modals/ShortcutsModal';
import { TurnoModal } from './components/modals/TurnoModal';
import { ManualItemModal } from './components/modals/ManualItemModal';
import { PromoModal } from './components/modals/PromoModal';
import { ClientModal } from './components/modals/ClientModal';
import { AnularModal } from './components/modals/AnularModal';
import { NewUserModal } from './components/modals/NewUserModal';
import { NewProductModal } from './components/modals/NewProductModal';
import { EditProductModal } from './components/modals/EditProductModal';
import { DeleteProductModal } from './components/modals/DeleteProductModal';

export function AppContent() {
  const { currentView, currentUser } = useApp();

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

  const renderView = () => {
    switch (currentView) {
      case 'pos':
        return <PosView />;
      case 'caja':
      case 'facturacion':
        return <CajaView />;
      case 'stock':
        return <StockView />;
      case 'compras':
        return <ComprasView />;
      case 'clientes':
        return <ClientesView />;
      case 'empleados':
        return <EmpleadosView />;
      case 'auditoria':
        return <AuditoriaView />;
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
      <NewProductModal />
      <EditProductModal />
      <DeleteProductModal />
    </div>
  );
}

export default function App() {
  return <AppContent />;
}
