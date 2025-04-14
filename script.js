document.addEventListener('DOMContentLoaded', () => {
    // ================ CONSTANTS ================
    const STORAGE_KEYS = {
        BUDGET_APP: 'budgetAppData',
        SAVED_BUDGETS: 'savedBudgets'
    };

    const UI_CLASSES = {
        SUCCESS: 'btn-success',
        OUTLINE_SUCCESS: 'btn-outline-success',
        DANGER: 'text-danger',
        PRIMARY: 'text-primary',
        ACTIVE: 'active'
    };

    const ANIMATION_TIMES = {
        SUCCESS_MESSAGE: 2000
    };

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
            newBudgetBtn: '#new-budget-btn'
        };

        const elements = {};
        
        // Query all elements
        for (const [key, selector] of Object.entries(elementSelectors)) {
            elements[key] = document.querySelector(selector);
        }
        
        // Special case for links that need querySelectorAll
        elements.sidebarLinks = document.querySelectorAll('.sidebar .list-group-item a');
        
        return elements;
    }

    // Ensure all required elements are found
    if (!validateRequiredElements()) {
        console.error('Critical DOM elements are missing. Please check the HTML structure.');
        return;
    }

    function validateRequiredElements() {
        const requiredElements = ['form', 'budgetList', 'clearItemsBtn', 'totalBudgetInput', 'budgetChartCanvas'];
        return requiredElements.every(elementName => elements[elementName]);
    }

    // ================ APPLICATION STATE ================
    const budgetState = {
        totalBudget: 0,
        currentSpending: 0,
        items: [],
        currentBudgetName: 'Default Budget',
        currentBudgetId: null, // Add this to track currently loaded budget ID
        isEditMode: false      // Add this to track if we're editing an existing budget
    };

    // Initialize saved budgets array
    let savedBudgets = [];
    let doughnutChart;

    // ================ CHART MANAGEMENT ================
    const chartModule = {
        initialize() {
            const ctx = elements.budgetChartCanvas.getContext('2d');
            doughnutChart = new Chart(ctx, {
                type: 'doughnut',
                data: {
                    labels: ['Spent', 'Remaining'],
                    datasets: [{
                        data: [0, 100], // Initial values
                        backgroundColor: ['#FF5252', '#4CAF50'], // Red for spent, green for remaining
                        hoverBackgroundColor: ['#FF867F', '#81C784']
                    }]
                },
                options: {
                    responsive: true,
                    maintainAspectRatio: true,
                    cutout: '70%',
                    plugins: {
                        legend: {
                            display: false
                        },
                        tooltip: {
                            callbacks: {
                                label: (tooltipItem) => {
                                    return `${tooltipItem.label}: $${tooltipItem.raw.toFixed(2)}`;
                                }
                            }
                        }
                    }
                }
            });

            // Add window resize event listener to redraw chart
            window.addEventListener('resize', this.handleResize);
        },

        handleResize() {
            // Force chart update on window resize
            if (doughnutChart) {
                doughnutChart.resize();
                doughnutChart.update();
            }
        },

        update() {
            if (!doughnutChart) return;

            const spent = budgetState.currentSpending;
            const remaining = Math.max(budgetState.totalBudget - spent, 0);

            doughnutChart.data.datasets[0].data = [spent, remaining];
            doughnutChart.update();
        }
    };

    // ================ UI MANAGEMENT ================
    const uiManager = {
        updateAll() {
            this.updateBudgetDisplays();
            chartModule.update();
            this.updateEmptyListVisibility();
        },

        updateBudgetDisplays() {
            elements.totalBudgetDisplay.textContent = `$${budgetState.totalBudget.toFixed(2)}`;

            const remaining = budgetState.totalBudget - budgetState.currentSpending;
            elements.remainingBudgetDisplay.textContent = `$${remaining.toFixed(2)}`;
            elements.remainingBudgetDisplay.className = remaining < 0 ? UI_CLASSES.DANGER : UI_CLASSES.PRIMARY;
        },

        updateEmptyListVisibility() {
            elements.emptyListMessage.style.display = 
                elements.budgetList.children.length === 0 ? 'block' : 'none';
        },

        updateSaveButtonState() {
            const saveBtn = elements.saveBudgetBtn;
            
            if (budgetState.isEditMode && budgetState.currentBudgetId) {
                saveBtn.innerHTML = '<i class="fas fa-sync-alt"></i> Update';
                saveBtn.setAttribute('data-original-title', 'Update current budget');
                saveBtn.classList.add('btn-outline-primary');
                saveBtn.classList.remove('btn-outline-success');
            } else {
                saveBtn.innerHTML = '<i class="fas fa-save"></i> Save';
                saveBtn.setAttribute('data-original-title', 'Save as new budget');
                saveBtn.classList.add('btn-outline-success');
                saveBtn.classList.remove('btn-outline-primary');
            }
        },

        showSaveSuccess(isUpdate = false) {
            const saveBtn = elements.saveBudgetBtn;
            const originalText = saveBtn.innerHTML;
            const messageText = isUpdate ? '<i class="fas fa-check"></i> Updated!' : '<i class="fas fa-check"></i> Saved!';
            const originalClass = isUpdate ? 'btn-outline-primary' : 'btn-outline-success';
            const successClass = 'btn-success';
            
            saveBtn.innerHTML = messageText;
            saveBtn.classList.add(successClass);
            saveBtn.classList.remove(originalClass);
            
            setTimeout(() => {
                saveBtn.innerHTML = originalText;
                saveBtn.classList.remove(successClass);
                saveBtn.classList.add(originalClass);
            }, ANIMATION_TIMES.SUCCESS_MESSAGE);
        }
    };

    // ================ DATA PERSISTENCE ================
    const dataManager = {
        saveToLocalStorage() {
            try {
                localStorage.setItem(STORAGE_KEYS.BUDGET_APP, JSON.stringify({
                    totalBudget: budgetState.totalBudget,
                    currentSpending: budgetState.currentSpending,
                    items: Array.from(elements.budgetList.children).map(item => item.outerHTML),
                    currentBudgetName: budgetState.currentBudgetName
                }));
                
                // Also save the array of saved budgets
                localStorage.setItem(STORAGE_KEYS.SAVED_BUDGETS, JSON.stringify(savedBudgets));
            } catch (error) {
                console.error('Error saving to localStorage:', error);
            }
        },

        loadFromLocalStorage() {
            try {
                this.loadCurrentBudget();
                this.loadSavedBudgets();
                uiManager.updateAll();
            } catch (error) {
                console.error('Error loading from localStorage:', error);
                this.resetToDefaults();
            }
        },

        loadCurrentBudget() {
            const savedData = localStorage.getItem(STORAGE_KEYS.BUDGET_APP);
            if (!savedData) return;

            const data = JSON.parse(savedData);

            // Update budget state
            budgetState.totalBudget = data.totalBudget || 0;
            budgetState.currentSpending = data.currentSpending || 0;
            budgetState.currentBudgetName = data.currentBudgetName || 'Default Budget';

            // Set the input value
            elements.totalBudgetInput.value = budgetState.totalBudget;

            // Clear and reload list items
            elements.budgetList.innerHTML = '';
            
            if (data.items && Array.isArray(data.items)) {
                this.loadBudgetItems(data.items);
            }
        },

        loadBudgetItems(items) {
            items.forEach(itemHTML => {
                const tempDiv = document.createElement('div');
                tempDiv.innerHTML = itemHTML;
                const listItem = tempDiv.firstChild;

                // Attach event handlers
                this.attachItemEventHandlers(listItem);
                elements.budgetList.appendChild(listItem);
            });
        },

        attachItemEventHandlers(listItem) {
            const deleteBtn = listItem.querySelector('.delete-btn');
            if (deleteBtn) {
                deleteBtn.addEventListener('click', itemsManager.handleDeleteItem);
            }

            const incrementBtn = listItem.querySelector('.increment-btn');
            if (incrementBtn) {
                incrementBtn.addEventListener('click', itemsManager.handleIncrementItem);
            }

            const decrementBtn = listItem.querySelector('.decrement-btn');
            if (decrementBtn) {
                decrementBtn.addEventListener('click', itemsManager.handleDecrementItem);
            }
        },

        loadSavedBudgets() {
            const savedBudgetsData = localStorage.getItem(STORAGE_KEYS.SAVED_BUDGETS);
            if (savedBudgetsData) {
                savedBudgets = JSON.parse(savedBudgetsData);
                savedBudgetsManager.updateSavedBudgetsList();
            }
        },

        resetToDefaults() {
            budgetState.totalBudget = 0;
            budgetState.currentSpending = 0;
            budgetState.currentBudgetName = 'Default Budget';
            elements.budgetList.innerHTML = '';
            uiManager.updateAll();
        }
    };

    // ================ SAVED BUDGETS MANAGEMENT ================
    const savedBudgetsManager = {
        updateSavedBudgetsList() {
            // Clear the current list
            elements.savedBudgetsList.innerHTML = '';
            
            // Add each budget to the list
            savedBudgets.forEach(budget => {
                const li = document.createElement('li');
                li.className = 'list-group-item d-flex justify-content-between align-items-center';
                li.innerHTML = `
                    <a href="#" class="budget-item" data-id="${budget.id}">${budget.name}</a>
                    <button class="btn btn-sm btn-outline-light delete-budget-btn" data-id="${budget.id}">
                        <i class="fas fa-trash-alt"></i>
                    </button>
                `;
                elements.savedBudgetsList.appendChild(li);
            });
            
            this.attachBudgetEventHandlers();
        },
        
        attachBudgetEventHandlers() {
            // Add event listeners to the budget items
            document.querySelectorAll('.budget-item').forEach(item => {
                item.addEventListener('click', (e) => {
                    e.preventDefault();
                    const budgetId = e.target.getAttribute('data-id');
                    this.loadSavedBudget(budgetId);
                    sidebarManager.toggle(); // Close sidebar after selection
                });
            });
            
            // Add event listeners to delete buttons
            document.querySelectorAll('.delete-budget-btn').forEach(btn => {
                btn.addEventListener('click', (e) => {
                    e.stopPropagation();
                    const budgetId = e.target.closest('button').getAttribute('data-id');
                    this.deleteSavedBudget(budgetId);
                });
            });
        },
        
        loadSavedBudget(budgetId) {
            const budget = savedBudgets.find(b => b.id === budgetId);
            if (!budget) return;
            
            // Set current budget state
            budgetState.totalBudget = budget.totalBudget;
            budgetState.currentSpending = budget.currentSpending;
            budgetState.currentBudgetName = budget.name;
            budgetState.currentBudgetId = budget.id;
            budgetState.isEditMode = true;
            
            // Update input value
            elements.totalBudgetInput.value = budgetState.totalBudget;
            
            // Clear and load list items
            elements.budgetList.innerHTML = '';
            
            if (budget.items && Array.isArray(budget.items)) {
                dataManager.loadBudgetItems(budget.items);
            }
            
            // Update UI
            uiManager.updateAll();
            uiManager.updateSaveButtonState();
            dataManager.saveToLocalStorage();
        },
        
        deleteSavedBudget(budgetId) {
            savedBudgets = savedBudgets.filter(b => b.id !== budgetId);
            this.updateSavedBudgetsList();
            dataManager.saveToLocalStorage();
        },

        saveBudget(budgetName) {
            if (!budgetName) return false;
            
            // Update existing budget if in edit mode
            if (budgetState.isEditMode && budgetState.currentBudgetId) {
                return this.updateBudget(budgetName);
            }
            
            // Create a new budget
            const budgetId = Date.now().toString();
            const budget = this.createBudgetObject(budgetId, budgetName);
            
            // Add to saved budgets
            savedBudgets.push(budget);
            
            // Update current budget info
            budgetState.currentBudgetName = budgetName;
            budgetState.currentBudgetId = budgetId;
            budgetState.isEditMode = true;
            
            // Update UI
            this.updateSavedBudgetsList();
            uiManager.updateSaveButtonState();
            dataManager.saveToLocalStorage();
            
            return true;
        },
        
        updateBudget(budgetName) {
            const index = savedBudgets.findIndex(b => b.id === budgetState.currentBudgetId);
            if (index === -1) return false;
            
            // Create updated budget object
            const updatedBudget = this.createBudgetObject(
                budgetState.currentBudgetId, 
                budgetName
            );
            
            // Update in the array
            savedBudgets[index] = updatedBudget;
            
            // Update current budget name
            budgetState.currentBudgetName = budgetName;
            
            // Update UI
            this.updateSavedBudgetsList();
            dataManager.saveToLocalStorage();
            
            return true;
        },
        
        createBudgetObject(id, name) {
            return {
                id: id,
                name: name,
                totalBudget: budgetState.totalBudget,
                currentSpending: budgetState.currentSpending,
                items: Array.from(elements.budgetList.children).map(item => item.outerHTML),
                createdAt: new Date().toISOString(),
                updatedAt: new Date().toISOString()
            };
        },
        
        createNewBudget() {
            // Reset current budget ID and edit mode
            budgetState.currentBudgetId = null;
            budgetState.isEditMode = false;
            budgetState.currentBudgetName = 'New Budget';
            
            // Update UI
            uiManager.updateSaveButtonState();
        }
    };

    // ================ SIDEBAR MANAGEMENT ================
    const sidebarManager = {
        toggle() {
            elements.sidebar.classList.toggle(UI_CLASSES.ACTIVE);
            elements.sidebarOverlay.classList.toggle(UI_CLASSES.ACTIVE);
            document.body.classList.toggle('sidebar-open');
        },

        setup() {
            // Event listeners for sidebar
            if (elements.menuButton) {
                elements.menuButton.addEventListener('click', this.toggle);
            }

            if (elements.closeSidebarBtn) {
                elements.closeSidebarBtn.addEventListener('click', this.toggle);
            }

            if (elements.sidebarOverlay) {
                elements.sidebarOverlay.addEventListener('click', this.toggle);
            }

            // Close sidebar when clicking a link (for mobile UX)
            if (elements.sidebarLinks) {
                elements.sidebarLinks.forEach(link => {
                    link.addEventListener('click', this.toggle);
                });
            }
        }
    };

    // ================ ITEMS MANAGEMENT ================
    const itemsManager = {
        handleAddItem(event) {
            event.preventDefault();

            const itemName = elements.itemNameInput.value.trim();
            const amountValue = elements.itemAmountInput.value.trim();

            if (!itemName || !amountValue) return;

            try {
                const amount = parseFloat(amountValue);
                if (isNaN(amount) || amount <= 0) return;

                // Format amount to 2 decimal places
                const formattedAmount = amount.toFixed(2);

                // Check if item already exists
                const existingItem = this.findExistingItem(itemName);

                if (existingItem) {
                    this.incrementExistingItem(existingItem);
                } else {
                    this.addNewItem(itemName, amount, formattedAmount);
                }

                // Update UI
                uiManager.updateAll();

                // Save to localStorage
                dataManager.saveToLocalStorage();

                // Reset form
                elements.form.reset();
            } catch (error) {
                console.error('Error adding item:', error);
            }
        },

        findExistingItem(itemName) {
            const existingItems = Array.from(elements.budgetList.querySelectorAll('li'));
            return existingItems.find(item => {
                const itemNameElement = item.querySelector('strong');
                return itemNameElement && itemNameElement.textContent === itemName;
            });
        },

        incrementExistingItem(existingItem) {
            const quantityElement = existingItem.querySelector('.item-quantity');
            const currentQuantity = parseInt(quantityElement.textContent, 10);
            quantityElement.textContent = currentQuantity + 1;

            // Update the total price
            const badgeElement = existingItem.querySelector('.badge');
            const unitPrice = parseFloat(badgeElement.getAttribute('data-unit-price'));
            const newTotal = (unitPrice * (currentQuantity + 1)).toFixed(2);
            badgeElement.textContent = `$${newTotal}`;

            // Update spending (add just the unit price)
            budgetState.currentSpending += unitPrice;
        },

        addNewItem(itemName, amount, formattedAmount) {
            // Update budget state
            budgetState.currentSpending += amount;

            // Create list item with quantity controls
            const listItem = document.createElement('li');
            listItem.className = 'list-group-item d-flex justify-content-between align-items-center';
            listItem.innerHTML = `
                <div>
                    <strong>${itemName}</strong>
                    <span class="badge bg-primary rounded-pill ms-2" data-unit-price="${formattedAmount}">$${formattedAmount}</span>
                </div>
                <div class="d-flex align-items-center">
                    <button class="btn btn-outline-secondary btn-sm decrement-btn">-</button>
                    <span class="mx-2 item-quantity">1</span>
                    <button class="btn btn-outline-secondary btn-sm increment-btn">+</button>
                    <button class="btn btn-danger btn-sm delete-btn ms-3">Delete</button>
                </div>
            `;

            // Add event listeners to the buttons
            dataManager.attachItemEventHandlers(listItem);

            // Add to list
            elements.budgetList.appendChild(listItem);
        },

        handleIncrementItem(event) {
            const listItem = event.target.closest('li');
            if (!listItem) return;

            try {
                const quantityElement = listItem.querySelector('.item-quantity');
                const badgeElement = listItem.querySelector('.badge');
                const unitPriceAttr = badgeElement.getAttribute('data-unit-price');

                if (quantityElement && badgeElement && unitPriceAttr) {
                    const unitPrice = parseFloat(unitPriceAttr);
                    const currentQuantity = parseInt(quantityElement.textContent, 10);
                    const newQuantity = currentQuantity + 1;

                    // Update quantity display
                    quantityElement.textContent = newQuantity;

                    // Update price display
                    const newTotal = (unitPrice * newQuantity).toFixed(2);
                    badgeElement.textContent = `$${newTotal}`;

                    // Update budget state
                    budgetState.currentSpending += unitPrice;

                    // Update UI
                    uiManager.updateAll();

                    // Save to localStorage
                    dataManager.saveToLocalStorage();
                }
            } catch (error) {
                console.error('Error incrementing item:', error);
            }
        },

        handleDecrementItem(event) {
            const listItem = event.target.closest('li');
            if (!listItem) return;

            try {
                const quantityElement = listItem.querySelector('.item-quantity');
                const badgeElement = listItem.querySelector('.badge');
                const unitPriceAttr = badgeElement.getAttribute('data-unit-price');

                if (quantityElement && badgeElement && unitPriceAttr) {
                    const unitPrice = parseFloat(unitPriceAttr);
                    const currentQuantity = parseInt(quantityElement.textContent, 10);

                    if (currentQuantity <= 1) {
                        // If quantity is 1 or less, delete the item
                        this.handleDeleteItem({ target: listItem.querySelector('.delete-btn') });
                        return;
                    }

                    const newQuantity = currentQuantity - 1;

                    // Update quantity display
                    quantityElement.textContent = newQuantity;

                    // Update price display
                    const newTotal = (unitPrice * newQuantity).toFixed(2);
                    badgeElement.textContent = `$${newTotal}`;

                    // Update budget state
                    budgetState.currentSpending -= unitPrice;

                    // Update UI
                    uiManager.updateAll();

                    // Save to localStorage
                    dataManager.saveToLocalStorage();
                }
            } catch (error) {
                console.error('Error decrementing item:', error);
            }
        },

        handleDeleteItem(event) {
            const listItem = event.target.closest('li');
            if (!listItem) {
                console.error('List item not found. Ensure the delete button is inside a list item.');
                return;
            }

            try {
                // Get amount from badge
                const badgeElement = listItem.querySelector('.badge');
                if (!badgeElement) {
                    console.error('Badge element not found inside the list item.');
                    return;
                }

                const amountText = badgeElement.textContent;
                const amount = parseFloat(amountText.replace('$', ''));

                if (!isNaN(amount)) {
                    // Update budget state
                    budgetState.currentSpending -= amount;
                } else {
                    console.error('Invalid amount found in the badge element.');
                }

                // Remove item from the list
                elements.budgetList.removeChild(listItem);

                // Update UI
                uiManager.updateAll();

                // Save to localStorage
                dataManager.saveToLocalStorage();
            } catch (error) {
                console.error('Error deleting item:', error);
            }
        },

        handleClearAllItems() {
            if (elements.budgetList.children.length === 0) {
                console.log('No items to clear');
                return;
            }

            // Clear the list
            elements.budgetList.innerHTML = '';
            budgetState.currentSpending = 0;

            // Update UI
            uiManager.updateAll();

            // Save to localStorage
            dataManager.saveToLocalStorage();

            // If we cleared all items from an existing budget, create a new budget
            if (budgetState.isEditMode && budgetState.currentBudgetId) {
                savedBudgetsManager.createNewBudget();
            }
        }
    };

    // ================ BUDGET MANAGEMENT ================
    const budgetManager = {
        handleBudgetChange() {
            const inputValue = elements.totalBudgetInput.value.trim();

            try {
                const newBudget = parseFloat(inputValue);
                if (!isNaN(newBudget)) {
                    budgetState.totalBudget = newBudget;

                    // Update UI
                    uiManager.updateAll();

                    // Save to localStorage
                    dataManager.saveToLocalStorage();
                }
            } catch (error) {
                console.error('Error updating budget:', error);
            }
        },

        handleSaveBudget() {
            // If editing an existing budget, pre-fill the name
            if (budgetState.isEditMode && budgetState.currentBudgetId) {
                elements.budgetNameInput.value = budgetState.currentBudgetName;
            } else {
                elements.budgetNameInput.value = '';
            }
            
            // The modal is already configured to show via data-mdb-toggle attribute
        },
        
        handleConfirmSaveBudget() {
            const budgetName = elements.budgetNameInput.value.trim();
            if (!budgetName) {
                alert('Please enter a budget name');
                return;
            }
            
            const isUpdate = budgetState.isEditMode && budgetState.currentBudgetId;
            const success = savedBudgetsManager.saveBudget(budgetName);
            
            if (success) {
                // Close modal
                const saveBudgetModal = mdb.Modal.getInstance(document.getElementById('saveBudgetModal'));
                saveBudgetModal.hide();
                
                // Reset the form
                elements.budgetNameInput.value = '';
                
                // Show success message
                uiManager.showSaveSuccess(isUpdate);
            }
        }
    };

    // ================ EVENT LISTENERS ================
    function setupEventListeners() {
        // Form and budget input
        elements.form.addEventListener('submit', itemsManager.handleAddItem.bind(itemsManager));
        elements.totalBudgetInput.addEventListener('input', budgetManager.handleBudgetChange);
        
        // Save budget button
        if (elements.saveBudgetBtn) {
            elements.saveBudgetBtn.addEventListener('click', budgetManager.handleSaveBudget);
        }
        
        // Confirm save button
        if (elements.confirmSaveBtn) {
            elements.confirmSaveBtn.addEventListener('click', budgetManager.handleConfirmSaveBudget);
        }
        
        // Clear all button
        const confirmClearBtn = document.getElementById('confirm-clear-btn');
        if (confirmClearBtn) {
            confirmClearBtn.addEventListener('click', itemsManager.handleClearAllItems);
        }

        // New budget button
        if (elements.newBudgetBtn) {
            elements.newBudgetBtn.addEventListener('click', () => {
                // Clear the current budget
                elements.budgetList.innerHTML = '';
                elements.totalBudgetInput.value = '';
                budgetState.totalBudget = 0;
                budgetState.currentSpending = 0;
                
                // Reset edit mode
                savedBudgetsManager.createNewBudget();
                
                // Update UI
                uiManager.updateAll();
                dataManager.saveToLocalStorage();
                
                // Close sidebar
                sidebarManager.toggle();
            });
        }

        // Setup sidebar events
        sidebarManager.setup();
    }

    // ================ INITIALIZATION ================
    function initializeApp() {
        chartModule.initialize();
        dataManager.loadFromLocalStorage();
        uiManager.updateEmptyListVisibility();
        uiManager.updateSaveButtonState(); // Initialize the save button state
        setupEventListeners();

        // Initialize Material Design Bootstrap components
        document.querySelectorAll('.form-outline').forEach((formOutline) => {
            new mdb.Input(formOutline).init();
        });
    }

    // Start the app
    initializeApp();
});
