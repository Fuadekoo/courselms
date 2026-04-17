"use client";
import { useState, useRef, memo } from "react";
import type { MouseEvent, DragEvent, ChangeEvent } from "react";
import { CButton } from "./heroui";
import { Upload, Image, X } from "lucide-react";

interface ThumbnailUploadProps {
  onImageSelect: (file: File) => void;
  onImageRemove: () => void;
  currentThumbnail?: string;
  lang: string;
  disabled?: boolean;
}

function ThumbnailUpload({
  onImageSelect,
  onImageRemove,
  currentThumbnail,
  lang,
  disabled = false,
}: ThumbnailUploadProps) {
  const [isDragOver, setIsDragOver] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileSelect = (file: File) => {
    if (file.type.startsWith("image/")) {
      onImageSelect(file);
    } else {
      alert(
        lang === "en" ? "Please select an image file" : "እባክዎ የምስል ፋይል ይምረጡ",
      );
    }
  };

  const handleDrop = (e: DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    setIsDragOver(false);
    const file = e.dataTransfer.files[0];
    if (file) handleFileSelect(file);
  };

  return (
    <div className="relative">
      <input
        ref={fileInputRef}
        type="file"
        accept="image/*"
        onChange={(e: ChangeEvent<HTMLInputElement>) => {
          const file = e.target.files?.[0];
          if (file) {
            handleFileSelect(file);
            // Allow selecting the same file again after clear/remove.
            e.target.value = "";
          }
        }}
        className="hidden"
        disabled={disabled}
      />

      <div
        className={`
          relative border-2 border-dashed rounded-xl overflow-hidden cursor-pointer transition-colors
          ${isDragOver ? "border-primary bg-primary/5" : "border-primary/30"}
          ${
            disabled
              ? "opacity-50 cursor-not-allowed"
              : "hover:border-primary hover:bg-primary/5"
          }
        `}
        onDrop={handleDrop}
        onDragOver={(e: DragEvent<HTMLDivElement>) => {
          e.preventDefault();
          setIsDragOver(true);
        }}
        onDragLeave={() => setIsDragOver(false)}
        onClick={() => {
          if (!disabled && fileInputRef.current) {
            fileInputRef.current.value = "";
            fileInputRef.current.click();
          }
        }}
      >
        {currentThumbnail ? (
          <>
            <img
              src={currentThumbnail}
              alt="Thumbnail"
              className="w-full aspect-video object-cover"
            />
            <div className="absolute inset-0 bg-black/50 opacity-0 hover:opacity-100 transition-opacity flex items-center justify-center">
              <CButton
                color="primary"
                variant="solid"
                startContent={<Upload className="w-4 h-4" />}
                onClick={(e: MouseEvent<Element>) => {
                  e.stopPropagation();
                  if (fileInputRef.current) {
                    fileInputRef.current.value = "";
                    fileInputRef.current.click();
                  }
                }}
                disabled={disabled}
              >
                {lang === "en" ? "Change" : "ቀይር"}
              </CButton>
            </div>
            <CButton
              isIconOnly
              size="sm"
              variant="solid"
              color="danger"
              className="absolute top-2 right-2"
              onClick={(e: MouseEvent<Element>) => {
                e.stopPropagation();
                onImageRemove();
                if (fileInputRef.current) {
                  fileInputRef.current.value = "";
                }
              }}
              disabled={disabled}
            >
              <X className="w-4 h-4" />
            </CButton>
          </>
        ) : (
          <div className="w-full aspect-video flex flex-col items-center justify-center p-4">
            <Image className="w-12 h-12 text-primary mb-2" />
            <p className="text-sm font-medium mb-1">
              {lang === "en" ? "Upload Thumbnail" : "ምስል ይስቀሉ"}
            </p>
            <p className="text-xs text-gray-500 text-center">
              {lang === "en"
                ? "Click or drag image here"
                : "ምስል እዚህ ይጫኑ ወይም ይጎትቱ"}
            </p>
          </div>
        )}
      </div>
    </div>
  );
}

// Memoize to prevent unnecessary re-renders when parent form updates
export default memo(ThumbnailUpload);
