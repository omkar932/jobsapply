import { Page } from "playwright";
/**
 * @interface ApplicationResult
 * @description Result of a job application attempt
 */
interface ApplicationResult {
    success: boolean;
    reason: string;
    jobTitle: string;
    company: string;
    jobUrl?: string;
    timestamp?: Date;
}
/**
 * @function loginToLinkedIn
 * @description Logs into LinkedIn with improved error handling and detection avoidance
 */
declare function loginToLinkedIn(page: any): Promise<boolean>;
/**
 * @function applyToLinkedInJob
 * @description Improved job application process with better error handling
 */
declare function applyToLinkedInJob(page: Page, jobUrl: string, jobTitle: string, company: string): Promise<ApplicationResult>;
/**
 * @function scrapeAndApplyLinkedInJobs
 * @description Main function orchestrating the entire process
 * @param useExistingBrowser - If true, connects to existing browser instead of launching new one
 */
declare function scrapeAndApplyLinkedInJobs(useExistingBrowser?: boolean): Promise<ApplicationResult[]>;
export { scrapeAndApplyLinkedInJobs, applyToLinkedInJob, loginToLinkedIn };
