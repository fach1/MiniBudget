// Items module: handles CRUD operations on individual budget items
export function createItemsManager({ budgetState, uiManager, elements, getDataManager, savedBudgetsManager }) {
  const itemsManager = {
    itemPendingDeletion: null,
    itemBeingEdited: null,
    editModalInstance: null,
    handleAddItem(event) {
      event.preventDefault();
      const itemName = elements.itemNameInput.value.trim(); const amountValue = elements.itemAmountInput.value.trim(); if (!itemName || !amountValue) return;
      try {
        const amount = parseFloat(amountValue); if (isNaN(amount) || amount <= 0) return; const formattedAmount = amount.toFixed(2); const existingItem = this.findExistingItem(itemName);
        if (existingItem) { this.incrementExistingItem(existingItem); } else { this.addNewItem(itemName, amount, formattedAmount); }
  uiManager.updateAll(); if (savedBudgetsManager && savedBudgetsManager.syncActiveBudget) { savedBudgetsManager.syncActiveBudget(); } getDataManager().saveToLocalStorage(); elements.form.reset();
      } catch (error) { console.error('Error adding item:', error); }
    },
    findExistingItem(itemName) { const existingItems = Array.from(elements.budgetList.querySelectorAll('li')); return existingItems.find(item => { const itemNameElement = item.querySelector('strong'); return itemNameElement && itemNameElement.textContent === itemName; }); },
    incrementExistingItem(existingItem) {
  const quantityElement = existingItem.querySelector('.item-quantity'); const currentQuantity = parseInt(quantityElement.textContent, 10); quantityElement.textContent = currentQuantity + 1;
  const badgeElement = existingItem.querySelector('.badge'); const unitPrice = parseFloat(badgeElement.getAttribute('data-unit-price')); const newTotal = (unitPrice * (currentQuantity + 1)).toFixed(2); badgeElement.textContent = `$${newTotal}`; budgetState.currentSpending += unitPrice; if (savedBudgetsManager && savedBudgetsManager.syncActiveBudget) { savedBudgetsManager.syncActiveBudget(); }
    },
    addNewItem(itemName, amount, formattedAmount) {
  budgetState.currentSpending += amount;
      const listItem = document.createElement('li'); listItem.className = 'list-group-item d-flex justify-content-between align-items-center';
      listItem.innerHTML = `
        <div>
          <strong>${itemName}</strong>
          <span class="badge bg-primary rounded-pill ms-2" data-unit-price="${formattedAmount}">$${formattedAmount}</span>
        </div>
        <div class="d-flex align-items-center">
          <button class="btn btn-outline-secondary btn-sm decrement-btn">-</button>
          <span class="mx-2 item-quantity">1</span>
          <button class="btn btn-outline-secondary btn-sm increment-btn">+</button>
          <button class="btn btn-outline-primary btn-sm edit-btn ms-2">Edit</button>
          <button class="btn btn-danger btn-sm delete-btn ms-3">Delete</button>
        </div>`;
  this.attachItemEventHandlers(listItem); elements.budgetList.appendChild(listItem); if (savedBudgetsManager && savedBudgetsManager.syncActiveBudget) { savedBudgetsManager.syncActiveBudget(); }
    },
    handleIncrementItem(event) {
      const listItem = event.target.closest('li'); if (!listItem) return;
      try {
        const quantityElement = listItem.querySelector('.item-quantity'); const badgeElement = listItem.querySelector('.badge'); const unitPriceAttr = badgeElement.getAttribute('data-unit-price');
  if (quantityElement && badgeElement && unitPriceAttr) { const unitPrice = parseFloat(unitPriceAttr); const currentQuantity = parseInt(quantityElement.textContent, 10); const newQuantity = currentQuantity + 1; quantityElement.textContent = newQuantity; const newTotal = (unitPrice * newQuantity).toFixed(2); badgeElement.textContent = `$${newTotal}`; budgetState.currentSpending += unitPrice; uiManager.updateAll(); if (savedBudgetsManager && savedBudgetsManager.syncActiveBudget) { savedBudgetsManager.syncActiveBudget(); } getDataManager().saveToLocalStorage(); }
      } catch (error) { console.error('Error incrementing item:', error); }
    },
    handleDecrementItem(event) {
      const listItem = event.target.closest('li'); if (!listItem) return;
      try {
        const quantityElement = listItem.querySelector('.item-quantity'); const badgeElement = listItem.querySelector('.badge'); const unitPriceAttr = badgeElement.getAttribute('data-unit-price');
  if (quantityElement && badgeElement && unitPriceAttr) { const unitPrice = parseFloat(unitPriceAttr); const currentQuantity = parseInt(quantityElement.textContent, 10); if (currentQuantity <= 1) { this.handleDeleteItem({ target: listItem.querySelector('.delete-btn') }); return; } const newQuantity = currentQuantity - 1; quantityElement.textContent = newQuantity; const newTotal = (unitPrice * newQuantity).toFixed(2); badgeElement.textContent = `$${newTotal}`; budgetState.currentSpending -= unitPrice; uiManager.updateAll(); if (savedBudgetsManager && savedBudgetsManager.syncActiveBudget) { savedBudgetsManager.syncActiveBudget(); } getDataManager().saveToLocalStorage(); }
      } catch (error) { console.error('Error decrementing item:', error); }
    },
    handleDeleteItem(event) {
      const listItem = event && event.target ? event.target.closest('li') : this.itemPendingDeletion; if (!listItem) { console.error('List item not found.'); return; }
      try {
        const badgeElement = listItem.querySelector('.badge'); if (!badgeElement) { console.error('Badge element not found.'); return; }
        const amountText = badgeElement.textContent; const amount = parseFloat(amountText.replace('$', '')); if (!isNaN(amount)) { budgetState.currentSpending -= amount; }
  elements.budgetList.removeChild(listItem); uiManager.updateAll(); if (savedBudgetsManager && savedBudgetsManager.syncActiveBudget) { savedBudgetsManager.syncActiveBudget(); } getDataManager().saveToLocalStorage();
      } catch (error) { console.error('Error deleting item:', error); }
    },
    openEditModal(event) {
      const listItem = event.target.closest('li'); if (!listItem) return; itemsManager.itemBeingEdited = listItem;
      const nameElement = listItem.querySelector('strong'); const badgeElement = listItem.querySelector('.badge'); const quantityElement = listItem.querySelector('.item-quantity'); if (!nameElement || !badgeElement || !quantityElement) return;
      const unitPrice = parseFloat(badgeElement.getAttribute('data-unit-price'));
      elements.editItemName.value = nameElement.textContent.trim(); elements.editItemPrice.value = unitPrice.toFixed(2); elements.editItemQuantity.value = quantityElement.textContent.trim();
      document.querySelectorAll('#editItemModal .form-outline').forEach((f) => { new mdb.Input(f).init(); });
      const modalEl = document.getElementById('editItemModal'); itemsManager.editModalInstance = mdb.Modal.getInstance(modalEl) || new mdb.Modal(modalEl); itemsManager.editModalInstance.show();
    },
    confirmEditChanges() {
      const listItem = itemsManager.itemBeingEdited; if (!listItem) return;
      const nameElement = listItem.querySelector('strong'); const badgeElement = listItem.querySelector('.badge'); const quantityElement = listItem.querySelector('.item-quantity'); if (!nameElement || !badgeElement || !quantityElement) return;
      const prevUnitPrice = parseFloat(badgeElement.getAttribute('data-unit-price')); const prevQuantity = parseInt(quantityElement.textContent, 10);
      const newName = elements.editItemName.value.trim(); const newUnitPrice = parseFloat(elements.editItemPrice.value); const newQuantity = parseInt(elements.editItemQuantity.value, 10);
      if (!newName || isNaN(newUnitPrice) || newUnitPrice <= 0 || isNaN(newQuantity) || newQuantity <= 0) { alert('Datos inválidos.'); return; }
      const oldTotal = prevUnitPrice * prevQuantity; const newTotal = newUnitPrice * newQuantity; budgetState.currentSpending += (newTotal - oldTotal);
      nameElement.textContent = newName; quantityElement.textContent = newQuantity; badgeElement.setAttribute('data-unit-price', newUnitPrice.toFixed(2)); badgeElement.textContent = `$${newTotal.toFixed(2)}`;
  uiManager.updateAll(); if (savedBudgetsManager && savedBudgetsManager.syncActiveBudget) { savedBudgetsManager.syncActiveBudget(); } getDataManager().saveToLocalStorage(); if (itemsManager.editModalInstance) { itemsManager.editModalInstance.hide(); } itemsManager.itemBeingEdited = null;
    },
    confirmDeleteItem() {
      if (!itemsManager.itemPendingDeletion) return; itemsManager.handleDeleteItem({ target: itemsManager.itemPendingDeletion.querySelector('.delete-btn') }); itemsManager.itemPendingDeletion = null; const modalEl = document.getElementById('confirmDeleteItemModal'); if (modalEl) { const instance = mdb.Modal.getInstance(modalEl); if (instance) instance.hide(); }
    },
    handleClearAllItems() {
      const clearModalEl = document.getElementById('confirmClearModal'); const clearModalInstance = clearModalEl ? mdb.Modal.getInstance(clearModalEl) : null;
      if (elements.budgetList.children.length === 0) { if (clearModalInstance) clearModalInstance.hide(); return; }
      elements.budgetList.innerHTML = ''; budgetState.currentSpending = 0; uiManager.updateAll(); getDataManager().saveToLocalStorage(); if (budgetState.isEditMode && budgetState.currentBudgetId) { savedBudgetsManager.createNewBudget(); } if (clearModalInstance) clearModalInstance.hide();
    },
    attachItemEventHandlers(listItem) {
      const deleteBtn = listItem.querySelector('.delete-btn');
      if (deleteBtn) {
        deleteBtn.addEventListener('click', (e) => {
          e.preventDefault();
          const li = e.target.closest('li'); if (!li) return; itemsManager.itemPendingDeletion = li;
          const nameEl = li.querySelector('strong'); const nameHolder = document.getElementById('delete-item-name'); if (nameEl && nameHolder) nameHolder.textContent = nameEl.textContent.trim();
          const modalEl = document.getElementById('confirmDeleteItemModal'); if (modalEl) { const instance = mdb.Modal.getInstance(modalEl) || new mdb.Modal(modalEl); instance.show(); }
        });
      }
      const incrementBtn = listItem.querySelector('.increment-btn'); if (incrementBtn) incrementBtn.addEventListener('click', this.handleIncrementItem.bind(this));
      const decrementBtn = listItem.querySelector('.decrement-btn'); if (decrementBtn) decrementBtn.addEventListener('click', this.handleDecrementItem.bind(this));
      let editBtn = listItem.querySelector('.edit-btn'); const controlsContainer = listItem.querySelector('.d-flex.align-items-center'); const deleteBtnCurrent = listItem.querySelector('.delete-btn');
      if (!editBtn && controlsContainer) {
        editBtn = document.createElement('button');
        editBtn.className = 'btn btn-outline-primary btn-sm edit-btn ms-2';
        editBtn.textContent = 'Edit';
        if (deleteBtnCurrent) { controlsContainer.insertBefore(editBtn, deleteBtnCurrent); } else { controlsContainer.appendChild(editBtn); }
      }
      if (editBtn) { editBtn.addEventListener('click', this.openEditModal.bind(this)); }
    }
  };

  return itemsManager;
}
