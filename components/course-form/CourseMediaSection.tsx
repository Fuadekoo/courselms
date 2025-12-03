"use client";
import { cn } from "@/lib/utils";
import { memo, useMemo } from "react";
import Player from "../stream/Player";
import ThumbnailUpload from "../ThumbnailUpload";
import VideoUploadButton from "../VideoUploadButton";
import { useCourseRegistrationStore } from "@/stores/courseRegistrationStore";

interface CourseMediaSectionProps {
  lang: string;
  thumbnail: string;
  video: string;
  selectedVideoFile: File | null;
  isUploading: boolean;
  isThumbnailUploading: boolean;
  onThumbnailSelect: (file: File) => void;
  onThumbnailRemove: () => void;
  onVideoSelect: (file: File) => void;
  onVideoRemove: () => void;
  hasVideoError: boolean;
}

function CourseMediaSection({
  lang,
  thumbnail,
  video,
  selectedVideoFile,
  isUploading,
  isThumbnailUploading,
  onThumbnailSelect,
  onThumbnailRemove,
  onVideoSelect,
  onVideoRemove,
  hasVideoError,
}: CourseMediaSectionProps) {
  // Get video from Zustand store as source of truth
  const { videoPreviewUrl, formData } = useCourseRegistrationStore();
  
  // Priority: selectedVideoFile (uploaded) > videoPreviewUrl (Zustand) > video (prop) > formData.video (Zustand)
  // Memoize videoSrc to prevent unnecessary recalculations
  const videoSrc = useMemo(() => {
    if (selectedVideoFile) {
      return URL.createObjectURL(selectedVideoFile);
    }
    // Filter out empty strings - only use truthy, non-empty values
    const getValidVideo = (val: string | undefined | null) => {
      if (!val || typeof val !== 'string') return null;
      const trimmed = val.trim();
      return trimmed.length > 0 ? trimmed : null;
    };
    const videoToUse = getValidVideo(videoPreviewUrl) || getValidVideo(video) || getValidVideo(formData.video);
    if (videoToUse) {
      return videoToUse.startsWith('/api/videos/') 
        ? videoToUse.replace('/api/videos/', '') 
        : videoToUse;
    }
    return null;
  }, [selectedVideoFile, videoPreviewUrl, video, formData.video]);
  
  // Get existing video for display (from Zustand as source of truth)
  const existingVideo = useMemo(() => {
    if (selectedVideoFile) return undefined; // Don't show existing if new file selected
    // Filter out empty strings - only return truthy, non-empty values
    const getValidVideo = (val: string | undefined | null) => {
      if (!val || typeof val !== 'string') return null;
      const trimmed = val.trim();
      return trimmed.length > 0 ? trimmed : null;
    };
    return getValidVideo(videoPreviewUrl) || getValidVideo(formData.video) || getValidVideo(video) || undefined;
  }, [selectedVideoFile, videoPreviewUrl, formData.video, video]);

  return (
    <div className="grid gap-2">
      <div className="grid gap-2 md:gap-5 grid-cols-1 md:grid-cols-2">
        <ThumbnailUpload
          currentThumbnail={thumbnail || "/darulkubra.png"}
          onImageSelect={onThumbnailSelect}
          onImageRemove={onThumbnailRemove}
          lang={lang}
          disabled={isThumbnailUploading}
        />
        {videoSrc ? (
          <div className="w-full aspect-video rounded-xl overflow-hidden">
            <Player 
              src={videoSrc}
              type={selectedVideoFile ? "url" : "local"}
              title="Melaverse video player" 
              poster={thumbnail} // Show thumbnail as poster
              key={selectedVideoFile ? 'uploaded' : 'database'}
            />
          </div>
        ) : (
          <div
            className={cn(
              "w-full aspect-video rounded-xl",
              hasVideoError
                ? "border border-danger-300 bg-danger-100"
                : "bg-primary-100"
            )}
          />
        )}
      </div>
      <VideoUploadButton
        lang={lang}
        selectedVideo={selectedVideoFile}
        existingVideo={existingVideo}
        onVideoSelect={onVideoSelect}
        onVideoRemove={onVideoRemove}
        disabled={isUploading}
      />
    </div>
  );
}

// Memoize the component to prevent re-renders when parent re-renders
export default memo(CourseMediaSection);
