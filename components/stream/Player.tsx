"use client";
import React, { useRef, useState, useEffect, memo } from "react";
import { Play, Pause, Settings } from "lucide-react";
import Playlist from "./Playlist";
import ProgressBar from "./ProgressBar";
import VolumeControl from "./VolumeControl";
import FullscreenButton from "./FullScreen";
import CustomSpinner from "./CustomSpinner";
import DynamicWatermark from "./DynamicWatermark";
import { QualityOption } from "./QualitySelector";
import QualityControl from "./QualityControl";
import SettingsMenu from "./SettingsMenu";
import SpeedSelector from "./SpeedSelector";
import QualitySelector from "./QualitySelector";
import { VideoItem } from "../../types";
import { cn } from "@/lib/utils";
import "./VideoProtection.css";
import Hls from "hls.js";
import type { QualityLevel } from "./QualityControl";

interface PlayerProps {
  src: string;
  type?: "url" | "local" | "hls";
  playlist?: VideoItem[];
  title?: string;
  poster?: string; // Thumbnail image URL
  qualities?: QualityOption[]; // Quality options for the video (for non-HLS)
  onVideoPlay?: () => void;
  onVideoPause?: () => void;
  onVideoEnd?: () => void;
  onVideoProgress?: (progress: number) => void;
}

