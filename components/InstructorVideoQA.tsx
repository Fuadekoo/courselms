"use client";

import React, { useState, useEffect } from "react";
import {
  Card,
  CardBody,
  CardHeader,
  Button,
  Textarea,
  Avatar,
  Chip,
  Modal,
  ModalContent,
  ModalHeader,
  ModalBody,
  ModalFooter,
  useDisclosure,
  Tabs,
  Tab,
  Input,
} from "@heroui/react";
import {
  MessageCircle,
  Send,
  Clock,
  Reply,
  Edit3,
  Trash2,
  Search,
  BookOpen,
} from "lucide-react";
import { formatDistanceToNow } from "date-fns";
import {
  getInstructorVideoQuestions,
  submitVideoResponse,
  updateVideoResponse,
  deleteVideoResponse,
} from "@/actions/instructor/videoqa";
import { useVideoQAStore, useVideoQAFilteredQuestions } from "@/stores";

interface VideoQuestion {
  id: string;
  question: string;
  timestamp?: number | null;
  createdAt: string;
  type: string; // "course" or "activity"
  student: {
    firstName: string;
    fatherName: string;
    lastName: string;
  };
  course: {
    titleEn: string;
    titleAm: string;
  };
  responses: {
    id: string;
    response: string;
    createdAt: string;
    instructor: {
      firstName: string;
      fatherName: string;
      lastName: string;
    };
  }[];
}

interface InstructorVideoQAProps {
  lang: string;
  courseId?: string;
}

