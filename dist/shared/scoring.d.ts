export interface Job {
    location: string;
    salaryMin?: number;
    salaryMax?: number;
    postedAt?: Date;
    remote?: boolean;
}
export declare function scoreJob({ jd, resume, location, salaryMin, job, }: {
    jd: string;
    resume: string;
    location: string;
    salaryMin: number;
    job: Job;
}): {
    score: number;
    matchedSkills: never[];
    matchedLocations: never[];
};
