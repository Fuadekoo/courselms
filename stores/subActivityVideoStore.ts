import { create } from "zustand";

interface VideoUploadState {
  activityIndex: number;
  subActivityIndex: number;
  isUploading: boolean;
  progress?: number;
}

interface SubActivityVideoStore {
  // Upload states for tracking multiple uploads
  uploadStates: Record<string, VideoUploadState>;

  // Actions
  setUploading: (
    activityIndex: number,
    subActivityIndex: number,
    isUploading: boolean,
    progress?: number
  ) => void;

  clearUploadState: (
    activityIndex: number,
    subActivityIndex: number
  ) => void;

  clearAllUploadStates: () => void;
}

const getKey = (
  activityIndex: number,
  subActivityIndex: number
): string => {
  return `${activityIndex}-${subActivityIndex}`;
};

export const useSubActivityVideoStore = create<SubActivityVideoStore>(
  (set, get) => ({
    uploadStates: {},

    setUploading: (
      activityIndex: number,
      subActivityIndex: number,
      isUploading: boolean,
      progress?: number
    ) => {
      const key = getKey(activityIndex, subActivityIndex);
      const currentStates = get().uploadStates;

      if (isUploading) {
        set({
          uploadStates: {
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
        set({ uploadStates: rest });
      }
    },

    clearUploadState: (
      activityIndex: number,
      subActivityIndex: number
    ) => {
      const key = getKey(activityIndex, subActivityIndex);
      const currentStates = get().uploadStates;
      const { [key]: _, ...rest } = currentStates;
      set({ uploadStates: rest });
    },

    clearAllUploadStates: () => {
      set({ uploadStates: {} });
    },
  })
);

// Selector hook for getting upload state for a specific sub-activity
export const useSubActivityVideoUploadState = (
  activityIndex: number,
  subActivityIndex: number
): VideoUploadState | undefined => {
  const key = getKey(activityIndex, subActivityIndex);
  return useSubActivityVideoStore((state) => state.uploadStates[key]);
};

