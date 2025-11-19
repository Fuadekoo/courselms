import { create } from "zustand";

// ExamQuestion type matches the one used in the exam page
export interface ExamQuestion {
  id: string;
  text: string;
  options: Array<{ id: string; label: string }>;
  correctIndex: number;
  explanation?: string;
  previouslySelectedIndex: number;
}

interface ExamState {
  // Current exam state
  current: number;
  selected: number | null;
  answers: number[];
  submitted: boolean;
  reviewMode: "paged" | "all";
  showCongrats: boolean;
  examStartTime: Date | null;
  timeSpent: number;
  showHints: boolean;
  flaggedQuestions: Set<number>;
  autoSaving: boolean;
  confidenceLevels: number[];
  examProgress: number;
  
  // Questions data
  questions: ExamQuestion[];
  
  // Actions
  setCurrent: (index: number) => void;
  setSelected: (index: number | null) => void;
  setAnswers: (answers: number[]) => void;
  addAnswer: (questionIndex: number, answerIndex: number) => void;
  setSubmitted: (submitted: boolean) => void;
  setReviewMode: (mode: "paged" | "all") => void;
  setShowCongrats: (show: boolean) => void;
  setExamStartTime: (time: Date | null) => void;
  setTimeSpent: (time: number) => void;
  incrementTimeSpent: () => void;
  setShowHints: (show: boolean) => void;
  toggleFlaggedQuestion: (questionIndex: number) => void;
  setAutoSaving: (saving: boolean) => void;
  setConfidenceLevel: (questionIndex: number, level: number) => void;
  setConfidenceLevels: (levels: number[]) => void;
  setExamProgress: (progress: number) => void;
  setQuestions: (questions: ExamQuestion[]) => void;
  reset: () => void;
}

const initialState = {
  current: 0,
  selected: null,
  answers: [] as number[],
  submitted: false,
  reviewMode: "paged" as const,
  showCongrats: false,
  examStartTime: null,
  timeSpent: 0,
  showHints: false,
  flaggedQuestions: new Set<number>(),
  autoSaving: false,
  confidenceLevels: [] as number[],
  examProgress: 0,
  questions: [] as ExamQuestion[],
};

export const useExamStore = create<ExamState>((set, get) => ({
  ...initialState,

  setCurrent: (index) => set({ current: index }),

  setSelected: (index) => set({ selected: index }),

  setAnswers: (answers) => set({ answers }),

  addAnswer: (questionIndex, answerIndex) =>
    set((state) => {
      const newAnswers = [...state.answers];
      newAnswers[questionIndex] = answerIndex;
      return { answers: newAnswers };
    }),

  setSubmitted: (submitted) => set({ submitted }),

  setReviewMode: (mode) => set({ reviewMode: mode }),

  setShowCongrats: (show) => set({ showCongrats: show }),

  setExamStartTime: (time) => set({ examStartTime: time }),

  setTimeSpent: (time) => set({ timeSpent: time }),

  incrementTimeSpent: () =>
    set((state) => ({ timeSpent: state.timeSpent + 1 })),

  setShowHints: (show) => set({ showHints: show }),

  toggleFlaggedQuestion: (questionIndex) =>
    set((state) => {
      const newFlagged = new Set(state.flaggedQuestions);
      if (newFlagged.has(questionIndex)) {
        newFlagged.delete(questionIndex);
      } else {
        newFlagged.add(questionIndex);
      }
      return { flaggedQuestions: newFlagged };
    }),

  setAutoSaving: (saving) => set({ autoSaving: saving }),

  setConfidenceLevel: (questionIndex, level) =>
    set((state) => {
      const newLevels = [...state.confidenceLevels];
      newLevels[questionIndex] = level;
      return { confidenceLevels: newLevels };
    }),

  setConfidenceLevels: (levels) => set({ confidenceLevels: levels }),

  setExamProgress: (progress) => set({ examProgress: progress }),

  setQuestions: (questions) => set({ questions }),

  reset: () => set(initialState),
}));

// Selector hooks for optimized re-renders
export const useExamCurrent = () =>
  useExamStore((state) => state.current);

export const useExamAnswers = () =>
  useExamStore((state) => state.answers);

export const useExamSubmitted = () =>
  useExamStore((state) => state.submitted);

export const useExamQuestions = () =>
  useExamStore((state) => state.questions);

