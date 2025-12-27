import { useState, useEffect } from "react";
import { useClientIP } from "./useClientIP";

interface PaymentMethodData {
  paymentMethod: "chapa" | "stripe";
  currency: "ETB" | "USD";
  country: string;
  countryCode: string;
  isEthiopia: boolean;
  loading: boolean;
  error: string | null;
  ip: string;
  service: string;
}

const PAYMENT_CACHE_MS = 10 * 60 * 1000; // 10 minutes
let cachedPayment:
  | Omit<PaymentMethodData, "loading">
  | null = null;
let cachedPaymentAt = 0;
let pendingPaymentPromise: Promise<Omit<PaymentMethodData, "loading">> | null =
  null;

export function usePaymentMethod(): PaymentMethodData {
  const [data, setData] = useState<PaymentMethodData>({
    paymentMethod: "chapa", // Default to Chapa
    currency: "ETB",
    country: "Ethiopia",
    countryCode: "ET",
    isEthiopia: true,
    loading: true,
    error: null,
    ip: "127.0.0.1",
    service: "fallback",
  });

  const { ip: clientIP, loading: ipLoading, error: ipError } = useClientIP();

  useEffect(() => {
    const detectPaymentMethod = async () => {
      try {
        // Wait for IP detection to complete
        if (ipLoading) {
          return;
        }

        // Use cached result if fresh (and for same IP when available)
        if (
          cachedPayment &&
          Date.now() - cachedPaymentAt < PAYMENT_CACHE_MS &&
          (!cachedPayment.ip || cachedPayment.ip === clientIP)
        ) {
          setData({ ...cachedPayment, loading: false });
          return;
        }

        // If another component already triggered detection, await it
        if (pendingPaymentPromise) {
          const shared = await pendingPaymentPromise;
          cachedPayment = shared;
          cachedPaymentAt = Date.now();
          setData({ ...shared, loading: false });
          return;
        }

        setData((prev) => ({ ...prev, loading: true, error: null }));

        pendingPaymentPromise = (async () => {
          const response = await fetch("/api/get-country", {
            cache: "force-cache",
          });
          const result = await response.json();

          if (result.success) {
            return {
            paymentMethod: result.paymentMethod,
            currency: result.currency,
            country: result.country,
            countryCode: result.countryCode,
            isEthiopia: result.isEthiopia,
            error: null,
            ip: result.ip,
            service: result.service || "unknown",
            } as Omit<PaymentMethodData, "loading">;
          }
          throw new Error(result.error || "Failed to detect country");
        })();

        const resolved = await pendingPaymentPromise;
        cachedPayment = resolved;
        cachedPaymentAt = Date.now();
        setData({ ...resolved, loading: false });
      } catch (error) {
        console.error("Payment method detection error:", error);
        setData((prev) => ({
          ...prev,
          loading: false,
          error: error instanceof Error ? error.message : "Unknown error",
        }));
      } finally {
        pendingPaymentPromise = null;
      }
    };

    detectPaymentMethod();
  }, [clientIP, ipLoading]);

  return data;
}
