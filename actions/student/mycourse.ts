/* eslint-disable @typescript-eslint/no-explicit-any */
"use server";
import { auth } from "@/lib/auth";
import prisma from "@/lib/db";
import { StateType } from "@/lib/definations";

export async function getAllMyCourses(studentId: string) {
  try {
    const paidOrders = await prisma.order.findMany({
      where: { userId: studentId, status: "paid" },
      select: { courseId: true },
    });

    const courseIds = paidOrders.map((order) => order.courseId);

    if (courseIds.length === 0) {
      return [];
    }

    const data = await prisma.course
      .findMany({
        where: {
          id: {
            in: courseIds,
          },
        },
        include: {
          activity: { select: { _count: { select: { subActivity: true } } } },
          instructor: {
            select: { id: true, firstName: true, fatherName: true },
          },
        },
      })
      .then((res) =>
        res.map(
          ({
            id,
            price,
            instructorRate,
            sellerRate,
            affiliateRate,
            activity,
            birrPrice,
            dolarPrice,
            ...rest
          }) => ({
            id,
            ...rest,
            price: Number(price),
            instructorRate: Number(instructorRate),
            sellerRate: Number(sellerRate),
            affiliateRate: Number(affiliateRate),
            birrPrice,
            dolarPrice,
            _count: {
              activity: activity.reduce((a, c) => a + c._count.subActivity, 0),
            },
          })
        )
      );
    return data;
  } catch (error) {
    console.error("Error fetching my courses:", error);
    return [];
  }
}

export async function getMyCoursesWithProgress() {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return [];
    }

    const userId = session.user.id;

    // Get all paid courses
    const paidOrders = await prisma.order.findMany({
      where: { userId, status: "paid" },
      select: { courseId: true },
    });

    const courseIds = paidOrders.map((order) => order.courseId);

    if (courseIds.length === 0) {
      return [];
    }

    // Get courses with full details
    const courses = await prisma.course.findMany({
      where: { id: { in: courseIds } },
      include: {
        activity: {
          select: {
            subActivity: {
              select: { id: true },
            },
          },
        },
        instructor: {
          select: { firstName: true, fatherName: true },
        },
      },
    });

    // Get student progress
    const studentProgress = await prisma.studentProgress.findMany({
      where: { userId },
      select: {
        subActivityId: true,
        isCompleted: true,
        subActivity: {
          select: {
            activity: {
              select: {
                courseId: true,
              },
            },
          },
        },
      },
    });

    // Calculate progress for each course
    const coursesWithProgress = courses.map((course) => {
      const totalSubActivities = course.activity.reduce(
        (total, activity) => total + activity.subActivity.length,
        0
      );

      const completedSubActivities = studentProgress.filter(
        (progress) =>
          progress.subActivity.activity.courseId === course.id &&
          progress.isCompleted
      ).length;

      const progress =
        totalSubActivities > 0
          ? Math.round((completedSubActivities / totalSubActivities) * 100)
          : 0;

      return {
        id: course.id,
        titleEn: course.titleEn,
        titleAm: course.titleAm,
        thumbnail: course.thumbnail,
        aboutEn: course.aboutEn,
        aboutAm: course.aboutAm,
        progress,
        instructorName: `${course.instructor.firstName} ${course.instructor.fatherName}`,
      };
    });

    // Sort by progress (ascending) - show courses with less progress first
    coursesWithProgress.sort((a, b) => a.progress - b.progress);

    return coursesWithProgress;
  } catch (error) {
    console.error("Error fetching my courses with progress:", error);
    return [];
  }
}

