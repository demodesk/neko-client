import gh from './gesturehandler.js'

const g = gh as GestureHandlerConstructor
export default g

interface GestureHandlerConstructor {
  new (): GestureHandler
}

export interface GestureHandler {
  attach(element: Element): void
  detach(): void
}
