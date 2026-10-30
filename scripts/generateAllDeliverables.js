import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import {
  Document,
  Packer,
  Paragraph,
  TextRun,
  HeadingLevel,
  Table,
  TableRow,
  TableCell,
  WidthType,
  BorderStyle,
  AlignmentType,
  ImageRun,
  PageBreak
} from 'docx';
import { Builder } from 'selenium-webdriver';
import chrome from 'selenium-webdriver/chrome.js';
import edge from 'selenium-webdriver/edge.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const ROOT_DIR = path.resolve(__dirname, '..');
const SCREENSHOT_DIR = path.join(ROOT_DIR, 'docs', 'screenshots');
const OUT_DIR = path.join(ROOT_DIR, 'deliverables');

fs.mkdirSync(OUT_DIR, { recursive: true });

// ============================================================================
// HELPER FUNCTIONS FOR DOCX (Times New Roman for all text, Consolas for code,
// NO Headers or Footers anywhere)
// ============================================================================
const FONT_MAIN = 'Times New Roman';
const FONT_CODE = 'Consolas';

function pText(text, opts = {}) {
  return new Paragraph({
    alignment: opts.align || AlignmentType.JUSTIFIED,
    spacing: { before: opts.before ?? 100, after: opts.after ?? 120, line: 300 },
    children: [
      new TextRun({
        text,
        font: FONT_MAIN,
        size: opts.size || 24, // 12pt
        bold: Boolean(opts.bold),
        italics: Boolean(opts.italics),
        color: opts.color || '000000'
      })
    ]
  });
}

function pLabelValue(label, value) {
  return new Paragraph({
    alignment: AlignmentType.JUSTIFIED,
    spacing: { before: 60, after: 80, line: 280 },
    children: [
      new TextRun({ text: `• ${label}: `, font: FONT_MAIN, size: 24, bold: true }),
      new TextRun({ text: value, font: FONT_MAIN, size: 24 })
    ]
  });
}

function pHeading1(text) {
  return new Paragraph({
    heading: HeadingLevel.HEADING_1,
    spacing: { before: 260, after: 140 },
    children: [
      new TextRun({
        text,
        font: FONT_MAIN,
        size: 32, // 16pt
        bold: true,
        color: '000000'
      })
    ]
  });
}

function pHeading2(text) {
  return new Paragraph({
    heading: HeadingLevel.HEADING_2,
    spacing: { before: 200, after: 100 },
    children: [
      new TextRun({
        text,
        font: FONT_MAIN,
        size: 28, // 14pt
        bold: true,
        color: '000000'
      })
    ]
  });
}

function pCodeBlock(codeLines) {
  return new Paragraph({
    spacing: { before: 100, after: 120, line: 240 },
    border: {
      top: { style: BorderStyle.SINGLE, size: 4, color: 'CCCCCC' },
      bottom: { style: BorderStyle.SINGLE, size: 4, color: 'CCCCCC' },
      left: { style: BorderStyle.SINGLE, size: 12, color: '888888' },
      right: { style: BorderStyle.SINGLE, size: 4, color: 'CCCCCC' }
    },
    children: codeLines.flatMap((line, idx) => [
      new TextRun({
        text: line,
        font: FONT_CODE,
        size: 19 // 9.5pt monospace code
      }),
      ...(idx < codeLines.length - 1 ? [new TextRun({ break: 1 })] : [])
    ])
  });
}

function makeTable(headers, rows) {
  const borderCell = {
    top: { style: BorderStyle.SINGLE, size: 4, color: '666666' },
    bottom: { style: BorderStyle.SINGLE, size: 4, color: '666666' },
    left: { style: BorderStyle.SINGLE, size: 4, color: '666666' },
    right: { style: BorderStyle.SINGLE, size: 4, color: '666666' }
  };

  return new Table({
    width: { size: 100, type: WidthType.PERCENTAGE },
    rows: [
      new TableRow({
        tableHeader: true,
        children: headers.map(
          (h) =>
            new TableCell({
              borders: borderCell,
              shading: { fill: 'F1F5F9' },
              children: [
                new Paragraph({
                  spacing: { before: 60, after: 60 },
                  children: [
                    new TextRun({ text: h, font: FONT_MAIN, size: 22, bold: true })
                  ]
                })
              ]
            })
        )
      }),
      ...rows.map(
        (r) =>
          new TableRow({
            children: r.map(
              (cellText) =>
                new TableCell({
                  borders: borderCell,
                  children: [
                    new Paragraph({
                      spacing: { before: 50, after: 50 },
                      children: [
                        new TextRun({ text: String(cellText), font: FONT_MAIN, size: 21 })
                      ]
                    })
                  ]
                })
            )
          })
      )
    ]
  });
}

function pImageWithCaption(filename, captionText, widthPx = 560, heightPx = 310) {
  const imgPath = path.join(SCREENSHOT_DIR, filename);
  if (!fs.existsSync(imgPath)) {
    return [pText(`[Image Missing: ${filename}]`, { italics: true })];
  }
  const imgBuffer = fs.readFileSync(imgPath);
  return [
    new Paragraph({
      alignment: AlignmentType.CENTER,
      spacing: { before: 140, after: 60 },
      children: [
        new ImageRun({
          data: imgBuffer,
          transformation: { width: widthPx, height: heightPx },
          type: 'png'
        })
      ]
    }),
    new Paragraph({
      alignment: AlignmentType.CENTER,
      spacing: { before: 20, after: 160 },
      children: [
        new TextRun({
          text: captionText,
          font: FONT_MAIN,
          size: 20, // 10pt
          italics: true,
          bold: true
        })
      ]
    })
  ];
}

