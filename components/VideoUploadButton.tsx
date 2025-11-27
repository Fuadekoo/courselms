"use client";
import { useState, useRef, memo } from "react";
import { CButton } from "./heroui";
import { Upload, Video, X } from "lucide-react";

const CHUNK_SIZE = 512 * 1024; // 512KB

function getTimestampUUID(ext: string) {
  return `${Date.now()}-${Math.floor(Math.random() * 100000)}.${ext}`;
}

interface VideoUploadButtonProps {
  onVideoSelect: (file: File) => void;
  onVideoRemove: () => void;
  selectedVideo?: File | null;
  lang: string;
  disabled?: boolean;
  showExternalProgress?: boolean;
}

function VideoUploadButton({
  onVideoSelect,
  onVideoRemove,
  selectedVideo,
  lang,
  disabled = false,
  showExternalProgress = false,
}: VideoUploadButtonProps) {
  const [isDragOver, setIsDragOver] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [isUploading, setIsUploading] = useState(false);
  const [currentChunk, setCurrentChunk] = useState(0);
  const [totalChunks, setTotalChunks] = useState(0);
  const [uuidFilename, setUuidFilename] = useState<string | null>(null);

  const handleChunkedUpload = async (file: File) => {
    const ext = file.name.split(".").pop() || "mp4";
    const uuidName = getTimestampUUID(ext);
    setUuidFilename(uuidName);

    const chunkSize = CHUNK_SIZE;
    const total = Math.ceil(file.size / chunkSize);
    setTotalChunks(total);

    for (let i = 0; i < total; i++) {
      const start = i * chunkSize;
      const end = Math.min(file.size, start + chunkSize);
      const chunk = file.slice(start, end);

      const formData = new FormData();
      formData.append("chunk", chunk);
      formData.append("filename", uuidName);
      formData.append("chunkIndex", i.toString());
      formData.append("totalChunks", total.toString());

      await fetch("/api/upload-video", {
        method: "POST",
        body: formData,
      });

      setUploadProgress(Math.round(((i + 1) / total) * 100));
      setCurrentChunk(i + 1);
    }

    setIsUploading(false);
    alert(lang === "en" ? "Upload complete!" : "ስቀል ተጠናቋል!");
    setCurrentChunk(0);
    setTotalChunks(0);
  };

  const handleFileSelect = async (file: File) => {
    // Allow video files and HLS manifest files (.m3u8)
    const isVideo = file.type.startsWith("video/");
    const isHlsManifest = file.name.endsWith(".m3u8") || file.type === "application/vnd.apple.mpegurl" || file.type === "application/x-mpegURL";
    
    if (isVideo || isHlsManifest) {
      // Reset states for new upload
      setUploadProgress(0);
      setCurrentChunk(0);
      setTotalChunks(0);
      setUuidFilename(null);
      setIsUploading(true);
      onVideoSelect(file);
      await handleChunkedUpload(file);
    } else {
      alert(
        lang === "en" ? "Please select a video file or HLS manifest (.m3u8)" : "እባክዎ የቪዲዮ ፋይል ወይም HLS manifest (.m3u8) ይምረጡ"
      );
    }
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragOver(false);
    const file = e.dataTransfer.files[0];
    if (file) handleFileSelect(file);
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragOver(true);
  };

  const handleDragLeave = () => {
    setIsDragOver(false);
  };

  const formatFileSize = (bytes: number) => {
    if (bytes === 0) return "0 Bytes";
    const k = 1024;
    const sizes = ["Bytes", "KB", "MB", "GB"];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + " " + sizes[i];
  };

  return (
    <div className="w-full">
      <input
        ref={fileInputRef}
        type="file"
        accept="video/*,.m3u8,application/vnd.apple.mpegurl,application/x-mpegURL"
        onChange={(e) => {
          const file = e.target.files?.[0];
          if (file) {
            handleFileSelect(file);
            // Reset input to allow selecting same file again
            e.target.value = '';
          }
        }}
        className="hidden"
        disabled={disabled || isUploading}
      />

      {selectedVideo || isUploading ? (
        <div className="flex flex-col gap-4">
          {selectedVideo && (
            <div className="flex items-center justify-between p-4 bg-primary/10 border border-primary/30 rounded-lg">
              <div className="flex items-center gap-3">
                <Video className="w-8 h-8 text-primary" />
                <div>
                  <p className="font-medium text-sm">{selectedVideo.name}</p>
                  <p className="text-xs text-gray-500">
                    {formatFileSize(selectedVideo.size)}
                  </p>
                  {uuidFilename && (
                    <p className="text-xs text-gray-400">
                      <strong>
                        {lang === "en" ? "Upload filename:" : "የስቀል ፋይል ስም:"}
                      </strong>{" "}
                      {uuidFilename}
                    </p>
                  )}
                </div>
              </div>
              <CButton
                type="button"
                isIconOnly
                size="sm"
                variant="light"
                color="danger"
                onClick={() => {
                  const confirmMessage =
                    lang === "en"
                      ? "Are you sure you want to delete this video?"
                      : "ይህን ቪዲዮ መሰረዝ እርግጠኛ ነዎት?";
                  if (confirm(confirmMessage)) {
                    onVideoRemove();
                  }
                }}
                disabled={disabled || isUploading}
              >
                <X className="w-4 h-4" />
              </CButton>
            </div>
          )}
          {isUploading && !showExternalProgress && (
            <div className="flex flex-col gap-2 p-4 bg-blue-50 border border-blue-200 rounded-lg">
              <div className="flex justify-between items-center">
                <span className="text-sm text-primary font-medium">
                  {lang === "en" ? "Uploading" : "ስቀል በሂደት ላይ"}:{" "}
                  {uploadProgress}%
                </span>
                <span className="text-xs text-gray-500">
                  {currentChunk}/{totalChunks}{" "}
                  {lang === "en" ? "chunks" : "ቀለቶች"}
                </span>
              </div>
              <progress
                value={uploadProgress}
                max={100}
                className="w-full h-2 rounded bg-gray-200"
              />
              {selectedVideo && (
                <p className="text-xs text-gray-600">
                  {lang === "en" ? "Uploading" : "የሚስቀል"}: {selectedVideo.name}
                </p>
              )}
            </div>
          )}
        </div>
      ) : (
        <div
          className={`
            relative border-2 border-dashed rounded-xl p-12 text-center transition-all duration-300
            ${
              isDragOver
                ? "border-primary-500 bg-primary-50 shadow-lg scale-105"
                : "border-primary-300 hover:border-primary-400 hover:bg-primary-25"
            }
            ${
              disabled || isUploading
                ? "opacity-50 cursor-not-allowed"
                : "cursor-pointer"
            }
          `}
          onDrop={handleDrop}
          onDragOver={handleDragOver}
          onDragLeave={handleDragLeave}
          onClick={() =>
            !disabled && !isUploading && fileInputRef.current?.click()
          }
        >
          <div className="flex flex-col items-center space-y-4">
            <div
              className={`p-4 rounded-full transition-colors ${
                isDragOver ? "bg-primary-100" : "bg-primary-50"
              }`}
            >
              <Upload className="w-8 h-8 text-primary-600" />
            </div>
            <div className="space-y-2">
              <h3 className="text-xl font-semibold text-gray-800">
                {isUploading
                  ? lang === "en"
                    ? "Uploading..."
                    : "የሚስቀል..."
                  : lang === "en"
                  ? "Upload Course Video"
                  : "የኮርስ ቪዲዮ ይስቀሉ"}
              </h3>
              <p className="text-sm text-gray-600 max-w-sm mx-auto leading-relaxed">
                {lang === "en"
                  ? "Drag and drop your video file here to upload"
                  : "የቪዲዮ ፋይልዎን እዚህ ይጎትቱ እና ይጣሉ"}
              </p>
            </div>
            <div className="flex flex-col items-center space-y-3">
              <div className="flex items-center space-x-2 text-xs text-gray-500">
                <span className="px-2 py-1 bg-gray-100 rounded">
                  {lang === "en" ? "MP4, AVI, MOV, M3U8" : "MP4፣ AVI፣ MOV፣ M3U8"}
                </span>
                <span>•</span>
                <span>{lang === "en" ? "Max 100MB" : "ከ100MB በታች"}</span>
              </div>
              <CButton
                type="button"
                color="primary"
                variant="bordered"
                size="md"
                onClick={() => !disabled && !isUploading && fileInputRef.current?.click()}
                disabled={disabled || isUploading}
              >
                {lang === "en" ? "Choose File" : "ፋይል ምረጥ"}
              </CButton>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

// Memoize to prevent unnecessary re-renders when parent form updates
export default memo(VideoUploadButton);
