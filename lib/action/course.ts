/* eslint-disable @typescript-eslint/no-explicit-any */
"use server";

import prisma from "../db";
import { StateType, TCourse } from "../definations";
import bcryptjs from "bcryptjs";

export async function courseRegistration(
  prevState: StateType,
  data: TCourse | undefined | null
): Promise<StateType> {
  const startTime = Date.now();
  try {
    console.group("🔧 ========== SERVER ACTION: courseRegistration ==========");
    console.log("📥 Action called at:", new Date().toISOString());
    console.log("📋 Input Summary:", {
      hasData: !!data,
      isUpdate: !!data?.id,
      dataKeys: data ? Object.keys(data) : [],
      dataType: typeof data,
    });

    if (!data || data === null) {
      console.error("❌ No data provided to courseRegistration");
      console.groupEnd();
      return {
        status: false,
        cause: "No data provided",
        message: "Course data is required",
      };
    }

    console.log("📋 Course Data Summary:", {
      id: data.id,
      titleEn: data.titleEn || "❌ MISSING",
      titleAm: data.titleAm || "❌ MISSING",
      instructorId: data.instructorId || "❌ MISSING",
      channelId: data.channelId || "Not set (optional)",
      price: data.price,
      dolarPrice: data.dolarPrice,
      birrPrice: data.birrPrice,
      video: data.video || "❌ MISSING",
      thumbnail: data.thumbnail || "❌ MISSING",
      finalExamQuestionsCount: data.finalExamQuestions?.length || 0,
      activityCount: data.activity?.length || 0,
      courseMaterials: data.courseMaterials
        ? Array.isArray(data.courseMaterials)
          ? `${data.courseMaterials.length} items`
          : typeof data.courseMaterials
        : "Not set",
    });

    // Validate required fields
    console.group("✅ Validation Checks");
    const validationErrors: string[] = [];

    if (!data.titleEn || !data.titleAm) {
      validationErrors.push("Course title is required");
      console.error("❌ Missing course title");
    } else {
      console.log("✅ Course title present");
    }

    if (!data.instructorId) {
      validationErrors.push("Instructor is required");
      console.error("❌ Missing instructor");
    } else {
      console.log("✅ Instructor selected");
    }

    // Allow 0 for free courses, but ensure values are not null/undefined
    if (data.dolarPrice === null || data.dolarPrice === undefined) {
      validationErrors.push("Dollar price is required");
      console.error("❌ Missing dollar price");
    } else {
      console.log("✅ Dollar price:", data.dolarPrice);
    }

    if (data.birrPrice === null || data.birrPrice === undefined) {
      validationErrors.push("Birr price is required");
      console.error("❌ Missing birr price");
    } else {
      console.log("✅ Birr price:", data.birrPrice);
    }

    // Prevent negative prices
    if (data.dolarPrice < 0 || data.birrPrice < 0) {
      validationErrors.push("Prices cannot be negative");
      console.error("❌ Negative prices detected");
    }

    if (validationErrors.length > 0) {
      console.error("❌ Validation failed:", validationErrors);
      console.groupEnd();
      console.groupEnd();
      return {
        status: false,
        cause: "Validation Error",
        message: validationErrors.join("; "),
      };
    }

    console.log("✅ All validations passed");
    console.groupEnd();

    const {
      id,
      courseFor,
      requirement,
      activity,
      finalExamQuestions,
      birrPrice,
      dolarPrice,
      ...rest
    } = data;

    // Prepare courseMaterials for DB (comma-separated URLs only)
    const courseData = {
      ...rest,
      birrPrice,
      dolarPrice,
    } as const;

    await prisma.course.updateMany({
      where: { channelId: rest.channelId },
      data: { channelId: null },
    });
    // .then((res) => {
    //   console.log(res.count);
    // });

    if (id) {
      console.log("🔄 Starting course update process for ID:", id);

      await prisma.courseFor.deleteMany({ where: { courseId: id } });
      await prisma.requirement.deleteMany({ where: { courseId: id } });

      // Delete questions and related data first
      const activities = await prisma.activity.findMany({
        where: { courseId: id },
      });
      console.log("🗑️ Found activities to delete:", activities.length);

      // Delete ALL questions related to this course (both activity and final exam questions)
      // This is simpler and prevents orphaned data
      const allQuestions = await prisma.question.findMany({
        where: {
          OR: [
            { activityId: { in: activities.map((a) => a.id) } },
            { courseId: id, activityId: null },
          ],
        },
        select: { id: true },
      });

      const questionIds = allQuestions.map((q) => q.id);

      if (questionIds.length > 0) {
        await prisma.questionAnswer.deleteMany({
          where: { questionId: { in: questionIds } },
        });
        await prisma.questionOption.deleteMany({
          where: { questionId: { in: questionIds } },
        });
        await prisma.question.deleteMany({
          where: { id: { in: questionIds } },
        });
      }

      await prisma.activity.deleteMany({ where: { courseId: id } });

      // Extract relation fields from courseData
      const { instructorId, channelId, ...restWithoutRelations } = courseData;

      console.log("💾 Updating course with data:", {
        instructorId,
        channelId,
        courseForCount: courseFor.length,
        requirementCount: requirement.length,
        activityCount: activity.length,
      });

      const updatedCourse = await prisma.course.update({
        where: { id },
        data: {
          ...restWithoutRelations, // Update all scalar fields
          instructor: { connect: { id: instructorId } }, // Fix: Use relation syntax
          ...(channelId && { channel: { connect: { id: channelId } } }), // Optional channel connection
          courseFor: { create: courseFor },
          requirement: { create: requirement },
          activity: {
            create: [...activity]
              .sort((a: any, b: any) => (a.order ?? 0) - (b.order ?? 0))
              .map((activityItem: any, index) => {
                const { titleAm, titleEn, subActivity } = activityItem;
                const order: number | undefined = activityItem.order;
                return {
                  titleAm,
                  titleEn,
                  order: order ?? index + 1, // Use the order field from the data, fallback to index + 1
                  subActivity: {
                    create: [...(subActivity || [])]
                      .sort((a: any, b: any) => (a.order ?? 0) - (b.order ?? 0))
                      .map((sub: any, subIndex: number) => {
                        const subOrder: number | undefined = sub.order;
                        return {
                          ...sub,
                          video: sub.video || "", // Ensure video is always a string
                          thumbnail: sub.thumbnail || "", // Ensure thumbnail is always a string
                          order: subOrder ?? subIndex + 1, // Use the order field from the data, fallback to subIndex + 1
                        };
                      }),
                  },
                };
              }),
          },
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
        } as any,
        include: { activity: { orderBy: { order: "asc" } } },
      });

      console.log("✅ Course updated successfully:", updatedCourse.id);

      // Create questions for each activity
      for (let i = 0; i < activity.length; i++) {
        const { questions } = activity[i];
        const createdActivity = updatedCourse.activity[i];

        if (questions && questions.length > 0) {
          for (let j = 0; j < questions.length; j++) {
            const { question, options, answers, explanation } = questions[j];

            // Always create activity questions - they serve as the master copy
            const createdQuestion = await prisma.question.create({
              data: {
                question,
                answerExplanation: explanation,
                activityId: createdActivity.id,
                questionOptions: {
                  create: options.map((option) => ({ option })),
                },
              },
            });

            const createdOptions = await prisma.questionOption.findMany({
              where: { questionId: createdQuestion.id },
            });

            for (const answer of answers) {
              const matchingOption = createdOptions.find(
                (opt) => opt.option === answer
              );
              if (matchingOption) {
                await prisma.questionAnswer.create({
                  data: {
                    questionId: createdQuestion.id,
                    answerId: matchingOption.id,
                  },
                });
              }
            }
          }
        }
      }

      // Create final exam questions (only if provided)
      if (finalExamQuestions && finalExamQuestions.length > 0) {
        console.log(
          `📝 Processing ${finalExamQuestions.length} final exam questions`
        );

        // Track which activity questions we've already marked to prevent duplicates
        const markedActivityQuestions = new Set<string>();
        // Track created standalone questions to prevent duplicates
        const createdStandaloneQuestions = new Set<string>();

        for (const examQuestion of finalExamQuestions) {
          if (
            examQuestion.isSharedFromActivity &&
            examQuestion.sourceActivityIndex !== undefined &&
            examQuestion.sourceQuestionIndex !== undefined
          ) {
            // For shared questions: update the activity question to also belong to final exam
            const activityIndex = examQuestion.sourceActivityIndex;
            const questionIndex = examQuestion.sourceQuestionIndex;

            // Create a unique key for this activity question
            const activityQuestionKey = `${activityIndex}-${questionIndex}`;

            // Skip if we've already processed this activity question
            if (markedActivityQuestions.has(activityQuestionKey)) {
              console.log(
                `⚠️ Skipping duplicate shared question reference: Activity ${activityIndex}, Question ${questionIndex}`
              );
              continue;
            }

            if (activityIndex < updatedCourse.activity.length) {
              const targetActivity = updatedCourse.activity[activityIndex];

              // Find the corresponding question in the database
              const existingQuestions = await prisma.question.findMany({
                where: { activityId: targetActivity.id },
                orderBy: { id: "asc" },
              });

              if (questionIndex < existingQuestions.length) {
                const targetQuestion = existingQuestions[questionIndex];

                // Update the question to mark it as part of final exam
                await prisma.question.update({
                  where: { id: targetQuestion.id },
                  data: { courseId: id }, // Add courseId to mark it as final exam question
                });

                // Mark this activity question as processed
                markedActivityQuestions.add(activityQuestionKey);
                console.log(
                  `✅ Marked activity question ${activityIndex}-${questionIndex} as final exam question`
                );
              } else {
                console.log(
                  `⚠️ Question index ${questionIndex} out of bounds for activity ${activityIndex}`
                );
              }
            } else {
              console.log(`⚠️ Activity index ${activityIndex} out of bounds`);
            }
          } else {
            // Create standalone final exam questions (not tied to activities)
            // Create a unique key based on question content to detect duplicates
            const questionKey = `${
              examQuestion.question
            }-${examQuestion.options.join("|")}`;

            if (createdStandaloneQuestions.has(questionKey)) {
              console.log(
                `⚠️ Skipping duplicate standalone question: "${examQuestion.question.substring(
                  0,
                  50
                )}..."`
              );
              continue;
            }

            const createdQuestion = await prisma.question.create({
              data: {
                question: examQuestion.question,
                answerExplanation: examQuestion.explanation,
                courseId: id,
                // Note: activityId is intentionally left null for standalone final exam questions
                questionOptions: {
                  create: examQuestion.options.map((option) => ({ option })),
                },
              },
            });

            const createdOptions = await prisma.questionOption.findMany({
              where: { questionId: createdQuestion.id },
            });

            for (const answer of examQuestion.answers) {
              const matchingOption = createdOptions.find(
                (opt) => opt.option === answer
              );
              if (matchingOption) {
                await prisma.questionAnswer.create({
                  data: {
                    questionId: createdQuestion.id,
                    answerId: matchingOption.id,
                  },
                });
              }
            }

            // Mark this question as created
            createdStandaloneQuestions.add(questionKey);
            console.log(
              `✅ Created standalone final exam question: "${examQuestion.question.substring(
                0,
                50
              )}..."`
            );
          }
        }
      } else {
        console.log("ℹ️ No final exam questions provided - skipping");
      }
    } else {
      const {
        instructorId: createInstructorId,
        channelId: createChannelId,
        ...restWithoutRelations
      } = courseData as unknown as { [k: string]: unknown };
      const courseId = await prisma.course
        .create({
          data: {
            ...restWithoutRelations,
            // For create, courseMaterials is a scalar field and accepts string[] directly
            instructor: { connect: { id: createInstructorId as string } },
            ...(createChannelId
              ? { channel: { connect: { id: createChannelId as string } } }
              : {}),
            // eslint-disable-next-line @typescript-eslint/no-explicit-any
          } as any,
        })
        .then((v) => v.id);
      if (courseId) {
        for (const v of courseFor) {
          await prisma.courseFor.create({ data: { ...v, courseId } });
        }
        for (const v of requirement) {
          await prisma.requirement.create({ data: { ...v, courseId } });
        }
        // Sort activities by order before creating
        const sortedActivities = [...activity].sort(
          (a: any, b: any) => (a.order ?? 0) - (b.order ?? 0)
        );

        for (let i = 0; i < sortedActivities.length; i++) {
          const activityItem: any = sortedActivities[i];
          const { subActivity, questions, ...v } = activityItem;
          const order: number | undefined = activityItem.order;
          const createdActivity = await prisma.activity.create({
            data: {
              ...v,
              courseId,
              order: order ?? i + 1, // Use the order field from the data, fallback to index + 1
              subActivity: {
                create: [...(subActivity || [])]
                  .sort((a: any, b: any) => (a.order ?? 0) - (b.order ?? 0))
                  .map((sub: any, subIndex: number) => {
                    const subOrder: number | undefined = sub.order;
                    return {
                      ...sub,
                      video: sub.video || "", // Ensure video is always a string
                      thumbnail: sub.thumbnail || "", // Ensure thumbnail is always a string
                      order: subOrder ?? subIndex + 1, // Use the order field from the data, fallback to subIndex + 1
                    };
                  }),
              },
            },
          });

          if (questions && questions.length > 0) {
            for (let j = 0; j < questions.length; j++) {
              const { question, options, answers, explanation } = questions[j];

              // Always create activity questions - they serve as the master copy
              const createdQuestion = await prisma.question.create({
                data: {
                  question,
                  answerExplanation: explanation,
                  activityId: createdActivity.id,
                  questionOptions: {
                    create: options.map((option: string) => ({ option })),
                  },
                },
              });

              const createdOptions = await prisma.questionOption.findMany({
                where: { questionId: createdQuestion.id },
              });

              for (const answer of answers) {
                const matchingOption = createdOptions.find(
                  (opt) => opt.option === answer
                );
                if (matchingOption) {
                  await prisma.questionAnswer.create({
                    data: {
                      questionId: createdQuestion.id,
                      answerId: matchingOption.id,
                    },
                  });
                }
              }
            }
          }
        }

        // Create final exam questions (only if provided)
        if (finalExamQuestions && finalExamQuestions.length > 0) {
          console.log(
            `📝 Processing ${finalExamQuestions.length} final exam questions`
          );

          // Track which activity questions we've already marked to prevent duplicates
          const markedActivityQuestions = new Set<string>();
          // Track created standalone questions to prevent duplicates
          const createdStandaloneQuestions = new Set<string>();

          for (const examQuestion of finalExamQuestions) {
            if (
              examQuestion.isSharedFromActivity &&
              examQuestion.sourceActivityIndex !== undefined &&
              examQuestion.sourceQuestionIndex !== undefined
            ) {
              // For shared questions: update the activity question to also belong to final exam
              const activityIndex = examQuestion.sourceActivityIndex;
              const questionIndex = examQuestion.sourceQuestionIndex;

              // Create a unique key for this activity question
              const activityQuestionKey = `${activityIndex}-${questionIndex}`;

              // Skip if we've already processed this activity question
              if (markedActivityQuestions.has(activityQuestionKey)) {
                console.log(
                  `⚠️ Skipping duplicate shared question reference: Activity ${activityIndex}, Question ${questionIndex}`
                );
                continue;
              }

              // Find the activity that was just created
              const activities = await prisma.activity.findMany({
                where: { courseId },
                orderBy: { order: "asc" },
              });

              if (activityIndex < activities.length) {
                const targetActivity = activities[activityIndex];

                // Find the corresponding question in the database
                const existingQuestions = await prisma.question.findMany({
                  where: { activityId: targetActivity.id },
                  orderBy: { id: "asc" },
                });

                if (questionIndex < existingQuestions.length) {
                  const targetQuestion = existingQuestions[questionIndex];

                  // Update the question to mark it as part of final exam
                  await prisma.question.update({
                    where: { id: targetQuestion.id },
                    data: { courseId }, // Add courseId to mark it as final exam question
                  });

                  // Mark this activity question as processed
                  markedActivityQuestions.add(activityQuestionKey);
                  console.log(
                    `✅ Marked activity question ${activityIndex}-${questionIndex} as final exam question`
                  );
                } else {
                  console.log(
                    `⚠️ Question index ${questionIndex} out of bounds for activity ${activityIndex}`
                  );
                }
              } else {
                console.log(`⚠️ Activity index ${activityIndex} out of bounds`);
              }
            } else {
              // Create standalone final exam questions (not tied to activities)
              // Create a unique key based on question content to detect duplicates
              const questionKey = `${
                examQuestion.question
              }-${examQuestion.options.join("|")}`;

              if (createdStandaloneQuestions.has(questionKey)) {
                console.log(
                  `⚠️ Skipping duplicate standalone question: "${examQuestion.question.substring(
                    0,
                    50
                  )}..."`
                );
                continue;
              }

              const createdQuestion = await prisma.question.create({
                data: {
                  question: examQuestion.question,
                  answerExplanation: examQuestion.explanation,
                  courseId,
                  // Note: activityId is intentionally left null for standalone final exam questions
                  questionOptions: {
                    create: examQuestion.options.map((option) => ({ option })),
                  },
                },
              });

              const createdOptions = await prisma.questionOption.findMany({
                where: { questionId: createdQuestion.id },
              });

              for (const answer of examQuestion.answers) {
                const matchingOption = createdOptions.find(
                  (opt) => opt.option === answer
                );
                if (matchingOption) {
                  await prisma.questionAnswer.create({
                    data: {
                      questionId: createdQuestion.id,
                      answerId: matchingOption.id,
                    },
                  });
                }
              }

              // Mark this question as created
              createdStandaloneQuestions.add(questionKey);
              console.log(
                `✅ Created standalone final exam question: "${examQuestion.question.substring(
                  0,
                  50
                )}..."`
              );
            }
          }
        } else {
          console.log("ℹ️ No final exam questions provided - skipping");
        }
      }
    }

    const duration = Date.now() - startTime;
    console.group("✅ ========== SUCCESS ==========");
    console.log("🎉 Course registration completed successfully");
    console.log("⏱️ Duration:", `${duration}ms`);
    console.log("📊 Summary:", {
      operation: id ? "UPDATE" : "CREATE",
      courseId: id || "NEW",
      activityCount: activity.length,
      finalExamQuestionsCount: finalExamQuestions?.length || 0,
    });
    console.groupEnd();
    console.groupEnd();

    return { status: true } as const;
  } catch (error) {
    const duration = Date.now() - startTime;
    console.group("❌ ========== SERVER ACTION ERROR ==========");
    console.error("💥 Course registration error occurred");
    console.error("⏱️ Duration before error:", `${duration}ms`);
    console.error(
      "Error Type:",
      error instanceof Error ? error.constructor.name : typeof error
    );
    console.error(
      "Error Message:",
      error instanceof Error ? error.message : String(error)
    );
    if (error instanceof Error) {
      console.error("Error Stack:", error.stack);
    }
    console.error("Error Object:", error);
    console.log("Context:", {
      isUpdate: !!data?.id,
      courseId: data?.id,
      titleEn: data?.titleEn,
      titleAm: data?.titleAm,
    });
    console.groupEnd();
    console.groupEnd();

    // Return detailed error information
    if (error instanceof Error) {
      // Check for Prisma errors
      if (error.message.includes("Unique constraint")) {
        return {
          status: false,
          cause: "Database Constraint Error",
          message:
            "A course with similar data already exists. Please check for duplicates.",
        };
      }
      if (error.message.includes("Foreign key constraint")) {
        return {
          status: false,
          cause: "Database Constraint Error",
          message:
            "Invalid reference. Please check instructor or channel selection.",
        };
      }
      if (error.message.includes("Record to update not found")) {
        return {
          status: false,
          cause: "Not Found Error",
          message: "The course you're trying to update doesn't exist.",
        };
      }

      return {
        status: false,
        cause: error.name || "Unknown Error",
        message:
          error.message || "An error occurred while processing the course",
      };
    }

    return {
      status: false,
      cause: "Unknown Error",
      message: "An unexpected error occurred while processing the course",
    };
  }
}

