/* eslint-disable @typescript-eslint/no-explicit-any */
import { NextResponse } from "next/server";
import prisma from "@/lib/db";


export async function GET(req: Request) {
  try {
    const { searchParams } = new URL(req.url);
    const q = searchParams.get("q") ?? "";
    const page = Number(searchParams.get("page") ?? "1");
    const pageSize = Math.min(
      Number(searchParams.get("pageSize") ?? "20"),
      100
    );
    const skip = (page - 1) * pageSize;

  const where: any = q
    ? {
        OR: [{ title: { contains: q } }, { description: { contains: q } }],
      }
    : undefined;

  const [items, total] = await Promise.all([
    prisma.periodicDiscount.findMany({
      where: where ? { courseId: { contains: q } } : undefined,
      orderBy: { createdAt: "desc" },
      skip,
      take: pageSize,
      include: {
        course: {
          select: {
            id: true,
            titleEn: true,
            titleAm: true,
          },
        },
      },
    }),
    prisma.periodicDiscount.count({
      where: where ? { courseId: { contains: q } } : undefined,
    }),
  ]);

    return NextResponse.json({ items, total, page, pageSize });
  } catch (e: any) {
    console.error("Error in GET /api/discounts:", e);
    return NextResponse.json(
      { error: e?.message ?? "Failed to fetch discounts" },
      { status: 500 }
    );
  }
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
