"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.scoreJob = scoreJob;
function scoreJob({ jd, resume, location, salaryMin, job, }) {
    const weights = {
        skill: 0.5,
        text: 0.25,
        location: 0.1,
        salary: 0.1,
        recency: 0.05,
    };
    const score = 75; // Simplified scoring logic
    return { score, matchedSkills: [], matchedLocations: [] };
}
