import { ChromaClient } from "chromadb";
import { OllamaEmbeddingFunction } from "@chroma-core/ollama";

const chromaClient = new ChromaClient(); // defaults to http://localhost:8000
// const chromaClient = new ChromaClient({
//   ssl: false,
//   host: "localhost",
//   port: 8000,
// });

const ollamaEmbedder = new OllamaEmbeddingFunction({
  url: "http://localhost:11434",
  model: "nomic-embed-text:v1.5",
//   model: "llama3.2:latest",
});

const collectionName = "cpay_user_guide";

export const collection = chromaClient.getOrCreateCollection({
  name: collectionName,
  embeddingFunction: ollamaEmbedder,
});

export async function getOrCreateCollection() {
  const collection = await chromaClient.getOrCreateCollection({
    name: collectionName,
    embeddingFunction: ollamaEmbedder,
  });
  return collection;
}
