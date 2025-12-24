import { create } from "zustand";
import { devtools } from "zustand/middleware";

export interface Course {
  id: string;
  titleEn: string;
  titleAm: string;
  thumbnail: string;
}

export interface CourseAssignment {
  id: string;
  courseId: string;
  course: Course;
  order: number;
}

export interface Tag {
  id: string;
  name: string;
  order: number;
  courses: CourseAssignment[];
}

interface TagsState {
  // Data
  tags: Tag[];
  availableCourses: Course[];
  selectedTagId: string | null;

  // Loading states
  isLoading: boolean;
  isSaving: boolean;

  // Actions
  setTags: (tags: Tag[]) => void;
  setAvailableCourses: (courses: Course[]) => void;
  setSelectedTag: (tagId: string | null) => void;
  setLoading: (loading: boolean) => void;
  setSaving: (saving: boolean) => void;

  // Tag operations
  addTag: (tag: Tag) => void;
  updateTag: (id: string, updates: Partial<Tag>) => void;
  removeTag: (id: string) => void;
  reorderTags: (tagIds: string[]) => void;

  // Course assignment operations
  addCourseToTag: (tagId: string, assignment: CourseAssignment) => void;
  removeCourseFromTag: (tagId: string, assignmentId: string) => void;
  reorderCoursesInTag: (tagId: string, assignmentIds: string[]) => void;

  // Clear state
  clear: () => void;
}

const initialState = {
  tags: [],
  availableCourses: [],
  selectedTagId: null,
  isLoading: false,
  isSaving: false,
};

export const useTagsStore = create<TagsState>()(
  devtools(
    (set, get) => ({
      ...initialState,

      // Setters
      setTags: (tags) =>
        set({ tags }, false, "setTags"),

      setAvailableCourses: (courses) =>
        set({ availableCourses: courses }, false, "setAvailableCourses"),

      setSelectedTag: (tagId) =>
        set({ selectedTagId: tagId }, false, "setSelectedTag"),

      setLoading: (loading) =>
        set({ isLoading: loading }, false, "setLoading"),

      setSaving: (saving) =>
        set({ isSaving: saving }, false, "setSaving"),

      // Tag operations
      addTag: (tag) =>
        set(
          (state) => ({
            tags: [...state.tags, tag].sort((a, b) => a.order - b.order),
          }),
          false,
          "addTag"
        ),

      updateTag: (id, updates) =>
        set(
          (state) => ({
            tags: state.tags.map((tag) =>
              tag.id === id ? { ...tag, ...updates } : tag
            ),
          }),
          false,
          "updateTag"
        ),

      removeTag: (id) =>
        set(
          (state) => ({
            tags: state.tags.filter((tag) => tag.id !== id),
            selectedTagId: state.selectedTagId === id ? null : state.selectedTagId,
          }),
          false,
          "removeTag"
        ),

      reorderTags: (tagIds) =>
        set(
          (state) => {
            const tagMap = new Map(state.tags.map((tag) => [tag.id, tag]));
            const reorderedTags = tagIds
              .map((id) => tagMap.get(id))
              .filter((tag): tag is Tag => tag !== undefined)
              .map((tag, index) => ({ ...tag, order: index }));

            // Add any tags that weren't in the reorder list
            const remainingTags = state.tags.filter(
              (tag) => !tagIds.includes(tag.id)
            );
            return {
              tags: [...reorderedTags, ...remainingTags].sort(
                (a, b) => a.order - b.order
              ),
            };
          },
          false,
          "reorderTags"
        ),

      // Course assignment operations
      addCourseToTag: (tagId, assignment) =>
        set(
          (state) => ({
            tags: state.tags.map((tag) =>
              tag.id === tagId
                ? {
                    ...tag,
                    courses: [...tag.courses, assignment].sort(
                      (a, b) => a.order - b.order
                    ),
                  }
                : tag
            ),
          }),
          false,
          "addCourseToTag"
        ),

      removeCourseFromTag: (tagId, assignmentId) =>
        set(
          (state) => ({
            tags: state.tags.map((tag) =>
              tag.id === tagId
                ? {
                    ...tag,
                    courses: tag.courses.filter(
                      (course) => course.id !== assignmentId
                    ),
                  }
                : tag
            ),
          }),
          false,
          "removeCourseFromTag"
        ),

      reorderCoursesInTag: (tagId, assignmentIds) =>
        set(
          (state) => ({
            tags: state.tags.map((tag) => {
              if (tag.id !== tagId) return tag;

              const courseMap = new Map(
                tag.courses.map((course) => [course.id, course])
              );
              const reorderedCourses = assignmentIds
                .map((id) => courseMap.get(id))
                .filter(
                  (course): course is CourseAssignment => course !== undefined
                )
                .map((course, index) => ({ ...course, order: index }));

              // Add any courses that weren't in the reorder list
              const remainingCourses = tag.courses.filter(
                (course) => !assignmentIds.includes(course.id)
              );

              return {
                ...tag,
                courses: [...reorderedCourses, ...remainingCourses].sort(
                  (a, b) => a.order - b.order
                ),
              };
            }),
          }),
          false,
          "reorderCoursesInTag"
        ),

      clear: () => set(initialState, false, "clear"),
    }),
    { name: "TagsStore" }
  )
);

// Optimized selector hooks
export const useTags = () => useTagsStore((state) => state.tags);
export const useAvailableCourses = () =>
  useTagsStore((state) => state.availableCourses);
export const useSelectedTagId = () =>
  useTagsStore((state) => state.selectedTagId);
export const useTagsLoading = () => useTagsStore((state) => state.isLoading);
export const useTagsSaving = () => useTagsStore((state) => state.isSaving);

// Action hooks
export const useTagsSetTags = () => useTagsStore((state) => state.setTags);
export const useTagsSetAvailableCourses = () =>
  useTagsStore((state) => state.setAvailableCourses);
export const useTagsSetSelectedTag = () =>
  useTagsStore((state) => state.setSelectedTag);
export const useTagsSetLoading = () => useTagsStore((state) => state.setLoading);
export const useTagsSetSaving = () => useTagsStore((state) => state.setSaving);
export const useTagsAddTag = () => useTagsStore((state) => state.addTag);
export const useTagsUpdateTag = () => useTagsStore((state) => state.updateTag);
export const useTagsRemoveTag = () => useTagsStore((state) => state.removeTag);
export const useTagsReorderTags = () =>
  useTagsStore((state) => state.reorderTags);
export const useTagsAddCourseToTag = () =>
  useTagsStore((state) => state.addCourseToTag);
export const useTagsRemoveCourseFromTag = () =>
  useTagsStore((state) => state.removeCourseFromTag);
export const useTagsReorderCoursesInTag = () =>
  useTagsStore((state) => state.reorderCoursesInTag);