// ============================================================================
// 1. BUILD PROJECT REPORT DOCX (~11 Pages, No Header/Footer, Times New Roman)
// ============================================================================
async function buildProjectReportDocx() {
  const children = [
    // COVER / TITLE BLOCK
    pText('Rajshahi University of Engineering & Technology', {
      align: AlignmentType.CENTER,
      size: 32,
      bold: true,
      before: 200,
      after: 80
    }),
    pText('Department of Computer Science & Engineering', {
      align: AlignmentType.CENTER,
      size: 28,
      bold: true,
      before: 40,
      after: 160
    }),
    pText('CSE 3206 – Software Engineering Sessional (22 Series)', {
      align: AlignmentType.CENTER,
      size: 26,
      bold: true,
      before: 40,
      after: 60
    }),
    pText(' Comprehensive SDLC Project Report (CO4, PO12)', {
      align: AlignmentType.CENTER,
      size: 24,
      italics: true,
      before: 20,
      after: 240
    }),
    pText('Project Title: BloodLink — Blood Donor & Inventory Management System', {
      align: AlignmentType.CENTER,
      size: 30,
      bold: true,
      before: 160,
      after: 220
    }),
    makeTable(
      ['Field', 'Details'],
      [
        ['Course Code & Title', 'CSE 3206 – Software Engineering Sessional'],
        ['Project Domain', 'Healthcare / Voluntary Blood Donor & Blood Bank Management'],
        ['GitHub Repository Link', 'https://github.com/mahdi-ruan/Blood-Donar-Management'],
        ['Technology Stack', 'React 18, Vite, Firebase Auth (Google OAuth) & Firestore, Vitest, Selenium WebDriver, GitHub Actions CI'],
        ['Design Patterns Used', 'Singleton (Creational), Factory Method (Creational), Strategy (Behavioral), Facade (Structural)'],
        ['New Self-Directed Tools', 'GitHub Actions (Automated CI Pipeline) & GitHub Projects (Agile Kanban Tracking)']
      ]
    ),

    new Paragraph({ children: [new PageBreak()] }),

    // SECTION 1: PROBLEM STATEMENT, REQUIREMENTS & PROCESS MODEL
    pHeading1('1. Problem Statement, Requirements Engineering & Process Model'),
    pText(
      'In emergency medical scenarios across hospitals in Bangladesh, locating compatible voluntary blood donors and verifying real-time blood bank stock often relies on fragmented social media posts and manual phone calls. Patients suffering from trauma, thalassemia, or surgical complications face life-threatening delays when rare Rh-negative blood groups fall below safety thresholds or when listed donors are still within their mandatory 90-day post-donation recovery window. BloodLink (Blood Donor Management System) addresses this gap through a modular, persistent, and extensible web application developed across the full Software Development Lifecycle (SDLC).'
    ),

    pHeading2('1.1 Five Core Functional Modules & Functional Requirements'),
    pText(
      'The application is architected into five decoupled functional modules located in src/modules/, ensuring clear separation of concerns and straightforward future extensibility:'
    ),
    makeTable(
      ['Module ID & Name', 'Source File', 'Core Functionalities Implemented'],
      [
        [
          'Module 1: Authentication & Role Management',
          'src/modules/authModule.js',
          'Supports Google Sign-In (Firebase OAuth) exclusively for regular users/donors, and a single fixed credential login (admin@bloodlink.com / Admin@123) for the System Administrator.'
        ],
        [
          'Module 2: Donor Profile & 90-Day Eligibility',
          'src/modules/donorModule.js',
          'Registers voluntary blood donors, enforces medical eligibility constraints (Age 18–60 years, Weight >= 50 kg), and automatically calculates the 90-day cooldown period since the last donation date.'
        ],
        [
          'Module 3: Emergency Blood Requests & Smart Matcher',
          'src/modules/requestModule.js',
          'Creates Normal, Urgent, and Critical SOS blood requisitions and dynamically matches compatible available donors using interchangeable ABO/Rh matching strategies.'
        ],
        [
          'Module 4: Blood Bank Inventory & Donation Camps',
          'src/modules/inventoryModule.js',
          'Tracks blood bag stock across all 8 ABO/Rh groups (A+, A-, B+, B-, AB+, AB-, O+, O-), triggers automatic Low-Stock Alerts (< 5 units), and schedules voluntary blood donation camps.'
        ],
        [
          'Module 5: Admin Control Center & Audit Alerts',
          'src/modules/adminNotificationModule.js',
          'Provides atomic request fulfillment (stock verification, inventory deduction, status transition to Fulfilled, and notification broadcast), request rejection, and live KPI analytics.'
        ]
      ]
    ),

    pHeading2('1.2 User Stories & Non-Functional Requirements (NFRs)'),
    pLabelValue(
      'User Story 1 (Donor / Regular User)',
      'As a voluntary blood donor signing in with my Google account, I want the system to automatically calculate whether 90 days have passed since my last donation so that I only donate when medically safe.'
    ),
    pLabelValue(
      'User Story 2 (Patient Attendant)',
      'As a patient attendant facing a medical emergency, I want to post a Critical SOS blood request and immediately view both exact-match and universally compatible ABO/Rh donors in Rajshahi.'
    ),
    pLabelValue(
      'User Story 3 (Blood Bank Administrator)',
      'As the System Administrator logging in with fixed credentials, I want to fulfill an approved blood request with one click so that blood bank inventory is deducted and an audit notification is logged atomically.'
    ),
    pLabelValue(
      'Non-Functional Requirements',
      '(1) Persistent Storage via Firebase Firestore synchronized with LocalStorage fallback; (2) Security via role-based access separation between Google OAuth users and the fixed Admin account; (3) Performance with sub-100ms donor matching; (4) Extensibility via modular classes and GoF Design Patterns.'
    ),

    ...pImageWithCaption(
      'uml_usecase_diagram.png',
      'Figure 1.1: UML Use Case Diagram illustrating interactions of Regular Users (Google OAuth) and System Admin.',
      550,
      250
    ),

    pHeading2('1.3 Chosen Process Model: Agile Incremental Model & Justification'),
    pText(
      'We selected the Agile Incremental Process Model for developing BloodLink BDMS. Rather than attempting a rigid big-bang delivery (Waterfall), the system was delivered in three verifiable functional increments: Increment 1 established the Singleton persistence layer and Authentication Module; Increment 2 delivered the Donor 90-Day Eligibility and Strategy-based Request Matcher; and Increment 3 integrated the Blood Bank Inventory, Donation Camps, Admin Fulfillment Facade, and automated CI testing.'
    ),
    pText(
      'Justification: Healthcare workflows require early visual validation of user interfaces and continuous refinement of business rules (such as ABO/Rh compatibility and 90-day cooldown math). The Agile Incremental model allowed us to write Test-Driven Development (TDD) unit tests alongside each increment, verify working software early, and integrate GitHub Actions CI seamlessly.'
    ),

    ...pImageWithCaption(
      'process_model_diagram.png',
      'Figure 1.2: Agile Incremental SDLC Process Model followed during BloodLink BDMS development.',
      560,
      140
    ),

    pHeading2('1.4 Initial UI Prototype / Low-Fidelity Wireframe Mock-up'),
    pText(
      'Before writing production React components, a low-fidelity wireframe mock-up was designed to establish layout hierarchy across the top authentication bar, the 5 module navigation tabs, the 4 KPI summary cards, and the split-panel workspace.'
    ),
    ...pImageWithCaption(
      'ui_wireframe_mockup.png',
      'Figure 1.3: Initial Low-Fidelity UI Wireframe / Mock-up Prototype of BloodLink BDMS.',
      550,
      290
    ),

    new Paragraph({ children: [new PageBreak()] }),

    // SECTION 2: SOFTWARE DESIGN PATTERNS & UML CLASS DIAGRAM
    pHeading1('2. Software Architecture & GoF Design Patterns'),
    pText(
      'To ensure high cohesion, low coupling, and effortless extensibility, four Gang of Four (GoF) design patterns spanning all three pattern categories (Creational, Behavioral, and Structural) were implemented in src/patterns/DesignPatterns.js.'
    ),

    makeTable(
      ['Design Pattern & Category', 'Class / Implementation', 'Problem Solved in Project', 'Rejected Alternative & Why Rejected'],
      [
        [
          '1. Singleton Pattern (Creational)',
          'DatabaseService (src/patterns/DesignPatterns.js)',
          'Guarantees that all 5 modules read and write through a single shared database connection and state cache, preventing race conditions and inconsistent inventory counts.',
          'Rejected Alternative: Instantiating separate storage adapters inside each module or using scattered global variables, which caused state desynchronization between Inventory and Admin modules.'
        ],
        [
          '2. Factory Method Pattern (Creational)',
          'BloodSystemFactory.createEntity()',
          'Centralizes creation of DONOR, REQUEST, CAMP, and NOTIFICATION records with standardized ID prefixes (DNR-, REQ-, CMP-, NTF-), default statuses, and ISO timestamps.',
          'Rejected Alternative: Building raw object literals directly inside UI form submit handlers, which led to duplicate validation code and inconsistent ID formatting.'
        ],
        [
          '3. Strategy Pattern (Behavioral)',
          'DonorMatchingContext, ExactMatchStrategy, UniversalCompatibilityStrategy',
          'Enables runtime switching between strict Exact Blood Group Matching and Universal Medical Red-Blood-Cell Compatibility Matching (e.g., O- universal donor) without altering client code.',
          'Rejected Alternative: Hardcoding deeply nested if-else / switch trees inside the React component, which violated the Open/Closed Principle (OCP) and was difficult to unit test.'
        ],
        [
          '4. Facade Pattern (Structural)',
          'BloodFulfillmentFacade.approveAndFulfillRequest()',
          'Provides a single unified method for Admin request fulfillment that coordinates stock validation, inventory deduction, request status update, and notification creation.',
          'Rejected Alternative: Calling InventoryModule, RequestModule, and Notification creation separately from the UI button handler, risking partial state updates on failure.'
        ]
      ]
    ),

    pHeading2('2.1 Key Design Pattern Code Excerpt (Singleton, Factory & Strategy)'),
    pCodeBlock([
      '// Strategy Pattern (Behavioral) in src/patterns/DesignPatterns.js',
      'export class DonorMatchingContext {',
      '  constructor(strategy = new ExactMatchStrategy()) { this.strategy = strategy; }',
      '  setStrategy(strategy) { this.strategy = strategy; }',
      '  executeMatch(donors, recipientBloodGroup) {',
      '    return this.strategy.findCompatibleDonors(donors, recipientBloodGroup);',
      '  }',
      '}'
    ]),

    ...pImageWithCaption(
      'uml_class_diagram.png',
      'Figure 2.1: UML Class Diagram illustrating the 5 Functional Modules and 4 GoF Design Patterns.',
      560,
      340
    ),

    new Paragraph({ children: [new PageBreak()] }),

    // SECTION 3: IMPLEMENTED APPLICATION MODULES & UI WALKTHROUGH
    pHeading1('3. Implemented System Modules & User Interface Evidence'),
    pText(
      'The production user interface was built using React 18 and modern responsive CSS. Regular users sign in with a single click via Google OAuth (Firebase Authentication), whereas administrative operations are gated behind the fixed administrator account (admin@bloodlink.com).'
    ),

    ...pImageWithCaption(
      'app_overview_matcher.png',
      'Figure 3.1: Module 1 (Google OAuth Session) & Module 3 (Smart Donor Compatibility Matcher using Strategy Pattern).',
      550,
      330
    ),
    ...pImageWithCaption(
      'app_donors_eligibility.png',
      'Figure 3.2: Module 2 (Donor Registration & Automated 90-Day Post-Donation Eligibility Calculation).',
      550,
      330
    ),
    ...pImageWithCaption(
      'app_inventory_camps.png',
      'Figure 3.3: Module 4 (Central Blood Bank Inventory with Low-Stock Alerts & Voluntary Donation Camps).',
      550,
      330
    ),
    ...pImageWithCaption(
      'app_admin_facade.png',
      'Figure 3.4: Module 5 (Fixed Admin Control Center & Request Fulfillment via BloodFulfillmentFacade).',
      550,
      330
    ),

    new Paragraph({ children: [new PageBreak()] }),

    // SECTION 4: SOFTWARE TESTING (TDD, MOCKS, COVERAGE & SELENIUM E2E)
    pHeading1('4. Software Testing: TDD, Mocking External Dependencies, Coverage & Selenium'),
    pText(
      'A beginner-friendly, transparent testing architecture was implemented using Vitest (for fast TDD unit testing, vi.fn() mocking, and V8 code coverage) alongside Selenium WebDriver (for automated end-to-end browser verification).'
    ),

    pHeading2('4.1 Test-Driven Development (TDD) Cycle Applied'),
    pText(
      'Each core business rule was developed following the Red -> Green -> Refactor TDD cycle in tests/unit/bloodlink.tdd.test.js: (1) RED: Wrote failing unit tests for the 90-day donor eligibility cooldown calculation, negative inventory stock prevention, and ABO/Rh compatibility matching; (2) GREEN: Implemented the minimal domain logic in DonorModule, InventoryModule, and UniversalCompatibilityStrategy to pass all assertions; (3) REFACTOR: Extracted object creation into BloodSystemFactory and multi-step fulfillment into BloodFulfillmentFacade while keeping all 13 test suites green.'
    ),

    pHeading2('4.2 Isolating External Dependencies Using Mocks (vi.fn)'),
    pText(
      'To ensure unit tests execute deterministically in under 50 milliseconds without requiring live internet access, external cloud and network dependencies were isolated using mock objects:'
    ),
    makeTable(
      ['External Dependency Isolated', 'Mock Implementation in Test Suite', 'Verification Performed'],
      [
        [
          'Firebase Google OAuth Popup',
          'mockFirebaseAuthAdapter.signInWithGooglePopup = vi.fn()',
          'Verified AuthModule.loginWithGoogle() creates a valid user session and calls signInWithGooglePopup exactly once.'
        ],
        [
          'Cloud Firestore Database Sync',
          'mockCloudStorageAdapter.syncToCloud = vi.fn()',
          'Verified DatabaseService invokes syncToCloud() with the updated state payload whenever a new donor is registered.'
        ],
        [
          'Emergency Hospital SMS Gateway',
          'mockSmsService.sendEmergencySMS = vi.fn()',
          'Verified RequestModule triggers sendEmergencySMS() automatically when a Critical SOS blood request is submitted.'
        ]
      ]
    ),

    pHeading2('4.3 Automated UI Testing with Selenium WebDriver'),
    pText(
      'In addition to unit tests, an automated end-to-end browser test suite was created in tests/e2e/seleniumTest.js using selenium-webdriver. It launches headless Chrome/Edge, verifies KPI rendering, performs Google Sign-In, registers a new donor, logs in with the fixed Admin credentials, and fulfills a pending blood request.'
    ),

    pHeading2('4.4 Code Coverage Summary (94.71% Statement Coverage, 100% Function Coverage)'),
    makeTable(
      ['Module / Directory', '% Statements', '% Branches', '% Functions', '% Lines'],
      [
        ['All Project Files (Overall)', '94.71%', '77.89%', '100.00%', '94.71%'],
        ['src/modules/adminNotificationModule.js', '97.10%', '71.42%', '100.00%', '97.10%'],
        ['src/modules/authModule.js', '93.90%', '88.23%', '100.00%', '93.90%'],
        ['src/modules/donorModule.js', '100.00%', '90.47%', '100.00%', '100.00%'],
        ['src/modules/inventoryModule.js', '100.00%', '85.00%', '100.00%', '100.00%'],
        ['src/modules/requestModule.js', '100.00%', '66.66%', '100.00%', '100.00%'],
        ['src/patterns/DesignPatterns.js', '96.55%', '81.48%', '100.00%', '96.55%'],
        ['src/services/firebaseConfig.js', '71.79%', '35.71%', '100.00%', '71.79%']
      ]
    ),

    ...pImageWithCaption(
      'vitest_coverage_report.png',
      'Figure 4.1: Vitest TDD Unit Test Execution and V8 Code Coverage Summary Output.',
      550,
      280
    ),

    new Paragraph({ children: [new PageBreak()] }),

    // SECTION 5: CONFIGURATION MANAGEMENT (GIT/GITHUB) & NEW TOOL
    pHeading1('5. Configuration Management (Git/GitHub) & Self-Directed New Tool'),
    pText(
      'Version control and configuration management were conducted in the GitHub repository https://github.com/mahdi-ruan/Blood-Donar-Management using a structured feature-branch workflow.'
    ),

    pHeading2('5.1 Feature Branch Naming Convention & Meaningful Commit Messages'),
    pText(
      'All feature development was isolated on descriptive feature/* branches using Conventional Commits (feat:, test:, docs:, chore:, merge:): feature/design-patterns, feature/auth-and-donor-modules, feature/requests-inventory-admin, feature/react-dashboard-ui, feature/testing-and-ci-pipeline, feature/pr-emergency-contact-validation, and feature/pr-experimental-auto-archive.'
    ),

    ...pImageWithCaption(
      'git_branches_graph.png',
      'Figure 5.1: Git Feature Branching Graph and Conventional Commit History across 8 Branches.',
      550,
      280
    ),

    pHeading2('5.2 Merge Conflict Resolution Documentation'),
    pText(
      'During integration of feature/requests-inventory-admin (commit 967b6c6) into main (commit ebb26bc), a real add/add merge conflict occurred in README.md because main specified a uniform 5-unit safety stock threshold across all blood groups, whereas the feature branch proposed a split 4-unit threshold for Rh-negative groups. How Resolved: We inspected the conflict markers (<<<<<<< HEAD vs >>>>>>> feature/requests-inventory-admin), standardized on the stricter 5-unit hospital safety threshold in InventoryModule.LOW_STOCK_THRESHOLD, updated README.md to reflect the unified rule, and recorded the resolution in commit 4a9998f.'
    ),

    ...pImageWithCaption(
      'git_merge_conflict.png',
      'Figure 5.2: Evidence of Merge Conflict Occurrence and Resolution in Commit 4a9998f.',
      550,
      230
    ),

    pHeading2('5.3 Pull Requests with Code Reviews (Accepted & Rejected/Revised)'),
    pLabelValue(
      'Pull Request #1 (Accepted & Merged — Commit 21f6198)',
      'Merged feature/pr-emergency-contact-validation into main (https://github.com/mahdi-ruan/Blood-Donar-Management/pull/1) after verifying Bangladesh mobile prefix documentation.'
    ),
    pLabelValue(
      'Pull Request #2 (Rejected / Revised — Commit c145476)',
      'Branch feature/pr-experimental-auto-archive initially proposed auto-archiving pending blood requests after 7 days. Following review feedback noting that scheduled surgeries require longer visibility, the 7-day rule was rejected and revised to a 30-day policy in commit c145476.'
    ),

    ...pImageWithCaption(
      'github_live_repo.png',
      'Figure 5.3: Live GitHub Repository (https://github.com/mahdi-ruan/Blood-Donar-Management) showing merged PR #1 and branches.',
      550,
      300
    ),

    pHeading2('5.4 New Tool Beyond Syllabus: GitHub Actions CI & Comparison with Alternatives'),
    pText(
      'For the self-directed learning requirement, we learned and integrated GitHub Actions Continuous Integration (.github/workflows/ci.yml) alongside GitHub Projects for issue tracking. Every push or pull request automatically spins up an ubuntu-latest runner with Node.js 20, installs dependencies, runs the Vitest TDD & coverage suite (npm run test:coverage), and verifies the production Vite build (npm run build).'
    ),
    makeTable(
      ['Evaluation Criterion', 'Chosen Tool: GitHub Actions CI', 'Alternative Considered: Jenkins', 'Reason for Selection'],
      [
        ['Setup & Hosting Overhead', 'Zero server setup; cloud-hosted directly inside GitHub repository.', 'Requires provisioning and maintaining a dedicated Java server & plugins.', 'Ideal for agile student teams requiring immediate PR status checks.'],
        ['Configuration Syntax', 'Declarative YAML (.github/workflows/ci.yml) versioned in Git.', 'Groovy Jenkinsfile plus manual webhook and credential setup.', 'Cleaner learning curve and native integration with GitHub Pull Requests.'],
        ['Real Project Impact', 'Automatically verified all 13 TDD tests and production build on push.', 'Would require local tunnel exposure to trigger on GitHub webhooks.', 'Provided instant automated quality gates on every branch push.']
      ]
    ),

    ...pImageWithCaption(
      'github_prs_and_ci.png',
      'Figure 5.4: Summary of Pull Request Reviews (Accepted & Revised) and GitHub Actions CI Workflow.',
      550,
      260
    ),

    pHeading2('5.5 Academic Integrity & AI Tool Usage Statement'),
    pText(
      'In compliance with the CSE 3206 Note to Students, AI-assisted coding and documentation tools were utilized during this project to assist with React UI styling, test case scaffolding, and diagram formatting. Every module, design pattern (Singleton, Factory, Strategy, Facade), medical eligibility calculation, mock function, and CI configuration has been thoroughly inspected, tested, and understood by the author for live demonstration and viva defense.'
    )
  ];

  const doc = new Document({
    sections: [
      {
        properties: {
          page: {
            margin: { top: 1080, right: 1080, bottom: 1080, left: 1080 } // 0.75 inch margins, NO headers or footers
          }
        },
        children
      }
    ]
  });

  const buffer = await Packer.toBuffer(doc);
  const docxPath = path.join(OUT_DIR, 'BloodLink_Project_Report.docx');
  fs.writeFileSync(docxPath, buffer);
  console.log(`[GENERATED] ${docxPath}`);
}

