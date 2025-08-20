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
exports.scrapeAndApplyLinkedInJobs = scrapeAndApplyLinkedInJobs;
exports.applyToLinkedInJob = applyToLinkedInJob;
exports.loginToLinkedIn = loginToLinkedIn;
const playwright_1 = require("playwright");
const fs_1 = __importDefault(require("fs"));
const path_1 = __importDefault(require("path"));
const dotenv_1 = __importDefault(require("dotenv"));
dotenv_1.default.config();
// Environment variables with validation
const LINKEDIN_EMAIL = process.env.LINKEDIN_EMAIL || "";
const LINKEDIN_PASSWORD = process.env.LINKEDIN_PASSWORD || "";
if (!LINKEDIN_EMAIL || !LINKEDIN_PASSWORD) {
    throw new Error("Missing required environment variables: LINKEDIN_EMAIL and LINKEDIN_PASSWORD");
}
/**
 * @function delay
 * @description Creates a random delay to mimic human behavior
 */
function delay() {
    return __awaiter(this, arguments, void 0, function* (min = 1000, max = 3000) {
        const waitTime = Math.floor(Math.random() * (max - min + 1)) + min;
        yield new Promise((resolve) => setTimeout(resolve, waitTime));
    });
}
/**
 * @function loginToLinkedIn
 * @description Logs into LinkedIn with improved error handling and detection avoidance
 */
function loginToLinkedIn(page) {
    return __awaiter(this, void 0, void 0, function* () {
        try {
            if (!LINKEDIN_EMAIL || !LINKEDIN_PASSWORD) {
                throw new Error("Missing LinkedIn credentials in environment variables");
            }
            console.log("🔐 Starting LinkedIn login process...");
            // Navigate to LinkedIn login
            yield page.goto("https://www.linkedin.com/login", {
                waitUntil: "domcontentloaded",
                timeout: 60000,
            });
            yield page.waitForTimeout(3000);
            // Handle cookie consent if present
            try {
                const cookieSelectors = [
                    'button[data-tracking-control-name="guest_homepage-basic_accept-all"]',
                    'button:has-text("Accept cookies")',
                    'button:has-text("Accept")',
                    ".cookie-consent button",
                ];
                for (const selector of cookieSelectors) {
                    const cookieButton = page.locator(selector);
                    if (yield cookieButton.isVisible({ timeout: 2000 })) {
                        yield cookieButton.click();
                        console.log("✅ Accepted LinkedIn cookies");
                        yield page.waitForTimeout(1000);
                        break;
                    }
                }
            }
            catch (error) {
                console.log("No cookie banner found");
            }
            // Email input selectors
            const emailSelectors = [
                "#username",
                'input[name="session_key"]',
                'input[type="email"]',
                'input[autocomplete="username"]',
                "#session_key",
                "#login-email",
            ];
            // Password input selectors
            const passwordSelectors = [
                "#password",
                'input[name="session_password"]',
                'input[type="password"]',
                'input[autocomplete="current-password"]',
                "#session_password",
                "#login-password",
            ];
            // Submit button selectors
            const submitSelectors = [
                'button[type="submit"]',
                'button[data-litms-control-urn*="login-submit"]',
                'button:has-text("Sign in")',
                ".btn__primary--large",
                '#organic-div button[type="submit"]',
            ];
            // Helper function to find elements
            function findLinkedInElement(selectors, elementName) {
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
                    throw new Error(`Could not locate ${elementName} on LinkedIn login page`);
                });
            }
            // Find and fill email
            console.log("🔍 Looking for email input...");
            const emailInput = yield findLinkedInElement(emailSelectors, "email input");
            yield emailInput.clear();
            yield emailInput.fill(LINKEDIN_EMAIL);
            console.log("✅ Email filled");
            yield page.waitForTimeout(1000);
            // Find and fill password
            console.log("🔍 Looking for password input...");
            const passwordInput = yield findLinkedInElement(passwordSelectors, "password input");
            yield passwordInput.clear();
            yield passwordInput.fill(LINKEDIN_PASSWORD);
            console.log("✅ Password filled");
            yield page.waitForTimeout(1000);
            // Click submit button
            console.log("🔍 Looking for submit button...");
            const submitButton = yield findLinkedInElement(submitSelectors, "submit button");
            yield submitButton.click();
            console.log("✅ Submit button clicked");
            // Wait for login completion
            yield page.waitForTimeout(8000);
            // Check for CAPTCHA or verification
            const challengeSelectors = [
                'iframe[src*="challenge"]',
                ".challenge-page",
                'input[name="pin"]',
                'input[name="verification"]',
                ".two-step-verification",
                "#captcha",
                'iframe[title*="challenge"]',
            ];
            for (const selector of challengeSelectors) {
                try {
                    if (yield page.locator(selector).isVisible({ timeout: 3000 })) {
                        console.warn("⚠️ LinkedIn challenge/verification detected. Manual intervention required.");
                        console.warn("Please complete the verification in the browser and press Enter to continue...");
                        // Wait for manual intervention
                        yield new Promise((resolve) => {
                            const readline = require("readline").createInterface({
                                input: process.stdin,
                                output: process.stdout,
                            });
                            readline.question("Press Enter after completing verification...", () => {
                                readline.close();
                                resolve(null);
                            });
                        });
                        break;
                    }
                }
                catch (error) {
                    continue;
                }
            }
            // Check for login errors
            const errorSelectors = [
                ".form__input--error",
                ".alert--error",
                ".mercado-alert--error",
                'div:has-text("Please check your email")',
                'div:has-text("Couldn\'t find a LinkedIn account")',
            ];
            for (const selector of errorSelectors) {
                try {
                    const errorElement = page.locator(selector);
                    if (yield errorElement.isVisible({ timeout: 3000 })) {
                        const errorText = yield errorElement.textContent();
                        console.error("❌ LinkedIn login error:", errorText);
                        throw new Error(`LinkedIn login failed: ${errorText}`);
                    }
                }
                catch (error) {
                    continue;
                }
            }
            // Verify login success
            const loginSuccessSelectors = [
                ".global-nav__me",
                ".global-nav__me-photo",
                'button[data-control-name="identity_profile_photo"]',
                ".feed-identity-module",
                ".global-nav__primary-link--active",
                'img[alt*="profile photo"]',
                ".nav-item__profile-member-photo",
            ];
            let isLoggedIn = false;
            for (const selector of loginSuccessSelectors) {
                try {
                    if (yield page.locator(selector).isVisible({ timeout: 10000 })) {
                        isLoggedIn = true;
                        console.log(`✅ LinkedIn login verified with selector: ${selector}`);
                        break;
                    }
                }
                catch (error) {
                    continue;
                }
            }
            // Additional verification by URL
            if (!isLoggedIn) {
                const currentUrl = page.url();
                if (currentUrl.includes("linkedin.com/feed") ||
                    currentUrl.includes("linkedin.com/in/") ||
                    !currentUrl.includes("/login")) {
                    console.log("✅ LinkedIn login detected via URL analysis");
                    isLoggedIn = true;
                }
            }
            if (!isLoggedIn) {
                yield page.screenshot({ path: "linkedin-login-failed.png" });
                throw new Error("LinkedIn login verification failed");
            }
            console.log("✅ Successfully logged in to LinkedIn");
            return true;
        }
        catch (error) {
            console.error("❌ LinkedIn login failed:", error);
            yield page.screenshot({ path: "linkedin-login-error.png" });
            throw error;
        }
    });
}
/**
 * @function handleCookieConsent
 * @description Handles cookie consent banners
 */
