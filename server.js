import express from "express";
import dotenv from "dotenv";
import { connectDB } from "./src/database/db.js";
import cors from "cors";
import stringRouter from "./src/routes/stringRoutes.js";

dotenv.config();

const PORT = process.env.PORT || 4000;
const app = express();

// Database Connection
connectDB();

// Middlewares
app.use(cors());
app.use(express.json());

// Health check
app.get("/health", (req, res) => {
  res.status(200).json({ status: "Ok", message: "Server is healthy" });
});

// Routes
app.use("/strings", stringRouter);

// Home page
app.get("/", (req, res) => {
  res.status(200).json({
    message: "Welcome to the HNG String Analyzer Service API",
    endpoints: {
      analyze: "POST /strings",
      getAllWithFilters: "GET /strings",
      getSpecific: "GET /strings/:string_value",
      delete: "DELETE /strings/:string_value",
      naturalLanguageFilter: "GET /strings/filter-by-natural-language?query=<your query>"
    },
    documentation: "https://github.com/NecheRose/HNG-String-Analyzer-Service"
  });
});

// Start server
app.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`)
});


