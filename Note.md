## REFERENCE
- [Nodejs Security in Production](https://www.youtube.com/watch?v=-6PPHXdn3Ts&t=3774s)
- https://etranzactng.udemy.com/course/ai-nodejs-openai-chatgpt-langchain-typescript/learn/lecture/42567266#overview
- https://www.toptal.com/developers/gitignore
- https://platform.openai.com/tokenizer
- https://reference.langchain.com/javascript/langchain-ollama/ChatOllama
- https://github.dev/alexhddev/AI_course_res/tree/main/langchain
- [Langchain](https://docs.langchain.com/oss/javascript/langchain/overview)
- https://github.dev/olayinkaa/node-express-restful-api-music-c
- [Datasets](https://www.kaggle.com/)
- [Chroma DB](https://www.trychroma.com/)
- [Pinecone DB](https://app.pinecone.io)

  
## NOTE
OpenAI Model and services
APIS:
- TEXT: text to text: GPT-4, GPT-3.5
- IMAGE: text to image: DALL-E
- Audio: text to speech, speech to text: Whisper
- Sora - text to video

Role
- system role, user role, assistant role

Parameters
- Temperature

## Popular Vector Database
- Pinecone
- Chroma
- Weaviate
- Redis
- Postgre SQL - PG vector extension
- Milvus


# Installation
```sh
pnpm init
pnpm add express
pnpm add -D typescript @types/node @types/express tsx
pnpm add -D ts-node
pnpm exec tsc --init
pnpm add -D tsc-alias
pnpm add openai
pnpm add tiktoken
pnpm add chromadb
# 
pnpm add @langchain/textsplitters @langchain/core
pnpm add -D @types/pg
pnpm add puppeteer
pnpm add drizzle-orm pg 
pnpm add -D drizzle-kit @types/pg

# generate gitignore files
pnpm dlx git-ignore node
#
node --env-file=.env src/index.js

pnpm add multer
pnpm add -D @types/multer
pnpm add cors && pnpm add -D @types/cors
```

## Code Sample
```ts
import OpenAI from "openai"

const openai = new OpenAI()

process.stdin.addListener('data',async function(input){
    const userInput = input.toString().trim();
    const response = openai.chat.completions.create({
        model: "",
        messages: [
            {
                role: "system",
                content: "You are a helpful chatbot",
            },
            {
                role: "user",
                content: userInput
            }
        ]
    })

    console.log(response.choices[0].message.content)
})
```

```ts
import {config} from "dotenv"
config({ path: ".env.local" })
```


## Research on 
- DB: ACID compliance
- DB: Point in time recovery
- JOIN