function handleCookieConsent(page) {
    return __awaiter(this, void 0, void 0, function* () {
        const cookieSelectors = [
            'button[data-tracking-control-name="guest_homepage-basic_accept-all"]',
            'button:has-text("Accept cookies")',
            'button:has-text("Accept all")',
            '.cookie-consent button:has-text("Accept")',
        ];
        for (const selector of cookieSelectors) {
            try {
                const button = page.locator(selector);
                if (yield button.isVisible({ timeout: 2000 })) {
                    yield button.click();
                    console.log("✅ Cookie consent handled");
                    yield delay();
                    return;
                }
            }
            catch (error) {
                continue;
            }
        }
    });
}
/**
 * @function findElement
 * @description Helper to find elements using multiple selectors
 */
function findElement(page, selectors, elementName) {
    return __awaiter(this, void 0, void 0, function* () {
        for (const selector of selectors) {
            try {
                const element = page.locator(selector);
                if (yield element.isVisible({ timeout: 3000 })) {
                    console.log(`✅ Found ${elementName} with selector: ${selector}`);
                    return element;
                }
            }
            catch (error) {
                continue;
            }
        }
        throw new Error(`Could not locate ${elementName}`);
    });
}
/**
 * @function checkAnySelector
 * @description Check if any of the provided selectors is visible
 */
function checkAnySelector(page, selectors) {
    return __awaiter(this, void 0, void 0, function* () {
        for (const selector of selectors) {
            try {
                if (yield page.locator(selector).isVisible({ timeout: 2000 })) {
                    return true;
                }
            }
            catch (error) {
                continue;
            }
        }
        return false;
    });
}
/**
 * @function searchLinkedInJobs
 * @description Searches for jobs with improved filtering and extraction
 */
function searchLinkedInJobs(page) {
    return __awaiter(this, void 0, void 0, function* () {
        try {
            console.log("🔍 Navigating to LinkedIn Jobs...");
            yield page.goto("https://www.linkedin.com/jobs/search-results/?f_AL=true&f_TPR=r86400&geoId=114806696&keywords=MERN stack developer OR Node.js developer OR React developer OR Full stack developer", {
                waitUntil: "domcontentloaded",
                timeout: 60000,
            });
            yield delay(3000, 5000);
            // Apply filters
            yield applyJobFilters(page);
            // Extract job listings with pagination
            const allJobs = yield extractJobListings(page);
            console.log(`📋 Found ${allJobs.length} total jobs matching criteria`);
            return allJobs;
        }
        catch (error) {
            console.error("❌ Error searching LinkedIn jobs:", error.message);
            yield page.screenshot({ path: `linkedin-search-error-${Date.now()}.png` });
            throw error;
        }
    });
}
/**
 * @function applyJobFilters
 * @description Applies Easy Apply and date filters
 */
