import { create } from "zustand";

interface UIState {
  // Sidebar state
  sidebarOpen: boolean;
  sidebarCollapsed: boolean;
  sidebarVisible: boolean; // isSide from context
  
  // Modal states
  modals: Record<string, boolean>;
  
  // Toast/Notification state
  notifications: Array<{
    id: string;
    type: "success" | "error" | "warning" | "info";
    message: string;
    duration?: number;
  }>;
  
  // Loading states
  globalLoading: boolean;
  loadingStates: Record<string, boolean>;
  
  // Actions
  setSidebarOpen: (open: boolean) => void;
  toggleSidebar: () => void;
  setSidebarCollapsed: (collapsed: boolean) => void;
  toggleSidebarCollapsed: () => void;
  setSidebarVisible: (visible: boolean) => void;
  toggleSidebarVisible: () => void;
  openModal: (modalId: string) => void;
  closeModal: (modalId: string) => void;
  toggleModal: (modalId: string) => void;
  isModalOpen: (modalId: string) => boolean;
  addNotification: (notification: Omit<UIState["notifications"][0], "id">) => void;
  removeNotification: (id: string) => void;
  setGlobalLoading: (loading: boolean) => void;
  setLoadingState: (key: string, loading: boolean) => void;
  getLoadingState: (key: string) => boolean;
  reset: () => void;
}

const initialState = {
  sidebarOpen: false,
  sidebarCollapsed: true, // Default to collapsed (icon-only view)
  sidebarVisible: false,
  modals: {} as Record<string, boolean>,
  notifications: [] as UIState["notifications"],
  globalLoading: false,
  loadingStates: {} as Record<string, boolean>,
};

export const useUIStore = create<UIState>((set, get) => ({
  ...initialState,

  setSidebarOpen: (open) => set({ sidebarOpen: open }),

  toggleSidebar: () => set((state) => ({ sidebarOpen: !state.sidebarOpen })),

  setSidebarCollapsed: (collapsed) => set({ sidebarCollapsed: collapsed }),

  toggleSidebarCollapsed: () =>
    set((state) => ({ sidebarCollapsed: !state.sidebarCollapsed })),

  setSidebarVisible: (visible) => set({ sidebarVisible: visible }),

  toggleSidebarVisible: () =>
    set((state) => ({ sidebarVisible: !state.sidebarVisible })),

  openModal: (modalId) =>
    set((state) => ({
      modals: { ...state.modals, [modalId]: true },
    })),

  closeModal: (modalId) =>
    set((state) => {
      const { [modalId]: _, ...rest } = state.modals;
      return { modals: rest };
    }),

  toggleModal: (modalId) =>
    set((state) => ({
      modals: {
        ...state.modals,
        [modalId]: !state.modals[modalId],
      },
    })),

  isModalOpen: (modalId) => {
    return get().modals[modalId] ?? false;
  },

  addNotification: (notification) => {
    const id = `notification-${Date.now()}-${Math.random()}`;
    set((state) => ({
      notifications: [...state.notifications, { ...notification, id }],
    }));
    
    // Auto-remove after duration
    if (notification.duration) {
      setTimeout(() => {
        get().removeNotification(id);
      }, notification.duration);
    }
  },

  removeNotification: (id) =>
    set((state) => ({
      notifications: state.notifications.filter((n) => n.id !== id),
    })),

  setGlobalLoading: (loading) => set({ globalLoading: loading }),

  setLoadingState: (key, loading) =>
    set((state) => ({
      loadingStates: { ...state.loadingStates, [key]: loading },
    })),

  getLoadingState: (key) => {
    return get().loadingStates[key] ?? false;
  },

  reset: () => set(initialState),
}));

// Selector hooks
export const useSidebarState = () => {
  const sidebarOpen = useUIStore((state) => state.sidebarOpen);
  const sidebarCollapsed = useUIStore((state) => state.sidebarCollapsed);
  const sidebarVisible = useUIStore((state) => state.sidebarVisible);
  return { open: sidebarOpen, collapsed: sidebarCollapsed, visible: sidebarVisible };
};

export const useModalState = (modalId: string) =>
  useUIStore((state) => state.modals[modalId] ?? false);

export const useNotifications = () =>
  useUIStore((state) => state.notifications);

export const useGlobalLoading = () =>
  useUIStore((state) => state.globalLoading);