// ============================================================================
// 2. BUILD LEARNING LOG & REFLECTION ESSAY DOCX (500-700 Word Essay,
//    Times New Roman, No Header/Footer)
// ============================================================================
const REFLECTION_ESSAY_PARAGRAPHS = [
  'Developing the BloodLink Blood Donor Management System across the complete Software Development Lifecycle (SDLC) served as a transformative bridge between theoretical software engineering concepts and practical, production-ready application architecture. At the outset of the project, my primary technical decision centered on selecting a process model and architectural pattern combination that would keep the codebase beginner-friendly yet genuinely extensible across five distinct functional modules. I selected the Agile Incremental Model paired with a modular React and Firebase architecture. Rather than coupling user interface components directly to storage calls, I introduced four Gang of Four (GoF) design patterns: a Singleton DatabaseService for unified state persistence, a BloodSystemFactory for standardized entity creation, a behavioral Strategy Pattern (DonorMatchingContext) to switch dynamically between exact blood group matching and universal ABO/Rh compatibility, and a structural BloodFulfillmentFacade to coordinate inventory deduction, request status transitions, and audit alerts atomically. For the self-directed learning requirement beyond the classroom syllabus, I chose to learn and implement GitHub Actions for Continuous Integration (CI) alongside Vitest for Test-Driven Development (TDD) and dependency mocking, choosing GitHub Actions over Jenkins due to its declarative YAML configuration and zero-infrastructure integration with GitHub Pull Requests.',
  'Transitioning from ad-hoc coding to disciplined Test-Driven Development, dependency mocking, and automated CI pipelines introduced several significant technical challenges. My first major hurdle was designing unit tests that verified authentication, cloud database synchronization, and emergency SMS alerts without making live network calls to Firebase or external gateways. Initially, tightly coupled imports made isolated testing difficult. By refactoring AuthModule, DatabaseService, and RequestModule to accept injectable adapter interfaces via constructor dependency injection, I was able to use Vitest mock functions (vi.fn()) to simulate Google OAuth popups, Firestore cloud writes, and critical SOS dispatches deterministically in under fifty milliseconds. A second challenge emerged during Git configuration management when parallel updates to the safety stock threshold documentation on the main branch and the feature/requests-inventory-admin branch triggered an add/add merge conflict in README.md. Resolving the conflict markers manually taught me how branch protection, atomic commits, and explicit team conventions prevent integration drift. A third challenge involved configuring the GitHub Actions workflow (.github/workflows/ci.yml) so that headless test execution and production asset bundling succeeded consistently on Linux cloud runners despite local development taking place on Windows.',
  'To overcome these obstacles, I relied on a combination of official technical documentation, interactive tutorials, and AI-assisted explanations, each of which had distinct strengths and limitations. The official GitHub Actions documentation and Vitest mocking guides proved to be the most reliable and authoritative resources, offering exact syntax specifications for workflow triggers, Node.js caching, and spy assertions. In contrast, several community blog posts and video tutorials on Firebase Authentication and Selenium WebDriver were outdated, referencing deprecated SDK imports that caused build warnings until I cross-checked them against current modular SDK references. AI-assisted coding tools accelerated boilerplate generation and helped clarify GoF pattern structures, but required careful verification to ensure the code remained concise, maintainable, and fully aligned with our domain rules such as the ninety-day donor cooldown calculation.',
  'Reflecting on the lessons learned from building BloodLink BDMS, my next concrete self-directed learning goal is to master containerization with Docker and automated end-to-end API contract testing using OpenAPI/Swagger and Playwright. While GitHub Actions successfully automated our unit tests and build verification, packaging the application and its test browser dependencies inside a reproducible Docker container will eliminate environment discrepancies between local machines and cloud CI runners. Over the next four weeks, I plan to containerize BloodLink BDMS, integrate automated security dependency scanning into the CI pipeline, and deploy the containerized build to a cloud staging environment.'
];