function applyJobFilters(page) {
    return __awaiter(this, void 0, void 0, function* () {
        try {
            // Easy Apply filter
            console.log("🔧 Applying Easy Apply filter...");
            const easyApplyButton = page
                .locator('button[aria-label*="Easy Apply"], button:has-text("Easy Apply")')
                .first();
            if (yield easyApplyButton.isVisible({ timeout: 5000 })) {
                yield easyApplyButton.click();
                yield delay();
                console.log("✅ Easy Apply filter applied");
            }
            // Date posted filter (Past week)
            console.log("🔧 Applying date filter...");
            const dateButton = page
                .locator('button[aria-label*="Date posted"], button:has-text("Date posted")')
                .first();
            if (yield dateButton.isVisible({ timeout: 5000 })) {
                yield dateButton.click();
                yield delay(1000, 2000);
                const pastWeekOption = page.locator('input[value="r604800"], label:has-text("Past week") input');
                if (yield pastWeekOption.isVisible({ timeout: 3000 })) {
                    yield pastWeekOption.check();
                    console.log("✅ Date filter applied");
                    yield delay();
                }
            }
            yield page.waitForLoadState("networkidle", { timeout: 10000 });
            yield delay(2000, 3000);
        }
        catch (error) {
            console.log("⚠️ Error applying filters:", error.message);
        }
    });
}
/**
 * @function extractJobListings
 * @description Extracts job listings with pagination support
 */
function extractJobListings(page) {
    return __awaiter(this, void 0, void 0, function* () {
        const allJobs = [];
        let pageNumber = 1;
        const maxPages = 3; // Limit to prevent infinite loops
        while (pageNumber <= maxPages) {
            console.log(`📄 Extracting jobs from page ${pageNumber}...`);
            const jobs = yield page.evaluate(() => {
                const jobCards = document.querySelectorAll(".jobs-search-results__list-item, .job-card-container");
                const jobListings = [];
                jobCards.forEach((card) => {
                    var _a, _b, _c;
                    try {
                        const titleElement = card.querySelector(".job-card-list__title strong, .job-card-list__title a");
                        const companyElement = card.querySelector(".job-card-container__primary-description, .job-card-container__company-name a");
                        const locationElement = card.querySelector(".job-card-container__metadata-item");
                        const linkElement = card.querySelector('a[data-control-name="job_card_click"]');
                        const easyApplyBadge = card.querySelector(".job-card-container__apply-method, .job-card-list__easy-apply");
                        if (titleElement && companyElement && linkElement) {
                            const title = ((_a = titleElement.textContent) === null || _a === void 0 ? void 0 : _a.trim()) || "";
                            const company = ((_b = companyElement.textContent) === null || _b === void 0 ? void 0 : _b.trim()) || "";
                            const location = ((_c = locationElement === null || locationElement === void 0 ? void 0 : locationElement.textContent) === null || _c === void 0 ? void 0 : _c.trim()) || "";
                            const jobUrl = linkElement.getAttribute("href") || "";
                            const isEasyApply = !!easyApplyBadge;
                            if (title && company && jobUrl && isEasyApply) {
                                jobListings.push({
                                    title,
                                    company,
                                    location,
                                    jobUrl: jobUrl.startsWith("http")
                                        ? jobUrl
                                        : `https://www.linkedin.com${jobUrl}`,
                                    isEasyApply,
                                });
                            }
                        }
                    }
                    catch (error) {
                        console.error("Error extracting job card:", error);
                    }
                });
                return jobListings;
            });
            allJobs.push(...jobs);
            console.log(`✅ Extracted ${jobs.length} jobs from page ${pageNumber}`);
            // Check for next page
            const nextButton = page.locator('button[aria-label="Next"]');
            if ((yield nextButton.isVisible({ timeout: 3000 })) &&
                (yield nextButton.isEnabled())) {
                yield nextButton.click();
                yield page.waitForLoadState("networkidle", { timeout: 10000 });
                yield delay(3000, 5000);
                pageNumber++;
            }
            else {
                break;
            }
        }
        return allJobs;
    });
}
/**
 * @function applyToLinkedInJob
 * @description Improved job application process with better error handling
 */
