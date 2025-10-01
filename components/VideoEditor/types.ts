
export interface VideoClip {
  id: string;
  url: string;
  name: string;
  duration: number;
  startTime: number;
  trimStart: number;
  trimEnd: number;
  trackIndex: number;
}

export interface TimelineState {
  clips: VideoClip[];
  currentTime: number;
  duration: number;
  isPlaying: boolean;
}
