import express, { Router } from "express";
import { cpayRouter } from "./cpay/cpay.router";
import { chromaRouter } from "./chroma/chroma.router";
import { pineConeRouter } from "./pinecone/pinecone.router";

export const restRouter: Router = express.Router();

restRouter.use("/cpay", cpayRouter);
restRouter.use("/chroma", chromaRouter);
restRouter.use("/pinecone", pineConeRouter);
