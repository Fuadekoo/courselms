# 🎨 Loading & Empty States - Consistent UI Guide

## ✨ What Was Updated

Successfully replaced **32 loading files** across your entire application to use the beautiful Newton's Cradle animation!

## 🎯 Components Available

### 1. Loading Component (Newton's Cradle)
```typescript
import Loading from "@/components/loading";

// Usage
<Loading />
```

**Features:**
- 🎪 Beautiful Newton's Cradle physics animation
- 🎨 Sky blue color matching your theme
- 📱 Responsive and smooth
- ⚡ Automatically registered via ldrs library

### 2. NoData Component
```typescript
import NoData from "@/components/noData";

// Basic usage
<NoData />

// With custom message
<NoData message="No courses found. Try adjusting your filters." />
```

**Features:**
- 🔍 Beautiful document + magnifying glass illustration
- 🌙 Dark mode support
- ✨ Smooth animations with Framer Motion
- 💬 Optional custom message

## 📊 Updated Files (32 Total)

### Main App
- ✅ `app/loading.tsx`

### Manager Routes
- ✅ `app/[lang]/@manager/loading.tsx`
- ✅ `app/[lang]/@manager/dashboard/loading.tsx`
- ✅ `app/[lang]/@manager/course/loading.tsx`
- ✅ `app/[lang]/@manager/course/[id]/detail/loading.tsx`
- ✅ `app/[lang]/@manager/course/registration/[[...id]]/loading.tsx`
- ✅ `app/[lang]/@manager/student/loading.tsx`
- ✅ `app/[lang]/@manager/student/[id]/loading.tsx`
- ✅ `app/[lang]/@manager/student/registration/[[...id]]/loading.tsx`
- ✅ `app/[lang]/@manager/instructor/loading.tsx`
- ✅ `app/[lang]/@manager/seller/loading.tsx`
- ✅ `app/[lang]/@manager/seller/[id]/loading.tsx`
- ✅ `app/[lang]/@manager/seller/registration/[[...id]]/loading.tsx`
- ✅ `app/[lang]/@manager/affiliate/loading.tsx`
- ✅ `app/[lang]/@manager/affiliate/[id]/loading.tsx`
- ✅ `app/[lang]/@manager/affiliate/registration/[[...id]]/loading.tsx`
- ✅ `app/[lang]/@manager/message/loading.tsx`
- ✅ `app/[lang]/@manager/feedback/loading.tsx`

### Instructor Routes
- ✅ `app/[lang]/@instructor/course/loading.tsx`
- ✅ `app/[lang]/@instructor/course/[id]/loading.tsx`

### Seller Routes
- ✅ `app/[lang]/@seller/loading.tsx`
- ✅ `app/[lang]/@seller/course/loading.tsx`
- ✅ `app/[lang]/@seller/progress/loading.tsx`
- ✅ `app/[lang]/@seller/sale/[...id]/loading.tsx`

### Affiliate Routes
- ✅ `app/[lang]/@affiliate/loading.tsx`
- ✅ `app/[lang]/@affiliate/course/loading.tsx`
- ✅ `app/[lang]/@affiliate/progress/loading.tsx`

### Other Routes
- ✅ `app/[lang]/@pending/loading.tsx`
- ✅ `app/[lang]/@inactive/loading.tsx`
- ✅ `app/[lang]/@student/verify-payment/[tx_ref]/loading.tsx`
- ✅ `app/[lang]/(guest)/loading.tsx`
- ✅ `app/[lang]/(guest)/verify-payment/[tx_ref]/loading.tsx`

## 🚀 Usage Examples

### Example 1: Page-Level Loading (Next.js Automatic)
```typescript
// app/[lang]/dashboard/page.tsx
export default function DashboardPage() {
  // Your page content
}

// app/[lang]/dashboard/loading.tsx - Automatically shown during navigation
import Loading from "@/components/loading";

export default function DashboardLoading() {
  return <Loading />;
}
```

### Example 2: Conditional Loading in Components
```typescript
"use client";

import Loading from "@/components/loading";
import NoData from "@/components/noData";

export default function MyComponent() {
  const { data, isLoading } = useStudentCourses();

  if (isLoading) {
    return <Loading />;
  }

  if (!data || data.length === 0) {
    return <NoData message="No courses available" />;
  }

  return (
    <div>
      {data.map(course => (
        <CourseCard key={course.id} course={course} />
      ))}
    </div>
  );
}
```

### Example 3: Loading with Custom Container
```typescript
import Loading from "@/components/loading";

export default function CustomLoader() {
  return (
    <div className="min-h-screen">
      <Loading className="h-[400px]" />
    </div>
  );
}
```

