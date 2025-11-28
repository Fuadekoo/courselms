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
        OR: [
          { title: { contains: q } },
          { description: { contains: q } },
        ],
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
    const {
      title,
      description,
      type = "PERCENT",
      value,
      currency,
      startDate,
      endDate,
      frequency = "NONE",
      daysOfWeek,
      isActive = true,
    } = body;

    if (!title || typeof value !== "number" || !startDate) {
      return NextResponse.json({ error: "Invalid payload" }, { status: 400 });
    }
    if (type === "AMOUNT" && !currency) {
      return NextResponse.json(
        { error: "currency required for AMOUNT" },
        { status: 400 }
      );
    }
    if (type === "PERCENT" && (value < 0 || value > 100)) {
      return NextResponse.json(
        { error: "percent value must be 0..100" },
        { status: 400 }
      );
    }

    const created = await prisma.periodicDiscount.create({
      data: {
        title,
        description,
        type,
        value,
        currency: type === "AMOUNT" ? currency : null,
        startDate: new Date(startDate),
        endDate: endDate ? new Date(endDate) : null,
        frequency,
        daysOfWeek: daysOfWeek ?? null,
        isActive: Boolean(isActive),
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
