export const budgetState = {
  totalBudget: 0,
  currentSpending: 0,
  items: [],
  currentBudgetName: 'Default Budget',
  currentBudgetId: null,
  isEditMode: false
};

export function resetState() {
  budgetState.totalBudget = 0;
  budgetState.currentSpending = 0;
  budgetState.items = [];
  budgetState.currentBudgetName = 'New Budget';
  budgetState.currentBudgetId = null;
  budgetState.isEditMode = false;
}
