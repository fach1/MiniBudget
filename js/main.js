import { STORAGE_KEYS, UI_CLASSES } from './constants.js';
import { budgetState } from './state.js';
import { createChartModule } from './chart.js';
import { createUIManager } from './ui.js';
import { createStorageManager } from './storage.js';
import { createSidebarManager } from './sidebar.js';
import { createBudgetsModule } from './budgets.js';
import { createItemsManager } from './items.js';
import { hideModalAndRestoreFocus } from './utils.js';

// This file is an initial modular extraction of the former script.js. Further splitting is possible.

document.addEventListener('DOMContentLoaded', () => {
  // ================ DOM ELEMENTS ================
  const elements = initializeUIElements();

  function initializeUIElements() {
    const elementSelectors = {
      form: 'form',
      budgetList: '#budget-list ul',
      emptyListMessage: '#empty-list',
      clearItemsBtn: '#clear-items',
      totalBudgetInput: '#total-budget-input',
      totalBudgetDisplay: '#total-budget',
      budgetChartCanvas: '#budget-chart',
      remainingBudgetDisplay: '#remaining-budget',
      itemNameInput: '#item-name',
      itemAmountInput: '#amount',
      menuButton: '#menu-button',
      sidebar: '#sidebar',
      closeSidebarBtn: '#close-sidebar',
      sidebarOverlay: '#sidebar-overlay',
      saveBudgetBtn: '#save-budget',
      confirmSaveBtn: '#confirm-save-btn',
      budgetNameInput: '#budget-name-input',
      savedBudgetsList: '.sidebar-content ul',
      newBudgetBtn: '#new-budget-btn',
      editItemModal: '#editItemModal',
      editItemName: '#edit-item-name',
      editItemPrice: '#edit-item-price',
      editItemQuantity: '#edit-item-quantity',
      confirmEditItemBtn: '#confirm-edit-item'
    };

    const elements = {};
    for (const [key, selector] of Object.entries(elementSelectors)) {
      elements[key] = document.querySelector(selector);
    }
    elements.sidebarLinks = document.querySelectorAll('.sidebar .list-group-item a');
    return elements;
  }

  if (!validateRequiredElements()) {
    console.error('Critical DOM elements are missing. Please check the HTML structure.');
    return;
  }
  function validateRequiredElements() {
    const requiredElements = ['form', 'budgetList', 'clearItemsBtn', 'totalBudgetInput', 'budgetChartCanvas'];
    return requiredElements.every(elementName => elements[elementName]);
  }

  // ================ APPLICATION STATE (external in state.js) ================
  // Keep a single array instance so the storage manager reference remains valid
  const savedBudgets = [];
  const savedBudgetsRef = { array: savedBudgets }; // stable reference for modules
  const chartModule = createChartModule(budgetState, elements.budgetChartCanvas);

  const uiManager = createUIManager(budgetState, elements, chartModule);

  // (hideModalAndRestoreFocus ahora en utils.js)

  // ================ DATA PERSISTENCE (storage manager) ================
  // Placeholder; real logic lives in itemsManager module (closure captures itemsManager once assigned)
  function attachItemEventHandlers(listItem) {
    if (itemsManager && itemsManager.attachItemEventHandlers) {
      itemsManager.attachItemEventHandlers(listItem);
    }
  }

  const dataManager = createStorageManager(budgetState, uiManager, elements, attachItemEventHandlers, savedBudgetsRef);

  // Sidebar module
  const sidebarManager = createSidebarManager(elements);

  // Budgets module (saved budgets + budget form logic)
  const { savedBudgetsManager, budgetManager } = createBudgetsModule({
    budgetState,
    uiManager,
    dataManager,
    elements,
    sidebarManager,
    savedBudgetsRef,
    hideModalAndRestoreFocus
  });

  // Items module (depends on budgets for createNewBudget in clear)
  const getDataManager = () => dataManager;
  const itemsManager = createItemsManager({ budgetState, uiManager, elements, getDataManager, savedBudgetsManager });

  // ================ SAVED BUDGETS MANAGEMENT ================

  // ================ EVENT LISTENERS ================
  function setupEventListeners() {
  elements.form.addEventListener('submit', itemsManager.handleAddItem.bind(itemsManager));
    elements.totalBudgetInput.addEventListener('input', budgetManager.handleBudgetChange);
    if (elements.saveBudgetBtn) elements.saveBudgetBtn.addEventListener('click', budgetManager.handleSaveBudget);
    if (elements.confirmSaveBtn) elements.confirmSaveBtn.addEventListener('click', budgetManager.handleConfirmSaveBudget);
    if (elements.confirmEditItemBtn) elements.confirmEditItemBtn.addEventListener('click', itemsManager.confirmEditChanges);
  const confirmNewBudgetBtn = document.getElementById('confirm-new-budget-btn'); if (confirmNewBudgetBtn) { confirmNewBudgetBtn.addEventListener('click', () => { elements.budgetList.innerHTML=''; elements.totalBudgetInput.value=''; budgetState.totalBudget=0; budgetState.currentSpending=0; savedBudgetsManager.createNewBudget(); uiManager.updateAll(); dataManager.saveToLocalStorage(); hideModalAndRestoreFocus('confirmNewBudgetModal', '#clear-items'); }); }
  const confirmDeleteBudgetBtn = document.getElementById('confirm-delete-budget-btn'); if (confirmDeleteBudgetBtn) { confirmDeleteBudgetBtn.addEventListener('click', () => { const budgetId = confirmDeleteBudgetBtn.dataset.deleteBudgetId; if (budgetId) { savedBudgetsManager.deleteSavedBudget(budgetId); } hideModalAndRestoreFocus('confirmDeleteBudgetModal', '#menu-button'); delete confirmDeleteBudgetBtn.dataset.deleteBudgetId; }); }
  const confirmDeleteItemBtn = document.getElementById('confirm-delete-item-btn'); if (confirmDeleteItemBtn) { confirmDeleteItemBtn.addEventListener('click', () => { itemsManager.confirmDeleteItem(); hideModalAndRestoreFocus('confirmDeleteItemModal', '#budget-list button.delete-btn'); }); }
  const confirmClearBtn = document.getElementById('confirm-clear-btn'); if (confirmClearBtn) { confirmClearBtn.addEventListener('click', () => { itemsManager.handleClearAllItems(); hideModalAndRestoreFocus('confirmClearModal', '#clear-items'); }); }
  if (elements.newBudgetBtn) { elements.newBudgetBtn.addEventListener('click', () => { elements.budgetList.innerHTML=''; elements.totalBudgetInput.value=''; budgetState.totalBudget=0; budgetState.currentSpending=0; savedBudgetsManager.createNewBudget(); uiManager.updateAll(); dataManager.saveToLocalStorage(); sidebarManager.toggle(); }); }
  sidebarManager.setup();
  }

  // ================ INITIALIZATION ================
  function initializeApp() {
    chartModule.initialize();
  dataManager.loadFromLocalStorage();
  // After loading saved budgets array, render them in the sidebar
  savedBudgetsManager.updateSavedBudgetsList();
    uiManager.updateEmptyListVisibility();
    uiManager.updateSaveButtonState();
    uiManager.updateClearButtonState();
    setupEventListeners();
    document.querySelectorAll('.form-outline').forEach((formOutline) => { new mdb.Input(formOutline).init(); });
  }

  initializeApp();
});
