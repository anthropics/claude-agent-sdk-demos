import express from "express";
import cors from "cors";
import { generateChart } from "./api/generate.js";

const app = express();
const PORT = 3001;

app.use(cors());
app.use(express.json());

// Health check
app.get("/health", (req, res) => {
  res.json({ status: "ok" });
});

// Generate chart endpoint
app.post("/api/generate", async (req, res) => {
  try {
    const { centerGoal, pillars } = req.body;

    if (!centerGoal || !Array.isArray(pillars) || pillars.length !== 8) {
      return res.status(400).json({ error: "Invalid input: centerGoal and 8 pillars required" });
    }

    const result = await generateChart(centerGoal, pillars);
    res.json(result);
  } catch (error) {
    console.error("Generation error:", error);
    res.status(500).json({
      error: error instanceof Error ? error.message : "Failed to generate chart",
    });
  }
});

app.listen(PORT, () => {
  console.log(`Mandala Chart API server running on http://localhost:${PORT}`);
});
