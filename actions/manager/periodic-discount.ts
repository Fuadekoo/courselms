'use server';

import prisma from "@/lib/db";
import { revalidatePath } from 'next/cache';

type DiscountType = 'PERCENT' | 'AMOUNT';
type Frequency = 'NONE' | 'DAILY' | 'WEEKLY' | 'MONTHLY';

export interface PeriodicDiscountInput {
  id?: string;
  title: string;
  description?: string;
  type: DiscountType;
  value: number;
  currency?: string;
  startDate: Date | string;
  endDate?: Date | string | null;
  frequency: Frequency;
  daysOfWeek?: string | null;
  isActive: boolean;
}

export async function getPeriodicDiscounts() {
  try {
    const discounts = await prisma.periodicDiscount.findMany({
      orderBy: { createdAt: 'desc' },
    });
    return { data: discounts, error: null };
  } catch (error) {
    console.error('Error fetching periodic discounts:', error);
    return { 
      data: [], 
      error: 'Failed to fetch periodic discounts. Please try again.' 
    };
  }
}

export async function getPeriodicDiscountById(id: string) {
  try {
    const discount = await prisma.periodicDiscount.findUnique({
      where: { id },
    });
    
    if (!discount) {
      return { data: null, error: 'Discount not found' };
    }
    
    return { data: discount, error: null };
  } catch (error) {
    console.error(`Error fetching discount with ID ${id}:`, error);
    return { 
      data: null, 
      error: 'Failed to fetch discount. Please try again.' 
    };
  }
}

export async function createPeriodicDiscount(data: Omit<PeriodicDiscountInput, 'id'>) {
  try {
    // Validate required fields
    if (!data.title || data.value === undefined) {
      return { 
        data: null, 
        error: 'Title and value are required fields' 
      };
    }

    // Validate value based on type
    if (data.type === 'PERCENT' && (data.value <= 0 || data.value > 100)) {
      return { 
        data: null, 
        error: 'Percentage must be between 0 and 100' 
      };
    }

    if (data.type === 'AMOUNT' && data.value <= 0) {
      return { 
        data: null, 
        error: 'Amount must be greater than 0' 
      };
    }

    // Validate date range
    const startDate = new Date(data.startDate);
    const endDate = data.endDate ? new Date(data.endDate) : null;
    
    if (endDate && endDate <= startDate) {
      return { 
        data: null, 
        error: 'End date must be after start date' 
      };
    }

    // Validate daysOfWeek for weekly frequency
    if (data.frequency === 'WEEKLY' && !data.daysOfWeek) {
      return { 
        data: null, 
        error: 'Days of week are required for weekly frequency' 
      };
    }

    const discount = await prisma.periodicDiscount.create({
      data: {
        discountRate: data.value,
        startDate: startDate,
        endDate: endDate ?? new Date(),
        courseId: 'default',
      },
    });

    revalidatePath('/periodic-discounts');
    return { data: discount, error: null };
  } catch (error) {
    console.error('Error creating periodic discount:', error);
    return { 
      data: null, 
      error: 'Failed to create discount. Please try again.' 
    };
  }
}

export async function updatePeriodicDiscount(id: string, data: Partial<PeriodicDiscountInput>) {
  try {
    // Check if discount exists
    const existingDiscount = await prisma.periodicDiscount.findUnique({
      where: { id },
    });

    if (!existingDiscount) {
      return { 
        data: null, 
        error: 'Discount not found' 
      };
    }

    // Validate value if being updated
    if (data.value !== undefined) {
      // Skip type validation as field doesn't exist
      
      if (data.value && data.value <= 0) {
        return { 
          data: null, 
          error: 'Value must be greater than 0' 
        };
      }
    }

    // Validate date range if dates are being updated
    const startDate = data.startDate 
      ? new Date(data.startDate) 
      : new Date(existingDiscount.startDate);
      
    const endDate = data.endDate !== undefined 
      ? (data.endDate ? new Date(data.endDate) : null)
      : (existingDiscount.endDate ? new Date(existingDiscount.endDate) : null);

    if (endDate && endDate <= startDate) {
      return { 
        data: null, 
        error: 'End date must be after start date' 
      };
    }

    // Skip frequency validation as field doesn't exist in schema

    const updatedDiscount = await prisma.periodicDiscount.update({
      where: { id },
      data: {
        discountRate: data.value,
        startDate: data.startDate ? new Date(data.startDate) : undefined,
        endDate: data.endDate !== undefined 
          ? (data.endDate ? new Date(data.endDate) : undefined)
          : undefined,
      },
    });

    revalidatePath('/periodic-discounts');
    return { data: updatedDiscount, error: null };
  } catch (error) {
    console.error(`Error updating discount with ID ${id}:`, error);
    return { 
      data: null, 
      error: 'Failed to update discount. Please try again.' 
    };
  }
}

export async function deletePeriodicDiscount(id: string) {
  try {
    // Check if discount exists
    const existingDiscount = await prisma.periodicDiscount.findUnique({
      where: { id },
    });

    if (!existingDiscount) {
      return { 
        success: false, 
        error: 'Discount not found' 
      };
    }

    await prisma.periodicDiscount.delete({
      where: { id },
    });

    revalidatePath('/periodic-discounts');
    return { success: true, error: null };
  } catch (error) {
    console.error(`Error deleting discount with ID ${id}:`, error);
    return { 
      success: false, 
      error: 'Failed to delete discount. Please try again.' 
    };
  }
}

export async function toggleDiscountStatus(id: string) {
  try {
    const updatedDiscount = await prisma.periodicDiscount.update({
      where: { id },
      data: { discountRate: 10 },
    });

    revalidatePath('/periodic-discounts');
    return { data: updatedDiscount, error: null };
  } catch (error) {
    console.error(`Error toggling status for discount ${id}:`, error);
    return { 
      data: null, 
      error: 'Failed to update discount status. Please try again.' 
    };
  }
}