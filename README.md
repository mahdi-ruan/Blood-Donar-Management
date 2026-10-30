# BloodLink — Blood Donor Management System (BDMS)

**Course:** CSE 3206 – Software Engineering Sessional  
**Department:** Computer Science & Engineering, Rajshahi University of Engineering & Technology (RUET)

---

## 1. Project Overview
**BloodLink BDMS** is a modular, extensible web application developed following the **Agile Incremental Software Development Lifecycle (SDLC)**. It connects voluntary blood donors, hospital patients requiring urgent transfusions, and blood bank administrators on a unified platform with persistent storage.

---

## 2. Five Core Functional Modules
1. **Authentication & Role Management (`src/modules/authModule.js`)**
   - **Regular Users / Donors:** Sign in exclusively via **Google OAuth (Firebase Authentication)**.
   - **System Administrator:** Protected by a single fixed administrator credential pair (`admin@bloodlink.com` / `Admin@123`).
2. **Donor Registration & Medical Eligibility (`src/modules/donorModule.js`)**
   - Registers voluntary donors and automatically computes **90-day post-donation cooldown eligibility**, age range (`18–60 years`), and minimum weight (`>= 50 kg`).
3. **Emergency Blood Requests & Smart Donor Matching (`src/modules/requestModule.js`)**
   - Creates normal, urgent, and critical SOS blood requests and matches compatible donors dynamically using interchangeable matching strategies.
4. **Central Blood Bank Inventory & Donation Camps (`src/modules/inventoryModule.js`)**
   - Tracks blood bag units across all 8 ABO/Rh blood groups (`A+`, `A-`, `B+`, `B-`, `AB+`, `AB-`, `O+`, `O-`), flags low-stock alerts (`< 5 units` safety threshold across all groups), and manages voluntary blood donation camps.
5. **Admin Control Center & Notification System (`src/modules/adminNotificationModule.js`)**
   - Atomic request fulfillment (verifies stock, deducts blood units, updates status to `Fulfilled`, and logs audit notifications) and live KPI analytics.

---

## 3. Software Design Patterns Implemented
Located in `src/patterns/DesignPatterns.js`:
- **Singleton Pattern (Creational) — `DatabaseService`:** Guarantees a single shared database connection and state synchronizer across all 5 modules.
- **Factory Method Pattern (Creational) — `BloodSystemFactory`:** Centralizes creation of standardized `DONOR`, `REQUEST`, `CAMP`, and `NOTIFICATION` domain objects.
- **Strategy Pattern (Behavioral) — `DonorMatchingContext`:** Switches dynamically at runtime between `ExactMatchStrategy` and `UniversalCompatibilityStrategy` (ABO/Rh red-blood-cell compatibility table).
- **Facade Pattern (Structural) — `BloodFulfillmentFacade`:** Coordinates Inventory deduction, Request status update, and Notification creation behind a single `approveAndFulfillRequest()` call.

---

## 4. Software Testing (TDD, Mocks, Coverage & Selenium)
- **Unit Testing & TDD (`tests/unit/bloodlink.tdd.test.js`):** 13 unit test suites written with **Vitest** covering all 5 modules and 4 design patterns (**94.71% statement coverage**, **100% function coverage**).
- **External Dependency Mocking (`vi.fn()`):** Isolates Firebase Google Auth, Cloud Firestore synchronization, and external Emergency SMS gateways.
- **Automated UI / E2E Testing (`tests/e2e/seleniumTest.js`):** Automated **Selenium WebDriver** script testing Google Sign-In, Donor Registration, and Admin Request Fulfillment.

---

## 5. Quick Start Commands
```bash
# 1. Install dependencies
npm install

# 2. Start development server
npm run dev

# 3. Run TDD Unit Tests with V8 Coverage Summary
npm run test:coverage

# 4. Run Selenium WebDriver E2E UI Tests (while dev server is running)
npm run test:e2e

# 5. Build for production
npm run build
```

---

## 6. AI Usage & Academic Integrity Disclosure
In accordance with course guidelines, AI-assisted coding and documentation tools were used during development to assist with boilerplate scaffolding, test case generation, and Mermaid diagram formatting. All architectural decisions, design pattern selections, medical eligibility rules, and testing strategies were reviewed, verified, and understood by the author for live demonstration and viva defense.

<!-- PR #2: Experimental 7-day auto-archive draft (requires revision to 30 days) -->