function applyToLinkedInJob(page, jobUrl, jobTitle, company) {
    return __awaiter(this, void 0, void 0, function* () {
        try {
            console.log(`🎯 Attempting to apply to: ${jobTitle} at ${company}`);
            yield page.goto(jobUrl, { waitUntil: "domcontentloaded", timeout: 60000 });
            yield delay(3000, 5000);
            // Find Easy Apply button
            const easyApplySelectors = [
                'button[aria-label*="Easy Apply"]',
                'button:has-text("Easy Apply")',
                ".jobs-apply-button--top-card button",
            ];
            const easyApplyButton = yield findElement(page, easyApplySelectors, "Easy Apply button");
            console.log("✅ Found Easy Apply button, clicking...");
            yield easyApplyButton.click();
            yield delay(2000, 4000);
            // Handle application flow
            const result = yield handleApplicationFlow(page, jobTitle, company);
            return Object.assign(Object.assign({}, result), { jobUrl, timestamp: new Date() });
        }
        catch (error) {
            console.error(`❌ Error applying to ${jobTitle}:`, error.message);
            yield page.screenshot({
                path: `linkedin-apply-error-${jobTitle.replace(/[^a-z0-9]/gi, "_")}-${Date.now()}.png`,
            });
            return {
                success: false,
                reason: error.message,
                jobTitle,
                company,
                jobUrl,
                timestamp: new Date(),
            };
        }
    });
}
/**
 * @function handleApplicationFlow
 * @description Handles the multi-step application process
 */
function handleApplicationFlow(page, jobTitle, company) {
    return __awaiter(this, void 0, void 0, function* () {
        try {
            let currentStep = 1;
            const maxSteps = 6;
            let isCompleted = false;
            while (currentStep <= maxSteps && !isCompleted) {
                console.log(`📋 Processing application step ${currentStep}...`);
                yield delay(2000, 3000);
                // Check if we're in application modal/dialog
                const isModalPresent = yield page
                    .locator(".jobs-easy-apply-modal, [data-test-modal]")
                    .isVisible();
                if (!isModalPresent) {
                    console.log("⚠️ Application modal not found");
                    break;
                }
                // Handle resume upload
                yield handleResumeUpload(page);
                // Fill application questions
                yield handleApplicationQuestions(page);
                // Look for action buttons (Next, Review, Submit)
                const actionButtons = [
                    'button[aria-label="Continue to next step"]',
                    'button[aria-label="Submit application"]',
                    'button:has-text("Next")',
                    'button:has-text("Review")',
                    'button:has-text("Submit application")',
                    'button:has-text("Submit")',
                    '.jobs-easy-apply-modal footer button[type="submit"]',
                ];
                let buttonFound = false;
                for (const selector of actionButtons) {
                    const button = page.locator(selector);
                    if ((yield button.isVisible({ timeout: 2000 })) &&
                        (yield button.isEnabled())) {
                        const buttonText = (yield button.textContent()) || "";
                        console.log(`✅ Clicking: ${buttonText.trim()}`);
                        yield button.click();
                        yield delay(2000, 4000);
                        buttonFound = true;
                        // Check if this was a submit button
                        if (buttonText.toLowerCase().includes("submit")) {
                            isCompleted = true;
                            console.log("🎉 Application submitted!");
                        }
                        break;
                    }
                }
                if (!buttonFound) {
                    console.log("⚠️ No action buttons found, application may be incomplete");
                    break;
                }
                currentStep++;
            }
            // Verify application success
            if (isCompleted) {
                return yield verifyApplicationSuccess(page, jobTitle, company);
            }
            return {
                success: false,
                reason: `Application flow incomplete after ${currentStep} steps`,
                jobTitle,
                company,
            };
        }
        catch (error) {
            console.error(`❌ Error in application flow for ${jobTitle}:`, error.message);
            return {
                success: false,
                reason: error.message,
                jobTitle,
                company,
            };
        }
    });
}
/**
 * @function handleResumeUpload
 * @description Handles resume upload if needed
 */
function handleResumeUpload(page) {
    return __awaiter(this, void 0, void 0, function* () {
        try {
            const resumePath = path_1.default.resolve(process.cwd(), "Resume.pdf");
            if (!fs_1.default.existsSync(resumePath)) {
                console.log("ℹ️ Resume.pdf not found in current directory, skipping upload");
                return;
            }
            const uploadSelectors = [
                'input[type="file"][accept*="pdf"]',
                'input[type="file"]',
                '.jobs-document-upload input[type="file"]',
            ];
            for (const selector of uploadSelectors) {
                const uploadInput = page.locator(selector);
                if (yield uploadInput.isVisible({ timeout: 2000 })) {
                    yield uploadInput.setInputFiles(resumePath);
                    console.log("✅ Resume uploaded successfully");
                    yield delay(2000, 3000);
                    return;
                }
            }
        }
        catch (error) {
            console.log("⚠️ Resume upload failed:", error.message);
        }
    });
}
/**
 * @function handleApplicationQuestions
 * @description Handles common application questions with better logic
 */
