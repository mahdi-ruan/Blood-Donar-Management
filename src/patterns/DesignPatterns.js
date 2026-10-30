/**
 * ============================================================================
 * DESIGN PATTERNS IMPLEMENTATION (CSE 3206 - Software Engineering Sessional)
 * ============================================================================
 * Includes three core GoF Design Patterns from two distinct categories:
 *   1. Singleton Pattern (Creational)  - DatabaseService
 *   2. Factory Pattern   (Creational)  - BloodSystemFactory
 *   3. Strategy Pattern  (Behavioral)  - DonorMatchingContext & Strategies
 *   4. Facade Pattern    (Structural)  - BloodRequestFulfillmentFacade
 */

// ============================================================================
// 1. SINGLETON PATTERN (Category: Creational)
// Problem Solved: Prevents multiple conflicting database/storage connections
// and ensures a single shared persistent data state across all 5 modules.
// Rejected Alternative: Passing global variables or creating new storage
// instances inside every React component (causes state desynchronization).
// ============================================================================
export class DatabaseService {
  static #instance = null;

  constructor(externalStorageAdapter = null) {
    if (DatabaseService.#instance) {
      return DatabaseService.#instance;
    }
    this.storageKey = 'bloodlink_persistent_db_v1';
    this.externalAdapter = externalStorageAdapter;
    this.state = this.#loadInitialState();
    DatabaseService.#instance = this;
  }

  static getInstance(externalStorageAdapter = null) {
    if (!DatabaseService.#instance) {
      DatabaseService.#instance = new DatabaseService(externalStorageAdapter);
    } else if (externalStorageAdapter) {
      DatabaseService.#instance.externalAdapter = externalStorageAdapter;
    }
    return DatabaseService.#instance;
  }

  static resetInstanceForTesting() {
    DatabaseService.#instance = null;
  }

  #getDefaultSeedData() {
    return {
      donors: [
        {
          id: 'DNR-1001',
          name: 'Tanvir Ahmed',
          email: 'tanvir.cse@ruet.ac.bd',
          bloodGroup: 'O+',
          phone: '01711-223344',
          location: 'Rajshahi Medical Area',
          age: 23,
          weight: 68,
          lastDonationDate: '2026-05-10',
          totalDonations: 4,
          available: true
        },
        {
          id: 'DNR-1002',
          name: 'Nusrat Jahan',
          email: 'nusrat.jahan@gmail.com',
          bloodGroup: 'O-',
          phone: '01819-556677',
          location: 'Kazla, Rajshahi',
          age: 22,
          weight: 56,
          lastDonationDate: '2026-04-01',
          totalDonations: 3,
          available: true
        },
        {
          id: 'DNR-1003',
          name: 'Sabbir Hossain',
          email: 'sabbir.h@gmail.com',
          bloodGroup: 'A+',
          phone: '01912-889900',
          location: 'Shaheb Bazar, Rajshahi',
          age: 26,
          weight: 72,
          lastDonationDate: '2026-09-25',
          totalDonations: 6,
          available: true
        },
        {
          id: 'DNR-1004',
          name: 'Farhana Yasmin',
          email: 'farhana.y@gmail.com',
          bloodGroup: 'B+',
          phone: '01611-334455',
          location: 'Upashahar, Rajshahi',
          age: 24,
          weight: 58,
          lastDonationDate: '2026-03-15',
          totalDonations: 2,
          available: true
        },
        {
          id: 'DNR-1005',
          name: 'Mahmudul Hasan',
          email: 'mahmud.hasan@gmail.com',
          bloodGroup: 'AB+',
          phone: '01521-443322',
          location: 'Talaimari, Rajshahi',
          age: 25,
          weight: 70,
          lastDonationDate: '2026-02-20',
          totalDonations: 5,
          available: true
        }
      ],
      requests: [
        {
          id: 'REQ-2001',
          patientName: 'Rafiqul Islam',
          bloodGroup: 'O+',
          unitsRequired: 2,
          hospital: 'Rajshahi Medical College Hospital (RMCH)',
          urgency: 'Critical',
          contactPhone: '01755-112233',
          requestedBy: 'family.rafiq@gmail.com',
          status: 'Pending',
          createdAt: '2026-10-29'
        },
        {
          id: 'REQ-2002',
          patientName: 'Sumaiya Akter',
          bloodGroup: 'A+',
          unitsRequired: 1,
          hospital: 'Islami Bank Medical College Hospital',
          urgency: 'Normal',
          contactPhone: '01833-998877',
          requestedBy: 'sumaiya.care@gmail.com',
          status: 'Approved',
          createdAt: '2026-10-28'
        },
        {
          id: 'REQ-2003',
          patientName: 'Kamrul Hasan',
          bloodGroup: 'B+',
          unitsRequired: 2,
          hospital: 'CDM Hospital, Rajshahi',
          urgency: 'Urgent',
          contactPhone: '01944-667788',
          requestedBy: 'kamrul.family@gmail.com',
          status: 'Fulfilled',
          createdAt: '2026-10-25'
        }
      ],
      inventory: {
        'A+': 14,
        'A-': 4,
        'B+': 18,
        'B-': 3,
        'AB+': 9,
        'AB-': 2,
        'O+': 22,
        'O-': 5
      },
      camps: [
        {
          id: 'CMP-3001',
          title: 'RUET Annual Voluntary Blood Donation Drive',
          organizer: 'Badhan RUET Zone',
          location: 'RUET Central Auditorium',
          date: '2026-11-15',
          targetUnits: 150,
          registeredDonors: 64
        },
        {
          id: 'CMP-3002',
          title: 'Rajshahi City Red Crescent Youth Camp',
          organizer: 'Bangladesh Red Crescent Society',
          location: 'Shaheb Bazar Zero Point',
          date: '2026-11-28',
          targetUnits: 100,
          registeredDonors: 41
        }
      ],
      notifications: [
        {
          id: 'NTF-4001',
          type: 'CRITICAL_SOS',
          message: 'Critical request for 2 units of O+ blood at RMCH for patient Rafiqul Islam.',
          timestamp: '2026-10-29 14:30',
          read: false
        },
        {
          id: 'NTF-4002',
          type: 'LOW_STOCK',
          message: 'Low inventory alert: AB- (2 units) and B- (3 units) are below minimum safe threshold (5 units).',
          timestamp: '2026-10-29 09:15',
          read: false
        }
      ]
    };
  }

  #loadInitialState() {
    try {
      if (typeof window !== 'undefined' && window.localStorage) {
        const raw = window.localStorage.getItem(this.storageKey);
        if (raw) {
          return JSON.parse(raw);
        }
      }
    } catch {
      // Fallback to default seed data if localStorage is restricted
    }
    return this.#getDefaultSeedData();
  }

  async saveState(newState) {
    this.state = newState;
    try {
      if (typeof window !== 'undefined' && window.localStorage) {
        window.localStorage.setItem(this.storageKey, JSON.stringify(this.state));
      }
    } catch {
      // Ignore localStorage quota errors in test environments
    }
    if (this.externalAdapter && typeof this.externalAdapter.syncToCloud === 'function') {
      await this.externalAdapter.syncToCloud(this.state);
    }
    return this.state;
  }

  getCollection(collectionName) {
    return this.state[collectionName];
  }

  async updateCollection(collectionName, data) {
    const updated = {
      ...this.state,
      [collectionName]: data
    };
    await this.saveState(updated);
    return updated[collectionName];
  }

  async resetToDefaults() {
    const seed = this.#getDefaultSeedData();
    await this.saveState(seed);
    return seed;
  }
}

