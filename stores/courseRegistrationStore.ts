import { create } from "zustand";
import { TCourse } from "@/lib/definations";
import { TQuestion } from "@/components/ActivityManager";

interface CourseRegistrationState {
  // Form state
  formData: Partial<TCourse>;
  
  // Upload states
  selectedVideoFile: File | null;
  isVideoUploading: boolean;
  isThumbnailUploading: boolean;
  videoPreviewUrl: string;
  
  // Data loading
  isDataLoaded: boolean;
  finalExamQuestions: TQuestion[];
  
  // Actions
  setFormData: (data: Partial<TCourse>) => void;
  updateFormField: <K extends keyof TCourse>(field: K, value: TCourse[K]) => void;
  setSelectedVideoFile: (file: File | null) => void;
  setIsVideoUploading: (uploading: boolean) => void;
  setIsThumbnailUploading: (uploading: boolean) => void;
  setVideoPreviewUrl: (url: string) => void;
  setIsDataLoaded: (loaded: boolean) => void;
  setFinalExamQuestions: (questions: TQuestion[]) => void;
  addFinalExamQuestion: (question: TQuestion) => void;
  removeFinalExamQuestion: (index: number) => void;
  updateFinalExamQuestion: (index: number, question: TQuestion) => void;
  reset: () => void;
}

const initialFormData: Partial<TCourse> = {
  titleEn: "",
  titleAm: "",
  aboutEn: "",
  aboutAm: "",
  instructorId: "",
  thumbnail: "",
  video: "",
  price: 0,
  dolarPrice: 0,
  birrPrice: 0,
  level: "beginner",
  duration: "01:09",
  language: "Amharic",
  certificate: false,
  requirement: [],
  courseFor: [],
  activity: [],
  courseMaterials: [],
  accessAm: "በሞባይል ፣ በኮምፒተር ላይ መጠቀም",
  accessEn: "Access on mobile, computer",
  instructorRate: 0,
  sellerRate: 0,
  affiliateRate: 0,
  channelId: "",
  finalExamQuestions: [],
};

export const useCourseRegistrationStore = create<CourseRegistrationState>(
  (set) => ({
    formData: initialFormData,
    selectedVideoFile: null,
    isVideoUploading: false,
    isThumbnailUploading: false,
    videoPreviewUrl: "",
    isDataLoaded: false,
    finalExamQuestions: [],

    setFormData: (data) => set({ formData: { ...initialFormData, ...data } }),

    updateFormField: (field, value) =>
      set((state) => ({
        formData: { ...state.formData, [field]: value },
      })),

    setSelectedVideoFile: (file) => set({ selectedVideoFile: file }),

    setIsVideoUploading: (uploading) => set({ isVideoUploading: uploading }),

    setIsThumbnailUploading: (uploading) =>
      set({ isThumbnailUploading: uploading }),

    setVideoPreviewUrl: (url) => set({ videoPreviewUrl: url }),

    setIsDataLoaded: (loaded) => set({ isDataLoaded: loaded }),

    setFinalExamQuestions: (questions) =>
      set({ finalExamQuestions: questions }),

    addFinalExamQuestion: (question) =>
      set((state) => ({
        finalExamQuestions: [...state.finalExamQuestions, question],
      })),

    removeFinalExamQuestion: (index) =>
      set((state) => ({
        finalExamQuestions: state.finalExamQuestions.filter((_, i) => i !== index),
      })),

    updateFinalExamQuestion: (index, question) =>
      set((state) => ({
        finalExamQuestions: state.finalExamQuestions.map((q, i) =>
          i === index ? question : q
        ),
      })),

    reset: () =>
      set({
        formData: initialFormData,
        selectedVideoFile: null,
        isVideoUploading: false,
        isThumbnailUploading: false,
        videoPreviewUrl: "",
        isDataLoaded: false,
        finalExamQuestions: [],
      }),
  })
);

