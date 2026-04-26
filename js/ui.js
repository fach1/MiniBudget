import { UI_CLASSES, ANIMATION_TIMES } from './constants.js';

export function createUIManager(budgetState, elements, chartModule) {
  function updateBudgetDisplays() {
    elements.totalBudgetDisplay.textContent = `$${budgetState.totalBudget.toFixed(2)}`;
    const remaining = budgetState.totalBudget - budgetState.currentSpending;
    elements.remainingBudgetDisplay.textContent = `$${remaining.toFixed(2)}`;
    if (elements.spentBudgetDisplay) {
      elements.spentBudgetDisplay.textContent = `$${budgetState.currentSpending.toFixed(2)}`;
    }
    
    // Traffic light logic
    if (remaining < 0) {
      elements.remainingBudgetDisplay.className = `block text-base font-bold ${UI_CLASSES.DANGER}`;
    } else if (budgetState.totalBudget > 0 && remaining <= (budgetState.totalBudget * 0.2)) {
      elements.remainingBudgetDisplay.className = `block text-base font-bold ${UI_CLASSES.WARNING}`;
    } else {
      elements.remainingBudgetDisplay.className = `block text-base font-bold ${UI_CLASSES.PRIMARY}`;
    }
  }

  function updateEmptyListVisibility() {
    elements.emptyListMessage.style.display = elements.budgetList.children.length === 0 ? 'block' : 'none';
  }

  function updateClearButtonState() {
    const clearBtn = elements.clearItemsBtn; if (!clearBtn) return;
    if (clearBtn._newBudgetHandler) { clearBtn.removeEventListener('click', clearBtn._newBudgetHandler); delete clearBtn._newBudgetHandler; }
    if (budgetState.isEditMode && budgetState.currentBudgetId) {
      clearBtn.innerHTML = '<i class="fas fa-file mr-1"></i> New';
      clearBtn.className = 'px-3 py-1.5 text-sm font-semibold text-blue-600 border-2 border-blue-600 bg-white hover:bg-blue-600 hover:text-white active:bg-blue-700 active:border-blue-700 rounded-lg shadow-sm hover:shadow-md focus:outline-none focus:ring-2 focus:ring-blue-500 transition-all duration-200';
      clearBtn.onclick = () => { if (window.openModal) window.openModal('confirmNewBudgetModal'); };
    } else {
      clearBtn.innerHTML = '<i class="fas fa-trash-alt mr-1" aria-hidden="true"></i> Clear';
      clearBtn.className = 'px-3 py-1.5 text-sm font-semibold text-red-600 border-2 border-red-600 bg-white hover:bg-red-600 hover:text-white active:bg-red-700 active:border-red-700 rounded-lg shadow-sm hover:shadow-md focus:outline-none focus:ring-2 focus:ring-red-500 transition-all duration-200';
      clearBtn.onclick = () => { if (window.openModal) window.openModal('confirmClearModal'); };
    }
  }

  function updateSaveButtonState() {
    const saveBtn = elements.saveBudgetBtn;
    if (budgetState.isEditMode && budgetState.currentBudgetId) {
      saveBtn.innerHTML = '<i class="fas fa-sync-alt mr-1"></i> Update';
      saveBtn.className = 'px-3 py-1.5 text-sm font-semibold text-theme border-2 border-theme bg-white hover:bg-theme hover:text-white active:brightness-95 rounded-lg shadow-sm hover:shadow-md focus:outline-none focus:ring-2 focus:ring-theme transition-all duration-200';
    } else {
      saveBtn.innerHTML = '<i class="fas fa-save mr-1"></i> Save';
      saveBtn.className = 'px-3 py-1.5 text-sm font-semibold text-theme border-2 border-theme bg-white hover:bg-theme hover:text-white active:brightness-95 rounded-lg shadow-sm hover:shadow-md focus:outline-none focus:ring-2 focus:ring-theme transition-all duration-200';
    }
    updateClearButtonState();
  }

  function showSaveSuccess(isUpdate = false) {
    const saveBtn = elements.saveBudgetBtn;
    const originalText = saveBtn.innerHTML;
    const originalClassName = saveBtn.className;
    const messageText = isUpdate ? '<i class="fas fa-check me-2"></i>Updated!' : '<i class="fas fa-check me-2"></i>Saved!';
    const successClassName = 'px-3 py-1.5 text-sm font-semibold text-white bg-theme border-2 border-theme rounded-lg shadow-sm hover:shadow-md focus:outline-none focus:ring-2 focus:ring-theme transition-all duration-200';
    saveBtn.innerHTML = messageText;
    saveBtn.className = successClassName;
    setTimeout(() => {
      saveBtn.innerHTML = originalText;
      saveBtn.className = originalClassName;
    }, ANIMATION_TIMES.SUCCESS_MESSAGE);
  }

  function updateAll() {
    updateBudgetDisplays();
    chartModule.update();
    updateEmptyListVisibility();
  }

  return {
    updateAll,
    updateBudgetDisplays,
    updateEmptyListVisibility,
    updateSaveButtonState,
    updateClearButtonState,
    showSaveSuccess
  };
}
