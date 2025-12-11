"use client";

import { updateAiProvider } from "@/actions/manager/course";
import { useState, useEffect } from "react";
import { toast } from "sonner";

interface AiAssistantSelectorProps {
  courseId: string;
  currentAIProvider: string | null;
}

export function AiAssistantSelector({
  courseId,
  currentAIProvider,
}: AiAssistantSelectorProps) {
  const [aiProvider, setAiProvider] = useState<string>(
    currentAIProvider || "gemini"
  );
  const [aiStatus, setAiStatus] = useState<string>("");

  // Sync state with prop changes when switching packages
  useEffect(() => {
    setAiProvider(currentAIProvider || "gemini");
    setAiStatus(""); // Clear status message when package changes
  }, [currentAIProvider, courseId]);

  const handleAiSelection = async () => {
    const { success, message } = await updateAiProvider(courseId, aiProvider);
    if (success) {
      toast.success(`AI Provider updated to ${aiProvider}`);
      setAiStatus(message);
    } else {
      toast.error(message || "Failed to update AI provider");
      setAiStatus(message);
    }
  };

  return (
    <div className="mb-6 p-4 bg-gray-50 border border-gray-200 rounded">
      <label className="block text-sm font-medium text-gray-700 mb-2">
        Select AI Assistant:
      </label>
      <div className="flex gap-4 mb-3">
        <label className="flex items-center">
          <input
            type="radio"
            name={`aiProvider-${courseId}`}
            value="gemini"
            checked={aiProvider === "gemini"}
            onChange={(e) => setAiProvider(e.target.value as string)}
            className="mr-2"
          />
          <span className="text-sm">Gemini AI (Google)</span>
        </label>
        <label className="flex items-center">
          <input
            type="radio"
            name={`aiProvider-${courseId}`}
            value="openai"
            checked={aiProvider === "openai"}
            onChange={(e) => setAiProvider(e.target.value as string)}
            className="mr-2"
          />
          <span className="text-sm">OpenAI GPT-4</span>
        </label>
      </div>
      <button
        onClick={handleAiSelection}
        className="bg-purple-500 text-white px-4 py-2 rounded hover:bg-purple-600 text-sm"
      >
        Set AI Assistant
      </button>
      {aiStatus && <p className="mt-2 text-sm text-gray-700">{aiStatus}</p>}
    </div>
  );
}