export async function getMySingleCourse(studentId: string, courseId: string) {
  try {
    const order = await prisma.order.findFirst({
      where: {
        userId: studentId,
        courseId: courseId,
        status: "paid",
      },
    });

    if (!order) {
      // If no paid order is found, the user doesn't have access.
      return null;
    }

    // If the user has paid, fetch the course details.
    const course = await prisma.course.findUnique({
      where: {
        id: courseId,
      },
      select: {
        id: true,
        titleEn: true,
        titleAm: true,
        aboutEn: true,
        aboutAm: true,
        requirement: true,
        courseFor: true,
        video: true,
        pdfData: true, // Add PDF field
        price: true,
        birrPrice: true,
        dolarPrice: true,
        thumbnail: true,
        level: true,
        language: true,
        certificate: true,
        instructor: {
          select: {
            firstName: true,
            fatherName: true,
          },
        },
        activity: {
          orderBy: { order: "asc" },
          select: {
            id: true,
            titleEn: true,
            titleAm: true,
            order: true,
            question: {
              select: { question: true, questionOptions: true },
            },
            subActivity: {
              orderBy: { order: "asc" },
              select: {
                id: true,
                titleEn: true,
                titleAm: true,
                video: true,
                thumbnail: true,
                order: true,
              },
            },
          },
        },
      },
    });

    if (!course) {
      return null;
    }

    // Convert Decimal fields to numbers
    return {
      ...course,
      price: Number(course.price),
      birrPrice: course.birrPrice,
      dolarPrice: course.dolarPrice,
    };
  } catch (error) {
    console.error("Error fetching single course:", error);
    return null;
  }
}

export async function getMySingleCourseContent(
  studentId: string,
  courseId: string
) {
  try {
    const order = await prisma.order.findFirst({
      where: { userId: studentId, courseId: courseId, status: "paid" },
    });

    if (!order) {
      return null;
    }

    const course = await prisma.course.findUnique({
      where: { id: courseId },
      select: {
        id: true,
        titleEn: true,
        titleAm: true,
        video: true,
        thumbnail: true,
        pdfData: true, // Add PDF field
        requirement: true,
        courseFor: true,
        aboutEn: true,
        aboutAm: true,
        level: true,
        activity: {
          orderBy: { order: "asc" },
          select: {
            id: true,
            titleEn: true,
            titleAm: true,
            order: true,
            question: {
              select: { question: true, questionOptions: true },
              take: 1,
            },
            subActivity: {
              orderBy: { order: "asc" },
              select: {
                id: true,
                titleEn: true,
                titleAm: true,
                video: true,
                thumbnail: true,
                order: true,
              },
            },
          },
        },
      },
    });

    if (!course) return null;

    const fuad = {
      ...course,
    } as any;

    return fuad;
  } catch (error) {
    console.error("Error fetching single course:", error);
    return null;
  }
}

export async function getActivityQuiz(activityId: string) {
  try {
    const user = await auth();
    const userId = user?.user?.id || undefined;

    const questions = await prisma.question.findMany({
      where: { activityId },
      select: {
        id: true,
        question: true,
        questionOptions: true,
        questionAnswer: true,
        answerExplanation: true,
      },
    });

    if (!questions.length) return null;

    const byQuestionId: Record<string, string | undefined> = {};
    if (userId) {
      const prevAnswers = await prisma.studentQuizAnswer.findMany({
        where: {
          studentQuiz: {
            userId,
            questionId: { in: questions.map((q) => q.id) },
          },
        },
        select: {
          selectedOptionId: true,
          studentQuiz: { select: { questionId: true, id: true } },
        },
        orderBy: { id: "desc" },
      });

      for (const ans of prevAnswers) {
        const qid = ans.studentQuiz.questionId;
        if (byQuestionId[qid]) continue; // keep latest due to desc order       
        byQuestionId[qid] = ans.selectedOptionId;
      }
    }

    return questions.map((q) => ({
      ...q,
      studentSelectedOptionId: byQuestionId[q.id],
    }));
  } catch (error) {
    console.error("Error fetching activity quiz:", error);
    return null;
  }
}

