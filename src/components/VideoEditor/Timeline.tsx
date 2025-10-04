import React, { useRef, useState } from "react";
import { VideoClip } from "./types";
import { TimelineClip } from "./TimelineClip";
import { PlusIcon, ZoomInIcon, ZoomOutIcon } from "../Icons";

interface TimelineProps {
  clips: VideoClip[];
  currentTime: number;
  duration: number;
  onClipsUpdate: (clips: VideoClip[]) => void;
  onSeek: (time: number) => void;
  onAddClip: () => void;
  zoom: number;
  onZoomChange: (zoom: number) => void;
}

export const Timeline: React.FC<TimelineProps> = ({
  clips,
  currentTime,
  duration,
  onClipsUpdate,
  onSeek,
  onAddClip,
  zoom,
  onZoomChange,
}) => {
  const timelineRef = useRef<HTMLDivElement>(null);
  const [isDraggingPlayhead, setIsDraggingPlayhead] = useState(false);
  const [scrollLeft, setScrollLeft] = useState(0);

  const pixelsPerSecond = 50 * zoom;
  const timelineWidth = Math.max(duration * pixelsPerSecond, 2000);

  const trackHeight = 48;
  const trackGap = 4;
  const numTracks = clips.length > 0 ? Math.max(...clips.map((c) => c.trackIndex)) + 2 : 2;
  const timelineContentHeight = numTracks * (trackHeight + trackGap);

  const handleTimelineClick = (e: React.MouseEvent<HTMLDivElement>) => {
    if (timelineRef.current && (e.target === e.currentTarget || (e.target as HTMLElement).closest('.timeline-track-bg'))) {
      const rect = timelineRef.current.getBoundingClientRect();
      const x = e.clientX - rect.left + timelineRef.current.scrollLeft;
      const time = x / pixelsPerSecond;
      onSeek(Math.max(0, Math.min(duration, time)));
    }
  };

  const handlePlayheadDrag = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDraggingPlayhead(true);

    const handleMouseMove = (e: MouseEvent) => {
      if (timelineRef.current) {
        const rect = timelineRef.current.getBoundingClientRect();
        const x = e.clientX - rect.left + timelineRef.current.scrollLeft;
        const time = x / pixelsPerSecond;
        onSeek(Math.max(0, Math.min(duration, time)));
      }
    };

    const handleMouseUp = () => {
      setIsDraggingPlayhead(false);
      document.removeEventListener("mousemove", handleMouseMove);
      document.removeEventListener("mouseup", handleMouseUp);
    };

    document.addEventListener("mousemove", handleMouseMove);
    document.addEventListener("mouseup", handleMouseUp);
  };

  const updateClip = (updatedClip: VideoClip) => {
    onClipsUpdate(clips.map((c) => (c.id === updatedClip.id ? updatedClip : c)));
  };

  const removeClip = (clipId: string) => {
    onClipsUpdate(clips.filter((c) => c.id !== clipId));
  };

  const renderTimeMarkers = () => {
    const markers = [];
    const minMajorIntervalPx = 80;

    let majorIntervalSec = 60; // 1 minute
    if (pixelsPerSecond * 30 > minMajorIntervalPx) majorIntervalSec = 30;
    if (pixelsPerSecond * 10 > minMajorIntervalPx) majorIntervalSec = 10;
    if (pixelsPerSecond * 5 > minMajorIntervalPx) majorIntervalSec = 5;
    if (pixelsPerSecond * 2 > minMajorIntervalPx) majorIntervalSec = 2;
    if (pixelsPerSecond * 1 > minMajorIntervalPx) majorIntervalSec = 1;
    
    const minorIntervalSec = majorIntervalSec / 5;

    for (let i = 0; i <= Math.ceil(duration / minorIntervalSec) * minorIntervalSec; i += minorIntervalSec) {
        const isMajor = i % majorIntervalSec === 0;
        
        markers.push(
          <div
            key={`marker-${i}`}
            className="absolute top-0 bottom-0 flex flex-col items-center"
            style={{ left: `${i * pixelsPerSecond}px` }}
          >
            <div className={`w-px ${isMajor ? 'h-3 bg-muted-foreground' : 'h-2 bg-muted-foreground/50'}`} />
            {isMajor && (
              <span className="text-xs text-muted-foreground mt-1 font-mono tabular-nums select-none">
                {Math.floor(i / 60)}:{(i % 60).toString().padStart(2, "0")}
              </span>
            )}
          </div>
        );
    }
    return markers;
  };
  

  return (
    <div className="relative flex flex-col bg-editor-panel rounded-lg overflow-hidden flex-shrink-0 min-h-0 shadow-inner max-h-64">
      <div className="relative h-8 bg-timeline-bg border-b border-border overflow-hidden flex-shrink-0 z-20">
        <div 
            className="absolute inset-0" 
            style={{ width: `${timelineWidth}px`, left: `-${scrollLeft}px` }}
        >
          {renderTimeMarkers()}
        </div>
        <div className="absolute right-4 top-1/2 -translate-y-1/2 flex items-center gap-2 z-20">
          <button onClick={() => onZoomChange(Math.max(0.05, zoom / 1.5))} aria-label="Zoom out">
            <ZoomOutIcon className="w-4 h-4 text-muted-foreground hover:text-foreground transition-colors" />
          </button>
          <input
            type="range"
            min="0.05"
            max="5"
            step="0.01"
            value={zoom}
            onChange={(e) => onZoomChange(parseFloat(e.target.value))}
            className="w-32 h-1 bg-timeline-track rounded-full appearance-none cursor-pointer accent-primary"
            aria-label="Zoom timeline"
          />
          <button onClick={() => onZoomChange(Math.min(5, zoom * 1.5))} aria-label="Zoom in">
            <ZoomInIcon className="w-4 h-4 text-muted-foreground hover:text-foreground transition-colors" />
          </button>
        </div>
      </div>

      <div
        ref={timelineRef}
        className="relative bg-timeline-bg overflow-auto cursor-crosshair flex-shrink-0 z-10"
        onClick={handleTimelineClick}
        onScroll={(e) => setScrollLeft(e.currentTarget.scrollLeft)}
      >
        <div className="relative h-full" style={{ width: `${timelineWidth}px`, height: `${timelineContentHeight}px` }}>
            {Array.from({ length: numTracks }).map((_, i) => (
                <div
                key={`track-bg-${i}`}
                className="absolute w-full timeline-track-bg"
                style={{
                    top: `${i * (trackHeight + trackGap)}px`,
                    height: `${trackHeight + trackGap}px`,
                }}
                >
                <div className="h-full bg-timeline-track border-t border-b border-border/50" style={{ marginTop: `${trackGap/2}px`, height: `${trackHeight}px` }}/>
                </div>
            ))}


          {clips.map((clip) => (
            <TimelineClip
              key={clip.id}
              clip={clip}
              zoom={zoom}
              onUpdate={updateClip}
              onRemove={removeClip}
              pixelsPerSecond={pixelsPerSecond}
              trackHeight={trackHeight}
              trackGap={trackGap}
            />
          ))}
        </div>
      </div>
      
      <div
        className={`absolute top-0 bottom-0 w-0.5 bg-playhead cursor-ew-resize z-30 ${
            isDraggingPlayhead ? "shadow-lg shadow-playhead-glow/50" : ""
        }`}
        style={{ left: `${currentTime * pixelsPerSecond - scrollLeft}px` }}
        onMouseDown={handlePlayheadDrag}
      >
        <div className="absolute top-8 -left-px -right-px bottom-0 shadow-[0_0_8px_rgba(56,189,248,0.6)]" />
        <button
            onClick={(e) => {
                e.stopPropagation();
                onAddClip();
            }}
            className="absolute top-0 left-1/2 -translate-x-1/2 w-8 h-8 bg-primary rounded-full flex items-center justify-center text-primary-foreground shadow-lg hover:bg-primary/90 transition-transform hover:scale-110 z-10 cursor-pointer"
            aria-label="Add clip at playhead"
            onMouseDown={(e) => e.stopPropagation()}
        >
            <PlusIcon className="w-5 h-5" />
        </button>
        <div className="absolute top-7 left-1/2 -translate-x-1/2 w-3 h-3 bg-playhead rotate-45 rounded-sm" />
      </div>
    </div>
  );
};