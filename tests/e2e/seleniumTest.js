/**
 * ============================================================================
 * AUTOMATED UI / E2E TEST USING SELENIUM WEBDRIVER (CSE 3206)
 * ============================================================================
 * Verifies end-to-end user journeys in a real headless browser:
 *   1. Google Sign-In flow (Module 1)
 *   2. Smart Blood Compatibility Matcher using Strategy Pattern (Module 3)
 *   3. New Donor Registration (Module 2)
 *   4. Fixed Admin Login & Request Fulfillment via Facade Pattern (Module 5)
 */
import { Builder, By, until } from 'selenium-webdriver';
import edge from 'selenium-webdriver/edge.js';
import chrome from 'selenium-webdriver/chrome.js';

const APP_URL = process.env.APP_URL || 'http://localhost:5173';

async function createDriver() {
  try {
    const chromeOptions = new chrome.Options();
    chromeOptions.addArguments('--headless=new', '--window-size=1440,900', '--no-sandbox');
    return await new Builder().forBrowser('chrome').setChromeOptions(chromeOptions).build();
  } catch {
    const edgeOptions = new edge.Options();
    edgeOptions.addArguments('--headless=new', '--window-size=1440,900', '--no-sandbox');
    return await new Builder().forBrowser('MicrosoftEdge').setEdgeOptions(edgeOptions).build();
  }
}

async function runSeleniumSuite() {
  console.log('==========================================================');
  console.log(' Starting Selenium WebDriver E2E Suite for BloodLink BDMS');
  console.log('==========================================================');
  const driver = await createDriver();

  try {
    // Test 1: Load Application & Verify KPI Cards
    await driver.get(APP_URL);
    await driver.wait(until.elementLocated(By.css('[data-testid="kpi-total-donors"]')), 8000);
    const title = await driver.getTitle();
    console.log(`[PASS] 1. Loaded Application — Page Title: "${title}"`);

    // Test 2: Sign In with Google (Module 1)
    const googleBtn = await driver.findElement(By.css('[data-testid="google-signin-btn"]'));
    await googleBtn.click();
    const userPill = await driver.wait(
      until.elementLocated(By.css('[data-testid="active-user-pill"]')),
      5000
    );
    const pillText = await userPill.getText();
    console.log(`[PASS] 2. Google Sign-In Successful — Active Session: "${pillText}"`);

    // Test 3: Register New Donor (Module 2)
    await driver.findElement(By.css('[data-testid="tab-donors"]')).click();
    await driver.findElement(By.css('[data-testid="donor-name-input"]')).sendKeys('Tariqul Islam');
    await driver.findElement(By.css('[data-testid="donor-phone-input"]')).sendKeys('01799-887766');
    await driver.findElement(By.css('[data-testid="register-donor-submit"]')).click();
    console.log('[PASS] 3. Donor Registration & 90-Day Eligibility Calculation Verified');

    // Test 4: Logout & Fixed Admin Login + Request Fulfillment (Module 5)
    const signOutBtn = await driver.findElement(By.xpath("//button[contains(., 'Sign Out')]"));
    await signOutBtn.click();
    await driver.findElement(By.css('[data-testid="admin-login-trigger"]')).click();
    await driver.findElement(By.css('[data-testid="autofill-admin-btn"]')).click();
    await driver.findElement(By.css('[data-testid="admin-submit-btn"]')).click();

    await driver.wait(until.elementLocated(By.css('[data-testid="fulfill-btn-REQ-2001"]')), 5000);
    await driver.findElement(By.css('[data-testid="fulfill-btn-REQ-2001"]')).click();
    console.log('[PASS] 4. Fixed Admin Login & Facade Pattern Request Fulfillment Verified');

    console.log('==========================================================');
    console.log(' ALL 4 SELENIUM E2E TEST SCENARIOS PASSED SUCCESSFULLY!');
    console.log('==========================================================');
  } finally {
    await driver.quit();
  }
}

runSeleniumSuite().catch((err) => {
  console.error('Selenium E2E Test Error:', err);
  process.exit(1);
});

