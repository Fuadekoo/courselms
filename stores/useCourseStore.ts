import { create } from "zustand";
import { devtools, persist } from "zustand/middleware";

// Types
interface Course {
  id: string;
  titleEn: string;
  titleAm: string;
  descriptionEn?: string | null;
  descriptionAm?: string | null;
  thumbnail: string;
  level: string;
  price: number;
  birrPrice?: number | null;
  dolarPrice?: number | null;
  instructorRate?: number;
  sellerRate?: number;
  affiliateRate?: number;
  certificate?: boolean;
  _count?: {
    activity: number;
  };
  instructor?: {
    id: string;
    firstName: string | null;
    fatherName: string | null;
  };
}

interface CourseDetail extends Course {
  activity?: any[];
  // Add more detailed fields as needed
}

interface CourseState {
  // Data
  courses: Course[];
  courseDetails: Map<string, CourseDetail>;

  // Pagination & Filtering
  currentPage: number;
  totalPages: number;
  totalData: number;
  searchQuery: string;

  // Loading states
  isLoadingCourses: boolean;
  isLoadingCourseDetail: Map<string, boolean>;

  // Timestamps
  coursesTimestamp: number | null;
  courseDetailTimestamps: Map<string, number>;

  // Actions
  setCourses: (courses: Course[], totalData: number, totalPage: number) => void;
  setCourseDetail: (courseId: string, detail: CourseDetail) => void;
  setCurrentPage: (page: number) => void;
  setSearchQuery: (query: string) => void;
  setLoadingCourses: (loading: boolean) => void;
  setLoadingCourseDetail: (courseId: string, loading: boolean) => void;

  // Cache helpers
  isCoursesFresh: () => boolean;
  isCourseDetailFresh: (courseId: string) => boolean;
  getCourseDetail: (courseId: string) => CourseDetail | undefined;

  // Clear cache
  clearCourses: () => void;
  clearCourseDetail: (courseId: string) => void;
  clearAll: () => void;
}

const CACHE_DURATION = 5 * 60 * 1000; // 5 minutes
const COURSE_DETAIL_CACHE = 10 * 60 * 1000; // 10 minutes for individual course details

export const useCourseStore = create<CourseState>()(
  devtools(
    persist(
      (set, get) => ({
        // Initial state
        courses: [],
        courseDetails: new Map(),
        currentPage: 1,
        totalPages: 0,
        totalData: 0,
        searchQuery: "",
        isLoadingCourses: false,
        isLoadingCourseDetail: new Map(),
        coursesTimestamp: null,
        courseDetailTimestamps: new Map(),

        // Setters
        setCourses: (courses, totalData, totalPage) =>
          set({
            courses,
            totalData,
            totalPages: totalPage,
            coursesTimestamp: Date.now(),
            isLoadingCourses: false,
          }),

        setCourseDetail: (courseId, detail) => {
          const courseDetails = new Map(get().courseDetails);
          const timestamps = new Map(get().courseDetailTimestamps);
          const loadingMap = new Map(get().isLoadingCourseDetail);

          courseDetails.set(courseId, detail);
          timestamps.set(courseId, Date.now());
          loadingMap.set(courseId, false);

          set({
            courseDetails,
            courseDetailTimestamps: timestamps,
            isLoadingCourseDetail: loadingMap,
          });
        },

        setCurrentPage: (currentPage) => set({ currentPage }),
        setSearchQuery: (searchQuery) => set({ searchQuery }),
        setLoadingCourses: (isLoadingCourses) => set({ isLoadingCourses }),

        setLoadingCourseDetail: (courseId, loading) => {
          const loadingMap = new Map(get().isLoadingCourseDetail);
          loadingMap.set(courseId, loading);
          set({ isLoadingCourseDetail: loadingMap });
        },

        // Cache helpers
        isCoursesFresh: () => {
          const timestamp = get().coursesTimestamp;
          if (!timestamp) return false;
          return Date.now() - timestamp < CACHE_DURATION;
        },

        isCourseDetailFresh: (courseId) => {
          const timestamp = get().courseDetailTimestamps.get(courseId);
          if (!timestamp) return false;
          return Date.now() - timestamp < COURSE_DETAIL_CACHE;
        },

        getCourseDetail: (courseId) => {
          return get().courseDetails.get(courseId);
        },

        // Clear functions
        clearCourses: () =>
          set({
            courses: [],
            coursesTimestamp: null,
            totalData: 0,
            totalPages: 0,
          }),

        clearCourseDetail: (courseId) => {
          const courseDetails = new Map(get().courseDetails);
          const timestamps = new Map(get().courseDetailTimestamps);
          courseDetails.delete(courseId);
          timestamps.delete(courseId);
          set({ courseDetails, courseDetailTimestamps: timestamps });
        },

        clearAll: () =>
          set({
            courses: [],
            courseDetails: new Map(),
            coursesTimestamp: null,
            courseDetailTimestamps: new Map(),
            currentPage: 1,
            totalPages: 0,
            totalData: 0,
          }),
      }),
      {
        name: "course-storage",
        partialize: (state) => ({
          courses: state.courses,
          courseDetails: Array.from(state.courseDetails.entries()),
          coursesTimestamp: state.coursesTimestamp,
          courseDetailTimestamps: Array.from(
            state.courseDetailTimestamps.entries()
          ),
          currentPage: state.currentPage,
          totalPages: state.totalPages,
          totalData: state.totalData,
        }),
        // Custom serialization for Maps
        onRehydrateStorage: () => (state) => {
          if (state) {
            // Convert arrays back to Maps
            if (Array.isArray(state.courseDetails)) {
              state.courseDetails = new Map(state.courseDetails as any);
            }
            if (Array.isArray(state.courseDetailTimestamps)) {
              state.courseDetailTimestamps = new Map(
                state.courseDetailTimestamps as any
              );
            }
            if (!state.isLoadingCourseDetail) {
              state.isLoadingCourseDetail = new Map();
            }
          }
        },
      }
    ),
    { name: "CourseStore" }
  )
);
