import { create } from 'zustand';

const useUIStore = create((set) => ({
  sidebarOpen: true,
  showSubscriptionModal: false,
  theme: 'dark',

  toggleSidebar: () => set((s) => ({ sidebarOpen: !s.sidebarOpen })),
  openSubscriptionModal: () => set({ showSubscriptionModal: true }),
  closeSubscriptionModal: () => set({ showSubscriptionModal: false }),
}));

export default useUIStore;
