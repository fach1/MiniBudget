import { STORAGE_KEYS } from './constants.js';

// Factory for storage/data handling; relies on injected budgetState, uiManager, elements, and callback to attach item handlers.
export function createStorageManager(budgetState, uiManager, elements, attachItemEventHandlersRef, savedBudgetsRef) {
  // ===== Normalized items serialization (new format) =====
  function serializeItems() {
    return Array.from(elements.budgetList.children).map(li => {
      const nameEl = li.querySelector('strong');
      const badge = li.querySelector('.price-display');
      const qtyEl = li.querySelector('.item-quantity');
      const unitPrice = parseFloat(badge?.getAttribute('data-unit-price'));
      const quantity = parseInt(qtyEl?.textContent || '1', 10) || 1;
      const isTaxed = li.querySelector('.tax-toggle')?.checked || false;
      return {
        id: li.dataset.id || `item-${Date.now()}-${Math.random().toString(16).slice(2)}`,
        name: nameEl ? nameEl.textContent.trim() : 'Unnamed',
        unitPrice: isNaN(unitPrice) ? 0 : unitPrice,
        quantity,
        isTaxed,
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
      li.className = 'p-4 hover:bg-gray-50 transition-colors';
      li.dataset.id = obj.id || `item-${Date.now()}-${Math.random().toString(16).slice(2)}`;
      li.dataset.createdAt = obj.createdAt || new Date().toISOString();
      const isTaxed = obj.isTaxed || false;
      const effectivePrice = isTaxed ? (obj.unitPrice || 0) * (1 + (budgetState.taxRate || 0.08)) : (obj.unitPrice || 0);
      const total = (effectivePrice * (obj.quantity || 1)).toFixed(2);
      const unitPriceFixed = (obj.unitPrice || 0).toFixed(2);
      const uniqueId = `tax-${Date.now()}-${Math.random().toString(16).slice(2)}`;
      li.innerHTML = `
        <div class="flex justify-between items-center mb-3">
          <strong class="text-base font-semibold text-gray-800">${obj.name || 'Unnamed'}</strong>
          <span class="text-lg font-bold text-theme price-display" data-unit-price="${unitPriceFixed}">$${total}</span>
        </div>
        <div class="flex justify-between items-center">
          <div class="inline-flex items-center border border-gray-200 rounded-md bg-white">
            <button class="px-3 py-1 text-gray-600 hover:bg-gray-100 rounded-l-md transition-colors decrement-btn"><i class="fas fa-minus text-xs pointer-events-none"></i></button>
            <span class="px-3 font-semibold text-gray-800 border-x border-gray-200 min-w-[2.5rem] text-center item-quantity">${obj.quantity || 1}</span>
            <button class="px-3 py-1 text-gray-600 hover:bg-gray-100 rounded-r-md transition-colors increment-btn"><i class="fas fa-plus text-xs pointer-events-none"></i></button>
          </div>
          <div class="flex items-center gap-3">
            <div class="flex items-center gap-2">
              <label class="text-xs font-semibold text-gray-500" for="${uniqueId}">TAX</label>
              <label class="relative inline-flex items-center cursor-pointer">
                <input type="checkbox" class="sr-only peer tax-toggle" id="${uniqueId}" ${isTaxed ? 'checked' : ''}>
                <div class="w-9 h-5 bg-gray-200 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:bg-theme pointer-events-none"></div>
              </label>
            </div>
            <div class="flex gap-1">
              <button class="p-1.5 text-gray-400 hover:text-blue-500 hover:bg-blue-50 rounded transition-colors edit-btn" title="Edit"><i class="fas fa-pen text-sm pointer-events-none"></i></button>
              <button class="p-1.5 text-gray-400 hover:text-red-500 hover:bg-red-50 rounded transition-colors delete-btn" title="Delete"><i class="fas fa-trash-alt text-sm pointer-events-none"></i></button>
            </div>
          </div>
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
        taxRate: budgetState.taxRate,
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
    budgetState.taxRate = data.taxRate || 0.08;
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
    const normalizedItems = items.map(itemHTML => {
      const tempDiv = document.createElement('div');
      tempDiv.innerHTML = itemHTML;
      const listItem = tempDiv.firstElementChild;
      if (!listItem) return null;

      const nameElement = listItem.querySelector('strong');
      const badgeElement = listItem.querySelector('.price-display');
      const quantityElement = listItem.querySelector('.item-quantity');
      const taxToggle = listItem.querySelector('.tax-toggle');

      const quantity = parseInt(quantityElement?.textContent || '1', 10) || 1;
      const rawTotal = parseFloat((badgeElement?.textContent || '$0').replace('$', '').trim());
      const parsedUnitPrice = parseFloat(badgeElement?.getAttribute('data-unit-price'));
      const unitPrice = !isNaN(parsedUnitPrice)
        ? parsedUnitPrice
        : (!isNaN(rawTotal) && quantity > 0 ? rawTotal / quantity : 0);

      return {
        id: listItem.dataset.id || `legacy-${Date.now()}-${Math.random().toString(16).slice(2)}`,
        name: nameElement ? nameElement.textContent.trim() : 'Unnamed',
        unitPrice,
        quantity,
        isTaxed: !!taxToggle?.checked,
        createdAt: listItem.dataset.createdAt || new Date().toISOString()
      };
    }).filter(Boolean);

    deserializeItems(normalizedItems);
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
