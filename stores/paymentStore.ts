import { create } from "zustand";

export interface PaymentState {
  // Selected course for purchase
  selectedCourseId: string | null;
  courseDetails: {
    titleEn?: string;
    titleAm?: string;
    price?: number;
    dolarPrice?: number;
    birrPrice?: number;
    thumbnail?: string;
  } | null;
  
  // Payment method
  paymentMethod: "chapa" | "paypal" | "telebirr" | null;
  currency: "ETB" | "USD";
  
  // Payment process
  isProcessing: boolean;
  paymentStatus: "idle" | "processing" | "success" | "failed";
  transactionRef: string | null;
  errorMessage: string | null;
  
  // Affiliate tracking
  affiliateCode: string | null;
  
  // Actions
  selectCourse: (courseId: string, details: PaymentState["courseDetails"]) => void;
  clearSelection: () => void;
  
  setPaymentMethod: (method: "chapa" | "paypal" | "telebirr") => void;
  setCurrency: (currency: "ETB" | "USD") => void;
  
  startPayment: () => void;
  setPaymentProcessing: (processing: boolean) => void;
  setPaymentSuccess: (transactionRef: string) => void;
  setPaymentFailed: (error: string) => void;
  resetPaymentStatus: () => void;
  
  setAffiliateCode: (code: string | null) => void;
  
  reset: () => void;
}

const initialState = {
  selectedCourseId: null,
  courseDetails: null,
  paymentMethod: null,
  currency: "ETB" as const,
  isProcessing: false,
  paymentStatus: "idle" as const,
  transactionRef: null,
  errorMessage: null,
  affiliateCode: null,
};

export const usePaymentStore = create<PaymentState>((set) => ({
  ...initialState,

  selectCourse: (courseId, details) =>
    set({ selectedCourseId: courseId, courseDetails: details }),
  
  clearSelection: () => set({ selectedCourseId: null, courseDetails: null }),
  
  setPaymentMethod: (method) => set({ paymentMethod: method }),
  
  setCurrency: (currency) => set({ currency }),
  
  startPayment: () =>
    set({
      isProcessing: true,
      paymentStatus: "processing",
      errorMessage: null,
    }),
  
  setPaymentProcessing: (processing) => set({ isProcessing: processing }),
  
  setPaymentSuccess: (transactionRef) =>
    set({
      isProcessing: false,
      paymentStatus: "success",
      transactionRef,
      errorMessage: null,
    }),
  
  setPaymentFailed: (error) =>
    set({
      isProcessing: false,
      paymentStatus: "failed",
      errorMessage: error,
    }),
  
  resetPaymentStatus: () =>
    set({
      isProcessing: false,
      paymentStatus: "idle",
      transactionRef: null,
      errorMessage: null,
    }),
  
  setAffiliateCode: (code) => set({ affiliateCode: code }),
  
  reset: () => set(initialState),
}));

// Selector hooks
export const useSelectedCourse = () =>
  usePaymentStore((state) => ({
    courseId: state.selectedCourseId,
    details: state.courseDetails,
  }));

export const usePaymentMethod = () =>
  usePaymentStore((state) => state.paymentMethod);

export const usePaymentProcessing = () =>
  usePaymentStore((state) => state.isProcessing);

export const usePaymentStatus = () =>
  usePaymentStore((state) => ({
    status: state.paymentStatus,
    transactionRef: state.transactionRef,
    errorMessage: state.errorMessage,
  }));

