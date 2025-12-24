"use server";

import { auth } from "@/lib/auth";
import prisma from "@/lib/db";
import { StateType, TManager, TTableData } from "@/lib/definations";
import bcryptjs from "bcryptjs";

export async function registerManager(
  prevState: StateType,
  data: TManager | undefined
): Promise<StateType> {
  try {
    if (!data) throw new Error();
    const { id, password, ...rest } = data;
    if (id) {
      await prisma.user.update({
        where: { id },
        data: {
          ...rest,
          age: Number(rest.age),
          ...(password ? { password: await bcryptjs.hash(password, 12) } : {}),
        },
      });
    } else {
      await prisma.user.create({
        data: {
          ...rest,
          role: "manager",
          age: Number(rest.age),
          password: await bcryptjs.hash(password ?? rest.firstName, 12),
        },
      });
    }
    return { status: true };
  } catch {
    return { status: false, cause: "", message: "" };
  }
}

export async function registerPermission(
  prevState: StateType,
  data: { id: string; permission: string[] } | undefined
): Promise<StateType> {
  try {
    if (!data) throw new Error();
    await prisma.permission.deleteMany({ where: { userId: data.id } });
    await prisma.permission.createMany({
      data: data.permission.map((permission) => ({
        userId: data.id,
        permission,
      })),
    });
    return { status: true };
  } catch {
    return { status: false, cause: "", message: "" };
  }
}

export async function getPermission() {
  try {
    const session = await auth(),
      data = await prisma.permission.findMany({
        where: { userId: session?.user?.id },
      });
    return data;
  } catch (error) {
    throw error;
  }
}

export async function getManagers(tableData: TTableData) {
  try {
    let totalData = 0,
      totalPage = 0;
    const data = await prisma.user
      .findMany({
        where: { role: "manager" },
        select: {
          id: true,
          firstName: true,
          fatherName: true,
          lastName: true,
          gender: true,
          age: true,
          country: true,
          region: true,
          city: true,
          status: true,
          permission: {
            select: {
              permission: true,
            },
          },
        },
      })
      .then((res) => {
        //   console.log(">> ", res);
        const temp = res.filter((v) =>
          `${v.firstName} ${v.fatherName} ${v.lastName}`
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
        res.sort((a, b) => {
          let temp1 = "",
            temp2 = "";
          switch (tableData.sortDescriptor.column) {
            case "name": {
              temp1 = `${a.firstName} ${a.fatherName} ${a.lastName}`;
              temp2 = `${b.firstName} ${b.fatherName} ${b.lastName}`;
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
  } catch (error) {
    throw error;
  }
}

export async function getManager(id: string | undefined) {
  try {
    if (!id) return undefined;
    const data = await prisma.user.findFirst({
      where: { id },
      select: {
        id: true,
        firstName: true,
        fatherName: true,
        lastName: true,
        gender: true,
        age: true,
        country: true,
        region: true,
        city: true,
        phoneNumber: true,
      },
    });
    return data;
  } catch (error) {
    throw error;
  }
}

export async function removeManager(
  prevState: StateType,
  id: string | undefined
): Promise<StateType> {
  try {
    if (!id) throw new Error();
    await prisma.user.delete({ where: { id } });
    return { status: true };
  } catch {
    return { status: false, cause: "", message: "" };
  }
}