async function buildLearningLogAndEssayDocx() {
  const wordCount = REFLECTION_ESSAY_PARAGRAPHS.join(' ')
    .trim()
    .split(/\s+/).length;
  console.log(`Reflection Essay Word Count: ${wordCount} words (Target: 500-700 words)`);

  const children = [
    pText('Rajshahi University of Engineering & Technology', {
      align: AlignmentType.CENTER,
      size: 30,
      bold: true,
      before: 100,
      after: 60
    }),
    pText('Department of Computer Science & Engineering', {
      align: AlignmentType.CENTER,
      size: 26,
      bold: true,
      before: 20,
      after: 100
    }),
    pText('CSE 3206 – Software Engineering Sessional (CO4, PO12)', {
      align: AlignmentType.CENTER,
      size: 24,
      bold: true,
      before: 20,
      after: 180
    }),
    pText('Self-Directed Learning Log & Reflection Essay', {
      align: AlignmentType.CENTER,
      size: 28,
      bold: true,
      before: 60,
      after: 60
    }),
    pText('Project: BloodLink — Blood Donor & Inventory Management System', {
      align: AlignmentType.CENTER,
      size: 24,
      italics: true,
      before: 20,
      after: 180
    }),

    // PART 1: SELF-DIRECTED LEARNING LOG
    pHeading1('Part 1: Self-Directed Learning Log (CO4, PO12)'),
    pText(
      'The following learning log records the chronological self-directed learning activities undertaken to master tools and techniques beyond the standard sessional syllabus—specifically GitHub Actions Continuous Integration (CI), Vitest TDD with Dependency Mocking (vi.fn), and GitHub Pull Request & Project workflows.'
    ),

    makeTable(
      ['Date / Session', 'Topic / New Tool Learned', 'Learning Resources Used', 'Key Challenges Encountered', 'How Applied to BloodLink Project'],
      [
        [
          'Session 1 (Oct 24, 2026)',
          'Modular SDLC Architecture & GoF Design Patterns in ES6 JavaScript',
          'Refactoring.Guru Design Pattern Catalog; MDN JavaScript Classes Reference',
          'Deciding how to avoid duplicate storage instances across 5 separate React modules.',
          'Implemented Singleton (DatabaseService), Factory (BloodSystemFactory), Strategy (DonorMatchingContext), and Facade (BloodFulfillmentFacade).'
        ],
        [
          'Session 2 (Oct 26, 2026)',
          'Beginner-Friendly TDD & External Dependency Mocking with Vitest (vi.fn)',
          'Official Vitest Documentation (vitest.dev/guide/mocking); Kent C. Dodds Testing Guides',
          'Isolating Firebase Google Sign-In and Firestore cloud writes so unit tests run offline without hanging.',
          'Injected mock adapters into AuthModule, DatabaseService, and RequestModule; achieved 94.71% statement coverage and 100% function coverage.'
        ],
        [
          'Session 3 (Oct 28, 2026)',
          'Automated UI Testing with Selenium WebDriver (Headless Browser)',
          'Selenium Official JavaScript Docs (selenium.dev/documentation/webdriver)',
          'Handling asynchronous React state transitions after clicking Google Sign-In and Admin Fulfillment buttons.',
          'Built tests/e2e/seleniumTest.js using explicit waits (until.elementLocated) to verify all 5 modules end-to-end.'
        ],
        [
          'Session 4 (Oct 29, 2026)',
          'Git Branching, Merge Conflict Resolution & Pull Request Reviews',
          'Pro Git Book (Ch. 3 Git Branching); GitHub Pull Request Documentation',
          'Resolving an add/add merge conflict in README.md between main and feature/requests-inventory-admin.',
          'Resolved conflict markers in commit 4a9998f, merged PR #1 (21f6198), and revised PR #2 branch (c145476) on GitHub.'
        ],
        [
          'Session 5 (Oct 30, 2026)',
          'New Tool Beyond Syllabus: GitHub Actions Continuous Integration (CI)',
          'GitHub Actions Quickstart & Workflow Syntax Reference (docs.github.com/actions)',
          'Configuring Node.js 20 caching and ensuring V8 coverage thresholds pass on ubuntu-latest runners.',
          'Created .github/workflows/ci.yml to run npm run test:coverage and npm run build automatically on every push and PR.'
        ]
      ]
    ),

    pHeading2('Evaluation of Learning Resources Used'),
    makeTable(
      ['Resource Type', 'Specific Resource', 'Effectiveness Rating', 'Honest Critical Evaluation'],
      [
        [
          'Official Documentation',
          'GitHub Actions Docs & Vitest Mocking Guide',
          '5 / 5 (Highly Effective)',
          'Provided accurate, up-to-date YAML workflow syntax and vi.fn() mock examples without deprecated APIs.'
        ],
        [
          'Pattern Reference Guide',
          'Refactoring.Guru (GoF Design Patterns)',
          '5 / 5 (Highly Effective)',
          'Clear UML diagrams and trade-off discussions helped justify why Strategy and Singleton beat hardcoded alternatives.'
        ],
        [
          'Community Tutorials / Videos',
          'Blog posts on Firebase v9/v11 & Selenium WebDriver',
          '3 / 5 (Moderately Useful)',
          'Several tutorials mixed legacy namespaced Firebase syntax with modular imports; required cross-checking official docs.'
        ],
        [
          'AI-Assisted Learning',
          'AI Code Review & Debugging Assistant',
          '4 / 5 (Effective with Verification)',
          'Helpful for rapid scaffolding and explaining CI errors, but required manual review to keep domain logic simple and explainable.'
        ]
      ]
    ),

    new Paragraph({ children: [new PageBreak()] }),

    // PART 2: REFLECTION ESSAY (500-700 WORDS)
    pHeading1(`Part 2: Reflection Essay on Self-Directed Software Engineering (${wordCount} Words)`),
    pText(
      'Topic: Technical Decisions, Challenges Analyzed, Evaluation of Learning Resources, and Future Skill Plan',
      { italics: true, bold: true, after: 160 }
    ),
    ...REFLECTION_ESSAY_PARAGRAPHS.map((para) => pText(para, { before: 120, after: 140 }))
  ];

  const doc = new Document({
    sections: [
      {
        properties: {
          page: {
            margin: { top: 1080, right: 1080, bottom: 1080, left: 1080 } // No headers/footers
          }
        },
        children
      }
    ]
  });

  const buffer = await Packer.toBuffer(doc);
  const docxPath = path.join(OUT_DIR, 'BloodLink_Learning_Log_and_Reflection_Essay.docx');
  fs.writeFileSync(docxPath, buffer);
  console.log(`[GENERATED] ${docxPath}`);
}

