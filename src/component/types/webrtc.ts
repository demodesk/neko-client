export interface WebRTCStats {
  paused: boolean
  bitrate: number
  packetLoss: number
  fps: number
  width: number
  height: number
  muted?: boolean
  report: RTCStatsReport
}

export interface CursorPosition {
  x: number
  y: number
}

export interface CursorImage {
  width: number
  height: number
  x: number
  y: number
  uri: string
}
