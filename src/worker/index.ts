import { chromium } from "playwright";
import schedule from "node-schedule";
import mongoose from "mongoose";
import { PROFILE } from "../shared/profile";
import { scoreJob } from "../shared/scoring";
import { JobModel } from "../models/Job";
import dotenv from "dotenv";
import fs from "fs";
import path from "path";
dotenv.config();
const MONGO_URI = process.env.MONGO_URI;
const API_BASE_URL = "http://localhost:4001";
const NAUKRI_EMAIL = process.env.NAUKRI_EMAIL || "";
const NAUKRI_PASSWORD = process.env.NAUKRI_PASSWORD || "";
async function updateResume(page: any, resumePath: string) {
  console.log("Navigating to profile page to update resume...");
  await page.goto("https://www.naukri.com/mnjuser/profile?id=&altresid", {
    waitUntil: "domcontentloaded",
    timeout: 60000,
  });

  await page.waitForTimeout(5000);

  // Upload resume file
  try {
    const fileInput = page.locator("#attachCV");
    await fileInput.setInputFiles(resumePath);
    console.log(`✅ Resume file attached: ${resumePath}`);
  } catch (error) {
    console.error("❌ Failed to attach resume file:", error);
    throw error;
  }

  // Click Update button
  try {
    // Wait for confirmation only in the resume section
    try {
      const result = page.locator("#lazyAttachCV #result");
      await result.waitFor({ state: "visible", timeout: 10000 });
      const resultText = await result.textContent();
      console.log(
        "Resume update result:",
        resultText?.trim() || "No message found"
      );
    } catch {
      console.warn(
        "⚠️ No visible result message found, but resume may still be updated."
      );
    }
  } catch (error) {
    console.error("❌ Failed to update resume:", error);
    throw error;
  }
}

