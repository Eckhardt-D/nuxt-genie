import type { Client } from '@libsql/client'
import type OpenAI from 'openai'
import { consola } from 'consola'

const MODEL = Bun.env.OPENAI_MODEL as 'gpt-4o' // satisfy TS

export type Chat = OpenAI.Chat.Completions.ChatCompletionMessageParam[]

export async function getEmbeddings(llm: OpenAI, input: string) {
  const response = await llm.embeddings.create({
    input,
    model: 'text-embedding-3-large',
    encoding_format: 'float',
  })
  return response.data[0].embedding
}

export async function queryDatabase(embeddings: number[], client: Client) {
  const embeddings_query = `
    SELECT filename, title, body
    FROM vector_top_k('nuxt_docs_vectors', vector(?), 5)
    JOIN nuxt_docs ON nuxt_docs.rowid = id;
  `

  const response = await client.execute({
    sql: embeddings_query,
    args: [new Float32Array(embeddings).buffer],
  })

  return response.rows.map((row: any) => `**${row.title}**\n${row.body}`).join('\n')
}

export class Expert {
  private dbClient: Client
  private llm: OpenAI

  private system_prompt = `
    You are an expert on the Nuxt.js 3 ecosystem. Your purpose is to answer short questions to help a developer with their project.
    Along with the question you will be provided some context and info from the official Nuxt.js documentation. Answer your question as
    if you are explaining it to a beginner in Nuxt. You will also need to harnass all your Vue.js composition API and TailwindCSS skills.
  `

  constructor(llm: OpenAI, client: Client) {
    this.llm = llm
    this.dbClient = client
  }

  async getAnswers(questions: string[]) {
    const combined_questions = questions.join('\n\n')

    const context = await queryDatabase(
      await getEmbeddings(this.llm, combined_questions),
      this.dbClient,
    )

    const response = await this.llm.chat.completions.create({
      model: MODEL,
      messages: [
        { role: 'system', content: this.system_prompt },
        { role: 'user', content: `${combined_questions}\n\ncontext: ${context}` },
      ],
    })

    if (response.choices[0]?.message?.content === undefined) {
      consola.warn(`Failed to get answers from expert, response may be inaccurate.`)
    }

    return response.choices[0].message.content!
  }
}

export class Coder {
  private llm: OpenAI
  private expert: Expert

  // Unused for now, will be used to store the chat history so we can keep on
  // talking to the same 'Coder' with a history.
  //
  // private activeChat: Chat;

  constructor(llm: OpenAI, expert: Expert) {
    this.llm = llm
    this.expert = expert
  }

  private system_prompt = `
  You are an assistant to a web developer that works with the Nuxt.js v3 framework. At your disposal is
  an expert to ask questions and get help to assist the developer with their project. Your goal is to output
  CLI commands, code snippets, and explanations to help them with their project.
  You only use the composition API, strictly! The developer will ask you a question and along with the developers question,
  the opinion of a Nuxt.js expert will be added. Make a lot of effort with styling.
  Do not mention this expert to the developer. Markup and styling is Vue and TailwindCSS, you are an extremely good
  UI designer and you always show off with how beautiful your UI's look when you give code snippets. The user wants
  production ready code and not just a simple solution. You are a perfectionist. Utilize Nuxt auto imports and modules
  as much as you can and always use the latest Nuxt.js features. You are a master of the Nuxt.js ecosystem.
  Do not provide long explanations. The developer is familiar with the basics of Nuxt.js.
  Your knowledge is solely based on Vue.js, Nuxt.js, Nitro, the Unjs ecosystem and the provided context from
  the expert. Do not hallucinate any code.
  `

  private async generateQuestions(prompt: string) {
    const combinedPrompt = `
    ${prompt}

    ___
    Please generate 3 questions you might ask to learn more about what I'm asking you about Nuxt.js and Vue.
    Reply only with the format below to collect more info. The questions are not for me but the Nuxt.js expert
    so you can know how to do things. e.g. "How do I create a component?" or "How can I add two-way binding to a component?"

    <question1>\n
    <question2>\n
    <question3>\n`

    const response = await this.llm.chat.completions.create({
      model: MODEL,
      messages: [
        { role: 'system', content: 'You are an assistant that asks questions '
          + 'about Nuxt.js to learn more so you can help the developer. At your '
          + 'disposal is an expert which will answer your questions.' },
        { role: 'user', content: combinedPrompt },
      ],
    })

    const questions = response.choices[0].message.content
      ?.split('\n')
      .filter((line: string) => line.length > 0)

    return questions
  }

  private async generateFinalOutput(prompt: string, context: string, messageHistory?: Chat) {
    const initial = messageHistory ?? [{ role: 'system', content: this.system_prompt }]
    const messages = [...initial, { role: 'user', content: `${prompt}\n\nexpert opinion: ${context}` }]

    const response = await this.llm.chat.completions.create({
      stream: true,
      model: MODEL,
      // @ts-expect-error some missing properties
      messages,
    })

    return {
      content: response,
      history: messages,
    }
  }

  async getResponse(prompt: string, messageHistory?: Chat) {
    const questions = await this.generateQuestions(prompt)

    if (questions === undefined) {
      consola.warn(`Failed to generate questions for prompt, response may be inaccurate.`)
    }

    const answers = await this.expert.getAnswers(questions ?? [])
    return await this.generateFinalOutput(prompt, answers, messageHistory)
  }
}