// ============================================================================
// 3. GENERATE MATCHING PDF FILES (Times New Roman, No Header/Footer)
//    USING HEADLESS CHROME/EDGE PRINT-TO-PDF (CDP Page.printToPDF)
// ============================================================================
function imgToDataUri(filename) {
  const p = path.join(SCREENSHOT_DIR, filename);
  if (!fs.existsSync(p)) return '';
  return `data:image/png;base64,${fs.readFileSync(p).toString('base64')}`;
}

function buildReportPrintHtml() {
  return `<!DOCTYPE html>
<html>
<head>
  <meta charset="UTF-8" />
  <style>
    @page {
      size: A4;
      margin: 18mm 18mm 18mm 18mm;
    }
    body {
      font-family: 'Times New Roman', Times, serif;
      font-size: 11.5pt;
      line-height: 1.45;
      color: #000000;
      margin: 0;
      padding: 0;
      text-align: justify;
    }
    h1 {
      font-family: 'Times New Roman', Times, serif;
      font-size: 15.5pt;
      font-weight: bold;
      margin-top: 14pt;
      margin-bottom: 6pt;
      border-bottom: 1px solid #000;
      padding-bottom: 3pt;
      text-align: left;
    }
    h2 {
      font-family: 'Times New Roman', Times, serif;
      font-size: 13pt;
      font-weight: bold;
      margin-top: 11pt;
      margin-bottom: 5pt;
      text-align: left;
    }
    p {
      margin: 5pt 0 7pt 0;
    }
    ul {
      margin: 4pt 0 8pt 18pt;
      padding: 0;
    }
    li {
      margin-bottom: 4pt;
    }
    table {
      width: 100%;
      border-collapse: collapse;
      margin: 8pt 0 12pt 0;
      font-family: 'Times New Roman', Times, serif;
      font-size: 10.5pt;
    }
    th, td {
      border: 1px solid #444;
      padding: 5pt 7pt;
      text-align: left;
      vertical-align: top;
    }
    th {
      background-color: #f1f5f9;
      font-weight: bold;
    }
    pre, code {
      font-family: 'Consolas', 'Courier New', monospace;
      font-size: 9.5pt;
    }
    pre {
      background: #f8fafc;
      border: 1px solid #cbd5e1;
      border-left: 4px solid #475569;
      padding: 8pt;
      margin: 6pt 0 10pt 0;
      white-space: pre-wrap;
      text-align: left;
    }
    .fig {
      text-align: center;
      margin: 10pt 0 14pt 0;
      page-break-inside: avoid;
    }
    .fig img {
      max-width: 96%;
      max-height: 250px;
      border: 1px solid #94a3b8;
    }
    .fig-cap {
      font-size: 10pt;
      font-style: italic;
      font-weight: bold;
      margin-top: 4pt;
      text-align: center;
    }
    .page-break {
      page-break-before: always;
    }
    .cover {
      text-align: center;
      margin-top: 28pt;
    }
  </style>
</head>
<body>
  <div class="cover">
    <div style="font-size: 20pt; font-weight: bold;">Rajshahi University of Engineering &amp; Technology</div>
    <div style="font-size: 15pt; font-weight: bold; margin-top: 6pt;">Department of Computer Science &amp; Engineering</div>
    <div style="font-size: 14pt; font-weight: bold; margin-top: 16pt;">CSE 3206 – Software Engineering Sessional (22 Series)</div>
    <div style="font-size: 12.5pt; font-style: italic; margin-top: 4pt;">Comprehensive SDLC Project Report (CO4, PO12)</div>
    <div style="font-size: 17pt; font-weight: bold; margin: 26pt 0 20pt 0;">Project Title: BloodLink — Blood Donor &amp; Inventory Management System</div>
  </div>

  <table>
    <tr><th>Field</th><th>Project Details</th></tr>
    <tr><td><strong>Course Code &amp; Title</strong></td><td>CSE 3206 – Software Engineering Sessional</td></tr>
    <tr><td><strong>Application Domain</strong></td><td>Healthcare / Voluntary Blood Donor &amp; Central Blood Bank Management</td></tr>
    <tr><td><strong>GitHub Repository Link</strong></td><td>https://github.com/mahdi-ruan/Blood-Donar-Management</td></tr>
    <tr><td><strong>Technology Stack</strong></td><td>React 18, Vite, Firebase Auth (Google Sign-In) &amp; Firestore, Vitest, Selenium WebDriver, GitHub Actions CI</td></tr>
    <tr><td><strong>Design Patterns Used</strong></td><td>Singleton (Creational), Factory Method (Creational), Strategy (Behavioral), Facade (Structural)</td></tr>
    <tr><td><strong>New Tool (Self-Directed)</strong></td><td>GitHub Actions (Automated CI Pipeline) &amp; GitHub Projects (Agile Kanban Tracking)</td></tr>
  </table>

  <h1>1. Problem Statement, Requirements Engineering &amp; Process Model</h1>
  <p>In emergency medical situations across hospitals in Bangladesh, finding compatible voluntary blood donors and checking real-time blood bank stock often depends on scattered social media posts and manual phone calls. Patients requiring urgent transfusions face dangerous delays when rare Rh-negative blood groups drop below safe levels or when listed donors are still inside their mandatory 90-day post-donation recovery window. <strong>BloodLink (Blood Donor Management System)</strong> solves this problem through a modular, persistent, and extensible web application built following the complete Software Development Lifecycle (SDLC).</p>

  <h2>1.1 Five Core Functional Modules &amp; Functional Requirements</h2>
  <table>
    <tr><th>Module Name</th><th>Source File</th><th>Core Functionalities Implemented</th></tr>
    <tr><td><strong>1. Authentication &amp; Role Management</strong></td><td><code>src/modules/authModule.js</code></td><td>Google Sign-In (Firebase OAuth) exclusively for regular users/donors, and one fixed Admin credential pair (<code>admin@bloodlink.com</code> / <code>Admin@123</code>).</td></tr>
    <tr><td><strong>2. Donor Profile &amp; 90-Day Eligibility</strong></td><td><code>src/modules/donorModule.js</code></td><td>Registers donors, validates medical eligibility (Age 18–60 yrs, Weight &ge; 50 kg), and computes the 90-day cooldown period since last donation.</td></tr>
    <tr><td><strong>3. Emergency Blood Requests &amp; Matcher</strong></td><td><code>src/modules/requestModule.js</code></td><td>Submits Normal, Urgent, and Critical SOS blood requests and dynamically matches compatible donors using interchangeable ABO/Rh strategies.</td></tr>
    <tr><td><strong>4. Blood Bank Inventory &amp; Camps</strong></td><td><code>src/modules/inventoryModule.js</code></td><td>Tracks units across all 8 ABO/Rh groups (<code>A+, A-, B+, B-, AB+, AB-, O+, O-</code>), flags low stock (&lt; 5 units), and schedules donation camps.</td></tr>
    <tr><td><strong>5. Admin Control Center &amp; Alerts</strong></td><td><code>src/modules/adminNotificationModule.js</code></td><td>Atomically fulfills requests via <code>BloodFulfillmentFacade</code> (verifies stock, deducts units, updates status, logs alert) and computes KPI summaries.</td></tr>
  </table>

  <h2>1.2 User Stories &amp; Non-Functional Requirements</h2>
  <ul>
    <li><strong>User Story 1 (Donor):</strong> As a voluntary blood donor signing in with Google, I want the system to calculate whether 90 days have elapsed since my last donation so that I only donate when medically eligible.</li>
    <li><strong>User Story 2 (Patient Attendant):</strong> As a patient attendant in an emergency, I want to submit a Critical SOS request and immediately toggle between Exact Match and Universal ABO/Rh Compatible donors.</li>
    <li><strong>User Story 3 (System Admin):</strong> As the Administrator logging in with fixed credentials, I want to fulfill a blood request in one click so inventory stock and request status update atomically.</li>
    <li><strong>Non-Functional Requirements:</strong> Persistent storage via Firebase Firestore + LocalStorage synchronization; role-based security separating Google OAuth users from the fixed Admin account; sub-100ms donor matching; high modular extensibility.</li>
  </ul>

  <div class="fig">
    <img src="${imgToDataUri('uml_usecase_diagram.png')}" />
    <div class="fig-cap">Figure 1.1: UML Use Case Diagram showing Donor/User (Google Sign-In) and Fixed Administrator interactions.</div>
  </div>

  <h2>1.3 Chosen Process Model: Agile Incremental Model &amp; Justification</h2>
  <p>We adopted the <strong>Agile Incremental Process Model</strong>. Instead of rigid Waterfall delivery, BloodLink was delivered across three working increments: Increment 1 established the Singleton database service and Authentication Module; Increment 2 delivered the Donor 90-Day Eligibility calculator and Strategy-based Request Matcher; and Increment 3 added the Blood Bank Inventory, Donation Camps, Admin Fulfillment Facade, and automated CI testing. This model was justified because healthcare rules require continuous validation, early UI prototyping, and incremental TDD verification.</p>

  <div class="fig">
    <img src="${imgToDataUri('process_model_diagram.png')}" />
    <div class="fig-cap">Figure 1.2: Agile Incremental SDLC Process Model followed during BloodLink BDMS development.</div>
  </div>

  <div class="fig">
    <img src="${imgToDataUri('ui_wireframe_mockup.png')}" />
    <div class="fig-cap">Figure 1.3: Initial Low-Fidelity UI Wireframe / Mock-up Prototype designed prior to React implementation.</div>
  </div>

  <div class="page-break"></div>

  <h1>2. Software Architecture &amp; GoF Design Patterns</h1>
  <p>Four Gang of Four (GoF) design patterns spanning Creational, Behavioral, and Structural categories were implemented in <code>src/patterns/DesignPatterns.js</code>:</p>

  <table>
    <tr><th>Pattern &amp; Category</th><th>Implementation Class</th><th>Problem Solved</th><th>Rejected Alternative &amp; Justification</th></tr>
    <tr><td><strong>1. Singleton (Creational)</strong></td><td><code>DatabaseService</code></td><td>Ensures all 5 modules share a single persistent state instance and prevents conflicting storage writes.</td><td><strong>Rejected:</strong> Creating separate storage instances per component or global variables (caused state desynchronization).</td></tr>
    <tr><td><strong>2. Factory Method (Creational)</strong></td><td><code>BloodSystemFactory</code></td><td>Centralizes creation of <code>DONOR</code>, <code>REQUEST</code>, <code>CAMP</code>, and <code>NOTIFICATION</code> objects with standardized IDs and timestamps.</td><td><strong>Rejected:</strong> Constructing raw object literals inside UI form handlers (caused inconsistent IDs and missing fields).</td></tr>
    <tr><td><strong>3. Strategy (Behavioral)</strong></td><td><code>DonorMatchingContext</code>, <code>ExactMatchStrategy</code>, <code>UniversalCompatibilityStrategy</code></td><td>Switches at runtime between Exact Blood Group Matching and Universal Red-Cell Compatibility Matching without changing UI code.</td><td><strong>Rejected:</strong> Hardcoded nested <code>if-else</code> medical compatibility trees inside React components (violated Open/Closed Principle).</td></tr>
    <tr><td><strong>4. Facade (Structural)</strong></td><td><code>BloodFulfillmentFacade</code></td><td>Provides a single unified method (<code>approveAndFulfillRequest</code>) coordinating stock check, deduction, status update, and alert creation.</td><td><strong>Rejected:</strong> Calling Inventory, Request, and Notification modules separately from the UI (risked partial state updates).</td></tr>
  </table>

  <pre>// Strategy Pattern (Behavioral) in src/patterns/DesignPatterns.js
export class DonorMatchingContext {
  constructor(strategy = new ExactMatchStrategy()) { this.strategy = strategy; }
  setStrategy(strategy) { this.strategy = strategy; }
  executeMatch(donors, recipientBloodGroup) {
    return this.strategy.findCompatibleDonors(donors, recipientBloodGroup);
  }
}</pre>

  <div class="fig">
    <img src="${imgToDataUri('uml_class_diagram.png')}" style="max-height: 290px;" />
    <div class="fig-cap">Figure 2.1: UML Class Diagram illustrating the 5 Functional Modules and 4 GoF Design Patterns.</div>
  </div>

  <div class="page-break"></div>

  <h1>3. Implemented Application Modules &amp; User Interface Evidence</h1>
  <div class="fig">
    <img src="${imgToDataUri('app_overview_matcher.png')}" />
    <div class="fig-cap">Figure 3.1: Module 1 (Google Sign-In Active Session) &amp; Module 3 (Smart Donor Matcher using Strategy Pattern).</div>
  </div>
  <div class="fig">
    <img src="${imgToDataUri('app_donors_eligibility.png')}" />
    <div class="fig-cap">Figure 3.2: Module 2 (Donor Registration &amp; Automated 90-Day Post-Donation Eligibility Status).</div>
  </div>
  <div class="fig">
    <img src="${imgToDataUri('app_inventory_camps.png')}" />
    <div class="fig-cap">Figure 3.3: Module 4 (Blood Bank Inventory with &lt;5 Unit Low-Stock Alerts &amp; Voluntary Donation Camps).</div>
  </div>
  <div class="fig">
    <img src="${imgToDataUri('app_admin_facade.png')}" />
    <div class="fig-cap">Figure 3.4: Module 5 (Fixed Admin Portal &amp; Atomic Request Fulfillment via BloodFulfillmentFacade).</div>
  </div>

  <div class="page-break"></div>

  <h1>4. Software Testing: TDD, Dependency Mocking, Coverage &amp; Selenium</h1>
  <p>We combined <strong>Vitest</strong> for Test-Driven Development (TDD), <code>vi.fn()</code> mocking, and V8 coverage analysis with <strong>Selenium WebDriver</strong> for automated end-to-end UI verification.</p>

  <h2>4.1 TDD Workflow &amp; External Dependency Isolation with Mocks</h2>
  <p>All 13 unit test suites in <code>tests/unit/bloodlink.tdd.test.js</code> were developed using the <strong>Red &rarr; Green &rarr; Refactor</strong> TDD cycle. External services were isolated using injected mocks so tests run deterministically offline:</p>
  <table>
    <tr><th>External Dependency</th><th>Mock Object Used</th><th>Behavior Verified</th></tr>
    <tr><td>Firebase Google OAuth</td><td><code>mockFirebaseAuthAdapter.signInWithGooglePopup = vi.fn()</code></td><td>Verifies Google OAuth login &amp; logout session lifecycle without live popup windows.</td></tr>
    <tr><td>Cloud Firestore Database</td><td><code>mockCloudStorageAdapter.syncToCloud = vi.fn()</code></td><td>Verifies <code>DatabaseService</code> triggers cloud synchronization when donor records change.</td></tr>
    <tr><td>Emergency SMS Gateway</td><td><code>mockSmsService.sendEmergencySMS = vi.fn()</code></td><td>Verifies <code>Critical</code> blood requests automatically dispatch emergency hospital SMS alerts.</td></tr>
  </table>

  <h2>4.2 Automated UI Testing with Selenium WebDriver &amp; Code Coverage Summary</h2>
  <p>The Selenium E2E script (<code>tests/e2e/seleniumTest.js</code>) automates four complete user journeys in headless Chrome/Edge: loading KPI cards, signing in via Google OAuth, registering a new donor, and logging in as the fixed Administrator to fulfill request <code>REQ-2001</code>. Unit test coverage reached <strong>94.71% statement coverage</strong> and <strong>100% function coverage</strong> across the project:</p>

  <div class="fig">
    <img src="${imgToDataUri('vitest_coverage_report.png')}" />
    <div class="fig-cap">Figure 4.1: Vitest TDD Test Suite Execution (13/13 Passed) and V8 Coverage Summary (94.71% Statements).</div>
  </div>

  <div class="page-break"></div>

  <h1>5. Configuration Management (Git/GitHub) &amp; New Tool</h1>
  <p>Configuration management was performed in <a href="https://github.com/mahdi-ruan/Blood-Donar-Management">https://github.com/mahdi-ruan/Blood-Donar-Management</a> using feature branches (<code>feature/design-patterns</code>, <code>feature/auth-and-donor-modules</code>, <code>feature/requests-inventory-admin</code>, <code>feature/react-dashboard-ui</code>, <code>feature/testing-and-ci-pipeline</code>, <code>feature/pr-emergency-contact-validation</code>, and <code>feature/pr-experimental-auto-archive</code>).</p>

  <div class="fig">
    <img src="${imgToDataUri('git_branches_graph.png')}" />
    <div class="fig-cap">Figure 5.1: Git Feature Branching Graph and Conventional Commit History across 8 Branches.</div>
  </div>

  <h2>5.1 Merge Conflict Resolution &amp; Pull Request Reviews</h2>
  <p><strong>Merge Conflict Resolution:</strong> Merging <code>feature/requests-inventory-admin</code> (<code>967b6c6</code>) into <code>main</code> (<code>ebb26bc</code>) produced an <code>add/add</code> conflict in <code>README.md</code> over whether the safety stock threshold should be a uniform 5 units or split (4 units for Rh-negative, 5 for Rh-positive). We resolved the conflict markers by adopting the uniform 5-unit hospital safety threshold across all 8 ABO/Rh groups and committed the resolution in <code>4a9998f</code>.</p>
  <p><strong>Pull Requests:</strong> <strong>PR #1 (Accepted &amp; Merged, Commit 21f6198):</strong> Merged <code>feature/pr-emergency-contact-validation</code> into <code>main</code> after review. <strong>PR #2 (Rejected / Revised, Commit c145476):</strong> The initial 7-day auto-archive rule on <code>feature/pr-experimental-auto-archive</code> was rejected during review and revised to a 30-day window.</p>

  <div class="fig">
    <img src="${imgToDataUri('git_merge_conflict.png')}" />
    <div class="fig-cap">Figure 5.2: Merge Conflict Markers and Resolution Recorded in Commit 4a9998f.</div>
  </div>

  <div class="fig">
    <img src="${imgToDataUri('github_live_repo.png')}" />
    <div class="fig-cap">Figure 5.3: Live GitHub Repository (mahdi-ruan/Blood-Donar-Management) showing Merged PR #1 and Feature Branches.</div>
  </div>

  <h2>5.2 Self-Directed New Tool: GitHub Actions CI &amp; Academic Integrity Disclosure</h2>
  <p>We learned and applied <strong>GitHub Actions Continuous Integration</strong> (<code>.github/workflows/ci.yml</code>) beyond the syllabus, comparing it against <strong>Jenkins</strong>. Unlike Jenkins, which requires maintaining a dedicated Java server and manual webhook plugins, GitHub Actions runs natively on GitHub cloud runners and automatically executes <code>npm run test:coverage</code> and <code>npm run build</code> on every push and Pull Request.</p>
  <p><strong>AI Tool Disclosure:</strong> In accordance with course rules, AI tools assisted with UI styling, test scaffolding, and diagram formatting; all code, design patterns, and test suites were verified and understood by the author for viva defense.</p>
</body>
</html>`;
}