// Check if the activity quiz is done, partially done, or not started for this logged-in student                                                                
export async function getActivityQuizStatus(activityId: string) {
  try {
    const user = await auth();
    const userId = user?.user?.id;
    if (!userId) return "error" as const;

    const questions = await prisma.question.findMany({
      where: { activityId },
      select: { id: true },
    });
    const total = questions.length;
    if (total === 0) return "no-quiz" as const;

    const answered = await prisma.studentQuiz.groupBy({
      by: ["questionId"],
      where: { userId, questionId: { in: questions.map((q) => q.id) } },        
      _count: { questionId: true },
    });
    const uniqueAnswered = answered.length;

    if (uniqueAnswered === 0) return "not-done" as const;
    if (uniqueAnswered >= total) return "done" as const;
    return "partial" as const;
  } catch (error) {
    console.error("Error fetching quiz status:", error);
    return "error" as const;
  }
}

export async function saveStudentQuizAnswers(
  prevState: StateType,
  data: { questionId: string; selectedOptionId: string } | undefined
): Promise<StateType> {
  try {
    // get user id from the session
    const user = await auth();
    if (!user) {
      return {
        status: false,
        cause: "unauthenticated",
        message: "Unauthenticated",
      } as StateType;
    }
    const userId = user.user?.id;
    if (!userId) {
      return {
        status: false,
        cause: "unauthenticated",
        message: "Unauthenticated",
      } as StateType;
    }

    // Destructure questionId and selectedOptionId from data
    if (!data) {
      return {
        status: false,
        cause: "invalid_data",
        message: "No data provided",
      } as StateType;
    }
    const { questionId, selectedOptionId } = data;

    await prisma.$transaction(async (tx) => {
      // Ensure the selected option belongs to the question
      const option = await tx.questionOption.findFirst({
        where: { id: selectedOptionId, questionId },
        select: { id: true },
      });
      if (!option) {
        throw new Error("invalid_option");
      }

      // Use upsert to handle both new and updated answers for activity quizzes 
      const studentQuiz = await tx.studentQuiz.upsert({
        where: {
          userId_questionId_isFinalExam: {
            userId,
            questionId,
            isFinalExam: false,
          },
        },
        update: {
          takenAt: new Date(),
        },
        create: {
          userId,
          questionId,
          isFinalExam: false,
        },
      });

      // Delete existing answers for this quiz (if any) and create new one      
      await tx.studentQuizAnswer.deleteMany({
        where: { studentQuizId: studentQuiz.id },
      });

      await tx.studentQuizAnswer.create({
        data: {
          studentQuizId: studentQuiz.id,
          selectedOptionId,
        },
      });
    });

    return {
      status: true,
      message: "Answer saved successfully",
    };
  } catch (error: any) {
    console.error("Error saving student quiz answers", error);
    const cause =
      error?.message === "invalid_option" ? "invalid_option" : "server_error";  
    return {
      status: false,
      cause,
      message: "Failed to save answer",
    } as StateType;
  }
}

export async function getFinalExamStatus(courseId: string) {
  try {
    const user = await auth();
    const userId = user?.user?.id;
    if (!userId) return "error" as const;

    // Get all final exam questions for this course
    const questions = await prisma.question.findMany({
      where: { courseId },
      select: { id: true },
    });

    const total = questions.length;
    if (total === 0) return "no-quiz" as const;

    const answered = await prisma.studentQuiz.groupBy({
      by: ["questionId"],
      where: {
        userId,
        questionId: { in: questions.map((q) => q.id) },
        isFinalExam: true,
      },
      _count: { questionId: true },
    });
    const uniqueAnswered = answered.length;

    if (uniqueAnswered === 0) return "not-done" as const;
    if (uniqueAnswered >= total) return "done" as const;
    return "partial" as const;
  } catch (error) {
    console.error("Error fetching final exam status:", error);
    return "error" as const;
  }
}

