import Keyboard from './novnc-keyboard.js'

export interface NoVncKeyboardInterface {
  onkeyevent?: (keysym: number, code: number, down: boolean) => void
  grab: () => void
  ungrab: () => void
}

export default function (element?: Element): NoVncKeyboardInterface {
  const Kbd = {}

  Keyboard.bind(Kbd, element)()

  return Kbd as NoVncKeyboardInterface
}