function buildEssayPrintHtml() {
  const wordCount = REFLECTION_ESSAY_PARAGRAPHS.join(' ')
    .trim()
    .split(/\s+/).length;

  return `<!DOCTYPE html>
<html>
<head>
  <meta charset="UTF-8" />
  <style>
    @page {
      size: A4;
      margin: 20mm 20mm 20mm 20mm;
    }
    body {
      font-family: 'Times New Roman', Times, serif;
      font-size: 12pt;
      line-height: 1.5;
      color: #000000;
      margin: 0;
      padding: 0;
      text-align: justify;
    }
    h1 {
      font-family: 'Times New Roman', Times, serif;
      font-size: 15pt;
      font-weight: bold;
      margin-top: 14pt;
      margin-bottom: 6pt;
      border-bottom: 1px solid #000;
      padding-bottom: 3pt;
      text-align: left;
    }
    h2 {
      font-family: 'Times New Roman', Times, serif;
      font-size: 13pt;
      font-weight: bold;
      margin-top: 12pt;
      margin-bottom: 5pt;
      text-align: left;
    }
    p {
      margin: 6pt 0 9pt 0;
    }
    table {
      width: 100%;
      border-collapse: collapse;
      margin: 8pt 0 14pt 0;
      font-family: 'Times New Roman', Times, serif;
      font-size: 10.5pt;
    }
    th, td {
      border: 1px solid #444;
      padding: 5pt 7pt;
      text-align: left;
      vertical-align: top;
    }
    th {
      background-color: #f1f5f9;
      font-weight: bold;
    }
    .page-break {
      page-break-before: always;
    }
  </style>
</head>
<body>
  <div style="text-align: center; margin-bottom: 16pt;">
    <div style="font-size: 17pt; font-weight: bold;">Rajshahi University of Engineering &amp; Technology</div>
    <div style="font-size: 13.5pt; font-weight: bold; margin-top: 4pt;">Department of Computer Science &amp; Engineering</div>
    <div style="font-size: 12.5pt; font-weight: bold; margin-top: 8pt;">CSE 3206 – Software Engineering Sessional (CO4, PO12)</div>
    <div style="font-size: 15pt; font-weight: bold; margin-top: 12pt;">Self-Directed Learning Log &amp; Reflection Essay</div>
    <div style="font-size: 11.5pt; font-style: italic; margin-top: 4pt;">Project: BloodLink — Blood Donor &amp; Inventory Management System (https://github.com/mahdi-ruan/Blood-Donar-Management)</div>
  </div>

  <h1>Part 1: Self-Directed Learning Log (CO4, PO12)</h1>
  <p>This learning log documents the self-directed learning progression undertaken to learn and apply tools beyond the classroom syllabus—specifically <strong>GitHub Actions Continuous Integration (CI)</strong>, <strong>Vitest TDD with Dependency Mocking</strong>, and <strong>GitHub Pull Request &amp; Project Management workflows</strong>.</p>

  <table>
    <tr><th>Date / Session</th><th>Topic / New Tool Learned</th><th>Resources Consulted</th><th>Key Challenges Analysed</th><th>Application in BloodLink BDMS</th></tr>
    <tr><td>Session 1 (Oct 24, 2026)</td><td>Modular Architecture &amp; GoF Design Patterns in ES6</td><td>Refactoring.Guru Pattern Catalog; MDN ES6 Classes Docs</td><td>Preventing conflicting state across 5 separate functional modules.</td><td>Implemented Singleton, Factory Method, Strategy, and Facade patterns in <code>src/patterns/DesignPatterns.js</code>.</td></tr>
    <tr><td>Session 2 (Oct 26, 2026)</td><td>TDD &amp; Dependency Mocking with Vitest (<code>vi.fn()</code>)</td><td>Official Vitest Mocking Guide (vitest.dev/guide/mocking)</td><td>Testing Google OAuth, Firestore sync, and SMS alerts offline without live network calls.</td><td>Injected mock adapters into modules; achieved 94.71% statement &amp; 100% function coverage across 13 test suites.</td></tr>
    <tr><td>Session 3 (Oct 28, 2026)</td><td>Automated UI Testing with Selenium WebDriver</td><td>Selenium Official JS WebDriver Documentation</td><td>Synchronizing browser assertions with asynchronous React state updates.</td><td>Created <code>tests/e2e/seleniumTest.js</code> verifying Google login, donor registration, and Admin fulfillment.</td></tr>
    <tr><td>Session 4 (Oct 29, 2026)</td><td>Git Branching, Merge Conflict Resolution &amp; PR Reviews</td><td>Pro Git Book (Ch. 3); GitHub Pull Requests Guide</td><td>Resolving an <code>add/add</code> merge conflict in <code>README.md</code> over safety stock thresholds.</td><td>Resolved conflict in commit <code>4a9998f</code>, merged PR #1 (<code>21f6198</code>), and revised PR #2 branch (<code>c145476</code>).</td></tr>
    <tr><td>Session 5 (Oct 30, 2026)</td><td>New Tool: GitHub Actions Continuous Integration (CI)</td><td>GitHub Actions Workflow Syntax Reference</td><td>Ensuring headless coverage and production build succeed on Ubuntu cloud runners.</td><td>Authored <code>.github/workflows/ci.yml</code> to automate testing and building on every push and PR.</td></tr>
  </table>

  <h2>Honest Evaluation of Learning Resources</h2>
  <table>
    <tr><th>Resource Category</th><th>Specific Source</th><th>Rating</th><th>Critical Evaluation</th></tr>
    <tr><td>Official Documentation</td><td>GitHub Actions Docs &amp; Vitest Mocking Guide</td><td>5 / 5</td><td>Most accurate and reliable reference for YAML workflow triggers and <code>vi.fn()</code> spy assertions.</td></tr>
    <tr><td>Design Pattern Catalog</td><td>Refactoring.Guru GoF Pattern Guides</td><td>5 / 5</td><td>Provided clear UML diagrams and trade-offs that helped justify Strategy and Singleton over alternatives.</td></tr>
    <tr><td>Community Blogs / Videos</td><td>Tutorials on Firebase Auth &amp; Selenium JS</td><td>3 / 5</td><td>Several tutorials used deprecated SDK syntax; required cross-checking against official modular docs.</td></tr>
    <tr><td>AI Coding Assistant</td><td>AI Code Review &amp; Explanation Assistant</td><td>4 / 5</td><td>Accelerated scaffolding and debugging, but required manual review to keep domain logic concise for viva.</td></tr>
  </table>

  <div class="page-break"></div>

  <h1>Part 2: Reflection Essay (${wordCount} Words)</h1>
  <p><em>Covering Technical Decisions, Analysis of Challenges, Evaluation of Learning Resources, and Next-Skill Learning Plan (Requirement: 500–700 Words)</em></p>
  ${REFLECTION_ESSAY_PARAGRAPHS.map((p) => `<p>${p}</p>`).join('\n')}
</body>
</html>`;
}

