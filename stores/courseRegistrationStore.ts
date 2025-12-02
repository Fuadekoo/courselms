import { create } from "zustand";
import { TCourse } from "@/lib/definations";
import { TQuestion } from "@/components/ActivityManager";

interface SubActivityVideoUploadState {
  activityIndex: number;
  subActivityIndex: number;
  isUploading: boolean;
  progress?: number;
}

interface CourseRegistrationState {
  // Form state
  formData: Partial<TCourse>;

  // Upload states
  selectedVideoFile: File | null;
  isVideoUploading: boolean;
  isThumbnailUploading: boolean;
  videoPreviewUrl: string;

  // SubActivity video upload states (key: "activityIndex-subActivityIndex")
  subActivityUploadStates: Record<string, SubActivityVideoUploadState>;

  // Data loading
  isDataLoaded: boolean;
  finalExamQuestions: TQuestion[];

  // Actions
  setFormData: (data: Partial<TCourse>) => void;
  updateFormField: <K extends keyof TCourse>(
    field: K,
    value: TCourse[K]
  ) => void;
  setSelectedVideoFile: (file: File | null) => void;
  setIsVideoUploading: (uploading: boolean) => void;
  setIsThumbnailUploading: (uploading: boolean) => void;
  setVideoPreviewUrl: (url: string) => void;
  setIsDataLoaded: (loaded: boolean) => void;
  setFinalExamQuestions: (questions: TQuestion[]) => void;
  addFinalExamQuestion: (question: TQuestion) => void;
  removeFinalExamQuestion: (index: number) => void;
  updateFinalExamQuestion: (index: number, question: TQuestion) => void;
  setActivities: (activities: TCourse["activity"]) => void;
  // SubActivity upload actions
  setSubActivityUploading: (
    activityIndex: number,
    subActivityIndex: number,
    isUploading: boolean,
    progress?: number
  ) => void;
  clearSubActivityUploadState: (
    activityIndex: number,
    subActivityIndex: number
  ) => void;
  clearAllSubActivityUploadStates: () => void;
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

const getSubActivityKey = (
  activityIndex: number,
  subActivityIndex: number
): string => {
  return `${activityIndex}-${subActivityIndex}`;
};

export const useCourseRegistrationStore = create<CourseRegistrationState>(
  (set, get) => ({
    formData: initialFormData,
    selectedVideoFile: null,
    isVideoUploading: false,
    isThumbnailUploading: false,
    videoPreviewUrl: "",
    subActivityUploadStates: {},
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
        finalExamQuestions: state.finalExamQuestions.filter(
          (_, i) => i !== index
        ),
      })),

    updateFinalExamQuestion: (index, question) =>
      set((state) => ({
        finalExamQuestions: state.finalExamQuestions.map((q, i) =>
          i === index ? question : q
        ),
      })),

    setActivities: (activities) =>
      set((state) => ({
        formData: { ...state.formData, activity: activities || [] },
      })),

    setSubActivityUploading: (
      activityIndex: number,
      subActivityIndex: number,
      isUploading: boolean,
      progress?: number
    ) => {
      const key = getSubActivityKey(activityIndex, subActivityIndex);
      const currentStates = get().subActivityUploadStates;

      if (isUploading) {
        set({
          subActivityUploadStates: {
            ...currentStates,
            [key]: {
              activityIndex,
              subActivityIndex,
              isUploading: true,
              progress,
            },
          },
        });
      } else {
        const { [key]: _, ...rest } = currentStates;
        set({ subActivityUploadStates: rest });
      }
    },

    clearSubActivityUploadState: (
      activityIndex: number,
      subActivityIndex: number
    ) => {
      const key = getSubActivityKey(activityIndex, subActivityIndex);
      const currentStates = get().subActivityUploadStates;
      const { [key]: _, ...rest } = currentStates;
      set({ subActivityUploadStates: rest });
    },

    clearAllSubActivityUploadStates: () => {
      set({ subActivityUploadStates: {} });
    },

    reset: () =>
      set({
        formData: initialFormData,
        selectedVideoFile: null,
        isVideoUploading: false,
        isThumbnailUploading: false,
        videoPreviewUrl: "",
        subActivityUploadStates: {},
        isDataLoaded: false,
        finalExamQuestions: [],
      }),
  })
);

// Selector hook for getting upload state for a specific sub-activity
export const useSubActivityVideoUploadState = (
  activityIndex: number,
  subActivityIndex: number
): SubActivityVideoUploadState | undefined => {
  const key = getSubActivityKey(activityIndex, subActivityIndex);
  // Subscribe to the entire uploadStates object to ensure re-renders when any upload state changes
  // Then extract the specific state we need
  const uploadStates = useCourseRegistrationStore(
    (state) => state.subActivityUploadStates
  );
  return uploadStates[key];
};