function handleApplicationQuestions(page) {
    return __awaiter(this, void 0, void 0, function* () {
        try {
            // Predefined answers for common questions
            const answers = {
                // Experience questions
                years: "3",
                experience: "3",
                // Authorization questions
                authorized: "Yes",
                eligible: "Yes",
                legal: "Yes",
                "work authorization": "Yes",
                // Sponsorship questions
                sponsorship: "No",
                visa: "No",
                // Availability
                available: "2 weeks",
                start: "2 weeks",
                notice: "2 weeks",
                // Remote work
                remote: "Yes",
                relocate: "Yes",
                // Contact info
                phone: "+91-9876543210",
                email: LINKEDIN_EMAIL,
                // Salary
                salary: "Negotiable",
                compensation: "Negotiable",
            };
            // Handle text inputs and textareas
            const textInputs = yield page.$$('input[type="text"], input[type="tel"], input[type="email"], textarea');
            for (const input of textInputs) {
                try {
                    const labelText = yield getInputLabel(page, input);
                    if (!labelText)
                        continue;
                    const answer = findBestAnswer(labelText, answers);
                    if (answer) {
                        yield input.clear();
                        yield input.fill(answer);
                        console.log(`✅ Answered: "${labelText}" → "${answer}"`);
                        yield delay(500, 1000);
                    }
                }
                catch (error) {
                    continue;
                }
            }
            // Handle radio buttons and checkboxes
            yield handleMultipleChoiceQuestions(page);
        }
        catch (error) {
            console.log("⚠️ Error handling application questions:", error.message);
        }
    });
}
/**
 * @function getInputLabel
 * @description Gets the label text for an input element
 */
function getInputLabel(page, input) {
    return __awaiter(this, void 0, void 0, function* () {
        try {
            // Try multiple methods to get label text
            const methods = [
                () => input.getAttribute("aria-label"),
                () => input.getAttribute("placeholder"),
                () => input.getAttribute("name"),
                () => page.evaluate((el) => {
                    var _a;
                    const label = el.closest("label") ||
                        document.querySelector(`label[for="${el.id}"]`);
                    return ((_a = label === null || label === void 0 ? void 0 : label.textContent) === null || _a === void 0 ? void 0 : _a.trim()) || "";
                }, input),
                () => page.evaluate((el) => {
                    var _a, _b;
                    const container = el.closest(".form-element, .artdeco-text-input, .fb-single-line-text");
                    return (((_b = (_a = container === null || container === void 0 ? void 0 : container.querySelector("label, .form-label")) === null || _a === void 0 ? void 0 : _a.textContent) === null || _b === void 0 ? void 0 : _b.trim()) || "");
                }, input),
            ];
            for (const method of methods) {
                try {
                    const result = yield method();
                    if (result && typeof result === "string" && result.trim()) {
                        return result.trim().toLowerCase();
                    }
                }
                catch (error) {
                    continue;
                }
            }
        }
        catch (error) {
            // Ignore errors
        }
        return "";
    });
}
/**
 * @function findBestAnswer
 * @description Finds the best answer for a given question text
 */
function findBestAnswer(questionText, answers) {
    const normalizedQuestion = questionText.toLowerCase();
    for (const [keyword, answer] of Object.entries(answers)) {
        if (normalizedQuestion.includes(keyword.toLowerCase())) {
            return answer;
        }
    }
    return null;
}
/**
 * @function handleMultipleChoiceQuestions
 * @description Handles radio buttons and checkboxes
 */
function handleMultipleChoiceQuestions(page) {
    return __awaiter(this, void 0, void 0, function* () {
        try {
            // Get all labels that might contain radio/checkbox options
            const labels = yield page.$$("label");
            for (const label of labels) {
                try {
                    const text = yield label.textContent();
                    if (!text)
                        continue;
                    const normalizedText = text.toLowerCase().trim();
                    // Define positive responses
                    const positiveIndicators = [
                        "yes",
                        "authorized",
                        "eligible",
                        "able to work",
                        "legally authorized",
                        "permitted to work",
                        "have authorization",
                        "citizen",
                        "permanent resident",
                    ];
                    // Define negative responses for sponsorship
                    const negativeForSponsorship = [
                        "do not require",
                        "no sponsorship",
                        "not require sponsorship",
                    ];
                    const shouldSelect = positiveIndicators.some((indicator) => normalizedText.includes(indicator)) ||
                        (normalizedText.includes("sponsorship") &&
                            negativeForSponsorship.some((indicator) => normalizedText.includes(indicator)));
                    if (shouldSelect) {
                        // Find associated input
                        const forAttribute = yield label.getAttribute("for");
                        let input = null;
                        if (forAttribute) {
                            input = page.locator(`#${forAttribute}`);
                        }
                        else {
                            input = label.locator("input").first();
                        }
                        if (input && (yield input.isVisible({ timeout: 1000 }))) {
                            yield input.check();
                            console.log(`✅ Selected option: "${text.trim()}"`);
                            yield delay(500, 1000);
                        }
                    }
                }
                catch (error) {
                    continue;
                }
            }
        }
        catch (error) {
            console.log("⚠️ Error handling multiple choice questions:", error.message);
        }
    });
}
/**
 * @function verifyApplicationSuccess
 * @description Verifies if application was submitted successfully
 */
