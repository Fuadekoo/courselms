import { useEffect, useCallback } from 'react';
import { useCourseStore } from '@/stores/useCourseStore';
import { getCourses } from '@/actions/common/course';
import { TTableData } from '@/lib/definations';

/**
 * Hook to manage courses list with caching
 */
export function useCoursesList(tableData?: TTableData) {
  const {
    courses,
    currentPage,
    totalPages,
    totalData,
    isLoadingCourses,
    setCourses,
    setLoadingCourses,
    isCoursesFresh,
    clearCourses,
  } = useCourseStore();

  const fetchCourses = useCallback(async (data: TTableData, force = false) => {
    // Return cached data if fresh and not forcing refresh
    if (!force && isCoursesFresh() && courses.length > 0) {
      return { list: courses, totalData, totalPage: totalPages };
    }

    setLoadingCourses(true);
    try {
      const result = await getCourses(data);
      setCourses(result.list, result.totalData, result.totalPage);
      return result;
    } catch (error) {
      console.error('Error fetching courses:', error);
      setLoadingCourses(false);
      throw error;
    }
  }, [courses, totalData, totalPages, isCoursesFresh, setCourses, setLoadingCourses]);

  // Auto-fetch on mount if tableData provided and data is stale
  useEffect(() => {
    if (tableData && !isCoursesFresh() && !isLoadingCourses && courses.length === 0) {
      fetchCourses(tableData);
    }
  }, []);

  return {
    courses,
    currentPage,
    totalPages,
    totalData,
    isLoading: isLoadingCourses,
    fetchCourses,
    clearCourses,
  };
}

/**
 * Hook to manage individual course details with caching
 */
export function useCourseDetail(courseId: string) {
  const {
    getCourseDetail,
    setCourseDetail,
    setLoadingCourseDetail,
    isCourseDetailFresh,
    clearCourseDetail,
    isLoadingCourseDetail,
  } = useCourseStore();

  const courseDetail = getCourseDetail(courseId);
  const isLoading = isLoadingCourseDetail.get(courseId) || false;

  const fetchCourseDetail = useCallback(async (force = false) => {
    // Return cached data if fresh
    if (!force && isCourseDetailFresh(courseId) && courseDetail) {
      return courseDetail;
    }

    setLoadingCourseDetail(courseId, true);
    try {
      // You'll need to create a getCourseById action
      // For now, this is a placeholder
      // const data = await getCourseById(courseId);
      // setCourseDetail(courseId, data);
      // return data;
      
      // Placeholder - implement the actual action
      console.warn('getCourseById action needs to be implemented');
      setLoadingCourseDetail(courseId, false);
      return courseDetail;
    } catch (error) {
      console.error('Error fetching course detail:', error);
      setLoadingCourseDetail(courseId, false);
      throw error;
    }
  }, [courseId, courseDetail, isCourseDetailFresh, setCourseDetail, setLoadingCourseDetail]);

  return {
    courseDetail,
    isLoading,
    fetchCourseDetail,
    clearCourseDetail: () => clearCourseDetail(courseId),
  };
}

