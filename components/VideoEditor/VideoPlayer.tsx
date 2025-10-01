// Fix: Import `useState` from React to resolve 'Cannot find name' errors.
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
  ({ isPlaying, onPlayPause, videoUrl }, ref) => {
    const videoRef = useRef<HTMLVideoElement>(null);
    const lastPlayedUrl = useRef<string | null>(null);
    const [duration, setDuration] = useState(0);
    const [playerTime, setPlayerTime] = useState(0);

    useImperativeHandle(ref, () => ({
      seekTo: (time: number) => {
        if (videoRef.current) {
          videoRef.current.currentTime = time;
          setPlayerTime(time);
        }
      },
      getDuration: () => {
        return videoRef.current?.duration || 0;
      },
    }));

    useEffect(() => {
        if (videoRef.current) {
            if (isPlaying && videoUrl) {
                if (lastPlayedUrl.current !== videoUrl) {
                    videoRef.current.load();
                }
                videoRef.current.play().catch(e => console.error("Play failed:", e));
                lastPlayedUrl.current = videoUrl;
            } else {
                videoRef.current.pause();
            }
        }
    }, [isPlaying, videoUrl]);


    const handleTimeUpdate = () => {
      if (videoRef.current) {
        setPlayerTime(videoRef.current.currentTime);
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
            videoRef.current.currentTime = time;
            setPlayerTime(time);
        }
    }

    const formatTime = (seconds: number) => {
      const mins = Math.floor(seconds / 60);
      const secs = Math.floor(seconds % 60);
      return `${mins.toString().padStart(2, "0")}:${secs.toString().padStart(2, "0")}`;
    };

    return (
      <div className="flex flex-col items-center gap-4 bg-editor-panel p-4 rounded-lg flex-shrink min-h-0 shadow-md">
        <div className="relative w-full max-w-2xl aspect-video bg-black rounded-lg overflow-hidden shadow-inner">
          <video
            key={videoUrl}
            ref={videoRef}
            className="w-full h-full object-contain"
            onTimeUpdate={handleTimeUpdate}
            onLoadedMetadata={handleLoadedMetadata}
          >
            {videoUrl && <source src={videoUrl} type="video/mp4" />}
          </video>
        </div>

        <div className="flex items-center gap-4 w-full max-w-2xl">
          <Button
            size="sm"
            onClick={onPlayPause}
            className="bg-primary hover:bg-primary/90 transition-all flex-shrink-0 rounded-full h-10 w-10 p-2"
          >
            {isPlaying ? (
              <PauseIcon className="h-5 w-5 text-primary-foreground" />
            ) : (
              <PlayIcon className="h-5 w-5 ml-0.5 text-primary-foreground" />
            )}
          </Button>
          
          <div className="flex-1 flex items-center gap-3">
              <span className="text-sm font-mono text-foreground tabular-nums w-14 text-center">
                {formatTime(playerTime)}
              </span>
              <input 
                type="range"
                min="0"
                max={duration || 0}
                value={playerTime}
                onChange={handleSeek}
                className="w-full h-2 bg-timeline-bg rounded-full appearance-none cursor-pointer accent-primary"
              />
              <span className="text-sm font-mono text-muted-foreground tabular-nums w-14 text-center">
                {formatTime(duration)}
              </span>
          </div>

        </div>
      </div>
    );
  }
);

VideoPlayer.displayName = "VideoPlayer";