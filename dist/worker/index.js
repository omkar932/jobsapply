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
exports.scrapeNaukri = scrapeNaukri;
const playwright_1 = require("playwright");
const node_schedule_1 = __importDefault(require("node-schedule"));
const mongoose_1 = __importDefault(require("mongoose"));
const profile_1 = require("../shared/profile");
const scoring_1 = require("../shared/scoring");
const Job_1 = require("../models/Job");
const dotenv_1 = __importDefault(require("dotenv"));
const fs_1 = __importDefault(require("fs"));
const path_1 = __importDefault(require("path"));
dotenv_1.default.config();
const MONGO_URI = process.env.MONGO_URI;
const API_BASE_URL = "http://localhost:4001";
const NAUKRI_EMAIL = process.env.NAUKRI_EMAIL || "";
const NAUKRI_PASSWORD = process.env.NAUKRI_PASSWORD || "";
function updateResume(page, resumePath) {
    return __awaiter(this, void 0, void 0, function* () {
        console.log("Navigating to profile page to update resume...");
        yield page.goto("https://www.naukri.com/mnjuser/profile?id=&altresid", {
            waitUntil: "domcontentloaded",
            timeout: 60000,
        });
        yield page.waitForTimeout(5000);
        // Upload resume file
        try {
            const fileInput = page.locator("#attachCV");
            yield fileInput.setInputFiles(resumePath);
            console.log(`✅ Resume file attached: ${resumePath}`);
        }
        catch (error) {
            console.error("❌ Failed to attach resume file:", error);
            throw error;
        }
        // Click Update button
        try {
            // Wait for confirmation only in the resume section
            try {
                const result = page.locator("#lazyAttachCV #result");
                yield result.waitFor({ state: "visible", timeout: 10000 });
                const resultText = yield result.textContent();
                console.log("Resume update result:", (resultText === null || resultText === void 0 ? void 0 : resultText.trim()) || "No message found");
            }
            catch (_a) {
                console.warn("⚠️ No visible result message found, but resume may still be updated.");
            }
        }
        catch (error) {
            console.error("❌ Failed to update resume:", error);
            throw error;
        }
    });
}
function scrapeNaukri() {
    return __awaiter(this, void 0, void 0, function* () {
        var _a;
        const browser = yield playwright_1.chromium.launch({
            headless: true, // Set to false for debugging
            args: ["--disable-blink-features=AutomationControlled"], // optional: reduces bot detection
        });
        const context = yield browser.newContext({
            userAgent: "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36",
        });
        const page = yield context.newPage();
        try {
            if (!NAUKRI_EMAIL || !NAUKRI_PASSWORD) {
                throw new Error("Missing NAUKRI_EMAIL or NAUKRI_PASSWORD in .env");
            }
            // Navigate to Naukri login page
            console.log("Navigating to login page");
            yield page.goto("https://www.naukri.com/nlogin/login", {
                waitUntil: "domcontentloaded",
                timeout: 60000,
            });
            console.log("Page loaded:", page.url());
            // Wait for page to fully load
            yield page.waitForTimeout(3000);
            // Check for redirects
            if (!page.url().includes("nlogin/login")) {
                console.warn("⚠️ Redirect detected:", page.url());
                throw new Error("Unexpected redirect on login page");
            }
            // More robust selectors with multiple fallbacks
            const emailSelectors = [
                'input[id="usernameField"]',
                'input[placeholder*="Email"]',
                'input[placeholder*="email"]',
                'input[name="email"]',
                'input[type="email"]',
                'input[id*="email"]',
                'input[class*="email"]',
            ];
            const passwordSelectors = [
                'input[id="passwordField"]',
                'input[type="password"]',
                'input[placeholder*="Password"]',
                'input[placeholder*="password"]',
                'input[name="password"]',
                'input[id*="password"]',
                'input[class*="password"]',
            ];
            const submitSelectors = [
                'button[data-ga-track*="login"][type="submit"]',
                'button.waves-effect.waves-light.btn-large.btn-block.btn-bold.blue-btn[type="submit"]',
                'button.blue-btn[type="submit"]:has-text("Login")',
                'button[type="submit"]:has-text("Login")',
                'button.waves-effect:has-text("Login")',
                'button:has-text("Login")',
                "button.loginButton",
                'button[class*="login"]',
                ".loginButton",
                "#loginButton",
            ];
            // Function to find element with multiple selectors
            function findElement(selectors, elementName) {
                return __awaiter(this, void 0, void 0, function* () {
                    for (const selector of selectors) {
                        try {
                            const element = page.locator(selector);
                            yield element.waitFor({ state: "visible", timeout: 5000 });
                            console.log(`✅ Found ${elementName} with selector: ${selector}`);
                            return element;
                        }
                        catch (error) {
                            console.log(`❌ Failed to find ${elementName} with selector: ${selector}`);
                            continue;
                        }
                    }
                    throw new Error(`Could not locate ${elementName} with any selector`);
                });
            }
            // Find and interact with login elements
            console.log("Looking for email input...");
            const emailInput = yield findElement(emailSelectors, "email input");
            console.log("Looking for password input...");
            const passwordInput = yield findElement(passwordSelectors, "password input");
            console.log("Looking for submit button...");
            const submitButton = yield findElement(submitSelectors, "submit button");
            // Clear fields before filling (in case they have default values)
            yield emailInput.clear();
            yield passwordInput.clear();
            // Fill login form with delays
            console.log("Filling email...");
            yield emailInput.fill(NAUKRI_EMAIL);
            yield page.waitForTimeout(1000);
            console.log("Filling password...");
            yield passwordInput.fill(NAUKRI_PASSWORD);
            yield page.waitForTimeout(1000);
            console.log("Clicking login button...");
            // Alternative approach - click by exact text match
            try {
                yield submitButton.click();
            }
            catch (error) {
                console.log("First click attempt failed, trying alternative approach...");
                yield page.click('button:has-text("Login"):not(:has-text("Forgot"))');
            }
            // Wait for login completion with multiple checks
            console.log("Waiting for login completion...");
            yield page.waitForTimeout(5000);
            // Check for CAPTCHA or 2FA with more selectors
            const captchaSelectors = [
                'div[id*="captcha"]',
                'div[class*="captcha"]',
                'iframe[src*="captcha"]',
                ".captcha",
                "#captcha",
                '[data-test="captcha"]',
            ];
            let captchaFound = false;
            for (const selector of captchaSelectors) {
                try {
                    if (yield page.locator(selector).isVisible({ timeout: 2000 })) {
                        captchaFound = true;
                        break;
                    }
                }
                catch (error) {
                    // Continue checking other selectors
                }
            }
            if (captchaFound) {
                console.warn("⚠️ CAPTCHA detected. Manual intervention required.");
                throw new Error("CAPTCHA encountered; automated login not possible");
            }
            // Check for error messages
            const errorSelectors = [
                ".err-msg",
                ".error-msg",
                ".error",
                '[class*="error"]',
                ".login-error",
            ];
            for (const selector of errorSelectors) {
                try {
                    const errorElement = page.locator(selector);
                    if (yield errorElement.isVisible({ timeout: 2000 })) {
                        const errorText = yield errorElement.textContent();
                        console.error("Login error detected:", errorText);
                        throw new Error(`Login failed: ${errorText}`);
                    }
                }
                catch (error) {
                    // Continue checking other selectors
                }
            }
            // Verify login success with multiple indicators
            const loginSuccessSelectors = [
                'a[href*="/my-naukri"]',
                'a[href*="/mnjuser/profile"]',
                'div[class*="profile"]',
                'button:has-text("Logout")',
                ".user-name",
                ".profile-name",
                '[data-test="user-menu"]',
                ".naukri-header .user",
                ".userPro",
                ".user-menu",
                '[class*="userPro"]',
                '[class*="profile-pic"]',
                ".profile-pic",
                'img[alt*="profile"]',
                'a[title*="Profile"]',
                '.naukri-header a[href*="profile"]',
            ];
            let isLoggedIn = false;
            for (const selector of loginSuccessSelectors) {
                try {
                    if (yield page.locator(selector).isVisible({ timeout: 5000 })) {
                        isLoggedIn = true;
                        console.log(`✅ Login verified with selector: ${selector}`);
                        break;
                    }
                }
                catch (error) {
                    // Continue checking other selectors
                }
            }
            if (!isLoggedIn) {
                console.error("Current URL:", page.url());
                console.error("Page title:", yield page.title());
                // Additional checks for successful login based on URL and title
                const currentUrl = page.url();
                const pageTitle = yield page.title();
                // If we're on a Naukri page and not on login page, consider it successful
                if ((currentUrl.includes("naukri.com") &&
                    !currentUrl.includes("/nlogin/")) ||
                    pageTitle.includes("Mynaukri") ||
                    pageTitle.includes("Home | Mynaukri") ||
                    pageTitle.includes("Naukri.com")) {
                    console.log("✅ Login detected via URL/title analysis");
                    isLoggedIn = true;
                }
            }
            if (!isLoggedIn) {
                // Save screenshot for debugging
                console.log("Screenshot saved as login-failed.png");
                throw new Error("Login failed: Unable to verify login success");
            }
            console.log("✅ Successfully logged in to Naukri");
            // Navigate to job listings
            console.log("Navigating to job listings...");
            yield page.goto("https://www.naukri.com/mern-stack-developer-node-js-developer-jobs-in-pune?k=mern stack developer, node js developer&l=pune, mumbai, navi mumbai&experience=3", {
                waitUntil: "domcontentloaded",
                timeout: 60000,
            });
            yield page.waitForTimeout(5000); // Wait for page load
            // Wait for job listings to load with multiple selectors
            console.log("Waiting for job listings to load...");
            console.log("Applying sort by Date...");
            try {
                const sortButton = page.locator("#filter-sort");
                yield sortButton.waitFor({ state: "visible", timeout: 5000 });
                yield sortButton.click();
                // Wait for dropdown to appear
                const dateOption = page.locator('a[data-id="filter-sort-f"]');
                yield dateOption.waitFor({ state: "visible", timeout: 5000 });
                yield dateOption.click();
                console.log("✅ Applied sort by Date");
                yield page.waitForTimeout(3000); // wait for page refresh
            }
            catch (sortError) {
                console.error("⚠️ Failed to apply sort by Date:", sortError);
            }
            const jobSelectors = [
                ".srp-jobtuple-wrapper",
                ".cust-job-tuple",
                ".job-listing-container",
                ".styles_job-listing-container__OCfZC",
                "[data-job-id]",
            ];
            let jobsFound = false;
            for (const selector of jobSelectors) {
                try {
                    yield page.waitForSelector(selector, { timeout: 10000 });
                    console.log(`✅ Found jobs with selector: ${selector}`);
                    jobsFound = true;
                    break;
                }
                catch (error) {
                    console.log(`❌ Failed to find jobs with selector: ${selector}`);
                    continue;
                }
            }
            if (!jobsFound) {
                // Take a screenshot to see what's on the page
                console.log("Screenshot saved as job-listings-page.png");
                // Log page content for debugging
                console.log("Current URL:", page.url());
                console.log("Page title:", yield page.title());
                throw new Error("Could not find job listings on the page");
            }
            // with this line:
            const jobs = yield page.$$eval(".srp-jobtuple-wrapper", (elements) => {
                // The rest of the code inside the callback remains the same
                return elements.map((el) => {
                    var _a, _b, _c, _d, _e, _f, _g, _h, _j, _k, _l, _m, _o;
                    return ({
                        id: el.getAttribute("data-job-id") || "",
                        title: ((_b = (_a = el.querySelector(".title")) === null || _a === void 0 ? void 0 : _a.textContent) === null || _b === void 0 ? void 0 : _b.trim()) || "",
                        company: ((_d = (_c = el.querySelector(".comp-name")) === null || _c === void 0 ? void 0 : _c.textContent) === null || _d === void 0 ? void 0 : _d.trim()) || "",
                        location: ((_f = (_e = el.querySelector(".locWdth")) === null || _e === void 0 ? void 0 : _e.textContent) === null || _f === void 0 ? void 0 : _f.trim()) || "",
                        jd: ((_h = (_g = el.querySelector(".job-desc")) === null || _g === void 0 ? void 0 : _g.textContent) === null || _h === void 0 ? void 0 : _h.trim()) || "",
                        jdUrl: ((_j = el.querySelector(".title a")) === null || _j === void 0 ? void 0 : _j.href) || "",
                        platform: "Naukri",
                        salary: "",
                        postedAt: ((_l = (_k = el.querySelector(".job-post-day")) === null || _k === void 0 ? void 0 : _k.textContent) === null || _l === void 0 ? void 0 : _l.trim()) || "",
                        experience: ((_o = (_m = el.querySelector(".expwdth")) === null || _m === void 0 ? void 0 : _m.textContent) === null || _o === void 0 ? void 0 : _o.trim()) || "",
                    });
                });
            });
            console.log(`Found ${jobs.length} jobs`);
            for (const job of jobs) {
                try {
                    // Parse salary from job description or other sources if available
                    // Since salary is not in the current structure, set as undefined
                    const jobData = Object.assign(Object.assign({}, job), { salaryMin: undefined, salaryMax: undefined, postedAt: job.postedAt ? new Date() : undefined, remote: job.location.toLowerCase().includes("remote"), collectedAt: new Date() });
                    const match = (0, scoring_1.scoreJob)({
                        jd: jobData.jd,
                        resume: (profile_1.PROFILE === null || profile_1.PROFILE === void 0 ? void 0 : profile_1.PROFILE.resume) || "",
                        location: ((_a = profile_1.PROFILE === null || profile_1.PROFILE === void 0 ? void 0 : profile_1.PROFILE.preferredLocations) === null || _a === void 0 ? void 0 : _a.join(",")) || "",
                        salaryMin: (profile_1.PROFILE === null || profile_1.PROFILE === void 0 ? void 0 : profile_1.PROFILE.salaryMin) || 0,
                        job: {
                            location: jobData.location,
                            salaryMin: jobData.salaryMin,
                            salaryMax: jobData.salaryMax,
                            postedAt: jobData.postedAt,
                            remote: jobData.remote,
                        },
                    });
                    yield Job_1.JobModel.findOneAndUpdate({ id: jobData.id, platform: jobData.platform }, Object.assign(Object.assign({}, jobData), { match }), { upsert: true });
                    try {
                        const response = yield fetch(`${API_BASE_URL}/api/jobs/notify`, {
                            method: "POST",
                            headers: { "Content-Type": "application/json" },
                            body: JSON.stringify([
                                {
                                    id: jobData.id,
                                    title: jobData.title,
                                    company: jobData.company,
                                    location: jobData.location,
                                    platform: jobData.platform,
                                    jdUrl: jobData.jdUrl,
                                    score: match.score,
                                },
                            ]),
                        });
                        if (!response.ok) {
                            console.error(`Failed to notify for job ${jobData.id}: ${response.statusText}`);
                        }
                    }
                    catch (notifyError) {
                        console.error(`Error notifying for job ${jobData.id}:`, notifyError);
                    }
                }
                catch (jobError) {
                    console.error(`Error processing job ${job.id}:`, jobError);
                }
            }
            const RESUME_PATH = path_1.default.resolve(__dirname, "./Resume.pdf"); // adjust as needed
            if (!fs_1.default.existsSync(RESUME_PATH)) {
                throw new Error(`Resume file not found at: ${RESUME_PATH}`);
            }
            yield updateResume(page, RESUME_PATH);
            console.log(`✅ Scraped ${jobs.length} jobs from Naukri`);
        }
        catch (error) {
            console.error("❌ Error scraping Naukri:", error);
            // Take screenshot for debugging
            try {
                console.log("Error screenshot saved as scrape-error.png");
            }
            catch (screenshotError) {
                console.error("Could not save screenshot:", screenshotError);
            }
        }
        finally {
            // await browser.close();
        }
    });
}
function start() {
    return __awaiter(this, void 0, void 0, function* () {
        try {
            if (!MONGO_URI) {
                throw new Error("Missing MONGO_URI in .env");
            }
            yield mongoose_1.default.connect(MONGO_URI);
            console.log("✅ Worker connected to MongoDB");
            node_schedule_1.default.scheduleJob("0 */2 * * *", scrapeNaukri);
            console.log("✅ Scheduled job scraper at 9:00 AM IST");
        }
        catch (error) {
            console.error("❌ Failed to start worker:", error);
            process.exit(1);
        }
    });
}
start();
