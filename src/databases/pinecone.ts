// src/databases/pinecone.ts
import { Pinecone as PineconeClient } from "@pinecone-database/pinecone";
import { PineconeStore, PineconeEmbeddings } from "@langchain/pinecone";

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
