/**
 * ============================================================================
 * MODULE 2: Donor Registration & Medical Eligibility Module
 * ============================================================================
 * - Calculates 90-day donation cooldown period
 * - Validates medical eligibility (Age 18-60, Weight >= 50 kg, >= 90 days since last donation)
 * - Registers new donors persistently using Singleton DatabaseService & Factory Pattern
 */
import { DatabaseService, BloodSystemFactory } from '../patterns/DesignPatterns.js';

export class DonorModule {
  static MIN_DAYS_BETWEEN_DONATIONS = 90;
  static MIN_ELIGIBLE_AGE = 18;
  static MAX_ELIGIBLE_AGE = 60;
  static MIN_ELIGIBLE_WEIGHT_KG = 50;

  constructor(dbService = DatabaseService.getInstance()) {
    this.db = dbService;
  }

  static calculateDaysSinceLastDonation(lastDonationDateStr, referenceDateStr = '2026-10-30') {
    if (!lastDonationDateStr) return 999;
    const lastDate = new Date(lastDonationDateStr);
    const refDate = new Date(referenceDateStr);
    const diffMs = refDate.getTime() - lastDate.getTime();
    return Math.floor(diffMs / (1000 * 60 * 60 * 24));
  }

  static checkMedicalEligibility(donor, referenceDateStr = '2026-10-30') {
    const reasons = [];
    const age = Number(donor.age);
    const weight = Number(donor.weight);
    const daysSinceLast = DonorModule.calculateDaysSinceLastDonation(
      donor.lastDonationDate,
      referenceDateStr
    );

    if (age < DonorModule.MIN_ELIGIBLE_AGE || age > DonorModule.MAX_ELIGIBLE_AGE) {
      reasons.push(`Age must be between ${DonorModule.MIN_ELIGIBLE_AGE} and ${DonorModule.MAX_ELIGIBLE_AGE} years`);
    }
    if (weight < DonorModule.MIN_ELIGIBLE_WEIGHT_KG) {
      reasons.push(`Minimum weight required is ${DonorModule.MIN_ELIGIBLE_WEIGHT_KG} kg`);
    }
    if (daysSinceLast < DonorModule.MIN_DAYS_BETWEEN_DONATIONS) {
      const remaining = DonorModule.MIN_DAYS_BETWEEN_DONATIONS - daysSinceLast;
      reasons.push(`Cooldown active: ${remaining} day(s) remaining before next eligible donation`);
    }

    return {
      isEligible: reasons.length === 0,
      daysSinceLastDonation: daysSinceLast,
      daysRemaining: Math.max(0, DonorModule.MIN_DAYS_BETWEEN_DONATIONS - daysSinceLast),
      reasons
    };
  }

  getAllDonors() {
    return this.db.getCollection('donors') || [];
  }

  async registerDonor(donorData) {
    const age = Number(donorData.age);
    const weight = Number(donorData.weight);
    if (age < DonorModule.MIN_ELIGIBLE_AGE || age > DonorModule.MAX_ELIGIBLE_AGE) {
      throw new Error('Donor age must be between 18 and 60 years');
    }
    if (weight < DonorModule.MIN_ELIGIBLE_WEIGHT_KG) {
      throw new Error('Donor weight must be at least 50 kg');
    }

    const newDonor = BloodSystemFactory.createEntity('DONOR', donorData);
    const currentDonors = this.getAllDonors();
    const updated = [newDonor, ...currentDonors];
    await this.db.updateCollection('donors', updated);
    return newDonor;
  }

  async toggleDonorAvailability(donorId) {
    const donors = this.getAllDonors();
    const updated = donors.map((d) =>
      d.id === donorId ? { ...d, available: !d.available } : d
    );
    await this.db.updateCollection('donors', updated);
    return updated.find((d) => d.id === donorId);
  }
}

