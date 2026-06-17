import { Pinecone as PineconeClient } from "@pinecone-database/pinecone";
import { PineconeStore } from "@langchain/pinecone";
import { OllamaEmbeddings } from "@langchain/ollama";

export const ollamaEmbeddings = new OllamaEmbeddings({
  baseUrl: "http://localhost:11434", // Default value
  model: "nomic-embed-text:v1.5",
});

const pc = new PineconeClient({
  apiKey: process.env.PINECONE_API_KEY,
});

const pineconeIndex = pc.index("cpay-knowledge-base");

export const vectorStore = await PineconeStore.fromExistingIndex(
  ollamaEmbeddings,
  {
    pineconeIndex,
    // Maximum number of batch requests to allow at once. Each batch is 1000 vectors.
    maxConcurrency: 5,
    // You can pass a namespace here too
    // namespace: "foo",
  },
);
