import React, { useRef, useState } from "react";
import { VideoClip } from "./types";
import { GripVerticalIcon, XIcon } from "../Icons";
import { Button } from "../ui/Button";

interface TimelineClipProps {
  clip: VideoClip;
  zoom: number;
  onUpdate: (clip: VideoClip) => void;
  onRemove: (clipId: string) => void;
  pixelsPerSecond: number;
  trackHeight: number;
  trackGap: number;
}

export const TimelineClip: React.FC<TimelineClipProps> = ({ clip, onUpdate, onRemove, pixelsPerSecond, trackHeight, trackGap }) => {
  const clipRef = useRef<HTMLDivElement>(null);
  const [isDragging, setIsDragging] = useState(false);
  const [isResizingStart, setIsResizingStart] = useState(false);
  const [isResizingEnd, setIsResizingEnd] = useState(false);

  const clipDuration = clip.trimEnd - clip.trimStart;
  const clipWidth = clipDuration * pixelsPerSecond;

  const handleMouseDown = (e: React.MouseEvent, action: "move" | "trim-start" | "trim-end") => {
    e.preventDefault();
    e.stopPropagation();

    const startX = e.clientX;
    const startY = e.clientY;
    const originalStartTime = clip.startTime;
    const originalTrimStart = clip.trimStart;
    const originalTrimEnd = clip.trimEnd;
    const originalTrackIndex = clip.trackIndex;

    if (action === "move") setIsDragging(true);
    if (action === "trim-start") setIsResizingStart(true);
    if (action === "trim-end") setIsResizingEnd(true);

    const handleMouseMove = (e: MouseEvent) => {
      
      if (action === "move") {
        const deltaX = e.clientX - startX;
        const deltaTime = deltaX / pixelsPerSecond;

        const deltaY = e.clientY - startY;
        const trackDelta = Math.round(deltaY / (trackHeight + trackGap));
        const newTrackIndex = Math.max(0, originalTrackIndex + trackDelta);

        onUpdate({
          ...clip,
          startTime: Math.max(0, originalStartTime + deltaTime),
          trackIndex: newTrackIndex,
        });
      } else if (action === "trim-start") {
        const deltaX = e.clientX - startX;
        const deltaTime = deltaX / pixelsPerSecond;
        const newTrimStart = Math.max(0, Math.min(originalTrimEnd - 0.1, originalTrimStart + deltaTime));
        const trimDelta = newTrimStart - originalTrimStart;
        onUpdate({
          ...clip,
          trimStart: newTrimStart,
          startTime: originalStartTime + trimDelta,
        });
      } else if (action === "trim-end") {
        const deltaX = e.clientX - startX;
        const deltaTime = deltaX / pixelsPerSecond;
        const newTrimEnd = Math.max(originalTrimStart + 0.1, Math.min(clip.duration, originalTrimEnd + deltaTime));
        onUpdate({
          ...clip,
          trimEnd: newTrimEnd,
        });
      }
    };

    const handleMouseUp = () => {
      setIsDragging(false);
      setIsResizingStart(false);
      setIsResizingEnd(false);
      document.removeEventListener("mousemove", handleMouseMove);
      document.removeEventListener("mouseup", handleMouseUp);
    };

    document.addEventListener("mousemove", handleMouseMove);
    document.addEventListener("mouseup", handleMouseUp);
  };

  return (
    <div
      ref={clipRef}
      className={`absolute bg-clip-bg/80 backdrop-blur-sm border-2 border-clip-border rounded-md overflow-hidden cursor-grab active:cursor-grabbing transition-shadow group ${
        isDragging || isResizingStart || isResizingEnd ? "shadow-lg shadow-primary/50 z-20" : "z-10"
      }`}
      style={{
        left: `${clip.startTime * pixelsPerSecond}px`,
        width: `${clipWidth}px`,
        top: `${clip.trackIndex * (trackHeight + trackGap) + trackGap / 2}px`,
        height: `${trackHeight}px`,
      }}
      onMouseDown={(e) => handleMouseDown(e, "move")}
    >
      <div
        className="absolute left-0 top-0 bottom-0 w-2.5 bg-primary/50 cursor-ew-resize hover:bg-primary transition-colors z-20 opacity-0 group-hover:opacity-100 rounded-l-sm"
        onMouseDown={(e) => handleMouseDown(e, "trim-start")}
      />

      <div className="h-full flex items-center justify-between px-2 pointer-events-none">
        <div className="flex items-center gap-1.5 min-w-0">
          <GripVerticalIcon className="h-4 w-4 text-primary-foreground/70 flex-shrink-0" />
          <span className="text-sm font-medium truncate text-primary-foreground">{clip.name}</span>
        </div>
        <Button
          size="sm"
          variant="ghost"
          className="h-6 w-6 p-0 opacity-0 group-hover:opacity-100 transition-opacity pointer-events-auto hover:bg-destructive/20 hover:text-destructive z-20"
          onClick={(e) => {
            e.stopPropagation();
            onRemove(clip.id);
          }}
        >
          <XIcon className="h-4 w-4" />
        </Button>
      </div>

      <div
        className="absolute right-0 top-0 bottom-0 w-2.5 bg-primary/50 cursor-ew-resize hover:bg-primary transition-colors z-20 opacity-0 group-hover:opacity-100 rounded-r-sm"
        onMouseDown={(e) => handleMouseDown(e, "trim-end")}
      />
    </div>
  );
};