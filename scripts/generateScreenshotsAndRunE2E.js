import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { createServer } from 'vite';
import { Builder, By, until } from 'selenium-webdriver';
import chrome from 'selenium-webdriver/chrome.js';
import edge from 'selenium-webdriver/edge.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const ROOT_DIR = path.resolve(__dirname, '..');
const SCREENSHOT_DIR = path.join(ROOT_DIR, 'docs', 'screenshots');

fs.mkdirSync(SCREENSHOT_DIR, { recursive: true });

async function buildWebDriver() {
  try {
    const chromeOpts = new chrome.Options();
    chromeOpts.addArguments('--headless=new', '--window-size=1440,1200', '--no-sandbox', '--force-device-scale-factor=1.5');
    return await new Builder().forBrowser('chrome').setChromeOptions(chromeOpts).build();
  } catch {
    const edgeOpts = new edge.Options();
    edgeOpts.addArguments('--headless=new', '--window-size=1440,1200', '--no-sandbox', '--force-device-scale-factor=1.5');
    return await new Builder().forBrowser('MicrosoftEdge').setEdgeOptions(edgeOpts).build();
  }
}

async function saveElementPng(driver, elementId, filename) {
  const el = await driver.findElement(By.id(elementId));
  await driver.executeScript('arguments[0].scrollIntoView({block: "center"});', el);
  await driver.sleep(300);
  const base64 = await el.takeScreenshot(true);
  const outPath = path.join(SCREENSHOT_DIR, filename);
  fs.writeFileSync(outPath, base64, 'base64');
  console.log(`[SAVED] ${filename}`);
}

async function saveViewportPng(driver, filename) {
  await driver.executeScript('window.scrollTo(0, 0);');
  await driver.sleep(350);
  const base64 = await driver.takeScreenshot();
  const outPath = path.join(SCREENSHOT_DIR, filename);
  fs.writeFileSync(outPath, base64, 'base64');
  console.log(`[SAVED] ${filename}`);
}

async function main() {
  const server = await createServer({
    root: ROOT_DIR,
    server: { port: 5179, strictPort: true }
  });
  await server.listen();
  const baseUrl = 'http://localhost:5179';
  console.log(`Vite server started at ${baseUrl}`);

  const driver = await buildWebDriver();
  try {
    // 1. Capture UML Diagrams, Wireframe & Coverage Terminal from docs/diagrams.html
    await driver.get(`${baseUrl}/docs/diagrams.html`);
    await driver.sleep(3000); // Wait for Mermaid SVG rendering
    await saveElementPng(driver, 'uml-class-diagram', 'uml_class_diagram.png');
    await saveElementPng(driver, 'uml-usecase-diagram', 'uml_usecase_diagram.png');
    await saveElementPng(driver, 'process-model-diagram', 'process_model_diagram.png');
    await saveElementPng(driver, 'ui-wireframe-mockup', 'ui_wireframe_mockup.png');
    await saveElementPng(driver, 'vitest-coverage-screenshot', 'vitest_coverage_report.png');

    // 2. Run Selenium E2E Flow & Capture Live App Screenshots
    await driver.manage().window().setRect({ width: 1360, height: 880 });
    await driver.get(baseUrl);
    await driver.wait(until.elementLocated(By.css('[data-testid="kpi-total-donors"]')), 8000);

    // Sign in with Google
    await driver.findElement(By.css('[data-testid="google-signin-btn"]')).click();
    await driver.wait(until.elementLocated(By.css('[data-testid="active-user-pill"]')), 5000);
    await saveViewportPng(driver, 'app_overview_matcher.png');

    // Tab 2: Donor Directory & Eligibility
    await driver.findElement(By.css('[data-testid="tab-donors"]')).click();
    await driver.findElement(By.css('[data-testid="donor-name-input"]')).sendKeys('Tariqul Islam');
    await driver.findElement(By.css('[data-testid="donor-phone-input"]')).sendKeys('01799-887766');
    await driver.findElement(By.css('[data-testid="register-donor-submit"]')).click();
    await saveViewportPng(driver, 'app_donors_eligibility.png');

    // Tab 4: Blood Bank Inventory & Camps
    await driver.findElement(By.css('[data-testid="tab-inventory"]')).click();
    await saveViewportPng(driver, 'app_inventory_camps.png');

    // Sign out & Sign in as Fixed Admin -> Tab 5: Admin Control Center
    const signOutBtn = await driver.findElement(By.xpath("//button[contains(., 'Sign Out')]"));
    await signOutBtn.click();
    await driver.findElement(By.css('[data-testid="admin-login-trigger"]')).click();
    await driver.findElement(By.css('[data-testid="autofill-admin-btn"]')).click();
    await driver.findElement(By.css('[data-testid="admin-submit-btn"]')).click();
    await driver.wait(until.elementLocated(By.css('[data-testid="fulfill-btn-REQ-2001"]')), 5000);
    await driver.findElement(By.css('[data-testid="fulfill-btn-REQ-2001"]')).click();
    await saveViewportPng(driver, 'app_admin_facade.png');

    console.log('All diagrams, wireframes, and live app screenshots captured successfully!');
  } finally {
    await driver.quit();
    await server.close();
  }
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});