export async function getFinalExams(courseId: string) {
  try {
    const user = await auth();
    const userId = user?.user?.id;
    if (!userId) return [];

    const finalExams = await prisma.question.findMany({
      where: { courseId: courseId },
      select: {
        id: true,
        question: true,
        answerExplanation: true,
        questionOptions: true,
        questionAnswer: true,
        studentQuiz: {
          where: { userId, isFinalExam: true },
          select: {
            id: true,
            studentQuizAnswers: {
              select: { selectedOptionId: true },
              orderBy: { id: "desc" },
              // take: 1,
            },
          },
        },
      },
    });

    // Map latest selected option per question
    return finalExams.map((q) => ({
      ...q,
      studentSelectedOptionId:
        q.studentQuiz[0]?.studentQuizAnswers[0]?.selectedOptionId,
    }));
  } catch (error) {
    console.error("Error fetching final exams:", error);
    return [];
  }
}

export async function submitFinalExamAnswers(
  prevState: StateType,
  data: { questionId: string; selectedOptionId: string } | undefined
): Promise<StateType> {
  try {
    const user = await auth();
    if (!user) {
      return {
        status: false,
        cause: "unauthenticated",
        message: "Unauthenticated",
      } as StateType;
    }
    const userId = user.user?.id;
    if (!userId) {
      return {
        status: false,
        cause: "unauthenticated",
        message: "Unauthenticated",
      } as StateType;
    }

    if (!data) {
      return {
        status: false,
        cause: "invalid_data",
        message: "No data provided",
      } as StateType;
    }
    const { questionId, selectedOptionId } = data;

    await prisma.$transaction(async (tx) => {
      // Validate the selected option belongs to the question
      const option = await tx.questionOption.findFirst({
        where: { id: selectedOptionId, questionId },
        select: { id: true },
      });
      if (!option) throw new Error("invalid_option");

      // Use upsert to handle both new and updated answers
      const studentQuiz = await tx.studentQuiz.upsert({
        where: {
          userId_questionId_isFinalExam: {
            userId,
            questionId,
            isFinalExam: true,
          },
        },
        update: {
          takenAt: new Date(),
        },
        create: {
          userId,
          questionId,
          isFinalExam: true,
        },
      });

      // Delete existing answers for this quiz (if any) and create new one      
      await tx.studentQuizAnswer.deleteMany({
        where: { studentQuizId: studentQuiz.id },
      });

      await tx.studentQuizAnswer.create({
        data: { studentQuizId: studentQuiz.id, selectedOptionId },
      });
    });

    return { status: true } as StateType;
  } catch (error: any) {
    const cause =
      error?.message === "invalid_option" ? "invalid_option" : "server_error";  
    return {
      status: false,
      cause,
      message: "Failed to save answer",
    } as StateType;
  }
}

export async function readyToCertification(courseId: string) {
  try {
    const user = await auth();
    if (!user) {
      return {
        status: false,
        cause: "unauthenticated",
        message: "Unauthenticated",
      } as StateType;
    }
    const userId = user.user?.id;
    if (!userId) {
      return {
        status: false,
        cause: "unauthenticated",
        message: "Unauthenticated",
      } as StateType;
    }

    // Get all final exam questions for this course with their correct answer id
    const questions = await prisma.question.findMany({
      where: { courseId },
      select: { id: true, questionAnswer: { select: { answerId: true } } },     
    });

    const total = questions.length;
    if (total === 0) {
      return {
        status: false,
        result: "nottaken",
        message: "No questions in final exam",
      } as any;
    }

    // Get student's latest answers for each question (final exam only)
    const answers = await prisma.studentQuizAnswer.findMany({
      where: {
        studentQuiz: {
          userId,
          questionId: { in: questions.map((q) => q.id) },
          isFinalExam: true,
        },
      },
      select: {
        selectedOptionId: true,
        studentQuiz: { select: { questionId: true } },
      },
      orderBy: { id: "desc" },
    });

    // Map latest answer per question
    const latestAnswers: Record<string, string> = {};
    for (const ans of answers) {
      const qid = ans.studentQuiz.questionId;
      if (!latestAnswers[qid]) latestAnswers[qid] = ans.selectedOptionId;       
    }

    // If student hasn't answered any, return nottaken
    if (Object.keys(latestAnswers).length === 0) {
      return {
        status: false,
        result: "nottaken",
        message: "Student has not taken the final exam",
      } as any;
    }

    // Build correct answer map
    const correctByQid: Record<string, string | undefined> = {};
    for (const q of questions as any[]) {
      const qa = q.questionAnswer as any;
      const correctId = Array.isArray(qa) ? qa[0]?.answerId : qa?.answerId;     
      correctByQid[q.id] = correctId;
    }

    // Calculate correct answers
    let correct = 0;
    for (const q of questions) {
      const correctId = correctByQid[q.id];
      if (correctId && latestAnswers[q.id] === correctId) correct++;
    }

    const percent = (correct / total) * 100;

    let result: "poor" | "good" | "veryGood" | "excellent";
    if (percent < 50) result = "poor";
    else if (percent < 70) result = "good";
    else if (percent < 85) result = "veryGood";
    else result = "excellent";

    // Everyone who has taken the exam can get a certificate
    return {
      status: true,
      result,
      percent,
      progress: percent,
      correct,
      total,
      canGetCertificate: true,
      message: "Eligible for certificate",
    } as any;
  } catch {
    return {
      status: false,
      result: "error",
      message: "Server error",
    } as any;
  }
}

