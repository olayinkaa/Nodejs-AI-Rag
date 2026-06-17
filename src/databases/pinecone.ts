// src/databases/pinecone.ts
import { Pinecone as PineconeClient } from "@pinecone-database/pinecone";
import { PineconeStore, PineconeEmbeddings } from "@langchain/pinecone";
// import { OllamaEmbeddings } from "@langchain/ollama";

// Keep the embeddings setup at top-level; it doesn't validate env keys instantly
// export const ollamaEmbeddings = new OllamaEmbeddings({
//   baseUrl: "http://localhost:11434",
//   model: "nomic-embed-text:v1.5",
//   dimensions: 1024,
// });

const embeddings = new PineconeEmbeddings({
  apiKey: process.env.PINECONE_API_KEY,
  model: "llama-text-embed-v2",
});

/**
 * Safely builds the connection store dynamically at execution runtime
 */
export async function getPineconeVectorStore(): Promise<PineconeStore> {
  const apiKey = process.env.PINECONE_API_KEY;
  const indexName = process.env.PINECONE_INDEX;
  // const apiKey =
  //   "pcsk_5hkvFN_7YxyaH4yu43phJAxNAUNcnAAMt7xmpwm6FXRdMnxzT7vdyqM4ss7EMSX7zskFYN";
  // const indexName = "cpay-rag-pinecone-index";

  // 1. Strictly validate environment state variables at the execution layer
  if (!apiKey) {
    throw new Error(
      "❌ Error: PINECONE_API_KEY environment variable is missing!",
    );
  }
  if (!indexName) {
    throw new Error(
      "❌ Error: PINECONE_INDEX environment variable is missing!",
    );
  }

  // 2. Instantiate the client INSIDE the function to prevent module-load race conditions
  const pc = new PineconeClient({
    apiKey: apiKey,
  });

  const pineconeIndex = pc.index(indexName);

  // 3. Connect the LangChain wrapper safely
  return await PineconeStore.fromExistingIndex(embeddings, {
    pineconeIndex: pineconeIndex,
    maxConcurrency: 5,
  });
}
