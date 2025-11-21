import { useEffect, useCallback } from 'react';
import { useStudentStore } from '@/stores/useStudentStore';
import { getProfile, updateProfile } from '@/actions/student/profile';
import { 
  getDashboardData, 
  getGraphData, 
  getContinueLearning,
  getAllEnrolledCourses 
} from '@/actions/student/dashboard';
import { StateType } from '@/lib/definations';

/**
 * Hook to manage student profile data with caching
 */
export function useStudentProfile() {
  const {
    profile,
    isLoadingProfile,
    setProfile,
    setLoadingProfile,
    isProfileFresh,
    clearProfile,
  } = useStudentStore();

  const fetchProfile = useCallback(async (force = false) => {
    // Return cached data if fresh and not forcing refresh
    if (!force && isProfileFresh() && profile) {
      return profile;
    }

    setLoadingProfile(true);
    try {
      const data = await getProfile();
      setProfile(data);
      return data;
    } catch (error) {
      console.error('Error fetching profile:', error);
      setLoadingProfile(false);
      throw error;
    }
  }, [profile, isProfileFresh, setProfile, setLoadingProfile]);

  // Auto-fetch on mount if data is stale
  useEffect(() => {
    if (!isProfileFresh() && !isLoadingProfile) {
      fetchProfile();
    }
  }, []); // Only run on mount

  return {
    profile,
    isLoading: isLoadingProfile,
    fetchProfile,
    clearProfile,
    updateProfile: async (prevState: StateType, data: any) => {
      const result = await updateProfile(prevState, data);
      if (result && result.status) {
        // Refresh profile after successful update
        await fetchProfile(true);
      }
      return result;
    },
  };
}

/**
 * Hook to manage student dashboard data with caching
 */
export function useStudentDashboard() {
  const {
    dashboardStats,
    isLoadingDashboard,
    setDashboardStats,
    setLoadingDashboard,
    isDashboardFresh,
    clearDashboard,
  } = useStudentStore();

  const fetchDashboard = useCallback(async (force = false) => {
    if (!force && isDashboardFresh() && dashboardStats) {
      return dashboardStats;
    }

    setLoadingDashboard(true);
    try {
      const data = await getDashboardData();
      if (data) {
        setDashboardStats(data);
      }
      return data;
    } catch (error) {
      console.error('Error fetching dashboard:', error);
      setLoadingDashboard(false);
      throw error;
    }
  }, [dashboardStats, isDashboardFresh, setDashboardStats, setLoadingDashboard]);

  useEffect(() => {
    if (!isDashboardFresh() && !isLoadingDashboard) {
      fetchDashboard();
    }
  }, []);

  return {
    dashboardStats,
    isLoading: isLoadingDashboard,
    fetchDashboard,
    clearDashboard,
  };
}

/**
 * Hook to manage student course progress with caching
 */
export function useStudentCourses() {
  const {
    graphData,
    continueLearning,
    enrolledCourses,
    isLoadingCourses,
    setGraphData,
    setContinueLearning,
    setEnrolledCourses,
    setLoadingCourses,
    isCoursesFresh,
    clearCourses,
  } = useStudentStore();

  const fetchGraphData = useCallback(async (force = false) => {
    if (!force && isCoursesFresh() && graphData) {
      return graphData;
    }

    setLoadingCourses(true);
    try {
      const data = await getGraphData();
      if (data) {
        setGraphData(data);
      }
      return data;
    } catch (error) {
      console.error('Error fetching graph data:', error);
      setLoadingCourses(false);
      throw error;
    }
  }, [graphData, isCoursesFresh, setGraphData, setLoadingCourses]);

  const fetchContinueLearning = useCallback(async (force = false) => {
    if (!force && isCoursesFresh() && continueLearning) {
      return continueLearning;
    }

    setLoadingCourses(true);
    try {
      const data = await getContinueLearning();
      if (data) {
        setContinueLearning(data);
      }
      return data;
    } catch (error) {
      console.error('Error fetching continue learning:', error);
      setLoadingCourses(false);
      throw error;
    }
  }, [continueLearning, isCoursesFresh, setContinueLearning, setLoadingCourses]);

  const fetchEnrolledCourses = useCallback(async (force = false) => {
    if (!force && isCoursesFresh() && enrolledCourses) {
      return enrolledCourses;
    }

    setLoadingCourses(true);
    try {
      const data = await getAllEnrolledCourses();
      if (data) {
        setEnrolledCourses(data);
      }
      return data;
    } catch (error) {
      console.error('Error fetching enrolled courses:', error);
      setLoadingCourses(false);
      throw error;
    }
  }, [enrolledCourses, isCoursesFresh, setEnrolledCourses, setLoadingCourses]);

  useEffect(() => {
    if (!isCoursesFresh() && !isLoadingCourses) {
      fetchGraphData();
    }
  }, []);

  return {
    graphData,
    continueLearning,
    enrolledCourses,
    isLoading: isLoadingCourses,
    fetchGraphData,
    fetchContinueLearning,
    fetchEnrolledCourses,
    clearCourses,
  };
}

/**
 * Hook to get all student data at once (for pages that need everything)
 */
export function useStudentFullData() {
  const profile = useStudentProfile();
  const dashboard = useStudentDashboard();
  const courses = useStudentCourses();

  const fetchAll = useCallback(async (force = false) => {
    await Promise.all([
      profile.fetchProfile(force),
      dashboard.fetchDashboard(force),
      courses.fetchGraphData(force),
    ]);
  }, [profile, dashboard, courses]);

  const isLoading = profile.isLoading || dashboard.isLoading || courses.isLoading;

  return {
    profile: profile.profile,
    dashboardStats: dashboard.dashboardStats,
    graphData: courses.graphData,
    isLoading,
    fetchAll,
  };
}

