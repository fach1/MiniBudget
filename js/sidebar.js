export function createSidebarManager(elements) {
  return {
    isOpen() {
      return elements.sidebar && !elements.sidebar.classList.contains('translate-x-full');
    },
    open() {
      if (!elements.sidebar || !elements.sidebarOverlay) return;
      elements.sidebar.classList.remove('translate-x-full');
      elements.sidebarOverlay.classList.remove('hidden');
      document.body.classList.add('sidebar-open');
    },
    close() {
      if (!elements.sidebar || !elements.sidebarOverlay) return;
      elements.sidebar.classList.add('translate-x-full');
      elements.sidebarOverlay.classList.add('hidden');
      document.body.classList.remove('sidebar-open');
    },
    toggle() {
      if (this.isOpen()) {
        this.close();
      } else {
        this.open();
      }
    },
    setup() {
      if (elements.menuButton) elements.menuButton.addEventListener('click', () => this.toggle());
      if (elements.closeSidebarBtn) elements.closeSidebarBtn.addEventListener('click', () => this.close());
      if (elements.sidebarOverlay) elements.sidebarOverlay.addEventListener('click', () => this.close());
      if (elements.sidebarLinks) {
        elements.sidebarLinks.forEach(link => {
          link.addEventListener('click', () => this.close());
        });
      }
    }
  };
}