export async function changeRate(
  prevState: StateType,
  data:
    | {
        userId: string;
        courseId: string;
        rate: number;
      }
    | undefined
    | null
): Promise<StateType> {
  try {
    if (!data || data === null) {
      console.log("No data provided to changeRate");
      return {
        status: false,
        cause: "No data provided",
        message: "Rate data is required",
      };
    }
    const { userId, courseId, rate } = data,
      incomeRate = await prisma.incomeRate.findFirst({
        where: { userId, courseId },
      });
    if (incomeRate) {
      await prisma.incomeRate.update({
        where: { id: incomeRate.id },
        data: { rate },
      });
    } else {
      await prisma.incomeRate.create({ data: { userId, courseId, rate } });
    }
    return { status: true };
  } catch (error) {
    console.error("Change rate error:", error);

    // Handle different types of errors
    if (error instanceof Error) {
      return {
        status: false,
        cause: error.name,
        message: error.message,
      };
    }

    // Handle Prisma errors
    if (error && typeof error === "object" && "code" in error) {
      return {
        status: false,
        cause: "Database Error",
        message: `Database operation failed: ${error.code || "Unknown error"}`,
      };
    }

    // Fallback for unknown errors
    return {
      status: false,
      cause: "Unknown Error",
      message: "An unexpected error occurred while updating the rate",
    };
  }
}