export default function InstructorVideoQA({ lang, courseId }: InstructorVideoQAProps) {
  console.log("[DEBUG] InstructorVideoQA component executing with props:", { lang, courseId });
  
  const { isOpen, onOpen, onClose } = useDisclosure();
  
  // Use Zustand store for video QA state
  const {
    questions,
    loading,
    error,
    searchTerm,
    filterType,
    selectedQuestion,
    responseText,
    submitting,
    editingResponse,
    setQuestions,
    setLoading,
    setError,
    setSearchTerm,
    setFilterType,
    setSelectedQuestion,
    setResponseText,
    setSubmitting,
    setEditingResponse,
    addQuestion,
    updateQuestion,
    addResponse,
    reset: resetVideoQAStore,
  } = useVideoQAStore();
  
  // Sync modal state with store
  const setIsOpen = useVideoQAStore((state) => state.setIsOpen);
  useEffect(() => {
    setIsOpen(isOpen);
  }, [isOpen, setIsOpen]);
  
  // Use filtered questions from store
  const filteredQuestions = useVideoQAFilteredQuestions() as VideoQuestion[];
  
  // Reset store on unmount
  useEffect(() => {
    return () => {
      resetVideoQAStore();
    };
  }, [resetVideoQAStore]);

  // Load questions on component mount
  useEffect(() => {
    console.log("[DEBUG] useEffect triggered - loading questions");
    loadQuestions();
  }, [courseId]);

  const loadQuestions = async () => {
    console.log("[DEBUG] loadQuestions called");
    setLoading(true);
    setError(null);
    try {
      console.log("[DEBUG] Calling getInstructorVideoQuestions...");
      const result = await getInstructorVideoQuestions();
      console.log("[DEBUG] getInstructorVideoQuestions result:", result);
      
      if (result.success && result.data) {
        // Convert Date objects to strings for compatibility and match store type
        const questionsWithStringDates = result.data.map(q => ({
          ...q,
          createdAt: q.createdAt.toString(),
          responses: q.responses?.map(r => ({
            ...r,
            createdAt: r.createdAt.toString()
          })) || []
        }));
        console.log("[DEBUG] Setting questions:", questionsWithStringDates.length);
        setQuestions(questionsWithStringDates);
      } else {
        console.log("[DEBUG] Error in result:", result.error);
        setError(result.error || "Failed to load questions");
      }
    } catch (error) {
      console.error("[DEBUG] Error loading questions:", error);
      setError("Error loading questions");
    } finally {
      setLoading(false);
    }
  };

  // Note: filteredQuestions is now provided by useVideoQAFilteredQuestions hook above
  // Removed local filtering logic as it's handled in the store

  const handleSubmitResponse = async () => {
    if (!selectedQuestion || !responseText.trim()) return;

    setSubmitting(true);
    try {
      const result = await submitVideoResponse(selectedQuestion.id, responseText.trim());
      
      if (result.success) {
        setResponseText("");
        onClose();
        await loadQuestions();
      } else {
        alert(lang === "en" ? "Failed to submit response" : "ምላሽን ማስገባት አልተሳካም");
      }
    } catch (error) {
      console.error("Error submitting response:", error);
      alert(lang === "en" ? "Error submitting response" : "ምላሽን በማስገባት ላይ ስህተት");
    } finally {
      setSubmitting(false);
    }
  };

  const handleUpdateResponse = async (responseId: string, newText: string) => {
    if (!newText.trim()) return;

    try {
      const result = await updateVideoResponse(responseId, newText.trim());
      if (result.success) {
        setEditingResponse(null);
        await loadQuestions();
      } else {
        alert(lang === "en" ? "Failed to update response" : "ምላሽን ማዘመን አልተሳካም");
      }
    } catch (error) {
      console.error("Error updating response:", error);
      alert(lang === "en" ? "Error updating response" : "ምላሽን በማዘመን ላይ ስህተት");
    }
  };

  const handleDeleteResponse = async (responseId: string) => {
    const confirmMessage = lang === "en" 
      ? "Are you sure you want to delete this response?" 
      : "ይህን ምላሽ መሰረዝ እርግጠኛ ነዎት?";
      
    if (!confirm(confirmMessage)) return;

    try {
      const result = await deleteVideoResponse(responseId);
      if (result.success) {
        await loadQuestions();
      } else {
        alert(lang === "en" ? "Failed to delete response" : "ምላሽን መሰረዝ አልተሳካም");
      }
    } catch (error) {
      console.error("Error deleting response:", error);
      alert(lang === "en" ? "Error deleting response" : "ምላሽን በመሰረዝ ላይ ስህተት");
    }
  };

  const formatTimestamp = (seconds?: number | null) => {
    if (!seconds) return null;
    const minutes = Math.floor(seconds / 60);
    const remainingSeconds = seconds % 60;
    return `${minutes}:${remainingSeconds.toString().padStart(2, '0')}`;
  };

  const openResponseModal = (question: VideoQuestion) => {
    setSelectedQuestion(question);
    setResponseText("");
    onOpen();
  };

  return (
    <div className="space-y-6">
      {/* Debug Info - Remove in production */}
      {process.env.NODE_ENV === 'development' && (
        <Card className="bg-yellow-50 border-yellow-200">
          <CardBody>
            <h3 className="font-semibold text-yellow-800 mb-2">Debug Info:</h3>
            <div className="text-sm text-yellow-700 space-y-1">
              <div>Course ID: {courseId || 'undefined'}</div>
              <div>Questions loaded: {questions.length}</div>
              <div>Filtered questions: {filteredQuestions.length}</div>
              <div>Loading: {loading ? 'true' : 'false'}</div>
              <div>Error: {error || 'none'}</div>
            </div>
          </CardBody>
        </Card>
      )}

      {/* Header */}
      <Card>
        <CardHeader className="pb-3">
          <div className="flex flex-col gap-4 w-full">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <MessageCircle className="w-6 h-6 text-primary" />
                <div>
                  <h2 className="text-xl font-bold">
                    {lang === "en" ? "Student Video Questions" : "የተማሪ ቪዲዮ ጥያቄዎች"}
                  </h2>
                  <p className="text-sm text-gray-500">
                    {lang === "en" 
                      ? "Respond to student questions about your course videos"
                      : "ስለ ቪዲዮዎች የተማሪ ጥያቄዎችን ይመልሱ"}
                  </p>
                </div>
              </div>
              <Chip size="lg" variant="flat" color="primary">
                {filteredQuestions.length} {lang === "en" ? "questions" : "ጥያቄዎች"}
              </Chip>
            </div>

            {/* Search and Filter */}
            <div className="flex gap-3 items-center">
              <Input
                placeholder={lang === "en" ? "Search questions..." : "ጥያቄዎችን ፈልግ..."}
                value={searchTerm}
                onValueChange={setSearchTerm}
                startContent={<Search className="w-4 h-4 text-gray-400" />}
                className="flex-1"
              />
              
              <Tabs
                selectedKey={filterType}
                onSelectionChange={(key) => setFilterType(key as typeof filterType)}
                size="sm"
              >
                <Tab key="all" title={lang === "en" ? "All" : "ሁሉም"} />
                <Tab key="unanswered" title={lang === "en" ? "Unanswered" : "ያልተመለሱ"} />
                <Tab key="answered" title={lang === "en" ? "Answered" : "የተመለሱ"} />
              </Tabs>
            </div>
          </div>
        </CardHeader>
      </Card>

      {/* Questions List */}
      {error ? (
        <Card>
          <CardBody className="text-center py-12">
            <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <MessageCircle className="w-8 h-8 text-red-500" />
            </div>
            <h3 className="text-lg font-medium text-red-600 mb-2">
              {lang === "en" ? "Error Loading Questions" : "ጥያቄዎችን በመጫን ላይ ስህተት"}
            </h3>
            <p className="text-gray-600 mb-4">{error}</p>
            <Button color="primary" onPress={loadQuestions}>
              {lang === "en" ? "Try Again" : "እንደገና ሞክር"}
            </Button>
          </CardBody>
        </Card>
      ) : loading ? (
        <div className="space-y-4">
          {[1, 2, 3].map((i) => (
            <Card key={i} className="animate-pulse">
              <CardBody className="space-y-4">
                <div className="h-4 bg-gray-200 rounded w-3/4"></div>
                <div className="h-3 bg-gray-200 rounded w-1/2"></div>
                <div className="h-8 bg-gray-200 rounded w-32"></div>
              </CardBody>
            </Card>
          ))}
        </div>
      ) : filteredQuestions.length === 0 ? (
        <Card>
          <CardBody className="text-center py-12">
            <MessageCircle className="w-16 h-16 text-gray-300 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-gray-600 mb-2">
              {lang === "en" ? "No questions found" : "ምንም ጥያቄ አልተገኘም"}
            </h3>
            <p className="text-gray-500">
              {searchTerm || filterType !== "all"
                ? lang === "en"
                  ? "Try adjusting your search or filter"
                  : "ፍለጋዎን ወይም ማጣሪያዎን ይለውጡ"
                : lang === "en"
                ? "Students haven't asked any questions yet"
                : "ተማሪዎች ገና ምንም ጥያቄ አላቀረቡም"}
            </p>
          </CardBody>
        </Card>
      ) : (
        <div className="space-y-4">
          {filteredQuestions.map((question) => (
            <Card key={question.id} className={`${
              question.responses.length === 0 ? 'border-l-4 border-l-orange-400' : 'border-l-4 border-l-green-400'
            }`}>
              <CardBody className="space-y-4">
                {/* Course and Video Info */}
                <div className="flex items-center gap-2 text-sm text-gray-600">
                  <BookOpen className="w-4 h-4 flex-shrink-0" />
                  <span className="break-words overflow-wrap-anywhere flex-1">
                    {lang === "en" 
                      ? question.course.titleEn
                      : question.course.titleAm
                    } • {question.type === "course" ? (lang === "en" ? "Introduction" : "መግቢያ") : (lang === "en" ? "Activity" : "እንቅስቃሴ")}
                  </span>
                </div>

                {/* Student and Question */}
                <div className="flex items-start justify-between">
                  <div className="flex items-center gap-3 flex-1">
                    <Avatar
                      size="md"
                      name={`${question.student.firstName} ${question.student.fatherName}`}
                      className="bg-blue-500 text-white"
                    />
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-1">
                        <p className="font-medium">
                          {question.student.firstName} {question.student.fatherName}
                        </p>
                        <Chip size="sm" color="primary" variant="flat">
                          {lang === "en" ? "Student" : "ተማሪ"}
                        </Chip>
                      </div>
                      <div className="flex items-center gap-2 text-xs text-gray-500 mb-2">
                        <Clock className="w-3 h-3" />
                        <span>
                          {formatDistanceToNow(new Date(question.createdAt), { addSuffix: true })}
                        </span>
                        {question.timestamp && (
                          <>
                            <span>•</span>
                            <span>
                              {lang === "en" ? "At" : "በ"} {formatTimestamp(question.timestamp)}
                            </span>
                          </>
                        )}
                      </div>
                      <p className="text-gray-700 dark:text-gray-300 break-words overflow-wrap-anywhere">
                        {question.question}
                      </p>
                    </div>
                  </div>
                  
                  {question.responses.length === 0 && (
                    <Button
                      color="primary"
                      startContent={<Reply className="w-4 h-4" />}
                      onPress={() => openResponseModal(question)}
                      size="sm"
                    >
                      {lang === "en" ? "Respond" : "ምላሽ ስጥ"}
                    </Button>
                  )}
                </div>

                {/* Existing Responses */}
                {question.responses.length > 0 && (
                  <div className="ml-14 space-y-3 border-l-2 border-gray-200 pl-4">
                    {question.responses.map((response) => (
                      <div key={response.id} className="space-y-2">
                        <div className="flex items-start justify-between">
                          <div className="flex items-center gap-2">
                            <Avatar
                              size="sm"
                              name={`${response.instructor.firstName} ${response.instructor.fatherName}`}
                              className="bg-green-500 text-white"
                            />
                            <div>
                              <p className="font-medium text-sm flex items-center gap-2">
                                {response.instructor.firstName} {response.instructor.fatherName}
                                <Chip size="sm" color="success" variant="flat">
                                  {lang === "en" ? "Instructor" : "አስተማሪ"}
                                </Chip>
                              </p>
                              <p className="text-xs text-gray-500">
                                {formatDistanceToNow(new Date(response.createdAt), { addSuffix: true })}
                              </p>
                            </div>
                          </div>
                          
                          <div className="flex gap-1">
                            <Button
                              isIconOnly
                              size="sm"
                              variant="light"
                              onPress={() => setEditingResponse(response.id)}
                            >
                              <Edit3 className="w-3 h-3" />
                            </Button>
                            <Button
                              isIconOnly
                              size="sm"
                              variant="light"
                              color="danger"
                              onPress={() => handleDeleteResponse(response.id)}
                            >
                              <Trash2 className="w-3 h-3" />
                            </Button>
                          </div>
                        </div>
                        
                        {editingResponse === response.id ? (
                          <div className="ml-8 space-y-2">
                            <Textarea
                              defaultValue={response.response}
                              onBlur={(e) => {
                                if (e.target.value !== response.response) {
                                  handleUpdateResponse(response.id, e.target.value);
                                } else {
                                  setEditingResponse(null);
                                }
                              }}
                              onKeyDown={(e) => {
                                if (e.key === 'Escape') {
                                  setEditingResponse(null);
                                }
                              }}
                              autoFocus
                              minRows={2}
                              classNames={{
                                input: "break-words overflow-wrap-anywhere",
                              }}
                            />
                          </div>
                        ) : (
                          <p className="text-gray-700 dark:text-gray-300 text-sm ml-8 break-words overflow-wrap-anywhere">
                            {response.response}
                          </p>
                        )}
                      </div>
                    ))}
                    
                    {/* Add another response button */}
                    <Button
                      variant="light"
                      size="sm"
                      startContent={<Reply className="w-4 h-4" />}
                      onPress={() => openResponseModal(question)}
                      className="ml-8"
                    >
                      {lang === "en" ? "Add Response" : "ምላሽ ጨምር"}
                    </Button>
                  </div>
                )}
              </CardBody>
            </Card>
          ))}
        </div>
      )}

      {/* Response Modal */}
      <Modal isOpen={isOpen} onClose={onClose} size="2xl">
        <ModalContent>
          {(onClose) => (
            <>
              <ModalHeader className="flex flex-col gap-1">
                {lang === "en" ? "Respond to Question" : "ለጥያቄው ምላሽ ስጥ"}
                {selectedQuestion && (
                  <p className="text-sm text-gray-500 font-normal">
                    {lang === "en" ? "From" : "ከ"} {selectedQuestion.student.firstName} {selectedQuestion.student.fatherName}
                  </p>
                )}
              </ModalHeader>
              <ModalBody>
                {selectedQuestion && (
                  <div className="space-y-4">
                    <Card className="bg-gray-50 dark:bg-gray-800">
                      <CardBody>
                        <p className="text-sm text-gray-700 dark:text-gray-300 break-words overflow-wrap-anywhere">
                          <strong>{lang === "en" ? "Question:" : "ጥያቄ:"}</strong> {selectedQuestion.question}
                        </p>
                      </CardBody>
                    </Card>
                    
                    <Textarea
                      value={responseText}
                      onValueChange={setResponseText}
                      placeholder={
                        lang === "en" 
                          ? "Type your response to the student..."
                          : "ለተማሪው ምላሽዎን ይጻፉ..."
                      }
                      minRows={4}
                      maxRows={8}
                      classNames={{
                        input: "break-words overflow-wrap-anywhere",
                      }}
                    />
                  </div>
                )}
              </ModalBody>
              <ModalFooter>
                <Button color="danger" variant="light" onPress={onClose}>
                  {lang === "en" ? "Cancel" : "ተወው"}
                </Button>
                <Button
                  color="primary"
                  onPress={handleSubmitResponse}
                  isDisabled={!responseText.trim() || submitting}
                  isLoading={submitting}
                  startContent={!submitting && <Send className="w-4 h-4" />}
                >
                  {submitting 
                    ? (lang === "en" ? "Sending..." : "በመላክ ላይ...")
                    : (lang === "en" ? "Send Response" : "ምላሽ ላክ")
                  }
                </Button>
              </ModalFooter>
            </>
          )}
        </ModalContent>
      </Modal>
    </div>
  );
}