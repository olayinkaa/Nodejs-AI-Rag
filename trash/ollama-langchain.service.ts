// src/services/langchain.service.ts
import { ChatOllama, OllamaEmbeddings } from "@langchain/ollama";
import { ChatPromptTemplate } from "@langchain/core/prompts";
import { StringOutputParser } from "@langchain/core/output_parsers";
import type { IterableReadableStream } from "@langchain/core/utils/stream";

export class LangChainService {
  private static llm = new ChatOllama({
    baseUrl: "http://localhost:11434", // Default Ollama local endpoint
    model: "llama3.2:latest",
  });

  private static embeddings = new OllamaEmbeddings({
    model: "llama3.2:latest",
    baseUrl: "http://localhost:11434", // Default value
  });

  static async executeLinearChain(userInput: string): Promise<string> {
    // 1. Define a strict template structure
    const prompt = ChatPromptTemplate.fromMessages([
      ["system", "You are a helpful, sarcastic AI assistant."],
      ["human", "{input}"],
    ]);

    // 2. Composing the linear pipeline using LangChain Expression Language (LCEL)
    const pipeline = prompt.pipe(this.llm).pipe(new StringOutputParser());

    // 3. Trigger execution sequentially
    const response = await pipeline.invoke({ input: userInput });
    return response;
  }

  static async executeLinearChainStream(
    userInput: string,
  ): Promise<IterableReadableStream<string>> {
    const prompt = ChatPromptTemplate.fromMessages([
      ["system", "You are a helpful, sarcastic AI assistant."],
      ["human", "{input}"],
    ]);
    const parser = new StringOutputParser();
    const pipeline = prompt.pipe(this.llm).pipe(parser);
    const stream = await pipeline.stream({ input: userInput });
    return stream;
  }

  static async executeLinearChain2(userInput: string): Promise<string> {
    // 1. Define a strict template structure
    const response = await this.llm.invoke(userInput);
    return typeof response.content === "string"
      ? response.content
      : response.content.map((c) => ("text" in c ? c.text : "")).join("");
  }
  /**
   *
   */
  static async executeWebLoader(userInput: string) {
    const loader = new CheerioWebBaseLoader(
      "https://docs.langchain.com/oss/javascript/langchain/overview",
    );
    const docs = await loader.load();

    const splitter = new RecursiveCharacterTextSplitter({
      chunkSize: 200,
      chunkOverlap: 20,
    });

    const splittedDocs = await splitter.splitDocuments(docs);

    const vectorStore = new MemoryVectorStore(this.embeddings);

    await vectorStore.addDocuments(splittedDocs);

    const retriever = vectorStore.asRetriever({
      k: 2,
    });

    const results = await retriever._getRelevantDocuments(userInput);
    const resultDocs = results.map((result) => result.pageContent);

    const template = ChatPromptTemplate.fromMessages([
      [
        "system",
        "Answer the users question based on the following context: {context}",
      ],
      ["human", "{input}"],
    ]);

    const chain = template.pipe(this.llm);

    const response = await chain.invoke({
      input: userInput,
      context: resultDocs,
    });

    return response;
  }
}