// ============================================================================
// 2. FACTORY METHOD PATTERN (Category: Creational)
// Problem Solved: Centralizes object creation for Donors, Blood Requests,
// Donation Camps, and System Notifications with consistent IDs & default fields.
// Rejected Alternative: Constructing raw object literals manually inside each
// form handler, which caused inconsistent ID formats and missing timestamps.
// ============================================================================
export class BloodSystemFactory {
  static createEntity(entityType, payload) {
    const randomSuffix = Math.floor(1000 + Math.random() * 9000);
    const today = new Date().toISOString().split('T')[0];

    switch (entityType) {
      case 'DONOR':
        if (!payload.name || !payload.bloodGroup || !payload.phone) {
          throw new Error('Donor requires name, bloodGroup, and phone');
        }
        return {
          id: payload.id || `DNR-${randomSuffix}`,
          name: payload.name.trim(),
          email: payload.email || 'donor@bloodlink.org',
          bloodGroup: payload.bloodGroup,
          phone: payload.phone.trim(),
          location: payload.location || 'Rajshahi',
          age: Number(payload.age) || 22,
          weight: Number(payload.weight) || 60,
          lastDonationDate: payload.lastDonationDate || '2026-01-01',
          totalDonations: Number(payload.totalDonations ?? 1),
          available: payload.available !== undefined ? Boolean(payload.available) : true
        };

      case 'REQUEST':
        if (!payload.patientName || !payload.bloodGroup || !payload.hospital) {
          throw new Error('Blood Request requires patientName, bloodGroup, and hospital');
        }
        return {
          id: payload.id || `REQ-${randomSuffix}`,
          patientName: payload.patientName.trim(),
          bloodGroup: payload.bloodGroup,
          unitsRequired: Math.max(1, Number(payload.unitsRequired) || 1),
          hospital: payload.hospital.trim(),
          urgency: payload.urgency || 'Normal',
          contactPhone: payload.contactPhone || 'N/A',
          requestedBy: payload.requestedBy || 'guest@bloodlink.org',
          status: payload.status || 'Pending',
          createdAt: payload.createdAt || today
        };

      case 'CAMP':
        if (!payload.title || !payload.location || !payload.date) {
          throw new Error('Donation Camp requires title, location, and date');
        }
        return {
          id: payload.id || `CMP-${randomSuffix}`,
          title: payload.title.trim(),
          organizer: payload.organizer || 'BloodLink Community',
          location: payload.location.trim(),
          date: payload.date,
          targetUnits: Number(payload.targetUnits) || 100,
          registeredDonors: Number(payload.registeredDonors) || 0
        };

      case 'NOTIFICATION':
        return {
          id: payload.id || `NTF-${randomSuffix}`,
          type: payload.type || 'INFO',
          message: payload.message || 'System update recorded.',
          timestamp: payload.timestamp || new Date().toISOString().slice(0, 16).replace('T', ' '),
          read: false
        };

      default:
        throw new Error(`Unsupported entity type: ${entityType}`);
    }
  }
}

