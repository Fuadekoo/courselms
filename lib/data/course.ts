/* eslint-disable @typescript-eslint/no-explicit-any */
"use server";

import prisma from "../db";
import { auth } from "../auth";
import { normalizeUrl } from "../utils/url";

export async function getCoursesForAffiliate() {
  try {
    const session = await auth(),
      data = await prisma.course
        .findMany({
          include: {
            activity: { select: { _count: { select: { subActivity: true } } } },
            instructor: {
              select: { id: true, firstName: true, fatherName: true },
            },
          },
        })
        .then((res) =>
          res.map(
            ({ id, price, sellerRate, affiliateRate, activity, ...rest }) => ({
              id,
              ...rest,
              price: Number(price),
              sellerRate: Number(sellerRate),
              affiliateRate: Number(affiliateRate),
              _count: {
                activity: activity.reduce(
                  (a, c) => a + c._count.subActivity,
                  0
                ),
              },
              link: `${normalizeUrl(
                process.env.MAIN_API || "",
                `/courses/${id}`
              )}?code=${session?.user?.code || ""}`,
            })
          )
        );
    return data;
  } catch (error) {
    console.log(error);
    return null;
  }
}

export async function getCoursesForCustomer() {
  try {
    const data = await prisma.course
      .findMany({
        select: {
          id: true,
          titleEn: true,
          titleAm: true,
          aboutEn: true,
          aboutAm: true,
          thumbnail: true,
          level: true,
          duration: true,
          price: true,
          birrPrice: true,
          dolarPrice: true,
          instructorRate: true,
          sellerRate: true,
          affiliateRate: true,
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
            birrPrice,
            dolarPrice,
            instructorRate,
            sellerRate,
            affiliateRate,
            activity,
            ...rest
          }) => ({
            id,
            ...rest,
            price: Number(price),
            birrPrice: birrPrice ? Number(birrPrice) : Number(price),
            dolarPrice: dolarPrice ? Number(dolarPrice) : Number(price),
            instructorRate: Number(instructorRate),
            sellerRate: Number(sellerRate),
            affiliateRate: Number(affiliateRate),
            _count: {
              activity: activity.reduce((a, c) => a + c._count.subActivity, 0),
            },
          })
        )
      );
    return data;
  } catch (error) {
    console.log(error);
    return null;
  }
}

export async function getCoursesForLoginCustomer() {
  try {
    // Get the current user session
    const session = await auth();

    if (!session?.user?.id) {
      return null;
    }

    // Get all course IDs that the user has already paid for (exclude unpaid orders)
    const userOrders = await prisma.order.findMany({
      where: {
        userId: session.user.id,
        status: {
          not: "unpaid", // Only exclude courses with paid/completed orders
        },
      },
      select: { courseId: true },
    });

    const enrolledCourseIds = userOrders.map((order: any) => order.courseId);

    // Fetch courses excluding the ones user is already enrolled in (with paid status)
    const data = await prisma.course
      .findMany({
        where: {
          id: {
            notIn: enrolledCourseIds,
          },
        },
        select: {
          id: true,
          titleEn: true,
          titleAm: true,
          aboutEn: true,
          aboutAm: true,
          thumbnail: true,
          level: true,
          duration: true,
          price: true,
          birrPrice: true,
          dolarPrice: true,
          instructorRate: true,
          sellerRate: true,
          affiliateRate: true,
          pdfData: true,
          aiProvider: true,
          courseMaterials: true,
          accessEn: true,
          accessAm: true,
          status: true,
          channelId: true,
          instructorId: true,
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
            birrPrice,
            dolarPrice,
            instructorRate,
            sellerRate,
            affiliateRate,
            activity,
            ...rest
          }) => ({
            id,
            ...rest,
            price: Number(price),
            birrPrice: birrPrice ? Number(birrPrice) : Number(price),
            dolarPrice: dolarPrice ? Number(dolarPrice) : Number(price),
            instructorRate: Number(instructorRate),
            sellerRate: Number(sellerRate),
            affiliateRate: Number(affiliateRate),
            _count: {
              activity: activity.reduce((a, c) => a + c._count.subActivity, 0),
            },
          })
        )
      );
    console.log("data >>fuads  ", data);
    return data;
  } catch (error) {
    console.log(error);
    return null;
  }
}

