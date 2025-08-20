import { Schema, model } from "mongoose";

const JobSchema = new Schema(
  {
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
  },
  { timestamps: true }
);

export const JobModel = model("Job", JobSchema);
