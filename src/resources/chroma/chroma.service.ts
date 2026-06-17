import { ChatOllama } from "@langchain/ollama";
import { ChatPromptTemplate } from "@langchain/core/prompts";
import { StringOutputParser } from "@langchain/core/output_parsers";
import { RecursiveCharacterTextSplitter } from "@langchain/textsplitters";
import { PDFLoader } from "@langchain/community/document_loaders/fs/pdf";
import { getOrCreateCollection } from "@/databases/chroma-db";
import { PDFParse } from "pdf-parse";
import { IterableReadableStream } from "@langchain/core/utils/stream";

export class ChromaService {
  private static llm = new ChatOllama({
    baseUrl: "http://localhost:11434", // Default Ollama local endpoint
    model: "llama3.2:latest",
    temperature: 0.1,
  });
  static async getAllDocuments() {
    try {
      const nativeCollection = await getOrCreateCollection();
      const allData = await nativeCollection.get();
      const formattedRecords = allData.ids.map((id, index) => ({
        id: id,
        document: allData.documents[index],
        metadata: allData.metadatas[index],
      }));
      return {
        data: formattedRecords,
        totalCount: await nativeCollection.count(),
      };
    } catch (error) {
      console.log(error);
      throw new Error("Unable to fetch record(s)");
    }
  }
  /**
   *
   *
   */
  static async executeSavePdfIntoChromaDb(): Promise<string> {
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
    console.log(`Parsed ${splittedDocs.length} chunks from the PDF.`);

    // --- MAP THE DATA FOR NATIVE CHROMA ---
    // 1. Generate unique string IDs using the array index
    const ids = splittedDocs.map((_, index) => `nrs_pdf_chunk_${index}`);

    // 2. Extract the text strings out of pageContent
    const documents = splittedDocs.map((doc) => doc.pageContent);

    // 3. Extract the existing metadata objects (or pass an empty object if undefined)
    // const metadatas = splittedDocs.map((doc) => doc.metadata || {});

    const nativeCollection = await getOrCreateCollection();

    nativeCollection.add({
      ids: ids,
      documents: documents,
    });

    return "Pdf Saved in chroma DB";
  }

  static async executeQueryPDF(userInput: string) {
    if (
      !userInput ||
      typeof userInput !== "string" ||
      userInput.trim().length === 0
    ) {
      throw new Error(
        "Cannot execute vector search query because the incoming prompt text string is undefined or empty.",
      );
    }
    const nativeCollection = await getOrCreateCollection();
    const result = await nativeCollection.query({
      queryTexts: [userInput],
      nResults: 1,
    });

    const relevantInfo = result?.documents?.[0]?.[0];

    const template = ChatPromptTemplate.fromMessages([
      [
        "system",
        "You are a precise QA assistant.\n" +
          // "Answer the user's question directly, clearly, and concisely based strictly on the context provided below.\n\n" +
          "Answer the user's question directly, clearly, and based strictly on the context provided below.\n\n" +
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
      context: relevantInfo,
    });

    return response;
  }
  static async executeQueryPDF2(
    userInput: string,
  ): Promise<IterableReadableStream<string>> {
    if (
      !userInput ||
      typeof userInput !== "string" ||
      userInput.trim().length === 0
    ) {
      throw new Error(
        "Cannot execute vector search query because the incoming prompt text string is undefined or empty.",
      );
    }
    const nativeCollection = await getOrCreateCollection();
    const result = await nativeCollection.query({
      queryTexts: [userInput],
      nResults: 1,
    });

    const relevantInfo = result?.documents?.[0]?.[0];

    const template = ChatPromptTemplate.fromMessages([
      [
        "system",
        "You are a precise QA assistant.\n" +
          // "Answer the user's question directly, clearly, and concisely based strictly on the context provided below.\n\n" +
          "Answer the user's question directly, clearly, and based strictly on the context provided below.\n\n" +
          "CRITICAL RULES:\n" +
          "- DO NOT use conversational filler phrases like 'According to the context', 'Based on the provided text', or 'The document mentions'.\n" +
          "- Simply answer the question directly in raw, natural text sentences.\n" +
          "- If the context does not contain the answer, reply with: 'Information not found.'\n\n" +
          "Context:\n{context}",
      ],
      ["human", "{input}"],
    ]);

    const parser = new StringOutputParser();
    const pipeline = template.pipe(this.llm).pipe(parser);
    const stream = await pipeline.stream({
      input: userInput,
      context: relevantInfo,
    });

    return stream;
  }
  /**
   *
   */
  /**
   * Drops the entire collection from Chroma DB, completely wiping out all records.
   */
  static async clearAllRecords(totalChunks: number): Promise<string> {
    console.log("🗑️ Wiping entire collection from Chroma DB...");
    const nativeCollection = await getOrCreateCollection();

    const targetIds = Array.from(
      { length: totalChunks },
      (_, i) => `nrs_pdf_chunk_${i}`,
    );
    // We use the chromaClient directly to drop the collection by name
    await nativeCollection.delete({
      ids: targetIds,
    });

    return "Collection dropped and completely cleared.";
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
    const documents = splittedDocs.map((doc) => doc.pageContent);
    const metadatas = splittedDocs.map((_, index) => ({
      source: originalName,
      index,
    }));

    console.log("🧠 Connecting to safe Pinecone runtime context wrapper...");
    const vectorStore = await getOrCreateCollection();

    console.log(
      "📡 Streaming embeddings pipeline execution into cloud instance...",
    );
    await vectorStore.add({
      ids: ids,
      documents,
      metadatas,
    });

    return {
      message: "PDF successfully chunked, embedded, and stored.",
      chunkCount: splittedDocs.length,
    };
  }
}
