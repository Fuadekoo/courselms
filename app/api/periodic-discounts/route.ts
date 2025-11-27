import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export async function GET() {
  try {
    const discounts = await prisma.periodicDiscount.findMany();
    return NextResponse.json(discounts);
  } catch (error) {
    return NextResponse.json(
      { error: 'Failed to fetch discounts' },
      { status: 500 }
    );
  }
}

export async function POST(request: Request) {
  try {
    const data = await request.json();
    const discount = await prisma.periodicDiscount.create({
      data,
    });
    return NextResponse.json(discount, { status: 201 });
  } catch (error) {
    return NextResponse.json(
      { error: 'Failed to create discount' },
      { status: 500 }
    );
  }
}