export async function clearStudentQuizAnswers(
  prevState: StateType,
  data: { activityId: string } | undefined
): Promise<StateType> {
  try {
    const user = await auth();
    if (!user) {
      return {
        status: false,
        cause: "unauthenticated",
        message: "Unauthenticated",
      } as StateType;
    }
    const userId = user.user?.id;
    if (!userId) {
      return {
        status: false,
        cause: "unauthenticated",
        message: "Unauthenticated",
      } as StateType;
    }

    if (!data) {
      return {
        status: false,
        cause: "invalid_data",
        message: "No data provided",
      } as StateType;
    }
    const { activityId } = data;

    // Get all questions for this activity
    const questions = await prisma.question.findMany({
      where: { activityId },
      select: { id: true },
    });

    if (questions.length === 0) {
      return {
        status: true,
        message: "No questions found for this activity",
      } as unknown as StateType;
    }

    // Delete all student quiz answers for this activity
    await prisma.$transaction(async (tx) => {
      // First, delete all quiz answers
      await tx.studentQuizAnswer.deleteMany({
        where: {
          studentQuiz: {
            userId,
            questionId: { in: questions.map((q) => q.id) },
            isFinalExam: false, // Only clear activity quiz answers, not final exam                                                                             
          },
        },
      });

      // Then, delete all student quiz records
      await tx.studentQuiz.deleteMany({
        where: {
          userId,
          questionId: { in: questions.map((q) => q.id) },
          isFinalExam: false,
        },
      });
    });

    return {
      status: true,
      message: "Quiz answers cleared successfully",
    } as unknown as StateType;
  } catch (error) {
    console.error("Error clearing student quiz answers:", error);
    return {
      status: false,
      cause: "server_error",
      message: "Failed to clear quiz answers",
    } as StateType;
  }
}

