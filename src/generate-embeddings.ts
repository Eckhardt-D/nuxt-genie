import { createClient } from "@libsql/client";
import OpenAI from 'openai';

const ai = new OpenAI({
  fetch: Bun.fetch,
  apiKey: process.env.LLM_API_KEY
});

const client = createClient({
  url: "http://localhost:8080",
  fetch: Bun.fetch
});

await client.execute(`CREATE TABLE IF NOT EXISTS nuxt_docs (
  vectors F32_BLOB(3072) NOT NULL,
  filename TEXT NOT NULL,
  title TEXT NOT NULL,
  body TEXT NOT NULL
)`);

await client.execute(`
  CREATE INDEX IF NOT EXISTS nuxt_docs_vectors
  ON nuxt_docs (
    libsql_vector_idx(vectors, 'metric=cosine')
  )`);

const glob = new Bun.Glob("./nuxt-docs/**/*.md");

const files = await Array.fromAsync(glob.scan({
  cwd: ".",
  dot: false,
  absolute: true,
  // Bun does not support exclusion patterns yet
}));

// Arbitrary, you can
// adjust if you want
const slice = 2048;

for (const filepath of files) {
  const contents = await Bun.file(filepath).text();
  const match = contents.match(/---\ntitle:\s*(.+)\n/);

  if (match) {
    const title = match[1];
    const filename = filepath.split("/").pop();

    let length_processed = 0;
    let previous_overlap: string | undefined = undefined;

    while (length_processed < contents.length) {
      let input = contents.slice(length_processed, length_processed + slice);

      if (previous_overlap) {
        input = previous_overlap + input;
      }

      length_processed += slice;
      previous_overlap = input.slice(-100);

      const embedding = await ai.embeddings.create({
        input,
        // You can adjust this to your needs
        model: "text-embedding-3-large",
        encoding_format: "float",
      });

      console.log({tokens_used: embedding.usage.total_tokens});

      const fl = new Float32Array(embedding.data[0].embedding);
      const result = await client.execute({
        sql: `INSERT INTO nuxt_docs (
          vectors, filename, title, body
        ) VALUES (
          vector(?), ?, ?, ?
        )`,
        args: [fl.buffer, filename!, title, input]
      });

      console.log({inserted: result.rowsAffected});

      // Respect the server a bit :D
      await Bun.sleep(90);
    }

    previous_overlap = undefined;

    // Respect the server a bit :D
    await Bun.sleep(100);
  }
}
