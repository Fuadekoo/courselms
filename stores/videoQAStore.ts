import { create } from "zustand";

export interface VideoQuestion {
  id: string;
  question: string;
  timestamp?: number | null;
  createdAt: string;
  type: string; // "course" or "activity"
  student: {
    firstName: string;
    fatherName: string;
    lastName: string;
  };
  course: {
    titleEn: string;
    titleAm: string;
  };
  responses: VideoResponse[];
}

export interface VideoResponse {
  id: string;
  response: string;
  createdAt: string;
  instructor: {
    firstName: string;
    fatherName: string;
    lastName: string;
  };
}

interface VideoQAState {
  // Questions state
  questions: VideoQuestion[];
  loading: boolean;
  error: string | null;
  
  // UI state
  isOpen: boolean;
  searchTerm: string;
  filterType: "all" | "answered" | "unanswered";
  selectedQuestion: VideoQuestion | null;
  responseText: string;
  submitting: boolean;
  editingResponse: string | null;
  
  // Actions
  setQuestions: (questions: VideoQuestion[]) => void;
  addQuestion: (question: VideoQuestion) => void;
  updateQuestion: (id: string, question: Partial<VideoQuestion>) => void;
  removeQuestion: (id: string) => void;
  setLoading: (loading: boolean) => void;
  setError: (error: string | null) => void;
  setIsOpen: (isOpen: boolean) => void;
  setSearchTerm: (term: string) => void;
  setFilterType: (type: "all" | "answered" | "unanswered") => void;
  setSelectedQuestion: (question: VideoQuestion | null) => void;
  setResponseText: (text: string) => void;
  setSubmitting: (submitting: boolean) => void;
  setEditingResponse: (id: string | null) => void;
  addResponse: (questionId: string, response: VideoResponse) => void;
  updateResponse: (questionId: string, responseId: string, response: Partial<VideoResponse>) => void;
  reset: () => void;
}

const initialState = {
  questions: [] as VideoQuestion[],
  loading: false,
  error: null as string | null,
  isOpen: false,
  searchTerm: "",
  filterType: "all" as const,
  selectedQuestion: null as VideoQuestion | null,
  responseText: "",
  submitting: false,
  editingResponse: null as string | null,
};

export const useVideoQAStore = create<VideoQAState>((set, get) => ({
  ...initialState,

  setQuestions: (questions) => set({ questions }),

  addQuestion: (question) =>
    set((state) => ({ questions: [...state.questions, question] })),

  updateQuestion: (id, updates) =>
    set((state) => ({
      questions: state.questions.map((q) =>
        q.id === id ? { ...q, ...updates } : q
      ),
    })),

  removeQuestion: (id) =>
    set((state) => ({
      questions: state.questions.filter((q) => q.id !== id),
    })),

  setLoading: (loading) => set({ loading }),

  setError: (error) => set({ error }),

  setIsOpen: (isOpen) => set({ isOpen }),

  setSearchTerm: (term) => set({ searchTerm: term }),

  setFilterType: (type) => set({ filterType: type }),

  setSelectedQuestion: (question) => set({ selectedQuestion: question }),

  setResponseText: (text) => set({ responseText: text }),

  setSubmitting: (submitting) => set({ submitting }),

  setEditingResponse: (id) => set({ editingResponse: id }),

  addResponse: (questionId, response) =>
    set((state) => ({
      questions: state.questions.map((q) =>
        q.id === questionId
          ? { ...q, responses: [...(q.responses || []), response] }
          : q
      ),
    })),

  updateResponse: (questionId, responseId, updates) =>
    set((state) => ({
      questions: state.questions.map((q) =>
        q.id === questionId
          ? {
              ...q,
              responses: q.responses?.map((r) =>
                r.id === responseId ? { ...r, ...updates } : r
              ),
            }
          : q
      ),
    })),

  reset: () => set(initialState),
}));

// Selector hooks
export const useVideoQAQuestions = () =>
  useVideoQAStore((state) => state.questions);

export const useVideoQALoading = () =>
  useVideoQAStore((state) => state.loading);

export const useVideoQAFilteredQuestions = () =>
  useVideoQAStore(
    (state) => {
      let filtered = state.questions;

      // Filter by search term
      if (state.searchTerm) {
        filtered = filtered.filter((q) => {
          const searchLower = state.searchTerm.toLowerCase();
          return (
            q.question.toLowerCase().includes(searchLower) ||
            (q.student?.firstName?.toLowerCase().includes(searchLower)) ||
            (q.student?.fatherName?.toLowerCase().includes(searchLower)) ||
            (q.course?.titleEn?.toLowerCase().includes(searchLower)) ||
            (q.course?.titleAm?.toLowerCase().includes(searchLower))
          );
        });
      }

      // Filter by type
      if (state.filterType === "answered") {
        filtered = filtered.filter(
          (q) => q.responses && q.responses.length > 0
        );
      } else if (state.filterType === "unanswered") {
        filtered = filtered.filter(
          (q) => !q.responses || q.responses.length === 0
        );
      }

      return filtered;
    }
  );