// ============================================================================
// 3. STRATEGY PATTERN (Category: Behavioral)
// Problem Solved: Allows switching between different blood donor matching
// algorithms (Exact Blood Group Match vs. Universal Medical Compatibility Match)
// at runtime without modifying the client or UI code.
// Rejected Alternative: Writing deeply nested if/else or switch statements
// inside the UI component to check medical blood group compatibility rules.
// ============================================================================
export class ExactMatchStrategy {
  findCompatibleDonors(donors, targetBloodGroup) {
    return donors.filter(
      (donor) => donor.available && donor.bloodGroup === targetBloodGroup
    );
  }
}

export class UniversalCompatibilityStrategy {
  // Key = Recipient Blood Group, Value = Array of Compatible Donor Blood Groups
  static COMPATIBILITY_MAP = {
    'A+': ['A+', 'A-', 'O+', 'O-'],
    'A-': ['A-', 'O-'],
    'B+': ['B+', 'B-', 'O+', 'O-'],
    'B-': ['B-', 'O-'],
    'AB+': ['A+', 'A-', 'B+', 'B-', 'AB+', 'AB-', 'O+', 'O-'],
    'AB-': ['AB-', 'A-', 'B-', 'O-'],
    'O+': ['O+', 'O-'],
    'O-': ['O-']
  };

  findCompatibleDonors(donors, recipientBloodGroup) {
    const allowedGroups =
      UniversalCompatibilityStrategy.COMPATIBILITY_MAP[recipientBloodGroup] || [];
    return donors.filter(
      (donor) => donor.available && allowedGroups.includes(donor.bloodGroup)
    );
  }
}

export class DonorMatchingContext {
  constructor(strategy = new ExactMatchStrategy()) {
    this.strategy = strategy;
  }

  setStrategy(strategy) {
    this.strategy = strategy;
  }

  executeMatch(donors, recipientBloodGroup) {
    if (!this.strategy || typeof this.strategy.findCompatibleDonors !== 'function') {
      throw new Error('Valid matching strategy must be configured');
    }
    return this.strategy.findCompatibleDonors(donors, recipientBloodGroup);
  }
}

// ============================================================================
// 4. FACADE PATTERN (Category: Structural)
// Problem Solved: Provides a simplified, unified high-level interface to
// coordinate multiple subsystems (Request Status Update, Inventory Deduction,
// and Notification Generation) when an Admin fulfills a blood request.
// Rejected Alternative: Having the UI manually call inventory, request, and
// notification modules separately, risking partial updates if one step fails.
// ============================================================================
export class BloodFulfillmentFacade {
  constructor(dbService = DatabaseService.getInstance()) {
    this.db = dbService;
  }

  async approveAndFulfillRequest(requestId) {
    const requests = this.db.getCollection('requests') || [];
    const inventory = { ...(this.db.getCollection('inventory') || {}) };
    const notifications = [...(this.db.getCollection('notifications') || [])];

    const targetRequest = requests.find((r) => r.id === requestId);
    if (!targetRequest) {
      throw new Error(`Request ${requestId} not found`);
    }

    const availableUnits = inventory[targetRequest.bloodGroup] || 0;
    if (availableUnits < targetRequest.unitsRequired) {
      throw new Error(
        `Insufficient ${targetRequest.bloodGroup} stock (${availableUnits} available, ${targetRequest.unitsRequired} needed)`
      );
    }

    // Deduct stock
    inventory[targetRequest.bloodGroup] = availableUnits - targetRequest.unitsRequired;

    // Update request status
    const updatedRequests = requests.map((req) =>
      req.id === requestId ? { ...req, status: 'Fulfilled' } : req
    );

    // Create notification via Factory Pattern
    const alert = BloodSystemFactory.createEntity('NOTIFICATION', {
      type: 'FULFILLED',
      message: `Fulfilled ${targetRequest.unitsRequired} unit(s) of ${targetRequest.bloodGroup} for ${targetRequest.patientName} at ${targetRequest.hospital}.`
    });
    notifications.unshift(alert);

    await this.db.updateCollection('inventory', inventory);
    await this.db.updateCollection('requests', updatedRequests);
    await this.db.updateCollection('notifications', notifications);

    return {
      fulfilledRequest: { ...targetRequest, status: 'Fulfilled' },
      remainingStock: inventory[targetRequest.bloodGroup],
      notification: alert
    };
  }
}

