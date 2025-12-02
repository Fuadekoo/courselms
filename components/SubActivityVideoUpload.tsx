"use client";
import { useState, memo, useEffect } from "react";
import { Button } from "@heroui/react";
import { Upload, Video, Trash } from "lucide-react";
import {
  useSubActivityVideoStore,
  useSubActivityVideoUploadState,
} from "@/stores/subActivityVideoStore";

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
  const inputId = `video-upload-${Math.random().toString(36).substr(2, 9)}`;
  const { setUploading, clearUploadState } = useSubActivityVideoStore();
  const uploadState = useSubActivityVideoUploadState(activityIndex, subActivityIndex);
  const isUploading = uploadState?.isUploading ?? false;
  const uploadProgress = uploadState?.progress ?? 0;

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      // Don't clear if still uploading - let it continue in background
      if (!isUploading) {
        clearUploadState(activityIndex, subActivityIndex);
      }
    };
  }, [activityIndex, subActivityIndex, clearUploadState, isUploading]);

  const handleFileSelect = async (file: File) => {
    // Allow video files and HLS manifest files (.m3u8)
    const isVideo = file.type.startsWith("video/");
    const isHlsManifest = file.name.endsWith(".m3u8") || file.type === "application/vnd.apple.mpegurl" || file.type === "application/x-mpegURL";
    
    if (!isVideo && !isHlsManifest) {
      alert(lang === "en" ? "Please select a video file or HLS manifest (.m3u8)" : "እባክዎ የቪዲዮ ፋይል ወይም HLS manifest (.m3u8) ይምረጡ");
      return;
    }

    // Set uploading state immediately to show progress bar
    setUploading(activityIndex, subActivityIndex, true, 0);
    
    // Allow UI to update before starting upload
    await new Promise(resolve => setTimeout(resolve, 50));

    try {
      // Preserve original extension (important for HLS .m3u8 files)
      const ext = file.name.split(".").pop() || "mp4";
      const filename = `${Date.now()}-${Math.floor(Math.random() * 100000)}.${ext}`;
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
          const errorData = await response.json().catch(() => ({ error: "Unknown error" }));
          throw new Error(errorData.error || errorData.details || `Upload failed: ${response.status} ${response.statusText}`);
        }

        // Update progress in store (persists across unmounts)
        setUploading(activityIndex, subActivityIndex, true, Math.round(((i + 1) / total) * 100));
      }

      // Preserve the original extension (don't force .mp4)
      onVideoSelect(filename);
      // Clear upload state after successful completion
      setUploading(activityIndex, subActivityIndex, false);
    } catch (error: any) {
      const errorMessage = error?.message || (lang === "en" ? "Upload failed" : "መስቀል አልተሳካም");
      console.error("[VideoUpload] Upload error:", error);
      alert(errorMessage);
      // Clear upload state on error
      setUploading(activityIndex, subActivityIndex, false);
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
            isDisabled={isUploading}
          >
            <Trash className="size-4" />
          </Button>
        </div>
      ) : (
        <div className="border-2 border-dashed border-primary-300 rounded-lg p-4 text-center">
          <div className="flex flex-col items-center gap-2">
            <Video className="size-8 text-primary-500" />
            <p className="text-sm text-gray-600">
              {lang === "en" ? "Upload sub-activity video" : "የንዑስ እንቅስቃሴ ቪዲዮ ይስቀሉ"}
            </p>
            <input
              type="file"
              accept="video/*,.m3u8,application/vnd.apple.mpegurl,application/x-mpegURL"
              onChange={(e) => {
                const file = e.target.files?.[0];
                if (file) {
                  handleFileSelect(file);
                  e.target.value = '';
                }
              }}
              className="hidden"
              id={inputId}
              disabled={isUploading}
            />
            <Button
              type="button"
              size="sm"
              color="primary"
              variant="bordered"
              onPress={() => {
                const input = document.getElementById(inputId) as HTMLInputElement;
                input?.click();
              }}
              isDisabled={isUploading}
            >
              <Upload className="size-4" />
              {lang === "en" ? "Choose Video" : "ቪዲዮ ምረጥ"}
            </Button>
          </div>
        </div>
      )}
      
      {isUploading && (
        <div className="flex flex-col gap-2 p-4 bg-blue-50 dark:bg-blue-950/30 border-2 border-blue-300 dark:border-blue-700 rounded-lg animate-in fade-in slide-in-from-top-2 duration-200">
          <div className="flex justify-between items-center">
            <span className="text-sm font-semibold text-primary">
              {lang === "en" ? "Uploading video..." : "ቪዲዮ ስቀል በሂደት ላይ..."}
            </span>
            <span className="text-sm font-bold text-primary">
              {uploadProgress}%
            </span>
          </div>
          <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-3 overflow-hidden">
            <div
              className="h-full bg-gradient-to-r from-blue-500 to-blue-600 rounded-full transition-all duration-300 ease-out"
              style={{ width: `${uploadProgress}%` }}
            />
          </div>
          {uploadProgress === 0 && (
            <p className="text-xs text-gray-600 dark:text-gray-400 text-center">
              {lang === "en" ? "Preparing upload..." : "ስቀል በመዘጋጀት ላይ..."}
            </p>
          )}
        </div>
      )}
    </div>
  );
}

// Memoize to prevent unnecessary re-renders when parent form updates
export default memo(SubActivityVideoUpload);