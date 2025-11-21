import { useEffect, useCallback } from 'react';
import { useUserStore } from '@/stores/useUserStore';
import { getUserName } from '@/actions/user/header';

/**
 * Hook to manage user data with caching
 */
export function useUserData() {
  const {
    userName,
    userId,
    userRole,
    isLoading,
    setUser,
    setLoading,
    isFresh,
    clear,
  } = useUserStore();

  const fetchUserName = useCallback(async (force = false) => {
    // Return cached data if fresh and not forcing refresh
    if (!force && isFresh() && userName) {
      return userName;
    }

    setLoading(true);
    try {
      const name = await getUserName();
      if (name) {
        // Store in Zustand - you'll need to expand this to get full user data
        setUser(name, userId || '', userRole || '');
      }
      setLoading(false);
      return name;
    } catch (error) {
      console.error('Error fetching user name:', error);
      setLoading(false);
      throw error;
    }
  }, [userName, userId, userRole, isFresh, setUser, setLoading]);

  // Auto-fetch on mount if data is stale
  useEffect(() => {
    if (!isFresh() && !isLoading && !userName) {
      fetchUserName();
    }
  }, []);

  return {
    userName,
    userId,
    userRole,
    isLoading,
    fetchUserName,
    setUser,
    clear,
  };
}

