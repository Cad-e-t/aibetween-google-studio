
import React, { useRef, useState } from "react";
import { VideoClip } from "./types";
import { TimelineClip } from "./TimelineClip";

interface TimelineProps {
  clips: VideoClip[];
  currentTime: number;
  duration: number;
  onClipsUpdate: (clips: VideoClip[]) => void;
  onSeek: (time: number) => void;
}

export const Timeline: React.FC<TimelineProps> = ({
  clips,
  currentTime,
  duration,
  onClipsUpdate,
  onSeek,
}) => {
  const timelineRef = useRef<HTMLDivElement>(null);
  const [isDraggingPlayhead, setIsDraggingPlayhead] = useState(false);

  const zoom = 1; // Fixed zoom level
  const pixelsPerSecond = 100 * zoom;
  const timelineWidth = Math.max(duration * pixelsPerSecond, 2000);

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
    const minMajorInterval = 100; // Minimum pixels for a major interval
    let majorInterval = 5;
    if (pixelsPerSecond * 2 > minMajorInterval) majorInterval = 2;
    if (pixelsPerSecond * 1 > minMajorInterval) majorInterval = 1;

    for (let i = 0; i <= Math.ceil(duration); i++) {
        const isMajor = i % majorInterval === 0;
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
    <div className="flex flex-col bg-editor-panel rounded-lg overflow-hidden flex-shrink min-h-0 shadow-inner">
      <div className="relative h-8 bg-timeline-bg border-b border-border overflow-hidden flex-shrink-0">
        <div className="absolute inset-0" style={{ width: `${timelineWidth}px` }}>
          {renderTimeMarkers()}
        </div>
      </div>

      <div
        ref={timelineRef}
        className="relative h-28 bg-timeline-bg overflow-x-auto overflow-y-hidden cursor-crosshair flex-shrink-0"
        onClick={handleTimelineClick}
      >
        <div className="relative h-full" style={{ width: `${timelineWidth}px` }}>
          <div className="absolute inset-0 timeline-track-bg">
            <div className="h-full bg-timeline-track border-t border-border/50" />
          </div>

          {clips.map((clip) => (
            <TimelineClip
              key={clip.id}
              clip={clip}
              zoom={zoom}
              onUpdate={updateClip}
              onRemove={removeClip}
              pixelsPerSecond={pixelsPerSecond}
            />
          ))}

          <div
            className={`absolute top-0 bottom-0 w-0.5 bg-playhead cursor-ew-resize z-30 ${
              isDraggingPlayhead ? "shadow-lg shadow-playhead-glow/50" : ""
            }`}
            style={{ left: `${currentTime * pixelsPerSecond}px` }}
            onMouseDown={handlePlayheadDrag}
          >
            <div className="absolute -top-2 left-1/2 -translate-x-1/2 w-3 h-3 bg-playhead rotate-45 rounded-sm" />
            <div className="absolute top-0 left-1/2 -translate-x-1/2 w-px h-full bg-playhead shadow-[0_0_8px_rgba(56,189,248,0.6)]" />
          </div>
        </div>
      </div>
    </div>
  );
};
