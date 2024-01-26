import Vue from 'vue'
import * as EVENT from '../types/events'
import * as message from '../types/messages'

import EventEmitter from 'eventemitter3'
import { Logger } from '../utils/logger'
import { NekoConnection } from './connection'
import NekoState from '../types/state'

export interface NekoEvents {
  // connection events
  ['connection.status']: (status: 'connected' | 'connecting' | 'disconnected') => void
  ['connection.type']: (status: 'fallback' | 'webrtc' | 'none') => void
  ['connection.webrtc.sdp']: (type: 'local' | 'remote', data: string) => void
  ['connection.webrtc.sdp.candidate']: (type: 'local' | 'remote', data: RTCIceCandidateInit) => void
  ['connection.closed']: (error?: Error) => void

  // drag and drop events
  ['upload.drop.started']: () => void
  ['upload.drop.progress']: (progressEvent: ProgressEvent) => void
  ['upload.drop.finished']: (error?: Error) => void

  // upload dialog events
  ['upload.dialog.requested']: () => void
  ['upload.dialog.overlay']: (id: string) => void
  ['upload.dialog.closed']: () => void

  // custom messages events
  ['receive.unicast']: (sender: string, subject: string, body: any) => void
  ['receive.broadcast']: (sender: string, subject: string, body: any) => void

  // session events
  ['session.created']: (id: string) => void
  ['session.deleted']: (id: string) => void
  ['session.updated']: (id: string) => void

  // room events
  ['room.control.host']: (hasHost: boolean, hostID?: string) => void
  ['room.screen.updated']: (width: number, height: number, rate: number) => void
  ['room.clipboard.updated']: (text: string) => void
  ['room.broadcast.status']: (isActive: boolean, url?: string) => void

  // external message events
  ['message']: (event: string, payload: any) => void
}

export class NekoMessages extends EventEmitter<NekoEvents> {
  private _localLog: Logger
  private _remoteLog: Logger

  // eslint-disable-next-line
  constructor(
    private readonly _connection: NekoConnection,
    private readonly _state: NekoState,
  ) {
    super()

    this._localLog = new Logger('messages')
    this._remoteLog = _connection.getLogger('messages')

    this._connection.websocket.on('message', async (event: string, payload: any) => {
      // @ts-ignore
      if (typeof this[event] === 'function') {
        try {
          // @ts-ignore
          await this[event](payload)
        } catch (error: any) {
          this._remoteLog.error(`error while processing websocket event`, { event, error })
        }
      } else {
        this._remoteLog.debug(`emitting external message`, { event, payload })
        this.emit('message', event, payload)
      }
    })

    this._connection.webrtc.on('candidate', (candidate: RTCIceCandidateInit) => {
      this._connection.websocket.send(EVENT.SIGNAL_CANDIDATE, candidate)
      this.emit('connection.webrtc.sdp.candidate', 'local', candidate)
    })

    this._connection.webrtc.on('negotiation', ({ sdp, type }: RTCSessionDescriptionInit) => {
      if (!sdp) {
        this._remoteLog.warn(`sdp empty while negotiation event`)
        return
      }

      if (type == 'answer') {
        this._connection.websocket.send(EVENT.SIGNAL_ANSWER, { sdp })
      } else if (type == 'offer') {
        this._connection.websocket.send(EVENT.SIGNAL_OFFER, { sdp })
      } else {
        this._remoteLog.warn(`unsupported negotiation type`, { type })
      }

      // TODO: Return whole signal description (if answer / offer).
      this.emit('connection.webrtc.sdp', 'local', sdp)
    })
  }

  /////////////////////////////
  // System Events
  /////////////////////////////

  protected [EVENT.SYSTEM_INIT](conf: message.SystemInit) {
    this._localLog.debug(`EVENT.SYSTEM_INIT`)
    Vue.set(this._state, 'session_id', conf.session_id)
    // check if backend supports touch events
    Vue.set(this._state.control.touch, 'supported', conf.touch_events)
    Vue.set(this._state.connection, 'screencast', conf.screencast_enabled)
    Vue.set(this._state.connection.webrtc, 'videos', conf.webrtc.videos)

    for (const id in conf.sessions) {
      this[EVENT.SESSION_CREATED](conf.sessions[id])
    }

    this[EVENT.SCREEN_UPDATED](conf.screen_size)
    this[EVENT.CONTROL_HOST](conf.control_host)
    this[EVENT.SYSTEM_SETTINGS](conf.settings)
  }

