import NoVnc from './novnc'
import Guacamole from './guacamole'

export interface KeyboardInterface {
  onkeydown?: (keysym: number, event: KeyboardEvent) => boolean
  onkeyup?: (keysym: number) => void
  release: (keysym: number) => void
  listenTo: (element: Element | Document) => void
  removeListener: () => void
}

export function NoVncKeyboard(element?: Element): KeyboardInterface {
  return NoVnc(element)
}

export function GuacamoleKeyboard(element?: Element): KeyboardInterface {
  return Guacamole(element)
}