function verifyApplicationSuccess(page, jobTitle, company) {
    return __awaiter(this, void 0, void 0, function* () {
        const successSelectors = [
            'h3:has-text("Application sent")',
            'h1:has-text("Your application was sent")',
            ".artdeco-inline-feedback--success",
            ".jobs-apply-success",
            '[data-test="application-sent"]',
            ':has-text("Application submitted")',
            ':has-text("Thank you for applying")',
        ];
        yield delay(2000, 3000);
        for (const selector of successSelectors) {
            try {
                if (yield page.locator(selector).isVisible({ timeout: 3000 })) {
                    console.log(`🎉 Successfully applied to ${jobTitle} at ${company}`);
                    return {
                        success: true,
                        reason: "Application submitted successfully",
                        jobTitle,
                        company,
                    };
                }
            }
            catch (error) {
                continue;
            }
        }
        // Sometimes success is indicated by modal closure
        const isModalClosed = !(yield page
            .locator(".jobs-easy-apply-modal")
            .isVisible({ timeout: 2000 }));
        if (isModalClosed) {
            return {
                success: true,
                reason: "Application likely successful (modal closed)",
                jobTitle,
                company,
            };
        }
        return {
            success: false,
            reason: "Could not verify application success",
            jobTitle,
            company,
        };
    });
}
/**
 * @function shouldApplyToJob
 * @description Enhanced job filtering logic
 */
function shouldApplyToJob(job) {
    const title = job.title.toLowerCase();
    const company = job.company.toLowerCase();
    const location = job.location.toLowerCase();
    // Required keywords (at least one must be present)
    const requiredKeywords = [
        "react",
        "node",
        "javascript",
        "mern",
        "full stack",
        "fullstack",
        "frontend",
        "backend",
        "mongodb",
        "express",
        "developer",
        "js",
    ];
    // Keywords to avoid (if any present, skip job)
    const avoidKeywords = [
        "senior",
        "lead",
        "manager",
        "director",
        "7+ years",
        "8+ years",
        "9+ years",
        "10+ years",
        "principal",
        "architect",
        "head of",
        "vp",
        "vice president",
        "chief",
        "recruiter",
        "hr",
        "sales",
        "marketing",
        "data scientist",
        "ml engineer",
        "devops",
    ];
    // Preferred locations
    const preferredLocations = [
        "mumbai",
        "pune",
        "bangalore",
        "bengaluru",
        "remote",
        "india",
        "delhi",
        "hyderabad",
        "chennai",
    ];
    // Check required keywords
    const hasRequired = requiredKeywords.some((keyword) => title.includes(keyword));
    // Check avoid keywords
    const hasAvoid = avoidKeywords.some((keyword) => title.includes(keyword));
    // Check location preference
    const isPreferredLocation = preferredLocations.some((loc) => location.includes(loc));
    const shouldApply = hasRequired && !hasAvoid && isPreferredLocation;
    if (!shouldApply) {
        const reason = !hasRequired
            ? "missing required keywords"
            : hasAvoid
                ? "contains avoid keywords"
                : !isPreferredLocation
                    ? "location not preferred"
                    : "unknown";
        console.log(`⏭️ Skipping "${job.title}" at "${job.company}" - ${reason}`);
    }
    return shouldApply;
}
/**
 * @function saveApplicationResults
 * @description Saves application results to a JSON file
 */
function saveApplicationResults(results) {
    return __awaiter(this, void 0, void 0, function* () {
        try {
            const timestamp = new Date().toISOString().replace(/[:.]/g, "-");
            const filename = `linkedin-applications-${timestamp}.json`;
            const filepath = path_1.default.join(process.cwd(), filename);
            const report = {
                timestamp: new Date().toISOString(),
                totalAttempts: results.length,
                successful: results.filter((r) => r.success).length,
                failed: results.filter((r) => !r.success).length,
                results,
            };
            yield fs_1.default.promises.writeFile(filepath, JSON.stringify(report, null, 2));
            console.log(`📄 Application results saved to: ${filename}`);
        }
        catch (error) {
            console.error("⚠️ Failed to save results:", error.message);
        }
    });
}
/**
 * @function scrapeAndApplyLinkedInJobs
 * @description Main function orchestrating the entire process
 * @param useExistingBrowser - If true, connects to existing browser instead of launching new one
 */
