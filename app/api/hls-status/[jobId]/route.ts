import { NextRequest, NextResponse } from "next/server";
import { getJobStatus } from "@/lib/hls-converter";

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ jobId: string }> }
) {
  try {
    const { jobId } = await params;

    if (!jobId) {
      return NextResponse.json(
        { error: "Job ID is required" },
        { status: 400 }
      );
    }

    const job = getJobStatus(jobId);

    if (!job) {
      return NextResponse.json({ error: "Job not found" }, { status: 404 });
    }

    return NextResponse.json({
      jobId: job.id,
      status: job.status,
      error: job.error,
      createdAt: job.createdAt,
      // If completed, return the HLS manifest path
      hlsPath:
        job.status === "completed"
          ? `${job.baseName}/${job.baseName}.m3u8`
          : null,
    });
  } catch (error) {
    console.error("Error getting HLS job status:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
