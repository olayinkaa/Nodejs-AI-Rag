import express, { Router } from "express";
import inmemoryController from "./inmemory.controller";

export const inMemoryRouter: Router = express.Router();

inMemoryRouter.post("/chat", inmemoryController.OllamaRagChat);