  protected [EVENT.SYSTEM_ADMIN]({ screen_sizes_list, broadcast_status }: message.SystemAdmin) {
    this._localLog.debug(`EVENT.SYSTEM_ADMIN`)

    const list = screen_sizes_list.sort((a, b) => {
      if (b.width === a.width && b.height == a.height) {
        return b.rate - a.rate
      } else if (b.width === a.width) {
        return b.height - a.height
      }
      return b.width - a.width
    })

    Vue.set(this._state.screen, 'configurations', list)

    this[EVENT.BORADCAST_STATUS](broadcast_status)
  }

  protected [EVENT.SYSTEM_SETTINGS](settings: message.SystemSettings) {
    this._localLog.debug(`EVENT.SYSTEM_SETTINGS`)
    Vue.set(this._state, 'settings', settings)
  }

  protected [EVENT.SYSTEM_DISCONNECT]({ message }: message.SystemDisconnect) {
    this._localLog.debug(`EVENT.SYSTEM_DISCONNECT`)
    this._connection.close(new Error(message))
  }

  /////////////////////////////
  // Signal Events
  /////////////////////////////

  protected async [EVENT.SIGNAL_PROVIDE]({ sdp, iceservers, video, audio }: message.SignalProvide) {
    this._localLog.debug(`EVENT.SIGNAL_PROVIDE`)

    // create WebRTC connection
    await this._connection.webrtc.connect(iceservers)

    // set remote offer
    await this._connection.webrtc.setOffer(sdp)

    // TODO: Return whole signal description (if answer / offer).
    this.emit('connection.webrtc.sdp', 'remote', sdp)

    this[EVENT.SIGNAL_VIDEO](video)
    this[EVENT.SIGNAL_AUDIO](audio)
  }

  protected async [EVENT.SIGNAL_OFFER]({ sdp }: message.SignalDescription) {
    this._localLog.debug(`EVENT.SIGNAL_OFFER`)

    // set remote offer
    await this._connection.webrtc.setOffer(sdp)

    // TODO: Return whole signal description (if answer / offer).
    this.emit('connection.webrtc.sdp', 'remote', sdp)
  }

  protected async [EVENT.SIGNAL_ANSWER]({ sdp }: message.SignalDescription) {
    this._localLog.debug(`EVENT.SIGNAL_ANSWER`)

    // set remote answer
    await this._connection.webrtc.setAnswer(sdp)

    // TODO: Return whole signal description (if answer / offer).
    this.emit('connection.webrtc.sdp', 'remote', sdp)
  }

  // TODO: Use offer event intead.
  protected async [EVENT.SIGNAL_RESTART]({ sdp }: message.SignalDescription) {
    this[EVENT.SIGNAL_OFFER]({ sdp })
  }

  protected async [EVENT.SIGNAL_CANDIDATE](candidate: message.SignalCandidate) {
    this._localLog.debug(`EVENT.SIGNAL_CANDIDATE`)

    // set remote candidate
    await this._connection.webrtc.setCandidate(candidate)
    this.emit('connection.webrtc.sdp.candidate', 'remote', candidate)
  }

  protected [EVENT.SIGNAL_VIDEO]({ disabled, id, auto }: message.SignalVideo) {
    this._localLog.debug(`EVENT.SIGNAL_VIDEO`, { disabled, id, auto })
    Vue.set(this._state.connection.webrtc.video, 'disabled', disabled)
    Vue.set(this._state.connection.webrtc.video, 'id', id)
    Vue.set(this._state.connection.webrtc.video, 'auto', auto)
  }

  protected [EVENT.SIGNAL_AUDIO]({ disabled }: message.SignalAudio) {
    this._localLog.debug(`EVENT.SIGNAL_AUDIO`, { disabled })
    Vue.set(this._state.connection.webrtc.audio, 'disabled', disabled)
  }

  protected [EVENT.SIGNAL_CLOSE]() {
    this._localLog.debug(`EVENT.SIGNAL_CLOSE`)
    this._connection.webrtc.close()
  }

  /////////////////////////////
  // Session Events
  /////////////////////////////

  protected [EVENT.SESSION_CREATED]({ id, ...data }: message.SessionData) {
    this._localLog.debug(`EVENT.SESSION_CREATED`, { id })
    Vue.set(this._state.sessions, id, data)
    this.emit('session.created', id)
  }

