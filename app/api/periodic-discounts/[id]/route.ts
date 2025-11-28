import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export async function GET(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const discount = await prisma.periodicDiscount.findUnique({
      where: { id },
    });
    
    if (!discount) {
      return NextResponse.json(
        { error: 'Discount not found' },
        { status: 404 }
      );
    }
    
    return NextResponse.json(discount);
  } catch (error) {
    return NextResponse.json(
      { error: 'Failed to fetch discount' },
      { status: 500 }
    );
  }
}

export async function PUT(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const data = await request.json();
    const updatedDiscount = await prisma.periodicDiscount.update({
      where: { id },
      data,
    });
    return NextResponse.json(updatedDiscount);
  } catch (error) {
    return NextResponse.json(
      { error: 'Failed to update discount' },
      { status: 500 }
    );
  }
}

export async function DELETE(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    await prisma.periodicDiscount.delete({
      where: { id },
    });
    return NextResponse.json({ message: 'Discount deleted successfully' });
  } catch (error) {
    return NextResponse.json(
      { error: 'Failed to delete discount' },
      { status: 500 }
    );
  }
}