// ----------------------------------------------------------

export async function getCourseForManager(id: string) {
  // Return null immediately for invalid IDs to avoid unnecessary queries
  if (!id || id === "unknown") {
    return null;
  }

  try {
    const course = await prisma.course.findUnique({
      where: { id },
      select: {
        id: true,
        titleEn: true,
        titleAm: true,
        aboutAm: true,
        aboutEn: true,
        language: true,
        level: true,
        duration: true,
        pdfData: true, // Use the correct field name
        requirement: {
          select: { requirementEn: true, requirementAm: true },
          orderBy: { id: "asc" },
        },
        courseFor: {
          select: { courseForEn: true, courseForAm: true },
          orderBy: { id: "asc" },
        },
        activity: {
          orderBy: { order: "asc" },
          select: {
            id: true,
            titleAm: true,
            titleEn: true,
            subActivity: {
              orderBy: { order: "asc" },
              select: {
                titleEn: true,
                titleAm: true,
                video: true,
                thumbnail: true,
              },
            },
            question: {
              orderBy: { id: "asc" },
              select: {
                question: true,
                answerExplanation: true,
                questionOptions: {
                  orderBy: { id: "asc" },
                  select: {
                    option: true,
                  },
                },
                questionAnswer: {
                  select: {
                    answer: {
                      select: {
                        option: true,
                      },
                    },
                  },
                },
              },
            },
          },
        },
        price: true,
        dolarPrice: true,
        birrPrice: true,
        instructorRate: true,
        sellerRate: true,
        affiliateRate: true,
        instructorId: true,
        channelId: true,
        certificate: true,
        accessAm: true,
        accessEn: true,
        thumbnail: true,
        video: true,
        courseMaterials: true,
        aiProvider: true,
      },
    });

    if (!course) {
      return null;
    }

    // Fetch final exam questions (both standalone and shared)
    const finalExamQuestions = await prisma.question.findMany({
      where: {
        courseId: id, // All questions that are part of final exam have courseId set
      },
      orderBy: { id: "asc" },
      select: {
        question: true,
        answerExplanation: true,
        activityId: true, // This tells us if it's shared (has activityId) or standalone (null)
        questionOptions: {
          orderBy: { id: "asc" },
          select: { option: true },
        },
        questionAnswer: {
          select: {
            answer: {
              select: {
                option: true,
              },
            },
          },
        },
      },
    });

    // Transform data efficiently
    const result = {
      ...course,
      price: Number(course.price),
      instructorRate: Number(course.instructorRate),
      sellerRate: Number(course.sellerRate),
      affiliateRate: Number(course.affiliateRate),
      activity: course.activity.map((activity: any) => ({
        ...activity,
        questions: activity.question.map((q: any) => ({
          question: q.question,
          options: q.questionOptions.map((opt: any) => opt.option),
          answers: q.questionAnswer.map((ans: any) => ans.answer.option),
          explanation: q.answerExplanation,
        })),
      })),
      finalExamQuestions: finalExamQuestions.map((q: any) => {
        // Check if this is a shared question (has activityId) or standalone (no activityId)
        if (q.activityId) {
          // This is a shared question - find its source activity and question index
          let sourceActivityIndex: number | undefined;
          let sourceQuestionIndex: number | undefined;

          // Find which activity this question belongs to
          for (
            let activityIndex = 0;
            activityIndex < course.activity.length;
            activityIndex++
          ) {
            const activity = course.activity[activityIndex];
            const questionInActivity = activity.question.findIndex(
              (activityQuestion: any) => {
                // Improved matching: check question text, options count, AND option values
                const optionsMatch =
                  activityQuestion.questionOptions.length ===
                    q.questionOptions.length &&
                  activityQuestion.questionOptions.every(
                    (opt: any, idx: number) =>
                      opt.option === q.questionOptions[idx]?.option
                  );

                return (
                  activityQuestion.question === q.question &&
                  optionsMatch &&
                  activityQuestion.answerExplanation === q.answerExplanation
                );
              }
            );

            if (questionInActivity !== -1) {
              sourceActivityIndex = activityIndex;
              sourceQuestionIndex = questionInActivity;
              break;
            }
          }

          return {
            question: q.question,
            options: q.questionOptions.map((opt: any) => opt.option),
            answers: q.questionAnswer.map((ans: any) => ans.answer.option),
            explanation: q.answerExplanation,
            sourceActivityIndex,
            sourceQuestionIndex,
            isSharedFromActivity: true,
          };
        } else {
          // This is a standalone final exam question
          return {
            question: q.question,
            options: q.questionOptions.map((opt: any) => opt.option),
            answers: q.questionAnswer.map((ans: any) => ans.answer.option),
            explanation: q.answerExplanation,
            sourceActivityIndex: undefined,
            sourceQuestionIndex: undefined,
            isSharedFromActivity: false,
          };
        }
      }),
    };

    return result;
  } catch (error) {
    console.error("Error fetching course for manager:", error);
    return null;
  }
}