export async function unlockTheFinalExamAndQuiz(courseId: string) {
  try {
    const user = await auth();
    const userId = user?.user?.id;
    if (!userId) {
      return {
        status: false,
        activities: [],
        finalExamLocked: true,
        nextUnlockActivityId: null,
        message: "Unauthenticated",
      };
    }

    // Get all activities for the course in order
    const activities = await prisma.activity.findMany({
      where: { courseId },
      orderBy: { order: "asc" },
      select: {
        id: true,
        titleEn: true,
        titleAm: true,
        order: true,
        question: {
          select: { id: true },
        },
      },
    });

    if (activities.length === 0) {
      return {
        status: true,
        activities: [],
        finalExamLocked: false,
        nextUnlockActivityId: null,
      };
    }

    // Get completion status for each activity
    const activityCompletionPromises = activities.map(async (activity) => {     
      if (activity.question.length === 0) {
        // No quiz means always unlocked
        return {
          activityId: activity.id,
          completed: true,
          locked: false,
        };
      }

      // Check if all questions in this activity are answered
      const questionIds = activity.question.map((q) => q.id);
      const answeredQuestions = await prisma.studentQuiz.groupBy({
        by: ["questionId"],
        where: {
          userId,
          questionId: { in: questionIds },
          isFinalExam: false, // Only count activity quiz answers
        },
        _count: { questionId: true },
      });

      const completed = answeredQuestions.length >= questionIds.length;
      return {
        activityId: activity.id,
        completed,
        locked: false, // Will be determined by sequential logic
      };
    });

    const completionStatuses = await Promise.all(activityCompletionPromises);   

    // Apply sequential access logic
    let nextUnlockActivityId: string | null = null;
    const activityRows = activities.map((activity, index) => {
      const completion = completionStatuses.find(
        (c) => c.activityId === activity.id
      );

      // First activity is always unlocked
      if (index === 0) {
        if (!completion?.completed && !nextUnlockActivityId) {
          nextUnlockActivityId = activity.id;
        }
        return {
          ...activity,
          ...completion,
          locked: false,
          question: activity.question, // Include question data for frontend    
        };
      }

      // Check if previous activity is completed
      const prevCompletion = completionStatuses[index - 1];
      const locked = !prevCompletion?.completed;

      // Mark as next unlockable if current is locked and prev is completed     
      if (locked && prevCompletion?.completed && !nextUnlockActivityId) {       
        nextUnlockActivityId = activity.id;
      }

      // If this activity is unlocked but not completed, it's the next to work on                                                                               
      if (!locked && !completion?.completed && !nextUnlockActivityId) {
        nextUnlockActivityId = activity.id;
      }

      return {
        ...activity,
        ...completion,
        locked,
        question: activity.question, // Include question data for frontend      
      };
    });

    // Final exam is locked until all activities are completed
    const allActivitiesCompleted = completionStatuses.every((c) => c.completed);
    const finalExamLocked = !allActivitiesCompleted;

    return {
      status: true,
      activities: activityRows,
      finalExamLocked,
      nextUnlockActivityId,
    };
  } catch (error) {
    console.error("Error in unlockTheFinalExamAndQuiz:", error);
    return {
      status: false,
      activities: [],
      finalExamLocked: true,
      nextUnlockActivityId: null,
      message: "Server error",
    };
  }
}

export async function getCertificateDetails(courseId: string) {
  try {
    const user = await auth();
    const userId = user?.user?.id;
    if (!userId) {
      return { status: false, message: "Unauthenticated" } as any;
    }

    // Fetch course info and instructor
    const course = await prisma.course.findUnique({
      where: { id: courseId },
      select: {
        titleEn: true,
        titleAm: true,
        instructor: { select: { firstName: true, fatherName: true } },
      },
    });

    // Fetch student name
    const u = await prisma.user.findUnique({
      where: { id: userId },
      select: { firstName: true, fatherName: true, lastName: true },
    });
    const studentName = [u?.firstName, u?.fatherName, u?.lastName]
      .filter(Boolean)
      .join(" ");

    // Compute certification readiness for result and percent
    const cert = await readyToCertification(courseId);
    if (!cert?.status) {
      return { status: false, message: cert?.message || "Not eligible" } as any;
    }

    const courseTitle = course?.titleEn || course?.titleAm || "Course";
    const instructorName = course?.instructor
      ? [course.instructor.firstName, course.instructor.fatherName]
          .filter(Boolean)
          .join(" ")
      : undefined;

    const issuedAt = new Date().toISOString();
    const qrcode = `/en/@student/mycourse/${courseId}/finalexam`;

    return {
      status: true,
      courseTitle,
      studentName,
      instructorName,
      percent: cert.percent,
      result: cert.result,
      issuedAt,
      qrcode,
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
    } as any;
  } catch (error) {
    console.error("Error in getCertificateDetails:", error);
    return { status: false, message: "Server error" } as any;
  }
}
