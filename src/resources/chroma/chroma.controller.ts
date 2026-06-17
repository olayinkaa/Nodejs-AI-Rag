import type { Request, Response } from "express";
import { ChromaService } from "./chroma.service";

export default {
  async getAllDocuments(_: Request, res: Response) {
    try {
      const result = await ChromaService.getAllDocuments();
      return res
        .status(200)
        .json({ message: "Successfully Processed", content: result });
    } catch (error: any) {
      console.log(error);
      return res.status(500).json({ error: error.message });
    }
  },
  async savePdfInChromaDb(_: Request, res: Response) {
    try {
      const result = await ChromaService.executeSavePdfIntoChromaDb();
      res.status(200).json({ message: result });
    } catch (error: any) {
      console.log(error);
      res.status(500).json({ error: error.message });
    }
  },
  async uploadPdfIntoPinecone(req: Request, res: Response) {
    try {
      // Validate file presence
      if (!req.file) {
        return res.status(400).json({
          success: false,
          error: "Please attach a PDF file under the 'file' parameter.",
        });
      }

      // Execute ingestion logic
      const result = await ChromaService.processUploadedPdf(
        req.file.buffer,
        req.file.originalname,
      );

      return res.status(201).json({
        success: true,
        filename: req.file.originalname,
        sizeInBytes: req.file.size,
        ...result,
      });
    } catch (error: any) {
      console.error("💥 Error during dynamic file pipeline processing:", error);
      return res.status(500).json({ success: false, error: error.message });
    }
  },
  async getPdfInChromaDb(req: Request, res: Response) {
    try {
      const { prompt } = req.body;
      const result = await ChromaService.executeQueryPDF(prompt);
      // return res.status(200).json({ reply: result });
      res.setHeader("Content-Type", "text/plain");
      return res.status(200).send(result);
    } catch (error: any) {
      console.log(error);
      return res.status(500).json({ error: error.message });
    }
  },
  async getPdfInChromaDb2(req: Request, res: Response) {
    try {
      const { prompt } = req.body;

      res.setHeader("Content-Type", "text/event-stream");
      res.setHeader("Cache-Control", "no-cache");
      res.setHeader("Connection", "keep-alive");
      res.flushHeaders();

      const tokenStream = await ChromaService.executeQueryPDF(prompt);
      for await (const chunk of tokenStream) {
        // format chunk following standard SSE notation "data: {...}\n\n"
        res.write(`data: ${JSON.stringify({ token: chunk })}\n\n`);
      }

      // 4. Notify frontend UI that generation is successfully complete
      res.write("data: [DONE]\n\n");
      res.end();
      return true;
    } catch (error: any) {
      console.log(error);
      return res.status(500).json({ error: error.message });
    }
  },
  async deletePdfInChromaDb(req: Request, res: Response) {
    try {
      const countParam = req.query.count as string;
      if (!countParam) {
        return res.status(400).json({
          success: false,
          error: "Missing required query parameter: 'count'",
        });
      }

      const totalChunks = parseInt(countParam, 10);
      if (isNaN(totalChunks) || totalChunks <= 0) {
        return res.status(400).json({
          success: false,
          error: "The 'count' parameter must be a positive integer.",
        });
      }
      const statusMessage = await ChromaService.clearAllRecords(totalChunks);
      return res.status(200).json({
        success: true,
        message: statusMessage,
      });
    } catch (error: any) {
      console.log(error);
      return res.status(500).json({ error: error.message });
    }
  },
};
