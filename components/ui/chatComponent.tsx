"use client";
import { useState } from "react";
import { Button, Input, Card, CardHeader, CardBody, Progress } from "@heroui/react";
import { Loader2, Send } from "lucide-react";
import { askCourseQuestion } from "@/lib/actions";

interface ChatComponentProps {
  courseId: string;
}

export default function ChatComponent({ courseId }: ChatComponentProps) {
  const [question, setQuestion] = useState("");
  const [answer, setAnswer] = useState("");
  const [loading, setLoading] = useState(false);
  const [currentAiProvider, setCurrentAiProvider] = useState<string>("");
  const [progress, setProgress] = useState(0);

  const handleAsk = async () => {
    if (!question.trim()) return;
    
    setLoading(true);
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
      const result = await askCourseQuestion(courseId, question.trim());
      
      setProgress(100);

      // askCourseQuestion always returns success: true with a default answer if needed
      setAnswer(result.answer || "No answer received");
      // Always show as Darulkubra AI for professional branding
      setCurrentAiProvider("Darulkubra AI");
    } catch (error) {
      console.error("Error asking question:", error);
      const errorMessage = error instanceof Error ? error.message : "Unknown error";
      setAnswer(`Sorry, I couldn't process your question: ${errorMessage}`);
    } finally {
      setLoading(false);
      // Clear progress after a short delay
      setTimeout(() => setProgress(0), 1000);
    }
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && !loading && question.trim()) {
      handleAsk();
    }
  };

  return (
    <Card className="w-full max-w-2xl mx-auto">
      <CardHeader className="flex gap-3">
        <div className="flex items-center gap-2">
          <Send className="h-5 w-5 text-purple-500" />
          <h3 className="text-lg font-semibold">Ask the DarulkubraAI</h3>
        </div>
      </CardHeader>
      <CardBody className="space-y-4">
        <div className="flex gap-2">
          <Input
            type="text"
            value={question}
            onValueChange={setQuestion}
            onKeyDown={handleKeyPress}
            placeholder="Ask a question about the PDF content..."
            isDisabled={loading}
            className="flex-1"
            aria-label="Question input"
          />
          <Button
            onPress={handleAsk}
            color="primary"
            isDisabled={loading || !question.trim()}
            isIconOnly
            aria-label="Submit question"
          >
            {loading ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              <Send className="h-4 w-4" />
            )}
          </Button>
        </div>
        
        {loading && (
          <div className="space-y-2">
            <div className="flex justify-between items-center">
              <span className="text-sm font-medium text-gray-700 dark:text-gray-300">
                AI is processing your question...
              </span>
              <span className="text-sm font-medium text-purple-600 dark:text-purple-400">
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
            <p className="text-xs text-gray-500 dark:text-gray-400 text-center">
              {progress < 15 && "Darulkubra AI is analyzing question..."}
              {progress >= 15 && progress < 30 && "Darulkubra AI is searching content..."}
              {progress >= 30 && progress < 50 && "Darulkubra AI is processing..."}
              {progress >= 50 && progress < 75 && "Darulkubra AI is generating response..."}
              {progress >= 75 && progress < 90 && "Darulkubra AI is finalizing answer..."}
              {progress >= 90 && progress < 100 && "Almost done..."}
              {progress === 100 && "Complete!"}
            </p>
          </div>
        )}
        
        {answer && (
          <div className="mt-4 p-4 bg-gray-50 dark:bg-gray-800 rounded-lg">
            <h3 className="font-semibold text-sm text-gray-700 dark:text-gray-300 mb-2 flex items-center gap-2">
              <span>Answer</span>
              {currentAiProvider && (
                <span className="px-2 py-1 bg-purple-100 dark:bg-purple-900/30 text-purple-700 dark:text-purple-300 text-xs rounded-full">
                  {currentAiProvider}
                </span>
              )}
            </h3>
            <p className="text-gray-900 dark:text-gray-100 whitespace-pre-wrap leading-relaxed">
              {answer}
            </p>
          </div>
        )}
      </CardBody>
    </Card>
  );
}