### Example 4: Multiple States
```typescript
"use client";

import Loading from "@/components/loading";
import NoData from "@/components/noData";

export default function DataTable() {
  const { data, isLoading, error } = useFetchData();

  // Loading state
  if (isLoading) {
    return <Loading />;
  }

  // Error state
  if (error) {
    return (
      <div className="text-center py-12">
        <p className="text-red-500">Error loading data</p>
      </div>
    );
  }

  // Empty state
  if (!data || data.length === 0) {
    return <NoData message="No items to display" />;
  }

  // Success state with data
  return (
    <table>
      {/* Your table content */}
    </table>
  );
}
```

### Example 5: With Zustand (Recommended!)
```typescript
"use client";

import { useStudentProfile } from '@/stores';
import Loading from "@/components/loading";
import NoData from "@/components/noData";

export default function ProfilePage() {
  const { profile, isLoading } = useStudentProfile();

  if (isLoading) {
    return <Loading />;
  }

  if (!profile) {
    return <NoData message="Profile not found" />;
  }

  return (
    <div>
      <h1>{profile.firstName} {profile.lastName}</h1>
      {/* Rest of your profile content */}
    </div>
  );
}
```

## 🎨 Customization

### Loading Component Props
```typescript
interface LoadingProps {
  className?: string; // Add custom Tailwind classes
}
```

**Example:**
```typescript
<Loading className="h-screen" /> // Full screen loading
<Loading className="h-[200px]" /> // Fixed height
<Loading className="my-12" /> // Custom spacing
```

### NoData Component Props
```typescript
interface NoDataProps {
  message?: string; // Optional custom message
}
```

**Example:**
```typescript
<NoData /> // Default: "No Data Found"
<NoData message="No courses available at the moment" />
<NoData message="Start by adding your first item" />
```

## 🌈 Design Specifications

### Loading (Newton's Cradle)
- **Size**: 78px
- **Speed**: 1.4
- **Color**: Sky Blue (rgb(14 165 233))
- **Animation**: Physics-based pendulum
- **Text**: "Loading..." with pulse animation

### NoData (Document + Magnifying Glass)
- **Illustration**: 200x200px SVG
- **Colors**: 
  - Light mode: Gray-400 (main), Gray-300 (details)
  - Dark mode: Gray-600 (main), Gray-700 (details)
- **Animation**: Scale and fade-in (0.3s duration)
- **Text**: 
  - Heading: "No Data Found" (text-xl, font-semibold)
  - Message: Optional custom text (text-sm)

## ✅ Best Practices

### DO:
✅ Use `<Loading />` for all loading states
✅ Use `<NoData />` for all empty states
✅ Provide meaningful messages for NoData
✅ Keep loading states consistent across the app
✅ Use Zustand hooks for automatic cache loading

### DON'T:
❌ Don't use old `<Spinner />` components
❌ Don't create custom loading animations
❌ Don't use plain text like "Loading..." without the component
❌ Don't skip empty states (always show NoData)
❌ Don't create inline loading/empty JSX

## 🔧 Technical Details

### ldrs Library
The Newton's Cradle loader uses the `ldrs` library (v1.1.9):
- **Documentation**: https://uiball.com/ldrs/
- **Auto-registered**: Component automatically registers on mount
- **TypeScript**: Fully typed via `types/ldrs.d.ts`

### Framer Motion
The NoData component uses Motion for animations:
- **Smooth entrance**: Scale + fade effect
- **Layout animations**: Maintains position during transitions
- **Exit animations**: Graceful removal

## 📦 What's Included

```
components/
├── loading.tsx          # Newton's Cradle loader
└── noData.tsx          # Document + magnifying glass empty state

types/
└── ldrs.d.ts           # TypeScript definitions for ldrs

app/
└── **/loading.tsx      # 32 loading files (all updated!)
```

## 🎯 Migration Complete

All 32 loading files have been updated from:
```typescript
// OLD ❌
import { Spinner } from "@heroui/react";
<Spinner />
```

To:
```typescript
// NEW ✅
import Loading from "@/components/loading";
<Loading />
```

## 🚦 Status

| Component | Status | Files Updated |
|-----------|--------|---------------|
| Loading (Newton's Cradle) | ✅ Complete | 32 files |
| NoData (Document) | ✅ Available | Ready to use |
| TypeScript Types | ✅ Defined | ldrs.d.ts |

## 🎉 Result

Your entire application now has:
- ✅ **Consistent loading animations** across all pages
- ✅ **Beautiful Newton's Cradle** physics-based loader
- ✅ **Professional empty states** with illustrations
- ✅ **Dark mode support** throughout
- ✅ **Type-safe** components
- ✅ **Smooth animations** with Framer Motion

## 📖 Quick Reference

```typescript
// Loading State
import Loading from "@/components/loading";
if (isLoading) return <Loading />;

// Empty State
import NoData from "@/components/noData";
if (isEmpty) return <NoData message="Your custom message" />;

// With Zustand
import { useStudentProfile } from '@/stores';
const { profile, isLoading } = useStudentProfile();
```

---

**All pages now have consistent, beautiful loading and empty states! 🎨✨**

