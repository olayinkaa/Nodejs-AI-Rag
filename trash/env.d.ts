// env.d.ts

export {};

declare global {
  namespace NodeJS {
    interface ProcessEnv {
      PINECONE_API_KEY: string;
      PINECONE_INDEX: string;
    }
  }
}
