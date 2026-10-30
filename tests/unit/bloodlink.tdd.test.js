import { describe, it, expect, beforeEach, vi } from 'vitest';
import {
  DatabaseService,
  BloodSystemFactory,
  ExactMatchStrategy,
  UniversalCompatibilityStrategy,
  DonorMatchingContext,
  BloodFulfillmentFacade
} from '../../src/patterns/DesignPatterns.js';
import { AuthModule, ADMIN_CREDENTIALS } from '../../src/modules/authModule.js';
import { DonorModule } from '../../src/modules/donorModule.js';
import { RequestModule } from '../../src/modules/requestModule.js';
import { InventoryModule } from '../../src/modules/inventoryModule.js';
import { AdminNotificationModule } from '../../src/modules/adminNotificationModule.js';
import { firebaseAdapter, isLiveFirebaseConfigured } from '../../src/services/firebaseConfig.js';

describe('BloodLink BDMS — TDD Unit Test Suite & Mock Verification', () => {
  beforeEach(() => {
    if (typeof window !== 'undefined' && window.localStorage) {
      window.localStorage.clear();
    }
    DatabaseService.resetInstanceForTesting();
  });

  // ==========================================================================
  // PART 1: DESIGN PATTERNS TESTS (Singleton, Factory, Strategy, Facade)
  // ==========================================================================
  describe('1. Design Patterns Verification', () => {
    it('Singleton Pattern: DatabaseService always returns the exact same instance and supports reset', async () => {
      const db1 = DatabaseService.getInstance();
      const db2 = DatabaseService.getInstance();
      const db3 = new DatabaseService();
      expect(db1).toBe(db2);
      expect(db2).toBe(db3);

      const resetState = await db1.resetToDefaults();
      expect(resetState.donors.length).toBeGreaterThanOrEqual(5);
    });

    it('Factory Pattern: BloodSystemFactory creates standardized Donor, Request, Camp & Notification objects', () => {
      const donor = BloodSystemFactory.createEntity('DONOR', {
        name: 'Arif Hossain',
        bloodGroup: 'B+',
        phone: '01711-000000'
      });
      expect(donor.id).toMatch(/^DNR-\d{4}$/);
      expect(donor.available).toBe(true);

      const req = BloodSystemFactory.createEntity('REQUEST', {
        patientName: 'Mina Begum',
        bloodGroup: 'O-',
        hospital: 'RMCH',
        unitsRequired: 2
      });
      expect(req.id).toMatch(/^REQ-\d{4}$/);
      expect(req.status).toBe('Pending');

      const camp = BloodSystemFactory.createEntity('CAMP', {
        title: 'RUET Blood Camp',
        location: 'Auditorium',
        date: '2026-12-01'
      });
      expect(camp.id).toMatch(/^CMP-\d{4}$/);

      const note = BloodSystemFactory.createEntity('NOTIFICATION', {
        type: 'INFO',
        message: 'Unit test alert'
      });
      expect(note.id).toMatch(/^NTF-\d{4}$/);

      expect(() => BloodSystemFactory.createEntity('DONOR', {})).toThrow();
      expect(() => BloodSystemFactory.createEntity('REQUEST', {})).toThrow();
      expect(() => BloodSystemFactory.createEntity('CAMP', {})).toThrow();
      expect(() => BloodSystemFactory.createEntity('INVALID', {})).toThrow();
    });

    it('Strategy Pattern: switches dynamically between ExactMatchStrategy and UniversalCompatibilityStrategy', () => {
      const sampleDonors = [
        { id: '1', name: 'Donor O-', bloodGroup: 'O-', available: true },
        { id: '2', name: 'Donor A+', bloodGroup: 'A+', available: true },
        { id: '3', name: 'Donor B+', bloodGroup: 'B+', available: true }
      ];

      const matcher = new DonorMatchingContext(new ExactMatchStrategy());
      const exactForAPlus = matcher.executeMatch(sampleDonors, 'A+');
      expect(exactForAPlus).toHaveLength(1);
      expect(exactForAPlus[0].bloodGroup).toBe('A+');

      // Switch at runtime to UniversalCompatibilityStrategy (O- can donate to A+)
      matcher.setStrategy(new UniversalCompatibilityStrategy());
      const universalForAPlus = matcher.executeMatch(sampleDonors, 'A+');
      expect(universalForAPlus).toHaveLength(2);
      expect(universalForAPlus.map((d) => d.bloodGroup)).toEqual(['O-', 'A+']);
    });

    it('Facade Pattern: BloodFulfillmentFacade atomically deducts stock, updates request, and logs notification', async () => {
      const db = DatabaseService.getInstance();
      const facade = new BloodFulfillmentFacade(db);

      const initialOPlusStock = db.getCollection('inventory')['O+'];
      const result = await facade.approveAndFulfillRequest('REQ-2001'); // Needs 2 units of O+

      expect(result.fulfilledRequest.status).toBe('Fulfilled');
      expect(result.remainingStock).toBe(initialOPlusStock - 2);
      expect(result.notification.type).toBe('FULFILLED');

      await expect(facade.approveAndFulfillRequest('REQ-9999')).rejects.toThrow(
        'Request REQ-9999 not found'
      );
    });
  });

  // ==========================================================================
  // PART 2: MOCKING EXTERNAL DEPENDENCIES (Firebase Auth, Cloud DB, SMS Gateway)
  // ==========================================================================
  describe('2. External Dependency Isolation with Mocks (vi.fn)', () => {
    it('Mocks Firebase Google OAuth Provider for user login & logout', async () => {
      const mockFirebaseAuthAdapter = {
        signInWithGooglePopup: vi.fn().mockResolvedValue({
          uid: 'mock-google-123',
          name: 'Mock Google Donor',
          email: 'mockdonor@gmail.com',
          photoURL: 'https://example.com/avatar.png'
        }),
        signOutUser: vi.fn().mockResolvedValue(true)
      };

      const authMod = new AuthModule(mockFirebaseAuthAdapter);
      const user = await authMod.loginWithGoogle();

      expect(mockFirebaseAuthAdapter.signInWithGooglePopup).toHaveBeenCalledTimes(1);
      expect(user.email).toBe('mockdonor@gmail.com');
      expect(user.role).toBe('user');
      expect(authMod.getCurrentUser().email).toBe('mockdonor@gmail.com');

      await authMod.logout();
      expect(mockFirebaseAuthAdapter.signOutUser).toHaveBeenCalledTimes(1);
      expect(authMod.getCurrentUser()).toBeNull();
    });

    it('Mocks Cloud Firestore Adapter when persisting donor registrations', async () => {
      const mockCloudStorageAdapter = {
        syncToCloud: vi.fn().mockResolvedValue(true)
      };
      const db = DatabaseService.getInstance(mockCloudStorageAdapter);
      const donorMod = new DonorModule(db);

      await donorMod.registerDonor({
        name: 'Cloud Synced Donor',
        bloodGroup: 'AB+',
        phone: '01700-112233',
        age: 25,
        weight: 65
      });

      expect(mockCloudStorageAdapter.syncToCloud).toHaveBeenCalledTimes(1);
    });

    it('Mocks External SMS Gateway when a Critical SOS Blood Request is created', async () => {
      const mockSmsService = {
        sendEmergencySMS: vi.fn().mockResolvedValue({ delivered: true })
      };
      const db = DatabaseService.getInstance();
      const reqMod = new RequestModule(db, mockSmsService);

      const criticalReq = await reqMod.createBloodRequest({
        patientName: 'Emergency Patient',
        bloodGroup: 'O-',
        unitsRequired: 3,
        hospital: 'RMCH ICU',
        urgency: 'Critical',
        contactPhone: '01800-999888'
      });

      expect(mockSmsService.sendEmergencySMS).toHaveBeenCalledTimes(1);
      expect(mockSmsService.sendEmergencySMS).toHaveBeenCalledWith(
        expect.objectContaining({
          id: criticalReq.id,
          bloodGroup: 'O-',
          urgency: 'Critical'
        })
      );
    });

    it('Verifies Firebase Adapter fallback methods in offline/demo environment', async () => {
      expect(isLiveFirebaseConfigured()).toBe(false);
      const profile = await firebaseAdapter.signInWithGooglePopup();
      expect(profile.provider).toBe('google.com');
      expect(await firebaseAdapter.signOutUser()).toBe(true);
      expect(await firebaseAdapter.syncToCloud({})).toBe(false);
      expect(await firebaseAdapter.fetchFromCloud()).toBeNull();
    });
  });

  // ==========================================================================
  // PART 3: TDD UNIT TESTS ACROSS ALL 5 FUNCTIONAL MODULES
  // ==========================================================================
  describe('3. Functional Modules Unit Tests (TDD)', () => {
    it('Module 1 (Auth): allows only the single fixed Admin email & password and rejects invalid credentials', () => {
      const authMod = new AuthModule();
      const adminSession = authMod.loginAsAdmin(
        ADMIN_CREDENTIALS.email,
        ADMIN_CREDENTIALS.password
      );
      expect(adminSession.role).toBe('admin');

      expect(() => authMod.loginAsAdmin('', '')).toThrow(
        'Admin email and password are required'
      );
      expect(() =>
        authMod.loginAsAdmin('wrong@bloodlink.com', 'WrongPass')
      ).toThrow('Invalid Admin credentials');
    });

    it('Module 2 (Donor & 90-Day Eligibility): validates 90-day cooldown, age (18-60), weight (>= 50kg), and toggles availability', async () => {
      const eligibleCheck = DonorModule.checkMedicalEligibility(
        { age: 23, weight: 64, lastDonationDate: '2026-05-01' },
        '2026-10-30'
      );
      expect(eligibleCheck.isEligible).toBe(true);
      expect(eligibleCheck.daysRemaining).toBe(0);

      const cooldownCheck = DonorModule.checkMedicalEligibility(
        { age: 16, weight: 45, lastDonationDate: '2026-10-10' },
        '2026-10-30'
      );
      expect(cooldownCheck.isEligible).toBe(false);
      expect(cooldownCheck.daysRemaining).toBe(70);
      expect(cooldownCheck.reasons).toHaveLength(3);

      const donorMod = new DonorModule();
      await expect(
        donorMod.registerDonor({
          name: 'Underage User',
          bloodGroup: 'A+',
          phone: '01711-000111',
          age: 16,
          weight: 60
        })
      ).rejects.toThrow('Donor age must be between 18 and 60 years');

      await expect(
        donorMod.registerDonor({
          name: 'Underweight User',
          bloodGroup: 'A+',
          phone: '01711-000111',
          age: 22,
          weight: 44
        })
      ).rejects.toThrow('Donor weight must be at least 50 kg');

      const toggled = await donorMod.toggleDonorAvailability('DNR-1001');
      expect(toggled.available).toBe(false);
    });

    it('Module 3 (Requests): filters compatible donors in both exact and universal modes', () => {
      const reqMod = new RequestModule();
      const exactMatches = reqMod.findMatchingDonors('AB+', 'exact');
      const universalMatches = reqMod.findMatchingDonors('AB+', 'universal');

      expect(universalMatches.length).toBeGreaterThan(exactMatches.length);
    });

    it('Module 4 (Inventory & Camps): updates stock, detects low stock (< 5 units), and prevents negative or invalid stock', async () => {
      const invMod = new InventoryModule();
      const lowGroups = invMod.getLowStockGroups();
      expect(lowGroups.some((g) => g.bloodGroup === 'AB-')).toBe(true);

      await invMod.adjustStock('AB-', 4);
      expect(invMod.getInventory()['AB-']).toBe(6);

      await expect(invMod.adjustStock('INVALID', 1)).rejects.toThrow(
        'Invalid blood group'
      );
      await expect(invMod.adjustStock('AB-', -99)).rejects.toThrow(
        'Cannot reduce AB- stock below 0'
      );

      const newCamp = await invMod.createCamp({
        title: 'Test Campus Camp',
        location: 'Rajshahi College',
        date: '2026-12-12'
      });
      const updatedCamp = await invMod.registerDonorForCamp(newCamp.id);
      expect(updatedCamp.registeredDonors).toBe(1);
    });

    it('Module 5 (Admin & Notifications): fulfills requests, updates status, computes KPI summary, and marks alerts read', async () => {
      const adminMod = new AdminNotificationModule();
      const fulfilled = await adminMod.fulfillBloodRequest('REQ-2002');
      expect(fulfilled.fulfilledRequest.status).toBe('Fulfilled');

      const updatedReq = await adminMod.updateRequestStatus('REQ-2001', 'Rejected');
      expect(updatedReq.status).toBe('Rejected');

      await expect(
        adminMod.updateRequestStatus('REQ-2001', 'UNKNOWN')
      ).rejects.toThrow('Invalid status');

      const summary = adminMod.getSystemSummary();
      expect(summary.totalDonors).toBeGreaterThanOrEqual(5);
      expect(summary.totalBloodUnits).toBeGreaterThan(0);

      const readAlerts = await adminMod.markAllNotificationsRead();
      expect(readAlerts.every((n) => n.read === true)).toBe(true);
    });
  });
});