async function scrapeNaukri() {
  const browser = await chromium.launch({
    headless: false, // Set to false for debugging
    slowMo: 1000, // Add delay between actions for debugging
  });
  const context = await browser.newContext({
    userAgent:
      "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36",
  });
  const page = await context.newPage();

  try {
    if (!NAUKRI_EMAIL || !NAUKRI_PASSWORD) {
      throw new Error("Missing NAUKRI_EMAIL or NAUKRI_PASSWORD in .env");
    }

    // Navigate to Naukri login page
    console.log("Navigating to login page");
    await page.goto("https://www.naukri.com/nlogin/login", {
      waitUntil: "domcontentloaded",
      timeout: 60000,
    });
    console.log("Page loaded:", page.url());

    // Wait for page to fully load
    await page.waitForTimeout(3000);

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
    async function findElement(selectors: string[], elementName: string) {
      for (const selector of selectors) {
        try {
          const element = page.locator(selector);
          await element.waitFor({ state: "visible", timeout: 5000 });
          console.log(`✅ Found ${elementName} with selector: ${selector}`);
          return element;
        } catch (error) {
          console.log(
            `❌ Failed to find ${elementName} with selector: ${selector}`
          );
          continue;
        }
      }
      throw new Error(`Could not locate ${elementName} with any selector`);
    }

    // Find and interact with login elements
    console.log("Looking for email input...");
    const emailInput = await findElement(emailSelectors, "email input");

    console.log("Looking for password input...");
    const passwordInput = await findElement(
      passwordSelectors,
      "password input"
    );

    console.log("Looking for submit button...");
    const submitButton = await findElement(submitSelectors, "submit button");

    // Clear fields before filling (in case they have default values)
    await emailInput.clear();
    await passwordInput.clear();

    // Fill login form with delays
    console.log("Filling email...");
    await emailInput.fill(NAUKRI_EMAIL);
    await page.waitForTimeout(1000);

    console.log("Filling password...");
    await passwordInput.fill(NAUKRI_PASSWORD);
    await page.waitForTimeout(1000);

    console.log("Clicking login button...");
    // Alternative approach - click by exact text match
    try {
      await submitButton.click();
    } catch (error) {
      console.log("First click attempt failed, trying alternative approach...");
      await page.click('button:has-text("Login"):not(:has-text("Forgot"))');
    }

    // Wait for login completion with multiple checks
    console.log("Waiting for login completion...");
    await page.waitForTimeout(5000);

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
        if (await page.locator(selector).isVisible({ timeout: 2000 })) {
          captchaFound = true;
          break;
        }
      } catch (error) {
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
        if (await errorElement.isVisible({ timeout: 2000 })) {
          const errorText = await errorElement.textContent();
          console.error("Login error detected:", errorText);
          throw new Error(`Login failed: ${errorText}`);
        }
      } catch (error) {
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
        if (await page.locator(selector).isVisible({ timeout: 5000 })) {
          isLoggedIn = true;
          console.log(`✅ Login verified with selector: ${selector}`);
          break;
        }
      } catch (error) {
        // Continue checking other selectors
      }
    }

    if (!isLoggedIn) {
      console.error("Current URL:", page.url());
      console.error("Page title:", await page.title());

      // Additional checks for successful login based on URL and title
      const currentUrl = page.url();
      const pageTitle = await page.title();

      // If we're on a Naukri page and not on login page, consider it successful
      if (
        (currentUrl.includes("naukri.com") &&
          !currentUrl.includes("/nlogin/")) ||
        pageTitle.includes("Mynaukri") ||
        pageTitle.includes("Home | Mynaukri") ||
        pageTitle.includes("Naukri.com")
      ) {
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
    await page.goto(
      "https://www.naukri.com/mern-stack-developer-node-js-developer-jobs-in-pune?k=mern stack developer, node js developer&l=pune, mumbai, navi mumbai&experience=3",
      {
        waitUntil: "domcontentloaded",
        timeout: 60000,
      }
    );
    await page.waitForTimeout(5000); // Wait for page load

    // Wait for job listings to load with multiple selectors
    console.log("Waiting for job listings to load...");
    console.log("Applying sort by Date...");
    try {
      const sortButton = page.locator("#filter-sort");
      await sortButton.waitFor({ state: "visible", timeout: 5000 });
      await sortButton.click();

      // Wait for dropdown to appear
      const dateOption = page.locator('a[data-id="filter-sort-f"]');
      await dateOption.waitFor({ state: "visible", timeout: 5000 });
      await dateOption.click();

      console.log("✅ Applied sort by Date");
      await page.waitForTimeout(3000); // wait for page refresh
    } catch (sortError) {
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
        await page.waitForSelector(selector, { timeout: 10000 });
        console.log(`✅ Found jobs with selector: ${selector}`);
        jobsFound = true;
        break;
      } catch (error) {
        console.log(`❌ Failed to find jobs with selector: ${selector}`);
        continue;
      }
    }

    if (!jobsFound) {
      // Take a screenshot to see what's on the page
      console.log("Screenshot saved as job-listings-page.png");

      // Log page content for debugging
      console.log("Current URL:", page.url());
      console.log("Page title:", await page.title());

      throw new Error("Could not find job listings on the page");
    }

    // with this line:
    const jobs = await page.$$eval(".srp-jobtuple-wrapper", (elements) => {
      // The rest of the code inside the callback remains the same
      return elements.map((el: any) => ({
        id: el.getAttribute("data-job-id") || "",
        title: el.querySelector(".title")?.textContent?.trim() || "",
        company: el.querySelector(".comp-name")?.textContent?.trim() || "",
        location: el.querySelector(".locWdth")?.textContent?.trim() || "",
        jd: el.querySelector(".job-desc")?.textContent?.trim() || "",
        jdUrl: el.querySelector(".title a")?.href || "",
        platform: "Naukri",
        salary: "",
        postedAt: el.querySelector(".job-post-day")?.textContent?.trim() || "",
        experience: el.querySelector(".expwdth")?.textContent?.trim() || "",
      }));
    });

    console.log(`Found ${jobs.length} jobs`);

    for (const job of jobs) {
      try {
        // Parse salary from job description or other sources if available
        // Since salary is not in the current structure, set as undefined
        const jobData = {
          ...job,
          salaryMin: undefined, // No salary data in current structure
          salaryMax: undefined, // No salary data in current structure
          postedAt: job.postedAt ? new Date() : undefined,
          remote: job.location.toLowerCase().includes("remote"),
          collectedAt: new Date(),
        };

        const match = scoreJob({
          jd: jobData.jd,
          resume: PROFILE?.resume || "",
          location: PROFILE?.preferredLocations?.join(",") || "",
          salaryMin: PROFILE?.salaryMin || 0,
          job: {
            location: jobData.location,
            salaryMin: jobData.salaryMin,
            salaryMax: jobData.salaryMax,
            postedAt: jobData.postedAt,
            remote: jobData.remote,
          },
        });

        await JobModel.findOneAndUpdate(
          { id: jobData.id, platform: jobData.platform },
          { ...jobData, match },
          { upsert: true }
        );
        try {
          const response = await fetch(`${API_BASE_URL}/api/jobs/notify`, {
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
            console.error(
              `Failed to notify for job ${jobData.id}: ${response.statusText}`
            );
          }
        } catch (notifyError) {
          console.error(`Error notifying for job ${jobData.id}:`, notifyError);
        }
      } catch (jobError) {
        console.error(`Error processing job ${job.id}:`, jobError);
      }
    }
    const RESUME_PATH = path.resolve(__dirname, "./Resume.pdf"); // adjust as needed

    if (!fs.existsSync(RESUME_PATH)) {
      throw new Error(`Resume file not found at: ${RESUME_PATH}`);
    }

    await updateResume(page, RESUME_PATH);
    console.log(`✅ Scraped ${jobs.length} jobs from Naukri`);
  } catch (error) {
    console.error("❌ Error scraping Naukri:", error);

    // Take screenshot for debugging
    try {
      console.log("Error screenshot saved as scrape-error.png");
    } catch (screenshotError) {
      console.error("Could not save screenshot:", screenshotError);
    }
  } finally {
    await browser.close();
  }
}

async function start() {
  try {
    if (!MONGO_URI) {
      throw new Error("Missing MONGO_URI in .env");
    }
    await mongoose.connect(MONGO_URI);
    console.log("✅ Worker connected to MongoDB");
    schedule.scheduleJob("0 9 * * *", scrapeNaukri); // 9 AM daily
    console.log("✅ Scheduled job scraper at 9:00 AM IST");
  } catch (error) {
    console.error("❌ Failed to start worker:", error);
    process.exit(1);
  }
}

start();

export { scrapeNaukri };