  protected [EVENT.SESSION_DELETED]({ id }: message.SessionID) {
    this._localLog.debug(`EVENT.SESSION_DELETED`, { id })
    Vue.delete(this._state.sessions, id)
    this.emit('session.deleted', id)
  }

  protected [EVENT.SESSION_PROFILE]({ id, ...profile }: message.MemberProfile) {
    if (id in this._state.sessions) {
      this._localLog.debug(`EVENT.SESSION_PROFILE`, { id })
      Vue.set(this._state.sessions[id], 'profile', profile)
      this.emit('session.updated', id)
    }
  }

  protected [EVENT.SESSION_STATE]({ id, ...state }: message.SessionState) {
    if (id in this._state.sessions) {
      this._localLog.debug(`EVENT.SESSION_STATE`, { id })
      Vue.set(this._state.sessions[id], 'state', state)
      this.emit('session.updated', id)
    }
  }

  protected [EVENT.SESSION_CURSORS](cursors: message.SessionCursor[]) {
    Vue.set(this._state, 'cursors', cursors)
  }

  /////////////////////////////
  // Control Events
  /////////////////////////////

  protected [EVENT.CONTROL_HOST]({ has_host, host_id }: message.ControlHost) {
    this._localLog.debug(`EVENT.CONTROL_HOST`)

    if (has_host && host_id) {
      Vue.set(this._state.control, 'host_id', host_id)
    } else {
      Vue.set(this._state.control, 'host_id', null)
    }

    // save if user is host
    Vue.set(this._state.control, 'is_host', has_host && this._state.control.host_id === this._state.session_id)

    this.emit('room.control.host', has_host, host_id)
  }

  /////////////////////////////
  // Screen Events
  /////////////////////////////

  protected [EVENT.SCREEN_UPDATED]({ width, height, rate }: message.ScreenSize) {
    this._localLog.debug(`EVENT.SCREEN_UPDATED`)
    Vue.set(this._state.screen, 'size', { width, height, rate })
    this.emit('room.screen.updated', width, height, rate)
  }

  /////////////////////////////
  // Clipboard Events
  /////////////////////////////

  protected [EVENT.CLIPBOARD_UPDATED]({ text }: message.ClipboardData) {
    this._localLog.debug(`EVENT.CLIPBOARD_UPDATED`)
    Vue.set(this._state.control, 'clipboard', { text })

    try {
      navigator.clipboard.writeText(text) // sync user's clipboard
    } catch (error: any) {
      this._remoteLog.warn(`unable to write text to client's clipboard`, {
        error,
        // works only for HTTPs
        protocol: location.protocol,
        clipboard: typeof navigator.clipboard,
      })
    }

    this.emit('room.clipboard.updated', text)
  }

  /////////////////////////////
  // Broadcast Events
  /////////////////////////////

  protected [EVENT.BORADCAST_STATUS]({ url, is_active }: message.BroadcastStatus) {
    this._localLog.debug(`EVENT.BORADCAST_STATUS`)
    // TODO: Handle.
    this.emit('room.broadcast.status', is_active, url)
  }

  /////////////////////////////
  // Send Events
  /////////////////////////////

  protected [EVENT.SEND_UNICAST]({ sender, subject, body }: message.SendMessage) {
    this._localLog.debug(`EVENT.SEND_UNICAST`)
    this.emit('receive.unicast', sender, subject, body)
  }

  protected [EVENT.SEND_BROADCAST]({ sender, subject, body }: message.SendMessage) {
    this._localLog.debug(`EVENT.BORADCAST_STATUS`)
    this.emit('receive.broadcast', sender, subject, body)
  }

  /////////////////////////////
  // FileChooserDialog Events
  /////////////////////////////

  protected [EVENT.FILE_CHOOSER_DIALOG_OPENED]({ id }: message.SessionID) {
    this._localLog.debug(`EVENT.FILE_CHOOSER_DIALOG_OPENED`)

    if (id == this._state.session_id) {
      this.emit('upload.dialog.requested')
    } else {
      this.emit('upload.dialog.overlay', id)
    }
  }

  protected [EVENT.FILE_CHOOSER_DIALOG_CLOSED]({}: message.SessionID) {
    this._localLog.debug(`EVENT.FILE_CHOOSER_DIALOG_CLOSED`)
    this.emit('upload.dialog.closed')
  }
}
