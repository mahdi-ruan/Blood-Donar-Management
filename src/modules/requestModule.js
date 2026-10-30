/**
 * ============================================================================
 * MODULE 3: Blood Request & Compatible Donor Matching Module
 * ============================================================================
 * - Creates urgent or standard blood requests via Factory Pattern
 * - Matches compatible donors using Strategy Pattern (Exact vs. Universal Compatibility)
 */
import {
  DatabaseService,
  BloodSystemFactory,
  DonorMatchingContext,
  ExactMatchStrategy,
  UniversalCompatibilityStrategy
} from '../patterns/DesignPatterns.js';

export class RequestModule {
  constructor(
    dbService = DatabaseService.getInstance(),
    notificationService = null
  ) {
    this.db = dbService;
    this.notificationService = notificationService;
  }

  getAllRequests() {
    return this.db.getCollection('requests') || [];
  }

  async createBloodRequest(requestPayload) {
    const newRequest = BloodSystemFactory.createEntity('REQUEST', requestPayload);
    const existing = this.getAllRequests();
    const updated = [newRequest, ...existing];
    await this.db.updateCollection('requests', updated);

    if (newRequest.urgency === 'Critical') {
      const notifications = [...(this.db.getCollection('notifications') || [])];
      const criticalAlert = BloodSystemFactory.createEntity('NOTIFICATION', {
        type: 'CRITICAL_SOS',
        message: `CRITICAL SOS: ${newRequest.unitsRequired} unit(s) of ${newRequest.bloodGroup} urgently needed at ${newRequest.hospital} for ${newRequest.patientName}.`
      });
      notifications.unshift(criticalAlert);
      await this.db.updateCollection('notifications', notifications);

      if (this.notificationService && typeof this.notificationService.sendEmergencySMS === 'function') {
        await this.notificationService.sendEmergencySMS(newRequest);
      }
    }

    return newRequest;
  }

  findMatchingDonors(bloodGroup, mode = 'universal') {
    const donors = this.db.getCollection('donors') || [];
    const strategy =
      mode === 'exact'
        ? new ExactMatchStrategy()
        : new UniversalCompatibilityStrategy();
    const matcher = new DonorMatchingContext(strategy);
    return matcher.executeMatch(donors, bloodGroup);
  }
}

