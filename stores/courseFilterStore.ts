import { create } from "zustand";

export interface CourseFilterState {
  // Search and filters
  searchTerm: string;
  selectedLevel: string | null;
  selectedLanguage: string | null;
  priceRange: { min: number; max: number } | null;
  sortBy: "newest" | "oldest" | "price-low" | "price-high" | "popular";
  
  // Pagination
  currentPage: number;
  itemsPerPage: number;
  
  // View mode
  viewMode: "grid" | "list";
  
  // Actions
  setSearchTerm: (term: string) => void;
  setSelectedLevel: (level: string | null) => void;
  setSelectedLanguage: (language: string | null) => void;
  setPriceRange: (range: { min: number; max: number } | null) => void;
  setSortBy: (sort: "newest" | "oldest" | "price-low" | "price-high" | "popular") => void;
  setCurrentPage: (page: number) => void;
  setItemsPerPage: (items: number) => void;
  setViewMode: (mode: "grid" | "list") => void;
  clearFilters: () => void;
  reset: () => void;
}

const initialState = {
  searchTerm: "",
  selectedLevel: null,
  selectedLanguage: null,
  priceRange: null,
  sortBy: "newest" as const,
  currentPage: 1,
  itemsPerPage: 12,
  viewMode: "grid" as const,
};

export const useCourseFilterStore = create<CourseFilterState>((set) => ({
  ...initialState,

  setSearchTerm: (term) => set({ searchTerm: term, currentPage: 1 }),
  
  setSelectedLevel: (level) => set({ selectedLevel: level, currentPage: 1 }),
  
  setSelectedLanguage: (language) => set({ selectedLanguage: language, currentPage: 1 }),
  
  setPriceRange: (range) => set({ priceRange: range, currentPage: 1 }),
  
  setSortBy: (sort) => set({ sortBy: sort, currentPage: 1 }),
  
  setCurrentPage: (page) => set({ currentPage: page }),
  
  setItemsPerPage: (items) => set({ itemsPerPage: items, currentPage: 1 }),
  
  setViewMode: (mode) => set({ viewMode: mode }),
  
  clearFilters: () =>
    set({
      searchTerm: "",
      selectedLevel: null,
      selectedLanguage: null,
      priceRange: null,
      sortBy: "newest",
      currentPage: 1,
    }),
  
  reset: () => set(initialState),
}));

// Selector hooks for better performance
export const useCourseFilterSearch = () =>
  useCourseFilterStore((state) => state.searchTerm);

export const useCourseFilterLevel = () =>
  useCourseFilterStore((state) => state.selectedLevel);

export const useCourseFilterPagination = () =>
  useCourseFilterStore((state) => ({
    currentPage: state.currentPage,
    itemsPerPage: state.itemsPerPage,
  }));

export const useCourseFilterView = () =>
  useCourseFilterStore((state) => state.viewMode);

