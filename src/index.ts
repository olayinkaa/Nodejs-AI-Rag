import "dotenv/config";
import express from "express";
import { restRouter } from "./resources/index.js";
import { errorHandler } from "./utils/error-handler.js";
import cors from "cors";
import { corsOptions } from "./config/cors.js";

const app = express();
const PORT = process.env.PORT || 3000;

// 🔒 STRICT CORS CONFIGURATION

app.use(cors(corsOptions));

app.use(express.json());

app.use("/api", restRouter);

app.use(errorHandler);

app.listen(PORT, () => {
  console.log(`Server is running on http://localhost:${PORT}`);
});
