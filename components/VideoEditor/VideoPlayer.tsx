
import React, { useEffect, useRef, forwardRef, useImperativeHandle, useState } from "react";
import { PlayIcon, PauseIcon } from "../Icons";
import { Button } from "../ui/Button";

interface VideoPlayerProps {
  currentTime: number;
  isPlaying: boolean;
  onTimeUpdate: (time: number) => void;
  onPlayPause: () => void;
  videoUrl: string;
}

export interface VideoPlayerHandle {
  seekTo: (time: number) => void;
  getDuration: () => number;
}

export const VideoPlayer = forwardRef<VideoPlayerHandle, VideoPlayerProps>(
  ({ currentTime, isPlaying, onTimeUpdate, onPlayPause, videoUrl }, ref) => {
    const videoRef = useRef<HTMLVideoElement>(null);
    const [duration, setDuration] = useState(0);

    useImperativeHandle(ref, () => ({
      seekTo: (time: number) => {
        if (videoRef.current) {
          videoRef.current.currentTime = time;
        }
      },
      getDuration: () => {
        return videoRef.current?.duration || 0;
      },
    }));

    useEffect(() => {
        if (videoRef.current) {
            if (isPlaying && videoUrl) {
                videoRef.current.play().catch(e => console.error("Play failed:", e));
            } else {
                videoRef.current.pause();
            }
        }
    }, [isPlaying, videoUrl]);

    useEffect(() => {
      if (videoRef.current && Math.abs(videoRef.current.currentTime - currentTime) > 0.2) {
        videoRef.current.currentTime = currentTime;
      }
    }, [currentTime]);


    const handleTimeUpdateEvent = () => {
      if (videoRef.current) {
        onTimeUpdate(videoRef.current.currentTime);
      }
    };

    const handleLoadedMetadata = () => {
        if(videoRef.current) {
            setDuration(videoRef.current.duration);
        }
    };
    
    const handleSeek = (e: React.ChangeEvent<HTMLInputElement>) => {
        if(videoRef.current) {
            const time = parseFloat(e.target.value);
            // This is a seek on the player's own timeline, which corresponds to video time.
            // We notify the parent, which will translate it to main timeline time.
            onTimeUpdate(time);
        }
    }

    const formatTime = (seconds: number) => {
      const mins = Math.floor(seconds / 60);
      const secs = Math.floor(seconds % 60);
      return `${mins.toString().padStart(2, "0")}:${secs.toString().padStart(2, "0")}`;
    };

    return (
      <div className="flex flex-col items-center gap-4 bg-editor-panel p-4 rounded-lg flex-shrink min-h-0 shadow-md w-full max-w-3xl">
        <div className="relative w-full aspect-video bg-black rounded-lg overflow-hidden shadow-inner">
          <video
            key={videoUrl}
            ref={videoRef}
            className="w-full h-full object-contain"
            onTimeUpdate={handleTimeUpdateEvent}
            onLoadedMetadata={handleLoadedMetadata}
          >
            {videoUrl && <source src={videoUrl} type="video/mp4" />}
          </video>
        </div>

        <div className="flex items-center gap-4 w-full">
          <Button
            size="sm"
            onClick={onPlayPause}
            className="bg-primary hover:bg-primary/90 transition-all flex-shrink-0 rounded-full h-10 w-10 p-2"
            aria-label={isPlaying ? "Pause" : "Play"}
          >
            {isPlaying ? (
              <PauseIcon className="h-5 w-5 text-primary-foreground" />
            ) : (
              <PlayIcon className="h-5 w-5 ml-0.5 text-primary-foreground" />
            )}
          </Button>
          
          <div className="flex-1 flex items-center gap-3">
              <span className="text-sm font-mono text-foreground tabular-nums w-14 text-center" aria-label="Current time">
                {formatTime(currentTime)}
              </span>
              <input 
                type="range"
                min="0"
                max={duration || 0}
                step="0.01"
                value={currentTime}
                onChange={handleSeek}
                className="w-full h-2 bg-timeline-bg rounded-full appearance-none cursor-pointer accent-primary"
                aria-label="Seek video"
              />
              <span className="text-sm font-mono text-muted-foreground tabular-nums w-14 text-center" aria-label="Total duration">
                {formatTime(duration)}
              </span>
          </div>
        </div>
      </div>
    );
  }
);

VideoPlayer.displayName = "VideoPlayer";