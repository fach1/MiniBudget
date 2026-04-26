export const budgetState = {
  totalBudget: 0,
  currentSpending: 0,
  items: [],
  currentBudgetName: 'Default Budget',
  currentBudgetId: null,
  isEditMode: false,
  taxRate: 0.08
};

export function resetState() {
  budgetState.totalBudget = 0;
  budgetState.currentSpending = 0;
  budgetState.items = [];
  budgetState.currentBudgetName = 'New Budget';
  budgetState.currentBudgetId = null;
  budgetState.isEditMode = false;
  budgetState.taxRate = 0.08;
}
