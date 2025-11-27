/* eslint-disable @typescript-eslint/no-explicit-any */
"use client";

import { useState } from "react";
import { Button } from "@heroui/react";

/**
 * Test page for video upload and HLS conversion
 * Access at: http://localhost:3000/test-upload
 */
export default function TestUploadPage() {
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [uploading, setUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [result, setResult] = useState<any>(null);
  const [conversionStatus, setConversionStatus] = useState<any>(null);
  const [checkingStatus, setCheckingStatus] = useState(false);

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file && file.type.startsWith("video/")) {
      setSelectedFile(file);
      setResult(null);
      setConversionStatus(null);
    } else {
      alert("Please select a video file");
    }
  };

  const handleUpload = async () => {
    if (!selectedFile) {
      alert("Please select a file first");
      return;
    }

    setUploading(true);
    setUploadProgress(0);
    setResult(null);
    setConversionStatus(null);

    try {
      const CHUNK_SIZE = 512 * 1024; // 512KB chunks
      const totalChunks = Math.ceil(selectedFile.size / CHUNK_SIZE);
      const ext = selectedFile.name.split(".").pop() || "mp4";
      const uuidName = `${Date.now()}-${Math.floor(Math.random() * 100000)}.${ext}`;

      // Upload chunks
      for (let i = 0; i < totalChunks; i++) {
        const start = i * CHUNK_SIZE;
        const end = Math.min(selectedFile.size, start + CHUNK_SIZE);
        const chunk = selectedFile.slice(start, end);

        const formData = new FormData();
        formData.append("chunk", chunk);
        formData.append("filename", uuidName);
        formData.append("chunkIndex", i.toString());
        formData.append("totalChunks", totalChunks.toString());

        const response = await fetch("/api/upload", {
          method: "POST",
          body: formData,
        });

        if (!response.ok) {
          throw new Error(`Upload failed at chunk ${i + 1}`);
        }

        const data = await response.json();
        setUploadProgress(Math.round(((i + 1) / totalChunks) * 100));

        // If this is the last chunk, we get the result
        if (i + 1 === totalChunks) {
          setResult(data);
          
          // If conversion was queued, start checking status
          if (data.converting && data.jobId) {
            checkConversionStatus(data.jobId);
          }
        }
      }
    } catch (error: any) {
      console.error("Upload error:", error);
      setResult({ error: error.message });
    } finally {
      setUploading(false);
    }
  };

  const checkConversionStatus = async (jobId: string) => {
    setCheckingStatus(true);
    
    const pollStatus = async () => {
      try {
        const response = await fetch(`/api/hls-status?jobId=${jobId}`);
        if (response.ok) {
          const status = await response.json();
          setConversionStatus(status);
          
          // Continue polling if still processing
          if (status.status === "pending" || status.status === "processing") {
            setTimeout(pollStatus, 2000); // Check every 2 seconds
          } else {
            setCheckingStatus(false);
          }
        }
      } catch (error) {
        console.error("Error checking status:", error);
        setCheckingStatus(false);
      }
    };

    pollStatus();
  };

  const formatFileSize = (bytes: number) => {
    if (bytes === 0) return "0 Bytes";
    const k = 1024;
    const sizes = ["Bytes", "KB", "MB", "GB"];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return Math.round(bytes / Math.pow(k, i) * 100) / 100 + " " + sizes[i];
  };

  return (
    <div className="container mx-auto p-8 max-w-4xl">
      <h1 className="text-3xl font-bold mb-6">Video Upload & HLS Conversion Test</h1>
      
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow-lg p-6 space-y-6">
        {/* File Selection */}
        <div>
          <label className="block text-sm font-medium mb-2">
            Select Video File (MP4 recommended)
          </label>
          <input
            type="file"
            accept="video/*"
            onChange={handleFileSelect}
            disabled={uploading}
            className="block w-full text-sm text-gray-500 file:mr-4 file:py-2 file:px-4 file:rounded-md file:border-0 file:text-sm file:font-semibold file:bg-blue-50 file:text-blue-700 hover:file:bg-blue-100"
          />
          {selectedFile && (
            <div className="mt-2 text-sm text-gray-600 dark:text-gray-400">
              <strong>Selected:</strong> {selectedFile.name} ({formatFileSize(selectedFile.size)})
            </div>
          )}
        </div>

        {/* Upload Button */}
        <Button
          onClick={handleUpload}
          disabled={!selectedFile || uploading}
          className="w-full"
        >
          {uploading ? `Uploading... ${uploadProgress}%` : "Upload & Convert to HLS"}
        </Button>

        {/* Upload Progress */}
        {uploading && (
          <div className="space-y-2">
            <div className="w-full bg-gray-200 rounded-full h-2.5">
              <div
                className="bg-blue-600 h-2.5 rounded-full transition-all duration-300"
                style={{ width: `${uploadProgress}%` }}
              />
            </div>
            <p className="text-sm text-gray-600">Uploading chunks...</p>
          </div>
        )}

        {/* Upload Result */}
        {result && (
          <div className="mt-4 p-4 border rounded-lg">
            <h3 className="font-semibold mb-2">Upload Result:</h3>
            <pre className="bg-gray-100 dark:bg-gray-900 p-3 rounded text-xs overflow-auto">
              {JSON.stringify(result, null, 2)}
            </pre>
            
            {result.converting && result.jobId && (
              <div className="mt-4 p-3 bg-blue-50 dark:bg-blue-900/20 rounded">
                <p className="text-sm text-blue-800 dark:text-blue-200">
                  🔄 HLS conversion queued! Job ID: {result.jobId}
                </p>
                <Button
                  onClick={() => checkConversionStatus(result.jobId)}
                  disabled={checkingStatus}
                  size="sm"
                  className="mt-2"
                >
                  {checkingStatus ? "Checking..." : "Check Conversion Status"}
                </Button>
              </div>
            )}
          </div>
        )}

        {/* Conversion Status */}
        {conversionStatus && (
          <div className="mt-4 p-4 border rounded-lg">
            <h3 className="font-semibold mb-2">Conversion Status:</h3>
            <div className="space-y-2">
              <div>
                <strong>Status:</strong>{" "}
                <span
                  className={`px-2 py-1 rounded text-sm ${
                    conversionStatus.status === "completed"
                      ? "bg-green-100 text-green-800"
                      : conversionStatus.status === "failed"
                      ? "bg-red-100 text-red-800"
                      : "bg-yellow-100 text-yellow-800"
                  }`}
                >
                  {conversionStatus.status.toUpperCase()}
                </span>
              </div>
              {conversionStatus.status === "completed" && (
                <div>
                  <strong>HLS Manifest:</strong>{" "}
                  <code className="bg-gray-100 dark:bg-gray-900 px-2 py-1 rounded text-sm">
                    {conversionStatus.baseName}/{conversionStatus.baseName}.m3u8
                  </code>
                </div>
              )}
              {conversionStatus.error && (
                <div className="text-red-600 text-sm">
                  <strong>Error:</strong> {conversionStatus.error}
                </div>
              )}
              <details className="mt-2">
                <summary className="cursor-pointer text-sm text-gray-600">
                  View Full Status JSON
                </summary>
                <pre className="bg-gray-100 dark:bg-gray-900 p-3 rounded text-xs overflow-auto mt-2">
                  {JSON.stringify(conversionStatus, null, 2)}
                </pre>
              </details>
            </div>
          </div>
        )}

        {/* Instructions */}
        <div className="mt-8 p-4 bg-gray-50 dark:bg-gray-900 rounded-lg">
          <h3 className="font-semibold mb-2">Testing Instructions:</h3>
          <ol className="list-decimal list-inside space-y-1 text-sm text-gray-600 dark:text-gray-400">
            <li>Make sure FFmpeg is installed on your system</li>
            <li>Select an MP4 video file (smaller files convert faster for testing)</li>
            <li>Click "Upload & Convert to HLS"</li>
            <li>Wait for upload to complete</li>
            <li>Check conversion status - it will poll automatically or click the button</li>
            <li>Once complete, check the <code className="bg-gray-200 dark:bg-gray-800 px-1 rounded">fuad/course/</code> folder for the HLS files</li>
          </ol>
        </div>

        {/* FFmpeg Check */}
        <div className="mt-4 p-4 bg-yellow-50 dark:bg-yellow-900/20 rounded-lg">
          <h3 className="font-semibold mb-2 text-yellow-800 dark:text-yellow-200">
            ⚠️ FFmpeg Check:
          </h3>
          <p className="text-sm text-yellow-700 dark:text-yellow-300">
            Make sure FFmpeg is installed. Check by running: <code className="bg-yellow-100 dark:bg-yellow-900 px-2 py-1 rounded">ffmpeg -version</code> in your terminal.
          </p>
        </div>
      </div>
    </div>
  );
}

