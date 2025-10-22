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

// Handle unknown routes
app.use((req, res) => {
  res.status(404).json({ message: "Route not found" });
});

// Start server
app.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`)
});


