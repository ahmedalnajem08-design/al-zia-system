import { create } from 'zustand';
import type { NavPage, Invoice } from './types';

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
}));