function Player({
  src,
  type = "local",
  playlist = [],
  title,
  poster,
  qualities = [],
  onVideoPlay,
  onVideoPause,
  onVideoEnd,
  onVideoProgress,
}: PlayerProps) {
  const videoRef = useRef<HTMLVideoElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const [playing, setPlaying] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);
  const [speed, setSpeed] = useState(1);
  const [volume, setVolume] = useState(1);
  const [muted, setMuted] = useState(false);
  const [currentVideoIndex, setCurrentVideoIndex] = useState(0);
  const [buffered, setBuffered] = useState(0);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [showControls, setShowControls] = useState(true);
  const [isLoading, setIsLoading] = useState(true);
  const [isOnline, setIsOnline] = useState(true);
  const [isLandscape, setIsLandscape] = useState(false);
  const [hasError, setHasError] = useState(false);
  const [videoAvailable, setVideoAvailable] = useState(!!src);
  const [hasStartedPlaying, setHasStartedPlaying] = useState(false); // Track if video has ever started
  const [secureVideoUrl, setSecureVideoUrl] = useState<string>("");
  const [currentQuality, setCurrentQuality] = useState<QualityLevel>(
    "auto" as QualityLevel
  );
  const [showSettings, setShowSettings] = useState(false);
  const [settingsView, setSettingsView] = useState<
    "menu" | "quality" | "speed"
  >("menu");
  const [qualityUrls, setQualityUrls] = useState<Record<string, string>>({});
  const [hlsLevels, setHlsLevels] = useState<
    Array<{ width?: number; height?: number; bitrate?: number; name?: string }>
  >([]);
  const [currentHlsLevel, setCurrentHlsLevel] = useState<number>(-1);
  const [isHls, setIsHls] = useState(false);
  const [networkSpeedMbps, setNetworkSpeedMbps] = useState<number | undefined>(
    undefined
  );
  const controlsTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const tokenRefreshInterval = useRef<NodeJS.Timeout | null>(null);
  const originalMp4UrlRef = useRef<string | null>(null); // Store original MP4 URL for fallback
  const hlsRef = useRef<Hls | null>(null);

  // Check if HLS master playlist exists for a video file
  const checkForHlsMasterPlaylist = React.useCallback(
    async (filePath: string): Promise<string | null> => {
      try {
        // Skip HLS checking for external URLs or blob URLs
        if (
          filePath.startsWith("http://") ||
          filePath.startsWith("https://") ||
          filePath.startsWith("blob:")
        ) {
          return null;
        }

        // Support paths with directories. Extract filename without extension and optional directory.
        const pathParts = filePath.split("/");
        const fileName = pathParts.pop() || filePath;
        const dir = pathParts.join("/");
        const nameOnly = fileName.replace(/\.[^/.]+$/, "");

        // Construct HLS master playlist path: {dir/}{nameOnly}/{nameOnly}.m3u8
        const hlsMasterPath = dir
          ? `${dir}/${nameOnly}/${nameOnly}.m3u8`
          : `${nameOnly}/${nameOnly}.m3u8`;

        // First, get a token for the HLS file
        const tokenResponse = await fetch("/api/video-token", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ file: hlsMasterPath }),
        });

        if (!tokenResponse.ok) {
          return null;
        }

        const tokenData = await tokenResponse.json();
        const hlsUrl = tokenData.url;

        // Return the HLS URL - the error handler will catch 404s and fallback to MP4
        console.log(
          `[Player] HLS master playlist token generated: ${hlsMasterPath}`
        );
        return hlsUrl;
      } catch {
        // If check fails, return null (will use original file)
        return null;
      }
    },
    []
  );

  // Generate secure token for video
  const generateSecureUrl = React.useCallback(
    async (filePath: string, preferHls: boolean = true) => {
      try {
        // Skip token generation for external URLs (http/https) - use them directly
        if (filePath.startsWith("http://") || filePath.startsWith("https://")) {
          console.log(
            "[Player] External URL detected, using directly:",
            filePath
          );
          return filePath;
        }

        // Skip HLS checking for blob URLs
        if (filePath.startsWith("blob:")) {
          console.log("[Player] Blob URL detected, using directly:", filePath);
          return filePath;
        }

        // First, check if HLS master playlist exists (if preferHls is true)
        if (preferHls && !filePath.endsWith(".m3u8")) {
          const hlsUrl = await checkForHlsMasterPlaylist(filePath);
          if (hlsUrl) {
            return hlsUrl;
          }
        }

        // Fallback to original file
        console.log("[Player] Generating secure URL for file:", filePath);
        const response = await fetch("/api/video-token", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ file: filePath }),
        });

        if (!response.ok) {
          const errorText = await response.text();
          console.error("[Player] Failed to generate video token:", {
            status: response.status,
            statusText: response.statusText,
            error: errorText,
            filePath,
          });
          return null;
        }

        const data = await response.json();
        console.log("[Player] Generated secure URL:", data.url);
        return data.url;
      } catch (err) {
        console.error("[Player] Error generating secure URL:", {
          error: err,
          filePath,
        });
        return null;
      }
    },
    [checkForHlsMasterPlaylist]
  );

  // Generate secure URLs for all qualities when they change
  useEffect(() => {
    if (qualities.length > 0 && type === "local") {
      const generateAllQualityUrls = async () => {
        const urls: Record<string, string> = {};

        // Generate secure URL for main src (auto quality)
        const mainUrl = await generateSecureUrl(src);
        if (mainUrl) {
          urls["auto"] = mainUrl;
        }

        // Generate secure URLs for each quality
        for (const quality of qualities) {
          if (quality.url) {
            const secureUrl = await generateSecureUrl(quality.url);
            if (secureUrl) {
              urls[quality.value] = secureUrl;
            }
          }
        }

        setQualityUrls(urls);
      };

      generateAllQualityUrls();

      // Refresh all quality URLs every 4 minutes
      if (tokenRefreshInterval.current) {
        clearInterval(tokenRefreshInterval.current);
      }
      tokenRefreshInterval.current = setInterval(() => {
        generateAllQualityUrls();
      }, 4 * 60 * 1000); // 4 minutes
    }

    return () => {
      if (tokenRefreshInterval.current) {
        clearInterval(tokenRefreshInterval.current);
      }
    };
  }, [qualities, src, type, generateSecureUrl]);

  // Reset video availability when src changes and get secure URL
  useEffect(() => {
    if (src) {
      setVideoAvailable(false);
      setHasError(false);
      setIsLoading(true);
      setHasStartedPlaying(false);

      // Generate secure URL for local videos
      if (type === "local") {
        // If we have quality URLs cached, use them
        if (Object.keys(qualityUrls).length > 0 && qualityUrls["auto"]) {
          setSecureVideoUrl(qualityUrls["auto"]);
        } else {
          // Store original MP4 URL for fallback
          originalMp4UrlRef.current = null;

          // Generate secure URL for original MP4 file (for fallback)
          generateSecureUrl(src, false)
            .then((mp4Url) => {
              if (mp4Url) {
                originalMp4UrlRef.current = mp4Url;
              }
            })
            .catch(() => {
              // Ignore errors for MP4 URL generation
            });

          // Check for HLS master playlist first, then fallback to original file
          generateSecureUrl(src, true)
            .then((url) => {
              if (url) {
                setSecureVideoUrl(url);
              } else {
                // If secure URL generation fails, try to use the original src directly
                // This handles cases where the file might be accessible without token
                console.warn(
                  "[Player] Secure URL generation failed, trying original src:",
                  src
                );
                setSecureVideoUrl(src);
                // Don't set error immediately - let the video element try to load it
              }
            })
            .catch((err) => {
              console.error("[Player] Error in generateSecureUrl:", err);
              // Fallback to original src
              setSecureVideoUrl(src);
            });
        }

        // Refresh token every 4 minutes (before 5-minute expiry)
        if (tokenRefreshInterval.current) {
          clearInterval(tokenRefreshInterval.current);
        }
        tokenRefreshInterval.current = setInterval(() => {
          generateSecureUrl(src).then((url) => {
            if (url && videoRef.current) {
              const wasPlaying = !videoRef.current.paused;
              const currentTime = videoRef.current.currentTime;

              setSecureVideoUrl(url);

              // Restore playback state after URL change
              if (wasPlaying) {
                videoRef.current.currentTime = currentTime;
                videoRef.current.play().catch(() => {});
              }
            }
          });
        }, 4 * 60 * 1000); // 4 minutes
      } else {
        // For URL or blob types, use directly
        if (type === "url" && !src.startsWith("blob:")) {
          setSecureVideoUrl(
            `/api/remote-stream?url=${encodeURIComponent(src)}`
          );
        } else {
          setSecureVideoUrl(src);
        }
      }
    } else {
      setVideoAvailable(false);
      setHasError(true);
      setIsLoading(false);
    }

    return () => {
      if (tokenRefreshInterval.current) {
        clearInterval(tokenRefreshInterval.current);
      }
    };
  }, [src, type, qualityUrls, generateSecureUrl]);

  // Compute the video source based on type and quality
  let videoSrc = secureVideoUrl || src;

  // Detect if source is HLS (synchronously, before using it)
  const sourceUrl = secureVideoUrl || src;
  const isHlsSource =
    type === "hls" ||
    sourceUrl?.endsWith(".m3u8") ||
    sourceUrl?.includes(".m3u8") ||
    (sourceUrl?.includes("/") && sourceUrl?.includes(".m3u8")); // Handle paths like "folder/video.m3u8"

  // Update isHls state if it changed
  useEffect(() => {
    setIsHls(isHlsSource);
    console.log("[Player] HLS Detection:", {
      isHlsSource,
      sourceUrl: secureVideoUrl || src,
      type,
      hlsLevels: hlsLevels.length,
    });
  }, [isHlsSource, secureVideoUrl, src, type, hlsLevels.length]);

  // Helper to safely compare/index with QualityLevel
  const toQualityValue = (q: QualityLevel) => String(q);

  // Format time in seconds to MM:SS or HH:MM:SS
  const formatTime = (seconds: number): string => {
    if (!isFinite(seconds) || isNaN(seconds)) return "0:00";
    const hours = Math.floor(seconds / 3600);
    const minutes = Math.floor((seconds % 3600) / 60);
    const secs = Math.floor(seconds % 60);
    if (hours > 0) {
      return `${hours}:${minutes.toString().padStart(2, "0")}:${secs
        .toString()
        .padStart(2, "0")}`;
    }
    return `${minutes}:${secs.toString().padStart(2, "0")}`;
  };

  // If qualities are provided and NOT HLS, use the selected quality URL
  if (qualities.length > 0 && !isHlsSource) {
    const cq = toQualityValue(currentQuality);
    if (cq === "auto") {
      // Use the default src/secureVideoUrl for auto
      videoSrc = secureVideoUrl || src;
    } else {
      const selectedQuality = qualities.find((q) => q.value === cq);
      if (selectedQuality) {
        if (type === "url") {
          // For URL type, use the quality URL directly
          videoSrc = selectedQuality.url;
        } else if (type === "local") {
          // For local videos, use the secure URL from qualityUrls cache
          if (qualityUrls[cq]) {
            videoSrc = qualityUrls[cq];
          } else {
            // Fallback: try to generate secure URL on the fly
            generateSecureUrl(selectedQuality.url).then((url) => {
              if (url) {
                setQualityUrls((prev) => ({ ...prev, [cq]: url }));
                videoSrc = url;
              }
            });
            // Use the quality URL directly as fallback
            videoSrc = selectedQuality.url;
          }
        } else {
          // For blob or other types
          videoSrc = selectedQuality.url;
        }
      }
    }
  }

  // For blob URLs (uploaded files), use src directly

  const currentSrc =
    playlist.length > 0 ? playlist[currentVideoIndex]?.url : videoSrc;

  // Detect mobile and iOS specifically
  const isMobile =
    typeof window !== "undefined" &&
    /iPhone|iPad|iPod|Android/i.test(navigator.userAgent);

  const isIOS =
    typeof window !== "undefined" &&
    /iPhone|iPad|iPod/i.test(navigator.userAgent);

  // Hide controls after a few seconds on mobile
  useEffect(() => {
    if (!isMobile || !showControls || !playing) return;

    if (controlsTimeoutRef.current) {
      clearTimeout(controlsTimeoutRef.current);
    }

    controlsTimeoutRef.current = setTimeout(() => {
      setShowControls(false);
    }, 3000);

    return () => {
      if (controlsTimeoutRef.current) {
        clearTimeout(controlsTimeoutRef.current);
      }
    };
  }, [showControls, isMobile, playing]);

  // Network status detection
  useEffect(() => {
    const handleOnline = () => setIsOnline(true);
    const handleOffline = () => setIsOnline(false);

    window.addEventListener("online", handleOnline);
    window.addEventListener("offline", handleOffline);

    return () => {
      window.removeEventListener("online", handleOnline);
      window.removeEventListener("offline", handleOffline);
    };
  }, []);

  // Orientation detection for mobile fullscreen
  useEffect(() => {
    const handleOrientationChange = () => {
      // Add a small delay to ensure the orientation change is complete
      setTimeout(() => {
        if (isMobile) {
          const isCurrentlyLandscape = window.innerWidth > window.innerHeight;
          setIsLandscape(isCurrentlyLandscape);
          // Debug log
          console.log("Mobile orientation changed:", {
            isMobile,
            isFullscreen,
            isLandscape: isCurrentlyLandscape,
            width: window.innerWidth,
            height: window.innerHeight,
          });
        }
      }, 100);
    };

    // Initial check
    if (isMobile) {
      setIsLandscape(window.innerWidth > window.innerHeight);
    }

    // Listen for orientation changes
    window.addEventListener("orientationchange", handleOrientationChange);
    window.addEventListener("resize", handleOrientationChange);

    return () => {
      window.removeEventListener("orientationchange", handleOrientationChange);
      window.removeEventListener("resize", handleOrientationChange);
    };
  }, [isMobile, isFullscreen]);

  // Track previous source to detect quality changes
  const prevSrcRef = useRef<string>("");
  const prevHlsSrcRef = useRef<string>(""); // Track previous HLS source to prevent re-initialization
  const savedStateRef = useRef<{ time: number; playing: boolean } | null>(null);

  // Initialize HLS.js for HLS sources
  useEffect(() => {
    const video = videoRef.current;
    if (!video || !currentSrc || !isHlsSource) {
      // If not HLS, make sure video src is set (handled by non-HLS useEffect)
      return;
    }

    // Prevent re-initialization if HLS is already set up for this source
    if (prevHlsSrcRef.current === currentSrc && hlsRef.current) {
      console.log(
        "[Player] HLS already initialized for this source, skipping re-initialization"
      );
      return;
    }

    console.log("Initializing HLS for:", currentSrc);

    // Check if HLS is supported
    if (Hls.isSupported()) {
      // Only clean up existing HLS instance if the source actually changed
      if (hlsRef.current && prevHlsSrcRef.current !== currentSrc) {
        console.log(
          "[Player] Source changed, cleaning up existing HLS instance"
        );
        hlsRef.current.destroy();
        hlsRef.current = null;
      }

      // Remove src from video element - HLS.js will handle it
      if (video.src) {
        video.removeAttribute("src");
        video.load(); // Reload to clear any existing source
      }

      // Extract base directory and token from master playlist URL
      // Master URL format: /api/stream?file=DIR/FILE.m3u8&token=TOKEN
      let baseDir = "";
      let masterToken = "";
      try {
        const masterUrl = new URL(currentSrc, window.location.origin);
        if (masterUrl.pathname === "/api/stream") {
          const fileParam = masterUrl.searchParams.get("file");
          masterToken = masterUrl.searchParams.get("token") || "";
          if (fileParam) {
            // Extract directory from file path (e.g., "1764332590594-99387/1764332590594-99387.m3u8" -> "1764332590594-99387")
            const fileParts = fileParam.split("/");
            if (fileParts.length > 1) {
              baseDir = fileParts.slice(0, -1).join("/");
            }
          }
        }
      } catch (e) {
        console.warn("[Player] Failed to parse master playlist URL:", e);
      }

      // Helper function to rewrite HLS URLs
      const rewriteHlsUrl = (url: string): string => {
        try {
          // Handle both absolute and relative URLs
          let requestUrl: URL;
          let isRelative = false;
          try {
            requestUrl = new URL(url);
          } catch {
            // If URL is relative, resolve it relative to the master playlist URL
            isRelative = true;
            // Resolve relative to the master playlist base URL
            const masterUrlObj = new URL(currentSrc, window.location.origin);
            // Extract the base path from master playlist (e.g., /api/stream?file=...)
            // For relative URLs, HLS.js resolves them relative to the master playlist location
            // which would be /api/stream, so we need to extract the actual file path
            requestUrl = new URL(url, masterUrlObj);
          }

          // If the request is already going to /api/stream, let it through
          if (requestUrl.pathname === "/api/stream") {
            return url;
          }

          // If the request is to /api/ but not /api/stream, rewrite it
          // This happens when HLS.js resolves relative URLs from the master playlist
          if (
            requestUrl.pathname.startsWith("/api/") &&
            requestUrl.pathname !== "/api/stream"
          ) {
            // Extract filename from path (e.g., "/api/1764332590594-99387_1.m3u8" -> "1764332590594-99387_1.m3u8")
            const filename = requestUrl.pathname.replace("/api/", "");

            // Construct full file path with base directory
            const filePath = baseDir ? `${baseDir}/${filename}` : filename;

            // Generate new secure URL through /api/stream
            const newUrl = `/api/stream?file=${encodeURIComponent(
              filePath
            )}&token=${encodeURIComponent(masterToken)}`;

            console.log(
              `[Player] Rewriting HLS request: ${url} -> ${newUrl} (relative: ${isRelative})`
            );

            return newUrl;
          }

          // Also handle relative URLs that don't start with /api/
          // These might be resolved relative to the current page, not the master playlist
          if (isRelative && !url.startsWith("/") && !url.startsWith("http")) {
            // This is a relative URL like "1764332590594-99387_2_0000.ts"
            // Construct full file path with base directory
            const filePath = baseDir ? `${baseDir}/${url}` : url;

            // Generate new secure URL through /api/stream
            const newUrl = `/api/stream?file=${encodeURIComponent(
              filePath
            )}&token=${encodeURIComponent(masterToken)}`;

            console.log(
              `[Player] Rewriting relative HLS request: ${url} -> ${newUrl}`
            );

            return newUrl;
          }
        } catch (e) {
          console.warn("[Player] Failed to rewrite HLS URL:", url, e);
        }
        return url;
      };

      // Create new HLS instance with adaptive bitrate settings
      const hls = new Hls({
        enableWorker: true,
        lowLatencyMode: false,
        backBufferLength: 90,
        maxBufferLength: 30,
        maxMaxBufferLength: 60,
        maxBufferSize: 60 * 1000 * 1000, // 60MB
        maxBufferHole: 0.5,
        highBufferWatchdogPeriod: 2,
        nudgeOffset: 0.1,
        nudgeMaxRetry: 5, // Increased retries for slow networks
        fragLoadingTimeOut: 30000, // Increased timeout from 20s to 30s
        manifestLoadingTimeOut: 30000, // Added manifest timeout
        maxLoadingDelay: 4,
        minAutoBitrate: 0,
        maxStarvationDelay: 4,
        abrEwmaDefaultEstimate: 500000,
        abrBandWidthFactor: 0.95,
        abrBandWidthUpFactor: 0.7,
        abrMaxWithRealBitrate: false,
        abrEwmaSlowLive: 3.0,
        abrEwmaFastLive: 9.0,
        abrEwmaSlowVoD: 3.0,
        abrEwmaFastVoD: 9.0,
        startLevel: -1, // Auto-select starting level (adaptive)
        xhrSetup: (xhr, url) => {
          // Rewrite the URL before the request is made
          const rewrittenUrl = rewriteHlsUrl(url);
          if (rewrittenUrl !== url) {
            // Store the rewritten URL on the xhr object
            (xhr as any)._rewrittenUrl = rewrittenUrl;

            // Override xhr.open to use the rewritten URL
            const originalOpen = xhr.open;
            xhr.open = function (
              method: string,
              urlParam: string | URL,
              async?: boolean,
              username?: string | null,
              password?: string | null
            ) {
              // Use the rewritten URL if available, otherwise use the original
              const finalUrl = (this as any)._rewrittenUrl || urlParam;
              return originalOpen.call(
                this,
                method,
                finalUrl,
                async !== false,
                username,
                password
              );
            };
          }
        },
      });

      hlsRef.current = hls;
      // Store the source URL to track it and prevent unnecessary re-initialization
      prevHlsSrcRef.current = currentSrc;

      // Load the source
      hls.loadSource(currentSrc);
      hls.attachMedia(video);

      // Handle HLS events
      hls.on(Hls.Events.MANIFEST_PARSED, () => {
        console.log("HLS manifest parsed successfully");
        setIsLoading(false);
        setVideoAvailable(true);
        setHasError(false);

        // Get available levels
        const levels = hls.levels;
        console.log("[Player] HLS Levels loaded:", levels.length, levels);
        setHlsLevels(levels);
        setCurrentHlsLevel(hls.currentLevel);

        // If user selected a specific quality, set it (otherwise use auto/adaptive)
        const cq = toQualityValue(currentQuality);
        if (cq !== "auto" && hls.levels.length > 0) {
          const levelIndex = hls.levels.findIndex((level) => {
            const height = level.height || 0;
            if (cq === "1080p" && height >= 1080) return true;
            if (cq === "720p" && height >= 720 && height < 1080) return true;
            if (cq === "480p" && height >= 480 && height < 720) return true;
            if (cq === "360p" && height >= 360 && height < 480) return true;
            if (cq === "270p" && height >= 270 && height < 360) return true;
            return false;
          });

          if (levelIndex !== -1) {
            hls.currentLevel = levelIndex;
            setCurrentHlsLevel(levelIndex);
          } else {
            // If exact match not found, use auto (adaptive)
            hls.currentLevel = -1;
            setCurrentHlsLevel(-1);
          }
        } else {
          // Use adaptive bitrate (auto)
          hls.currentLevel = -1;
          setCurrentHlsLevel(-1);
        }
      });

      hls.on(Hls.Events.LEVEL_SWITCHED, (_event, data) => {
        setCurrentHlsLevel(data.level);
        const bw: number | undefined = (hls as any)?.bandwidthEstimate;
        if (bw && typeof bw === "number") {
          setNetworkSpeedMbps(bw / 1_000_000);
        }
      });

      hls.on(Hls.Events.ERROR, (event, data) => {
        console.error("HLS Error:", data);
        if (data.fatal) {
          switch (data.type) {
            case Hls.ErrorTypes.NETWORK_ERROR:
              // Check if it's a 404 (manifest not found)
              if (
                data.details === "manifestLoadError" ||
                data.response?.code === 404
              ) {
                console.warn(
                  "[Player] HLS manifest not found (404) - falling back to MP4"
                );
                // Destroy HLS instance first
                hls.destroy();
                hlsRef.current = null;
                setIsHls(false);

                // Fallback to original MP4 file
                const fallbackToMp4 = (mp4Url: string) => {
                  console.log("[Player] Falling back to MP4:", mp4Url);
                  setSecureVideoUrl(mp4Url);
                  setHasError(false);
                  setIsLoading(true);
                  // Small delay to ensure state updates propagate
                  setTimeout(() => {
                    const video = videoRef.current;
                    if (video) {
                      // Remove any HLS-related attributes
                      video.removeAttribute("src");
                      video.src = mp4Url;
                      video.load();
                    }
                  }, 100);
                };

                if (originalMp4UrlRef.current) {
                  fallbackToMp4(originalMp4UrlRef.current);
                } else {
                  // Generate MP4 URL as fallback
                  generateSecureUrl(src, false)
                    .then((mp4Url) => {
                      if (mp4Url) {
                        originalMp4UrlRef.current = mp4Url;
                        fallbackToMp4(mp4Url);
                      } else {
                        console.error(
                          "[Player] Cannot fallback to MP4 - no URL available"
                        );
                        setHasError(true);
                        setIsLoading(false);
                      }
                    })
                    .catch(() => {
                      console.error(
                        "[Player] Failed to generate MP4 fallback URL"
                      );
                      setHasError(true);
                      setIsLoading(false);
                    });
                }
                return;
              }
              console.error("HLS Network Error - attempting recovery:", data);
              hls.startLoad();
              break;
            case Hls.ErrorTypes.MEDIA_ERROR:
              console.error("HLS Media Error - attempting recovery:", data);
              hls.recoverMediaError();
              break;
            default:
              console.error("HLS Fatal Error - cannot recover:", data);
              hls.destroy();
              setHasError(true);
              setIsLoading(false);
              break;
          }
        } else {
          // Handle non-fatal errors
          if (data.type === Hls.ErrorTypes.NETWORK_ERROR) {
            if (data.details === "fragLoadTimeOut") {
              // Fragment timeout - HLS.js will automatically retry
              console.warn(
                "[Player] Fragment load timeout (non-fatal), HLS will retry"
              );
              // Don't log every timeout to reduce console noise
            } else if (data.details === "keyLoadError") {
              console.warn("[Player] Key load error (non-fatal):", data);
            } else {
              console.warn(
                "[Player] HLS Network error (non-fatal):",
                data.details
              );
            }
          } else if (data.type === Hls.ErrorTypes.MEDIA_ERROR) {
            // Media errors are handled by HLS.js automatically
            console.warn(
              "[Player] HLS Media error (non-fatal), attempting recovery:",
              data.details
            );
            hls.recoverMediaError();
          } else {
            console.warn("[Player] HLS Non-fatal error:", data);
          }
        }
      });

      // Cleanup on unmount or source change
      return () => {
        if (hlsRef.current) {
          hlsRef.current.destroy();
          hlsRef.current = null;
        }
      };
    } else if (video.canPlayType("application/vnd.apple.mpegurl")) {
      // Native HLS support (Safari)
      video.src = currentSrc;
      setIsHls(true);
    } else {
      console.error("HLS is not supported in this browser");
      setHasError(true);
      setIsLoading(false);
    }
  }, [currentSrc, isHlsSource]); // Removed currentQuality - quality changes should only update level, not re-initialize

  // Update video source when currentSrc changes (for non-HLS)
  useEffect(() => {
    if (isHlsSource) return; // Skip for HLS (handled above)

    const video = videoRef.current;
    if (!video || !currentSrc) return;

    // Only update if the source actually changed
    if (video.src !== currentSrc && currentSrc !== prevSrcRef.current) {
      // Save current state before switching to preserve playback continuity
      // Only save if not already saved (e.g., from quality change handler)
      if (!savedStateRef.current) {
        const wasPlaying = !video.paused;
        const savedTime = video.currentTime;
        savedStateRef.current = { time: savedTime, playing: wasPlaying };
        console.log("[Player] Source change - saved playback state:", {
          wasPlaying,
          savedTime,
          newSrc: currentSrc,
        });
      }

      prevSrcRef.current = currentSrc;

      // Set loading state to show spinner during quality switch
      setIsLoading(true);

      // Change video source
      video.src = currentSrc;
      video.load();

      // Restore playback state after video is ready
      const handleCanPlayAfterLoad = () => {
        const savedState = savedStateRef.current;
        if (savedState) {
          console.log(
            "[Player] Restoring playback state after quality change:",
            savedState
          );

          // Wait a bit for the video to be fully ready
          const restorePlayback = () => {
            if (savedState.time > 0) {
              // Restore time position first
              video.currentTime = Math.min(
                savedState.time,
                video.duration || savedState.time
              );

              // Wait for seek to complete, then resume playback
              const handleSeeked = () => {
                video.removeEventListener("seeked", handleSeeked);

                // Wait a bit more for buffering, then resume
                const tryResumePlayback = () => {
                  // Resume playback if it was playing before quality change
                  if (savedState.playing) {
                    console.log(
                      "[Player] Resuming playback after quality change"
                    );
                    video
                      .play()
                      .then(() => {
                        setIsLoading(false);
                        setPlaying(true);
                        console.log("[Player] Playback resumed successfully");
                      })
                      .catch((err) => {
                        console.warn(
                          "[Player] Autoplay prevented after quality change:",
                          err
                        );
                        setIsLoading(false);
                        // User may need to manually play
                      });
                  } else {
                    setIsLoading(false);
                  }
                };

                // Try to resume immediately if enough data is buffered
                if (video.readyState >= 3) {
                  tryResumePlayback();
                } else {
                  // Wait for more data to be buffered
                  const handleCanPlayThrough = () => {
                    video.removeEventListener(
                      "canplaythrough",
                      handleCanPlayThrough
                    );
                    tryResumePlayback();
                  };
                  video.addEventListener(
                    "canplaythrough",
                    handleCanPlayThrough,
                    { once: true }
                  );

                  // Fallback: resume after short delay even if canplaythrough doesn't fire
                  setTimeout(() => {
                    video.removeEventListener(
                      "canplaythrough",
                      handleCanPlayThrough
                    );
                    tryResumePlayback();
                  }, 500);
                }
              };

              video.addEventListener("seeked", handleSeeked, { once: true });

              // Fallback: if seeked doesn't fire quickly, try to resume anyway
              const fallbackTimeout = setTimeout(() => {
                video.removeEventListener("seeked", handleSeeked);
                if (savedState.playing && video.paused) {
                  video.play().catch(() => {});
                }
                setIsLoading(false);
              }, 1000);

              // Clear fallback if seeked fires
              video.addEventListener(
                "seeked",
                () => clearTimeout(fallbackTimeout),
                { once: true }
              );
            } else {
              // No time to restore, just resume if it was playing
              if (savedState.playing) {
                video.play().catch(() => {});
              }
              setIsLoading(false);
            }

            savedStateRef.current = null; // Clear saved state
          };

          // Small delay to ensure video metadata is loaded
          if (video.readyState >= 2) {
            restorePlayback();
          } else {
            // Wait for loadedmetadata if not ready yet
            const handleLoadedMetadata = () => {
              video.removeEventListener("loadedmetadata", handleLoadedMetadata);
              restorePlayback();
            };
            video.addEventListener("loadedmetadata", handleLoadedMetadata, {
              once: true,
            });

            // Fallback timeout
            setTimeout(restorePlayback, 500);
          }
        } else {
          setIsLoading(false);
        }
        video.removeEventListener("canplay", handleCanPlayAfterLoad);
      };

      // Handle case where video is already ready
      if (video.readyState >= 2) {
        handleCanPlayAfterLoad();
      } else {
        video.addEventListener("canplay", handleCanPlayAfterLoad, {
          once: true,
        });
      }

      // Handle loading errors
      const handleError = () => {
        setIsLoading(false);
        setHasError(true);
        video.removeEventListener("error", handleError);
      };

      video.addEventListener("error", handleError, { once: true });
    }
  }, [currentSrc, isHlsSource]);

  useEffect(() => {
    const video = videoRef.current;
    if (!video) return;

    const updateTime = () => setCurrentTime(video.currentTime);
    const updateDuration = () => setDuration(video.duration);
    const updateBuffered = () => {
      if (video.buffered.length > 0) {
        setBuffered(video.buffered.end(video.buffered.length - 1));
      }
    };

    const handleLoadStart = () => setIsLoading(true);
    const handleCanPlay = () => setIsLoading(false);
    const handleWaiting = () => setIsLoading(true);
    const handlePlaying = () => {
      setIsLoading(false);
      setHasStartedPlaying(true); // Mark that video has started playing
      onVideoPlay?.(); // Call onVideoPlay when video actually starts playing
    };
    const handleError = () => {
      setIsLoading(false);
      setHasError(true);
    };
    const handleEnded = () => {
      onVideoEnd?.(); // Call onVideoEnd when video finishes
    };
    const handleTimeUpdate = () => {
      updateTime();
      // Calculate and report progress percentage
      if (video.duration > 0) {
        const progress = (video.currentTime / video.duration) * 100;
        onVideoProgress?.(progress);
      }
    };

    video.addEventListener("timeupdate", handleTimeUpdate);
    video.addEventListener("loadedmetadata", updateDuration);
    video.addEventListener("progress", updateBuffered);
    video.addEventListener("loadstart", handleLoadStart);
    video.addEventListener("canplay", handleCanPlay);
    video.addEventListener("waiting", handleWaiting);
    video.addEventListener("playing", handlePlaying);
    video.addEventListener("error", handleError);
    video.addEventListener("ended", handleEnded);

    return () => {
      video.removeEventListener("timeupdate", handleTimeUpdate);
      video.removeEventListener("loadedmetadata", updateDuration);
      video.removeEventListener("progress", updateBuffered);
      video.removeEventListener("loadstart", handleLoadStart);
      video.removeEventListener("canplay", handleCanPlay);
      video.removeEventListener("waiting", handleWaiting);
      video.removeEventListener("playing", handlePlaying);
      video.removeEventListener("error", handleError);
      video.removeEventListener("ended", handleEnded);
    };
  }, [currentSrc, onVideoPlay, onVideoEnd, onVideoProgress]);

  useEffect(() => {
    const video = videoRef.current;
    if (video) video.playbackRate = speed;
  }, [speed, currentSrc]);

  useEffect(() => {
    const video = videoRef.current;
    if (video) {
      video.volume = volume;
      video.muted = muted;
    }
  }, [volume, muted]);

  // Fullscreen handlers
  const handleFullscreen = () => {
    // iOS devices: use video element fullscreen for better experience
    if (isIOS && videoRef.current) {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const video = videoRef.current as any;
      if (video.webkitEnterFullscreen) {
        video.webkitEnterFullscreen();
      } else if (video.webkitRequestFullscreen) {
        video.webkitRequestFullscreen();
      }
      return;
    }

    // Non-iOS devices: use container fullscreen
    if (!containerRef.current) return;
    if (!isFullscreen) {
      // Try different fullscreen methods for cross-browser support
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const element = containerRef.current as any;
      if (element.requestFullscreen) {
        element.requestFullscreen();
      } else if (element.webkitRequestFullscreen) {
        element.webkitRequestFullscreen();
      } else if (element.mozRequestFullScreen) {
        element.mozRequestFullScreen();
      } else if (element.msRequestFullscreen) {
        element.msRequestFullscreen();
      }
    } else {
      // Exit fullscreen
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const doc = document as any;
      if (document.exitFullscreen) {
        document.exitFullscreen();
      } else if (doc.webkitExitFullscreen) {
        doc.webkitExitFullscreen();
      } else if (doc.mozCancelFullScreen) {
        doc.mozCancelFullScreen();
      } else if (doc.msExitFullscreen) {
        doc.msExitFullscreen();
      }
    }
  };

  useEffect(() => {
    const handleChange = () => {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const doc = document as any;
      const isCurrentlyFullscreen = !!(
        document.fullscreenElement ||
        doc.webkitFullscreenElement ||
        doc.mozFullScreenElement ||
        doc.msFullscreenElement
      );
      setIsFullscreen(isCurrentlyFullscreen);
      // Debug log
      console.log("Fullscreen changed:", {
        isFullscreen: isCurrentlyFullscreen,
        isMobile,
        isLandscape,
      });
    };

    document.addEventListener("fullscreenchange", handleChange);
    document.addEventListener("webkitfullscreenchange", handleChange);
    document.addEventListener("mozfullscreenchange", handleChange);
    document.addEventListener("MSFullscreenChange", handleChange);

    // iOS-specific fullscreen events for video element
    const video = videoRef.current;
    if (isIOS && video) {
      const handleWebkitBeginFullscreen = () => {
        setIsFullscreen(true);
        console.log("iOS entered fullscreen");
      };
      const handleWebkitEndFullscreen = () => {
        setIsFullscreen(false);
        console.log("iOS exited fullscreen");
      };

      video.addEventListener(
        "webkitbeginfullscreen",
        handleWebkitBeginFullscreen
      );
      video.addEventListener("webkitendfullscreen", handleWebkitEndFullscreen);

      return () => {
        video.removeEventListener(
          "webkitbeginfullscreen",
          handleWebkitBeginFullscreen
        );
        video.removeEventListener(
          "webkitendfullscreen",
          handleWebkitEndFullscreen
        );
      };
    }

    return () => {
      document.removeEventListener("fullscreenchange", handleChange);
      document.removeEventListener("webkitfullscreenchange", handleChange);
      document.removeEventListener("mozfullscreenchange", handleChange);
      document.removeEventListener("MSFullscreenChange", handleChange);
    };
  }, [isMobile, isLandscape, isIOS]);

  // Toggle play/pause
  const togglePlay = () => {
    const video = videoRef.current;
    if (!video) return;
    if (video.paused) {
      video.play().catch(() => {});
      setPlaying(true);
    } else {
      video.pause();
      setPlaying(false);
      onVideoPause?.();
    }
  };

  // Handle seeking
  const handleSeek = (time: number) => {
    const video = videoRef.current;
    if (!video) return;
    video.currentTime = time;
    setCurrentTime(time);
  };

  // Handle volume change
  const handleVolumeChange = (newVolume: number) => {
    setVolume(newVolume);
  };

  // Handle mute toggle
  const handleMuteToggle = () => {
    setMuted((prev) => !prev);
  };

  // Handle speed change
  const handleSpeedChange = (newSpeed: number) => {
    setSpeed(newSpeed);
    console.log("[Player] Speed changed to:", newSpeed);
  };

  // Handle settings toggle
  const handleSettingsToggle = () => {
    setShowSettings((prev) => !prev);
    if (!showSettings) {
      setSettingsView("menu");
    }
  };

  // Handle settings navigation
  const handleSettingsQualityClick = () => {
    setSettingsView("quality");
  };

  const handleSettingsSpeedClick = () => {
    setSettingsView("speed");
  };

  const handleSettingsBack = () => {
    setSettingsView("menu");
  };

  // Wrapper to convert string quality from QualitySelector to QualityLevel
  const handleQualityChangeFromSelector = async (qualityString: string) => {
    // Map string values to QualityLevel type
    let qualityLevel: QualityLevel;
    
    if (qualityString === "auto") {
      qualityLevel = "auto";
    } else if (qualityString === "1080p" || qualityString === "720p" || 
               qualityString.toLowerCase().includes("hd")) {
      qualityLevel = "HD";
    } else if (qualityString === "480p" || qualityString === "360p") {
      qualityLevel = "360p";
    } else if (qualityString === "270p" || qualityString === "144p") {
      qualityLevel = "144p";
    } else {
      // Default to auto if unknown
      qualityLevel = "auto";
    }
    
    // For HLS, handle quality changes directly using the original string
    if (isHlsSource && hlsRef.current && hlsLevels.length > 0) {
      const video = videoRef.current;
      if (video) {
        // Save playback state for HLS too (even though it's seamless)
        const wasPlaying = !video.paused;
        const savedTime = video.currentTime;
        
        savedStateRef.current = {
          time: savedTime,
          playing: wasPlaying,
        };
      }
      
      if (qualityString === "auto") {
        hlsRef.current.currentLevel = -1;
        setCurrentHlsLevel(-1);
        setCurrentQuality("auto" as QualityLevel);
        return;
      } else {
        // Find matching HLS level using the original string
        const levelIndex = hlsLevels.findIndex((level) => {
          const height = level.height || 0;
          if (qualityString === "1080p" && height >= 1080) return true;
          if (qualityString === "720p" && height >= 720 && height < 1080) return true;
          if (qualityString === "480p" && height >= 480 && height < 720) return true;
          if (qualityString === "360p" && height >= 360 && height < 480) return true;
          if (qualityString === "270p" && height >= 270 && height < 360) return true;
          if (qualityString === "144p" && height >= 144 && height < 270) return true;
          return false;
        });

        if (levelIndex !== -1) {
          hlsRef.current.currentLevel = levelIndex;
          setCurrentHlsLevel(levelIndex);
          setCurrentQuality(qualityLevel);
          return;
        }
      }
    }
    
    // For non-HLS videos, we need to check if the qualityString matches an available quality
    // and use handleQualityChange which expects QualityLevel
    // But first, update currentQuality to the mapped QualityLevel
    setCurrentQuality(qualityLevel);
    
    // Then use the standard handler which will handle the source change
    await handleQualityChange(qualityLevel);
  };

  // Close settings when clicking outside
  useEffect(() => {
    if (!showSettings) return;

    const handleClickOutside = (e: MouseEvent) => {
      const target = e.target as HTMLElement;
      // Don't close if clicking inside settings menu or settings button
      if (!target.closest("[data-settings-menu]") && !target.closest("button[title='Settings']")) {
        setShowSettings(false);
        setSettingsView("menu");
      }
    };

    document.addEventListener("click", handleClickOutside);
    return () => document.removeEventListener("click", handleClickOutside);
  }, [showSettings]);

  // Handle quality change - video continues from same position without stopping
  const handleQualityChange = async (quality: QualityLevel) => {
    const video = videoRef.current;

    // Save playback state BEFORE changing quality to ensure we preserve it
    if (video && !isHlsSource) {
      const wasPlaying = !video.paused;
      const savedTime = video.currentTime;

      // Save state for restoration after quality change
      savedStateRef.current = {
        time: savedTime,
        playing: wasPlaying,
      };

      console.log("[Player] Quality change - saving state:", {
        quality,
        wasPlaying,
        savedTime,
      });

      // For non-HLS, ensure quality URL is available before switching
      const cq = toQualityValue(quality);
      if (cq !== "auto" && type === "local" && qualities.length > 0) {
        const selectedQuality = qualities.find((q) => q.value === cq);
        if (selectedQuality && !qualityUrls[cq]) {
          // Generate secure URL if not cached
          console.log("[Player] Generating secure URL for quality:", cq);
          try {
            const secureUrl = await generateSecureUrl(selectedQuality.url);
            if (secureUrl) {
              setQualityUrls((prev) => ({ ...prev, [cq]: secureUrl }));
              // URL will be available on next render, source change will happen automatically
            }
          } catch (error) {
            console.error(
              "[Player] Failed to generate secure URL for quality:",
              error
            );
          }
        }
      }
    }

    setCurrentQuality(quality);

    // If HLS, update the HLS level
    // Note: HLS quality changes are seamless - video continues from same position automatically
    if (isHlsSource && hlsRef.current && hlsLevels.length > 0) {
      const cq = toQualityValue(quality);
      if (cq === "auto") {
        hlsRef.current.currentLevel = -1; // Auto/adaptive
        setCurrentHlsLevel(-1);
      } else {
        // Find matching level
        const levelIndex = hlsLevels.findIndex((level) => {
          const height = level.height || 0;
          if (cq === "1080p" && height >= 1080) return true;
          if (cq === "720p" && height >= 720 && height < 1080) return true;
          if (cq === "480p" && height >= 480 && height < 720) return true;
          if (cq === "360p" && height >= 360 && height < 480) return true;
          if (cq === "270p" && height >= 270 && height < 360) return true;
          if (cq === "144p" && height >= 144 && height < 270) return true;
          return false;
        });

        if (levelIndex !== -1) {
          // HLS.js seamlessly switches quality without interrupting playback
          // Video continues from the same time position automatically
          hlsRef.current.currentLevel = levelIndex;
          setCurrentHlsLevel(levelIndex);
        }
      }
    }
    // For non-HLS videos, the source change is handled by the useEffect below
    // which will use savedStateRef to restore playback position and state
  };

  // Determine available quality levels
  const availableLevels: QualityLevel[] = React.useMemo(() => {
    if (isHlsSource && hlsLevels.length > 0) {
      // For HLS, return all standard levels
      return ["auto", "HD", "360p", "144p"];
    } else if (qualities.length > 0) {
      // For non-HLS, map quality options to QualityLevel
      const levels: QualityLevel[] = ["auto"];
      qualities.forEach((q) => {
        const qv = q.value.toLowerCase();
        if (qv.includes("1080") || qv.includes("hd")) {
          if (!levels.includes("HD")) levels.push("HD");
        } else if (qv.includes("360")) {
          if (!levels.includes("360p")) levels.push("360p");
        } else if (qv.includes("144")) {
          if (!levels.includes("144p")) levels.push("144p");
        }
      });
      return levels;
    }
    return ["auto"];
  }, [isHlsSource, hlsLevels.length, qualities]);

  // Keyboard shortcuts (play/pause, mute, fullscreen, seek)
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      const video = videoRef.current;
      if (!video) return;
      // Avoid interfering with form fields
      const tag = (e.target as HTMLElement)?.tagName;
      if (["INPUT", "TEXTAREA", "SELECT"].includes(tag)) return;

      switch (e.key) {
        case " ":
          e.preventDefault();
          togglePlay();
          break;
        case "f":
        case "F":
          e.preventDefault();
          handleFullscreen();
          break;
        case "m":
        case "M":
          e.preventDefault();
          setMuted((m) => !m);
          break;
        case "ArrowRight":
          e.preventDefault();
          video.currentTime = Math.min(video.currentTime + 5, video.duration);
          break;
        case "ArrowLeft":
          e.preventDefault();
          video.currentTime = Math.max(video.currentTime - 5, 0);
          break;
        case "0":
          video.currentTime = 0;
          break;
        case "1":
        case "2":
        case "3":
        case "4":
        case "5":
        case "6":
        case "7":
        case "8":
        case "9":
          // Jump to 0%..90%
          const pct = parseInt(e.key, 10) * 0.1;
          if (video.duration) {
            video.currentTime = video.duration * pct;
          }
          break;
      }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [handleFullscreen]);

  return (
    <div
      ref={containerRef}
      className="video-player relative"
      style={{
        height: isFullscreen && isMobile && isLandscape ? "100vh" : "100%",
        width: isFullscreen && isMobile && isLandscape ? "100vw" : "100%",
        position: "relative",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        backgroundColor: "#000",
      }}
    >
      {/* Ambient backdrop gradient */}
      <div
        aria-hidden
        style={{
          position: "absolute",
          inset: 0,
          background:
            "radial-gradient(circle at 50% 50%, rgba(30,58,138,0.5), rgba(0,0,0,0.85))",
          opacity: playing ? 0.15 : 0.35,
          transition: "opacity 600ms ease",
          pointerEvents: "none",
          zIndex: 0,
        }}
      />

      {/* Error/Loading overlay */}
      <div
        style={{
          position: "absolute",
          inset: 0,
          background:
            "linear-gradient(160deg, rgba(15,23,42,0.9) 0%, rgba(30,58,138,0.6) 40%, rgba(0,0,0,0.4) 100%)",
          opacity: !videoAvailable || hasError || !src ? 1 : 0,
          transition: "opacity 400ms ease",
          pointerEvents: "none",
          zIndex: 1,
        }}
      />

      {/* Placeholder UI when video is not available or not loaded yet */}
      {(!videoAvailable || hasError || !src) && (
        <div
          style={{
            position: "absolute",
            inset: 0,
            backgroundColor: "#000",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            zIndex: 10,
            pointerEvents: "none",
          }}
        >
          {/* Title in top-left */}
          {title && (
            <div
              style={{
                position: "absolute",
                top: "20px",
                left: "20px",
                color: "#fff",
                fontSize: "18px",
                fontWeight: 500,
                zIndex: 11,
                maxWidth: "80%",
                textShadow: "0 2px 4px rgba(0,0,0,0.5)",
              }}
            >
              {title}
            </div>
          )}

          {/* Center Loading Spinner - Large blue glowing circle */}
          <div
            style={{
              position: "absolute",
              top: "50%",
              left: "50%",
              transform: "translate(-50%, -50%)",
              zIndex: 11,
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
            }}
          >
            <div
              style={{
                width: "100px",
                height: "100px",
                borderRadius: "50%",
                background: "rgba(59, 130, 246, 0.15)",
                boxShadow:
                  "0 0 30px rgba(59, 130, 246, 0.8), 0 0 60px rgba(59, 130, 246, 0.5), inset 0 0 15px rgba(59, 130, 246, 0.4)",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
              }}
            >
              <CustomSpinner size={40} color="rgba(147, 197, 253, 1)" />
            </div>
          </div>
        </div>
      )}

      {/* Thumbnail Overlay - Shows until video starts playing */}
      {poster && !hasStartedPlaying && (
        <div
          style={{
            position: "absolute",
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            zIndex: 2,
            cursor: "pointer",
            borderRadius: isFullscreen && isMobile && isLandscape ? 0 : 8,
            overflow: "hidden",
            backgroundColor: "#000",
          }}
          onClick={(e) => {
            e.stopPropagation();
            togglePlay();
          }}
        >
          <img
            src={poster}
            alt="Video thumbnail"
            style={{
              width: "100%",
              height: "100%",
              objectFit: "contain", // Show full image without cropping
              display: "block",
              backgroundColor: "#000",
            }}
          />
          {/* Play Button Overlay - Responsive size */}
          <div
            style={{
              position: "absolute",
              top: "50%",
              left: "50%",
              transform: "translate(-50%, -50%)",
              width: isMobile ? "60px" : "80px", // Smaller on mobile
              height: isMobile ? "60px" : "80px",
              borderRadius: "50%",
              background: "rgba(59, 130, 246, 0.95)",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              boxShadow: "0 4px 20px rgba(0, 0, 0, 0.4)",
              transition: "all 0.3s ease",
            }}
            onMouseEnter={(e) => {
              if (!isMobile) {
                e.currentTarget.style.transform =
                  "translate(-50%, -50%) scale(1.1)";
                e.currentTarget.style.background = "rgba(59, 130, 246, 1)";
              }
            }}
            onMouseLeave={(e) => {
              if (!isMobile) {
                e.currentTarget.style.transform =
                  "translate(-50%, -50%) scale(1)";
                e.currentTarget.style.background = "rgba(59, 130, 246, 0.95)";
              }
            }}
          >
            <Play
              size={isMobile ? 28 : 40} // Smaller icon on mobile
              color="white"
              fill="white"
              style={{ marginLeft: "3px" }}
            />
          </div>
        </div>
      )}

      <video
        ref={videoRef}
        src={isHlsSource ? undefined : currentSrc} // Don't set src for HLS - HLS.js handles it
        poster={poster} // Add poster attribute for native fallback
        playsInline
        preload="metadata"
        webkit-playsinline="true"
        x-webkit-airplay="allow"
        width="100%"
        height="100%"
        controlsList="nodownload nofullscreen noremoteplayback" // Disable download button
        disablePictureInPicture // Disable PiP
        disableRemotePlayback // Disable casting
        onContextMenu={(e) => e.preventDefault()} // Disable right-click
        style={{
          borderRadius: isFullscreen && isMobile && isLandscape ? 0 : 8,
          width: "100%",
          height: isFullscreen && isMobile && isLandscape ? "100vh" : "100%",
          objectFit:
            isFullscreen && isMobile && isLandscape ? "cover" : "contain",
          display: videoAvailable && !hasError ? "block" : "none",
          position: "absolute",
          top: 0,
          left: 0,
          zIndex: 1,
          WebkitTapHighlightColor: "transparent",
          touchAction: "manipulation",
          pointerEvents: "auto", // Enable interaction but with protections
          userSelect: "none", // Disable text selection
          WebkitUserSelect: "none", // Safari
          MozUserSelect: "none", // Firefox
          boxShadow:
            playing && !hasError
              ? "0 0 24px rgba(59,130,246,0.35)"
              : "0 0 12px rgba(59,130,246,0.25)",
          transition: "box-shadow 400ms ease",
        }}
        onPlay={(e) => {
          e.stopPropagation();
          setPlaying(true);
          setHasStartedPlaying(true); // Hide thumbnail when playing starts
          onVideoPlay?.();
        }}
        onPause={(e) => {
          e.stopPropagation();
          setPlaying(false);
          onVideoPause?.();
        }}
        onClick={(e) => {
          e.stopPropagation();
          if (isMobile) setShowControls((v) => !v);
        }}
        onTouchStart={(e) => {
          // For iOS: show controls on touch
          if (isMobile) {
            e.stopPropagation();
            setShowControls((v) => !v);
          }
        }}
        onError={(e: React.SyntheticEvent<HTMLVideoElement, Event>) => {
          const video = e.currentTarget;
          const error = video.error;
          console.error("[Player] Video element error:", {
            code: error?.code,
            message: error?.message,
            src: video.src,
            currentSrc: video.currentSrc,
            networkState: video.networkState,
            readyState: video.readyState,
          });
          console.error("Video load error:", e);
          setIsLoading(false);
          setHasError(true);
          setVideoAvailable(false);
        }}
        onLoadedData={() => {
          setVideoAvailable(true);
          setIsLoading(false);
          setHasError(false);
        }}
        onCanPlay={() => {
          setVideoAvailable(true);
          setIsLoading(false);
          setHasError(false);
        }}
        onLoadedMetadata={() => {
          setVideoAvailable(true);
          setIsLoading(false);
        }}
      />

      {/* Static Watermark - Title watermark */}
      {videoAvailable && !hasError && title && (
        <div
          className="video-watermark"
          style={{
            position: "absolute",
            top: "10px",
            right: "10px",
            color: "rgba(255, 255, 255, 0.3)",
            fontSize: "14px",
            fontWeight: 600,
            pointerEvents: "none",
            zIndex: 100,
            textShadow: "0 1px 3px rgba(0, 0, 0, 0.5)",
            userSelect: "none",
            WebkitUserSelect: "none",
            fontFamily:
              "-apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif",
          }}
        >
          {title || "Melaverse © Protected Content"}
        </div>
      )}

      {/* Dynamic Watermark - Shows user info or protection message, changes position every 10 seconds */}
      {videoAvailable && !hasError && <DynamicWatermark />}

      {/* Center Play Button - Show when paused and not loading */}
      {!playing && !isLoading && isOnline && (
        <div
          style={{
            position: "absolute",
            top: "50%",
            left: "50%",
            transform: "translate(-50%, -50%)",
            zIndex: 100,
            pointerEvents: "none",
            WebkitTapHighlightColor: "transparent",
          }}
        >
          <button
            onClick={(e) => {
              e.stopPropagation();
              togglePlay();
            }}
            style={{
              pointerEvents: "auto",
              background: "rgba(59, 130, 246, 0.9)", // Regular blue
              border: "none",
              color: "#fff",
              fontSize: 32,
              borderRadius: "50%",
              width: 80,
              height: 80,
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              cursor: "pointer",
              boxShadow:
                "0 4px 20px rgba(59, 130, 246, 0.8), 0 0 30px rgba(59, 130, 246, 0.3)",
              transition: "all 0.3s ease",
              WebkitTapHighlightColor: "transparent", // Fix iPhone touch
              touchAction: "manipulation", // Fix iPhone touch
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.transform = "scale(1.1)";
              e.currentTarget.style.boxShadow =
                "0 6px 25px rgba(59, 130, 246, 1), 0 0 40px rgba(59, 130, 246, 0.5)";
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.transform = "scale(1)";
              e.currentTarget.style.boxShadow =
                "0 4px 20px rgba(59, 130, 246, 0.8), 0 0 30px rgba(59, 130, 246, 0.3)";
            }}
            aria-label="Play"
          >
            <Play size={32} />
          </button>
        </div>
      )}

      {/* Loading Spinner Overlay - Only show when video is available but buffering */}
      {(isLoading || !isOnline) && videoAvailable && !hasError && src && (
        <div
          style={{
            position: "absolute",
            top: "50%",
            left: "50%",
            transform: "translate(-50%, -50%)",
            zIndex: 100,
            display: "flex",
            flexDirection: "column",
            alignItems: "center",
            justifyContent: "center",
            backgroundColor: "rgba(59, 130, 246, 0.9)", // Regular blue background
            borderRadius: "50%",
            width: "80px",
            height: "80px",
            pointerEvents: "none",
            boxShadow:
              "0 4px 20px rgba(59, 130, 246, 0.8), 0 0 30px rgba(59, 130, 246, 0.3)",
          }}
        >
          <CustomSpinner size={32} color="#fff" />
          {!isOnline && (
            <span
              style={{
                color: "#fff",
                fontSize: "12px",
                marginTop: "8px",
                textAlign: "center",
              }}
            >
              No Network
            </span>
          )}
        </div>
      )}

      {/* --- MOBILE CONTROLS --- */}
      {isMobile && (showControls || !videoAvailable || hasError || !src) && (
        <div
          style={{
            position: "absolute",
            left: 0,
            right: 0,
            bottom: 0,
            background: "rgba(30, 58, 138, 0.95)", // Dark blue background like in image
            padding: "8px 16px",
            borderBottomLeftRadius: 8,
            borderBottomRightRadius: 8,
            display: "flex",
            flexDirection: "row",
            alignItems: "center",
            gap: 12,
            zIndex: 100,
            WebkitTapHighlightColor: "transparent",
          }}
        >
          {/* Play/Pause Button */}
          <button
            onClick={(e) => {
              e.stopPropagation();
              togglePlay();
            }}
            title={playing ? "Pause" : "Play"}
            style={{
              background: "rgba(59, 130, 246, 0.8)", // Glassy blue background
              border: "none",
              color: "#fff",
              fontSize: 20,
              borderRadius: "50%",
              width: 40,
              height: 40,
              cursor: "pointer",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              boxShadow: "0 2px 8px rgba(59, 130, 246, 0.3)",
              WebkitTapHighlightColor: "transparent", // Fix iPhone touch
              touchAction: "manipulation", // Fix iPhone touch
              minHeight: "44px", // iOS minimum touch target
              minWidth: "44px", // iOS minimum touch target
            }}
          >
            {playing ? <Pause /> : <Play />}
          </button>

          {/* Progress Bar */}
          <div
            style={{ flex: 1, display: "flex", alignItems: "center", gap: 8 }}
          >
            <ProgressBar
              currentTime={currentTime}
              duration={duration}
              onSeek={handleSeek}
              buffered={buffered}
            />
          </div>

          {/* Time Display */}
          <span style={{ color: "#fff", fontSize: 14, minWidth: 50 }}>
            -{formatTime(duration - currentTime)}
          </span>

          {/* Volume Control */}
          <VolumeControl
            volume={volume}
            muted={muted}
            onVolumeChange={handleVolumeChange}
            onMuteToggle={handleMuteToggle}
          />

          {/* Settings Button (Mobile) */}
          <button
            onClick={(e) => {
              e.stopPropagation();
              handleSettingsToggle();
            }}
            title="Settings"
            data-settings-menu
            style={{
              background: showSettings
                ? "rgba(255, 255, 255, 0.2)"
                : "rgba(0, 0, 0, 0.3)",
              border: "none",
              color: "#fff",
              fontSize: 20,
              borderRadius: "8px",
              width: 40,
              height: 40,
              cursor: "pointer",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              transition: "all 0.2s",
              minHeight: "44px",
              minWidth: "44px",
              marginLeft: 8,
            }}
          >
            <Settings size={20} />
          </button>

          {/* Fullscreen Button */}
          <FullscreenButton
            onClick={handleFullscreen}
            isFullscreen={isFullscreen}
          />
        </div>
      )}

      {/* --- DESKTOP CONTROLS --- */}
      {!isMobile && (
        <div
          style={{
            position: "absolute",
            left: 0,
            right: 0,
            bottom: 0,
            opacity:
              showControls || !videoAvailable || hasError || !src ? 1 : 0,
            pointerEvents:
              showControls || !videoAvailable || hasError || !src
                ? "auto"
                : "none",
            transition: "opacity 0.3s",
            background: "rgba(30, 58, 138, 0.95)", // Dark blue background like in image
            padding: "8px 16px",
            borderBottomLeftRadius: 8,
            borderBottomRightRadius: 8,
            display: "flex",
            zIndex: 100,
            flexDirection: "row",
            alignItems: "center",
            gap: 12,
          }}
        >
          {/* Play/Pause Button */}
          <button
            onClick={(e) => {
              e.stopPropagation();
              togglePlay();
            }}
            title={playing ? "Pause" : "Play"}
            style={{
              background: "rgba(59, 130, 246, 0.8)", // Glassy blue background
              border: "none",
              color: "#fff",
              fontSize: 20,
              borderRadius: "50%",
              width: 40,
              height: 40,
              cursor: "pointer",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              boxShadow: "0 2px 8px rgba(59, 130, 246, 0.3)",
            }}
          >
            {playing ? <Pause /> : <Play />}
          </button>

          {/* Progress Bar */}
          <div
            style={{ flex: 1, display: "flex", alignItems: "center", gap: 8 }}
          >
            <ProgressBar
              currentTime={currentTime}
              duration={duration}
              onSeek={handleSeek}
              buffered={buffered}
            />
          </div>

          {/* Time Display */}
          <span style={{ color: "#fff", fontSize: 14, minWidth: 50 }}>
            -{formatTime(duration - currentTime)}
          </span>

          {/* Volume Control */}
          <VolumeControl
            volume={volume}
            muted={muted}
            onVolumeChange={handleVolumeChange}
            onMuteToggle={handleMuteToggle}
          />

          {/* Settings Button */}
          <button
            onClick={(e) => {
              e.stopPropagation();
              handleSettingsToggle();
            }}
            title="Settings"
            data-settings-menu
            style={{
              background: showSettings
                ? "rgba(255, 255, 255, 0.2)"
                : "rgba(0, 0, 0, 0.3)",
              border: "none",
              color: "#fff",
              fontSize: 20,
              borderRadius: "8px",
              width: 40,
              height: 40,
              cursor: "pointer",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              transition: "all 0.2s",
            }}
            onMouseEnter={(e) => {
              if (!showSettings) {
                e.currentTarget.style.background = "rgba(0, 0, 0, 0.5)";
              }
            }}
            onMouseLeave={(e) => {
              if (!showSettings) {
                e.currentTarget.style.background = "rgba(0, 0, 0, 0.3)";
              }
            }}
          >
            <Settings size={20} />
          </button>

          {/* Fullscreen Button */}
          <FullscreenButton
            onClick={handleFullscreen}
            isFullscreen={isFullscreen}
          />
        </div>
      )}

      {/* Settings Menu System */}
      {showSettings && (
        <div data-settings-menu>
          {settingsView === "menu" && (
            <SettingsMenu
              currentQuality={currentQuality}
              currentSpeed={speed}
              onQualityClick={handleSettingsQualityClick}
              onSpeedClick={handleSettingsSpeedClick}
              isHls={isHls}
              hlsLevels={hlsLevels}
              currentHlsLevel={currentHlsLevel}
            />
          )}

          {settingsView === "quality" && (
            <QualitySelector
              qualities={qualities}
              currentQuality={currentQuality}
              onQualityChange={handleQualityChangeFromSelector}
              onBack={handleSettingsBack}
              hlsLevels={hlsLevels}
              currentHlsLevel={currentHlsLevel}
              isHls={isHls}
            />
          )}

          {settingsView === "speed" && (
            <SpeedSelector
              currentSpeed={speed}
              onSpeedChange={handleSpeedChange}
              onBack={handleSettingsBack}
            />
          )}
        </div>
      )}
    </div>
  );
}

// Memoize the Player component to prevent unnecessary re-renders
// This is crucial for preventing video refresh when parent form re-renders
export default memo(Player);
