import { createClient } from '@libsql/client'
import OpenAI from 'openai'

import { Coder, Expert } from './src/agents';

const llm = new OpenAI({
  apiKey: process.env.LLM_API_KEY,
  fetch: Bun.fetch,
});

const client = createClient({
  url: 'http://localhost:8080',
  fetch: Bun.fetch,
})

async function main() {
  const prompt = Bun.argv.at(-1);

  if (!prompt?.length) {
    console.log('Please provide a longer prompt.');
    return;
  }

  const coderAgent = new Coder(llm, new Expert(llm, client));
  // TODO: prompt for input in CLI
  // TODO: Stream output
  // TODO: Keepalive chat with history
  console.log(await coderAgent.getResponse(prompt))
}

await main()

// Cleanup
client.close();