export async function getCourseForAffiliate(id: string) {
  try {
    const session = await auth(),
      course = await prisma.course
        .findFirst({
          where: { id },
          include: {
            requirement: true,
            courseFor: true,
            activity: {
              include: {
                _count: { select: { subActivity: true } },
                subActivity: true,
              },
            },
            instructor: {
              select: { firstName: true, fatherName: true, lastName: true },
            },
          },
        })
        .then((res) =>
          res
            ? {
                ...res,
                price: Number(res.price),
                link: `${normalizeUrl(
                  process.env.MAIN_API || "",
                  `/courses/${id}`
                )}?code=${session?.user?.code || ""}`,
              }
            : res
        );
    return course;
  } catch (error) {
    console.log(error);
    return null;
  }
}

export async function getCourseForCustomer(id: string) {
  try {
    const course = await prisma.course
      .findFirst({
        where: { id },
        select: {
          id: true,
          titleEn: true,
          titleAm: true,
          video: true,
          thumbnail: true,
          aboutEn: true,
          aboutAm: true,
          level: true,
          language: true,
          duration: true,
          accessEn: true,
          accessAm: true,
          certificate: true,
          price: true,
          birrPrice: true,
          dolarPrice: true,
          instructorRate: true,
          sellerRate: true,
          affiliateRate: true,
          requirement: {
            select: { id: true, requirementEn: true, requirementAm: true },
          },
          courseFor: {
            select: { id: true, courseForEn: true, courseForAm: true },
          },
          activity: {
            orderBy: { order: "asc" },
            select: {
              _count: { select: { subActivity: true } },
              id: true,
              titleEn: true,
              titleAm: true,
              subActivity: {
                orderBy: { order: "asc" },
              },
            },
          },
          instructor: {
            select: { firstName: true, fatherName: true, lastName: true },
          },
          _count: { select: { order: true } },
        },
      })
      .then((res) =>
        res
          ? {
              ...res,
              price: Number(res.price),
              instructorRate: Number(res.instructorRate),
              sellerRate: Number(res.sellerRate),
              affiliateRate: Number(res.affiliateRate),
              birrPrice: res.birrPrice,
              dolarPrice: res.dolarPrice,
            }
          : res
      );
    return course;
  } catch {
    return null;
  }
}

// ----------------------------------------------------------

