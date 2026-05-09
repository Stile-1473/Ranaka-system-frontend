import { create } from "zustand";

export const useUiStore = create((set) => ({
  sidebarOpen: false,
  // Desktop defaults to the compact icon-pill nav the new shell is designed for.
  sidebarCollapsed: true,
  openSidebar: () => set({ sidebarOpen: true }),
  closeSidebar: () => set({ sidebarOpen: false }),
  toggleSidebar: () => set((state) => ({ sidebarOpen: !state.sidebarOpen })),
  toggleSidebarCollapse: () =>
    set((state) => ({ sidebarCollapsed: !state.sidebarCollapsed })),
}));
