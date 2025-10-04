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

  let focusEl = focusSelector ? document.querySelector(focusSelector) : null;
  if (!focusEl || !document.contains(focusEl)) {
    // Create or reuse sentinel as safe fallback
    let sentinel = document.getElementById('app-focus-sentinel');
    if (!sentinel) {
      sentinel = document.createElement('div');
      sentinel.id = 'app-focus-sentinel';
      sentinel.tabIndex = -1;
      sentinel.style.position = 'fixed';
      sentinel.style.top = '0';
      sentinel.style.left = '0';
      sentinel.style.width = '1px';
      sentinel.style.height = '1px';
      sentinel.style.outline = 'none';
      sentinel.style.opacity = '0';
      document.body.prepend(sentinel);
    }
    focusEl = sentinel;
  }

  // Move focus BEFORE hiding to avoid aria-hidden focus warning
  try { focusEl.focus({ preventScroll: true }); } catch (_) {}

  const handler = () => {
    modalEl.removeEventListener('hidden.mdb.modal', handler);
    // If somehow focus returned inside the (now hidden) modal, re-focus target
    if (modalEl.contains(document.activeElement)) {
      try { focusEl.focus({ preventScroll: true }); } catch (_) {}
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
