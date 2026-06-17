import express, { Router } from "express";
import pineconeController from "./pinecone.controller";
import { upload } from "@/common/multer";

export const pineConeRouter: Router = express.Router();

pineConeRouter.post("/chat", pineconeController.getPdfFromDb);
pineConeRouter.post("/save-pdf", pineconeController.savePdfInPinecone);
pineConeRouter.post(
  "/upload",
  upload.single("file"),
  pineconeController.uploadPdfIntoPinecone,
);
pineConeRouter.delete("/remove-pdf", pineconeController.deletePdfFromDb);