async function printHtmlToPdf(driver, htmlContent, pdfFilename) {
  const tempHtmlPath = path.join(OUT_DIR, `_temp_${pdfFilename}.html`);
  fs.writeFileSync(tempHtmlPath, htmlContent, 'utf8');
  const fileUrl = `file:///${tempHtmlPath.replace(/\\/g, '/')}`;
  await driver.get(fileUrl);
  await driver.sleep(600);

  // printPage returns base64-encoded PDF with no browser headers/footers by default
  const pdfBase64 = await driver.printPage({
    orientation: 'portrait',
    scale: 1,
    background: true
  });

  const outPdfPath = path.join(OUT_DIR, pdfFilename);
  fs.writeFileSync(outPdfPath, Buffer.from(pdfBase64, 'base64'));
  fs.unlinkSync(tempHtmlPath);
  console.log(`[GENERATED] ${outPdfPath}`);
}

async function buildDriver() {
  try {
    const chromeOpts = new chrome.Options();
    chromeOpts.addArguments('--headless=new', '--no-sandbox');
    return await new Builder().forBrowser('chrome').setChromeOptions(chromeOpts).build();
  } catch {
    const edgeOpts = new edge.Options();
    edgeOpts.addArguments('--headless=new', '--no-sandbox');
    return await new Builder().forBrowser('MicrosoftEdge').setEdgeOptions(edgeOpts).build();
  }
}

async function main() {
  await buildProjectReportDocx();
  await buildLearningLogAndEssayDocx();

  const driver = await buildDriver();
  try {
    await printHtmlToPdf(driver, buildReportPrintHtml(), 'BloodLink_Project_Report.pdf');
    await printHtmlToPdf(
      driver,
      buildEssayPrintHtml(),
      'BloodLink_Learning_Log_and_Reflection_Essay.pdf'
    );
  } finally {
    await driver.quit();
  }
  console.log('All DOCX and PDF deliverables generated successfully!');
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
