"use client";

import React, { useEffect, useState, useCallback } from "react";
import { useParams } from "next/navigation";
import {
  Button,
  Card,
  CardBody,
  CardHeader,
  Input,
  Modal,
  ModalContent,
  ModalHeader,
  ModalBody,
  ModalFooter,
  useDisclosure,
  Chip,
  Spinner,
  Dropdown,
  DropdownTrigger,
  DropdownMenu,
  DropdownItem,
  Accordion,
  AccordionItem,
} from "@heroui/react";
import { Plus, Edit, Trash2, GripVertical, X, ChevronDown } from "lucide-react";
import { toast } from "sonner";
import Image from "next/image";
import {
  getTags,
  getCoursesForAssignment,
  createTag,
  updateTag,
  deleteTag,
  reorderTags,
  assignCourseToTag,
  assignCoursesToTag,
  removeCourseFromTag as removeCourseFromTagAction,
  reorderCoursesInTag,
} from "@/actions/manager/tags";
import {
  useTags,
  useAvailableCourses,
  useSelectedTagId,
  useTagsLoading,
  useTagsSaving,
  useTagsSetTags,
  useTagsSetAvailableCourses,
  useTagsSetSelectedTag,
  useTagsSetLoading,
  useTagsSetSaving,
  useTagsAddTag,
  useTagsUpdateTag,
  useTagsRemoveTag,
  useTagsReorderTags,
  useTagsAddCourseToTag,
  useTagsRemoveCourseFromTag,
  useTagsReorderCoursesInTag,
  type Tag,
  type Course,
  type CourseAssignment,
} from "@/stores/tagsStore";
import ScrollablePageWrapper from "@/components/layout/ScrollablePageWrapper";
import PageHeader from "@/components/layout/PageHeader";

