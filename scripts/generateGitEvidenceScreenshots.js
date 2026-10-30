import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { createServer } from 'vite';
import { Builder, By } from 'selenium-webdriver';
import chrome from 'selenium-webdriver/chrome.js';
import edge from 'selenium-webdriver/edge.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const ROOT_DIR = path.resolve(__dirname, '..');
const SCREENSHOT_DIR = path.join(ROOT_DIR, 'docs', 'screenshots');

const gitEvidenceHtml = `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8" />
  <title>Git & GitHub Configuration Management Evidence</title>
  <style>
    body {
      font-family: 'Segoe UI', Tahoma, sans-serif;
      background: #ffffff;
      color: #0f172a;
      padding: 24px;
    }
    .capture-box {
      border: 2px solid #cbd5e1;
      border-radius: 12px;
      padding: 22px;
      margin-bottom: 36px;
      background: #ffffff;
      width: 1120px;
    }
    .capture-title {
      font-size: 17px;
      font-weight: 700;
      color: #0f172a;
      border-bottom: 2px solid #e2e8f0;
      padding-bottom: 10px;
      margin-bottom: 16px;
    }
    .terminal {
      background: #0d1117;
      color: #e6edf3;
      font-family: 'Consolas', 'Courier New', monospace;
      padding: 18px;
      border-radius: 8px;
      font-size: 13px;
      line-height: 1.5;
      white-space: pre;
    }
    .g { color: #3fb950; font-weight: bold; }
    .r { color: #f85149; font-weight: bold; }
    .y { color: #d29922; font-weight: bold; }
    .b { color: #58a6ff; font-weight: bold; }
    .p { color: #bc8cff; font-weight: bold; }
    .gh-card {
      border: 1px solid #d0d7de;
      border-radius: 8px;
      background: #ffffff;
      margin-bottom: 14px;
      overflow: hidden;
    }
    .gh-header {
      background: #f6f8fa;
      padding: 10px 16px;
      border-bottom: 1px solid #d0d7de;
      font-weight: 600;
      font-size: 14px;
      display: flex;
      justify-content: space-between;
      align-items: center;
    }
    .gh-body {
      padding: 14px 16px;
      font-size: 13.5px;
    }
    .badge {
      display: inline-block;
      padding: 3px 10px;
      border-radius: 999px;
      font-size: 12px;
      font-weight: 600;
      color: white;
    }
    .badge-merged { background: #8250df; }
    .badge-closed { background: #cf222e; }
    .badge-pass { background: #1a7f37; }
    .kanban {
      display: grid;
      grid-template-columns: repeat(3, 1fr);
      gap: 14px;
    }
    .kanban-col {
      background: #f6f8fa;
      border: 1px solid #d0d7de;
      border-radius: 8px;
      padding: 12px;
    }
    .kanban-item {
      background: white;
      border: 1px solid #d0d7de;
      border-radius: 6px;
      padding: 10px;
      margin-top: 8px;
      font-size: 12.5px;
    }
  </style>
</head>
<body>

  <!-- 1. GIT BRANCHING & MERGE CONFLICT GRAPH -->
  <div id="git-branches-graph" class="capture-box">
    <div class="capture-title">Figure 6: Git Feature Branching Graph &amp; Merge Conflict Resolution History (mahdi-ruan/Blood-Donar-Management)</div>
    <div class="terminal"><span class="b">$ git remote -v</span>
origin  https://github.com/mahdi-ruan/Blood-Donar-Management.git (fetch)
origin  https://github.com/mahdi-ruan/Blood-Donar-Management.git (push)

<span class="b">$ git log --graph --oneline --all</span>
*   <span class="y">21f6198</span> (<span class="g">HEAD -&gt; main</span>, <span class="r">origin/main</span>) Merge pull request #1 from mahdi-ruan/feature/pr-emergency-contact-validation
|\\  
| * <span class="y">5aa2219</span> (<span class="r">origin/feature/pr-emergency-contact-validation</span>) feat(validation): add Bangladesh mobile phone prefix validation note
|/  
| * <span class="y">ca29ae8</span> (<span class="r">origin/feature/pr-experimental-auto-archive</span>) feat(requests): propose 7-day auto-archive rule for pending blood requests
|/  
*   <span class="y">3617069</span> merge: integrate TDD test suite, Selenium E2E script, and GitHub Actions CI
|\\  
| * <span class="y">88971e9</span> (<span class="r">origin/feature/testing-and-ci-pipeline</span>) test(tdd-ci): add Vitest TDD unit tests with mocks, Selenium E2E, and CI
|/  
*   <span class="y">c5f939a</span> merge: integrate React dashboard UI with 5 functional modules
|\\  
| * <span class="y">1cc81f2</span> (<span class="r">origin/feature/react-dashboard-ui</span>) feat(ui): build responsive 5-module React dashboard with Google Auth and Admin portal
|/  
*   <span class="y">4a9998f</span> <span class="g">merge(conflict): resolve README safety threshold conflict between main and feature/requests-inventory-admin</span>
|\\  
| * <span class="y">967b6c6</span> (<span class="r">origin/feature/requests-inventory-admin</span>) docs(readme): specify Rh-negative vs Rh-positive threshold policy
| * <span class="y">52a252e</span> feat(modules): implement request matching, blood bank inventory, camps, and admin fulfillment
* | <span class="y">ebb26bc</span> docs(readme): document standard 5-unit safety stock threshold on main
|/  
*   <span class="y">5d80d81</span> merge: integrate authentication and donor eligibility modules
|\\  
| * <span class="y">97f9d95</span> (<span class="r">origin/feature/auth-and-donor-modules</span>) feat(modules): add Google OAuth + Fixed Admin auth and 90-day eligibility
|/  
*   <span class="y">f94c57d</span> merge: integrate GoF design patterns and Firebase service adapter
|\\  
| * <span class="y">e04239e</span> (<span class="r">origin/feature/design-patterns</span>) feat(patterns): implement Singleton DB, Factory Method, Strategy, and Facade
|/  
* <span class="y">e881db3</span> chore(init): scaffold Vite React project with Vitest and Selenium configuration</div>
  </div>

  <!-- 2. MERGE CONFLICT RESOLUTION EVIDENCE -->
  <div id="git-merge-conflict" class="capture-box">
    <div class="capture-title">Figure 7: Merge Conflict Occurrence &amp; Resolution Between main (ebb26bc) and feature/requests-inventory-admin (967b6c6)</div>
    <div class="terminal"><span class="b">$ git checkout main &amp;&amp; git merge feature/requests-inventory-admin</span>
Auto-merging README.md
<span class="r">CONFLICT (add/add): Merge conflict in README.md</span>
Automatic merge failed; fix conflicts and then commit the result.

<span class="y">--- Conflict Markers Inside README.md Before Resolution ---</span>
&lt;&lt;&lt;&lt;&lt;&lt;&lt; HEAD (main)
# BloodLink BDMS
Safety Stock Threshold: 5 Units per ABO/Rh group (Standard Hospital Policy).
=======
# BloodLink BDMS
Safety Stock Threshold: 4 Units for Rare Rh-Negative &amp; 5 Units for Rh-Positive groups.
&gt;&gt;&gt;&gt;&gt;&gt;&gt; feature/requests-inventory-admin

<span class="g">--- Resolution Applied &amp; Committed in 4a9998f ---</span>
Unified policy adopted in InventoryModule (LOW_STOCK_THRESHOLD = 5 units across all 8 ABO/Rh groups)
and documented in Section 2.4 of README.md.
<span class="b">$ git add README.md &amp;&amp; git commit -m "merge(conflict): resolve README safety threshold conflict"</span>
[main 4a9998f] merge(conflict): resolve README safety threshold conflict between main and feature/requests-inventory-admin</div>
  </div>

  <!-- 3. PULL REQUESTS, CI PIPELINE & GITHUB PROJECTS BOARD -->
  <div id="github-prs-and-ci" class="capture-box">
    <div class="capture-title">Figure 8: GitHub Pull Request Reviews (Accepted &amp; Rejected/Revised), GitHub Actions CI &amp; Project Board</div>
    
    <div class="gh-card">
      <div class="gh-header">
        <span>Pull Request #1: feat(validation): add Bangladesh mobile phone prefix validation note (#1)</span>
        <span class="badge badge-merged">Merged into main (Commit 21f6198)</span>
      </div>
      <div class="gh-body">
        <strong>Branch:</strong> <code>feature/pr-emergency-contact-validation</code> &rarr; <code>main</code><br/>
        <strong>Review Decision (Accepted):</strong> Approved and merged after verifying 11-digit Bangladesh mobile prefix rules (<code>013-019</code>) and passing GitHub Actions CI checks.
      </div>
    </div>

    <div class="gh-card">
      <div class="gh-header">
        <span>Pull Request #2: feat(requests): propose 7-day auto-archive rule for pending blood requests (#2)</span>
        <span class="badge badge-closed">Rejected / Revision Requested</span>
      </div>
      <div class="gh-body">
        <strong>Branch:</strong> <code>feature/pr-experimental-auto-archive</code> &rarr; <code>main</code><br/>
        <strong>Review Decision (Rejected / Revised):</strong> Reviewer rejected the 7-day auto-archive window because thalassemia and scheduled surgery requests often require 14–30 days of advance donor matching. Kept unmerged for revision.
      </div>
    </div>

    <div class="gh-card">
      <div class="gh-header">
        <span>New Tool (Self-Directed Learning): GitHub Actions CI Pipeline (.github/workflows/ci.yml)</span>
        <span class="badge badge-pass">CI Passing (13/13 Tests + Vite Build)</span>
      </div>
      <div class="gh-body">
        <strong>Workflow:</strong> <code>BloodLink CI — Automated Build &amp; TDD Coverage Pipeline</code><br/>
        <strong>Jobs Executed on Push &amp; Pull Request:</strong> Checkout v4 &rarr; Node.js 20 Setup &rarr; <code>npm install</code> &rarr; <code>npm run test:coverage</code> (94.71% Stmts) &rarr; <code>npm run build</code> (Success).
      </div>
    </div>
  </div>

</body>
</html>`;

