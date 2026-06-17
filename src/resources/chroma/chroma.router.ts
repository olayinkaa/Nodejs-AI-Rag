import express, { Router } from "express";
import { upload } from "@/common/multer";
import chromaController from "./chroma.controller";

export const chromaRouter: Router = express.Router();

chromaRouter.post("/chat", chromaController.getPdfInChromaDb2);
chromaRouter.get("/documents", chromaController.getAllDocuments);
chromaRouter.post("/save-pdf", chromaController.savePdfInChromaDb);
chromaRouter.delete("/remove-pdf", chromaController.deletePdfInChromaDb);
chromaRouter.post(
  "/upload",
  upload.single("file"),
  chromaController.uploadPdfIntoPinecone,
);
