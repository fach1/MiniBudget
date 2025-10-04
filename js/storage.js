import { STORAGE_KEYS } from './constants.js';

// Factory for storage/data handling; relies on injected budgetState, uiManager, elements, and callback to attach item handlers.
export function createStorageManager(budgetState, uiManager, elements, attachItemEventHandlersRef, savedBudgetsRef) {
  // ===== Normalized items serialization (new format) =====
  function serializeItems() {
    return Array.from(elements.budgetList.children).map(li => {
      const nameEl = li.querySelector('strong');
      const badge = li.querySelector('.badge');
      const qtyEl = li.querySelector('.item-quantity');
      const unitPrice = parseFloat(badge?.getAttribute('data-unit-price'));
      const quantity = parseInt(qtyEl?.textContent || '1', 10) || 1;
      return {
        id: li.dataset.id || `item-${Date.now()}-${Math.random().toString(16).slice(2)}`,
        name: nameEl ? nameEl.textContent.trim() : 'Unnamed',
        unitPrice: isNaN(unitPrice) ? 0 : unitPrice,
        quantity,
        createdAt: li.dataset.createdAt || new Date().toISOString(),
        updatedAt: new Date().toISOString()
      };
    });
  }

  function deserializeItems(itemsArray) {
    elements.budgetList.innerHTML = '';
    if (!Array.isArray(itemsArray)) return;
    itemsArray.forEach(obj => {
      if (!obj || typeof obj !== 'object') return;
      const li = document.createElement('li');
      li.className = 'list-group-item d-flex justify-content-between align-items-center';
      li.dataset.id = obj.id || `item-${Date.now()}-${Math.random().toString(16).slice(2)}`;
      li.dataset.createdAt = obj.createdAt || new Date().toISOString();
      const total = ((obj.unitPrice || 0) * (obj.quantity || 1)).toFixed(2);
      const unitPriceFixed = (obj.unitPrice || 0).toFixed(2);
      li.innerHTML = `
        <div>
          <strong>${obj.name || 'Unnamed'}</strong>
          <span class="badge bg-primary rounded-pill ms-2" data-unit-price="${unitPriceFixed}">$${total}</span>
        </div>
        <div class="d-flex align-items-center">
          <button class="btn btn-outline-secondary btn-sm decrement-btn">-</button>
          <span class="mx-2 item-quantity">${obj.quantity || 1}</span>
          <button class="btn btn-outline-secondary btn-sm increment-btn">+</button>
          <button class="btn btn-outline-primary btn-sm edit-btn ms-2">Edit</button>
          <button class="btn btn-danger btn-sm delete-btn ms-3">Delete</button>
        </div>`;
      attachItemEventHandlersRef(li);
      elements.budgetList.appendChild(li);
    });
  }
  function saveToLocalStorage(savedBudgets) {
    try {
      const payload = {
        totalBudget: budgetState.totalBudget,
        currentSpending: budgetState.currentSpending,
        // New normalized format
        items: serializeItems(),
        currentBudgetName: budgetState.currentBudgetName,
        // Persist active budget editing context (added after normalization step)
        currentBudgetId: budgetState.currentBudgetId,
        isEditMode: budgetState.isEditMode
      };
      localStorage.setItem(STORAGE_KEYS.BUDGET_APP, JSON.stringify(payload));
      localStorage.setItem(STORAGE_KEYS.SAVED_BUDGETS, JSON.stringify(savedBudgets));
    } catch (error) {
      console.error('Error saving to localStorage:', error);
    }
  }

  function loadCurrentBudget() {
    const savedData = localStorage.getItem(STORAGE_KEYS.BUDGET_APP); if (!savedData) return;
    const data = JSON.parse(savedData);
    budgetState.totalBudget = data.totalBudget || 0;
    budgetState.currentSpending = data.currentSpending || 0;
    budgetState.currentBudgetName = data.currentBudgetName || 'Default Budget';
    // Restore edit context (backward compatible: fields may not exist in older payloads)
    budgetState.currentBudgetId = data.currentBudgetId || null;
    budgetState.isEditMode = !!data.isEditMode && !!budgetState.currentBudgetId;
    elements.totalBudgetInput.value = budgetState.totalBudget;
    elements.budgetList.innerHTML = '';
    if (data.items && Array.isArray(data.items)) {
      if (data.items.length === 0) return;
      // Backward compatibility: if first element is string assume legacy HTML list
      if (typeof data.items[0] === 'string') {
        loadLegacyBudgetItems(data.items);
        // Immediately migrate to new format on next save by calling save once
        saveToLocalStorage(savedBudgetsRef.array);
      } else if (typeof data.items[0] === 'object') {
        deserializeItems(data.items);
      }
    }
  }

  // Legacy loader (outerHTML strings)
  function loadLegacyBudgetItems(items) {
    items.forEach(itemHTML => {
      const tempDiv = document.createElement('div'); tempDiv.innerHTML = itemHTML; const listItem = tempDiv.firstChild;
      attachItemEventHandlersRef(listItem); elements.budgetList.appendChild(listItem);
    });
  }

  function loadSavedBudgets(intoArray) {
    const savedBudgetsData = localStorage.getItem(STORAGE_KEYS.SAVED_BUDGETS); if (savedBudgetsData) {
      const parsed = JSON.parse(savedBudgetsData);
      intoArray.splice(0, intoArray.length, ...parsed);
    }
  }

  function loadFromLocalStorage(savedBudgets) {
    try {
      // Load saved budgets first so currentBudgetId can be validated/highlighted
      loadSavedBudgets(savedBudgets);
      loadCurrentBudget();
      uiManager.updateAll();
    } catch (error) {
      console.error('Error loading from localStorage:', error);
      resetToDefaults();
    }
  }

  function resetToDefaults() {
    budgetState.totalBudget = 0;
    budgetState.currentSpending = 0;
    budgetState.currentBudgetName = 'Default Budget';
    elements.budgetList.innerHTML = '';
    uiManager.updateAll();
  }

  return {
    saveToLocalStorage: () => saveToLocalStorage(savedBudgetsRef.array),
    loadFromLocalStorage: () => loadFromLocalStorage(savedBudgetsRef.array),
    // Expose legacy only if needed elsewhere (kept for backward compatibility)
    loadBudgetItems: loadLegacyBudgetItems,
    loadCurrentBudget,
    loadSavedBudgets: () => loadSavedBudgets(savedBudgetsRef.array),
    resetToDefaults,
    attachItemEventHandlers: attachItemEventHandlersRef,
    serializeItems,
    deserializeItems
  };
}
