import { useState, useEffect } from "react";

interface IPData {
  ip: string;
  isLocalhost: boolean;
  loading: boolean;
  error: string | null;
}

const IP_CACHE_MS = 10 * 60 * 1000; // 10 minutes
let cachedIP: Omit<IPData, "loading"> | null = null;
let cachedIPAt = 0;
let pendingIPPromise: Promise<Omit<IPData, "loading">> | null = null;

export function useClientIP(): IPData {
  const [data, setData] = useState<IPData>({
    ip: "127.0.0.1",
    isLocalhost: true,
    loading: true,
    error: null,
  });

  useEffect(() => {
    const detectIP = async () => {
      try {
        // Use cached result if fresh
        if (cachedIP && Date.now() - cachedIPAt < IP_CACHE_MS) {
          setData({ ...cachedIP, loading: false });
          return;
        }

        // If another component already triggered detection, await it
        if (pendingIPPromise) {
          const shared = await pendingIPPromise;
          cachedIP = shared;
          cachedIPAt = Date.now();
          setData({ ...shared, loading: false });
          return;
        }

        setData((prev) => ({ ...prev, loading: true, error: null }));

        pendingIPPromise = (async () => {
          // Try server-side detection first
          const response = await fetch("/api/get-ip", { cache: "force-cache" });
          const result = await response.json();

          if (result.success) {
            return {
              ip: result.ip,
              isLocalhost: result.isLocalhost,
              error: null,
            };
          }
          throw new Error(result.error || "Failed to detect IP");
        })();

        const resolved = await pendingIPPromise;
        cachedIP = resolved;
        cachedIPAt = Date.now();
        setData({ ...resolved, loading: false });
      } catch (error) {
        console.error("IP detection error:", error);

        // Fallback: try client-side detection
        try {
          const response = await fetch("https://api.ipify.org?format=json");
          const data = await response.json();

          const resolved = {
            ip: data.ip,
            isLocalhost: false,
            error: null,
          };
          cachedIP = resolved;
          cachedIPAt = Date.now();
          setData({ ...resolved, loading: false });
        } catch (clientError) {
          console.error("Client-side IP detection failed:", clientError);
          setData((prev) => ({
            ...prev,
            loading: false,
            error: "Failed to detect IP from both server and client",
          }));
        }
      } finally {
        pendingIPPromise = null;
      }
    };

    detectIP();
  }, []);

  return data;
}
