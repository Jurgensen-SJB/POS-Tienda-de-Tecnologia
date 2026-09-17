import { useEffect } from 'react';
import { useApp } from '../context/AppContext';

export const useKeyboardShortcuts = () => {
  const {
    executeCheckout,
    openModal,
    closeModal,
    activeModal,
    cart,
    showToast
  } = useApp();

  useEffect(() => {
    const handleKeyDown = (e) => {
      // F12 -> Checkout
      if (e.key === 'F12') {
        e.preventDefault();
        executeCheckout();
      }
      // F2 -> Focus Quick Search
      else if (e.key === 'F2') {
        e.preventDefault();
        const searchInput = document.getElementById('global-search-input');
        if (searchInput) {
          searchInput.focus();
          searchInput.select();
        }
        showToast('Búsqueda rápida enfocada', 'search');
      }
      // F4 -> Promo / Discount Modal
      else if (e.key === 'F4') {
        e.preventDefault();
        openModal('promo');
      }
      // F7 -> Turno / Caja Modal
      else if (e.key === 'F7') {
        e.preventDefault();
        openModal('turno');
      }
      // F9 -> Manual Item Modal
      else if (e.key === 'F9') {
        e.preventDefault();
        openModal('manual-item');
      }
      // Escape -> Close active modal or open Anular Cart
      else if (e.key === 'Escape') {
        e.preventDefault();
        if (activeModal) {
          closeModal();
        } else if (cart.length > 0) {
          openModal('anular');
        } else {
          showToast('El ticket ya está vacío');
        }
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [executeCheckout, openModal, closeModal, activeModal, cart, showToast]);
};
