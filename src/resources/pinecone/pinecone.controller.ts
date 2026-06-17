import { PineconeService } from "./pinecone.service";
import type { Request, Response } from "express";

export default {
  async savePdfInPinecone(_: Request, res: Response) {
    try {
      const result = await PineconeService.savePdfIntoPinecone();
      return res.status(200).json({ message: result });
    } catch (error: any) {
      console.log(error);
      return res.status(500).json({ error: error.message });
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
      const result = await PineconeService.processUploadedPdf(
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
  async getPdfFromDb(req: Request, res: Response) {
    try {
      const { message } = req.body;
      const result = await PineconeService.executeQueryPDF2(message);
      return res.status(200).json({ reply: result });
    } catch (error: any) {
      console.log(error);
      return res.status(500).json({ error: error.message });
    }
  },
  async deletePdfFromDb(req: Request, res: Response) {
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
      const statusMessage = await PineconeService.clearAllRecords(totalChunks);
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
