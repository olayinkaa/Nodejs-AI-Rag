import { ChatOllama } from "@langchain/ollama";
import { ChatPromptTemplate } from "@langchain/core/prompts";
import { StringOutputParser } from "@langchain/core/output_parsers";
import { RecursiveCharacterTextSplitter } from "@langchain/textsplitters";
import { PDFLoader } from "@langchain/community/document_loaders/fs/pdf";
import { getPineconeVectorStore } from "@/databases/pinecone";
import { PDFParse } from "pdf-parse";

export class PineconeService {
  private static llm = new ChatOllama({
    baseUrl: "http://localhost:11434", // Default Ollama local endpoint
    model: "llama3.2:latest",
    temperature: 0.1,
  });
  /**
   *
   *
   */
  static async savePdfIntoPinecone(): Promise<string> {
    console.log("📥 Loading webpage content...");
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
    const vectorStore = await getPineconeVectorStore();

    const ids = splittedDocs.map((_, index) => `nrs_pdf_chunk_${index}`);
    await vectorStore.addDocuments(splittedDocs, { ids });

    return "Pdf Saved in Pinecone DB";
  }
  /**
   * AsRetriever
   * @param userInput
   * @returns
   */
  static async executeQueryPDF(userInput: string) {
    const vectorStore = await getPineconeVectorStore();
    const retriever = vectorStore.asRetriever({
      k: 2,
    });

    const results = await retriever.invoke(userInput);

    console.log(results);

    const template = ChatPromptTemplate.fromMessages([
      [
        "system",
        "You are a precise QA assistant.\n" +
          "Answer the user's question directly, clearly, and concisely based strictly on the context provided below.\n\n" +
          "CRITICAL RULES:\n" +
          "- DO NOT use conversational filler phrases like 'According to the context', 'Based on the provided text', or 'The document mentions'.\n" +
          "- Simply answer the question directly in raw, natural text sentences.\n" +
          "- If the context does not contain the answer, reply with: 'Information not found.'\n\n" +
          "Context:\n{context}",
      ],
      ["human", "{input}"],
    ]);

    const chain = template.pipe(this.llm).pipe(new StringOutputParser());
    console.log("🤖 Asking Llama model for answers...");
    const response = await chain.invoke({
      input: userInput,
      context: results,
    });

    return response;
  }
  /**
   * Similarity Search
   */
  static async executeQueryPDF2(userInput: string): Promise<string> {
    console.log("🔍 Extracting matching context vectors from Pinecone...");

    // Fetch connection safely at call time
    const vectorStore = await getPineconeVectorStore();

    // Pull the top 3 most similar text chunks matching the user's string query
    const similarityResults = await vectorStore.similaritySearch(userInput, 3);
    const relevantInfo = similarityResults
      .map((doc) => doc.pageContent)
      .join("\n\n");

    console.log({ similarityResults, relevantInfo });

    if (!relevantInfo) {
      return "Information not found.";
    }

    // Strict system prompt enforcing zero conversational filler and zero JSON leaks
    const template = ChatPromptTemplate.fromMessages([
      [
        "system",
        "You are a precise QA assistant.\n" +
          "Answer the user's question directly, clearly, and concisely based strictly on the context provided below.\n\n" +
          "CRITICAL RULES:\n" +
          "- DO NOT use conversational filler phrases like 'According to the context', 'Based on the text', or 'The document says'.\n" +
          "- Simply answer the question directly in raw, natural text sentences.\n" +
          "- If the context does not contain the answer, reply with: 'Information not found.'\n\n" +
          "Context:\n{context}",
      ],
      ["human", "{input}"],
    ]);

    const chain = template.pipe(this.llm).pipe(new StringOutputParser());

    console.log("🤖 Asking Llama model for responses...");
    const response = await chain.invoke({
      input: userInput,
      context: relevantInfo,
    });

    return response;
  }

  /**
   *
   * @returns
   */
  static async clearAllRecords(totalChunks: number): Promise<string> {
    console.log("🗑️ Wiping entire collection from pinecone DB...");
    const vectorStore = await getPineconeVectorStore();

    // Regenerate the explicit array of matching keys used during ingestion
    const targetIds = Array.from(
      { length: totalChunks },
      (_, i) => `nrs_pdf_chunk_${i}`,
    );
    // Direct deletion call inside LangChain
    await vectorStore.delete({
      ids: targetIds,
    });
    // We use the chromaClient directly to drop the collection by name

    return "Pinecone vector index namespace successfully wiped clean.";
  }

  /**
   *
   * @param fileBuffer
   * @param originalName
   * @returns
   */
  static async processUploadedPdf(
    fileBuffer: Buffer,
    originalName: string,
  ): Promise<{ message: string; chunkCount: number }> {
    console.log(`📥 Processing uploaded file buffer for: ${originalName}...`);

    // 1. Load the PDF directly from the in-memory buffer using a Web Blob wrapper
    const uint8ArrayData = new Uint8Array(fileBuffer);
    const parsedPdf = new PDFParse(uint8ArrayData);
    const rawTextResult = await parsedPdf.getText();
    const rawText = rawTextResult.text;

    if (!rawText || rawText.trim().length === 0) {
      throw new Error(
        "Could not extract any structural text from the uploaded PDF.",
      );
    }
    const baseDocument = {
      pageContent: rawText,
      metadata: { source: originalName },
    };

    console.log("✂️ Splitting document text into clean segments...");
    const splitter = new RecursiveCharacterTextSplitter({
      separators: ["\n\n", "\n", ". ", " ", ""],
      chunkSize: 800,
      chunkOverlap: 80,
    });

    const splittedDocs = await splitter.createDocuments(
      [baseDocument.pageContent],
      [baseDocument.metadata],
    );

    console.log(splittedDocs);

    if (splittedDocs.length === 0) {
      throw new Error("Could not split text extraction arrays cleanly.");
    }

    // 2. Normalize file names to prevent invalid characters in IDs
    const cleanFileName = originalName
      .replace(/[^a-zA-Z0-9]/g, "_")
      .toLowerCase();

    console.log("🚀 Generating deterministic vector IDs...");
    const ids = splittedDocs.map(
      (_, index) => `pdf_${cleanFileName}_chunk_${index}`,
    );

    console.log("🧠 Connecting to safe Pinecone runtime context wrapper...");
    const vectorStore = await getPineconeVectorStore();

    console.log(
      "📡 Streaming embeddings pipeline execution into cloud instance...",
    );
    await vectorStore.addDocuments(splittedDocs, { ids });

    return {
      message: "PDF successfully chunked, embedded, and stored.",
      chunkCount: splittedDocs.length,
    };
  }
}
