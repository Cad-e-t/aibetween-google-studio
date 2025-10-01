
import React, { useState, useRef, useEffect } from "react";
import { VideoPlayer, VideoPlayerHandle } from "../components/VideoEditor/VideoPlayer";
import { Timeline } from "../components/VideoEditor/Timeline";
import { VideoClip, TimelineState } from "../components/VideoEditor/types";
import { FilmIcon } from '../components/Icons';

const VideoEditor: React.FC = () => {
  const videoPlayerRef = useRef<VideoPlayerHandle>(null);
  const [state, setState] = useState<TimelineState>({
    clips: [
      {
        id: "clip-1",
        url: "https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/BigBuckBunny.mp4",
        name: "Big Buck Bunny",
        duration: 596,
        startTime: 0,
        trimStart: 0,
        trimEnd: 30,
        trackIndex: 0,
      },
    ],
    currentTime: 0,
    duration: 30,
    isPlaying: false,
  });

  const activeClip = state.clips.find(
    (clip) =>
      state.currentTime >= clip.startTime &&
      state.currentTime < clip.startTime + (clip.trimEnd - clip.trimStart)
  );

  useEffect(() => {
    const videoElement = document.querySelector('video');
    const handleMetadata = () => {
      if (videoPlayerRef.current) {
        const duration = videoPlayerRef.current.getDuration();
        if (duration > 0 && duration !== state.duration) {
          setState((prev) => ({ 
            ...prev, 
            duration: prev.clips.reduce((max, clip) => Math.max(max, clip.startTime + (clip.trimEnd - clip.trimStart)), 0)
          }));
        }
      }
    };
    if (videoElement) {
      videoElement.addEventListener('loadedmetadata', handleMetadata);
    }
    return () => {
      if (videoElement) {
        videoElement.removeEventListener('loadedmetadata', handleMetadata);
      }
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [state.clips]);

  const handlePlayerTimeUpdate = (videoTime: number) => {
    if (activeClip) {
      const newTimelineTime = (videoTime - activeClip.trimStart) + activeClip.startTime;
      const clipDuration = activeClip.trimEnd - activeClip.trimStart;
      const clipEndTimeOnTimeline = activeClip.startTime + clipDuration;
      
      if (newTimelineTime >= clipEndTimeOnTimeline) {
         setState(prev => ({...prev, isPlaying: false, currentTime: clipEndTimeOnTimeline }));
      } else {
        setState(prev => ({ ...prev, currentTime: newTimelineTime }));
      }
    }
  };

  const handlePlayPause = () => {
    // If we are at the end of the timeline, and there's a clip there, seek to start of that clip
    if (state.currentTime === state.duration && activeClip) {
      handleSeek(activeClip.startTime);
    }
    setState((prev) => ({ ...prev, isPlaying: !prev.isPlaying }));
  };

  const handleSeek = (time: number) => {
    setState((prev) => ({ ...prev, currentTime: time, isPlaying: false }));
    const clipAtTime = state.clips.find(
      (clip) => time >= clip.startTime && time < clip.startTime + (clip.trimEnd - clip.trimStart)
    );

    if (clipAtTime) {
      const playerTimeToSeek = (time - clipAtTime.startTime) + clipAtTime.trimStart;
      videoPlayerRef.current?.seekTo(playerTimeToSeek);
    }
  };

  const handleClipsUpdate = (clips: VideoClip[]) => {
    const newDuration = clips.reduce((max, clip) => Math.max(max, clip.startTime + (clip.trimEnd - clip.trimStart)), 30);
    setState((prev) => ({ ...prev, clips, duration: newDuration }));
  };
  
  const playerTime = activeClip
    ? (state.currentTime - activeClip.startTime) + activeClip.trimStart
    : 0;

  return (
    <div className="h-screen bg-editor-bg text-foreground flex flex-col overflow-hidden">
      <header className="h-12 bg-editor-panel border-b border-border flex items-center px-4 flex-shrink-0 z-10 shadow-md">
        <div className="flex items-center gap-2">
          <FilmIcon className="h-5 w-5 text-primary" />
          <h1 className="text-lg font-semibold text-foreground">Video Editor</h1>
        </div>
      </header>

      <div className="flex flex-col gap-2 px-2 flex-1 overflow-hidden min-h-0">
        <div className="flex-1 flex items-center justify-center min-h-0">
          <VideoPlayer
            ref={videoPlayerRef}
            currentTime={playerTime}
            isPlaying={state.isPlaying && !!activeClip}
            onTimeUpdate={handlePlayerTimeUpdate}
            onPlayPause={handlePlayPause}
            videoUrl={activeClip?.url || ""}
          />
        </div>

        <Timeline
          clips={state.clips}
          currentTime={state.currentTime}
          duration={state.duration}
          onClipsUpdate={handleClipsUpdate}
          onSeek={handleSeek}
        />
      </div>
    </div>
  );
};

export default VideoEditor;
