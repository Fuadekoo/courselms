import { create } from "zustand";

interface UploadState {
  file: File | null;
  progress: number;
  isUploading: boolean;
  error: string | null;
  uploadedUrl: string | null;
}

interface UploadStore {
  // Upload states by key
  uploads: Record<string, UploadState>;
  
  // Actions
  startUpload: (key: string, file: File) => void;
  updateProgress: (key: string, progress: number) => void;
  completeUpload: (key: string, url: string) => void;
  failUpload: (key: string, error: string) => void;
  cancelUpload: (key: string) => void;
  clearUpload: (key: string) => void;
  getUploadState: (key: string) => UploadState | undefined;
  clearAllUploads: () => void;
}

const createInitialUploadState = (): UploadState => ({
  file: null,
  progress: 0,
  isUploading: false,
  error: null,
  uploadedUrl: null,
});

export const useUploadStore = create<UploadStore>((set, get) => ({
  uploads: {},

  startUpload: (key, file) =>
    set((state) => ({
      uploads: {
        ...state.uploads,
        [key]: {
          file,
          progress: 0,
          isUploading: true,
          error: null,
          uploadedUrl: null,
        },
      },
    })),

  updateProgress: (key, progress) =>
    set((state) => {
      const upload = state.uploads[key];
      if (!upload) return state;
      return {
        uploads: {
          ...state.uploads,
          [key]: { ...upload, progress },
        },
      };
    }),

  completeUpload: (key, url) =>
    set((state) => {
      const upload = state.uploads[key];
      if (!upload) return state;
      return {
        uploads: {
          ...state.uploads,
          [key]: {
            ...upload,
            isUploading: false,
            progress: 100,
            uploadedUrl: url,
          },
        },
      };
    }),

  failUpload: (key, error) =>
    set((state) => {
      const upload = state.uploads[key];
      if (!upload) return state;
      return {
        uploads: {
          ...state.uploads,
          [key]: {
            ...upload,
            isUploading: false,
            error,
          },
        },
      };
    }),

  cancelUpload: (key) =>
    set((state) => {
      const { [key]: _, ...rest } = state.uploads;
      return { uploads: rest };
    }),

  clearUpload: (key) =>
    set((state) => {
      const { [key]: _, ...rest } = state.uploads;
      return { uploads: rest };
    }),

  getUploadState: (key) => {
    return get().uploads[key];
  },

  clearAllUploads: () => set({ uploads: {} }),
}));

// Selector hooks
export const useUploadState = (key: string) =>
  useUploadStore((state) => state.uploads[key]);

export const useIsUploading = (key: string) =>
  useUploadStore((state) => state.uploads[key]?.isUploading ?? false);

export const useUploadProgress = (key: string) =>
  useUploadStore((state) => state.uploads[key]?.progress ?? 0);

