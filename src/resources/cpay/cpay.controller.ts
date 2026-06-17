import { LangChainService } from "@/common/ollama-langchain.service";
import type { Request, Response } from "express";

export default {
  async OllamaLangChainChat(req: Request, res: Response) {
    try {
      const { message, architecture } = req.body;
      let aiReply = "";
      if (architecture === "graph") {
        // Runs cyclical multi-step graph loops
        // aiReply = await LangGraphService.executeAgenticGraph(message);
      } else {
        aiReply = await LangChainService.executeLinearChain(message);
        res.status(200).json({ reply: aiReply });
      }
    } catch (error: any) {
      console.log(error);
      res.status(500).json({ error: error.message });
    }
  },

  async OllamaRagChat(req: Request, res: Response) {
    try {
      const { message } = req.body;
      const aiReply = await LangChainService.executePDFLoader(message);
      res.status(200).json({ reply: aiReply });
    } catch (error: any) {
      console.log(error);
      res.status(500).json({ error: error.message });
    }
  },

  async streamLangChain(req: Request, res: Response): Promise<void> {
    try {
      const { message } = req.body;

      if (!message) {
        res.status(400).json({ error: "Message payload required" });
        return;
      }

      // 1. Establish Server-Sent Events (SSE) headers
      res.setHeader("Content-Type", "text/event-stream");
      res.setHeader("Cache-Control", "no-cache");
      res.setHeader("Connection", "keep-alive");

      // 2. Request the chunk generator stream from LangChain
      const tokenStream =
        await LangChainService.executeLinearChainStream(message);

      // 3. Loop through chunks as your local Ollama engine yields them
      for await (const chunk of tokenStream) {
        // format chunk following standard SSE notation "data: {...}\n\n"
        res.write(`data: ${JSON.stringify({ token: chunk })}\n\n`);
      }

      // 4. Notify frontend UI that generation is successfully complete
      res.write("data: [DONE]\n\n");
      res.end();
    } catch (error) {
      console.error("LangChain Streaming Error:", error);
      res.write(
        `data: ${JSON.stringify({ error: "Stream error occurred" })}\n\n`,
      );
      res.end();
    }
  },
};
