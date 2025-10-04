// Budgets module: manages saving, updating, deleting and loading budgets + budget form logic
export function createBudgetsModule({
  budgetState,
  uiManager,
  dataManager,
  elements,
  sidebarManager,
  savedBudgetsRef,
  hideModalAndRestoreFocus
}) {
  const savedBudgets = savedBudgetsRef.array; // stable reference

  const savedBudgetsManager = {
    // Sync current in-memory active budget (items, totals) back into savedBudgets array entry
    syncActiveBudget() {
      if (!budgetState.isEditMode || !budgetState.currentBudgetId) return;
      const index = savedBudgets.findIndex(b => b.id === budgetState.currentBudgetId);
      if (index === -1) return;
      savedBudgets[index] = this.createBudgetObject(budgetState.currentBudgetId, budgetState.currentBudgetName);
    },
    updateSavedBudgetsList() {
      elements.savedBudgetsList.innerHTML = '';
      savedBudgets.forEach(budget => {
        const li = document.createElement('li');
        li.className = 'list-group-item d-flex justify-content-between align-items-center';
        li.innerHTML = `
          <a href="#" class="budget-item" data-id="${budget.id}">${budget.name}</a>
          <button class="btn btn-sm btn-outline-light delete-budget-btn" data-id="${budget.id}">
            <i class="fas fa-trash-alt"></i>
          </button>`;
        elements.savedBudgetsList.appendChild(li);
      });
      this.attachBudgetEventHandlers();
      this.highlightActiveBudget();
    },
    highlightActiveBudget() {
      const activeId = budgetState.currentBudgetId;
      elements.savedBudgetsList.querySelectorAll('.budget-item').forEach(a => {
        if (activeId && a.getAttribute('data-id') === activeId) {
          a.classList.add('active');
        } else {
          a.classList.remove('active');
        }
      });
    },
    attachBudgetEventHandlers() {
      elements.savedBudgetsList.querySelectorAll('.budget-item').forEach(item => {
        item.addEventListener('click', (e) => {
          e.preventDefault();
          const budgetId = e.currentTarget.getAttribute('data-id');
            this.loadSavedBudget(budgetId);
            sidebarManager.toggle();
        });
      });
      elements.savedBudgetsList.querySelectorAll('.delete-budget-btn').forEach(btn => {
        btn.addEventListener('click', (e) => {
          e.stopPropagation();
          const buttonEl = e.currentTarget;
          const budgetId = buttonEl.getAttribute('data-id');
          const budget = savedBudgets.find(b => b.id === budgetId); if (!budget) return;
          const confirmBtn = document.getElementById('confirm-delete-budget-btn'); if (confirmBtn) { confirmBtn.dataset.deleteBudgetId = budgetId; }
          const nameHolder = document.getElementById('delete-budget-name'); if (nameHolder) nameHolder.textContent = budget.name;
          const modalEl = document.getElementById('confirmDeleteBudgetModal'); if (modalEl) { const instance = mdb.Modal.getInstance(modalEl) || new mdb.Modal(modalEl); instance.show(); }
        });
      });
    },
    loadSavedBudget(budgetId) {
      const budget = savedBudgets.find(b => b.id === budgetId); if (!budget) return;
      budgetState.totalBudget = budget.totalBudget; budgetState.currentSpending = budget.currentSpending; budgetState.currentBudgetName = budget.name; budgetState.currentBudgetId = budget.id; budgetState.isEditMode = true;
      elements.totalBudgetInput.value = budgetState.totalBudget; elements.budgetList.innerHTML = '';
      if (budget.items && Array.isArray(budget.items)) {
        if (budget.items.length > 0) {
          if (typeof budget.items[0] === 'string') {
            // legacy HTML list
            dataManager.loadBudgetItems(budget.items);
          } else if (typeof budget.items[0] === 'object') {
            dataManager.deserializeItems(budget.items);
          }
        }
      }
      uiManager.updateAll(); uiManager.updateSaveButtonState(); dataManager.saveToLocalStorage();
      this.highlightActiveBudget();
    },
    deleteSavedBudget(budgetId) {
      for (let i = savedBudgets.length - 1; i >= 0; i--) {
        if (savedBudgets[i].id === budgetId) { savedBudgets.splice(i, 1); break; }
      }
      this.updateSavedBudgetsList(); dataManager.saveToLocalStorage();
      if (budgetState.currentBudgetId === budgetId) { this.createNewBudget(); uiManager.updateAll(); dataManager.saveToLocalStorage(); }
    },
    saveBudget(budgetName) {
      if (!budgetName) return false;
      if (budgetState.isEditMode && budgetState.currentBudgetId) { return this.updateBudget(budgetName); }
      const budgetId = Date.now().toString(); const budget = this.createBudgetObject(budgetId, budgetName);
      savedBudgets.push(budget); budgetState.currentBudgetName = budgetName; budgetState.currentBudgetId = budgetId; budgetState.isEditMode = true;
      this.updateSavedBudgetsList(); uiManager.updateSaveButtonState(); dataManager.saveToLocalStorage();
      return true;
    },
    updateBudget(budgetName) {
      const index = savedBudgets.findIndex(b => b.id === budgetState.currentBudgetId); if (index === -1) return false;
      const updatedBudget = this.createBudgetObject(budgetState.currentBudgetId, budgetName); savedBudgets[index] = updatedBudget; budgetState.currentBudgetName = budgetName;
      this.updateSavedBudgetsList(); dataManager.saveToLocalStorage(); uiManager.updateSaveButtonState(); return true;
    },
  createBudgetObject(id, name) { return { id, name, totalBudget: budgetState.totalBudget, currentSpending: budgetState.currentSpending, items: dataManager.serializeItems(), createdAt: new Date().toISOString(), updatedAt: new Date().toISOString() }; },
    createNewBudget() { budgetState.currentBudgetId = null; budgetState.isEditMode = false; budgetState.currentBudgetName = 'New Budget'; uiManager.updateSaveButtonState(); this.highlightActiveBudget(); }
  };

  const budgetManager = {
    handleBudgetChange() {
      const inputValue = elements.totalBudgetInput.value.trim();
      try {
        const newBudget = parseFloat(inputValue);
        if (!isNaN(newBudget)) {
          budgetState.totalBudget = newBudget; uiManager.updateAll(); dataManager.saveToLocalStorage();
        }
      } catch (error) { console.error('Error updating budget:', error); }
    },
    handleSaveBudget() {
      if (budgetState.isEditMode && budgetState.currentBudgetId) {
        elements.budgetNameInput.value = budgetState.currentBudgetName;
      } else {
        elements.budgetNameInput.value = '';
      }
    },
    handleConfirmSaveBudget() {
      const budgetName = elements.budgetNameInput.value.trim(); if (!budgetName) { alert('Please enter a budget name'); return; }
      const isUpdate = budgetState.isEditMode && budgetState.currentBudgetId; const success = savedBudgetsManager.saveBudget(budgetName);
      if (success) {
        hideModalAndRestoreFocus('saveBudgetModal', '#save-budget');
        elements.budgetNameInput.value = '';
        uiManager.showSaveSuccess(isUpdate);
      }
    }
  };

  return { savedBudgetsManager, budgetManager };
}
