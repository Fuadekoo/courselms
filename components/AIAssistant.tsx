"use client";
import React, { useState } from "react";
import {
  Card,
  CardBody,
  Button,
  Textarea,
  Avatar,
  Modal,
  ModalContent,
  ModalHeader,
  ModalBody,
  ModalFooter,
  useDisclosure,
  Progress,
} from "@heroui/react";
import { Bot } from "lucide-react";
import { askCourseQuestion } from "@/lib/actions";

interface AIAssistantProps {
  courseId: string;
  lang: string;
}

export default function AIAssistant({ courseId, lang }: AIAssistantProps) {
  const { isOpen, onOpen, onClose } = useDisclosure();
  const [newQuestion, setNewQuestion] = useState("");
  const [aiResponse, setAiResponse] = useState("");
  const [aiLoading, setAiLoading] = useState(false);
  const [currentAiProvider, setCurrentAiProvider] = useState<string>("");
  const [progress, setProgress] = useState(0);

  const handleAIQuestion = async () => {
    if (!newQuestion.trim()) return;
    
    setAiLoading(true);
    setAiResponse("");
    setProgress(0);
    
    try {
      // Simulate progress steps for AI processing
      const progressSteps = [
        { step: 15, delay: 150 },
        { step: 30, delay: 150 },
        { step: 50, delay: 150 },
        { step: 75, delay: 150 },
        { step: 90, delay: 150 },
      ];

      // Start progress animation
      for (const { step, delay } of progressSteps) {
        setProgress(step);
        await new Promise((resolve) => setTimeout(resolve, delay));
      }

      // Use the server action to ask the question
      const result = await askCourseQuestion(courseId, newQuestion.trim());
      
      setProgress(100);
      
      if (result.success) {
        setAiResponse(result.answer || "No answer received");
        // Always show as Darulkubra AI for professional branding
        setCurrentAiProvider("Darulkubra AI");
        setNewQuestion("");
        onClose();
      } else {
        throw new Error(result.error || "Failed to get AI response");
      }
    } catch (error) {
      console.error("Error getting AI response:", error);
      const errorMessage = error instanceof Error ? error.message : "Unknown error";
      setAiResponse(
        lang === "en" 
          ? `Sorry, I couldn't process your question: ${errorMessage}` 
          : `ይቅርታ፣ ጥያቄዎን ማስኬድ አልቻልኩም: ${errorMessage}`
      );
    } finally {
      setAiLoading(false);
      // Clear progress after a short delay
      setTimeout(() => setProgress(0), 1000);
    }
  };

  return (
    <div className="space-y-3 sm:space-y-4 h-full flex flex-col">
      {/* Header */}
      <div className="flex items-center justify-between gap-2">
        <div className="flex items-center gap-1.5 sm:gap-2 min-w-0 flex-1">
          <Bot className="w-4 h-4 sm:w-5 sm:h-5 text-purple-500 flex-shrink-0" />
          <h3 className="text-sm sm:text-base md:text-lg font-semibold truncate">
            {lang === "en" ? "AI Assistant" : "AI ረዳት"}
          </h3>
        </div>
        
        <Button
          color="secondary"
          startContent={<Bot className="w-3 h-3 sm:w-4 sm:h-4" />}
          onPress={onOpen}
          size="sm"
          className="flex-shrink-0 text-xs sm:text-sm px-2 sm:px-3"
        >
          <span className="hidden sm:inline">{lang === "en" ? "Ask AI" : "AI ጠይቅ"}</span>
          <span className="sm:hidden">AI</span>
        </Button>
      </div>

      {/* AI Response - Modified for better mobile display */}
      <div className="flex-1 flex flex-col min-h-0">
        {aiResponse ? (
          <Card className="border-l-2 sm:border-l-4 border-l-purple-500 flex-1 flex flex-col min-h-0">
            <CardBody className="space-y-2 sm:space-y-3 p-3 sm:p-4 flex-1 flex flex-col min-h-0">
              <div className="flex items-center gap-2 sm:gap-3">
                <Avatar
                  icon={<Bot className="w-3 h-3 sm:w-4 sm:h-4" />}
                  className="bg-purple-500 text-white flex-shrink-0"
                  size="sm"
                />
                <div className="min-w-0 flex-1">
                  <p className="font-medium text-xs sm:text-sm flex items-center gap-1 sm:gap-2">
                    <span className="truncate">AI Assistant</span>
                    {currentAiProvider && (
                      <span className="px-1.5 sm:px-2 py-0.5 sm:py-1 bg-purple-100 dark:bg-purple-900/30 text-purple-700 dark:text-purple-300 text-xs rounded-full flex-shrink-0">
                        {currentAiProvider}
                      </span>
                    )}
                  </p>
                  <p className="text-xs text-gray-500">
                    {lang === "en" ? "Just now" : "አሁን"}
                  </p>
                </div>
              </div>
              <div className="ml-8 sm:ml-11 flex-1 overflow-y-auto">
                <p className="text-gray-700 dark:text-gray-300 text-sm sm:text-base leading-relaxed">
                  {aiResponse}
                </p>
              </div>
            </CardBody>
          </Card>
        ) : (
          <Card className="flex-1 flex items-center justify-center min-h-[200px]">
            <CardBody className="text-center py-6 sm:py-8 px-4">
              <Bot className="w-10 h-10 sm:w-12 sm:h-12 text-purple-300 mx-auto mb-2 sm:mb-3" />
              <p className="text-gray-500 mb-1 sm:mb-2 text-sm sm:text-base">
                {lang === "en" 
                  ? "AI Assistant is ready to help!" 
                  : "AI ረዳት ለመርዳት ዝግጁ ነው!"}
              </p>
              <p className="text-xs sm:text-sm text-gray-400">
                {lang === "en" 
                  ? "Ask any question about the course content and get instant answers." 
                  : "ስለ ኮርሱ ይዘት ማንኛውንም ጥያቄ ጠይቅ እና ፈጣን መልስ ያግኙ።"}
              </p>
            </CardBody>
          </Card>
        )}
      </div>

      {/* Ask AI Modal */}
      <Modal isOpen={isOpen} onClose={onClose} size="2xl">
        <ModalContent>
          {(onClose) => (
            <>
              <ModalHeader className="flex flex-col gap-1">
                <div className="flex items-center gap-2">
                  <Bot className="w-5 h-5 text-purple-500" />
                  {lang === "en" ? "Ask AI Assistant" : "AI ረዳትን ጠይቅ"}
                </div>
                <p className="text-sm text-purple-600 dark:text-purple-400">
                  {lang === "en" 
                    ? "Get instant AI-powered answers about the course content"
                    : "ስለ ኮርሱ ይዘት ፈጣን AI-ተኮር መልሶችን ያግኙ"}
                </p>
              </ModalHeader>
              <ModalBody className="space-y-4">
                <Textarea
                  value={newQuestion}
                  onValueChange={setNewQuestion}
                  placeholder={
                    lang === "en" 
                      ? "Ask AI anything about this course content..."
                      : "ስለዚህ ኮርስ ይዘት ማንኛውንም ነገር AI ጠይቅ..."
                  }
                  minRows={3}
                  maxRows={6}
                  isDisabled={aiLoading}
                />
                
                {aiLoading && (
                  <div className="space-y-2">
                    <div className="flex justify-between items-center">
                      <div className="flex items-center gap-2 text-purple-600 dark:text-purple-400">
                        <Bot className="w-4 h-4 animate-pulse" />
                        <span className="text-sm font-medium">
                          {lang === "en" ? "Darulkubra AI is processing..." : "Darulkubra AI በማስኬድ ላይ..."}
                        </span>
                      </div>
                      <span className="text-sm font-medium text-purple-600">
                        {progress}%
                      </span>
                    </div>
                    <Progress 
                      value={progress} 
                      size="sm"
                      classNames={{
                        indicator: "bg-gradient-to-r from-purple-500 to-blue-500"
                      }}
                    />
                    <p className="text-xs text-gray-500 text-center">
                      {progress < 15 && (lang === "en" ? "Analyzing question..." : "ጥያቄን በመመርመር ላይ...")}
                      {progress >= 15 && progress < 30 && (lang === "en" ? "Searching content..." : "ይዘት በመፈለግ ላይ...")}
                      {progress >= 30 && progress < 50 && (lang === "en" ? "Processing with AI..." : "በ AI በማስኬድ ላይ...")}
                      {progress >= 50 && progress < 75 && (lang === "en" ? "Generating response..." : "ምላሽ በማመንጨት ላይ...")}
                      {progress >= 75 && progress < 90 && (lang === "en" ? "Finalizing answer..." : "መልስ በማጠናቀቅ ላይ...")}
                      {progress >= 90 && progress < 100 && (lang === "en" ? "Almost done..." : "ለመጨረስ ቀርቷል...")}
                      {progress === 100 && (lang === "en" ? "Complete!" : "ተጠናቅቋል!")}
                    </p>
                  </div>
                )}
              </ModalBody>
              <ModalFooter>
                <Button color="danger" variant="light" onPress={onClose}>
                  {lang === "en" ? "Cancel" : "ተወው"}
                </Button>
                <Button
                  color="secondary"
                  onPress={handleAIQuestion}
                  isDisabled={!newQuestion.trim() || aiLoading}
                  isLoading={aiLoading}
                  startContent={!aiLoading && <Bot className="w-4 h-4" />}
                >
                  {aiLoading
                    ? (lang === "en" ? "Processing..." : "በማስኬድ ላይ...")
                    : (lang === "en" ? "Ask AI" : "AI ጠይቅ")
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