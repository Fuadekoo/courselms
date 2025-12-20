"use server";
import prisma from "@/lib/db";
import { auth } from "@/lib/auth";
import { StateType } from "@/lib/definations";

export async function getProfile() {
  // #region agent log
  fetch('http://127.0.0.1:7243/ingest/6cece133-d78f-4773-a622-c538e78e2a10',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'actions/student/profile.ts:6',message:'getProfile entry',data:{},timestamp:Date.now(),sessionId:'debug-session',runId:'run1',hypothesisId:'H1'})}).catch(()=>{});
  // #endregion
  try {
    // #region agent log
    fetch('http://127.0.0.1:7243/ingest/6cece133-d78f-4773-a622-c538e78e2a10',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'actions/student/profile.ts:8',message:'Before auth() call',data:{},timestamp:Date.now(),sessionId:'debug-session',runId:'run1',hypothesisId:'H1'})}).catch(()=>{});
    // #endregion
    const session = await auth();
    // #region agent log
    fetch('http://127.0.0.1:7243/ingest/6cece133-d78f-4773-a622-c538e78e2a10',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'actions/student/profile.ts:10',message:'After auth() call',data:{hasSession:!!session,hasUserId:!!session?.user?.id,userId:session?.user?.id||null},timestamp:Date.now(),sessionId:'debug-session',runId:'run1',hypothesisId:'H1'})}).catch(()=>{});
    // #endregion
    if (!session?.user?.id) {
      // #region agent log
      fetch('http://127.0.0.1:7243/ingest/6cece133-d78f-4773-a622-c538e78e2a10',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'actions/student/profile.ts:12',message:'No session/userId, returning null',data:{},timestamp:Date.now(),sessionId:'debug-session',runId:'run1',hypothesisId:'H1'})}).catch(()=>{});
      // #endregion
      // Return null instead of throwing - let the calling code handle unauthorized users
      return null;
    }
    const userId = session.user.id;
    
    // Get user profile
    // #region agent log
    fetch('http://127.0.0.1:7243/ingest/6cece133-d78f-4773-a622-c538e78e2a10',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'actions/student/profile.ts:16',message:'Before prisma.user.findUnique',data:{userId},timestamp:Date.now(),sessionId:'debug-session',runId:'run1',hypothesisId:'H4'})}).catch(()=>{});
    // #endregion
    const profile = await prisma.user.findUnique({
      where: { id: userId },
      select: {
        id: true,
        username: true,
        firstName: true,
        fatherName: true,
        lastName: true,
        gender: true,
        phoneNumber: true,
        country: true,
        region: true,
        city: true,
        age: true,
        role: true,
      },
    });
    // #region agent log
    fetch('http://127.0.0.1:7243/ingest/6cece133-d78f-4773-a622-c538e78e2a10',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'actions/student/profile.ts:33',message:'After prisma.user.findUnique',data:{hasProfile:!!profile,profileKeys:profile?Object.keys(profile):[],hasUndefined:profile?Object.values(profile).some(v=>v===undefined):false},timestamp:Date.now(),sessionId:'debug-session',runId:'run1',hypothesisId:'H3'})}).catch(()=>{});
    // #endregion

    if (!profile) {
      // #region agent log
      fetch('http://127.0.0.1:7243/ingest/6cece133-d78f-4773-a622-c538e78e2a10',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'actions/student/profile.ts:35',message:'Profile not found, returning null',data:{},timestamp:Date.now(),sessionId:'debug-session',runId:'run1',hypothesisId:'H4'})}).catch(()=>{});
      // #endregion
      // Return null if profile not found instead of throwing
      return null;
    }

    // Get enrolled courses count
    const paidOrdersForCount = await prisma.order.findMany({
      where: {
        userId: userId,
        status: "paid",
      },
      select: { courseId: true },
      distinct: ["courseId"],
    });
    const enrolledCoursesCount = paidOrdersForCount.length;

    // Get completed courses (courses where all activities are done)
    const paidOrders = await prisma.order.findMany({
      where: { userId: userId, status: "paid" },
      select: { courseId: true },
      distinct: ["courseId"],
    });

    const courseIds = paidOrders.map((order) => order.courseId);
    // #region agent log
    fetch('http://127.0.0.1:7243/ingest/6cece133-d78f-4773-a622-c538e78e2a10',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'actions/student/profile.ts:57',message:'Before completed courses loop',data:{courseIdsCount:courseIds.length,hasNullIds:courseIds.some(id=>!id)},timestamp:Date.now(),sessionId:'debug-session',runId:'run1',hypothesisId:'H5'})}).catch(()=>{});
    // #endregion
    
    let completedCoursesCount = 0;
    if (courseIds.length > 0) {
      // For each course, check if all activities are completed
      for (const courseId of courseIds) {
        // #region agent log
        fetch('http://127.0.0.1:7243/ingest/6cece133-d78f-4773-a622-c538e78e2a10',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'actions/student/profile.ts:62',message:'Before prisma.activity.findMany',data:{courseId},timestamp:Date.now(),sessionId:'debug-session',runId:'run1',hypothesisId:'H4'})}).catch(()=>{});
        // #endregion
        const activities = await prisma.activity.findMany({
          where: { courseId },
          select: {
            id: true,
            subActivity: { select: { id: true } },
          },
        });
        // #region agent log
        const subActivityIds = activities.flatMap((a) => a.subActivity.map((s) => s.id));
        fetch('http://127.0.0.1:7243/ingest/6cece133-d78f-4773-a622-c538e78e2a10',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'actions/student/profile.ts:71',message:'After activities query, before flatMap',data:{activitiesCount:activities.length,subActivityIdsCount:subActivityIds.length,hasNullIds:subActivityIds.some(id=>!id),hasUndefinedIds:subActivityIds.some(id=>id===undefined)},timestamp:Date.now(),sessionId:'debug-session',runId:'run1',hypothesisId:'H5'})}).catch(()=>{});
        // #endregion

        const totalSubActivities = activities.reduce(
          (sum, activity) => sum + activity.subActivity.length,
          0
        );

        if (totalSubActivities > 0) {
          // Filter out null/undefined IDs to prevent Prisma errors
          const validSubActivityIds = subActivityIds.filter((id): id is string => !!id);
          // #region agent log
          fetch('http://127.0.0.1:7243/ingest/6cece133-d78f-4773-a622-c538e78e2a10',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'actions/student/profile.ts:77',message:'Before prisma.studentProgress.count',data:{totalSubActivities,subActivityIdsCount:validSubActivityIds.length,originalCount:subActivityIds.length},timestamp:Date.now(),sessionId:'debug-session',runId:'run1',hypothesisId:'H5'})}).catch(()=>{});
          // #endregion
          const completedSubActivities = validSubActivityIds.length > 0 ? await prisma.studentProgress.count({
            where: {
              userId,
              isCompleted: true,
              subActivityId: {
                in: validSubActivityIds,
              },
            },
          }) : 0;
          // #region agent log
          fetch('http://127.0.0.1:7243/ingest/6cece133-d78f-4773-a622-c538e78e2a10',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'actions/student/profile.ts:87',message:'After studentProgress.count',data:{completedSubActivities,totalSubActivities},timestamp:Date.now(),sessionId:'debug-session',runId:'run1',hypothesisId:'H2'})}).catch(()=>{});
          // #endregion

          if (completedSubActivities >= totalSubActivities) {
            completedCoursesCount++;
          }
        }
      }
    }

    // Get total questions answered
    // #region agent log
    fetch('http://127.0.0.1:7243/ingest/6cece133-d78f-4773-a622-c538e78e2a10',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'actions/student/profile.ts:95',message:'Before prisma.studentQuiz.count',data:{userId},timestamp:Date.now(),sessionId:'debug-session',runId:'run1',hypothesisId:'H4'})}).catch(()=>{});
    // #endregion
    const questionsAnswered = await prisma.studentQuiz.count({
      where: { userId },
    });
    // #region agent log
    fetch('http://127.0.0.1:7243/ingest/6cece133-d78f-4773-a622-c538e78e2a10',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'actions/student/profile.ts:99',message:'Before return, checking return value',data:{enrolledCoursesCount,completedCoursesCount,questionsAnswered,profileKeys:Object.keys(profile),hasUndefinedInProfile:Object.values(profile).some(v=>v===undefined)},timestamp:Date.now(),sessionId:'debug-session',runId:'run1',hypothesisId:'H3'})}).catch(()=>{});
    // #endregion

    // Ensure all values are serializable - convert undefined to null, ensure numbers are numbers
    const returnValue = {
      id: profile.id || null,
      username: profile.username || null,
      firstName: profile.firstName || null,
      fatherName: profile.fatherName || null,
      lastName: profile.lastName || null,
      gender: profile.gender || null,
      phoneNumber: profile.phoneNumber || null,
      country: profile.country || null,
      region: profile.region || null,
      city: profile.city || null,
      age: profile.age || null,
      role: profile.role || null,
      enrolledCoursesCount: Number(enrolledCoursesCount) || 0,
      completedCoursesCount: Number(completedCoursesCount) || 0,
      questionsAnswered: Number(questionsAnswered) || 0,
    };
    // #region agent log
    fetch('http://127.0.0.1:7243/ingest/6cece133-d78f-4773-a622-c538e78e2a10',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'actions/student/profile.ts:105',message:'Before return statement',data:{returnKeys:Object.keys(returnValue),hasUndefined:Object.values(returnValue).some(v=>v===undefined),hasDate:Object.values(returnValue).some(v=>v instanceof Date)},timestamp:Date.now(),sessionId:'debug-session',runId:'run1',hypothesisId:'H2'})}).catch(()=>{});
    // #endregion
    
    // Test serialization before returning
    try {
      JSON.stringify(returnValue);
    } catch (serializeError) {
      // #region agent log
      fetch('http://127.0.0.1:7243/ingest/6cece133-d78f-4773-a622-c538e78e2a10',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'actions/student/profile.ts:122',message:'Serialization test failed',data:{error:String(serializeError)},timestamp:Date.now(),sessionId:'debug-session',runId:'run1',hypothesisId:'H2'})}).catch(()=>{});
      // #endregion
      console.error("Return value not serializable:", serializeError);
      return null;
    }
    
    return returnValue;
  } catch (error) {
    // #region agent log
    fetch('http://127.0.0.1:7243/ingest/6cece133-d78f-4773-a622-c538e78e2a10',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'actions/student/profile.ts:108',message:'Error caught in getProfile',data:{errorMessage:error instanceof Error?error.message:String(error),errorName:error instanceof Error?error.name:'unknown'},timestamp:Date.now(),sessionId:'debug-session',runId:'run1',hypothesisId:'H4'})}).catch(()=>{});
    // #endregion
    console.error("Error in getProfile:", error);
    // Return null on error instead of throwing - this prevents "unexpected response" errors
    return null;
  }
}

export async function updateProfile(
  prevState: StateType,
  data:
    | {
        firstName: string;
        fatherName: string;
        lastName: string;
        country: string;
        region: string;
        city: string;
      }
    | undefined
): Promise<StateType> {
  const session = await auth();
  if (!session?.user?.id) {
    return { status: false, cause: "Unauthorized", message: "You must be logged in" };
  }

  if (!data) {
    return { status: false, cause: "no_data", message: "No data provided" };
  }

  try {
    await prisma.user.update({
      where: { id: session.user.id },
      data: {
        firstName: data.firstName || "",
        fatherName: data.fatherName || "",
        lastName: data.lastName || "",
        country: data.country || "",
        region: data.region || "",
        city: data.city || "",
      },
    });

    return { status: true };
  } catch (error) {
    console.error("Error updating profile:", error);
    return { status: false, cause: "update_error", message: "Failed to update profile" };
  }
}
