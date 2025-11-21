import { create } from 'zustand';
import { devtools, persist } from 'zustand/middleware';

interface UserState {
  // Data
  userName: string | null;
  userId: string | null;
  userRole: string | null;

  // Loading state
  isLoading: boolean;

  // Timestamp for cache
  timestamp: number | null;

  // Actions
  setUserName: (name: string) => void;
  setUserId: (id: string) => void;
  setUserRole: (role: string) => void;
  setUser: (name: string, id: string, role: string) => void;
  setLoading: (loading: boolean) => void;

  // Cache helpers
  isFresh: () => boolean;
  clear: () => void;
}

const CACHE_DURATION = 10 * 60 * 1000; // 10 minutes (user data changes less frequently)

export const useUserStore = create<UserState>()(
  devtools(
    persist(
      (set, get) => ({
        // Initial state
        userName: null,
        userId: null,
        userRole: null,
        isLoading: false,
        timestamp: null,

        // Setters
        setUserName: (userName) => set({ 
          userName, 
          timestamp: Date.now() 
        }),
        
        setUserId: (userId) => set({ 
          userId, 
          timestamp: Date.now() 
        }),
        
        setUserRole: (userRole) => set({ 
          userRole, 
          timestamp: Date.now() 
        }),
        
        setUser: (userName, userId, userRole) => set({ 
          userName, 
          userId, 
          userRole, 
          timestamp: Date.now(),
          isLoading: false 
        }),
        
        setLoading: (isLoading) => set({ isLoading }),

        // Cache freshness checker
        isFresh: () => {
          const timestamp = get().timestamp;
          if (!timestamp) return false;
          return Date.now() - timestamp < CACHE_DURATION;
        },

        // Clear function
        clear: () => set({
          userName: null,
          userId: null,
          userRole: null,
          timestamp: null,
        }),
      }),
      {
        name: 'user-storage',
        partialize: (state) => ({
          userName: state.userName,
          userId: state.userId,
          userRole: state.userRole,
          timestamp: state.timestamp,
        }),
      }
    ),
    { name: 'UserStore' }
  )
);

