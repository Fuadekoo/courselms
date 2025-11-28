import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { Prisma } from "@prisma/client";

export async function GET(req: Request) {
  const { searchParams } = new URL(req.url);
  const q = searchParams.get("q") ?? "";
  const page = Number(searchParams.get("page") ?? "1");
  const pageSize = Math.min(Number(searchParams.get("pageSize") ?? "20"), 100);
  const skip = (page - 1) * pageSize;

  const where: Prisma.PeriodicDiscountWhereInput | undefined = q
    ? {
        OR: [{ title: { contains: q } }, { description: { contains: q } }],
      }
    : undefined;

  const [items, total] = await Promise.all([
    prisma.periodicDiscount.findMany({
      where,
      orderBy: { createdAt: "desc" },
      skip,
      take: pageSize,
    }),
    prisma.periodicDiscount.count({ where }),
  ]);

  return NextResponse.json({ items, total, page, pageSize });
}

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const { discountRate, startDate, endDate, courseId } = body;

    if (typeof discountRate !== "number" || !startDate || !courseId) {
      return NextResponse.json({ error: "Invalid payload" }, { status: 400 });
    }
    if (discountRate < 0 || discountRate > 100) {
      return NextResponse.json(
        { error: "discount rate must be 0..100" },
        { status: 400 }
      );
    }

    const created = await prisma.periodicDiscount.create({
      data: {
        discountRate,
        startDate: new Date(startDate),
        endDate: new Date(endDate),
        courseId,
      },
    });

    return NextResponse.json(created, { status: 201 });
  } catch (e: any) {
    return NextResponse.json(
      { error: e?.message ?? "Failed to create" },
      { status: 500 }
    );
  }
}
