# Nuxt Genie

Experiments with LLMs, RAG and Agents to generate Nuxt code from the CLI. This project uses some Bun only API's if you use Node, you'll need to update some stuff, lol.

This was an exploration in adapting the [STORM](https://arxiv.org/pdf/2402.14207) approach to code generation and also playing with [Turso's](https://turso.tech) libsql to see how good it can RAG.

The RAG data is pulled from [Nuxt](https://github.com/nuxt/nuxt) docs and there are some opportunities here to possibly also vectorize example code, modules etc.


https://github.com/user-attachments/assets/406d5150-004d-476f-af67-1eed9b90444a


## Getting started

- Clone the repo
- Install dependencies

        bun install

- Make your .env (add your OpenAI API key)

        cp .env.example .env

## Usage

In development, replace `nuxt-genie` with `bun prompt`

```bash
USAGE nuxt-genie [OPTIONS] [PROMPT]

ARGUMENTS

  PROMPT    Prompt to generate Nuxt.js code or get assistance with Nuxt.js    <e.g. generate a Nuxt.js component that displays a list of products that are selectable>

OPTIONS

   -e, --expert    (default=false) Whether the coder agent should ask the expert agent for help
   -v, --version    Show the version number
   -h, --help    Show this help message
```

The expert is basically another prompt/agent that answers questions that the coder might have.
The expert mode makes responsees quite a bit slower and imho doesn't add THAT much value. Sometimes
when it's complex questions it does improve output though.

## Examples

In development:

        bun prompt -e "Generate a dropdown component with a material design theme that lists products and add it to the home page."

After building a Single File executable:

        bun run build

        ./dist/nuxt-genie -e "Generate a dropdown component with a material design theme that lists products and add it to the home page."

You can add the binary to your PATH to make it simpler to run.

        export PATH=$PATH:<path-to-root-folder>/dist

> [!NOTE]
> The built binary still requires you to run a libsql server on port 8080 with the nuxt vectors from the [Seed](#seeding-the-database-with-nuxt-vectors) section.

In the example above the prompt is optional, if not provided the CLI will ask you for it.

# Nuxt Docs Seeding

## Docker container for libsql

    docker run --name nuxt-vectors --rm -ti \
        -p 8080:8080 \
        -p 5001:5001 \
        -v $(pwd)/sqld-data:/var/lib/sqld \
        -e SQLD_NODE=primary \
        ghcr.io/tursodatabase/libsql-server:latest

## Seeding the database with Nuxt vectors

This script will download the nuxt repo, extract the docs and put it in ./nuxt-docs

        ./seed.sh

Make sure the libsql is started and run the seed of the database, have a look at src/generate-embeddings.ts for more info.

> [!WARNING]
> This command creates a lot of data like (1GB) and will take a while and some OpenAI credits to run.

        bun generate:embeddings