export async function getProgressForSeller(date: Date) {
  try {
    const session = await auth();
    if (session?.user?.code) {
      const data = await prisma.course
        .findMany({
          where: {},
          select: {
            id: true,
            titleEn: true,
            titleAm: true,
            order: {
              where: { code: String(session.user.code) },
              select: {
                id: true,
                date: true,
                income: true,
              },
            },
          },
        })
        .then((res) => {
          const year = date.getFullYear(),
            month = date.getMonth(),
            day = date.getDate();
          return res.map(({ id, titleEn, titleAm, order }) => ({
            id,
            titleEn,
            titleAm,
            totalSales: order.length,
            totalIncome: order.reduce(
              (acc, current) => acc + Number(current.income),
              0
            ),
            thisMonthSales: order.filter(
              (v) =>
                v.date.getFullYear() === year && v.date.getMonth() === month
            ).length,
            thisMonthIncome: order
              .filter(
                (v) =>
                  v.date.getFullYear() === year && v.date.getMonth() === month
              )
              .reduce((acc, current) => acc + Number(current.income), 0),
            thisDaySales: order.filter(
              (v) =>
                v.date.getFullYear() === year &&
                v.date.getMonth() === month &&
                v.date.getDate() === day
            ).length,
            thisDayIncome: order
              .filter(
                (v) =>
                  v.date.getFullYear() === year &&
                  v.date.getMonth() === month &&
                  v.date.getDate() === day
              )
              .reduce((acc, current) => acc + Number(current.income), 0),
          }));
        });
      return data;
    }
    throw new Error("Invalid session");
  } catch (error) {
    console.log(error);
    return [];
  }
}

// ------------------------------------------------------------

export async function getChannels() {
  try {
    const data = await prisma.channel.findMany({});
    return data;
  } catch (error) {
    console.log(error);
    return [];
  }
}

export async function getSellers(date: Date, courseId?: string) {
  try {
    const year = date.getFullYear(),
      month = date.getMonth(),
      // day = date.getDate(),
      data = await Promise.all(
        await prisma.user
          .findMany({
            where: { role: "seller" },
            include: { _count: { select: { order: true } } },
          })
          .then((res) =>
            res.map(async (value) => {
              const order = await prisma.order.findMany({
                where: {
                  code: value.code,
                  tx_ref: null,
                  ...(courseId ? { courseId } : {}),
                },
                select: { income: true, date: true },
              });
              return {
                ...value,
                sales: order.length,
                income: order.reduce((a, c) => a + Number(c.income), 0),
                thisMonthSales: order.filter(
                  (v) =>
                    v.date.getFullYear() === year && v.date.getMonth() === month
                ).length,
                thisMonthIncome: order
                  .filter(
                    (v) =>
                      v.date.getFullYear() === year &&
                      v.date.getMonth() === month
                  )
                  .reduce((a, c) => a + Number(c.income), 0),
              };
            })
          )
      );
    return data;
  } catch (error) {
    console.log(error);
    return [];
  }
}

// export async function getOverviewData() {
//   try {
//     const orders = await prisma.order.findMany({
//       where: { status: "paid" },
//       select: { tx_ref: true, code: true, price: true, income: true },
//     });
//     const data = [
//       {
//         label: "Course",
//         sales: orders.length,
//         profit: orders.reduce((a, c) => a + Number(c.price), 0),
//         income: orders.reduce((a, c) => a + Number(c.income), 0),
//         count: await prisma.course.findMany().then((res) => res.length),
//       },
//       {
//         label: "Affiliate",
//         sales: orders.filter((v) => v.tx_ref && v.code).length,
//         profit: orders
//           .filter((v) => v.tx_ref && v.code)
//           .reduce((a, c) => a + Number(c.price), 0),
//         income: orders
//           .filter((v) => v.tx_ref && v.code)
//           .reduce((a, c) => a + Number(c.income), 0),
//         count: await prisma.user
//           .findMany({ where: { role: "affiliate" } })
//           .then((res) => res.length),
//       },
//       {
//         label: "Seller",
//         sales: orders.filter((v) => !v.tx_ref && v.code).length,
//         profit: orders
//           .filter((v) => !v.tx_ref && v.code)
//           .reduce((a, c) => a + Number(c.price), 0),
//         income: orders
//           .filter((v) => !v.tx_ref && v.code)
//           .reduce((a, c) => a + Number(c.income), 0),
//         count: await prisma.user
//           .findMany({ where: { role: "seller" } })
//           .then((res) => res.length),
//       },
//     ];

