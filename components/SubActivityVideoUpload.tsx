"use client";
import { useEffect, useMemo, useState } from "react";
import { Button } from "@heroui/react";
import { Upload, Video, Trash } from "lucide-react";
import { useCourseRegistrationStore } from "@/stores/courseRegistrationStore";

interface SubActivityVideoUploadProps {
  lang: string;
  onVideoSelect: (filename: string) => void;
  onVideoRemove: () => void;
  hasVideo: boolean;
  activityIndex: number;
  subActivityIndex: number;
}

function SubActivityVideoUpload({
  lang,
  onVideoSelect,
  onVideoRemove,
  hasVideo,
  activityIndex,
  subActivityIndex,
}: SubActivityVideoUploadProps) {
  const inputId = useMemo(
    () => `video-upload-${Math.random().toString(36).substr(2, 9)}`,
    []
  );
  const { setSubActivityUploading, clearSubActivityUploadState } =
    useCourseRegistrationStore();

  // Subscribe to the entire uploadStates object to ensure re-renders
  // This is critical for components inside accordions that might not re-render otherwise
  const key = useMemo(
    () => `${activityIndex}-${subActivityIndex}`,
    [activityIndex, subActivityIndex]
  );
  
  // Subscribe to the entire subActivityUploadStates object
  // This ensures re-renders when ANY upload state changes (important for accordions)
  // We need to subscribe to the entire object, not just a specific key, to ensure re-renders
  const allUploadStates = useCourseRegistrationStore(
    (state) => state.subActivityUploadStates
  );

  // Extract the specific upload state for this sub-activity
  // Accessing it this way ensures React detects changes when the parent object updates
  const uploadState = allUploadStates?.[key];

  // Extract values - these will update when uploadState changes
  const isUploading = uploadState?.isUploading ?? false;
  const uploadProgress = uploadState?.progress ?? 0;

  // Use local state to force re-renders when Zustand state changes
  // This ensures the component updates even inside accordions
  const [localUploadState, setLocalUploadState] = useState({
    isUploading: false,
    progress: 0,
  });

  // Sync local state with Zustand state to force re-renders
  useEffect(() => {
    setLocalUploadState({
      isUploading: isUploading,
      progress: uploadProgress,
    });
  }, [isUploading, uploadProgress]);

  // Use local state for display to ensure immediate updates
  const displayIsUploading = localUploadState.isUploading;
  const displayProgress = localUploadState.progress;

  // Debug: Log when upload state changes (remove in production)
  useEffect(() => {
    if (displayIsUploading) {
      console.log(
        `[SubActivityVideoUpload] Upload state changed:`,
        activityIndex,
        subActivityIndex,
        `Progress: ${displayProgress}%`
      );
    }
  }, [displayIsUploading, displayProgress, activityIndex, subActivityIndex]);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      // Don't clear if still uploading - let it continue in background
      if (!localUploadState.isUploading) {
        clearSubActivityUploadState(activityIndex, subActivityIndex);
      }
    };
  }, [
    activityIndex,
    subActivityIndex,
    clearSubActivityUploadState,
    isUploading,
  ]);

  const handleFileSelect = async (file: File) => {
    // Allow video files and HLS manifest files (.m3u8)
    const isVideo = file.type.startsWith("video/");
    const isHlsManifest =
      file.name.endsWith(".m3u8") ||
      file.type === "application/vnd.apple.mpegurl" ||
      file.type === "application/x-mpegURL";

    if (!isVideo && !isHlsManifest) {
      alert(
        lang === "en"
          ? "Please select a video file or HLS manifest (.m3u8)"
          : "እባክዎ የቪዲዮ ፋይል ወይም HLS manifest (.m3u8) ይምረጡ"
      );
      return;
    }

    // Set uploading state immediately to show progress bar
    setSubActivityUploading(activityIndex, subActivityIndex, true, 0);

    // Allow UI to update before starting upload
    await new Promise((resolve) => setTimeout(resolve, 50));

    try {
      // Preserve original extension (important for HLS .m3u8 files)
      const ext = file.name.split(".").pop() || "mp4";
      const filename = `${Date.now()}-${Math.floor(
        Math.random() * 100000
      )}.${ext}`;
      const chunkSize = 512 * 1024;
      const total = Math.ceil(file.size / chunkSize);

      for (let i = 0; i < total; i++) {
        const start = i * chunkSize;
        const end = Math.min(file.size, start + chunkSize);
        const chunk = file.slice(start, end);

        const formData = new FormData();
        formData.append("chunk", chunk);
        formData.append("filename", filename);
        formData.append("chunkIndex", i.toString());
        formData.append("totalChunks", total.toString());

        const response = await fetch("/api/upload-video", {
          method: "POST",
          body: formData,
        });

        if (!response.ok) {
          const errorData = await response.json().catch(() => ({
            error: "Unknown error",
          }));
          throw new Error(
            errorData.error ||
              errorData.details ||
              `Upload failed: ${response.status} ${response.statusText}`
          );
        }

        // Update progress in store (persists across unmounts)
        setSubActivityUploading(
          activityIndex,
          subActivityIndex,
          true,
          Math.round(((i + 1) / total) * 100)
        );
      }

      // Preserve the original extension (don't force .mp4)
      onVideoSelect(filename);
      // Clear upload state after successful completion
      setSubActivityUploading(activityIndex, subActivityIndex, false);
    } catch (error: unknown) {
      const errorMessage =
        (error instanceof Error ? error.message : String(error)) ||
        (lang === "en" ? "Upload failed" : "መስቀል አልተሳካም");
      console.error("[VideoUpload] Upload error:", error);
      alert(errorMessage);
      // Clear upload state on error
      setSubActivityUploading(activityIndex, subActivityIndex, false);
    }
  };

  return (
    <div className="space-y-2">
      {hasVideo ? (
        <div className="flex items-center justify-between bg-success/10 p-2 rounded">
          <span className="text-sm text-success">
            {lang === "en" ? "Video uploaded" : "ቪዲዮ ተስቅሏል"}
          </span>
          <Button
            type="button"
            size="sm"
            variant="light"
            color="danger"
            onPress={() => {
              const confirmMessage =
                lang === "en"
                  ? "Are you sure you want to delete this video?"
                  : "ይህን ቪዲዮ መሰረዝ እርግጠኛ ነዎት?";
              if (confirm(confirmMessage)) {
                onVideoRemove();
              }
            }}
            isDisabled={displayIsUploading}
          >
            <Trash className="size-4" />
          </Button>
        </div>
      ) : (
        <div className="border-2 border-dashed border-primary-300 rounded-lg p-4 text-center">
          <div className="flex flex-col items-center gap-2">
            <Video className="size-8 text-primary-500" />
            <p className="text-sm text-gray-600">
              {lang === "en"
                ? "Upload sub-activity video"
                : "የንዑስ እንቅስቃሴ ቪዲዮ ይስቀሉ"}
            </p>
            <input
              type="file"
              accept="video/*,.m3u8,application/vnd.apple.mpegurl,application/x-mpegURL"
              onChange={(e) => {
                const file = e.target.files?.[0];
                if (file) {
                  handleFileSelect(file);
                  e.target.value = "";
                }
              }}
              className="hidden"
              id={inputId}
              disabled={displayIsUploading}
            />
            <Button
              type="button"
              size="sm"
              color="primary"
              variant="bordered"
              onPress={() => {
                const input = document.getElementById(
                  inputId
                ) as HTMLInputElement;
                input?.click();
              }}
              isDisabled={displayIsUploading}
            >
              <Upload className="size-4" />
              {lang === "en" ? "Choose Video" : "ቪዲዮ ምረጥ"}
            </Button>
          </div>
        </div>
      )}

      {displayIsUploading && (
        <div className="flex flex-col gap-2 p-4 bg-blue-50 dark:bg-blue-950/30 border-2 border-blue-300 dark:border-blue-700 rounded-lg animate-in fade-in slide-in-from-top-2 duration-200">
          <div className="flex justify-between items-center">
            <span className="text-sm font-semibold text-primary">
              {lang === "en" ? "Uploading video..." : "ቪዲዮ ስቀል በሂደት ላይ..."}
            </span>
            <span className="text-sm font-bold text-primary">
              {displayProgress}%
            </span>
          </div>
          <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-3 overflow-hidden">
            <div
              className="h-full bg-gradient-to-r from-blue-500 to-blue-600 rounded-full transition-all duration-300 ease-out"
              style={{ width: `${displayProgress}%` }}
            />
          </div>
          {displayProgress === 0 && (
            <p className="text-xs text-gray-600 dark:text-gray-400 text-center">
              {lang === "en" ? "Preparing upload..." : "ስቀል በመዘጋጀት ላይ..."}
            </p>
          )}
        </div>
      )}
    </div>
  );
}

// Export component directly - Zustand hooks will handle re-render optimization
export default SubActivityVideoUpload;
