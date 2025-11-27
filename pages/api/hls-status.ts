/* eslint-disable @typescript-eslint/no-explicit-any */
import { NextApiRequest, NextApiResponse } from "next";
import { getJobStatus } from "@/lib/hls-converter";

/**
 * API endpoint to check HLS conversion job status
 * GET /api/hls-status?jobId=<jobId>
 */
export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  if (req.method !== "GET") {
    res.status(405).json({ error: "Method Not Allowed" });
    return;
  }

  try {
    const { jobId } = req.query;

    if (!jobId || typeof jobId !== "string") {
      res.status(400).json({ error: "jobId is required" });
      return;
    }

    const job = getJobStatus(jobId);

    if (!job) {
      res.status(404).json({ error: "Job not found" });
      return;
    }

    res.status(200).json(job);
  } catch (error: any) {
    console.error("Error getting job status:", error);
    res.status(500).json({ error: "Internal server error", details: error.message });
  }
}

