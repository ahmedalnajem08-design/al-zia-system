import { create } from 'zustand';
import type { NavPage } from './types';

interface AppState {
  currentPage: NavPage;
  setCurrentPage: (page: NavPage) => void;
  selectedInvoiceId: string | null;
  setSelectedInvoiceId: (id: string | null) => void;
  selectedCustomerId: string | null;
  setSelectedCustomerId: (id: string | null) => void;
  selectedSupplierId: string | null;
  setSelectedSupplierId: (id: string | null) => void;
  sidebarOpen: boolean;
  setSidebarOpen: (open: boolean) => void;
  toggleSidebar: () => void;
  currentUser: { id: string; name: string; role: string } | null;
  setCurrentUser: (user: { id: string; name: string; role: string } | null) => void;
}

function getStoredUser() {
  if (typeof window === 'undefined') return null;
  try {
    const saved = localStorage.getItem('zia_user');
    return saved ? JSON.parse(saved) : null;
  } catch {
    return null;
  }
}

export const useAppStore = create<AppState>((set) => ({
  currentPage: 'dashboard',
  setCurrentPage: (page) => set({ currentPage: page }),
  selectedInvoiceId: null,
  setSelectedInvoiceId: (id) => set({ selectedInvoiceId: id }),
  selectedCustomerId: null,
  setSelectedCustomerId: (id) => set({ selectedCustomerId: id }),
  selectedSupplierId: null,
  setSelectedSupplierId: (id) => set({ selectedSupplierId: id }),
  sidebarOpen: true,
  setSidebarOpen: (open) => set({ sidebarOpen: open }),
  toggleSidebar: () => set((s) => ({ sidebarOpen: !s.sidebarOpen })),
  currentUser: getStoredUser(),
  setCurrentUser: (user) => {
    if (typeof window !== 'undefined') {
      if (user) {
        localStorage.setItem('zia_user', JSON.stringify(user));
      } else {
        localStorage.removeItem('zia_user');
      }
    }
    set({ currentUser: user });
  },
}));
