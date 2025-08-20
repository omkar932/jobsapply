export interface Job {
  location: string;
  salaryMin?: number;
  salaryMax?: number;
  postedAt?: Date;
  remote?: boolean;
}

export function scoreJob({
  jd,
  resume,
  location,
  salaryMin,
  job,
}: {
  jd: string;
  resume: string;
  location: string;
  salaryMin: number;
  job: Job;
}) {
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