export default function AssigningCourseToTagsPage() {
  const params = useParams<{ lang: string }>();
  const lang = params?.lang || "en";

  // Zustand store hooks
  const tags = useTags();
  const availableCourses = useAvailableCourses();
  const selectedTagId = useSelectedTagId();
  const isLoading = useTagsLoading();
  const isSaving = useTagsSaving();

  const setTags = useTagsSetTags();
  const setAvailableCourses = useTagsSetAvailableCourses();
  const setSelectedTag = useTagsSetSelectedTag();
  const setLoading = useTagsSetLoading();
  const setSaving = useTagsSetSaving();
  const addTag = useTagsAddTag();
  const updateTagStore = useTagsUpdateTag();
  const removeTag = useTagsRemoveTag();
  const reorderTagsStore = useTagsReorderTags();
  const addCourseToTag = useTagsAddCourseToTag();
  const removeCourseFromTag = useTagsRemoveCourseFromTag();
  const reorderCoursesInTagStore = useTagsReorderCoursesInTag();

  // Local state
  const [tagName, setTagName] = useState("");
  const [editingTag, setEditingTag] = useState<Tag | null>(null);
  const [draggedTagId, setDraggedTagId] = useState<string | null>(null);
  const [draggedCourseId, setDraggedCourseId] = useState<string | null>(null);
  const [draggedOverTagId, setDraggedOverTagId] = useState<string | null>(null);
  const [selectedCourses, setSelectedCourses] = useState<string[]>([]);

  const {
    isOpen: isTagModalOpen,
    onOpen: onTagModalOpen,
    onClose: onTagModalClose,
  } = useDisclosure();

  const {
    isOpen: isCourseModalOpen,
    onOpen: onCourseModalOpen,
    onClose: onCourseModalClose,
  } = useDisclosure();

  const {
    isOpen: isDeleteModalOpen,
    onOpen: onDeleteModalOpen,
    onClose: onDeleteModalClose,
  } = useDisclosure();

  const [deleteAction, setDeleteAction] = useState<{
    type: 'tag' | 'course';
    id: string;
    name?: string;
  } | null>(null);

  // Fetch data
  const fetchData = useCallback(async () => {
    try {
      setLoading(true);
      const [tagsResult, coursesResult] = await Promise.all([
        getTags(),
        getCoursesForAssignment(),
      ]);

      if (tagsResult.success) {
        setTags(tagsResult.data);
      } else {
        toast.error(tagsResult.message || "Failed to fetch tags");
      }

      if (coursesResult.success) {
        setAvailableCourses(coursesResult.data);
      } else {
        toast.error(coursesResult.message || "Failed to fetch courses");
      }
    } catch (error) {
      toast.error("Failed to fetch data");
      console.error(error);
    } finally {
      setLoading(false);
    }
  }, [setTags, setAvailableCourses, setLoading]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  // Tag operations
  const handleCreateTag = async () => {
    if (!tagName.trim()) {
      toast.error("Tag name is required");
      return;
    }

    try {
      setSaving(true);
      const result = await createTag(undefined, { name: tagName.trim() });
      if (result?.status) {
        toast.success("Tag created successfully");
        setTagName("");
        onTagModalClose();
        fetchData();
      } else {
        toast.error(result?.message || "Failed to create tag");
      }
    } catch (error) {
      toast.error("Failed to create tag");
    } finally {
      setSaving(false);
    }
  };

  const handleUpdateTag = async () => {
    if (!editingTag || !tagName.trim()) {
      toast.error("Tag name is required");
      return;
    }

    try {
      setSaving(true);
      const result = await updateTag(undefined, {
        id: editingTag.id,
        name: tagName.trim(),
      });
      if (result?.status) {
        toast.success("Tag updated successfully");
        setTagName("");
        setEditingTag(null);
        onTagModalClose();
        fetchData();
      } else {
        toast.error(result?.message || "Failed to update tag");
      }
    } catch (error) {
      toast.error("Failed to update tag");
    } finally {
      setSaving(false);
    }
  };

  const handleDeleteTag = async (tagId: string) => {
    const tag = tags.find(t => t.id === tagId);
    setDeleteAction({ type: 'tag', id: tagId, name: tag?.name });
    onDeleteModalOpen();
  };

  const handleEditTag = (tag: Tag) => {
    setEditingTag(tag);
    setTagName(tag.name);
    onTagModalOpen();
  };

  const handleOpenTagModal = () => {
    setEditingTag(null);
    setTagName("");
    onTagModalOpen();
  };

  // Tag drag and drop
  const handleTagDragStart = (e: React.DragEvent, tagId: string) => {
    setDraggedTagId(tagId);
    e.dataTransfer.effectAllowed = "move";
  };

  const handleTagDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    e.dataTransfer.dropEffect = "move";
  };

  const handleTagDrop = async (e: React.DragEvent, targetTagId: string) => {
    e.preventDefault();
    if (!draggedTagId || draggedTagId === targetTagId) {
      setDraggedTagId(null);
      return;
    }

    const currentTags = [...tags];
    const draggedIndex = currentTags.findIndex((t) => t.id === draggedTagId);
    const targetIndex = currentTags.findIndex((t) => t.id === targetTagId);

    if (draggedIndex === -1 || targetIndex === -1) {
      setDraggedTagId(null);
      return;
    }

    // Reorder in UI
    const [draggedTag] = currentTags.splice(draggedIndex, 1);
    currentTags.splice(targetIndex, 0, draggedTag);
    const newOrder = currentTags.map((t) => t.id);

    // Optimistic update
    reorderTagsStore(newOrder);

    try {
      setSaving(true);
      const result = await reorderTags(undefined, { tagIds: newOrder });
      if (!result?.status) {
        // Revert on error
        fetchData();
        toast.error(result?.message || "Failed to reorder tags");
      } else {
        toast.success("Tags reordered successfully");
      }
    } catch (error) {
      fetchData();
      toast.error("Failed to reorder tags");
    } finally {
      setSaving(false);
      setDraggedTagId(null);
    }
  };

  // Course assignment operations
  const handleAssignCourses = async (tagId: string, courseIds: string[]) => {
    if (courseIds.length === 0) {
      toast.error(lang === "en" ? "Please select at least one course" : "አንድ ኮርስ እባክዎን ይምረጡ");
      return;
    }

    try {
      setSaving(true);
      const result = await assignCoursesToTag(undefined, { tagId, courseIds });
      if (result?.status) {
        toast.success(result.message || "Courses assigned successfully");
        setSelectedCourses([]);
        fetchData();
        onCourseModalClose();
      } else {
        toast.error(result?.message || "Failed to assign courses");
      }
    } catch (error) {
      toast.error("Failed to assign courses");
    } finally {
      setSaving(false);
    }
  };

  const handleToggleCourse = (courseId: string) => {
    setSelectedCourses(prev => 
      prev.includes(courseId) 
        ? prev.filter(id => id !== courseId)
        : [...prev, courseId]
    );
  };

  const handleSelectAllCourses = () => {
    if (selectedCourses.length === unassignedCourses.length) {
      setSelectedCourses([]);
    } else {
      setSelectedCourses(unassignedCourses.map(c => c.id));
    }
  };

  const handleRemoveCourse = async (assignmentId: string, courseName?: string) => {
    setDeleteAction({ type: 'course', id: assignmentId, name: courseName });
    onDeleteModalOpen();
  };

  const confirmDelete = async () => {
    if (!deleteAction) return;

    try {
      setSaving(true);
      if (deleteAction.type === 'tag') {
        const result = await deleteTag(undefined, deleteAction.id);
        if (result?.status) {
          toast.success("Tag deleted successfully");
          fetchData();
        } else {
          toast.error(result?.message || "Failed to delete tag");
        }
      } else {
        const result = await removeCourseFromTagAction(undefined, deleteAction.id);
        if (result && result.status) {
          toast.success("Course removed successfully");
          fetchData();
        } else {
          toast.error((result && result.message) || "Failed to remove course");
        }
      }
    } catch (error) {
      toast.error(deleteAction.type === 'tag' ? "Failed to delete tag" : "Failed to remove course");
    } finally {
      setSaving(false);
      setDeleteAction(null);
      onDeleteModalClose();
    }
  };

  // Course drag and drop within tag
  const handleCourseDragStart = (e: React.DragEvent, assignmentId: string) => {
    setDraggedCourseId(assignmentId);
    e.dataTransfer.effectAllowed = "move";
  };

  const handleCourseDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    e.dataTransfer.dropEffect = "move";
  };

  const handleCourseDrop = async (
    e: React.DragEvent,
    targetAssignmentId: string,
    tagId: string
  ) => {
    e.preventDefault();
    if (!draggedCourseId || draggedCourseId === targetAssignmentId) {
      setDraggedCourseId(null);
      return;
    }

    const tag = tags.find((t) => t.id === tagId);
    if (!tag) {
      setDraggedCourseId(null);
      return;
    }

    const currentCourses = [...tag.courses];
    const draggedIndex = currentCourses.findIndex(
      (c) => c.id === draggedCourseId
    );
    const targetIndex = currentCourses.findIndex(
      (c) => c.id === targetAssignmentId
    );

    if (draggedIndex === -1 || targetIndex === -1) {
      setDraggedCourseId(null);
      return;
    }

    // Reorder in UI
    const [draggedCourse] = currentCourses.splice(draggedIndex, 1);
    currentCourses.splice(targetIndex, 0, draggedCourse);
    const newOrder = currentCourses.map((c) => c.id);

    // Optimistic update
    reorderCoursesInTagStore(tagId, newOrder);

    try {
      setSaving(true);
      const result = await reorderCoursesInTag(undefined, {
        tagId,
        assignmentIds: newOrder,
      });
      if (!result?.status) {
        // Revert on error
        fetchData();
        toast.error(result?.message || "Failed to reorder courses");
      } else {
        toast.success("Courses reordered successfully");
      }
    } catch (error) {
      fetchData();
      toast.error("Failed to reorder courses");
    } finally {
      setSaving(false);
      setDraggedCourseId(null);
    }
  };

  const handleOpenCourseModal = (tagId: string) => {
    setSelectedTag(tagId);
    setSelectedCourses([]);
    onCourseModalOpen();
  };

  const selectedTag = tags.find((t) => t.id === selectedTagId);
  const assignedCourseIds = selectedTag ? selectedTag.courses.map(c => c.courseId) : [];
  const unassignedCourses = availableCourses.filter(
    (course) => !assignedCourseIds.includes(course.id)
  );

  if (isLoading) {
    return (
      <ScrollablePageWrapper>
        <div className="flex items-center justify-center h-64">
          <Spinner size="lg" />
        </div>
      </ScrollablePageWrapper>
    );
  }

  return (
    <ScrollablePageWrapper>
      <PageHeader
        title={lang === "en" ? "Course Tags Management" : "የኮርስ መለያዎች አስተዳደር"}
        subtitle={
          lang === "en"
            ? "Manage tags and assign courses to tags"
            : "መለያዎችን ያቅዱ እና ኮርሶችን ለመለያዎች ይመድቡ"
        }
      />

      <div className="space-y-6">
        {/* Actions */}
        <div className="flex justify-between items-center">
          <Button
            color="primary"
            startContent={<Plus className="size-4" />}
            onPress={handleOpenTagModal}
            isDisabled={isSaving}
          >
            {lang === "en" ? "Create Tag" : "መለያ ይፍጠሩ"}
          </Button>
        </div>

        {/* Tags Accordion */}
        <Accordion variant="splitted">
          {tags.map((tag) => {
            const isDragging = draggedTagId === tag.id;
            return (
              <AccordionItem
                key={tag.id}
                aria-label={tag.name}
                title={
                  <div className="flex items-center justify-between w-full">
                    <div className="flex items-center gap-3">
                      <GripVertical className="size-5 text-default-400 cursor-move" />
                      <div>
                        <h3 className="text-lg font-semibold">{tag.name}</h3>
                        <p className="text-sm text-default-500">
                          {tag.courses.length} {lang === "en" ? "courses" : "ኮርሶች"}
                        </p>
                      </div>
                    </div>
                    <div className="flex gap-2">
                      <Button
                        size="sm"
                        variant="light"
                        isIconOnly
                        onPress={() => {
                          handleOpenCourseModal(tag.id);
                        }}
                      >
                        <Plus className="size-4" />
                      </Button>
                      <Button
                        size="sm"
                        variant="light"
                        isIconOnly
                        onPress={() => handleEditTag(tag)}
                      >
                        <Edit className="size-4" />
                      </Button>
                      <Button
                        size="sm"
                        variant="light"
                        color="danger"
                        isIconOnly
                        onPress={() => handleDeleteTag(tag.id)}
                        isDisabled={isSaving}
                      >
                        <Trash2 className="size-4" />
                      </Button>
                    </div>
                  </div>
                }
                className={`transition-all ${isDragging ? "opacity-50" : ""}`}
                onDragStart={(e) => handleTagDragStart(e, tag.id)}
                onDragOver={handleTagDragOver}
                onDrop={(e) => handleTagDrop(e, tag.id)}
              >
                {tag.courses.length > 0 ? (
                  <div className="space-y-2">
                    {tag.courses.map((assignment) => {
                      const isDraggingCourse = draggedCourseId === assignment.id;
                      return (
                        <div
                          key={assignment.id}
                          className={`flex items-center gap-3 p-3 rounded-lg border border-default-200 bg-default-50 dark:bg-default-100 transition-all ${
                            isDraggingCourse ? "opacity-50" : ""
                          }`}
                          draggable
                          onDragStart={(e) => handleCourseDragStart(e, assignment.id)}
                          onDragOver={handleCourseDragOver}
                          onDrop={(e) => handleCourseDrop(e, assignment.id, tag.id)}
                        >
                          <GripVertical className="size-4 text-default-400 cursor-move flex-shrink-0" />
                          <div className="relative w-16 h-10 rounded overflow-hidden flex-shrink-0">
                            <Image
                              src={assignment.course.thumbnail}
                              alt={assignment.course.titleEn}
                              fill
                              className="object-cover"
                            />
                          </div>
                          <div className="flex-1 min-w-0">
                            <p className="font-medium truncate">
                              {lang === "en"
                                ? assignment.course.titleEn
                                : assignment.course.titleAm}
                            </p>
                          </div>
                          <Button
                            size="sm"
                            variant="light"
                            color="danger"
                            isIconOnly
                            onPress={() => handleRemoveCourse(assignment.id, assignment.course.titleEn)}
                            isDisabled={isSaving}
                          >
                            <X className="size-4" />
                          </Button>
                        </div>
                      );
                    })}
                  </div>
                ) : (
                  <p className="text-sm text-default-400 text-center py-4">
                    {lang === "en" ? "No courses assigned" : "ኮርስ አልተመደበም"}
                  </p>
                )}
              </AccordionItem>
            );
          })}
        </Accordion>

        {tags.length === 0 && (
          <Card>
            <CardBody className="text-center py-12">
              <p className="text-default-500">
                {lang === "en"
                  ? "No tags created yet"
                  : "እስካሁን ምንም መለያ አልተፈጠረም"}
              </p>
            </CardBody>
          </Card>
        )}
      </div>

      {/* Tag Modal */}
      <Modal isOpen={isTagModalOpen} onClose={onTagModalClose}>
        <ModalContent>
          <ModalHeader>
            {editingTag
              ? lang === "en"
                ? "Edit Tag"
                : "መለያ ያርትዑ"
              : lang === "en"
              ? "Create Tag"
              : "መለያ ይፍጠሩ"}
          </ModalHeader>
          <ModalBody>
            <Input
              label={lang === "en" ? "Tag Name" : "የመለያ ስም"}
              placeholder={lang === "en" ? "Enter tag name" : "የመለያ ስም ያስገቡ"}
              value={tagName}
              onChange={(e) => setTagName(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === "Enter") {
                  editingTag ? handleUpdateTag() : handleCreateTag();
                }
              }}
            />
          </ModalBody>
          <ModalFooter>
            <Button variant="light" onPress={onTagModalClose}>
              {lang === "en" ? "Cancel" : "ይቅር"}
            </Button>
            <Button
              color="primary"
              onPress={editingTag ? handleUpdateTag : handleCreateTag}
              isLoading={isSaving}
            >
              {editingTag
                ? lang === "en"
                  ? "Update"
                  : "ያዘምኑ"
                : lang === "en"
                ? "Create"
                : "ይፍጠሩ"}
            </Button>
          </ModalFooter>
        </ModalContent>
      </Modal>

      {/* Course Assignment Modal */}
      <Modal isOpen={isCourseModalOpen} onClose={onCourseModalClose} size="2xl">
        <ModalContent>
          <ModalHeader>
            {lang === "en" ? "Assign Course to Tag" : "ኮርስን ለመለያ ይመድቡ"}
          </ModalHeader>
          <ModalBody>
            {selectedTag && (
              <div className="space-y-4">
                <div className="flex justify-between items-center">
                  <p className="text-sm text-default-600">
                    {lang === "en"
                      ? `Assign courses to "${selectedTag.name}"`
                      : `ኮርሶችን ለ"${selectedTag.name}" ይመድቡ`}
                  </p>
                  <div className="flex gap-2">
                    <Button
                      size="sm"
                      variant="light"
                      onPress={handleSelectAllCourses}
                    >
                      {selectedCourses.length === unassignedCourses.length
                        ? lang === "en" ? "Deselect All" : "ሁሉንም አልመርጥ"
                        : lang === "en" ? "Select All" : "ሁሉንም ምረጥ"}
                    </Button>
                    <Button
                      color="primary"
                      size="sm"
                      onPress={() => selectedTag && handleAssignCourses(selectedTag.id, selectedCourses)}
                      isDisabled={selectedCourses.length === 0 || isSaving}
                      isLoading={isSaving}
                    >
                      {lang === "en" ? `Assign ${selectedCourses.length} Course${selectedCourses.length !== 1 ? 's' : ''}` : `${selectedCourses.length} ኮርስ ምድብ`}
                    </Button>
                  </div>
                </div>
                <div className="max-h-96 overflow-y-auto space-y-2">
                  {unassignedCourses.length > 0 ? (
                    unassignedCourses.map((course) => (
                      <div
                        key={course.id}
                        className={`flex items-center gap-3 p-3 rounded-lg border transition-colors cursor-pointer ${
                          selectedCourses.includes(course.id)
                            ? "border-primary bg-primary/10"
                            : "border-default-200 hover:bg-default-100"
                        }`}
                        onClick={() => handleToggleCourse(course.id)}
                      >
                        <div className="relative w-16 h-10 rounded overflow-hidden flex-shrink-0">
                          <Image
                            src={course.thumbnail}
                            alt={course.titleEn}
                            fill
                            className="object-cover"
                          />
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="font-medium truncate">
                            {lang === "en" ? course.titleEn : course.titleAm}
                          </p>
                        </div>
                        <Button
                          size="sm"
                          color="primary"
                          variant={selectedCourses.includes(course.id) ? "solid" : "light"}
                          onPress={() => handleToggleCourse(course.id)}
                          isDisabled={isSaving}
                        >
                          {selectedCourses.includes(course.id)
                            ? lang === "en" ? "Selected" : "ተመርጧል"
                            : lang === "en" ? "Select" : "ምረጥ"}
                        </Button>
                      </div>
                    ))
                  ) : (
                    <p className="text-sm text-default-400 text-center py-8">
                      {lang === "en"
                        ? "All courses are assigned"
                        : "ሁሉም ኮርሶች ተመድበዋል"}
                    </p>
                  )}
                </div>
              </div>
            )}
          </ModalBody>
          <ModalFooter>
            <Button variant="light" onPress={onCourseModalClose}>
              {lang === "en" ? "Close" : "ዝጋ"}
            </Button>
          </ModalFooter>
        </ModalContent>
      </Modal>

      {/* Delete Confirmation Modal */}
      <Modal isOpen={isDeleteModalOpen} onClose={onDeleteModalClose}>
        <ModalContent>
          <ModalHeader>
            {lang === "en" ? "Confirm Delete" : "መሰረዝን ያረጋግጡ"}
          </ModalHeader>
          <ModalBody>
            <p>
              {deleteAction?.type === 'tag'
                ? lang === "en"
                  ? `Are you sure you want to delete the tag "${deleteAction.name}"?`
                  : `"${deleteAction.name}" መለያን መሰረዝ እንደሚፈልጉ እርግጠኛ ነዎት?`
                : lang === "en"
                ? `Are you sure you want to remove "${deleteAction?.name}" from this tag?`
                : `"${deleteAction?.name}" ከዚህ መለያ ማስወገድ እንደሚፈልጉ እርግጠኛ ነዎት?`}
            </p>
          </ModalBody>
          <ModalFooter>
            <Button variant="light" onPress={onDeleteModalClose}>
              {lang === "en" ? "Cancel" : "ይቅር"}
            </Button>
            <Button
              color="danger"
              onPress={confirmDelete}
              isLoading={isSaving}
            >
              {deleteAction?.type === 'tag'
                ? lang === "en" ? "Delete Tag" : "መለያ ሰርዝ"
                : lang === "en" ? "Remove Course" : "ኮርስ አስወግድ"}
            </Button>
          </ModalFooter>
        </ModalContent>
      </Modal>
    </ScrollablePageWrapper>
  );
}