export async function sellerRegistration(
  prevState: StateType,
  data:
    | {
        id?: string;
        firstName: string;
        fatherName: string;
        lastName: string;
        phoneNumber: string;
        password?: string;
      }
    | undefined
    | null
): Promise<StateType> {
  try {
    if (!data || data === null) {
      console.log("No data provided to sellerRegistration");
      return {
        status: false,
        cause: "No data provided",
        message: "Seller data is required",
      };
    }
    const { id, firstName, fatherName, lastName, phoneNumber, password } = data;
    if (id) {
      await prisma.user.update({
        where: { id },
        data: {
          firstName,
          fatherName,
          lastName,
          phoneNumber,
          ...(password && password !== ""
            ? { password: await bcryptjs.hash(password, 12) }
            : {}),
        },
      });
    } else {
      if (!password) throw new Error("Password is required for new sellers");
      const { firstName, fatherName, lastName, phoneNumber } = data;
      await prisma.user.create({
        data: {
          firstName,
          fatherName,
          lastName,
          phoneNumber,
          password: await bcryptjs.hash(password, 12),
          role: "seller",
        },
      });
    }
    return { status: true };
  } catch (error) {
    console.log(error);
    return { status: false, cause: "", message: "" };
  }
}

export async function affiliateRegistration(
  prevState: StateType,
  data:
    | {
        firstName: string;
        fatherName: string;
        lastName: string;
        phoneNumber: string;
        password: string;
      }
    | undefined
    | null
): Promise<StateType> {
  try {
    if (!data || data === null) {
      console.log("No data provided to affiliateRegistration");
      return {
        status: false,
        cause: "No data provided",
        message: "Affiliate data is required",
      };
    }
    const { firstName, fatherName, lastName, phoneNumber, password } = data;
    await prisma.user.create({
      data: {
        firstName,
        fatherName,
        lastName,
        phoneNumber,
        password: await bcryptjs.hash(password, 12),
        role: "affiliate",
      },
    });
    return { status: true };
  } catch (error) {
    console.log(error);
    return { status: false, cause: "", message: "" };
  }
}
