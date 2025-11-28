"use server";

import prisma from "@/lib/db";
import { StateType, TTableData } from "@/lib/definations";
import { Selection } from "@heroui/react";

export async function toggleCourseStatus(
  prevState: StateType,
  id: string | undefined
): Promise<StateType> {
  try {
    if (!id) return undefined;
    const status = await prisma.course
      .findFirst({ where: { id } })
      .then((res) => res?.status);
    await prisma.course.update({ where: { id }, data: { status: !status } });

    return { status: true };
  } catch {
    return { status: false, cause: "", message: "" };
  }
}

type TOverviewData = {
  0: { label: string; value: number | string; status?: number }[];
  1: { label: string; value: number }[];
  2: { label: string; value: number }[];
  3: { label: string; value: number }[];
  4: { label: string; seller: number; affiliate: number; own: number }[];
};

export async function getOverviewData(
  date: {
    start: Date;
    end: Date;
  },
  courseId?: string
): Promise<TOverviewData> {
  const data: TOverviewData = {
    0: [],
    1: [],
    2: [],
    3: [],
    4: [],
  };
  const thisMonthStartDate = new Date(),
    thisMonthEndDate = new Date(),
    lastMonthStartDate = new Date(),
    lastMonthEndDate = new Date();
  thisMonthStartDate.setDate(1);
  thisMonthEndDate.setMonth(thisMonthEndDate.getMonth() + 1);
  thisMonthEndDate.setDate(0);

  lastMonthStartDate.setMonth(lastMonthStartDate.getMonth() - 1);
  lastMonthStartDate.setDate(1);
  lastMonthEndDate.setDate(0);

  const totalOrders = await prisma.order.findMany({
      where: {
        status: "paid",
        ...(courseId ? { courseId } : {}),
      },
      select: {
        user: { select: { gender: true, country: true } },
        price: true,
        tx_ref: true,
        code: true,
        instructorIncome: true,
        income: true,
        date: true,
      },
    }),
    thisMonthOrders = totalOrders.filter(
      (v) => v.date >= thisMonthStartDate && v.date <= thisMonthEndDate
    ),
    lastMonthOrders = totalOrders.filter(
      (v) => v.date >= lastMonthStartDate && v.date <= lastMonthEndDate
    ),
    findStatus = (x: number, y: number) =>
      y == 0 ? (x == 0 ? 0 : 100) : Number((((x - y) / y) * 100).toFixed(2));

  data[0] = (
    [
      ...(courseId
        ? []
        : ([
            ["Course", await prisma.course.count()],
            ["Seller", await prisma.user.count({ where: { role: "seller" } })],
            [
              "Affiliate",
              await prisma.user.count({ where: { role: "affiliate" } }),
            ],
          ] as const)),
      ["Sale", totalOrders.length],
      ["Earn ETB", totalOrders.reduce((a, c) => a + Number(c.price || 0), 0)],
      [
        "Cost ETB",
        totalOrders.reduce(
          (a, c) => a + Number(c.instructorIncome || 0) + Number(c.income || 0),
          0
        ),
      ],
      ["ThisMonth Sale", thisMonthOrders.length, lastMonthOrders.length],
      [
        "ThisMonth Earn ETB",
        thisMonthOrders.reduce((acc, c) => acc + Number(c.price), 0),
        lastMonthOrders.reduce((acc, c) => acc + Number(c.price), 0),
      ],
      [
        "ThisMonth Cost ETB",
        thisMonthOrders.reduce(
          (acc, c) =>
            acc + Number(c.income || 0) + Number(c.instructorIncome || 0),
          0
        ),
        lastMonthOrders.reduce(
          (acc, c) =>
            acc + Number(c.income || 0) + Number(c.instructorIncome || 0),
          0
        ),
      ],
    ] as const
  ).map(([label, value, last]) => ({
    label,
    value,
    status:
      typeof value == "number" && last !== undefined
        ? findStatus(value, last)
        : undefined,
  }));

  data[1] = Object.entries(
    totalOrders.reduce(
      (acc, { user: { country } }) => ({
        ...acc,
        [country]: (acc[country] ?? 0) + 1,
      }),
      {} as { [index: string]: number }
    )
  ).map(([label, value]) => ({ label, value }));

  data[2] = Object.entries(
    totalOrders.reduce(
      (acc, { user: { gender } }) => ({
        ...acc,
        [gender ?? "unknown"]: (acc[gender ?? "unknown"] ?? 0) + 1,
      }),
      {} as { [index: string]: number }
    )
  ).map(([label, value]) => ({ label, value }));

  data[3] = Object.entries(
    totalOrders.reduce(
      (acc, { code, tx_ref }) => ({
        ...acc,
        [tx_ref ? (code ? "affiliate" : "own") : "seller"]:
          (acc[tx_ref ? (code ? "affiliate" : "own") : "seller"] ?? 0) + 1,
      }),
      {} as { [index: string]: number }
    )
  ).map(([label, value]) => ({ label, value }));

  // if (!start) {
  //   start = new Date();
  // }
  // if (!end) {
  //   end = new Date();
  //   start.setDate(1);
  //   end.setMonth(end.getMonth() + 1);
  //   end.setDate(0);
  // }
  const startDate = date.start.getDate(),
    startMonth = date.start.getMonth(),
    startYear = date.start.getFullYear(),
    endDate = date.end.getDate(),
    endMonth = date.end.getMonth(),
    endYear = date.end.getFullYear();
  let currentDate = startDate,
    currentMonth = startMonth,
    currentYear = startYear;
  if (currentYear === endYear && Math.abs(currentMonth - endMonth) == 0) {
    while (
      date.start > date.end ? currentDate >= endDate : currentDate <= endDate
    ) {
      const currentNewDate = new Date(currentYear, currentMonth, currentDate),
        orders = await prisma.order.findMany({
          where: {
            AND: [
              { date: { gte: currentNewDate } },
              {
                date: {
                  lt: new Date(currentNewDate.getTime() + 24 * 60 * 60 * 1000),
                },
              },
            ],
            ...(courseId ? { courseId } : {}),
          },
        });
      data[4].push({
        label: currentNewDate.toDateString().slice(4, 10),
        affiliate: orders.filter((v) => v.tx_ref && v.code).length,
        seller: orders.filter((v) => !v.tx_ref && v.code).length,
        own: orders.filter((v) => v.tx_ref && !v.code).length,
      });
      if (date.start > date.end) {
        currentDate--;
      } else {
        currentDate++;
      }
    }
  } else {
    while (
      currentYear === endYear
        ? date.start > date.end
          ? currentMonth >= endMonth
          : currentMonth <= endMonth
        : true
    ) {
      const newStartDate = new Date(
          currentYear,
          currentMonth,
          currentYear === endYear && currentMonth === startMonth ? startDate : 1
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
            status: "paid",
            date: {
              gte: newStartDate,
              lte: newEndDate,
            },
            ...(courseId ? { courseId } : {}),
          },
        });
      data[4].push({
        label: newStartDate.toDateString().slice(4, 7),
        affiliate: orders.filter((v) => v.tx_ref && v.code).length,
        seller: orders.filter((v) => !v.tx_ref && v.code).length,
        own: orders.filter((v) => v.tx_ref && !v.code).length,
      });
      if (date.start > date.end) {
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
}

export async function getCoursesList() {
  try {
    const data = await prisma.course.findMany({
      where: { status: true },
      select: { id: true, titleEn: true, titleAm: true },
    });
    return data;
  } catch (error) {
    throw error;
  }
}

export async function getCourses(
  tableData: TTableData & { status: Selection }
) {
  let totalData = 0,
    totalPage = 0;

  const data = await prisma.course
    .findMany({
      where: {
        ...((temp) =>
          temp.length > 0
            ? {
                OR: temp.map((v) => ({ status: v == "active" ? true : false })),
              }
            : {})(Array.from(tableData.status)),
      },
      select: {
        id: true,
        titleAm: true,
        titleEn: true,
        thumbnail: true,
        status: true,
        order: {
          where: { status: "paid" },
          select: { price: true, code: true, tx_ref: true, income: true },
        },
        _count: { select: { order: true } },
      },
    })
    .then((res) => {
      const temp = res.filter((v) =>
        `${v.titleEn} ${v.titleAm}`
          .toLowerCase()
          .includes(tableData.search.toLowerCase())
      );
      totalData = temp.length;
      totalPage = Math.ceil(totalData / tableData.rowsPerPage);
      return temp;
    })
    .then((res) =>
      res.slice(
        (tableData.currentPage - 1) * tableData.rowsPerPage,
        tableData.currentPage * tableData.rowsPerPage
      )
    )
    .then((res) =>
      res.map(({ order, ...rest }) => ({
        ...rest,
        sale: order.length,
        income: order.reduce((acc, current) => acc + Number(current.price), 0),
        affiliateSale: order.filter((v) => v.tx_ref && v.code).length,
        affiliateIncome: order.reduce(
          (acc, current) =>
            acc + (current.tx_ref && current.code ? Number(current.income) : 0),
          0
        ),
        sellerSale: order.filter((v) => !v.tx_ref && v.code).length,
        sellerIncome: order.reduce(
          (acc, current) =>
            acc + (current.tx_ref && current.code ? 0 : Number(current.income)),
          0
        ),
      }))
    )
    .then((res) =>
      res.sort((a, b) => {
        let temp1 = "",
          temp2 = "";

        switch (tableData.sortDescriptor.column) {
          case "title": {
            temp1 = `${a.titleEn} ${a.titleAm} `;
            temp2 = `${b.titleEn} ${b.titleAm} `;
            break;
          }
          default: {
            temp1 = `${a[tableData.sortDescriptor.column as keyof typeof a]}`;
            temp2 = `${b[tableData.sortDescriptor.column as keyof typeof b]}`;
          }
        }

        return temp1 !== undefined && temp2 !== undefined
          ? tableData.sortDescriptor.direction == "ascending"
            ? temp1 > temp2
              ? -1
              : temp1 < temp2
              ? 1
              : 0
            : temp1 > temp2
            ? 1
            : temp1 < temp2
            ? -1
            : 0
          : 0;
      })
    );
  return { list: data, totalData, totalPage };
}

export async function getCourse(id: string) {
  const course = await prisma.course
    .findFirst({
      where: { id },
      include: {
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
            question: true,
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
}
export async function updateAiProvider(packageId: string, aiProvider: string) {
  try {
    await prisma.course.update({
      where: { id: packageId },
      data: { aiProvider: aiProvider },
    });
  } catch (error) {
    console.error("Error updating AI provider:", error);
    return { success: false, message: "Failed to update AI provider" };
  }

  return { success: true, message: "AI provider updated successfully" };
}
export async function removeCourse(
  prevState: StateType,
  id: string | undefined
): Promise<StateType> {
  try {
    if (!id) throw new Error();
    await prisma.course.delete({ where: { id } });
    return { status: true };
  } catch {
    return { status: false, cause: "", message: "" };
  }
}
