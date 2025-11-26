"use client";

import { useEffect, useState, useCallback, useRef } from "react";
import { isEqual } from "lodash";
import { useUIStore } from "@/stores/uiStore";

export default function useData<Args extends unknown[], Data>({
  func,
  args,
  onSuccess,
  onError,
}: {
  func: (...args: Args) => Promise<Data>;
  args: Args;
  onSuccess?: (data: NonNullable<Awaited<Data>>) => void;
  onError?: (error: unknown) => void;
}): {
  data: Data | undefined;
  loading: boolean;
  refresh: () => void;
  error: unknown;
} {
  const [refresh, setRefresh] = useState(0),
    [data, setData] = useState<Data>(),
    [loading, setIsPending] = useState(false),
    [error, setError] = useState<unknown>(),
    prevArgsRef = useRef<Args>(undefined),
    loadingKeyRef = useRef<string | null>(null),
    setLoadingState = useUIStore((state) => state.setLoadingState),
    memoizedFunc = useCallback(() => {
      if (!isEqual(prevArgsRef.current, args)) {
        prevArgsRef.current = args;
      } else {
      }
      return func(...args);
    }, [func, ...args]);

  // Generate a unique key for this data fetch
  useEffect(() => {
    if (!loadingKeyRef.current) {
      loadingKeyRef.current = `data-${Date.now()}-${Math.random()}`;
    }
  }, []);

  useEffect(() => {
    let isMounted = true;

    const fetchData = async () => {
      setIsPending(true);
      // Register loading state globally
      if (loadingKeyRef.current) {
        setLoadingState(loadingKeyRef.current, true);
      }
      setError(null);
      try {
        const result = await memoizedFunc();
        if (isMounted) {
          setData(result);
          if (onSuccess && result) onSuccess(result);
        }
      } catch (err) {
        if (isMounted) {
          setError(err);
          if (onError) onError(err);
        }
      } finally {
        if (isMounted) {
          setIsPending(false);
          // Unregister loading state when done
          if (loadingKeyRef.current) {
            setLoadingState(loadingKeyRef.current, false);
          }
        }
      }
    };

    const debounceFetchData = setTimeout(fetchData, 300);

    return () => {
      isMounted = false;
      clearTimeout(debounceFetchData);
      // Clean up loading state on unmount
      if (loadingKeyRef.current) {
        setLoadingState(loadingKeyRef.current, false);
      }
    };
  }, [memoizedFunc, refresh, setLoadingState]);

  return {
    data,
    loading,
    error,
    refresh: () => setRefresh(Date.now()),
  };
}
