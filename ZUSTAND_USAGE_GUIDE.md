# Zustand State Management Guide

This guide explains how to use the new Zustand state management system for better performance and caching.

## Benefits

1. **Automatic Caching**: Data is cached for 5-10 minutes, reducing unnecessary server calls
2. **Persistent Storage**: Data persists across page refreshes using localStorage
3. **Loading States**: Built-in loading state management
4. **Force Refresh**: Option to force refresh when needed
5. **Performance**: Reduces re-renders and API calls significantly

## Store Structure

### 1. Student Store (`useStudentStore`)
Manages all student-related data:
- Profile information
- Dashboard statistics
- Course progress
- Enrolled courses
- Continue learning data

### 2. User Store (`useUserStore`)
Manages user authentication data:
- User name
- User ID
- User role

### 3. Course Store (`useCourseStore`)
Manages course data:
- Course listings
- Course details
- Pagination state
- Search queries

## Usage Examples

### Example 1: Using Student Profile (Updated Profile Page)

```typescript
"use client";

import { useStudentProfile } from '@/stores';
import { Button } from "@heroui/react";
import { Save } from "lucide-react";

export default function ProfilePage() {
  const { 
    profile, 
    isLoading, 
    fetchProfile, 
    updateProfile 
  } = useStudentProfile();

  const handleUpdate = async (data: any) => {
    const result = await updateProfile({} as any, data);
    if (result.status) {
      // Profile is automatically refreshed after update
      console.log('Profile updated!');
    }
  };

  // Force refresh if needed
  const handleRefresh = () => {
    fetchProfile(true); // true = force refresh, bypass cache
  };

  if (isLoading) {
    return <div>Loading...</div>;
  }

  return (
    <div>
      <h1>{profile?.firstName} {profile?.lastName}</h1>
      <p>Enrolled Courses: {profile?.enrolledCoursesCount}</p>
      <Button onClick={handleRefresh}>Refresh</Button>
    </div>
  );
}
```

### Example 2: Using Student Dashboard

```typescript
"use client";

import { useStudentDashboard, useStudentCourses } from '@/stores';

export default function DashboardPage() {
  const { dashboardStats, isLoading: loadingStats } = useStudentDashboard();
  const { graphData, continueLearning, isLoading: loadingCourses } = useStudentCourses();

  // Data is automatically fetched and cached
  // No need to manually call fetch on mount

  return (
    <div>
      {loadingStats ? (
        <p>Loading stats...</p>
      ) : (
        <>
          <h2>Total Courses: {dashboardStats?.totalCourses}</h2>
          <h2>In Progress: {dashboardStats?.coursesInProgress}</h2>
          <h2>Completed: {dashboardStats?.completedCourses}</h2>
        </>
      )}

      {loadingCourses ? (
        <p>Loading courses...</p>
      ) : (
        <div>
          {continueLearning?.map(course => (
            <div key={course.id}>
              <h3>{course.titleEn}</h3>
              <p>Progress: {course.progress}%</p>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
```

### Example 3: Using Multiple Stores Together

```typescript
"use client";

import { useStudentFullData } from '@/stores';

export default function CompleteDashboard() {
  const { 
    profile, 
    dashboardStats, 
    graphData, 
    isLoading,
    fetchAll 
  } = useStudentFullData();

  // Fetch everything at once if needed
  const handleRefreshAll = () => {
    fetchAll(true); // Refresh all data
  };

  if (isLoading) {
    return <div>Loading...</div>;
  }

  return (
    <div>
      <h1>Welcome {profile?.firstName}!</h1>
      <p>Total Courses: {dashboardStats?.totalCourses}</p>
      <button onClick={handleRefreshAll}>Refresh All</button>
    </div>
  );
}
```

### Example 4: Using User Store for Header

```typescript
"use client";

import { useUserData } from '@/stores';

export default function Header() {
  const { userName, isLoading } = useUserData();

  // Data is automatically fetched and cached
  
  return (
    <header>
      <p>Welcome, {isLoading ? 'Loading...' : userName}</p>
    </header>
  );
}
```

### Example 5: Using Course Store

```typescript
"use client";

import { useCoursesList } from '@/stores';
import { useState } from 'react';

export default function CoursesPage() {
  const [tableData] = useState({
    currentPage: 1,
    rowsPerPage: 10,
    search: '',
    sortDescriptor: { column: 'title', direction: 'ascending' as const }
  });

  const { 
    courses, 
    totalPages, 
    isLoading, 
    fetchCourses 
  } = useCoursesList(tableData);

  const handleSearch = (query: string) => {
    fetchCourses({ ...tableData, search: query }, true);
  };

  return (
    <div>
      <input 
        type="text" 
        onChange={(e) => handleSearch(e.target.value)} 
        placeholder="Search courses..."
      />
      
      {isLoading ? (
        <p>Loading...</p>
      ) : (
        <div>
          {courses.map(course => (
            <div key={course.id}>
              <h3>{course.titleEn}</h3>
              <p>${course.price}</p>
            </div>
          ))}
        </div>
      )}
      
      <p>Page 1 of {totalPages}</p>
    </div>
  );
}
```

## Cache Management

### Cache Duration
- Student data: 5 minutes
- User data: 10 minutes
- Course data: 5 minutes
- Course details: 10 minutes

### Force Refresh
Pass `true` to any fetch function to bypass cache:
```typescript
fetchProfile(true);  // Always fetches fresh data
fetchDashboard(true);
```

### Clear Cache
```typescript
const { clearProfile } = useStudentProfile();
clearProfile(); // Clear profile cache

const { clearAll } = useStudentStore();
clearAll(); // Clear all student data
```

### Automatic Cache Invalidation
Cache is automatically checked on component mount. If stale, fresh data is fetched.

## Best Practices

1. **Don't call fetch on every render**: The hooks handle this automatically
2. **Use force refresh sparingly**: Only when you know data has changed
3. **Clear cache on logout**: Call `clearAll()` on all stores
4. **Combine related data**: Use `useStudentFullData` when you need multiple pieces of data
5. **Let the cache work**: Trust the 5-10 minute cache duration

## Migration Guide

### Before (using useData hook):
```typescript
const { data: profile, loading, refresh } = useData({
  func: getProfile,
  args: [],
});
```

### After (using Zustand):
```typescript
const { profile, isLoading, fetchProfile } = useStudentProfile();
// refresh becomes: fetchProfile(true)
```

## Performance Impact

- **Reduced API Calls**: Up to 80% fewer calls with proper caching
- **Faster Page Loads**: Cached data loads instantly
- **Better UX**: No unnecessary loading states
- **Persistent Data**: Data survives page refreshes

## DevTools

Zustand DevTools are enabled in development mode. Open Redux DevTools to inspect state changes.

## Troubleshooting

### Data not updating?
- Use force refresh: `fetchProfile(true)`
- Clear cache: `clearProfile()`

### Still seeing loading states?
- Check cache duration settings
- Verify data is being saved to store

### Data persisting after logout?
- Call `clearAll()` on logout
- Clear localStorage if needed

