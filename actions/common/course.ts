"use server";

import prisma from "@/lib/db";
import { TTableData } from "@/lib/definations";

export async function getCourses(tableData: TTableData) {
  try {
    let totalData = 0,
      totalPage = 0;
    const data = await prisma.course
      .findMany({
        include: {
          activity: { select: { _count: { select: { subActivity: true } } } },
          instructor: {
            select: { id: true, firstName: true, fatherName: true },
          },
        },
      })
      .then((res: any) => {
        //   console.log(">> ", res);
        const temp = res.filter((v: any) =>
          `${v.titleEn} ${v.titleEn}`
            .toLowerCase()
            .includes(tableData.search.toLowerCase())
        );
        totalData = temp.length;
        totalPage = Math.ceil(totalData / tableData.rowsPerPage);
        return temp;
      })
      .then((res: any) =>
        res.slice(
          (tableData.currentPage - 1) * tableData.rowsPerPage,
          tableData.currentPage * tableData.rowsPerPage
        )
      )
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
      )
      .then((res) =>
        res.sort((a, b) => {
          let temp1 = "",
            temp2 = "";
          switch (tableData.sortDescriptor.column) {
            case "title": {
              temp1 = `${a.titleEn} ${a.titleAm}`;
              temp2 = `${b.titleEn} ${b.titleAm}`;
              break;
            }
            default: {
              temp1 = `${a[tableData.sortDescriptor.column as keyof typeof a]}`;
              temp2 = `${b[tableData.sortDescriptor.column as keyof typeof b]}`;
            }
          }
          return tableData.sortDescriptor.direction == "ascending"
            ? temp1 > temp2
              ? -1
              : temp1 < temp2
              ? 1
              : 0
            : temp1 > temp2
            ? 1
            : temp1 < temp2
            ? -1
            : 0;
        })
      );
    return { list: data ?? [], totalData, totalPage };
  } catch (error) {
    throw error;
  }
}
