import express, { Router } from "express";
import cpayController from "./cpay.controller";

export const cpayRouter: Router = express.Router();

cpayRouter.post("/chat", cpayController.OllamaRagChat);
