declare module 'marked-terminal' {
  import type { Renderer } from 'marked'

  const renderer: new (opts?: any, highlightOpts?: any) => Renderer
  export default renderer
}
