document.addEventListener('DOMContentLoaded', () => {
    // DOM Elements
    const elements = {
        form: document.querySelector('form'),
        budgetList: document.querySelector('#budget-list ul'),
        emptyListMessage: document.querySelector('#empty-list'),
        clearItemsBtn: document.querySelector('#clear-items'),
        totalBudgetInput: document.querySelector('#total-budget-input'),
        totalBudgetDisplay: document.querySelector('#total-budget'),
        budgetChartCanvas: document.querySelector('#budget-chart'),
        remainingBudgetDisplay: document.querySelector('#remaining-budget'),
        itemNameInput: document.querySelector('#item-name'),
        itemAmountInput: document.querySelector('#amount')
    };

    // Ensure all elements are found
    if (!elements.form || !elements.budgetList || !elements.clearItemsBtn || !elements.totalBudgetInput) {
        console.error('One or more DOM elements are missing. Please check the HTML structure.');
        return;
    }

    // Budget state
    const budgetState = {
        totalBudget: 0,
        currentSpending: 0,
        items: []
    };

    let doughnutChart;

    // Initialize the Doughnut Chart
    const initializeChart = () => {
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
    };

    // Update the Doughnut Chart
    const updateChart = () => {
        if (!doughnutChart) return;

        const spent = budgetState.currentSpending;
        const remaining = Math.max(budgetState.totalBudget - spent, 0);

        doughnutChart.data.datasets[0].data = [spent, remaining];
        doughnutChart.update();
    };

    // Update UI based on budget state
    const updateUI = () => {
        // Update budget displays
        elements.totalBudgetDisplay.textContent = `$${budgetState.totalBudget.toFixed(2)}`;

        const remaining = budgetState.totalBudget - budgetState.currentSpending;
        elements.remainingBudgetDisplay.textContent = `$${remaining.toFixed(2)}`;
        elements.remainingBudgetDisplay.className = remaining < 0 ? 'text-danger' : 'text-primary';

        // Update chart
        updateChart();

        // Update empty list message
        updateEmptyListVisibility();
    };

    // Update empty list message visibility
    const updateEmptyListVisibility = () => {
        if (elements.budgetList.children.length === 0) {
            elements.emptyListMessage.style.display = 'block';
        } else {
            elements.emptyListMessage.style.display = 'none';
        }
    };

    // Save budget state to localStorage
    const saveToLocalStorage = () => {
        try {
            localStorage.setItem('budgetAppData', JSON.stringify({
                totalBudget: budgetState.totalBudget,
                currentSpending: budgetState.currentSpending,
                items: Array.from(elements.budgetList.children).map(item => item.outerHTML)
            }));
        } catch (error) {
            console.error('Error saving to localStorage:', error);
        }
    };

    // Load budget state from localStorage
    const loadFromLocalStorage = () => {
        try {
            const savedData = localStorage.getItem('budgetAppData');
            if (!savedData) return;

            const data = JSON.parse(savedData);

            // Update budget state
            budgetState.totalBudget = data.totalBudget || 0;
            budgetState.currentSpending = data.currentSpending || 0;

            // Set the input value
            elements.totalBudgetInput.value = budgetState.totalBudget;

            // Clear and reload list items
            elements.budgetList.innerHTML = '';

            if (data.items && Array.isArray(data.items)) {
                data.items.forEach(itemHTML => {
                    const tempDiv = document.createElement('div');
                    tempDiv.innerHTML = itemHTML;
                    const listItem = tempDiv.firstChild;

                    // Make sure we have valid elements with the proper event handlers
                    const deleteBtn = listItem.querySelector('.delete-btn');
                    if (deleteBtn) {
                        deleteBtn.addEventListener('click', handleDeleteItem);
                    }

                    const incrementBtn = listItem.querySelector('.increment-btn');
                    if (incrementBtn) {
                        incrementBtn.addEventListener('click', handleIncrementItem);
                    }

                    const decrementBtn = listItem.querySelector('.decrement-btn');
                    if (decrementBtn) {
                        decrementBtn.addEventListener('click', handleDecrementItem);
                    }

                    elements.budgetList.appendChild(listItem);
                });
            }

            // Update UI
            updateUI();
        } catch (error) {
            console.error('Error loading from localStorage:', error);
            // Reset to defaults if there's an error
            budgetState.totalBudget = 0;
            budgetState.currentSpending = 0;
            elements.budgetList.innerHTML = '';
            updateUI();
        }
    };

    // Handle add item form submission
    const handleAddItem = (event) => {
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
            const existingItems = Array.from(elements.budgetList.querySelectorAll('li'));
            const existingItem = existingItems.find(item => {
                const itemNameElement = item.querySelector('strong');
                return itemNameElement && itemNameElement.textContent === itemName;
            });

            if (existingItem) {
                // If item exists, increment its quantity
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
            } else {
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
                const deleteBtn = listItem.querySelector('.delete-btn');
                deleteBtn.addEventListener('click', handleDeleteItem);

                const incrementBtn = listItem.querySelector('.increment-btn');
                incrementBtn.addEventListener('click', handleIncrementItem);

                const decrementBtn = listItem.querySelector('.decrement-btn');
                decrementBtn.addEventListener('click', handleDecrementItem);

                // Add to list
                elements.budgetList.appendChild(listItem);
            }

            // Update UI
            updateUI();

            // Save to localStorage
            saveToLocalStorage();

            // Reset form
            elements.form.reset();
        } catch (error) {
            console.error('Error adding item:', error);
        }
    };

    const handleIncrementItem = (event) => {
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
                updateUI();

                // Save to localStorage
                saveToLocalStorage();
            }
        } catch (error) {
            console.error('Error incrementing item:', error);
        }
    };

    const handleDecrementItem = (event) => {
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
                    handleDeleteItem({ target: listItem.querySelector('.delete-btn') });
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
                updateUI();

                // Save to localStorage
                saveToLocalStorage();
            }
        } catch (error) {
            console.error('Error decrementing item:', error);
        }
    };

    // Handle delete item click
    const handleDeleteItem = (event) => {
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
            updateUI();

            // Save to localStorage
            saveToLocalStorage();

            console.log('Item deleted successfully.');
        } catch (error) {
            console.error('Error deleting item:', error);
        }
    };

    // Handle total budget input change
    const handleBudgetChange = () => {
        const inputValue = elements.totalBudgetInput.value.trim();

        try {
            const newBudget = parseFloat(inputValue);
            if (!isNaN(newBudget)) {
                budgetState.totalBudget = newBudget;

                // Update UI
                updateUI();

                // Save to localStorage
                saveToLocalStorage();
            }
        } catch (error) {
            console.error('Error updating budget:', error);
        }
    };

    // Handle clear all items
    const handleClearAllItems = () => {
        if (elements.budgetList.children.length === 0) {
            console.log('No items to clear');
            return;
        }

        // Clear the list
        elements.budgetList.innerHTML = '';
        budgetState.currentSpending = 0;

        // Update UI
        updateUI();

        // Save to localStorage
        saveToLocalStorage();

        console.log('All items cleared successfully');
    };

    // Add event listeners
    elements.form.addEventListener('submit', handleAddItem);
    elements.totalBudgetInput.addEventListener('input', handleBudgetChange);

    // Add event listener for the "Clear All" button
    const confirmClearBtn = document.getElementById('confirm-clear-btn');
    confirmClearBtn.addEventListener('click', handleClearAllItems);

    // Initialize app
    initializeChart();
    loadFromLocalStorage();
    updateEmptyListVisibility();
});
