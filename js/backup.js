// Backup / Restore module
export function createBackupManager({ budgetState, dataManager, uiManager, elements, savedBudgetsRef }) {
  function buildExportObject() {
    return {
      schemaVersion: 1,
      exportedAt: new Date().toISOString(),
      current: {
        totalBudget: budgetState.totalBudget,
        currentSpending: budgetState.currentSpending,
        currentBudgetName: budgetState.currentBudgetName,
        currentBudgetId: budgetState.currentBudgetId,
        isEditMode: budgetState.isEditMode,
        items: dataManager.serializeItems()
      },
      savedBudgets: savedBudgetsRef.array
    };
  }

  function downloadJSON(data, filename = 'minibudget-backup.json') {
    const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url; a.download = filename; a.click();
    URL.revokeObjectURL(url);
  }

  function exportData() {
    try {
      const obj = buildExportObject();
      downloadJSON(obj);
    } catch (e) {
      console.error('Error exporting data', e);
      alert('Error exporting data');
    }
  }

  function recalcSpendingFromItems(items) {
    return items.reduce((sum, it) => sum + ((it.unitPrice || 0) * (it.quantity || 1)), 0);
  }

  function applyImportedCurrent(current) {
    budgetState.totalBudget = current.totalBudget || 0;
    budgetState.currentBudgetName = current.currentBudgetName || 'Imported Budget';
    budgetState.currentBudgetId = current.currentBudgetId || null;
    budgetState.isEditMode = !!current.isEditMode && !!budgetState.currentBudgetId;
    // Recalcular spending desde items para coherencia
    const items = Array.isArray(current.items) ? current.items : [];
    budgetState.currentSpending = recalcSpendingFromItems(items);
    elements.totalBudgetInput.value = budgetState.totalBudget;
    dataManager.deserializeItems(items);
  }

  function importData(jsonString) {
    try {
      const data = JSON.parse(jsonString);
      if (!data || typeof data !== 'object') throw new Error('Invalid JSON');
      if (!Array.isArray(data.savedBudgets)) data.savedBudgets = [];
      // Sobrescribir savedBudgets manteniendo referencia
      savedBudgetsRef.array.splice(0, savedBudgetsRef.array.length, ...data.savedBudgets);
      if (data.current) {
        applyImportedCurrent(data.current);
      }
      uiManager.updateAll();
      uiManager.updateSaveButtonState();
      dataManager.saveToLocalStorage();
      alert('Backup importado correctamente.');
    } catch (e) {
      console.error('Error importing data', e);
      alert('Error al importar backup. Revisa el archivo.');
    }
  }

  function attachUI(exportBtnSelector, importBtnSelector, fileInputSelector, savedBudgetsManager) {
    const exportBtn = document.querySelector(exportBtnSelector);
    const importBtn = document.querySelector(importBtnSelector);
    const fileInput = document.querySelector(fileInputSelector);
    if (exportBtn) exportBtn.addEventListener('click', exportData);
    if (importBtn && fileInput) {
      importBtn.addEventListener('click', () => fileInput.click());
      fileInput.addEventListener('change', (e) => {
        const file = e.target.files && e.target.files[0];
        if (!file) return;
        const reader = new FileReader();
        reader.onload = (evt) => {
          importData(evt.target.result);
          if (savedBudgetsManager) savedBudgetsManager.updateSavedBudgetsList();
          fileInput.value = '';
        };
        reader.readAsText(file);
      });
    }
  }

  return { exportData, importData, attachUI };
}
