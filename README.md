# Nuxt Genie

Experiments with LLMs, RAG and Agents to generate Nuxt code from the CLI. This project
uses some Bun only API's if you use Node, you'll need to update some stuff, lol.

Currently it's a bit slow because of all the 'proompting' but this was an exploration
in adapting the [STORM](https://arxiv.org/pdf/2402.14207) approach to code generation and
also playing with [Turso's](https://turso.tech) libsql to see how good it can RAG.

The RAG data is pulled from [Nuxt](https://github.com/nuxt/nuxt) docs and there are some
opportunities here to possibly also vectorize example code, modules etc.

## Usage

This is mostly for fun and not complete yet, but the command to prompt the agents are:

In development:

        bun prompt "Generate a dropdown component with a material design theme that lists products and add it to the home page."

After building a Single File executable:

        bun run build

        ./nuxt-genie "Generate a dropdown component with a material design theme that lists products and add it to the home page."

In the example above the prompt is optional, if not provided the CLI will ask you for it.

## Getting started

- Clone the repo
- Install dependencies

        bun install

- Make your .env (add your OpenAI API key)

        cp .env.example .env

# Docker container for libsql

    docker run --name nuxt-vectors --rm -ti \
        -p 8080:8080 \
        -p 5001:5001 \
        -v $(pwd)/sqld-data:/var/lib/sqld \
        -e SQLD_NODE=primary \
        ghcr.io/tursodatabase/libsql-server:latest

# Seeding the database with Nuxt vectors

A bit manual right now, but will make a bash script for it:

- Download and unzip [Nuxt](https://github.com/nuxt/nuxt)
- Move or copy the docs into `/nuxt-docs`

        cp -r nuxt-main/docs/* ./nuxt-docs/

- Make sure the libsql is started and run the seed of the database, have a look at src/generate-embeddings.ts for more info.

> [!WARNING]
> This command creates a lot of data like (1GB) and will take a while and some OpenAI credits to run.

        npm run generate:embeddings

