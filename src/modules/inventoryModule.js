/**
 * ============================================================================
 * MODULE 4: Blood Bank Inventory & Donation Camp Module
 * ============================================================================
 * - Tracks blood bag units across all 8 ABO/Rh blood groups
 * - Detects low-stock groups (< 5 units)
 * - Schedules and manages community blood donation camps
 */
import { DatabaseService, BloodSystemFactory } from '../patterns/DesignPatterns.js';

export class InventoryModule {
  static LOW_STOCK_THRESHOLD = 5;
  static BLOOD_GROUPS = ['A+', 'A-', 'B+', 'B-', 'AB+', 'AB-', 'O+', 'O-'];

  constructor(dbService = DatabaseService.getInstance()) {
    this.db = dbService;
  }

  getInventory() {
    return this.db.getCollection('inventory') || {};
  }

  getLowStockGroups() {
    const inventory = this.getInventory();
    return Object.entries(inventory)
      .filter(([, units]) => units < InventoryModule.LOW_STOCK_THRESHOLD)
      .map(([group, units]) => ({ bloodGroup: group, units }));
  }

  async adjustStock(bloodGroup, deltaUnits) {
    if (!InventoryModule.BLOOD_GROUPS.includes(bloodGroup)) {
      throw new Error(`Invalid blood group: ${bloodGroup}`);
    }
    const inventory = { ...this.getInventory() };
    const currentUnits = Number(inventory[bloodGroup] || 0);
    const nextUnits = currentUnits + Number(deltaUnits);
    if (nextUnits < 0) {
      throw new Error(`Cannot reduce ${bloodGroup} stock below 0`);
    }
    inventory[bloodGroup] = nextUnits;
    await this.db.updateCollection('inventory', inventory);
    return inventory;
  }

  getAllCamps() {
    return this.db.getCollection('camps') || [];
  }

  async createCamp(campPayload) {
    const newCamp = BloodSystemFactory.createEntity('CAMP', campPayload);
    const camps = this.getAllCamps();
    const updated = [newCamp, ...camps];
    await this.db.updateCollection('camps', updated);
    return newCamp;
  }

  async registerDonorForCamp(campId) {
    const camps = this.getAllCamps();
    const updated = camps.map((c) =>
      c.id === campId ? { ...c, registeredDonors: c.registeredDonors + 1 } : c
    );
    await this.db.updateCollection('camps', updated);
    return updated.find((c) => c.id === campId);
  }
}

