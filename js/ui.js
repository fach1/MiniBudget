import { UI_CLASSES, ANIMATION_TIMES } from './constants.js';

export function createUIManager(budgetState, elements, chartModule) {
  function updateBudgetDisplays() {
    elements.totalBudgetDisplay.textContent = `$${budgetState.totalBudget.toFixed(2)}`;
    const remaining = budgetState.totalBudget - budgetState.currentSpending;
    elements.remainingBudgetDisplay.textContent = `$${remaining.toFixed(2)}`;
    elements.remainingBudgetDisplay.className = remaining < 0 ? UI_CLASSES.DANGER : UI_CLASSES.PRIMARY;
  }

  function updateEmptyListVisibility() {
    elements.emptyListMessage.style.display = elements.budgetList.children.length === 0 ? 'block' : 'none';
  }

  function updateClearButtonState() {
    const clearBtn = elements.clearItemsBtn; if (!clearBtn) return;
    if (clearBtn._newBudgetHandler) { clearBtn.removeEventListener('click', clearBtn._newBudgetHandler); delete clearBtn._newBudgetHandler; }
    if (budgetState.isEditMode && budgetState.currentBudgetId) {
      clearBtn.innerHTML = '<i class="fas fa-file me-2"></i>New Budget';
      clearBtn.classList.remove('btn-outline-danger', 'btn-outline-secondary');
      clearBtn.classList.add('btn-outline-primary');
      clearBtn.setAttribute('data-mdb-toggle', 'modal');
      clearBtn.setAttribute('data-mdb-target', '#confirmNewBudgetModal');
    } else {
      clearBtn.innerHTML = '<i class="fas fa-trash me-2" aria-hidden="true"></i>Clear';
      clearBtn.classList.add('btn-outline-danger');
      clearBtn.classList.remove('btn-outline-secondary', 'btn-outline-primary');
      clearBtn.setAttribute('data-mdb-toggle', 'modal');
      clearBtn.setAttribute('data-mdb-target', '#confirmClearModal');
    }
  }

  function updateSaveButtonState() {
    const saveBtn = elements.saveBudgetBtn;
    if (budgetState.isEditMode && budgetState.currentBudgetId) {
      saveBtn.innerHTML = '<i class="fas fa-sync-alt me-2"></i>Update';
      saveBtn.setAttribute('data-original-title', 'Update current budget');
      saveBtn.classList.add('btn-outline-success');
      saveBtn.classList.remove('btn-outline-primary');
    } else {
      saveBtn.innerHTML = '<i class="fas fa-save me-2"></i>Save';
      saveBtn.setAttribute('data-original-title', 'Save as new budget');
      saveBtn.classList.add('btn-outline-success');
      saveBtn.classList.remove('btn-outline-primary');
    }
    updateClearButtonState();
  }

  function showSaveSuccess(isUpdate = false) {
    const saveBtn = elements.saveBudgetBtn;
    const originalText = saveBtn.innerHTML;
    const messageText = isUpdate ? '<i class="fas fa-check me-2"></i>Updated!' : '<i class="fas fa-check me-2"></i>Saved!';
    const originalClass = 'btn-outline-success';
    const successClass = 'btn-success';
    saveBtn.innerHTML = messageText; saveBtn.classList.add(successClass); saveBtn.classList.remove(originalClass);
    setTimeout(() => { saveBtn.innerHTML = originalText; saveBtn.classList.remove(successClass); saveBtn.classList.add(originalClass); }, ANIMATION_TIMES.SUCCESS_MESSAGE);
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