function scrapeAndApplyLinkedInJobs() {
    return __awaiter(this, arguments, void 0, function* (useExistingBrowser = true) {
        let browser = null;
        let context = null;
        let shouldCloseBrowser = false;
        try {
            if (useExistingBrowser) {
                // Connect to existing browser instance
                console.log("🔗 Attempting to connect to existing browser...");
                try {
                    // Try to connect to existing Chrome/Chromium browser
                    // You need to start your browser with debugging enabled:
                    // Chrome: chrome --remote-debugging-port=9222
                    // Or use CDP endpoint if available
                    browser = yield playwright_1.chromium.connectOverCDP("http://localhost:9222");
                    console.log("✅ Connected to existing browser instance");
                    // Get existing context or create a new one
                    const contexts = browser.contexts();
                    if (contexts.length > 0) {
                        context = contexts[0]; // Use first available context
                        console.log("✅ Using existing browser context");
                    }
                    else {
                        context = yield browser.newContext({
                            userAgent: "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/122.0.0.0 Safari/537.36",
                            viewport: { width: 1366, height: 768 },
                            locale: "en-US",
                        });
                        console.log("✅ Created new context in existing browser");
                    }
                    // Get existing page or create new one
                    const pages = context.pages();
                    let page;
                    if (pages.length > 0) {
                        page = pages[0]; // Use first available page
                        console.log("✅ Using existing browser tab");
                    }
                    else {
                        page = yield context.newPage();
                        console.log("✅ Created new tab in existing browser");
                    }
                }
                catch (error) {
                    console.log("⚠️ Failed to connect to existing browser, launching new instance...");
                    console.log("💡 To use existing browser, start Chrome with: chrome --remote-debugging-port=9222");
                    throw error;
                }
            }
            else {
                throw new Error("Launching new browser as requested");
            }
        }
        catch (error) {
            // Fallback to launching new browser
            console.log("🚀 Launching new browser instance...");
            shouldCloseBrowser = true;
            browser = yield playwright_1.chromium.launch({
                headless: false,
                slowMo: 1000,
                args: [
                    "--no-sandbox",
                    "--disable-setuid-sandbox",
                    "--disable-blink-features=AutomationControlled",
                    "--disable-web-security",
                    "--disable-features=VizDisplayCompositor",
                    "--remote-debugging-port=9222", // Enable debugging for future connections
                ],
            });
            context = yield browser.newContext({
                userAgent: "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/122.0.0.0 Safari/537.36",
                viewport: { width: 1366, height: 768 },
                locale: "en-US",
            });
            const page = yield context.newPage();
        }
        try {
            const page = context.pages()[0] || (yield context.newPage());
            // Add extra headers to appear more human-like
            yield page.setExtraHTTPHeaders({
                "Accept-Language": "en-US,en;q=0.9",
                "Accept-Encoding": "gzip, deflate, br",
            });
            console.log("🚀 Starting LinkedIn job application automation...");
            // Step 1: Login
            yield loginToLinkedIn(page);
            // Step 2: Search for jobs
            const jobs = yield searchLinkedInJobs(page);
            if (jobs.length === 0) {
                console.log("⚠️ No jobs found matching criteria.");
                return [];
            }
            // Step 3: Filter and apply to jobs
            const applicationResults = [];
            let appliedCount = 0;
            const maxApplications = 5; // Limit to prevent account suspension
            console.log(`📋 Processing ${jobs.length} jobs (max applications: ${maxApplications})...`);
            for (const job of jobs) {
                try {
                    if (appliedCount >= maxApplications) {
                        console.log(`🛑 Reached maximum applications limit (${maxApplications})`);
                        break;
                    }
                    if (!shouldApplyToJob(job)) {
                        continue;
                    }
                    console.log(`\n🎯 Processing job ${appliedCount + 1}/${maxApplications}`);
                    console.log(`   Title: ${job.title}`);
                    console.log(`   Company: ${job.company}`);
                    console.log(`   Location: ${job.location}`);
                    const result = yield applyToLinkedInJob(page, job.jobUrl, job.title, job.company);
                    applicationResults.push(result);
                    if (result.success) {
                        appliedCount++;
                        console.log(`✅ Successfully applied! (${appliedCount}/${maxApplications})`);
                    }
                    else {
                        console.log(`❌ Application failed: ${result.reason}`);
                    }
                    // Random delay between applications to avoid detection
                    const waitTime = 15000 + Math.random() * 20000; // 15-35 seconds
                    console.log(`⏳ Waiting ${Math.round(waitTime / 1000)} seconds before next application...`);
                    yield delay(waitTime, waitTime + 5000);
                }
                catch (error) {
                    console.error(`❌ Unexpected error processing job "${job.title}":`, error.message);
                    applicationResults.push({
                        success: false,
                        reason: `Unexpected error: ${error.message}`,
                        jobTitle: job.title,
                        company: job.company,
                        jobUrl: job.jobUrl,
                        timestamp: new Date(),
                    });
                }
            }
            // Step 4: Save results and summary
            yield saveApplicationResults(applicationResults);
            const successful = applicationResults.filter((r) => r.success).length;
            const failed = applicationResults.filter((r) => !r.success).length;
            console.log("\n" + "=".repeat(50));
            console.log("🎉 LinkedIn Job Application Summary");
            console.log("=".repeat(50));
            console.log(`📊 Total Jobs Processed: ${applicationResults.length}`);
            console.log(`✅ Successful Applications: ${successful}`);
            console.log(`❌ Failed Applications: ${failed}`);
            console.log(`📈 Success Rate: ${applicationResults.length > 0
                ? Math.round((successful / applicationResults.length) * 100)
                : 0}%`);
            if (successful > 0) {
                console.log("\n🎯 Successfully Applied To:");
                applicationResults
                    .filter((r) => r.success)
                    .forEach((result, index) => {
                    console.log(`   ${index + 1}. ${result.jobTitle} at ${result.company}`);
                });
            }
            if (failed > 0) {
                console.log("\n⚠️ Failed Applications:");
                applicationResults
                    .filter((r) => !r.success)
                    .forEach((result, index) => {
                    console.log(`   ${index + 1}. ${result.jobTitle} at ${result.company} - ${result.reason}`);
                });
            }
            console.log("=".repeat(50));
            return applicationResults;
        }
        catch (error) {
            console.error("❌ Fatal error in automation process:", error.message);
            if (context) {
                const page = context.pages()[0];
                if (page) {
                    yield page.screenshot({
                        path: `linkedin-fatal-error-${Date.now()}.png`,
                    });
                }
            }
            return [
                {
                    success: false,
                    reason: `Fatal error: ${error.message}`,
                    jobTitle: "N/A",
                    company: "N/A",
                    timestamp: new Date(),
                },
            ];
        }
        finally {
            // Cleanup resources - only close if we launched the browser
            try {
                if (shouldCloseBrowser) {
                    if (context) {
                        yield context.close();
                    }
                    if (browser) {
                        yield browser.close();
                    }
                    console.log("🧹 Browser resources cleaned up");
                }
                else {
                    console.log("🧹 Keeping existing browser open");
                }
            }
            catch (error) {
                console.error("⚠️ Error during cleanup:", error);
            }
        }
    });
}
/**
 * @function connectToExistingBrowser
 * @description Helper function to connect to existing browser using different methods
 */
