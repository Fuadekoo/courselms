import { create } from "zustand";

interface ThumbnailUploadState {
  activityIndex: number;
  subActivityIndex: number;
  isUploading: boolean;
  progress?: number;
}

interface SubActivityThumbnailStore {
  // Upload states for tracking multiple uploads
  uploadStates: Record<string, ThumbnailUploadState>;
  
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

const getKey = (activityIndex: number, subActivityIndex: number): string => {
  return `${activityIndex}-${subActivityIndex}`;
};

export const useSubActivityThumbnailStore = create<SubActivityThumbnailStore>(
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
export const useSubActivityThumbnailUploadState = (
  activityIndex: number,
  subActivityIndex: number
): ThumbnailUploadState | undefined => {
  const key = getKey(activityIndex, subActivityIndex);
  return useSubActivityThumbnailStore(
    (state) => state.uploadStates[key]
  );
};

