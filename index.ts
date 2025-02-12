import type { Chat } from './src/agents'
import { createClient } from '@libsql/client'
import { defineCommand, runMain } from 'citty'
import { consola } from 'consola'

import OpenAI from 'openai'
import { Coder, Expert } from './src/agents'
import { ansi } from './src/ansi'

const llm = new OpenAI({
  apiKey: Bun.env.LLM_API_KEY,
  fetch: Bun.fetch,
})

const client = createClient({
  url: 'http://localhost:8080',
  fetch: Bun.fetch,
})

const main = defineCommand({
  meta: {
    name: 'nuxt-genie',
    version: '0.0.1',
    description: 'A Nuxt.js coding assistant',
  },
  args: {
    prompt: {
      type: 'positional',
      required: false,
      valueHint: 'e.g. generate a Nuxt.js component that displays a list of products that are selectable',
      description: 'Prompt to generate Nuxt.js code or get assistance with Nuxt.js',
    },
  },
  async run({ args }) {
    const messageHistory: Chat = []

    while (true) {
      const prompt = args.prompt ?? await consola.prompt('What can Nuxt Genie help you with today?', {
        type: 'text',
      })

      if (!prompt?.length) {
        Bun.stdout.write('Please provide a longer prompt.\n')
        return
      }

      const coderAgent = new Coder(llm, new Expert(llm, client))

      consola.start('Generating Nuxt.js code...')
      const response = await coderAgent.getResponse(
        prompt,
        messageHistory.length > 0 ? messageHistory : undefined,
      )

      const reader = response.content.toReadableStream().getReader()

      let final = ''
      let line = ''

      while (true) {
        const { done, value } = await reader.read()

        if (done) {
          break
        }

        const chunk = new TextDecoder().decode(value)
        const json = JSON.parse(chunk)

        const content = json.choices?.[0]?.delta?.content

        if (content?.length) {
          final += content
          line += content

          if (line.match(/\n$/)) {
            Bun.stdout.write(ansi(`${line.replace(/(\n\n)/, '\n')}`))
            line = ''
          }
        }
      }

      // eslint-disable-next-line no-console
      console.clear()

      // Make it look nice again
      // todo: better parsing so output looks good on first pass
      Bun.stdout.write(ansi(`${final}\n`))

      messageHistory.push({
        role: 'assistant',
        content: final,
      })

      const result = await consola.prompt('Would you like to refine the code?', {
        type: 'confirm',
      })

      if (!result) {
        break
      }

      args.prompt = await consola.prompt('What would you like to change or add or remove?', {
        type: 'text',
      })
    }
  },
  cleanup() {
    if (!client.closed) {
      client.close()
    }
  },
})

runMain(main)