function connectToExistingBrowser() {
    return __awaiter(this, void 0, void 0, function* () {
        // Method 1: Try CDP connection (requires Chrome started with --remote-debugging-port=9222)
        try {
            console.log("🔗 Trying CDP connection...");
            const browser = yield playwright_1.chromium.connectOverCDP("http://localhost:9222");
            const contexts = browser.contexts();
            let context = contexts.length > 0 ? contexts[0] : yield browser.newContext();
            const pages = context.pages();
            let page = pages.length > 0 ? pages[0] : yield context.newPage();
            console.log("✅ Connected via CDP");
            return { browser, context, page };
        }
        catch (error) {
            console.log("❌ CDP connection failed");
        }
        // Method 2: Try connecting to existing Chromium process
        try {
            console.log("🔗 Trying to connect to existing Chromium process...");
            const browser = yield playwright_1.chromium.connect("ws://localhost:9222");
            const contexts = browser.contexts();
            let context = contexts.length > 0 ? contexts[0] : yield browser.newContext();
            const pages = context.pages();
            let page = pages.length > 0 ? pages[0] : yield context.newPage();
            console.log("✅ Connected to existing process");
            return { browser, context, page };
        }
        catch (error) {
            console.log("❌ Process connection failed");
        }
        throw new Error("Could not connect to existing browser");
    });
}
/**
 * @function setupBrowserForAutomation
 * @description Instructions for setting up browser for automation
 */
function printBrowserSetupInstructions() {
    console.log("\n" + "=".repeat(60));
    console.log("🌐 BROWSER SETUP FOR AUTOMATION");
    console.log("=".repeat(60));
    console.log("To use your existing browser, you need to start it with debugging enabled:");
    console.log("");
    console.log("📌 For Chrome/Chromium:");
    console.log("   Windows: chrome.exe --remote-debugging-port=9222 --user-data-dir=remote-profile");
    console.log("   macOS: /Applications/Google\\ Chrome.app/Contents/MacOS/Google\\ Chrome --remote-debugging-port=9222 --user-data-dir=remote-profile");
    console.log("   Linux: google-chrome --remote-debugging-port=9222 --user-data-dir=remote-profile");
    console.log("");
    console.log("📌 For Microsoft Edge:");
    console.log("   Windows: msedge.exe --remote-debugging-port=9222 --user-data-dir=remote-profile");
    console.log("");
    console.log("💡 Tips:");
    console.log("   - Close all existing browser instances first");
    console.log("   - The --user-data-dir creates a separate profile for automation");
    console.log("   - You can manually login to LinkedIn in this browser first");
    console.log("   - Then run this script to use the same browser instance");
    console.log("");
    console.log("🔗 Alternative: Set useExistingBrowser to false to launch new browser");
    console.log("=".repeat(60));
}
// Main execution with browser connection options
if (require.main === module) {
    // Print setup instructions
    printBrowserSetupInstructions();
    // Ask user preference (you can also hardcode this)
    const useExistingBrowser = true; // Set to false to launch new browser
    scrapeAndApplyLinkedInJobs(useExistingBrowser)
        .then((results) => {
        const successCount = results.filter((r) => r.success).length;
        console.log(`\n🏁 Process completed. ${successCount} applications submitted successfully.`);
        process.exit(0);
    })
        .catch((error) => {
        console.error("💥 Process failed:", error.message);
        process.exit(1);
    });
}
