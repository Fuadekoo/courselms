"use client";
import { cn } from "@/lib/utils";
import { memo, useMemo } from "react";
import Player from "../stream/Player";
import ThumbnailUpload from "../ThumbnailUpload";
import VideoUploadButton from "../VideoUploadButton";

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
  // Priority: selectedVideoFile (uploaded) > video (database)
  // Memoize videoSrc to prevent unnecessary recalculations
  const videoSrc = useMemo(() => {
    if (selectedVideoFile) {
      return URL.createObjectURL(selectedVideoFile);
    }
    if (video) {
      return video.startsWith('/api/videos/') 
        ? video.replace('/api/videos/', '') 
        : video;
    }
    return null;
  }, [selectedVideoFile, video]);

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
          <Player 
            src={videoSrc}
            type={selectedVideoFile ? "url" : "local"}
            title="Melaverse video player" 
            poster={thumbnail} // Show thumbnail as poster
            key={selectedVideoFile ? 'uploaded' : 'database'}
          />
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
        onVideoSelect={onVideoSelect}
        onVideoRemove={onVideoRemove}
        disabled={isUploading}
      />
    </div>
  );
}

// Memoize the component to prevent re-renders when parent re-renders
export default memo(CourseMediaSection);
