# Zustand Store Documentation

This directory contains all Zustand stores for global state management across the application.

## Store Overview

### 1. `courseRegistrationStore.ts`
Manages course registration form state and uploads.

**State:**
- `formData`: Partial course data
- `selectedVideoFile`: Currently selected video file
- `isVideoUploading`: Video upload status
- `isThumbnailUploading`: Thumbnail upload status
- `videoPreviewUrl`: Preview URL for video
- `isDataLoaded`: Whether course data has been loaded
- `finalExamQuestions`: Array of final exam questions

**Usage:**
```typescript
import { useCourseRegistrationStore } from "@/stores";

const formData = useCourseRegistrationStore((state) => state.formData);
const updateField = useCourseRegistrationStore((state) => state.updateFormField);
updateField("titleEn", "New Title");
```

### 2. `examStore.ts`
Manages final exam state including questions, answers, and progress.

**State:**
- `current`: Current question index
- `selected`: Currently selected answer
- `answers`: Array of all answers
- `submitted`: Whether exam is submitted
- `reviewMode`: "paged" or "all"
- `examStartTime`: When exam started
- `timeSpent`: Time spent in seconds
- `flaggedQuestions`: Set of flagged question indices
- `questions`: Array of exam questions

**Usage:**
```typescript
import { useExamStore, useExamCurrent } from "@/stores";

// Using selector hook (optimized)
const current = useExamCurrent();

// Using full store
const { setCurrent, addAnswer } = useExamStore();
setCurrent(5);
addAnswer(0, 2);
```

### 3. `videoQAStore.ts`
Manages video Q&A state for instructors and students.

**State:**
- `questions`: Array of video questions
- `loading`: Loading state
- `error`: Error message
- `isOpen`: Modal open state
- `searchTerm`: Search filter
- `filterType`: "all" | "answered" | "unanswered"
- `selectedQuestion`: Currently selected question
- `responseText`: Response text being typed

**Usage:**
```typescript
import { useVideoQAStore, useVideoQAFilteredQuestions } from "@/stores";

// Using selector hook for filtered questions
const filteredQuestions = useVideoQAFilteredQuestions();

// Using full store
const { setQuestions, addQuestion } = useVideoQAStore();
```

### 4. `uiStore.ts`
Manages UI state including modals, sidebar, notifications, and loading states.

**State:**
- `sidebarOpen`: Sidebar open state
- `sidebarCollapsed`: Sidebar collapsed state
- `sidebarVisible`: Sidebar visibility
- `modals`: Record of modal states by ID
- `notifications`: Array of notifications
- `globalLoading`: Global loading state
- `loadingStates`: Record of loading states by key

**Usage:**
```typescript
import { useUIStore, useSidebarState, useModalState } from "@/stores";

// Using selector hooks
const sidebar = useSidebarState();
const isModalOpen = useModalState("payment-modal");

// Using full store
const { openModal, closeModal, addNotification } = useUIStore();
openModal("payment-modal");
addNotification({
  type: "success",
  message: "Payment successful!",
  duration: 3000,
});
```

### 5. `uploadStore.ts`
Manages file upload states across the application.

**State:**
- `uploads`: Record of upload states by key

**Usage:**
```typescript
import { useUploadStore, useUploadState, useIsUploading } from "@/stores";

// Using selector hooks
const isUploading = useIsUploading("video-upload");
const uploadState = useUploadState("video-upload");

// Using full store
const { startUpload, updateProgress, completeUpload } = useUploadStore();
startUpload("video-upload", file);
updateProgress("video-upload", 50);
completeUpload("video-upload", "https://example.com/video.mp4");
```

### 6. `subActivityThumbnailStore.ts`
Manages SubActivity thumbnail upload states.

**State:**
- `uploadStates`: Record of upload states by activity/sub-activity key

**Usage:**
```typescript
import {
  useSubActivityThumbnailStore,
  useSubActivityThumbnailUploadState,
} from "@/stores";

// Using selector hook
const uploadState = useSubActivityThumbnailUploadState(0, 1);

// Using full store
const { setUploading, clearUploadState } = useSubActivityThumbnailStore();
setUploading(0, 1, true, 50);
```

## Best Practices

1. **Use Selector Hooks**: Always use selector hooks when possible to prevent unnecessary re-renders:
   ```typescript
   // ✅ Good - only re-renders when current changes
   const current = useExamCurrent();
   
   // ❌ Bad - re-renders on any store change
   const { current } = useExamStore();
   ```

2. **Shallow Comparison**: Use `shallow` from `zustand/shallow` for array/object selectors:
   ```typescript
   import { shallow } from "zustand/shallow";
   const answers = useExamStore((state) => state.answers, shallow);
   ```

3. **Action Separation**: Extract actions separately if you don't need state:
   ```typescript
   const setCurrent = useExamStore((state) => state.setCurrent);
   // This won't cause re-renders when state changes
   ```

4. **Key-based Uploads**: Use descriptive keys for uploads:
   ```typescript
   startUpload(`course-${courseId}-thumbnail`, file);
   startUpload(`activity-${activityId}-video`, file);
   ```

## Migration Guide

### From useState to Zustand

**Before:**
```typescript
const [isOpen, setIsOpen] = useState(false);
const [loading, setLoading] = useState(false);
```

**After:**
```typescript
import { useUIStore } from "@/stores";
const isOpen = useModalState("my-modal");
const setLoading = useUIStore((state) => state.setLoadingState);
setLoading("my-key", true);
```

### From Context to Zustand

**Before:**
```typescript
const { isCollapsed, setIsCollapsed } = useSidebar();
```

**After:**
```typescript
import { useSidebarState } from "@/stores";
const { collapsed } = useSidebarState();
const setCollapsed = useUIStore((state) => state.setSidebarCollapsed);
```

## Store Structure

All stores follow this pattern:
- State properties at the top
- Actions in the middle
- Selector hooks exported at the bottom
- `reset()` method to clear state

## Type Safety

All stores are fully typed with TypeScript. Import types when needed:
```typescript
import type { ExamState, VideoQAState } from "@/stores";
```

