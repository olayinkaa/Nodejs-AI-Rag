// src/services/langchain.service.ts
import { ChatOllama, OllamaEmbeddings } from "@langchain/ollama";
import { ChatPromptTemplate } from "@langchain/core/prompts";
import { StringOutputParser } from "@langchain/core/output_parsers";
import type { IterableReadableStream } from "@langchain/core/utils/stream";
import { MemoryVectorStore } from "@langchain/classic/vectorstores/memory";
// import { CheerioWebBaseLoader } from "@langchain/community/document_loaders/web/cheerio";
import { PuppeteerWebBaseLoader } from "@langchain/community/document_loaders/web/puppeteer";
import { RecursiveCharacterTextSplitter } from "@langchain/textsplitters";
import { PDFLoader } from "@langchain/community/document_loaders/fs/pdf";

export class LangChainService {
  private static llm = new ChatOllama({
    baseUrl: "http://localhost:11434", // Default Ollama local endpoint
    model: "llama3.2:latest",
    temperature: 0.7,
  });

  private static embeddings = new OllamaEmbeddings({
    baseUrl: "http://localhost:11434", // Default value
    model: "nomic-embed-text:v1.5",
  });

  /**
   *
   * @param userInput
   * @returns
   */
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

  /**
   *
   */
  static async executeWebLoader(userInput: string): Promise<string> {
    console.log("📥 Loading webpage content...");
    // const loader = new CheerioWebBaseLoader("https://etranzact.com/#/business");
    const loader = new PuppeteerWebBaseLoader(
      "https://etranzact.com/#/business",
      {
        launchOptions: {
          headless: true, // Run silently in the background
          executablePath:
            "/Applications/Google Chrome.app/Contents/MacOS/Google Chrome",
        },
        gotoOptions: {
          // CRITICAL: Tells the browser to wait until the page stops loading JavaScript API calls
          waitUntil: "networkidle0",
        },
      },
    );
    const docs = await loader.load();

    console.log("✂️ Splitting documents into pieces...");

    const splitter = new RecursiveCharacterTextSplitter({
      chunkSize: 500, // Increased slightly so context has actual substance
      chunkOverlap: 50,
    });

    const splittedDocs = await splitter.splitDocuments(docs);
    console.log(splittedDocs);

    console.log("🧠 Generating embeddings and saving to RAM store...");
    const vectorStore = new MemoryVectorStore(this.embeddings);
    await vectorStore.addDocuments(splittedDocs);

    const retriever = vectorStore.asRetriever({
      k: 2,
    });

    console.log("🔍 Extracting vector matching records...");

    const results = await retriever.invoke(userInput);
    const resultDocs = results.map((result) => result.pageContent).join("\n\n");

    const template = ChatPromptTemplate.fromMessages([
      [
        "system",
        "Answer the user's question based strictly on the following context:\n\n{context}",
      ],
      ["human", "{input}"],
    ]);

    // Appended StringOutputParser so it returns a clean string, not a complex object
    const chain = template.pipe(this.llm).pipe(new StringOutputParser());

    console.log("🤖 Asking Llama model for answers...");
    const response = await chain.invoke({
      input: userInput,
      context: resultDocs,
    });

    return response;
  }

  /**
   *
   *
   */
  static async executePDFLoader(userInput: string): Promise<string> {
    console.log("📥 Loading webpage content...");
    // const loader = new CheerioWebBaseLoader("https://etranzact.com/#/business");
    const loader = new PDFLoader("nrs.pdf", {
      splitPages: false,
    });

    const docs = await loader.load();

    console.log("✂️ Splitting documents into pieces...");

    const splitter = new RecursiveCharacterTextSplitter({
      separators: ["\n\n", "\n", ". ", " ", ""],
      chunkSize: 800, // Max character size per chunk (approx. 200 tokens)
      chunkOverlap: 80,
    });

    const splittedDocs = await splitter.splitDocuments(docs);
    console.log(splittedDocs);

    console.log("🧠 Generating embeddings and saving to RAM store...");
    const vectorStore = new MemoryVectorStore(this.embeddings);
    await vectorStore.addDocuments(splittedDocs);

    const retriever = vectorStore.asRetriever({
      k: 2,
    });

    console.log("🔍 Extracting vector matching records...");

    const results = await retriever.invoke(userInput);
    const resultDocs = results.map((result) => result.pageContent).join("\n\n");

    const template = ChatPromptTemplate.fromMessages([
      [
        "system",
        "Answer the user's question based strictly on the following context:\n\n{context}",
      ],
      ["human", "{input}"],
    ]);

    // FIX 3: Appended StringOutputParser so it returns a clean string, not a complex object
    const chain = template.pipe(this.llm).pipe(new StringOutputParser());

    console.log("🤖 Asking Llama model for answers...");
    const response = await chain.invoke({
      input: userInput,
      context: resultDocs,
    });

    return response;
  }
}
