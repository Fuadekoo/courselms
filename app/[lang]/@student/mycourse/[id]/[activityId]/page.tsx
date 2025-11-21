/* eslint-disable @typescript-eslint/no-explicit-any */
"use client";
import useAction from "@/hooks/useAction";
import useData from "@/hooks/useData";
import {
  getActivityQuiz,
  saveStudentQuizAnswers,
  getActivityQuizStatus,
  unlockTheFinalExamAndQuiz,
  readyToCertification,
} from "@/actions/student/mycourse";
import React, { useEffect, useMemo, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import {
  Trophy,
  Sparkles,
  CheckCircle2,
  Circle,
  ChevronRight,
  X,
  RotateCcw,
} from "lucide-react";
import Loading from "@/components/loading";

export default function Page() {
  const router = useRouter();
  const params = useParams<{ lang: string; id: string; activityId: string }>();
  const lang = params?.lang || "en";
  const activityId = params?.activityId || "";
  const courseId = params?.id || "";

  const [current, setCurrent] = useState(0);
  const [selected, setSelected] = useState<number | null>(null);
  const [answers, setAnswers] = useState<number[]>([]);
  const [showResult, setShowResult] = useState(false);
  const [showFeedback, setShowFeedback] = useState(false);

  const { data, loading } = useData({
    func: getActivityQuiz,
    args: [activityId],
  });
  const { action } = useAction(saveStudentQuizAnswers, undefined, {
    error:
      lang == "en"
        ? {
            title: "Failed to Save Answer",
            description:
              "Your quiz answer could not be saved. Please check your connection and try again.",
          }
        : {
            title: "መልስ ማስቀመጥ አልተሳካም",
            description: "የፈተና መልስዎ ሊቀመጥ አልተቻለም። ግንኙነትዎን በማረጋገጥ እንደገና ይሞክሩ።",
          },
    success:
      lang == "en"
        ? {
            title: "Answer Saved Successfully",
            description:
              "Your quiz answer has been recorded and saved automatically.",
          }
        : {
            title: "መልስ በተሳካ ሁኔታ ተቀምጧል",
            description: "የፈተና መልስዎ በራስ-ሰር ተመዝግቦ ተቀምጧል።",
          },
  });

  const [isUpdating, setIsUpdating] = useState(false);

  const { data: quizStatus } = useData({
    // eslint-disable-line @typescript-eslint/no-unused-vars
    func: getActivityQuizStatus,
    args: [activityId],
  });

  // Lock map at course level
  const { data: locks } = useData({
    func: unlockTheFinalExamAndQuiz,
    args: [courseId],
  });
  const isLocked = useMemo(() => {
    const act = (locks as any)?.activities?.find(
      (a: any) => a.activityId === activityId
    );
    return Boolean(act?.locked);
  }, [locks, activityId]);

  // Get next activity info for navigation
  const nextActivityId = useMemo(() => {
    const lockData = locks as any;
    if (!lockData?.activities) return null;

    // Find current activity index
    const currentIndex = lockData.activities.findIndex(
      (a: any) => a.id === activityId
    );

    // Get next activity that has questions (quiz)
    for (let i = currentIndex + 1; i < lockData.activities.length; i++) {
      const nextActivity = lockData.activities[i];
      // Check if activity has questions and is unlocked
      if (
        nextActivity.question &&
        nextActivity.question.length > 0 &&
        !nextActivity.locked
      ) {
        return {
          id: nextActivity.id,
          titleEn: nextActivity.titleEn,
          titleAm: nextActivity.titleAm,
          locked: nextActivity.locked,
        };
      }
    }

    // If no next quiz activity, check if final exam is available
    if (!lockData.finalExamLocked) {
      return {
        id: "finalexam",
        titleEn: "Final Exam",
        titleAm: "የመጨረሻ ፈተና",
        locked: false,
      };
    }

    return null;
  }, [locks, activityId]);

  // Certification readiness (after final exam)
  const { data: cert } = useData({
    func: readyToCertification,
    args: [courseId],
  });

  const questions = useMemo(() => {
    const list = Array.isArray(data) ? data : [];
    return list.map((q: any) => {
      const opts = Array.isArray(q.questionOptions) ? q.questionOptions : [];
      const answerId = Array.isArray(q.questionAnswer)
        ? q.questionAnswer[0]?.answerId
        : q.questionAnswer?.answerId;
      const correctIndex = opts.findIndex((o: any) => o.id === answerId);
      const preIdx = q.studentSelectedOptionId
        ? opts.findIndex((o: any) => o.id === q.studentSelectedOptionId)
        : -1;
      return {
        id: q.id,
        text: q.question,
        options: opts.map((o: any) => ({ id: o.id, label: o.option })),
        correctIndex,
        explanation: q.answerExplanation ?? "",
        previouslySelectedIndex: preIdx,
      };
    });
  }, [data]);

  // Prefill answers from history
  useEffect(() => {
    setAnswers(questions.map((q) => q.previouslySelectedIndex ?? -1));
    setCurrent(0);
    setSelected(null);
    setShowResult(false);
    setShowFeedback(false);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [questions.length]);

  // Lock flags
  const quizDone = quizStatus === "done";
  const quizPartial = quizStatus === "partial";
  const questionAlreadyAnswered = answers[current] >= 0;

  const progressPct = useMemo(
    () =>
      questions.length
        ? Math.round(((current + 1) / questions.length) * 100)
        : 0,
    [current, questions.length]
  );

  const score = useMemo(
    () =>
      answers.reduce(
        (acc: number, ans: number, idx: number) =>
          acc + (ans === questions[idx]?.correctIndex ? 1 : 0),
        0
      ),
    [answers, questions]
  );

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <Loading />
      </div>
    );
  }

  if (!questions.length) {
    return (
      <div className="min-h-dvh bg-background text-foreground flex items-center justify-center p-6">
        <div className="text-sm opacity-70">
          No quiz available for this activity.
        </div>
      </div>
    );
  }

  const q = questions[current];
  const correctIdx = q.correctIndex;
  const effectiveSelected = answers[current] >= 0 ? answers[current] : selected;
  const isCorrectSelection =
    effectiveSelected !== null && effectiveSelected === correctIdx;

  const handleOption = async (idx: number) => {
    if (isLocked) return; // blocked by sequence lock only
    // Removed quizDone check to allow answer changes even after completion

    // Allow changing answers even if previously answered
    setSelected(idx);

    // Hide feedback temporarily when changing answer
    setShowFeedback(false);

    // Update local state immediately
    const newAnswers = [...answers];
    newAnswers[current] = idx;
    setAnswers(newAnswers);

    // Save the answer to database immediately
    const selectedOptionId = questions[current].options[idx].id;
    try {
      await action({
        questionId: questions[current].id,
        selectedOptionId,
      } as any);

      // Show feedback after successful save
      setTimeout(() => {
        setShowFeedback(true);
      }, 300); // Small delay for better UX
    } catch (error) {
      console.error("Failed to save answer:", error);
      // Revert local state if save failed
      newAnswers[current] = answers[current];
      setAnswers(newAnswers);
      setSelected(answers[current] >= 0 ? answers[current] : null);
      // Restore previous feedback state
      setShowFeedback(answers[current] >= 0);
    }
  };

  const handleNext = async () => {
    if (selected === null) {
      // If the user can't answer (done or already answered), just advance
      if (quizDone || (quizPartial && questionAlreadyAnswered)) {
        if (current < questions.length - 1) {
          setCurrent(current + 1);
          setSelected(null);
          setShowFeedback(false);
        } else {
          setShowResult(true);
        }
      }
      return;
    }

    if (!showFeedback) {
      // Since we now save immediately in handleOption, just show feedback
      setShowFeedback(true);
      return;
    }

    if (current < questions.length - 1) {
      const nextIndex = current + 1;
      setCurrent(nextIndex);
      const preset = answers[nextIndex];
      setSelected(preset >= 0 ? preset : null);
      // Show feedback if the next question has been answered
      setShowFeedback(preset >= 0);
    } else {
      setShowResult(true);
    }
  };

  const handlePrev = () => {
    if (current === 0) return;
    const prev = current - 1;
    setCurrent(prev);
    const preset = answers[prev];
    setSelected(preset >= 0 ? preset : null);
    // Don't automatically hide feedback when navigating - let user see their previous answers
    setShowFeedback(preset >= 0);
  };

  const handleQuit = () => router.back();

  // Handle update quiz function
  const handleUpdateQuiz = async () => {
    // Show confirmation dialog
    const confirmMessage =
      lang === "en"
        ? "Are you sure you want to update this quiz?\n\nThis action will allow you to modify your previous answers and update your progress. You can continue from where you left off or make changes to your responses.\n\nYour progress will be updated accordingly."
        : "የዚህን ፈተና ማዘመን ይፈልጋሉ?\n\nይህ እርምጃ የተቀደሙ መልሶችዎን እንዲቀይሩ እና የእድገትዎን እንዲያዘምኑ ያስችልዎታል። ከተቀረቡበት ቦታ መቀጠል ወይም በመልሶችዎ ላይ ለውጦች ማድረግ ይችላሉ።\n\nየእድገትዎ በዚሁ መሰረት ይዘመናል።";

    if (!window.confirm(confirmMessage)) {
      return;
    }

    try {
      setIsUpdating(true);

      // Update local state to allow modifications
      setShowResult(false);
      setShowFeedback(false);

      // Refresh the quiz data to get current state
      window.location.reload();
    } catch (error) {
      console.error("Error during quiz update:", error);
      setIsUpdating(false);
    }
  };

  // Feedback visibility: always show for answered questions or when showFeedback
  const shouldShowFeedback = showFeedback || answers[current] >= 0;

  // Advance availability without current selection - allow advancing if question is answered
  const canAdvanceWithoutSelect =
    quizDone || answers[current] >= 0 || shouldShowFeedback;

  // Update labels
  const nextLabel = shouldShowFeedback
    ? current === questions.length - 1
      ? "See Result"
      : "Continue"
    : current === questions.length - 1
    ? "Submit"
    : "Next";

  if (showResult) {
    const total = questions.length;
    const coins = score * 250;
    const perfect = score === total;
    return (
      <div className="h-full flex flex-col overflow-hidden">
        <div className="flex-1 overflow-y-auto">
          <div className="max-w-md mx-auto p-4">
            <div className="relative bg-background border border-slate-200 dark:border-slate-700 rounded-3xl shadow-2xl overflow-hidden">
              <div className="absolute inset-0 pointer-events-none bg-[radial-gradient(circle_at_top,rgba(99,102,241,0.15),transparent_50%)]" />

              <div className="relative z-10 p-6">
                <div className="flex flex-col items-center text-center space-y-4">
                  <div className="w-24 h-24 rounded-full bg-yellow-400/15 flex items-center justify-center">
                    <Trophy className="w-14 h-14 text-yellow-500 dark:text-yellow-400" />
                  </div>
                  <h2 className="text-2xl font-bold">
                    {perfect ? "Winner!" : "Quiz Result"}
                  </h2>
                  <p className="text-slate-600 dark:text-slate-300 max-w-sm">
                    {perfect
                      ? "Outstanding performance."
                      : "Great job completing the quiz. Keep practicing!"}
                  </p>

                  <div className="flex items-baseline gap-2 mt-2">
                    <span className="uppercase tracking-wide text-slate-500 dark:text-slate-400 text-xs">
                      Your Score
                    </span>
                    <span className="text-3xl font-extrabold">{score}</span>
                    <span className="text-xl text-slate-500 dark:text-slate-400">
                      / {total}
                    </span>
                  </div>

                  <div className="mt-2 text-sm text-slate-700 dark:text-slate-300">
                    <span className="inline-flex items-center gap-2 rounded-full bg-emerald-500/10 text-emerald-700 dark:text-emerald-300 px-3 py-1">
                      <Sparkles className="w-4 h-4" /> Earned Coins:{" "}
                      <b>{coins}</b>
                    </span>
                  </div>

                  <div className="grid grid-cols-2 gap-3 w-full mt-6">
                    <button
                      onClick={() =>
                        window.navigator.share?.({
                          title: "Quiz Result",
                          text: `I scored ${score}/${total}!`,
                        })
                      }
                      className="px-4 py-3 rounded-xl border border-slate-300 dark:border-slate-600 hover:bg-slate-50 dark:hover:bg-slate-800 transition"
                    >
                      Share Results
                    </button>
                    <button
                      onClick={handleUpdateQuiz}
                      disabled={isUpdating}
                      className="px-4 py-3 rounded-xl bg-sky-500 hover:bg-sky-400 text-white dark:text-slate-900 font-semibold transition disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                    >
                      {isUpdating ? (
                        <>
                          <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                          <span>
                            {lang === "en" ? "Updating..." : "በማዘመን ላይ..."}
                          </span>
                        </>
                      ) : (
                        <>
                          <RotateCcw className="w-4 h-4" />
                          <span>
                            {lang === "en" ? "Update Quiz" : "ፈተናን አዘምን"}
                          </span>
                        </>
                      )}
                    </button>
                  </div>

                  {/* Next Quiz Button */}
                  {nextActivityId && (
                    <div className="w-full mt-4">
                      <button
                        onClick={() => {
                          if (nextActivityId.id === "finalexam") {
                            router.push(
                              `/${lang}/mycourse/${courseId}/finalexam`
                            );
                          } else {
                            router.push(
                              `/${lang}/mycourse/${courseId}/${nextActivityId.id}`
                            );
                          }
                        }}
                        className="w-full px-6 py-4 rounded-xl bg-gradient-to-r from-emerald-500 to-teal-600 hover:from-emerald-400 hover:to-teal-500 text-white font-semibold transition-all duration-300 hover:shadow-lg hover:scale-105 active:scale-95 flex items-center justify-center gap-3"
                      >
                        <div className="flex items-center gap-2">
                          {nextActivityId.id === "finalexam" ? (
                            <Trophy className="w-5 h-5" />
                          ) : (
                            <Sparkles className="w-5 h-5" />
                          )}
                          <span>
                            {lang === "en"
                              ? `Go to ${
                                  nextActivityId.id === "finalexam"
                                    ? "Final Exam"
                                    : "Next Quiz"
                                }`
                              : `ወደ ${
                                  nextActivityId.id === "finalexam"
                                    ? "የመጨረሻ ፈተና"
                                    : "ቀጣይ ፈተና"
                                }`}
                          </span>
                        </div>
                        <ChevronRight className="w-5 h-5" />
                      </button>

                      {/* Next quiz title */}
                      <p className="text-center text-xs text-slate-500 dark:text-slate-400 mt-2">
                        {nextActivityId.id !== "finalexam" &&
                          (lang === "en"
                            ? nextActivityId.titleEn
                            : nextActivityId.titleAm)}
                      </p>
                    </div>
                  )}

                  <button
                    onClick={handleQuit}
                    className="mt-3 inline-flex items-center gap-2 text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white"
                  >
                    <X className="w-4 h-4" /> Close
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <>
      <div className="min-h-screen overflow-hidden bg-background text-foreground py-4 px-4">
        <div className="max-w-md overflow-hidden mx-auto h-full flex flex-col">
          <div className="relative bg-background border border-slate-200 dark:border-slate-700 rounded-3xl shadow-2xl overflow-hidden flex-1 flex flex-col">
            <div className="absolute inset-0 overflow-hidden pointer-events-none bg-[radial-gradient(circle_at_top,rgba(99,102,241,0.15),transparent_50%)]" />

            <div className="relative z-10 overflow-hidden">
              {/* Scrollable Content Area */}
              <div className="p-6 space-y-6 max-h-[calc(100vh-200px)] overflow-y-auto">
                {/* Certificate CTA */}
                {cert?.status && (
                  <div className="rounded-2xl border border-emerald-300/50 bg-emerald-50 dark:bg-emerald-900/20 p-3 flex items-center justify-between">
                    <div className="flex items-center gap-2 text-emerald-700 dark:text-emerald-300">
                      <Trophy className="w-5 h-5" />
                      <span className="text-sm font-medium">
                        Certificate is ready
                      </span>
                    </div>
                    <button
                      onClick={() =>
                        router.push(`/${lang}/mycourse/${courseId}/certificate`)
                      }
                      className="px-3 py-1.5 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white text-sm"
                    >
                      View certificate
                    </button>
                  </div>
                )}

                {/* Lock notice */}
                {isLocked && (
                  <div className="rounded-2xl border border-amber-300/60 bg-amber-50 dark:bg-amber-900/20 p-3 text-amber-800 dark:text-amber-300 text-sm">
                    This quiz is locked. Please complete previous quizzes to
                    unlock it.
                  </div>
                )}

                {/* Header */}
                <div className="flex items-center justify-between">
                  <div>
                    <p className="uppercase text-xs tracking-widest text-slate-500 dark:text-slate-400">
                      Mathematics Quiz
                    </p>
                    <h2 className="text-lg font-semibold">
                      Question {String(current + 1).padStart(2, "0")}
                      <span className="text-slate-500 dark:text-slate-400">
                        /{questions.length}
                      </span>
                    </h2>
                  </div>
                  <button
                    onClick={handleQuit}
                    className="text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white"
                  >
                    <X className="w-5 h-5" />
                  </button>
                </div>

                {/* Progress */}
                <div>
                  <div className="h-1.5 w-full bg-slate-200 dark:bg-slate-800 rounded-full overflow-hidden">
                    <div
                      className="h-full bg-sky-500"
                      style={{ width: `${progressPct}%` }}
                    />
                  </div>
                  <p className="mt-1 text-xs text-slate-500 dark:text-slate-400">
                    {progressPct}% completed
                  </p>
                </div>

                {/* Question Text */}
                <p className="text-slate-800 dark:text-slate-100 leading-relaxed break-words overflow-wrap-anywhere">
                  {q.text}
                </p>

                {/* Options */}
                <div className="space-y-3">
                  {q.options.map(
                    (opt: { id: string; label: string }, idx: number) => {
                      const isCorrectOption = idx === correctIdx;
                      const isSelected = effectiveSelected === idx;
                      const base =
                        "w-full text-left px-4 py-3 rounded-2xl border transition flex items-center gap-3";

                      let style =
                        "border-slate-300 dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-800";
                      let icon: React.ReactNode = (
                        <Circle className="w-5 h-5 text-slate-400 dark:text-slate-500" />
                      );

                      if (shouldShowFeedback) {
                        if (isCorrectOption) {
                          style =
                            "border-emerald-500 bg-emerald-100 dark:bg-emerald-500/10";
                          icon = (
                            <CheckCircle2 className="w-5 h-5 text-emerald-600 dark:text-emerald-400" />
                          );
                        } else if (isSelected) {
                          style =
                            "border-amber-500 bg-amber-100 dark:bg-amber-500/10";
                          icon = (
                            <X className="w-5 h-5 text-amber-600 dark:text-amber-400" />
                          );
                        } else {
                          style =
                            "border-slate-300 dark:border-slate-700 opacity-60";
                        }
                      } else if (isSelected) {
                        style = "border-sky-500 bg-sky-100 dark:bg-sky-500/10";
                        icon = (
                          <CheckCircle2 className="w-5 h-5 text-sky-600 dark:text-sky-400" />
                        );
                      }

                      return (
                        <button
                          key={idx}
                          onClick={() => handleOption(idx)}
                          disabled={isLocked}
                          className={`${base} ${style} ${
                            isLocked ? "opacity-60 cursor-not-allowed" : ""
                          }`}
                        >
                          {icon}
                          <span className="text-sm text-slate-800 dark:text-slate-200 break-words flex-1">
                            {opt.label}
                          </span>
                        </button>
                      );
                    }
                  )}
                </div>

                {/* Feedback & Explanation */}
                {shouldShowFeedback && (
                  <div className="mt-3" aria-live="polite">
                    <div
                      className={`mb-3 inline-flex items-center gap-2 rounded-full px-3 py-1 text-sm ${
                        isCorrectSelection
                          ? "bg-emerald-500/10 text-emerald-700 dark:text-emerald-300"
                          : "bg-amber-500/10 text-amber-700 dark:text-amber-300"
                      }`}
                    >
                      {isCorrectSelection ? "Correct!" : "Incorrect"}
                    </div>
                    <div className="rounded-xl border border-slate-200 dark:border-slate-700 p-4 text-sm text-slate-700 dark:text-slate-300 bg-white/60 dark:bg-transparent break-words overflow-wrap-anywhere">
                      <p className="font-medium mb-1">Explanation</p>
                      <p className="leading-relaxed break-words">{q.explanation}</p>
                    </div>
                  </div>
                )}
              </div>

              {/* Fixed Footer Actions */}
              <div className="border-t border-slate-200 dark:border-slate-700 bg-background/95 backdrop-blur-sm p-6sticky bottom-0 z-10">
                <div className="flex items-center justify-between">
                  <button
                    onClick={handleQuit}
                    className="text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white text-sm"
                  >
                    Quit Quiz
                  </button>
                  <div className="flex items-center gap-2">
                    <button
                      onClick={handlePrev}
                      disabled={current === 0}
                      className="px-4 py-2 rounded-xl border border-slate-300 dark:border-slate-700 text-slate-700 dark:text-slate-300 disabled:opacity-40 hover:bg-slate-50 dark:hover:bg-slate-800"
                    >
                      Back
                    </button>
                    <button
                      onClick={handleNext}
                      disabled={
                        isLocked ||
                        (selected === null && !canAdvanceWithoutSelect)
                      }
                      className="px-4 py-2 rounded-xl bg-sky-500 hover:bg-sky-400 text-white dark:text-slate-900 font-semibold disabled:opacity-50 inline-flex items-center gap-2"
                    >
                      {nextLabel}
                      <ChevronRight className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
      {/* Add the chat assistant floating widget */}
      {/* <ChatComponent /> */}
    </>
  );
}
