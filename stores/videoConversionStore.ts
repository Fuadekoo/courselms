import { create } from "zustand";
import { devtools, persist } from "zustand/middleware";

export interface VideoFile {
  filename: string;
  baseName: string;
  isConverted: boolean;
  hlsDir: string | null;
  manifestPath: string | null;
  jobId?: string;
  status?: "pending" | "queued" | "processing" | "completed" | "failed";
}

interface VideoConversionState {
  // Data
  videos: VideoFile[];
  stats: {
    total: number;
    converted: number;
    pending: number;
  };

  // Loading states
  isLoading: boolean;
  converting: string[]; // Array of filenames being converted

  // Cache timestamp
  timestamp: number | null;

  // Actions
  setVideos: (videos: VideoFile[]) => void;
  setStats: (stats: { total: number; converted: number; pending: number }) => void;
  setLoading: (loading: boolean) => void;
  addConverting: (filename: string) => void;
  removeConverting: (filename: string) => void;
  updateVideoStatus: (filename: string, updates: Partial<VideoFile>) => void;
  refresh: () => boolean; // Returns true if data was fresh, false if not
  clear: () => void;

  // Cache helpers
  isFresh: () => boolean;
}

const CACHE_DURATION = 2 * 60 * 1000; // 2 minutes cache

export const useVideoConversionStore = create<VideoConversionState>()(
  devtools(
    persist(
      (set, get) => ({
        // Initial state
        videos: [],
        stats: {
          total: 0,
          converted: 0,
          pending: 0,
        },
        isLoading: false,
        converting: [],
        timestamp: null,

        // Actions
        setVideos: (videos) =>
          set(
            {
              videos,
              timestamp: Date.now(),
            },
            false,
            "setVideos"
          ),

        setStats: (stats) =>
          set(
            {
              stats,
            },
            false,
            "setStats"
          ),

        setLoading: (loading) =>
          set(
            {
              isLoading: loading,
            },
            false,
            "setLoading"
          ),

        addConverting: (filename) =>
          set(
            (state) => ({
              converting: [...state.converting.filter((f) => f !== filename), filename],
            }),
            false,
            "addConverting"
          ),

        removeConverting: (filename) =>
          set(
            (state) => ({
              converting: state.converting.filter((f) => f !== filename),
            }),
            false,
            "removeConverting"
          ),

        updateVideoStatus: (filename, updates) =>
          set(
            (state) => ({
              videos: state.videos.map((video) =>
                video.filename === filename ? { ...video, ...updates } : video
              ),
            }),
            false,
            "updateVideoStatus"
          ),

        refresh: () => {
          const state = get();
          if (state.isFresh()) {
            return true;
          }
          set({ timestamp: Date.now() }, false, "refresh");
          return false;
        },

        clear: () =>
          set(
            {
              videos: [],
              stats: {
                total: 0,
                converted: 0,
                pending: 0,
              },
              isLoading: false,
              converting: [],
              timestamp: null,
            },
            false,
            "clear"
          ),

        // Cache helpers
        isFresh: () => {
          const state = get();
          if (!state.timestamp) return false;
          return Date.now() - state.timestamp < CACHE_DURATION;
        },
      }),
      {
        name: "video-conversion-store",
        partialize: (state) => ({
          videos: state.videos,
          stats: state.stats,
          timestamp: state.timestamp,
        }),
      }
    ),
    { name: "VideoConversionStore" }
  )
);

// Optimized selector hooks
export const useVideoConversionVideos = () =>
  useVideoConversionStore((state) => state.videos);

export const useVideoConversionStats = () =>
  useVideoConversionStore((state) => state.stats);

export const useVideoConversionLoading = () =>
  useVideoConversionStore((state) => state.isLoading);

// Individual action hooks to prevent re-renders
export const useVideoConversionSetVideos = () =>
  useVideoConversionStore((state) => state.setVideos);

export const useVideoConversionSetStats = () =>
  useVideoConversionStore((state) => state.setStats);

export const useVideoConversionSetLoading = () =>
  useVideoConversionStore((state) => state.setLoading);

export const useVideoConversionAddConverting = () =>
  useVideoConversionStore((state) => state.addConverting);

export const useVideoConversionRemoveConverting = () =>
  useVideoConversionStore((state) => state.removeConverting);

export const useVideoConversionUpdateVideoStatus = () =>
  useVideoConversionStore((state) => state.updateVideoStatus);

export const useVideoConversionRefresh = () =>
  useVideoConversionStore((state) => state.refresh);

export const useVideoConversionClear = () =>
  useVideoConversionStore((state) => state.clear);

export const useVideoConversionIsFresh = () =>
  useVideoConversionStore((state) => state.isFresh);

export const useVideoConversionConverting = () =>
  useVideoConversionStore((state) => state.converting);

// Stable initial state for SSR
const initialState: VideoConversionState = {
  videos: [],
  stats: { total: 0, converted: 0, pending: 0 },
  isLoading: false,
  converting: [],
  timestamp: null,
  setVideos: () => {},
  setStats: () => {},
  setLoading: () => {},
  addConverting: () => {},
  removeConverting: () => {},
  updateVideoStatus: () => {},
  refresh: () => false,
  clear: () => {},
  isFresh: () => false,
};

// Helper to get server snapshot (cached to prevent infinite loops)
let cachedServerSnapshot: VideoConversionState | null = null;
const getServerSnapshot = (): VideoConversionState => {
  if (!cachedServerSnapshot) {
    cachedServerSnapshot = initialState;
  }
  return cachedServerSnapshot;
};

