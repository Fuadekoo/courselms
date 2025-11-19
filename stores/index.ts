/**
 * Centralized Zustand store exports
 * 
 * This file exports all Zustand stores for easy importing throughout the application.
 * 
 * Stores:
 * - courseRegistrationStore: Course registration form and upload state
 * - examStore: Final exam state management
 * - videoQAStore: Video Q&A state for instructors and students
 * - uiStore: UI state (modals, sidebar, notifications, loading)
 * - uploadStore: File upload state management
 * - subActivityThumbnailStore: SubActivity thumbnail upload state
 */

export * from "./courseRegistrationStore";
export * from "./examStore";
export * from "./videoQAStore";
export * from "./uiStore";
export * from "./uploadStore";
export * from "./subActivityThumbnailStore";

