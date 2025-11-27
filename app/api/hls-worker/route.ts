import { NextRequest, NextResponse } from "next/server";
import { processPendingJobs } from "@/lib/hls-converter";

/**
 * Worker endpoint to process pending HLS conversion jobs
 * Can be called periodically via cron job or manually
 */
export async function POST(req: NextRequest) {
  try {
    // Optional: Add authentication/authorization here
    // const authHeader = req.headers.get("authorization");
    // if (authHeader !== `Bearer ${process.env.WORKER_SECRET}`) {
    //   return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    // }

    console.log("[HLS Worker] Processing pending jobs...");
    await processPendingJobs();
    
    return NextResponse.json({ 
      success: true, 
      message: "Worker processed pending jobs" 
    });
  } catch (error) {
    console.error("[HLS Worker] Error:", error);
    return NextResponse.json(
      { error: "Worker error", details: error instanceof Error ? error.message : "Unknown error" },
      { status: 500 }
    );
  }
}

// Also allow GET for easy testing
export async function GET(req: NextRequest) {
  return POST(req);
}

