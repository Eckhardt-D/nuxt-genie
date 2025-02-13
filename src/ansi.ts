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
    processAllTokens(tokens) {
      for (const token of tokens) {
        if (token.type === 'code') {
          if (token.lang === 'vue') {
            token.lang = 'html'
          }
          else if (!['html', 'css', 'js', 'javascript', 'ts', 'typescript', 'bash', 'shell', 'sh', 'markdown', 'md'].includes(token.lang)) {
            token.lang = 'bash'
          }
        }
      }
      return tokens
    },
  },
})

export function ansi(text: string) {
  return marked(text, { async: false })
}
