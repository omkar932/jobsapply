import express from "express";
import mongoose from "mongoose";
import TelegramBot from "node-telegram-bot-api";
import { JobModel } from "../models/Job";

import dotenv from "dotenv";
const env: any = dotenv.config().parsed;
const app = express();
app.use(express.json());

const MONGO_URI = env.MONGO_URI;
const TELEGRAM_TOKEN = env.TELEGRAM_TOKEN || "";
const TELEGRAM_CHAT_ID = env.TELEGRAM_CHAT_ID || "";

const bot = new TelegramBot(TELEGRAM_TOKEN, { polling: false });

app.get("/health", (req, res) => res.json({ status: "OK" }));

app.get("/api/jobs", async (req, res) => {
  const jobs = await JobModel.find().sort({ collectedAt: -1 }).limit(50);
  res.json(jobs);
});

app.get("/api/jobs/stats/trends", async (req, res) => {
  const trends = [
    {
      date: "2025-08-19",
      totalJobs: 100,
      highScoringJobs: 20,
      averageScore: 75,
    },
    // Mock data for testing
  ];
  res.json(trends);
});

app.post("/api/jobs/notify", async (req, res) => {
  const jobs = req.body;
  for (const job of jobs) {
    const message = `🔥 New Job Match\n${job.title}\n🏢 ${job.company} | 📍 ${job.location}\n🟢 ${job.score}% match | 🌐 ${job.platform}\nView Job: ${job.jdUrl}`;
    await bot.sendMessage(TELEGRAM_CHAT_ID, message);
  }
  res.json({ status: "Notified" });
});

async function start() {
  try {
    await mongoose.connect(MONGO_URI);
    console.log("✅ Connected to MongoDB");
    app.listen(4001, () =>
      console.log("🚀 API running on http://localhost:4001")
    );
  } catch (error) {
    console.error("❌ MongoDB connection error:", error);
    process.exit(1);
  }
}

start();

export { app };
