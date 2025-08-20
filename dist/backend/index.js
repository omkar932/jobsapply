"use strict";
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.app = void 0;
const express_1 = __importDefault(require("express"));
const mongoose_1 = __importDefault(require("mongoose"));
const node_telegram_bot_api_1 = __importDefault(require("node-telegram-bot-api"));
const Job_1 = require("../models/Job");
const dotenv_1 = __importDefault(require("dotenv"));
const env = dotenv_1.default.config().parsed;
const app = (0, express_1.default)();
exports.app = app;
app.use(express_1.default.json());
const MONGO_URI = env.MONGO_URI;
const TELEGRAM_TOKEN = env.TELEGRAM_TOKEN || "";
const TELEGRAM_CHAT_ID = env.TELEGRAM_CHAT_ID || "";
const bot = new node_telegram_bot_api_1.default(TELEGRAM_TOKEN, { polling: false });
app.get("/health", (req, res) => res.json({ status: "OK" }));
app.get("/api/jobs", (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    const jobs = yield Job_1.JobModel.find().sort({ collectedAt: -1 }).limit(50);
    res.json(jobs);
}));
app.get("/api/jobs/stats/trends", (req, res) => __awaiter(void 0, void 0, void 0, function* () {
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
}));
app.post("/api/jobs/notify", (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    const jobs = req.body;
    for (const job of jobs) {
        const message = `🔥 New Job Match\n${job.title}\n🏢 ${job.company} | 📍 ${job.location}\n🟢 ${job.score}% match | 🌐 ${job.platform}\nView Job: ${job.jdUrl}`;
        yield bot.sendMessage(TELEGRAM_CHAT_ID, message);
    }
    res.json({ status: "Notified" });
}));
function start() {
    return __awaiter(this, void 0, void 0, function* () {
        try {
            yield mongoose_1.default.connect(MONGO_URI);
            console.log("✅ Connected to MongoDB");
            app.listen(4001, () => console.log("🚀 API running on http://localhost:4001"));
        }
        catch (error) {
            console.error("❌ MongoDB connection error:", error);
            process.exit(1);
        }
    });
}
start();
