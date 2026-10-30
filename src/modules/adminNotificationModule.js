/**
 * ============================================================================
 * MODULE 5: Admin Dashboard, Request Approval & Notification Module
 * ============================================================================
 * - Coordinates request fulfillment using the Facade Pattern (BloodFulfillmentFacade)
 * - Handles Admin request rejection and status updates
 * - Computes real-time system summary metrics and manages alert notifications
 */
import {
  DatabaseService,
  BloodSystemFactory,
  BloodFulfillmentFacade
} from '../patterns/DesignPatterns.js';
import { InventoryModule } from './inventoryModule.js';

export class AdminNotificationModule {
  constructor(dbService = DatabaseService.getInstance()) {
    this.db = dbService;
    this.fulfillmentFacade = new BloodFulfillmentFacade(dbService);
  }

  async fulfillBloodRequest(requestId) {
    return this.fulfillmentFacade.approveAndFulfillRequest(requestId);
  }

  async updateRequestStatus(requestId, newStatus) {
    const validStatuses = ['Pending', 'Approved', 'Fulfilled', 'Rejected'];
    if (!validStatuses.includes(newStatus)) {
      throw new Error(`Invalid status: ${newStatus}`);
    }
    const requests = this.db.getCollection('requests') || [];
    const target = requests.find((r) => r.id === requestId);
    if (!target) {
      throw new Error(`Request ${requestId} not found`);
    }

    const updated = requests.map((r) =>
      r.id === requestId ? { ...r, status: newStatus } : r
    );
    await this.db.updateCollection('requests', updated);

    const notifications = [...(this.db.getCollection('notifications') || [])];
    notifications.unshift(
      BloodSystemFactory.createEntity('NOTIFICATION', {
        type: 'STATUS_UPDATE',
        message: `Admin updated request ${requestId} (${target.patientName}) to status: ${newStatus}.`
      })
    );
    await this.db.updateCollection('notifications', notifications);

    return updated.find((r) => r.id === requestId);
  }

  getSystemSummary() {
    const donors = this.db.getCollection('donors') || [];
    const requests = this.db.getCollection('requests') || [];
    const inventory = this.db.getCollection('inventory') || {};
    const camps = this.db.getCollection('camps') || [];

    const totalUnits = Object.values(inventory).reduce((sum, n) => sum + Number(n), 0);
    const lowStockCount = Object.values(inventory).filter(
      (n) => Number(n) < InventoryModule.LOW_STOCK_THRESHOLD
    ).length;

    return {
      totalDonors: donors.length,
      availableDonors: donors.filter((d) => d.available).length,
      totalRequests: requests.length,
      pendingRequests: requests.filter((r) => r.status === 'Pending').length,
      fulfilledRequests: requests.filter((r) => r.status === 'Fulfilled').length,
      totalBloodUnits: totalUnits,
      lowStockGroupsCount: lowStockCount,
      upcomingCampsCount: camps.length
    };
  }

  getNotifications() {
    return this.db.getCollection('notifications') || [];
  }

  async markAllNotificationsRead() {
    const notifications = this.getNotifications().map((n) => ({ ...n, read: true }));
    await this.db.updateCollection('notifications', notifications);
    return notifications;
  }
}