//     return data;
//   } catch {
//     return [];
//   }
// }

export async function getSalesOverview({
  start,
  end,
}: {
  start: Date;
  end: Date;
}) {
  try {
    // return [
    //   { label: "Jan", affiliate: 186, seller: 80, own: 186 },
    //   { label: "Feb", affiliate: 305, seller: 200, own: 305 },
    //   { label: "Mar", affiliate: 237, seller: 120, own: 120 },
    //   { label: "Apr", affiliate: 73, seller: 190, own: 190 },
    //   { label: "May", affiliate: 209, seller: 130, own: 130 },
    //   { label: "Jun", affiliate: 214, seller: 140, own: 214 },
    //   { label: "Jul", affiliate: 305, seller: 200, own: 305 },
    //   { label: "Aug", affiliate: 209, seller: 130, own: 130 },
    //   { label: "Sep", affiliate: 237, seller: 120, own: 120 },
    //   { label: "Oct", affiliate: 209, seller: 130, own: 130 },
    //   { label: "Nov", affiliate: 214, seller: 140, own: 214 },
    //   { label: "Dec", affiliate: 209, seller: 130, own: 130 },
    // ];

    const data: {
      label: string;
      affiliate: number;
      seller: number;
      own: number;
    }[] = [];

    const startDate = start.getDate(),
      startMonth = start.getMonth(),
      startYear = start.getFullYear(),
      endDate = end.getDate(),
      endMonth = end.getMonth(),
      endYear = end.getFullYear();
    let currentDate = startDate,
      currentMonth = startMonth,
      currentYear = startYear;
    if (currentYear === endYear && Math.abs(currentMonth - endMonth) <= 1) {
      while (start > end ? currentDate >= endDate : currentDate <= endDate) {
        const currentNewDate = new Date(currentYear, currentMonth, currentDate),
          orders = await prisma.order.findMany({
            where: {
              AND: [
                { date: { gte: currentNewDate } },
                {
                  date: {
                    lt: new Date(
                      currentNewDate.getTime() + 24 * 60 * 60 * 1000
                    ),
                  },
                },
              ],
            },
          });
        data.push({
          label: currentNewDate.toDateString().slice(4, 10),
          affiliate: orders.filter((v) => !v.tx_ref && v.code).length,
          seller: orders.filter((v) => v.tx_ref && v.code).length,
          own: orders.filter((v) => !v.code).length,
        });
        if (start > end) {
          currentDate--;
        } else {
          currentDate++;
        }
        // console.log("HERE :: ");
      }
    } else {
      while (
        currentYear === endYear
          ? start > end
            ? currentMonth >= endMonth
            : currentMonth <= endMonth
          : true
      ) {
        const newStartDate = new Date(
            currentYear,
            currentMonth,
            currentYear === endYear && currentMonth === startMonth
              ? startDate
              : 1
          ),
          newEndDate = new Date(
            currentYear,
            currentMonth,
            currentYear === endYear && currentMonth === endMonth
              ? endDate
              : new Date(currentYear, currentMonth + 1, 0).getDate()
          ),
          orders = await prisma.order.findMany({
            where: {
              date: {
                gte: newStartDate,
                lte: newEndDate,
              },
            },
          });
        data.push({
          label: newStartDate.toDateString().slice(4, 7),
          affiliate: orders.filter((v) => !v.tx_ref && v.code).length,
          seller: orders.filter((v) => v.tx_ref && v.code).length,
          own: orders.filter((v) => !v.code).length,
        });
        if (start > end) {
          if (currentMonth === 0) {
            currentYear--;
            currentMonth = 11;
          } else {
            currentMonth--;
          }
        } else {
          if (currentMonth === 11) {
            currentYear++;
            currentMonth = 0;
          } else {
            currentMonth++;
          }
        }
      }
    }

    return data;
  } catch {
    return [];
  }
}

