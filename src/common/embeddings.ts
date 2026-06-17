import { OllamaEmbeddings } from "@langchain/ollama";

export const ollamaEmbeddings = new OllamaEmbeddings({
  baseUrl: "http://localhost:11434", // Default value
  model: "nomic-embed-text:v1.5",
});