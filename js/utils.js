// Utility helpers (modal focus management, formatting, etc.)

/**
 * Hide an MDB modal by id and restore focus to a selector afterwards.
 * Prevents focus remaining inside an aria-hidden container (accessibility fix).
 * @param {string} modalId - ID del elemento modal (sin #)
 * @param {string} [focusSelector] - Selector CSS del elemento que recibirá el foco tras cerrar
 */
export function hideModalAndRestoreFocus(modalId, focusSelector) {
  const modalEl = document.getElementById(modalId);
  if (!modalEl) return;
  const instance = mdb.Modal.getInstance(modalEl);
  if (!instance) return;
  const focusEl = focusSelector ? document.querySelector(focusSelector) : null;
  const handler = () => {
    modalEl.removeEventListener('hidden.mdb.modal', handler);
    if (focusEl && document.contains(focusEl)) {
      focusEl.focus({ preventScroll: true });
    }
  };
  modalEl.addEventListener('hidden.mdb.modal', handler);
  instance.hide();
}

/**
 * Simple currency formatter (extensible si luego se desea internacionalizar)
 * @param {number} value
 * @param {string} currencySymbol
 * @returns {string}
 */
export function formatCurrency(value, currencySymbol = '$') {
  if (typeof value !== 'number' || isNaN(value)) return `${currencySymbol}0.00`;
  return `${currencySymbol}${value.toFixed(2)}`;
}
