"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.JobModel = void 0;
const mongoose_1 = require("mongoose");
const JobSchema = new mongoose_1.Schema({
    id: { type: String, required: true },
    title: { type: String, required: true },
    company: { type: String, required: true },
    location: { type: String, required: true },
    jd: { type: String },
    jdUrl: { type: String, required: true },
    platform: { type: String, required: true },
    salary: { type: String },
    salaryMin: { type: Number },
    salaryMax: { type: Number },
    postedAt: { type: Date },
    remote: { type: Boolean },
    collectedAt: { type: Date, required: true },
    match: {
        score: { type: Number },
        matchedSkills: { type: [String] },
        matchedLocations: { type: [String] },
    },
}, { timestamps: true });
exports.JobModel = (0, mongoose_1.model)("Job", JobSchema);
