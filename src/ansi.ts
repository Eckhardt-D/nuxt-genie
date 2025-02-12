import chalk from 'chalk'
import { marked } from 'marked'
import TerminalRenderer from 'marked-terminal'

marked.setOptions({
  renderer: new TerminalRenderer({
    heading: chalk.bold.cyanBright,
    firstHeading: chalk.bold.cyanBright,
  }, {
    theme: {
      string: chalk.yellowBright,
      keyword: chalk.bold.cyanBright,
      tag: chalk.bold.grey,
      name: chalk.bold.grey,
    },
  }),
})

marked.use({
  hooks: {
    preprocess(text) {
      // Use HTML for vue for now..
      return text.replace(/```vue/g, '```html')
    },
  },
})

export function ansi(text: string) {
  return marked(text, { async: false })
}
