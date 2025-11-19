/* eslint-disable @typescript-eslint/no-explicit-any */
"use client";
// Ensure needed hooks are imported
import React, { useEffect, useMemo, useState, useCallback } from "react";
import useAction from "@/hooks/useAction";
import useData from "@/hooks/useData";
import { useParams, useRouter } from "next/navigation";
import {
  ChevronLeft,
  ChevronRight,
  CheckCircle2,
  Circle,
  X,
  Trophy,
  Clock,
  BookOpen,
  AlertCircle,
  Target,
  Award,
  BarChart3,
  Eye,
  EyeOff,
  Save,
  Zap,
} from "lucide-react";
import {
  getFinalExams,
  getFinalExamStatus,
  submitFinalExamAnswers,
  readyToCertification,
} from "@/actions/student/mycourse";
import { useExamStore } from "@/stores";

// Strong types for questions/options
type ExamOption = { id: string; label: string };
type ExamQuestion = {
  id: string;
  text: string;
  options: ExamOption[];
  correctIndex: number;
  explanation?: string;
  previouslySelectedIndex: number;
};

export default function Page() {
  const router = useRouter();
  const params = useParams<{ lang: string; id: string }>();
  const lang = params?.lang || "en";
  const courseId = params?.id || "";

  // Use Zustand store for exam state
  const {
    current,
    selected,
    answers,
    submitted,
    reviewMode,
    showCongrats,
    examStartTime,
    timeSpent,
    showHints,
    flaggedQuestions,
    autoSaving,
    confidenceLevels,
    examProgress,
    questions: examQuestionsStore = [],
    setCurrent,
    setSelected,
    setAnswers,
    addAnswer,
    setSubmitted,
    setReviewMode,
    setShowCongrats,
    setExamStartTime,
    setTimeSpent,
    incrementTimeSpent,
    setShowHints,
    toggleFlaggedQuestion,
    setAutoSaving,
    setConfidenceLevel,
    setConfidenceLevels,
    setExamProgress,
    setQuestions: setExamQuestionsStore,
    reset: resetExamStore,
  } = useExamStore();

  const { data, loading } = useData({ func: getFinalExams, args: [courseId] });
  const { data: status } = useData({
    func: getFinalExamStatus,
    args: [courseId],
  });
  const { action } = useAction(submitFinalExamAnswers, undefined, {
    error: lang === "en" 
      ? { title: "Failed to Save Final Exam Answer", description: "Unable to save your answer for the final examination. Please verify your internet connection and try again." }
      : { title: "የመጨረሻ ፈተና መልስ ማስቀመጥ አልተሳካም", description: "ለመጨረሻ ፈተና መልስዎ ማስቀመጥ አልተቻለም። የኢንተርኔት ግንቡገት በማረጋገጥ እንደገና ይሞክሩ።" },
    success: lang === "en" 
      ? { title: "Answer Saved Successfully", description: "Your final exam answer has been recorded and automatically saved to the system." }
      : { title: "መልስ በተሳካ ሁኔታ ተቀምጧል", description: "የመጨረሻ ፈተና መልስዎ ተመዝግቦ በሳላቢት ተቀምጧል።" },
  });
  const { data: cert, loading: certLoading } = useData({
    func: readyToCertification,
    args: [courseId],
  });

  const questions = useMemo<ExamQuestion[]>(() => {
    const list = Array.isArray(data) ? data : [];
    const mapped = list.map((q: any) => {
      const opts: ExamOption[] = Array.isArray(q.questionOptions)
        ? q.questionOptions.map((o: any) => ({ id: o.id, label: o.option }))
        : [];
      const answerId = Array.isArray(q.questionAnswer)
        ? q.questionAnswer[0]?.answerId
        : q.questionAnswer?.answerId;
      const correctIndex = opts.findIndex((o: ExamOption) => o.id === answerId);
      const preIdx = q.studentSelectedOptionId
        ? opts.findIndex((o: ExamOption) => o.id === q.studentSelectedOptionId)
        : -1;
      return {
        id: q.id,
        text: q.question as string,
        options: opts,
        correctIndex,
        explanation: (q.answerExplanation ?? "") as string,
        previouslySelectedIndex: preIdx,
      } as ExamQuestion;
    });
    return mapped;
  }, [data]);
  
  // Update store with questions when they change
  useEffect(() => {
    if (questions.length > 0) {
      setExamQuestionsStore(questions);
    }
  }, [questions, setExamQuestionsStore]);

  // Use questions from store if available, otherwise use local
  const displayQuestions = examQuestionsStore.length > 0 ? examQuestionsStore : questions;

  // Initialize exam timer
  useEffect(() => {
    if (displayQuestions.length > 0 && !examStartTime && !submitted) {
      setExamStartTime(new Date());
    }
  }, [displayQuestions.length, examStartTime, submitted, setExamStartTime]);

  // Timer effect
  useEffect(() => {
    if (!examStartTime || submitted) return;
    
    const timer = setInterval(() => {
      incrementTimeSpent();
    }, 1000);
    
    return () => clearInterval(timer);
  }, [examStartTime, submitted, incrementTimeSpent]);
  
  // Reset store on unmount
  useEffect(() => {
    return () => {
      resetExamStore();
    };
  }, [resetExamStore]);

  // Progress calculation
  useEffect(() => {
    const answered = answers.filter(a => a >= 0).length;
    const progress = displayQuestions.length > 0 ? (answered / displayQuestions.length) * 100 : 0;
    setExamProgress(progress);
  }, [answers, displayQuestions.length, setExamProgress]);

  // Initialize confidence levels
  useEffect(() => {
    setConfidenceLevels(displayQuestions.map(() => 3)); // Default medium confidence
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [displayQuestions.length, setConfidenceLevels]);

  useEffect(() => {
    setAnswers(displayQuestions.map((q) => q.previouslySelectedIndex ?? -1));
    setCurrent(0);
    setSelected(null);
    setSubmitted(false);
    setReviewMode("paged");
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [displayQuestions.length, setAnswers, setCurrent, setSelected, setSubmitted, setReviewMode]);

  const quizDone = status === "done";
  const answeredCount = answers.filter((a) => a >= 0).length;
  const allAnswered =
    displayQuestions.length > 0 && answeredCount === displayQuestions.length;

  // Helper functions
  const formatTime = useCallback((seconds: number) => {
    const hrs = Math.floor(seconds / 3600);
    const mins = Math.floor((seconds % 3600) / 60);
    const secs = seconds % 60;
    if (hrs > 0) {
      return `${hrs}:${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
    }
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  }, []);

  const getProgressColor = useCallback((progress: number) => {
    if (progress < 25) return "bg-red-500";
    if (progress < 50) return "bg-orange-500";
    if (progress < 75) return "bg-yellow-500";
    return "bg-green-500";
  }, []);

  const toggleQuestionFlag = useCallback((index: number) => {
    // Use store's toggleFlaggedQuestion instead
    toggleFlaggedQuestion(index);
  }, [toggleFlaggedQuestion]);

  // Compute score for modal
  // const score = useMemo(
  //   () =>
  //     answers.reduce(
  //       (acc, ans, idx) => acc + (ans === questions[idx]?.correctIndex ? 1 : 0),
  //       0
  //     ),
  //   [answers, questions]
  // );

  const q = displayQuestions[current];
  const effectiveSelected = answers[current] >= 0 ? answers[current] : selected;

  // Enhanced Review card for a single question
  const ReviewCard = ({ qi, idx }: { qi: ExamQuestion; idx: number }) => {
    const selectedIdx = answers[idx];
    const isCorrect = selectedIdx === qi.correctIndex;
    const isFlagged = flaggedQuestions.has(idx);
    
    return (
      <div className="bg-white dark:bg-gray-800 rounded-2xl border border-slate-200 dark:border-gray-700 p-6 shadow-sm hover:shadow-md transition-shadow">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-3">
            <div className="px-3 py-1 bg-slate-100 dark:bg-slate-700 text-slate-700 dark:text-slate-300 rounded-full text-sm font-medium">
              {lang === "en" ? "Question" : "ጥያቄ"} {idx + 1}
            </div>
            {isFlagged && (
              <div className="px-2 py-1 bg-amber-100 dark:bg-amber-900/30 text-amber-700 dark:text-amber-300 rounded-full text-xs font-medium">
                {lang === "en" ? "Flagged" : "የተማይвиз"}
              </div>
            )}
          </div>
          <div className={`px-3 py-1 rounded-full text-sm font-medium ${
            isCorrect
              ? "bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-300"
              : selectedIdx >= 0
              ? "bg-red-100 dark:bg-red-900/30 text-red-700 dark:text-red-300"
              : "bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-400"
          }`}>
            {selectedIdx >= 0
              ? isCorrect
                ? (lang === "en" ? "Correct" : "ትክክል")
                : (lang === "en" ? "Incorrect" : "ልርር")
              : (lang === "en" ? "Not answered" : "አልተማለም")}
          </div>
        </div>
        
        <p className="text-lg font-medium text-gray-900 dark:text-gray-100 mb-4 leading-relaxed break-words overflow-wrap-anywhere">
          {qi.text}
        </p>
        
        <div className="space-y-3 mb-4">
          {qi.options.map((opt: ExamOption, i: number) => {
            const isCorrectOption = i === qi.correctIndex;
            const isSelectedOption = i === selectedIdx;
            
            return (
              <div
                key={opt.id}
                className={`flex items-center gap-3 p-4 rounded-xl border-2 transition-colors ${
                  isCorrectOption
                    ? "border-green-500 bg-green-50 dark:bg-green-900/20"
                    : isSelectedOption && !isCorrectOption
                    ? "border-red-500 bg-red-50 dark:bg-red-900/20"
                    : "border-slate-200 dark:border-slate-600 bg-slate-50 dark:bg-slate-700/50"
                }`}
              >
                <div className={`flex-shrink-0 w-6 h-6 rounded-full flex items-center justify-center ${
                  isCorrectOption
                    ? "bg-green-500"
                    : isSelectedOption
                    ? "bg-red-500"
                    : "bg-slate-300 dark:bg-slate-500"
                }`}>
                  {isCorrectOption ? (
                    <CheckCircle2 className="w-4 h-4 text-white" />
                  ) : isSelectedOption ? (
                    <X className="w-4 h-4 text-white" />
                  ) : (
                    <Circle className="w-4 h-4 text-slate-500" />
                  )}
                </div>
                <span className={`font-medium break-words flex-1 ${
                  isCorrectOption
                    ? "text-green-800 dark:text-green-200"
                    : isSelectedOption && !isCorrectOption
                    ? "text-red-800 dark:text-red-200"
                    : "text-gray-700 dark:text-gray-300"
                }`}>
                  {opt.label}
                </span>
              </div>
            );
          })}
        </div>
        
        {qi.explanation && (
          <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-xl p-4">
            <div className="flex items-start gap-2">
              <div className="p-1 bg-blue-100 dark:bg-blue-800/50 rounded">
                <AlertCircle className="w-4 h-4 text-blue-600 dark:text-blue-400" />
              </div>
              <div>
                <p className="font-medium text-blue-800 dark:text-blue-200 mb-1 text-sm">
                  {lang === "en" ? "Explanation" : "ማብራሪያ"}
                </p>
                <p className="text-blue-700 dark:text-blue-300 text-sm leading-relaxed break-words overflow-wrap-anywhere">
                  {qi.explanation}
                </p>
              </div>
            </div>
          </div>
        )}
      </div>
    );
  };

  const handleOption = useCallback(async (idx: number) => {
    if (quizDone || submitted) return;
    
    setSelected(idx);
    setAutoSaving(true);
    
    const optionId = q.options[idx].id;
    
    try {
      await action({ questionId: q.id, selectedOptionId: optionId } as any);
      const copy = [...answers];
      copy[current] = idx;
      setAnswers(copy);
    } catch (error) {
      console.error('Failed to save answer:', error);
    } finally {
      setAutoSaving(false);
    }
  }, [quizDone, submitted, q, action, answers, current]);

  const goto = (i: number) => {
    setCurrent(i);
    const preset = answers[i];
    setSelected(preset >= 0 ? preset : null);
  };

  const submitExam = () => {
    setSubmitted(true);
    setReviewMode("all");
    setShowCongrats(true);
  };

  if (loading) {
    return (
      <div className="min-h-dvh bg-background text-foreground flex items-center justify-center p-6">
        Loading…
      </div>
    );
  }
  if (!displayQuestions.length) {
    return (
      <div className="min-h-dvh bg-background text-foreground flex items-center justify-center p-6">
        No final exam.
      </div>
    );
  }

  return (
    <div className="min-h-screen h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-50 dark:from-gray-900 dark:via-slate-900 dark:to-indigo-950 overflow-hidden">
      {/* Professional Header */}
      <div className="bg-white/95 dark:bg-gray-900/95 backdrop-blur-sm border-b border-slate-200 dark:border-gray-700 shadow-sm sticky top-0 z-10">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <button
                onClick={() => router.back()}
                className="flex items-center gap-2 px-3 py-2 rounded-lg border border-slate-300 dark:border-slate-600 hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors"
              >
                <ChevronLeft className="w-4 h-4" />
                <span className="hidden sm:inline">{lang === "en" ? "Back" : "ተመለስ"}</span>
              </button>
              <div className="flex items-center gap-3">
                <div className="p-2 bg-gradient-to-br from-blue-500 to-indigo-600 rounded-lg">
                  <BookOpen className="w-5 h-5 text-white" />
                </div>
                <div>
                  <h1 className="text-xl font-bold text-gray-900 dark:text-white">
                    {lang === "en" ? "Final Examination" : "የመጨረሻ ፈተና"}
                  </h1>
                  <p className="text-sm text-gray-600 dark:text-gray-400">
                    {displayQuestions.length} {lang === "en" ? "Questions" : "ጥያቄዎች"}
                  </p>
                </div>
              </div>
            </div>
            
            <div className="flex items-center gap-4">
              {/* Timer */}
              {examStartTime && !submitted && (
                <div className="flex items-center gap-2 px-3 py-2 bg-blue-50 dark:bg-blue-900/30 rounded-lg">
                  <Clock className="w-4 h-4 text-blue-600 dark:text-blue-400" />
                  <span className="font-mono text-sm font-medium text-blue-700 dark:text-blue-300">
                    {formatTime(timeSpent)}
                  </span>
                </div>
              )}
              
              {/* Progress Indicator */}
              <div className="hidden sm:flex items-center gap-2">
                <div className="text-sm font-medium text-gray-700 dark:text-gray-300">
                  {answeredCount} / {displayQuestions.length}
                </div>
                <div className="w-20 h-2 bg-gray-200 dark:bg-gray-700 rounded-full overflow-hidden">
                  <div 
                    className={`h-full transition-all duration-300 ${getProgressColor(examProgress)}`}
                    style={{ width: `${examProgress}%` }}
                  />
                </div>
              </div>
              
              {/* Auto-save indicator */}
              {autoSaving && (
                <div className="flex items-center gap-1 text-xs text-green-600 dark:text-green-400">
                  <Save className="w-3 h-3 animate-pulse" />
                  <span>{lang === "en" ? "Saving..." : "በማስቀመጥ ላይ..."}</span>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
      {/* Main Content */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 pb-24 h-[calc(100vh-120px)] overflow-y-auto">
        <div className="grid grid-cols-1 lg:grid-cols-[1fr_320px] gap-6">
          {/* Question Panel */}
          <div className="bg-white dark:bg-gray-800 rounded-xl lg:rounded-2xl shadow-lg border border-slate-200 dark:border-gray-700 overflow-hidden">
            {!submitted ? (
              <div className="p-4 sm:p-6">
                {/* Question Header */}
                <div className="flex items-center justify-between mb-6">
                  <div className="flex items-center gap-3">
                    <div className="px-3 py-1 bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300 rounded-full text-sm font-medium">
                      {lang === "en" ? "Question" : "ጥያቄ"} {current + 1}
                    </div>
                    <div className="text-sm text-gray-500 dark:text-gray-400">
                      {lang === "en" ? "of" : "ከ"} {displayQuestions.length}
                    </div>
                  </div>
                  
                  <div className="flex items-center gap-2">
                    {/* Flag Question Button */}
                    <button
                      onClick={() => toggleQuestionFlag(current)}
                      className={`p-2 rounded-lg transition-colors ${
                        flaggedQuestions.has(current)
                          ? "bg-amber-100 dark:bg-amber-900/30 text-amber-600 dark:text-amber-400"
                          : "bg-gray-100 dark:bg-gray-700 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300"
                      }`}
                      title={lang === "en" ? "Flag for review" : "ልሚያዌት ማይвиз"}
                    >
                      <Target className="w-4 h-4" />
                    </button>
                    
                    {/* Hint Toggle */}
                    <button
                      onClick={() => setShowHints(!showHints)}
                      className={`p-2 rounded-lg transition-colors ${
                        showHints
                          ? "bg-green-100 dark:bg-green-900/30 text-green-600 dark:text-green-400"
                          : "bg-gray-100 dark:bg-gray-700 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300"
                      }`}
                      title={lang === "en" ? "Toggle hints" : "ማሳታ አንብር/አድርግ"}
                    >
                      {showHints ? <Eye className="w-4 h-4" /> : <EyeOff className="w-4 h-4" />}
                    </button>
                  </div>
                </div>
                
                {/* Question Content */}
                <div className="bg-slate-50 dark:bg-slate-800/50 rounded-lg lg:rounded-xl p-4 sm:p-6 mb-4 sm:mb-6">
                  <p className="text-lg font-medium text-gray-900 dark:text-gray-100 leading-relaxed mb-4 break-words overflow-wrap-anywhere">
                    {q.text}
                  </p>
                  
                  {showHints && q.explanation && (
                    <div className="mt-4 p-4 bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg">
                      <div className="flex items-start gap-2">
                        <Zap className="w-4 h-4 text-blue-600 dark:text-blue-400 mt-0.5 flex-shrink-0" />
                        <div>
                          <p className="text-sm font-medium text-blue-800 dark:text-blue-200 mb-1">
                            {lang === "en" ? "Hint" : "ማሳታ"}
                          </p>
                          <p className="text-sm text-blue-700 dark:text-blue-300 break-words overflow-wrap-anywhere">
                            {q.explanation}
                          </p>
                        </div>
                      </div>
                    </div>
                  )}
                </div>
                {/* Answer Options */}
                <div className="space-y-2 sm:space-y-3 mb-4 sm:mb-6">
                  {q.options.map(
                    (opt: { id: string; label: string }, idx: number) => {
                      const active = effectiveSelected === idx;
                      return (
                        <button
                          key={opt.id}
                          onClick={() => handleOption(idx)}
                          disabled={submitted || status === "done"}
                          className={`group w-full text-left p-3 sm:p-4 rounded-lg sm:rounded-xl border-2 transition-all duration-200 transform hover:scale-[1.02] ${
                            active
                              ? "border-blue-500 bg-blue-50 dark:bg-blue-900/20 shadow-lg"
                              : "border-slate-200 dark:border-slate-600 bg-white dark:bg-slate-700 hover:border-slate-300 dark:hover:border-slate-500 hover:shadow-md"
                          }`}
                        >
                          <div className="flex items-center gap-3">
                            <div className={`flex-shrink-0 w-6 h-6 rounded-full border-2 flex items-center justify-center transition-colors ${
                              active
                                ? "border-blue-500 bg-blue-500"
                                : "border-slate-300 dark:border-slate-500 group-hover:border-slate-400"
                            }`}>
                              {active && (
                                <CheckCircle2 className="w-4 h-4 text-white" />
                              )}
                            </div>
                            <span className={`text-base font-medium transition-colors break-words flex-1 ${
                              active
                                ? "text-blue-900 dark:text-blue-100"
                                : "text-gray-700 dark:text-gray-200 group-hover:text-gray-900 dark:group-hover:text-gray-100"
                            }`}>
                              {opt.label}
                            </span>
                          </div>
                        </button>
                      );
                    }
                  )}
                </div>
                
                {/* Confidence Level */}
                <div className="mb-4 sm:mb-6 p-3 sm:p-4 bg-gray-50 dark:bg-gray-700/50 rounded-lg">
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    {lang === "en" ? "How confident are you with this answer?" : "በዚህ ምላሽ ከክኬ ስንት የማምስል አንድ አልክ?"}
                  </label>
                  <div className="flex items-center gap-1 sm:gap-2">
                    {[1, 2, 3, 4, 5].map((level) => (
                      <button
                        key={level}
                        onClick={() => {
                          setConfidenceLevel(current, level);
                        }}
                        className={`w-8 h-8 sm:w-10 sm:h-10 rounded-full border-2 transition-all text-sm sm:text-base ${
                          confidenceLevels[current] === level
                            ? "border-yellow-500 bg-yellow-100 dark:bg-yellow-900/30 text-yellow-700 dark:text-yellow-300"
                            : "border-gray-300 dark:border-gray-600 hover:border-gray-400 text-gray-500 hover:text-gray-700"
                        }`}
                        title={`${lang === "en" ? "Confidence level" : "የማምስልነት ደረጃ"} ${level}`}
                      >
                        {level}
                      </button>
                    ))}
                    <span className="ml-2 text-xs text-gray-500 dark:text-gray-400">
                      {lang === "en" ? "(1=Low, 5=High)" : "(1=ዝቅ, 5=የፈተ)"}
                    </span>
                  </div>
                </div>

                {/* Enhanced Navigation Controls */}
                <div className="flex items-center justify-between pt-6 border-t border-slate-200 dark:border-slate-600">
                  <button
                    onClick={() => goto(Math.max(0, current - 1))}
                    disabled={current === 0}
                    className="flex items-center gap-2 px-4 py-2 rounded-lg border border-slate-300 dark:border-slate-600 disabled:opacity-40 hover:bg-slate-50 dark:hover:bg-slate-700 transition-colors disabled:hover:bg-transparent"
                  >
                    <ChevronLeft className="w-4 h-4" />
                    <span>{lang === "en" ? "Previous" : "ቀደም"}</span>
                  </button>
                  
                  <div className="flex items-center gap-3">
                    {/* Question Quick Nav */}
                    <div className="hidden md:flex items-center gap-1">
                      {displayQuestions.slice(Math.max(0, current - 2), current + 3).map((_, localIdx) => {
                        const questionIdx = Math.max(0, current - 2) + localIdx;
                        if (questionIdx >= displayQuestions.length) return null;
                        const isActive = questionIdx === current;
                        const isAnswered = answers[questionIdx] >= 0;
                        const isFlagged = flaggedQuestions.has(questionIdx);
                        
                        return (
                          <button
                            key={questionIdx}
                            onClick={() => goto(questionIdx)}
                            className={`w-8 h-8 rounded-lg text-xs font-medium transition-all ${
                              isActive
                                ? "bg-blue-500 text-white shadow-lg scale-110"
                                : isAnswered
                                ? "bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-300 hover:bg-green-200"
                                : isFlagged
                                ? "bg-amber-100 dark:bg-amber-900/30 text-amber-700 dark:text-amber-300 hover:bg-amber-200"
                                : "bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-600"
                            }`}
                          >
                            {questionIdx + 1}
                          </button>
                        );
                      })}
                    </div>
                    
                    {current < displayQuestions.length - 1 ? (
                      <button
                        onClick={() => goto(Math.min(displayQuestions.length - 1, current + 1))}
                        className="flex items-center gap-2 px-6 py-2 rounded-lg bg-blue-500 hover:bg-blue-600 text-white font-medium shadow-md hover:shadow-lg transition-all transform hover:scale-105"
                      >
                        <span>{lang === "en" ? "Next" : "ከዚህ በሐዋላ"}</span>
                        <ChevronRight className="w-4 h-4" />
                      </button>
                    ) : (
                      <button
                        onClick={submitExam}
                        disabled={answers.some((a) => a < 0)}
                        className="flex items-center gap-2 px-6 py-2 rounded-lg bg-gradient-to-r from-green-500 to-emerald-600 hover:from-green-600 hover:to-emerald-700 text-white font-medium shadow-md hover:shadow-lg transition-all transform hover:scale-105 disabled:opacity-50 disabled:transform-none disabled:shadow-none"
                      >
                        <Trophy className="w-4 h-4" />
                        <span>{lang === "en" ? "Submit Exam" : "ፈተና ማስነድ"}</span>
                      </button>
                    )}
                  </div>
                </div>
              </div>
            ) : (
              <div className="p-6">
                {/* Review Mode Header */}
                <div className="flex items-center justify-between mb-6">
                  <h2 className="text-2xl font-bold text-gray-900 dark:text-white">
                    {lang === "en" ? "Exam Review" : "የፈተና ምልክት"}
                  </h2>
                  <div className="flex items-center gap-2 bg-slate-100 dark:bg-slate-700 rounded-lg p-1">
                    <button
                      onClick={() => setReviewMode("paged")}
                      className={`px-4 py-2 text-sm font-medium rounded-md transition-colors ${
                        reviewMode === "paged"
                          ? "bg-white dark:bg-slate-600 text-blue-600 dark:text-blue-400 shadow-sm"
                          : "text-gray-600 dark:text-gray-300 hover:text-gray-900 dark:hover:text-gray-100"
                      }`}
                    >
                      {lang === "en" ? "Question by Question" : "ጥያቄ በጥያቄ"}
                    </button>
                    <button
                      onClick={() => setReviewMode("all")}
                      className={`px-4 py-2 text-sm font-medium rounded-md transition-colors ${
                        reviewMode === "all"
                          ? "bg-white dark:bg-slate-600 text-blue-600 dark:text-blue-400 shadow-sm"
                          : "text-gray-600 dark:text-gray-300 hover:text-gray-900 dark:hover:text-gray-100"
                      }`}
                    >
                      {lang === "en" ? "All Questions" : "ሁሉ ጥያቄዎች"}
                    </button>
                  </div>
                </div>
                
                {reviewMode === "paged" ? (
                  <div>
                    <ReviewCard qi={q} idx={current} />
                    <div className="mt-6 flex items-center justify-between">
                      <button
                        onClick={() => goto(Math.max(0, current - 1))}
                        disabled={current === 0}
                        className="flex items-center gap-2 px-4 py-2 rounded-lg border border-slate-300 dark:border-slate-600 disabled:opacity-40 hover:bg-slate-50 dark:hover:bg-slate-700 transition-colors"
                      >
                        <ChevronLeft className="w-4 h-4" />
                        <span>{lang === "en" ? "Previous" : "ቀደም"}</span>
                      </button>
                      <button
                        onClick={() => goto(Math.min(displayQuestions.length - 1, current + 1))}
                        disabled={current >= displayQuestions.length - 1}
                        className="flex items-center gap-2 px-4 py-2 rounded-lg bg-blue-500 hover:bg-blue-600 text-white transition-colors disabled:opacity-40"
                      >
                        <span>{lang === "en" ? "Next" : "ከዚህ በሐዋላ"}</span>
                        <ChevronRight className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                ) : (
                  <div className="space-y-4 sm:space-y-6 max-h-[calc(100vh-200px)] sm:max-h-[calc(100vh-300px)] overflow-y-auto pr-1 sm:pr-2 scrollbar-thin scrollbar-thumb-slate-300 dark:scrollbar-thumb-slate-600 scrollbar-track-transparent">
                    <div className="text-sm text-gray-600 dark:text-gray-400 mb-4">
                      {lang === "en" ? "Reviewing all questions and answers" : "ሁሉን ጥያቄዎች እና ምላሾች መመልክት"}
                    </div>
                    {displayQuestions.map((qi, i) => (
                      <ReviewCard key={qi.id} qi={qi} idx={i} />
                    ))}
                  </div>
                )}
              </div>
            )}
          </div>

          {/* Enhanced Sidebar */}
          <div className="space-y-4 lg:space-y-6">
            {/* Exam Statistics */}
            <div className="bg-white dark:bg-gray-800 rounded-xl lg:rounded-2xl shadow-lg border border-slate-200 dark:border-gray-700 p-4 sm:p-6">
              <div className="flex items-center gap-3 mb-4">
                <div className="p-2 bg-blue-100 dark:bg-blue-900/30 rounded-lg">
                  <BarChart3 className="w-5 h-5 text-blue-600 dark:text-blue-400" />
                </div>
                <h3 className="font-semibold text-gray-900 dark:text-white">
                  {lang === "en" ? "Progress" : "አስካክት"}
                </h3>
              </div>
              
              <div className="space-y-4">
                <div>
                  <div className="flex items-center justify-between text-sm mb-2">
                    <span className="text-gray-600 dark:text-gray-300">
                      {lang === "en" ? "Answered" : "የተማለሩ"}
                    </span>
                    <span className="font-medium text-gray-900 dark:text-white">
                      {answeredCount} / {displayQuestions.length}
                    </span>
                  </div>
                  <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-2">
                    <div 
                      className={`h-2 rounded-full transition-all duration-300 ${getProgressColor(examProgress)}`}
                      style={{ width: `${examProgress}%` }}
                    />
                  </div>
                </div>
                
                {flaggedQuestions.size > 0 && (
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-amber-600 dark:text-amber-400">
                      {lang === "en" ? "Flagged" : "የተማይвиз"}
                    </span>
                    <span className="font-medium">{flaggedQuestions.size}</span>
                  </div>
                )}
                
                {examStartTime && !submitted && (
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-gray-600 dark:text-gray-300">
                      {lang === "en" ? "Time Elapsed" : "የተጠቀጠ ጊዜ"}
                    </span>
                    <span className="font-mono font-medium text-blue-600 dark:text-blue-400">
                      {formatTime(timeSpent)}
                    </span>
                  </div>
                )}
              </div>
            </div>
            
            {/* Question Navigation Grid */}
            <div className="bg-white dark:bg-gray-800 rounded-xl lg:rounded-2xl shadow-lg border border-slate-200 dark:border-gray-700 p-4 sm:p-6">
              <div className="flex items-center justify-between mb-4">
                <h3 className="font-semibold text-gray-900 dark:text-white">
                  {lang === "en" ? "Questions" : "ጥያቄዎች"}
                </h3>
                <button
                  onClick={() => router.back()}
                  className="p-1 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 transition-colors"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>
              
              <div className="grid grid-cols-4 sm:grid-cols-5 gap-1.5 sm:gap-2 mb-4">
                {displayQuestions.map((qi: any, i: number) => {
                  const answered = answers[i] >= 0;
                  const currentPage = i === current;
                  const isCorrect = submitted && answered && answers[i] === qi.correctIndex;
                  const isFlagged = flaggedQuestions.has(i);
                  const isIncorrect = submitted && answered && answers[i] !== qi.correctIndex;
                  
                  return (
                    <button
                      key={i}
                      onClick={() => goto(i)}
                      className={`relative h-8 sm:h-10 rounded-md sm:rounded-lg border-2 text-xs font-medium transition-all hover:scale-105 ${
                        currentPage
                          ? "border-blue-500 bg-blue-500 text-white shadow-lg"
                          : submitted
                          ? isCorrect
                            ? "border-green-500 bg-green-50 dark:bg-green-900/20 text-green-700 dark:text-green-300"
                            : isIncorrect
                            ? "border-red-500 bg-red-50 dark:bg-red-900/20 text-red-700 dark:text-red-300"
                            : "border-gray-300 dark:border-gray-600 text-gray-500 dark:text-gray-400"
                          : answered
                          ? "border-green-500 bg-green-50 dark:bg-green-900/20 text-green-700 dark:text-green-300"
                          : "border-gray-300 dark:border-gray-600 text-gray-500 dark:text-gray-400 hover:border-gray-400"
                      }`}
                    >
                      {i + 1}
                      {isFlagged && (
                        <div className="absolute -top-1 -right-1 w-3 h-3 bg-amber-500 rounded-full" />
                      )}
                    </button>
                  );
                })}
              </div>
              
              {/* Legend */}
              <div className="space-y-2 text-xs">
                <div className="flex items-center gap-2">
                  <div className="w-3 h-3 bg-green-500 rounded" />
                  <span className="text-gray-600 dark:text-gray-300">
                    {submitted 
                      ? (lang === "en" ? "Correct" : "ትክክል") 
                      : (lang === "en" ? "Answered" : "የተማለ")}
                  </span>
                </div>
                {submitted && (
                  <div className="flex items-center gap-2">
                    <div className="w-3 h-3 bg-red-500 rounded" />
                    <span className="text-gray-600 dark:text-gray-300">
                      {lang === "en" ? "Incorrect" : "ልርር"}
                    </span>
                  </div>
                )}
                <div className="flex items-center gap-2">
                  <div className="w-3 h-3 bg-amber-500 rounded-full" />
                  <span className="text-gray-600 dark:text-gray-300">
                    {lang === "en" ? "Flagged" : "የተማይвиз"}
                  </span>
                </div>
              </div>
            </div>
            
            {/* Quick Actions */}
            {!submitted && (
              <div className="bg-white dark:bg-gray-800 rounded-xl lg:rounded-2xl shadow-lg border border-slate-200 dark:border-gray-700 p-4 sm:p-6">
                <h3 className="font-semibold text-gray-900 dark:text-white mb-4">
                  {lang === "en" ? "Quick Actions" : "ፍጣን መጠብባዎች"}
                </h3>
                <div className="space-y-3">
                  <button
                    onClick={() => {
                      // Go to first unanswered question
                      const firstUnanswered = answers.findIndex(a => a < 0);
                      if (firstUnanswered !== -1) goto(firstUnanswered);
                    }}
                    disabled={allAnswered}
                    className="w-full flex items-center gap-2 px-3 py-2 text-sm bg-blue-50 dark:bg-blue-900/20 text-blue-700 dark:text-blue-300 rounded-lg hover:bg-blue-100 dark:hover:bg-blue-900/30 transition-colors disabled:opacity-50"
                  >
                    <Target className="w-4 h-4" />
                    <span>{lang === "en" ? "Next Unanswered" : "ከዚህ የላለተማለ"}</span>
                  </button>
                  
                  {flaggedQuestions.size > 0 && (
                    <button
                      onClick={() => {
                        const flaggedArray = Array.from(flaggedQuestions);
                        const nextFlagged = flaggedArray.find(q => q > current) ?? flaggedArray[0];
                        goto(nextFlagged);
                      }}
                      className="w-full flex items-center gap-2 px-3 py-2 text-sm bg-amber-50 dark:bg-amber-900/20 text-amber-700 dark:text-amber-300 rounded-lg hover:bg-amber-100 dark:hover:bg-amber-900/30 transition-colors"
                    >
                      <AlertCircle className="w-4 h-4" />
                      <span>{lang === "en" ? "Review Flagged" : "የተማይድን መመልክት"}</span>
                    </button>
                  )}
                </div>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Enhanced Congratulations Modal */}
      {submitted && showCongrats && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-2 sm:p-4 overflow-y-auto">
          <div className="relative w-full max-w-sm sm:max-w-lg bg-white dark:bg-gray-800 rounded-2xl sm:rounded-3xl shadow-2xl border border-slate-200 dark:border-gray-700 overflow-hidden my-auto">
            {/* Header with gradient */}
            <div className="bg-gradient-to-br from-blue-500 via-purple-500 to-indigo-600 p-4 sm:p-6 text-white relative">
              <button
                onClick={() => setShowCongrats(false)}
                className="absolute top-4 right-4 p-2 rounded-full bg-white/20 hover:bg-white/30 transition-colors"
              >
                <X className="w-4 h-4" />
              </button>
              
              <div className="flex flex-col items-center text-center">
                <div className="w-20 h-20 rounded-full bg-white/20 backdrop-blur-sm flex items-center justify-center mb-4">
                  <Trophy className="w-10 h-10 text-yellow-300" />
                </div>
                <h2 className="text-2xl font-bold mb-2">
                  {lang === "en" ? "Exam Completed!" : "ፈተና ተጠቆ!"}
                </h2>
                <p className="text-white/90">
                  {lang === "en" 
                    ? "Congratulations on completing your final examination" 
                    : "የመጨረሻ ፈተናን በተሳካሁነት አቦላኤ!"}
                </p>
              </div>
            </div>
            
            {/* Content */}
            <div className="p-4 sm:p-6 space-y-4 sm:space-y-6">
              {/* Score Display */}
              {!certLoading && cert && (
                <div className="space-y-4">
                  <div className="text-center">
                    <div className="inline-flex items-center gap-3 mb-3">
                      <div className={`px-4 py-2 rounded-full text-sm font-semibold ${
                        cert.result === "excellent"
                          ? "bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-300"
                          : cert.result === "veryGood"
                          ? "bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300"
                          : cert.result === "good"
                          ? "bg-yellow-100 dark:bg-yellow-900/30 text-yellow-700 dark:text-yellow-300"
                          : "bg-red-100 dark:bg-red-900/30 text-red-700 dark:text-red-300"
                      }`}>
                        {cert.result === "excellent" && (lang === "en" ? "Excellent" : "አስፈጣቕ")}
                        {cert.result === "veryGood" && (lang === "en" ? "Very Good" : "በጣም ትርው")}
                        {cert.result === "good" && (lang === "en" ? "Good" : "ትርው")}
                        {cert.result === "poor" && (lang === "en" ? "Needs Improvement" : "ማካሀል ይፈልጋል")}
                      </div>
                      <div className="text-2xl font-bold text-gray-900 dark:text-white">
                        {Math.round(cert.percent)}%
                      </div>
                    </div>
                    
                    {/* Progress Bar */}
                    <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-3 mb-3 overflow-hidden">
                      <div
                        className={`h-full transition-all duration-1000 ease-out ${
                          cert.percent >= 85 ? "bg-gradient-to-r from-green-500 to-emerald-600" :
                          cert.percent >= 70 ? "bg-gradient-to-r from-blue-500 to-indigo-600" :
                          cert.percent >= 50 ? "bg-gradient-to-r from-yellow-500 to-amber-600" :
                          "bg-gradient-to-r from-red-500 to-rose-600"
                        }`}
                        style={{
                          width: `${Math.min(100, Math.max(0, Math.round(cert.percent || 0)))}%`,
                        }}
                      />
                    </div>
                    
                    <div className="text-sm text-gray-600 dark:text-gray-400">
                      {lang === "en" ? "Correct answers:" : "ስሖው ምላሾች:"} 
                      <span className="font-semibold text-gray-900 dark:text-white ml-1">
                        {cert.correct} / {cert.total}
                      </span>
                    </div>
                  </div>
                  
                  {/* Time Stats */}
                  {examStartTime && (
                    <div className="bg-slate-50 dark:bg-slate-800/50 rounded-lg p-4">
                      <div className="flex items-center justify-between text-sm">
                        <span className="text-gray-600 dark:text-gray-400">
                          {lang === "en" ? "Time taken:" : "የተጠቀሰ ጊዜ:"}
                        </span>
                        <span className="font-mono font-medium text-gray-900 dark:text-white">
                          {formatTime(timeSpent)}
                        </span>
                      </div>
                    </div>
                  )}
                </div>
              )}
              
              {/* Action Buttons */}
              <div className="grid grid-cols-2 gap-3">
                <button
                  onClick={() => {
                    setReviewMode("all");
                    setShowCongrats(false);
                  }}
                  className="flex items-center justify-center gap-2 px-4 py-3 rounded-xl bg-blue-50 dark:bg-blue-900/20 text-blue-700 dark:text-blue-300 hover:bg-blue-100 dark:hover:bg-blue-900/30 transition-colors font-medium"
                >
                  <Eye className="w-4 h-4" />
                  <span>{lang === "en" ? "Review Answers" : "ምላሾች መመልክት"}</span>
                </button>
                <button
                  onClick={() => setShowCongrats(false)}
                  className="flex items-center justify-center gap-2 px-4 py-3 rounded-xl border border-slate-300 dark:border-slate-600 hover:bg-slate-50 dark:hover:bg-slate-700 transition-colors font-medium"
                >
                  <span>{lang === "en" ? "Close" : "ዘጋ"}</span>
                </button>
              </div>
              
              {/* Certificate Button */}
              <button
                onClick={() =>
                  router.push(`/${lang}/mycourse/${courseId}/certificate`)
                }
                disabled={!cert?.status}
                className="w-full flex items-center justify-center gap-2 px-6 py-4 rounded-xl bg-gradient-to-r from-green-500 to-emerald-600 hover:from-green-600 hover:to-emerald-700 text-white font-semibold shadow-lg hover:shadow-xl transition-all transform hover:scale-105 disabled:opacity-50 disabled:transform-none disabled:shadow-none"
              >
                <Award className="w-5 h-5" />
                <span>{lang === "en" ? "Get Certificate" : "ሰናድ አግን"}</span>
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