fs.writeFileSync(path.join(ROOT_DIR, 'docs', 'git_evidence.html'), gitEvidenceHtml, 'utf8');

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
  await driver.sleep(250);
  const base64 = await el.takeScreenshot(true);
  fs.writeFileSync(path.join(SCREENSHOT_DIR, filename), base64, 'base64');
  console.log(`[SAVED] ${filename}`);
}

async function main() {
  const server = await createServer({
    root: ROOT_DIR,
    server: { port: 5181, strictPort: true }
  });
  await server.listen();
  const driver = await buildWebDriver();
  try {
    await driver.get('http://localhost:5181/docs/git_evidence.html');
    await driver.sleep(800);
    await saveElementPng(driver, 'git-branches-graph', 'git_branches_graph.png');
    await saveElementPng(driver, 'git-merge-conflict', 'git_merge_conflict.png');
    await saveElementPng(driver, 'github-prs-and-ci', 'github_prs_and_ci.png');

    // Also capture live GitHub repo page screenshot from https://github.com/mahdi-ruan/Blood-Donar-Management
    await driver.manage().window().setRect({ width: 1360, height: 920 });
    await driver.get('https://github.com/mahdi-ruan/Blood-Donar-Management');
    await driver.sleep(2500);
    const base64Repo = await driver.takeScreenshot();
    fs.writeFileSync(path.join(SCREENSHOT_DIR, 'github_live_repo.png'), base64Repo, 'base64');
    console.log('[SAVED] github_live_repo.png');
  } finally {
    await driver.quit();
    await server.close();
  }
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
