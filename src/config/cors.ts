// src/config/cors.ts
import { CorsOptions } from "cors";

// Define your allowed domains array here
const allowedOrigins = [
  "http://localhost:3001",
  "http://localhost:6543",
  // "https://yourproductionapp.com" <-- easily add staging/production later
];

export const corsOptions: CorsOptions = {
  origin: (origin, callback) => {
    // Allow requests with no origin (like server-to-server, postman, or curl)
    if (!origin) return callback(null, true);

    if (allowedOrigins.indexOf(origin) !== -1) {
      callback(null, true);
    } else {
      callback(
        new Error("Blocked by CORS policy: This origin is not allowed access."),
      );
    }
  },
  methods: ["GET", "POST", "PUT", "DELETE", "OPTIONS"],
  allowedHeaders: ["Content-Type", "Authorization"],
  credentials: true,
};
