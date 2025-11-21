"use client";
import React, { useRef, useState, useEffect, memo } from "react";
import { Play, Pause } from "lucide-react";
import Playlist from "./Playlist";
import ProgressBar from "./ProgressBar";
import VolumeControl from "./VolumeControl";
import FullscreenButton from "./FullScreen";
import CustomSpinner from "./CustomSpinner";
import { VideoItem } from "../../types";
import { cn } from "@/lib/utils";
import "./VideoProtection.css";

interface PlayerProps {
  src: string;
  type?: "url" | "local";
  playlist?: VideoItem[];
  title?: string;
  poster?: string; // Thumbnail image URL
  onVideoPlay?: () => void;
  onVideoPause?: () => void;
}

function Player({
  src,
  type = "local",
  playlist = [],
  title,
  poster,
  onVideoPlay,
  onVideoPause,
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
  const controlsTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  
  // Reset video availability when src changes
  useEffect(() => {
    if (src) {
      setVideoAvailable(false);
      setHasError(false);
      setIsLoading(true);
      setHasStartedPlaying(false); // Reset when video changes
    } else {
      setVideoAvailable(false);
      setHasError(true);
      setIsLoading(false);
    }
  }, [src]);

  // Compute the video source based on type
  let videoSrc = src;
  if (type === "local") {
    videoSrc = `/api/stream?file=${encodeURIComponent(src)}`;
  } else if (type === "url" && !src.startsWith("blob:")) {
    videoSrc = `/api/remote-stream?url=${encodeURIComponent(src)}`;
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
    const handleError = () => setIsLoading(false);

    video.addEventListener("timeupdate", updateTime);
    video.addEventListener("loadedmetadata", updateDuration);
    video.addEventListener("progress", updateBuffered);
    video.addEventListener("loadstart", handleLoadStart);
    video.addEventListener("canplay", handleCanPlay);
    video.addEventListener("waiting", handleWaiting);
    video.addEventListener("playing", handlePlaying);
    video.addEventListener("error", handleError);

    return () => {
      video.removeEventListener("timeupdate", updateTime);
      video.removeEventListener("loadedmetadata", updateDuration);
      video.removeEventListener("progress", updateBuffered);
      video.removeEventListener("loadstart", handleLoadStart);
      video.removeEventListener("canplay", handleCanPlay);
      video.removeEventListener("waiting", handleWaiting);
      video.removeEventListener("playing", handlePlaying);
      video.removeEventListener("error", handleError);
    };
  }, [currentSrc]);

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

  const togglePlay = () => {
    const video = videoRef.current;
    if (!video) return;
    if (video.paused) {
      video.play();
    } else {
      video.pause();
    }
  };

  const changeSpeed = (newSpeed: number) => {
    setSpeed(newSpeed);
    const video = videoRef.current;
    if (video) video.playbackRate = newSpeed;
  };

  const handleVolumeChange = (v: number) => setVolume(v);
  const handleMuteToggle = () => setMuted((m) => !m);

  const handleSeek = (time: number) => {
    const video = videoRef.current;
    if (video) video.currentTime = time;
    setCurrentTime(time);
  };

  const handleSelect = (idx: number) => {
    setCurrentVideoIndex(idx);
    setPlaying(false);
  };

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = Math.floor(seconds % 60);
    return `${mins}:${secs < 10 ? "0" : ""}${secs}`;
  };

  return (
    <div
      ref={containerRef}
      className="video-player"
      style={{
        height: isFullscreen && isMobile && isLandscape ? "100vh" : "auto",
        width: isFullscreen && isMobile && isLandscape ? "100vw" : "100%",
      }}
    >
      <div
        onMouseEnter={() => !isMobile && setShowControls(true)}
        onMouseLeave={() => !isMobile && setShowControls(false)}
        onContextMenu={(e) => e.preventDefault()} // Disable right-click on container
        onKeyDown={(e) => {
          // Prevent download shortcuts (Ctrl+S, Cmd+S, etc.)
          if ((e.ctrlKey || e.metaKey) && (e.key === 's' || e.key === 'S')) {
            e.preventDefault();
          }
        }}
        className={cn(
          "relative max-md:w-full",
          isFullscreen ? "md:w-full" : "md:w-[70%]"
        )}
        style={{
          height: isFullscreen && isMobile && isLandscape ? "100vh" : "auto",
          width: isFullscreen && isMobile && isLandscape ? "100vw" : "100%",
          position: "relative", // Critical for iOS
          overflow: "hidden",
          backgroundColor: "#000",
          minHeight: isMobile ? "200px" : "400px", // Smaller min height on mobile
          aspectRatio: "16/9",
          userSelect: "none", // Disable text/element selection
          WebkitUserSelect: "none",
          MozUserSelect: "none",
        }}
      >
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
                  e.currentTarget.style.transform = "translate(-50%, -50%) scale(1.1)";
                  e.currentTarget.style.background = "rgba(59, 130, 246, 1)";
                }
              }}
              onMouseLeave={(e) => {
                if (!isMobile) {
                  e.currentTarget.style.transform = "translate(-50%, -50%) scale(1)";
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
          src={currentSrc}
          poster={poster} // Add poster attribute for native fallback
          playsInline
          preload="metadata"
          webkit-playsinline="true"
          x-webkit-airplay="allow"
          width="100%"
          height="auto"
          controlsList="nodownload nofullscreen noremoteplayback" // Disable download button
          disablePictureInPicture // Disable PiP
          disableRemotePlayback // Disable casting
          onContextMenu={(e) => e.preventDefault()} // Disable right-click
          style={{
            borderRadius: isFullscreen && isMobile && isLandscape ? 0 : 8,
            width: "100%",
            height: isFullscreen && isMobile && isLandscape ? "100vh" : "auto",
            objectFit:
              isFullscreen && isMobile && isLandscape ? "cover" : "contain",
            display: videoAvailable && !hasError ? "block" : "none",
            position: "relative",
            zIndex: 1,
            WebkitTapHighlightColor: "transparent",
            touchAction: "manipulation",
            pointerEvents: "auto", // Enable interaction but with protections
            userSelect: "none", // Disable text selection
            WebkitUserSelect: "none", // Safari
            MozUserSelect: "none", // Firefox
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

        {/* Watermark Overlay - Deters screen recording and shows ownership */}
        {videoAvailable && !hasError && (
          <div className="video-watermark">
            {title || "Melaverse © Protected Content"}
          </div>
        )}

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
        {isMobile && (showControls || (!videoAvailable || hasError || !src)) && (
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
              opacity: (showControls || (!videoAvailable || hasError || !src)) ? 1 : 0,
              pointerEvents: (showControls || (!videoAvailable || hasError || !src)) ? "auto" : "none",
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

            {/* Speed Control */}
            <button
              onClick={(e) => {
                e.stopPropagation();
                changeSpeed(speed >= 2 ? 1 : speed + 0.25);
              }}
              style={{
                background: "rgba(59, 130, 246, 0.6)",
                border: "none",
                color: "#fff",
                fontSize: 14,
                cursor: "pointer",
                padding: "4px 8px",
                borderRadius: 4,
              }}
              title="Change Speed"
            >
              {speed}x
            </button>

            {/* Fullscreen Button */}
            <FullscreenButton
              onClick={handleFullscreen}
              isFullscreen={isFullscreen}
            />
          </div>
        )}
      </div>
      {playlist.length > 0 && (
        <div style={{ width: "100%", maxWidth: 640, marginTop: 16 }}>
          <Playlist
            videos={playlist}
            currentVideoId={playlist[currentVideoIndex]?.id}
            onSelect={(_id) => {
              const idx = playlist.findIndex((v) => v.id === _id);
              if (idx !== -1) handleSelect(idx);
            }}
          />
        </div>
      )}
    </div>
  );
}

// Memoize the Player component to prevent unnecessary re-renders
// This is crucial for preventing video refresh when parent form re-renders
export default memo(Player);
