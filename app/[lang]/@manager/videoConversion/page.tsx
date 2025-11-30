"use client";

import React, { useEffect } from "react";
import { useParams } from "next/navigation";
import {
  Button,
  Card,
  CardBody,
  CardHeader,
  Table,
  TableHeader,
  TableColumn,
  TableBody,
  TableRow,
  TableCell,
  Chip,
  Spinner,
} from "@heroui/react";
import { RefreshCw, Video, Play, CheckCircle, Clock } from "lucide-react";
import { toast } from "sonner";
import PageHeader from "@/components/layout/PageHeader";
import {
  useVideoConversionVideos,
  useVideoConversionStats,
  useVideoConversionLoading,
  useVideoConversionConverting,
  useVideoConversionSetVideos,
  useVideoConversionSetStats,
  useVideoConversionSetLoading,
  useVideoConversionAddConverting,
  useVideoConversionRemoveConverting,
  useVideoConversionUpdateVideoStatus,
} from "@/stores";

export default function VideoConversionPage() {
  const params = useParams<{ lang: string }>();
  const lang = params?.lang || "en";

  // Get state from store
  const videos = useVideoConversionVideos();
  const stats = useVideoConversionStats();
  const isLoading = useVideoConversionLoading();
  const converting = useVideoConversionConverting();

  // Get actions from store (individual hooks to prevent re-renders)
  const setVideos = useVideoConversionSetVideos();
  const setStats = useVideoConversionSetStats();
  const setLoading = useVideoConversionSetLoading();
  const addConverting = useVideoConversionAddConverting();
  const removeConverting = useVideoConversionRemoveConverting();
  const updateVideoStatus = useVideoConversionUpdateVideoStatus();
  
  const fetchVideos = React.useCallback(
    async (forceRefresh = false) => {
      // Skip if already loading or if we have fresh data and not forcing refresh
      if (!forceRefresh && isLoading) {
      return;
    }

    try {
      setLoading(true);
      const response = await fetch("/api/convert-video");
      const data = await response.json();

      if (data.success) {
        setVideos(data.files || []);
        setStats({
          total: data.total || 0,
          converted: data.converted || 0,
          pending: data.pending || 0,
        });
      } else {
        toast.error(data.error || "Failed to fetch videos");
      }
      } catch (error: unknown) {
        const errorMessage =
          error instanceof Error ? error.message : "Failed to fetch videos";
        toast.error(errorMessage);
    } finally {
      setLoading(false);
    }
    },
    [isLoading, setLoading, setVideos, setStats]
  );

  useEffect(() => {
    // Only fetch if we don't have videos yet
    if (videos.length === 0 && !isLoading) {
    fetchVideos();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []); // Only run on mount

  // Auto-refresh when there are active conversions
  useEffect(() => {
    // Check if there are any videos with active conversions
    const hasActiveConversions = videos.some(
      (video) =>
        video.jobId &&
        (video.status === "pending" ||
          video.status === "queued" ||
          video.status === "processing")
    );

    // Don't auto-refresh if no active conversions
    if (!hasActiveConversions) {
      return;
    }

    // Set up interval to check job statuses and refresh list
    const interval = setInterval(async () => {
      // Check status of all videos with jobIds
      const videosWithJobs = videos.filter(
        (v) =>
          v.jobId &&
          (v.status === "pending" ||
            v.status === "queued" ||
            v.status === "processing")
      );

      if (videosWithJobs.length === 0) {
        return; // No active conversions to check
      }

      let needsRefresh = false;

      // Poll each job status
      await Promise.all(
        videosWithJobs.map(async (video) => {
          if (!video.jobId) return;

          try {
            const response = await fetch(
              `/api/convert-video/status?jobId=${video.jobId}`
            );
            const data = await response.json();

            if (data.success && data.job) {
              const jobStatus = data.job.status;
              
              // Update video status based on job status
              if (jobStatus === "completed") {
                updateVideoStatus(video.filename, {
                  status: "completed",
                  isConverted: true,
                });
                needsRefresh = true; // Flag to refresh list
              } else if (jobStatus === "failed") {
                updateVideoStatus(video.filename, {
                  status: "failed",
                });
                needsRefresh = true;
              } else if (jobStatus === "processing") {
                updateVideoStatus(video.filename, {
                  status: "processing",
                });
              } else if (jobStatus === "pending") {
                updateVideoStatus(video.filename, {
                  status: "pending",
                });
              }
            }
          } catch (error) {
            console.error(`Error checking status for ${video.filename}:`, error);
          }
        })
      );

      // Refresh list once after checking all jobs if needed
      if (needsRefresh) {
        fetchVideos(true);
      }
    }, 5000); // Check every 5 seconds

    // Also do a periodic full refresh every 10 seconds to catch any changes
    const fullRefreshInterval = setInterval(() => {
      fetchVideos(true);
    }, 10000); // Full refresh every 10 seconds

    return () => {
      clearInterval(interval);
      clearInterval(fullRefreshInterval);
    };

    return () => clearInterval(interval);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [videos]); // Only depend on videos array

  const handleConvert = async (filename: string) => {
    try {
      addConverting(filename);

      const response = await fetch("/api/convert-video", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ filename }),
      });

      const data = await response.json();

      if (data.success) {
        toast.success(
          lang === "en"
            ? "Conversion queued successfully"
            : "መለወጥ በተሳካ ሁኔታ ተሰርዟል"
        );
        
        // Update video status in store
        updateVideoStatus(filename, {
          jobId: data.jobId,
          status: "queued",
        });

        // Refresh list after a short delay
        setTimeout(() => {
          fetchVideos(true);
        }, 2000);
      } else {
        toast.error(data.error || "Failed to queue conversion");
      }
    } catch (error: unknown) {
      const errorMessage =
        error instanceof Error ? error.message : "Failed to queue conversion";
      toast.error(errorMessage);
    } finally {
      removeConverting(filename);
    }
  };

  const handleConvertAll = async () => {
    try {
      addConverting("__ALL__");

      const response = await fetch("/api/convert-video", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ convertAll: true }),
      });

      const data = await response.json();

      if (data.success) {
        toast.success(
          lang === "en"
            ? `Queued ${data.jobs?.length || 0} file(s) for conversion`
            : `${data.jobs?.length || 0} ፋይሎች ለመለወጥ ተሰርዘዋል`
        );

        // Update all videos that were queued
        if (data.jobs && Array.isArray(data.jobs)) {
          data.jobs.forEach(
            (job: { filename: string; jobId?: string; status?: string }) => {
              if (job.jobId && !job.status?.includes("error")) {
              updateVideoStatus(job.filename, {
                jobId: job.jobId,
                status: "queued",
              });
            }
            }
          );
        }

        // Refresh list after a short delay
        setTimeout(() => {
          fetchVideos(true);
        }, 2000);
      } else {
        toast.error(data.error || "Failed to queue conversions");
      }
    } catch (error: unknown) {
      const errorMessage =
        error instanceof Error ? error.message : "Failed to queue conversions";
      toast.error(errorMessage);
    } finally {
      removeConverting("__ALL__");
    }
  };

  const pendingVideos = videos.filter((v) => !v.isConverted);

  return (
    <div className="h-full flex flex-col overflow-hidden">
      <PageHeader
        title={lang === "en" ? "Video Conversion" : "የቪዲዮ መለወጥ"}
        subtitle={
          lang === "en"
            ? "Convert MP4 videos to HLS format for better streaming performance"
            : "MP4 ቪዲዮዎችን ወደ HLS ቅርጸት ይለውጡ ለተሻለ የስትሪሚንግ አፈጻጸም"
        }
        actions={
          pendingVideos.length > 0 && (
            <Button
              color="primary"
              startContent={
                converting.includes("__ALL__") ? (
                  <Spinner size="sm" />
                ) : (
                  <Video className="size-4" />
                )
              }
              onPress={handleConvertAll}
              isDisabled={converting.includes("__ALL__")}
            >
              {lang === "en"
                ? `Convert All (${pendingVideos.length})`
                : `ሁሉንም መለወጥ (${pendingVideos.length})`}
            </Button>
          )
        }
      />

      <div className="flex-1 overflow-y-auto p-6">
        {/* Statistics Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
          <Card>
            <CardBody className="flex flex-row items-center justify-between">
              <div>
                <p className="text-sm text-gray-600 dark:text-gray-400">
                  {lang === "en" ? "Total Videos" : "አጠቃላይ ቪዲዮዎች"}
                </p>
                <p className="text-2xl font-bold">{stats.total}</p>
              </div>
              <Video className="size-8 text-gray-400" />
            </CardBody>
          </Card>

          <Card>
            <CardBody className="flex flex-row items-center justify-between">
              <div>
                <p className="text-sm text-gray-600 dark:text-gray-400">
                  {lang === "en" ? "Converted" : "ተለውጠዋል"}
                </p>
                <p className="text-2xl font-bold text-green-600">
                  {stats.converted}
                </p>
              </div>
              <CheckCircle className="size-8 text-green-400" />
            </CardBody>
          </Card>

          <Card>
            <CardBody className="flex flex-row items-center justify-between">
              <div>
                <p className="text-sm text-gray-600 dark:text-gray-400">
                  {lang === "en" ? "Pending" : "በመጠባበቅ ላይ"}
                </p>
                <p className="text-2xl font-bold text-orange-600">
                  {stats.pending}
                </p>
              </div>
              <Clock className="size-8 text-orange-400" />
            </CardBody>
          </Card>
        </div>

        {/* Action Bar */}
        <div className="flex justify-end mb-4">
          <Button
            variant="light"
            startContent={<RefreshCw className="size-4" />}
            onPress={() => fetchVideos(true)}
            isDisabled={isLoading}
          >
            {lang === "en" ? "Refresh" : "አድስ"}
          </Button>
        </div>

        {/* Videos Table */}
        {isLoading ? (
          <div className="flex justify-center items-center py-12">
            <Spinner size="lg" />
          </div>
        ) : videos.length === 0 ? (
          <Card>
            <CardBody className="text-center py-12">
              <Video className="size-12 mx-auto mb-4 text-gray-400" />
              <p className="text-gray-600 dark:text-gray-400">
                {lang === "en" ? "No MP4 videos found" : "MP4 ቪዲዮዎች አልተገኙም"}
              </p>
            </CardBody>
          </Card>
        ) : (
          <Card>
            <CardHeader>
              <h3 className="text-lg font-semibold">
                {lang === "en" ? "Video Files" : "የቪዲዮ ፋይሎች"}
              </h3>
            </CardHeader>
            <CardBody>
              <Table aria-label="Video conversion table">
                <TableHeader>
                  <TableColumn>
                    {lang === "en" ? "Filename" : "የፋይል ስም"}
                  </TableColumn>
                  <TableColumn>{lang === "en" ? "Status" : "ሁኔታ"}</TableColumn>
                  <TableColumn>
                    {lang === "en" ? "Actions" : "ድርጊቶች"}
                  </TableColumn>
                </TableHeader>
                <TableBody>
                  {videos.map((video) => (
                    <TableRow key={video.filename}>
                      <TableCell>
                        <div className="flex items-center gap-2">
                          <Video className="size-4 text-gray-400" />
                          <span className="font-mono text-sm">
                            {video.filename}
                          </span>
                        </div>
                      </TableCell>
                      <TableCell>
                        {video.isConverted || video.status === "completed" ? (
                          <Chip
                            color="success"
                            startContent={<CheckCircle className="size-3" />}
                            variant="flat"
                          >
                            {lang === "en" ? "Converted" : "ተለውጠዋል"}
                          </Chip>
                        ) : video.status === "processing" ? (
                          <Chip
                            color="primary"
                            startContent={<Spinner size="sm" />}
                            variant="flat"
                          >
                            {lang === "en" ? "Processing..." : "በሂደት..."}
                          </Chip>
                        ) : video.status === "queued" ? (
                          <Chip
                            color="default"
                            startContent={<Clock className="size-3" />}
                            variant="flat"
                          >
                            {lang === "en" ? "Queued" : "በረድፍ ላይ"}
                          </Chip>
                        ) : video.status === "failed" ? (
                          <Chip
                            color="danger"
                            variant="flat"
                          >
                            {lang === "en" ? "Failed" : "አልተሳካም"}
                          </Chip>
                        ) : (
                          <Chip
                            color="warning"
                            startContent={<Clock className="size-3" />}
                            variant="flat"
                          >
                            {lang === "en" ? "Pending" : "በመጠባበቅ ላይ"}
                          </Chip>
                        )}
                      </TableCell>
                      <TableCell>
                        {video.isConverted || video.status === "completed" ? (
                          <Chip
                            color="success"
                            variant="flat"
                            startContent={<CheckCircle className="size-3" />}
                          >
                            {lang === "en" ? "Ready" : "ዝግጁ"}
                          </Chip>
                        ) : video.status === "processing" ||
                          video.status === "queued" ? (
                          <Chip
                            color="default"
                            variant="flat"
                            startContent={<Spinner size="sm" />}
                          >
                            {lang === "en" ? "In Progress" : "በሂደት"}
                          </Chip>
                        ) : video.status === "failed" ? (
                          <Button
                            size="sm"
                            color="warning"
                            startContent={<Play className="size-3" />}
                            onPress={() => handleConvert(video.filename)}
                            isDisabled={converting.includes(video.filename)}
                          >
                            {lang === "en" ? "Retry" : "እንደገና ሞክር"}
                          </Button>
                        ) : (
                          <Button
                            size="sm"
                            color="primary"
                            startContent={
                              converting.includes(video.filename) ? (
                                <Spinner size="sm" />
                              ) : (
                                <Play className="size-3" />
                              )
                            }
                            onPress={() => handleConvert(video.filename)}
                            isDisabled={converting.includes(video.filename)}
                          >
                            {lang === "en" ? "Convert" : "መለወጥ"}
                          </Button>
                        )}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </CardBody>
          </Card>
        )}
      </div>
    </div>
  );
}
