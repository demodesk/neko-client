import EventEmitter from 'eventemitter3'
import { SYSTEM_HEARTBEAT, SYSTEM_LOGS } from '../types/events'
import { Logger } from '../utils/logger'

export interface NekoWebSocketEvents {
  connected: () => void
  disconnected: (error?: Error) => void
  message: (event: string, payload: any) => void
}

const statusCodeMap = {
  1000: 'Normal Closure',
  1001: 'Going Away',
  1002: 'Protocol Error',
  1003: 'Unsupported Data',
  1004: '(For future)',
  1005: 'No Status Received',
  1006: 'Abnormal Closure',
  1007: 'Invalid frame payload data',
  1008: 'Policy Violation',
  1009: 'Message too big',
  1010: 'Missing Extension',
  1011: 'Internal Error',
  1012: 'Service Restart',
  1013: 'Try Again Later',
  1014: 'Bad Gateway',
  1015: 'TLS Handshake',
} as Record<number, string>

// how long can connection be idle before closing
const staleTimeout = 12_500 // 12.5 seconds

// how often should heartbeat be evaluated
const staleInterval = 7_000 // 7 seconds

export class NekoWebSocket extends EventEmitter<NekoWebSocketEvents> {
  private _ws?: WebSocket
  private _heartbeat?: number
  private _last_received?: Date

  // eslint-disable-next-line
  constructor(
    private readonly _log: Logger = new Logger('websocket'),
  ) {
    super()
  }

  get supported() {
    return typeof WebSocket !== 'undefined' && WebSocket.OPEN === 1
  }

  get connected() {
    return typeof this._ws !== 'undefined' && this._ws.readyState === WebSocket.OPEN
  }

  public connect(url: string) {
    if (!this.supported) {
      throw new Error('browser does not support websockets')
    }

    if (this.connected) {
      throw new Error('attempting to create websocket while connection open')
    }

    if (typeof this._ws !== 'undefined') {
      this._log.debug(`previous websocket connection needs to be closed`)
      this.disconnect('connection replaced')
    }

    this._ws = new WebSocket(url)

    this._log.info(`connecting`)

    this._ws.onopen = this.onConnected.bind(this)
    this._ws.onclose = (e: CloseEvent) => {
      let reason = 'close'

      if (e.code in statusCodeMap) {
        reason = statusCodeMap[e.code]
      }

      this.onDisconnected(reason)
    }
    this._ws.onerror = this.onDisconnected.bind(this, 'error')
    this._ws.onmessage = this.onMessage.bind(this)
  }

  public disconnect(reason: string) {
    this._last_received = undefined

    if (this._heartbeat) {
      window.clearInterval(this._heartbeat)
      this._heartbeat = undefined
    }

    if (typeof this._ws !== 'undefined') {
      // unmount all events
      this._ws.onopen = () => {}
      this._ws.onclose = () => {}
      this._ws.onerror = () => {}
      this._ws.onmessage = () => {}

      try {
        this._ws.close(1000, reason)
      } catch {}

      this._ws = undefined
    }
  }

  public send(event: string, payload?: any) {
    if (!this.connected) {
      this._log.warn(`attempting to send message while disconnected`)
      return
    }

    if (event != SYSTEM_LOGS) this._log.debug(`sending websocket event`, { event, payload })
    this._ws!.send(JSON.stringify({ event, payload }))
  }

  private onMessage(e: MessageEvent) {
    const { event, payload } = JSON.parse(e.data)

    this._last_received = new Date()
    // heartbeat only updates last_received
    if (event == SYSTEM_HEARTBEAT) return

    this._log.debug(`received websocket event`, { event, payload })
    this.emit('message', event, payload)
  }

  private onConnected() {
    if (!this.connected) {
      this._log.warn(`onConnected called while being disconnected`)
      return
    }

    // periodically check heartbeat
    if (this._heartbeat) window.clearInterval(this._heartbeat)
    this._heartbeat = window.setInterval(this.onHeartbeat.bind(this), staleInterval)

    this._log.info(`connected`)
    this.emit('connected')
  }

  private onDisconnected(reason: string) {
    this.disconnect(reason)

    this._log.info(`disconnected`, { reason })
    this.emit('disconnected', new Error(`connection ${reason}`))
  }

  private onHeartbeat() {
    if (!this._last_received) return

    // if we haven't received a message in specified time,
    // assume the connection is dead
    const diff = new Date().getTime() - this._last_received.getTime()
    if (diff < staleTimeout) return

    this._log.warn(`websocket connection is stale, disconnecting`)
    this.onDisconnected('stale')
  }
}
