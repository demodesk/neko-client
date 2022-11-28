import Vue from 'vue'
import EventEmitter from 'eventemitter3'
import * as EVENT from '../types/events'

import { NekoWebSocket } from './websocket'
import { NekoLoggerFactory } from './logger'
import { NekoWebRTC } from './webrtc'
import { Connection } from '../types/state'

import { Reconnector } from './reconnector'
import { WebsocketReconnector } from './reconnector/websocket'
import { WebrtcReconnector } from './reconnector/webrtc'
import { Logger } from '../utils/logger'

export interface NekoConnectionEvents {
  close: (error?: Error) => void
}

export class NekoConnection extends EventEmitter<NekoConnectionEvents> {
  private _open = false

  public websocket = new NekoWebSocket()
  public logger = new NekoLoggerFactory(this.websocket)
  public webrtc = new NekoWebRTC(this.logger.new('webrtc'))

  private _reconnector: {
    websocket: Reconnector
    webrtc: Reconnector
  }

  private _onConnectHandle: () => void
  private _onDisconnectHandle: () => void
  private _onCloseHandle: (error?: Error) => void
  private _webrtcStableHandle: (isStable: boolean) => void

  // eslint-disable-next-line
  constructor(
    private readonly _state: Connection,
  ) {
    super()

    this._reconnector = {
      websocket: new Reconnector(new WebsocketReconnector(_state, this.websocket), _state.websocket.config),
      webrtc: new Reconnector(new WebrtcReconnector(_state, this.websocket, this.webrtc), _state.webrtc.config),
    }

    this._onConnectHandle = () => {
      Vue.set(this._state.websocket, 'connected', this.websocket.connected)
      Vue.set(this._state.webrtc, 'connected', this.webrtc.connected)

      if (this._state.status !== 'connected' && this.websocket.connected && this.webrtc.connected) {
        Vue.set(this._state, 'status', 'connected')
      }

      if (this.websocket.connected && !this.webrtc.connected) {
        this._reconnector.webrtc.connect()
      }
    }

    this._onDisconnectHandle = () => {
      Vue.set(this._state.websocket, 'connected', this.websocket.connected)
      Vue.set(this._state.webrtc, 'connected', this.webrtc.connected)

      if (this._state.webrtc.stable && !this.webrtc.connected) {
        Vue.set(this._state.webrtc, 'stable', false)
      }

      if (this._state.status === 'connected' && this.activated) {
        Vue.set(this._state, 'status', 'connecting')
      }
    }

    this._onCloseHandle = this.close.bind(this)

    // bind events to all reconnectors
    Object.values(this._reconnector).forEach((r) => {
      r.on('connect', this._onConnectHandle)
      r.on('disconnect', this._onDisconnectHandle)
      r.on('close', this._onCloseHandle)
    })

    // synchronize webrtc stable with global state
    this._webrtcStableHandle = (isStable: boolean) => {
      Vue.set(this._state.webrtc, 'stable', isStable)
    }
    this.webrtc.on('stable', this._webrtcStableHandle)
  }

  public get activated() {
    // check if every reconnecter is open
    return Object.values(this._reconnector).every((r) => r.isOpen)
  }

  public reloadConfigs() {
    this._reconnector.websocket.config = this._state.websocket.config
    this._reconnector.webrtc.config = this._state.webrtc.config
  }

  public setVideo(video: string, bitrate: number = 0, video_auto: boolean) {
    if (video != '' && !this._state.webrtc.videos.includes(video)) {
      throw new Error('video id not found')
    }
    this.websocket.send(EVENT.SIGNAL_VIDEO, { video, bitrate, video_auto })
  }

  public getLogger(scope?: string): Logger {
    return this.logger.new(scope)
  }

  public open(video?: string) {
    if (this._open) {
      throw new Error('connection already open')
    }

    this._open = true

    if (video) {
      if (!this._state.webrtc.videos.includes(video)) {
        throw new Error('video id not found')
      }

      Vue.set(this._state.webrtc, 'video', video)
    }

    Vue.set(this._state, 'status', 'connecting')

    // open all reconnectors with deferred connection
    Object.values(this._reconnector).forEach((r) => r.open(true))

    this._reconnector.websocket.connect()
  }

  public close(error?: Error) {
    if (this._open) {
      // set state to disconnected
      Vue.set(this._state.websocket, 'connected', false)
      Vue.set(this._state.webrtc, 'connected', false)
      Vue.set(this._state, 'status', 'disconnected')
    }

    // close all reconnectors
    Object.values(this._reconnector).forEach((r) => r.close())

    if (this._open) {
      this._open = false
      this.emit('close', error)
    }
  }

  public destroy() {
    this.logger.destroy()

    // TODO: Use server side congestion control.
    this.webrtc.off('stable', this._webrtcStableHandle)

    // unbind events from all reconnectors
    Object.values(this._reconnector).forEach((r) => {
      r.off('connect', this._onConnectHandle)
      r.off('disconnect', this._onDisconnectHandle)
      r.off('close', this._onCloseHandle)
    })

    // destroy all reconnectors
    Object.values(this._reconnector).forEach((r) => r.destroy())

    // set state to disconnected
    Vue.set(this._state.websocket, 'connected', false)
    Vue.set(this._state.webrtc, 'connected', false)
    Vue.set(this._state, 'status', 'disconnected')
  }
}