export async function getfeckdata({ start, end }: { start: Date; end: Date }) {
  try {
    // return [
    //   { label: "Jan", affiliate: 186, seller: 80, own: 186 },
    //   { label: "Feb", affiliate: 305, seller: 200, own: 305 },
    //   { label: "Mar", affiliate: 237, seller: 120, own: 120 },
    //   { label: "Apr", affiliate: 73, seller: 190, own: 190 },
    //   { label: "May", affiliate: 209, seller: 130, own: 130 },
    //   { label: "Jun", affiliate: 214, seller: 140, own: 214 },
    //   { label: "Jul", affiliate: 305, seller: 200, own: 305 },
    //   { label: "Aug", affiliate: 209, seller: 130, own: 130 },
    //   { label: "Sep", affiliate: 237, seller: 120, own: 120 },
    //   { label: "Oct", affiliate: 209, seller: 130, own: 130 },
    //   { label: "Nov", affiliate: 214, seller: 140, own: 214 },
    //   { label: "Dec", affiliate: 209, seller: 130, own: 130 },
    // ];

    const data: {
      label: string;
      order: number;
    }[] = [];

    const startDate = start.getDate(),
      startMonth = start.getMonth(),
      startYear = start.getFullYear(),
      endDate = end.getDate(),
      endMonth = end.getMonth(),
      endYear = end.getFullYear();
    let currentDate = startDate,
      currentMonth = startMonth,
      currentYear = startYear;
    if (currentYear === endYear && Math.abs(currentMonth - endMonth) <= 1) {
      while (start > end ? currentDate >= endDate : currentDate <= endDate) {
        const currentNewDate = new Date(currentYear, currentMonth, currentDate),
          orders = await prisma.order.findMany({
            where: {
              AND: [
                { date: { gte: currentNewDate } },
                {
                  date: {
                    lt: new Date(
                      currentNewDate.getTime() + 24 * 60 * 60 * 1000
                    ),
                  },
                },
              ],
            },
          });
        data.push({
          label: currentNewDate.toDateString().slice(4, 10),
          order: orders.filter((v) => !v.tx_ref && v.code).length,
        });
        if (start > end) {
          currentDate--;
        } else {
          currentDate++;
        }
        // console.log("HERE :: ");
      }
    } else {
      while (
        currentYear === endYear
          ? start > end
            ? currentMonth >= endMonth
            : currentMonth <= endMonth
          : true
      ) {
        const newStartDate = new Date(
            currentYear,
            currentMonth,
            currentYear === endYear && currentMonth === startMonth
              ? startDate
              : 1
          ),
          newEndDate = new Date(
            currentYear,
            currentMonth,
            currentYear === endYear && currentMonth === endMonth
              ? endDate
              : new Date(currentYear, currentMonth + 1, 0).getDate()
          ),
          orders = await prisma.order.findMany({
            where: {
              date: {
                gte: newStartDate,
                lte: newEndDate,
              },
            },
          });
        data.push({
          label: newStartDate.toDateString().slice(4, 7),
          order: orders.filter((v) => !v.tx_ref && v.code).length,
        });
        if (start > end) {
          if (currentMonth === 0) {
            currentYear--;
            currentMonth = 11;
          } else {
            currentMonth--;
          }
        } else {
          if (currentMonth === 11) {
            currentYear++;
            currentMonth = 0;
          } else {
            currentMonth++;
          }
        }
      }
    }

    return data;
  } catch {
    return [];
  }
}

export async function getCourses() {
  try {
    const data = await prisma.course.findMany({
      select: { id: true, titleAm: true, titleEn: true },
    });
    return data;
  } catch {
    return [];
  }
}

export async function getInstructors() {
  try {
    const data = await prisma.user.findMany({
      where: {
        role: "instructor",
      },
      select: {
        id: true,
        firstName: true,
        fatherName: true,
        lastName: true,
        phoneNumber: true,
      },
    });
    return data;
  } catch {
    return [];
  }
}
