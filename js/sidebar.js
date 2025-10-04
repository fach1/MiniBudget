import { UI_CLASSES } from './constants.js';

export function createSidebarManager(elements) {
  return {
    toggle() {
      elements.sidebar.classList.toggle(UI_CLASSES.ACTIVE);
      elements.sidebarOverlay.classList.toggle(UI_CLASSES.ACTIVE);
      document.body.classList.toggle('sidebar-open');
    },
    setup() {
      if (elements.menuButton) elements.menuButton.addEventListener('click', () => this.toggle());
      if (elements.closeSidebarBtn) elements.closeSidebarBtn.addEventListener('click', () => this.toggle());
      if (elements.sidebarOverlay) elements.sidebarOverlay.addEventListener('click', () => this.toggle());
      if (elements.sidebarLinks) {
        elements.sidebarLinks.forEach(link => {
          link.addEventListener('click', () => this.toggle());
        });
      }
    }
  };
}
