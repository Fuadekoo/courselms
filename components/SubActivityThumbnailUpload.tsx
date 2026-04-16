"use client";
import { memo, useRef, useEffect } from "react";
import { Button } from "@heroui/react";
import { Upload, Image, Trash } from "lucide-react";
import {
  useSubActivityThumbnailStore,
  useSubActivityThumbnailUploadState,
} from "@/stores/subActivityThumbnailStore";

interface SubActivityThumbnailUploadProps {
  lang: string;
  onThumbnailSelect: (thumbnailUrl: string) => void;
  onThumbnailRemove: () => void;
  hasThumbnail: boolean;
  currentThumbnail?: string;
  activityIndex: number;
  subActivityIndex: number;
}

function SubActivityThumbnailUpload({
  lang,
  onThumbnailSelect,
  onThumbnailRemove,
  hasThumbnail,
  currentThumbnail,
  activityIndex,
  subActivityIndex,
}: SubActivityThumbnailUploadProps) {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const inputId = `thumbnail-upload-${Math.random().toString(36).substr(2, 9)}`;

  const { setUploading, clearUploadState } = useSubActivityThumbnailStore();
  const uploadState = useSubActivityThumbnailUploadState(
    activityIndex,
    subActivityIndex,
  );
  const isUploading = uploadState?.isUploading ?? false;

  const openFilePicker = () => {
    if (fileInputRef.current) {
      fileInputRef.current.value = "";
      fileInputRef.current.click();
    }
  };

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      clearUploadState(activityIndex, subActivityIndex);
    };
  }, [activityIndex, subActivityIndex, clearUploadState]);

  const handleFileSelect = async (file: File) => {
    if (!file.type.startsWith("image/")) {
      alert(
        lang === "en" ? "Please select an image file" : "እባክዎ የምስል ፋይል ይምረጡ",
      );
      return;
    }

    setUploading(activityIndex, subActivityIndex, true, 0);

    try {
      const formData = new FormData();
      formData.append("thumbnail", file);

      const response = await fetch("/api/upload-thumbnail", {
        method: "POST",
        body: formData,
      });

      const data = await response.json();
      if (data.success && data.filename) {
        onThumbnailSelect(
          data.thumbnailUrl || `/api/files/thumbnails/${data.filename}`,
        );
      } else {
        alert(lang === "en" ? "Upload failed" : "መስቀል አልተሳካም");
      }
    } catch (error) {
      console.error("Thumbnail upload error:", error);
      alert(lang === "en" ? "Upload failed" : "መስቀል አልተሳካም");
    } finally {
      setUploading(activityIndex, subActivityIndex, false);
    }
  };

  return (
    <div className="space-y-2">
      <input
        type="file"
        accept="image/*"
        onChange={(e) => {
          const file = e.target.files?.[0];
          if (file) {
            handleFileSelect(file);
            e.target.value = "";
          }
        }}
        className="hidden"
        id={inputId}
        ref={fileInputRef}
        disabled={isUploading}
      />

      {hasThumbnail ? (
        <div className="flex items-center justify-between bg-success/10 p-2 rounded">
          <div className="flex items-center gap-2">
            {currentThumbnail && (
              <img
                src={currentThumbnail}
                alt="Thumbnail"
                className="w-12 h-12 object-cover rounded"
              />
            )}
            <span className="text-sm text-success">
              {lang === "en" ? "Thumbnail uploaded" : "ምስል ተስቅሏል"}
            </span>
          </div>
          <div className="flex gap-1">
            <Button
              type="button"
              size="sm"
              variant="light"
              color="primary"
              onPress={() => {
                openFilePicker();
              }}
              isDisabled={isUploading}
            >
              <Upload className="size-4" />
            </Button>
            <Button
              type="button"
              size="sm"
              variant="light"
              color="danger"
              onPress={() => {
                const confirmMessage =
                  lang === "en"
                    ? "Are you sure you want to delete this thumbnail?"
                    : "ይህን ምስል መሰረዝ እርግጠኛ ነዎት?";
                if (confirm(confirmMessage)) {
                  onThumbnailRemove();
                }
              }}
              isDisabled={isUploading}
            >
              <Trash className="size-4" />
            </Button>
          </div>
        </div>
      ) : (
        <div className="border-2 border-dashed border-primary-300 rounded-lg p-4 text-center">
          <div className="flex flex-col items-center gap-2">
            <Image className="size-8 text-primary-500" />
            <p className="text-sm text-gray-600">
              {lang === "en"
                ? "Upload sub-activity thumbnail"
                : "የንዑስ እንቅስቃሴ ምስል ይስቀሉ"}
            </p>
            <Button
              type="button"
              size="sm"
              color="primary"
              variant="bordered"
              onPress={() => {
                openFilePicker();
              }}
              isDisabled={isUploading}
            >
              <Upload className="size-4" />
              {lang === "en" ? "Choose Thumbnail" : "ምስል ምረጥ"}
            </Button>
          </div>
        </div>
      )}

      {isUploading && (
        <div className="flex items-center gap-2 p-2 bg-blue-50 border border-blue-200 rounded-lg">
          <span className="text-sm text-primary font-medium">
            {lang === "en" ? "Uploading..." : "ስቀል በሂደት ላይ..."}
          </span>
        </div>
      )}
    </div>
  );
}

// Memoize to prevent unnecessary re-renders when parent form updates
export default memo(SubActivityThumbnailUpload);
