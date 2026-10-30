import React, { useState, useEffect } from 'react';
import {
  Droplet,
  Users,
  HeartHandshake,
  PackageCheck,
  ShieldCheck,
  Bell,
  LogIn,
  LogOut,
  CheckCircle2,
  AlertTriangle,
  Calendar,
  Search,
  Sparkles,
  RefreshCw
} from 'lucide-react';
import { DatabaseService } from './patterns/DesignPatterns.js';
import { AuthModule, ADMIN_CREDENTIALS } from './modules/authModule.js';
import { DonorModule } from './modules/donorModule.js';
import { RequestModule } from './modules/requestModule.js';
import { InventoryModule } from './modules/inventoryModule.js';
import { AdminNotificationModule } from './modules/adminNotificationModule.js';

const dbSingleton = DatabaseService.getInstance();
const authModule = new AuthModule();
const donorModule = new DonorModule(dbSingleton);
const requestModule = new RequestModule(dbSingleton);
const inventoryModule = new InventoryModule(dbSingleton);
const adminModule = new AdminNotificationModule(dbSingleton);

const BLOOD_GROUPS = InventoryModule.BLOOD_GROUPS;

export default function App() {
  const [activeTab, setActiveTab] = useState('overview');
  const [currentUser, setCurrentUser] = useState(() => authModule.getCurrentUser());
  const [showAdminModal, setShowAdminModal] = useState(false);
  const [adminEmail, setAdminEmail] = useState('');
  const [adminPassword, setAdminPassword] = useState('');
  const [toast, setToast] = useState(null);

  // Persistent Data States
  const [donors, setDonors] = useState(() => donorModule.getAllDonors());
  const [requests, setRequests] = useState(() => requestModule.getAllRequests());
  const [inventory, setInventory] = useState(() => inventoryModule.getInventory());
  const [camps, setCamps] = useState(() => inventoryModule.getAllCamps());
  const [notifications, setNotifications] = useState(() => adminModule.getNotifications());
  const [summary, setSummary] = useState(() => adminModule.getSystemSummary());

  // Strategy Pattern Matcher State
  const [targetRecipientGroup, setTargetRecipientGroup] = useState('A+');
  const [strategyMode, setStrategyMode] = useState('universal');
  const [donorFilterGroup, setDonorFilterGroup] = useState('ALL');

  // Forms State
  const [donorForm, setDonorForm] = useState({
    name: '',
    bloodGroup: 'O+',
    phone: '',
    location: 'Rajshahi',
    age: 22,
    weight: 62,
    lastDonationDate: '2026-04-10'
  });

  const [requestForm, setRequestForm] = useState({
    patientName: '',
    bloodGroup: 'O+',
    unitsRequired: 1,
    hospital: '',
    urgency: 'Urgent',
    contactPhone: ''
  });

  const [campForm, setCampForm] = useState({
    title: '',
    organizer: '',
    location: '',
    date: '2026-12-05',
    targetUnits: 100
  });

  const refreshAllState = () => {
    setDonors([...donorModule.getAllDonors()]);
    setRequests([...requestModule.getAllRequests()]);
    setInventory({ ...inventoryModule.getInventory() });
    setCamps([...inventoryModule.getAllCamps()]);
    setNotifications([...adminModule.getNotifications()]);
    setSummary({ ...adminModule.getSystemSummary() });
  };

  const showToastMessage = (type, text) => {
    setToast({ type, text });
    setTimeout(() => setToast(null), 4000);
  };

  useEffect(() => {
    refreshAllState();
  }, []);

  // Module 1: Authentication Handlers
  const handleGoogleSignIn = async () => {
    try {
      const user = await authModule.loginWithGoogle();
      setCurrentUser(user);
      showToastMessage('success', `Signed in with Google as ${user.name} (${user.email})`);
    } catch (err) {
      showToastMessage('error', err.message);
    }
  };

  const handleAdminSignIn = (e) => {
    e.preventDefault();
    try {
      const admin = authModule.loginAsAdmin(adminEmail, adminPassword);
      setCurrentUser(admin);
      setShowAdminModal(false);
      setActiveTab('admin');
      showToastMessage('success', 'Logged in as System Administrator');
    } catch (err) {
      showToastMessage('error', err.message);
    }
  };

  const handleLogout = async () => {
    await authModule.logout();
    setCurrentUser(null);
    showToastMessage('success', 'Signed out successfully');
  };

  // Module 2: Donor Registration & Availability
  const handleRegisterDonor = async (e) => {
    e.preventDefault();
    try {
      const payload = {
        ...donorForm,
        email: currentUser?.email || 'volunteer@bloodlink.org'
      };
      const created = await donorModule.registerDonor(payload);
      refreshAllState();
      setDonorForm({
        name: '',
        bloodGroup: 'O+',
        phone: '',
        location: 'Rajshahi',
        age: 22,
        weight: 62,
        lastDonationDate: '2026-04-10'
      });
      showToastMessage('success', `Donor ${created.name} (${created.bloodGroup}) registered with ID ${created.id}`);
    } catch (err) {
      showToastMessage('error', err.message);
    }
  };

  const handleToggleDonorAvailability = async (id) => {
    await donorModule.toggleDonorAvailability(id);
    refreshAllState();
  };

  // Module 3: Blood Request Creation & Strategy Matching
  const handleCreateRequest = async (e) => {
    e.preventDefault();
    try {
      const created = await requestModule.createBloodRequest({
        ...requestForm,
        requestedBy: currentUser?.email || 'patient.care@bloodlink.org'
      });
      refreshAllState();
      setRequestForm({
        patientName: '',
        bloodGroup: 'O+',
        unitsRequired: 1,
        hospital: '',
        urgency: 'Urgent',
        contactPhone: ''
      });
      showToastMessage('success', `Blood Request ${created.id} submitted for ${created.patientName}`);
    } catch (err) {
      showToastMessage('error', err.message);
    }
  };

  const matchedDonors = requestModule.findMatchingDonors(targetRecipientGroup, strategyMode);

  // Module 4: Inventory & Camps
  const handleAdjustStock = async (group, delta) => {
    try {
      await inventoryModule.adjustStock(group, delta);
      refreshAllState();
      showToastMessage('success', `Updated ${group} blood inventory (${delta > 0 ? '+1' : '-1'} unit)`);
    } catch (err) {
      showToastMessage('error', err.message);
    }
  };

  const handleCreateCamp = async (e) => {
    e.preventDefault();
    try {
      const camp = await inventoryModule.createCamp(campForm);
      refreshAllState();
      setCampForm({
        title: '',
        organizer: '',
        location: '',
        date: '2026-12-05',
        targetUnits: 100
      });
      showToastMessage('success', `Scheduled donation camp: ${camp.title}`);
    } catch (err) {
      showToastMessage('error', err.message);
    }
  };

  const handleJoinCamp = async (campId) => {
    await inventoryModule.registerDonorForCamp(campId);
    refreshAllState();
    showToastMessage('success', 'Registered as volunteer donor for the camp!');
  };

  // Module 5: Admin Actions (Facade Pattern)
  const handleFulfillRequest = async (reqId) => {
    try {
      const result = await adminModule.fulfillBloodRequest(reqId);
      refreshAllState();
      showToastMessage(
        'success',
        `Fulfilled request ${reqId}! Remaining ${result.fulfilledRequest.bloodGroup} stock: ${result.remainingStock} units.`
      );
    } catch (err) {
      showToastMessage('error', err.message);
    }
  };

  const handleRejectRequest = async (reqId) => {
    try {
      await adminModule.updateRequestStatus(reqId, 'Rejected');
      refreshAllState();
      showToastMessage('success', `Marked request ${reqId} as Rejected.`);
    } catch (err) {
      showToastMessage('error', err.message);
    }
  };

  const handleResetDemoData = async () => {
    await dbSingleton.resetToDefaults();
    refreshAllState();
    showToastMessage('success', 'System database reset to default seed records.');
  };

  const filteredDonors =
    donorFilterGroup === 'ALL'
      ? donors
      : donors.filter((d) => d.bloodGroup === donorFilterGroup);

  return (
    <div className="app-shell">
      {/* Top Header (Module 1: Auth & Session) */}
      <header className="top-navbar">
        <div className="brand-group">
          <div className="brand-logo">
            <Droplet size={22} />
          </div>
          <div>
            <div className="brand-title">BloodLink BDMS</div>
            <div className="brand-subtitle">
              Blood Donor & Inventory Management System • CSE 3206 SDLC Project
            </div>
          </div>
        </div>

        <div className="auth-controls">
          {currentUser ? (
            <>
              <div className="user-pill" data-testid="active-user-pill">
                <span>{currentUser.name}</span>
                <span className={`role-badge ${currentUser.role}`}>
                  {currentUser.role}
                </span>
              </div>
              <button className="btn btn-outline btn-sm" onClick={handleLogout}>
                <LogOut size={15} /> Sign Out
              </button>
            </>
          ) : (
            <>
              <button
                className="btn btn-google"
                onClick={handleGoogleSignIn}
                data-testid="google-signin-btn"
              >
                <LogIn size={16} color="#dc2626" /> Sign in with Google
              </button>
              <button
                className="btn btn-primary"
                onClick={() => setShowAdminModal(true)}
                data-testid="admin-login-trigger"
              >
                <ShieldCheck size={16} /> Admin Login
              </button>
            </>
          )}
        </div>
      </header>

      {/* Navigation Tabs across the 5 Functional Modules */}
      <nav className="module-tabs">
        <button
          className={`tab-btn ${activeTab === 'overview' ? 'active' : ''}`}
          onClick={() => setActiveTab('overview')}
          data-testid="tab-overview"
        >
          <Sparkles size={16} /> 1. Overview & Smart Matcher
        </button>
        <button
          className={`tab-btn ${activeTab === 'donors' ? 'active' : ''}`}
          onClick={() => setActiveTab('donors')}
          data-testid="tab-donors"
        >
          <Users size={16} /> 2. Donor Directory & Eligibility ({donors.length})
        </button>
        <button
          className={`tab-btn ${activeTab === 'requests' ? 'active' : ''}`}
          onClick={() => setActiveTab('requests')}
          data-testid="tab-requests"
        >
          <HeartHandshake size={16} /> 3. Emergency Blood Requests ({requests.length})
        </button>
        <button
          className={`tab-btn ${activeTab === 'inventory' ? 'active' : ''}`}
          onClick={() => setActiveTab('inventory')}
          data-testid="tab-inventory"
        >
          <PackageCheck size={16} /> 4. Blood Bank Inventory & Camps
        </button>
        <button
          className={`tab-btn ${activeTab === 'admin' ? 'active' : ''}`}
          onClick={() => setActiveTab('admin')}
          data-testid="tab-admin"
        >
          <ShieldCheck size={16} /> 5. Admin Control & Alerts ({notifications.length})
        </button>
      </nav>

      {/* Main Container */}
      <main className="main-container">
        {toast && (
          <div className={`toast-banner ${toast.type}`} data-testid="toast-banner">
            <span>{toast.text}</span>
            <button
              className="btn btn-sm btn-outline"
              onClick={() => setToast(null)}
            >
              Dismiss
            </button>
          </div>
        )}

        {/* KPI Dashboard Row */}
        <section className="kpi-grid">
          <div className="kpi-card">
            <span className="kpi-label">Registered Donors</span>
            <span className="kpi-value" data-testid="kpi-total-donors">
              {summary.totalDonors}
            </span>
            <span className="kpi-sub">
              {summary.availableDonors} currently active & available
            </span>
          </div>
          <div className="kpi-card">
            <span className="kpi-label">Total Blood Units</span>
            <span className="kpi-value" data-testid="kpi-total-units">
              {summary.totalBloodUnits}
            </span>
            <span className="kpi-sub">
              {summary.lowStockGroupsCount} group(s) below 5-unit safety threshold
            </span>
          </div>
          <div className="kpi-card">
            <span className="kpi-label">Blood Requests</span>
            <span className="kpi-value" data-testid="kpi-total-requests">
              {summary.totalRequests}
            </span>
            <span className="kpi-sub">
              {summary.pendingRequests} Pending • {summary.fulfilledRequests} Fulfilled
            </span>
          </div>
          <div className="kpi-card">
            <span className="kpi-label">Donation Camps</span>
            <span className="kpi-value">{summary.upcomingCampsCount}</span>
            <span className="kpi-sub">Active voluntary drives in Rajshahi</span>
          </div>
        </section>

        {/* TAB 1: OVERVIEW & STRATEGY PATTERN BLOOD MATCHER */}
        {activeTab === 'overview' && (
          <div className="two-col-grid">
            <div className="panel-card">
              <div className="panel-header">
                <h2 className="panel-title">
                  <Search size={18} color="#dc2626" /> Smart Donor Compatibility Matcher
                </h2>
                <span className="status-pill Approved">Strategy Pattern</span>
              </div>
              <p style={{ fontSize: '0.84rem', color: '#64748b', marginBottom: '1rem' }}>
                Select a patient&apos;s blood group and switch between the{' '}
                <strong>Exact Match Strategy</strong> and{' '}
                <strong>Universal ABO/Rh Compatibility Strategy</strong> at runtime.
              </p>

              <div className="form-grid">
                <div className="form-row">
                  <div className="form-group">
                    <label>Patient Recipient Blood Group</label>
                    <select
                      className="form-select"
                      value={targetRecipientGroup}
                      onChange={(e) => setTargetRecipientGroup(e.target.value)}
                      data-testid="matcher-blood-select"
                    >
                      {BLOOD_GROUPS.map((bg) => (
                        <option key={bg} value={bg}>
                          Recipient Needs {bg}
                        </option>
                      ))}
                    </select>
                  </div>
                  <div className="form-group">
                    <label>Matching Algorithm (Strategy Pattern)</label>
                    <select
                      className="form-select"
                      value={strategyMode}
                      onChange={(e) => setStrategyMode(e.target.value)}
                      data-testid="matcher-strategy-select"
                    >
                      <option value="universal">
                        Universal Medical Compatibility
                      </option>
                      <option value="exact">Exact Blood Group Match Only</option>
                    </select>
                  </div>
                </div>

                <div
                  style={{
                    background: '#f8fafc',
                    border: '1px solid #e2e8f0',
                    borderRadius: '10px',
                    padding: '1rem',
                    marginTop: '0.4rem'
                  }}
                >
                  <div
                    style={{
                      fontWeight: 700,
                      fontSize: '0.86rem',
                      marginBottom: '0.6rem',
                      color: '#0f172a'
                    }}
                  >
                    Compatible Donors Found ({matchedDonors.length}):
                  </div>
                  {matchedDonors.length === 0 ? (
                    <div style={{ fontSize: '0.84rem', color: '#64748b' }}>
                      No available donors match this criteria.
                    </div>
                  ) : (
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                      {matchedDonors.map((d) => {
                        const elig = DonorModule.checkMedicalEligibility(d);
                        return (
                          <div
                            key={d.id}
                            style={{
                              display: 'flex',
                              alignItems: 'center',
                              justifyContent: 'space-between',
                              background: '#fff',
                              padding: '0.6rem 0.85rem',
                              borderRadius: '8px',
                              border: '1px solid #e2e8f0'
                            }}
                          >
                            <div style={{ display: 'flex', alignItems: 'center', gap: '0.65rem' }}>
                              <span className="blood-badge">{d.bloodGroup}</span>
                              <div>
                                <div style={{ fontWeight: 700, fontSize: '0.86rem' }}>
                                  {d.name}
                                </div>
                                <div style={{ fontSize: '0.76rem', color: '#64748b' }}>
                                  {d.location} • {d.phone}
                                </div>
                              </div>
                            </div>
                            <span
                              className={`status-pill ${
                                elig.isEligible ? 'eligible' : 'cooldown'
                              }`}
                            >
                              {elig.isEligible
                                ? 'Medically Eligible'
                                : `${elig.daysRemaining}d Cooldown`}
                            </span>
                          </div>
                        );
                      })}
                    </div>
                  )}
                </div>
              </div>
            </div>

            <div className="panel-card">
              <div className="panel-header">
                <h2 className="panel-title">
                  <PackageCheck size={18} color="#dc2626" /> Live Blood Bank Stock & Urgent SOS
                </h2>
                <span className="status-pill eligible">Singleton DB Persisted</span>
              </div>
              <div className="inventory-grid" style={{ marginBottom: '1.25rem' }}>
                {BLOOD_GROUPS.map((bg) => {
                  const units = inventory[bg] ?? 0;
                  const isLow = units < InventoryModule.LOW_STOCK_THRESHOLD;
                  return (
                    <div
                      key={bg}
                      className={`inventory-card ${isLow ? 'low-stock' : ''}`}
                    >
                      <div className="inventory-group">{bg}</div>
                      <div className="inventory-units">{units} Units</div>
                      <span
                        className={`status-pill ${isLow ? 'Critical' : 'eligible'}`}
                      >
                        {isLow ? 'Low Stock' : 'Optimal'}
                      </span>
                    </div>
                  );
                })}
              </div>

              <h3
                style={{
                  fontSize: '0.92rem',
                  fontWeight: 700,
                  marginBottom: '0.6rem'
                }}
              >
                Recent Blood Requests
              </h3>
              <table className="data-table">
                <thead>
                  <tr>
                    <th>Patient</th>
                    <th>Group</th>
                    <th>Hospital</th>
                    <th>Urgency</th>
                    <th>Status</th>
                  </tr>
                </thead>
                <tbody>
                  {requests.slice(0, 4).map((req) => (
                    <tr key={req.id}>
                      <td>
                        <strong>{req.patientName}</strong>
                      </td>
                      <td>
                        <span className="blood-badge">{req.bloodGroup}</span>
                      </td>
                      <td>{req.hospital}</td>
                      <td>
                        <span className={`status-pill ${req.urgency}`}>
                          {req.urgency}
                        </span>
                      </td>
                      <td>
                        <span className={`status-pill ${req.status}`}>
                          {req.status}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* TAB 2: DONOR DIRECTORY & ELIGIBILITY MODULE */}
        {activeTab === 'donors' && (
          <div className="two-col-grid">
            <div className="panel-card">
              <div className="panel-header">
                <h2 className="panel-title">Register New Blood Donor</h2>
                <span className="status-pill Approved">Factory Pattern</span>
              </div>
              <form className="form-grid" onSubmit={handleRegisterDonor}>
                <div className="form-group">
                  <label>Full Name *</label>
                  <input
                    className="form-input"
                    required
                    placeholder="e.g., Hasibul Islam"
                    value={donorForm.name}
                    onChange={(e) =>
                      setDonorForm({ ...donorForm, name: e.target.value })
                    }
                    data-testid="donor-name-input"
                  />
                </div>
                <div className="form-row">
                  <div className="form-group">
                    <label>Blood Group *</label>
                    <select
                      className="form-select"
                      value={donorForm.bloodGroup}
                      onChange={(e) =>
                        setDonorForm({ ...donorForm, bloodGroup: e.target.value })
                      }
                      data-testid="donor-group-select"
                    >
                      {BLOOD_GROUPS.map((bg) => (
                        <option key={bg} value={bg}>
                          {bg}
                        </option>
                      ))}
                    </select>
                  </div>
                  <div className="form-group">
                    <label>Phone Number *</label>
                    <input
                      className="form-input"
                      required
                      placeholder="017XX-XXXXXX"
                      value={donorForm.phone}
                      onChange={(e) =>
                        setDonorForm({ ...donorForm, phone: e.target.value })
                      }
                      data-testid="donor-phone-input"
                    />
                  </div>
                </div>
                <div className="form-row">
                  <div className="form-group">
                    <label>Age (18–60 yrs) *</label>
                    <input
                      type="number"
                      className="form-input"
                      required
                      value={donorForm.age}
                      onChange={(e) =>
                        setDonorForm({ ...donorForm, age: e.target.value })
                      }
                    />
                  </div>
                  <div className="form-group">
                    <label>Weight (min 50 kg) *</label>
                    <input
                      type="number"
                      className="form-input"
                      required
                      value={donorForm.weight}
                      onChange={(e) =>
                        setDonorForm({ ...donorForm, weight: e.target.value })
                      }
                    />
                  </div>
                </div>
                <div className="form-row">
                  <div className="form-group">
                    <label>City / Area</label>
                    <input
                      className="form-input"
                      value={donorForm.location}
                      onChange={(e) =>
                        setDonorForm({ ...donorForm, location: e.target.value })
                      }
                    />
                  </div>
                  <div className="form-group">
                    <label>Last Donation Date</label>
                    <input
                      type="date"
                      className="form-input"
                      value={donorForm.lastDonationDate}
                      onChange={(e) =>
                        setDonorForm({
                          ...donorForm,
                          lastDonationDate: e.target.value
                        })
                      }
                    />
                  </div>
                </div>
                <button
                  type="submit"
                  className="btn btn-primary"
                  data-testid="register-donor-submit"
                >
                  <CheckCircle2 size={16} /> Register Donor
                </button>
              </form>
            </div>

            <div className="panel-card">
              <div className="panel-header">
                <h2 className="panel-title">Registered Donors & 90-Day Eligibility</h2>
                <select
                  className="form-select"
                  style={{ width: 'auto' }}
                  value={donorFilterGroup}
                  onChange={(e) => setDonorFilterGroup(e.target.value)}
                >
                  <option value="ALL">All Blood Groups</option>
                  {BLOOD_GROUPS.map((bg) => (
                    <option key={bg} value={bg}>
                      Group {bg}
                    </option>
                  ))}
                </select>
              </div>
              <table className="data-table">
                <thead>
                  <tr>
                    <th>ID / Name</th>
                    <th>Group</th>
                    <th>Contact & Location</th>
                    <th>90-Day Medical Status</th>
                    <th>Availability</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredDonors.map((d) => {
                    const check = DonorModule.checkMedicalEligibility(d);
                    return (
                      <tr key={d.id}>
                        <td>
                          <div style={{ fontWeight: 700 }}>{d.name}</div>
                          <div style={{ fontSize: '0.75rem', color: '#64748b' }}>
                            {d.id} • {d.age}y, {d.weight}kg
                          </div>
                        </td>
                        <td>
                          <span className="blood-badge">{d.bloodGroup}</span>
                        </td>
                        <td>
                          <div>{d.phone}</div>
                          <div style={{ fontSize: '0.75rem', color: '#64748b' }}>
                            {d.location}
                          </div>
                        </td>
                        <td>
                          <span
                            className={`status-pill ${
                              check.isEligible ? 'eligible' : 'cooldown'
                            }`}
                          >
                            {check.isEligible
                              ? `Eligible (${check.daysSinceLastDonation}d ago)`
                              : `Cooldown (${check.daysRemaining}d left)`}
                          </span>
                        </td>
                        <td>
                          <button
                            className="btn btn-sm btn-outline"
                            onClick={() => handleToggleDonorAvailability(d.id)}
                          >
                            {d.available ? 'Active' : 'Paused'}
                          </button>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* TAB 3: BLOOD REQUESTS & SOS MODULE */}
        {activeTab === 'requests' && (
          <div className="two-col-grid">
            <div className="panel-card">
              <div className="panel-header">
                <h2 className="panel-title">Create Emergency Blood Request</h2>
              </div>
              <form className="form-grid" onSubmit={handleCreateRequest}>
                <div className="form-group">
                  <label>Patient Name *</label>
                  <input
                    className="form-input"
                    required
                    placeholder="e.g., Abdul Karim"
                    value={requestForm.patientName}
                    onChange={(e) =>
                      setRequestForm({
                        ...requestForm,
                        patientName: e.target.value
                      })
                    }
                    data-testid="req-patient-input"
                  />
                </div>
                <div className="form-row">
                  <div className="form-group">
                    <label>Required Blood Group *</label>
                    <select
                      className="form-select"
                      value={requestForm.bloodGroup}
                      onChange={(e) =>
                        setRequestForm({
                          ...requestForm,
                          bloodGroup: e.target.value
                        })
                      }
                    >
                      {BLOOD_GROUPS.map((bg) => (
                        <option key={bg} value={bg}>
                          {bg}
                        </option>
                      ))}
                    </select>
                  </div>
                  <div className="form-group">
                    <label>Units Needed (Bags) *</label>
                    <input
                      type="number"
                      min="1"
                      max="10"
                      className="form-input"
                      value={requestForm.unitsRequired}
                      onChange={(e) =>
                        setRequestForm({
                          ...requestForm,
                          unitsRequired: e.target.value
                        })
                      }
                    />
                  </div>
                </div>
                <div className="form-group">
                  <label>Hospital Name & Ward *</label>
                  <input
                    className="form-input"
                    required
                    placeholder="e.g., Rajshahi Medical College Hospital"
                    value={requestForm.hospital}
                    onChange={(e) =>
                      setRequestForm({ ...requestForm, hospital: e.target.value })
                    }
                    data-testid="req-hospital-input"
                  />
                </div>
                <div className="form-row">
                  <div className="form-group">
                    <label>Urgency Level</label>
                    <select
                      className="form-select"
                      value={requestForm.urgency}
                      onChange={(e) =>
                        setRequestForm({ ...requestForm, urgency: e.target.value })
                      }
                    >
                      <option value="Normal">Normal</option>
                      <option value="Urgent">Urgent</option>
                      <option value="Critical">Critical SOS</option>
                    </select>
                  </div>
                  <div className="form-group">
                    <label>Emergency Contact Phone *</label>
                    <input
                      className="form-input"
                      required
                      placeholder="017XX-XXXXXX"
                      value={requestForm.contactPhone}
                      onChange={(e) =>
                        setRequestForm({
                          ...requestForm,
                          contactPhone: e.target.value
                        })
                      }
                    />
                  </div>
                </div>
                <button
                  type="submit"
                  className="btn btn-primary"
                  data-testid="submit-request-btn"
                >
                  <HeartHandshake size={16} /> Submit Blood Request
                </button>
              </form>
            </div>

            <div className="panel-card">
              <div className="panel-header">
                <h2 className="panel-title">All Blood Requisitions</h2>
              </div>
              <table className="data-table">
                <thead>
                  <tr>
                    <th>Req ID & Date</th>
                    <th>Patient & Hospital</th>
                    <th>Blood & Units</th>
                    <th>Urgency</th>
                    <th>Status</th>
                  </tr>
                </thead>
                <tbody>
                  {requests.map((r) => (
                    <tr key={r.id}>
                      <td>
                        <div style={{ fontWeight: 700 }}>{r.id}</div>
                        <div style={{ fontSize: '0.75rem', color: '#64748b' }}>
                          {r.createdAt}
                        </div>
                      </td>
                      <td>
                        <div style={{ fontWeight: 700 }}>{r.patientName}</div>
                        <div style={{ fontSize: '0.76rem', color: '#64748b' }}>
                          {r.hospital} ({r.contactPhone})
                        </div>
                      </td>
                      <td>
                        <span className="blood-badge">{r.bloodGroup}</span>{' '}
                        <span style={{ fontWeight: 600, marginLeft: '0.3rem' }}>
                          × {r.unitsRequired}
                        </span>
                      </td>
                      <td>
                        <span className={`status-pill ${r.urgency}`}>
                          {r.urgency}
                        </span>
                      </td>
                      <td>
                        <span className={`status-pill ${r.status}`}>
                          {r.status}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* TAB 4: BLOOD INVENTORY & CAMPS MODULE */}
        {activeTab === 'inventory' && (
          <div>
            <div className="panel-card">
              <div className="panel-header">
                <h2 className="panel-title">
                  Central Blood Bank Inventory Management
                </h2>
                <span style={{ fontSize: '0.8rem', color: '#64748b' }}>
                  Safety Threshold: Minimum 5 Units per Blood Group
                </span>
              </div>
              <div className="inventory-grid">
                {BLOOD_GROUPS.map((bg) => {
                  const units = inventory[bg] ?? 0;
                  const isLow = units < InventoryModule.LOW_STOCK_THRESHOLD;
                  return (
                    <div
                      key={bg}
                      className={`inventory-card ${isLow ? 'low-stock' : ''}`}
                    >
                      <div className="inventory-group">{bg}</div>
                      <div className="inventory-units">{units} Bags</div>
                      <div style={{ marginBottom: '0.65rem' }}>
                        <span
                          className={`status-pill ${isLow ? 'Critical' : 'eligible'}`}
                        >
                          {isLow ? 'Low Stock Alert' : 'Sufficient'}
                        </span>
                      </div>
                      <div
                        style={{
                          display: 'flex',
                          justifyContent: 'center',
                          gap: '0.4rem'
                        }}
                      >
                        <button
                          className="btn btn-sm btn-outline"
                          onClick={() => handleAdjustStock(bg, -1)}
                        >
                          -1
                        </button>
                        <button
                          className="btn btn-sm btn-primary"
                          onClick={() => handleAdjustStock(bg, 1)}
                          data-testid={`add-unit-${bg}`}
                        >
                          +1
                        </button>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>

            <div className="two-col-grid">
              <div className="panel-card">
                <div className="panel-header">
                  <h2 className="panel-title">Schedule Donation Drive / Camp</h2>
                </div>
                <form className="form-grid" onSubmit={handleCreateCamp}>
                  <div className="form-group">
                    <label>Camp Title *</label>
                    <input
                      className="form-input"
                      required
                      placeholder="e.g., Winter Campus Blood Drive"
                      value={campForm.title}
                      onChange={(e) =>
                        setCampForm({ ...campForm, title: e.target.value })
                      }
                    />
                  </div>
                  <div className="form-row">
                    <div className="form-group">
                      <label>Organizer</label>
                      <input
                        className="form-input"
                        placeholder="e.g., Badhan / Red Crescent"
                        value={campForm.organizer}
                        onChange={(e) =>
                          setCampForm({ ...campForm, organizer: e.target.value })
                        }
                      />
                    </div>
                    <div className="form-group">
                      <label>Venue Location *</label>
                      <input
                        className="form-input"
                        required
                        placeholder="e.g., RUET Medical Center"
                        value={campForm.location}
                        onChange={(e) =>
                          setCampForm({ ...campForm, location: e.target.value })
                        }
                      />
                    </div>
                  </div>
                  <div className="form-row">
                    <div className="form-group">
                      <label>Event Date *</label>
                      <input
                        type="date"
                        className="form-input"
                        required
                        value={campForm.date}
                        onChange={(e) =>
                          setCampForm({ ...campForm, date: e.target.value })
                        }
                      />
                    </div>
                    <div className="form-group">
                      <label>Target Blood Units</label>
                      <input
                        type="number"
                        className="form-input"
                        value={campForm.targetUnits}
                        onChange={(e) =>
                          setCampForm({ ...campForm, targetUnits: e.target.value })
                        }
                      />
                    </div>
                  </div>
                  <button type="submit" className="btn btn-primary">
                    <Calendar size={16} /> Publish Donation Camp
                  </button>
                </form>
              </div>

              <div className="panel-card">
                <div className="panel-header">
                  <h2 className="panel-title">Upcoming Voluntary Donation Camps</h2>
                </div>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '0.85rem' }}>
                  {camps.map((c) => (
                    <div
                      key={c.id}
                      style={{
                        border: '1px solid #e2e8f0',
                        borderRadius: '10px',
                        padding: '1rem',
                        display: 'flex',
                        justifyContent: 'space-between',
                        alignItems: 'center'
                      }}
                    >
                      <div>
                        <div style={{ fontWeight: 700, fontSize: '0.95rem' }}>
                          {c.title}
                        </div>
                        <div style={{ fontSize: '0.8rem', color: '#64748b' }}>
                          {c.organizer} • {c.location} • Date: {c.date}
                        </div>
                        <div
                          style={{
                            fontSize: '0.78rem',
                            fontWeight: 600,
                            color: '#dc2626',
                            marginTop: '0.25rem'
                          }}
                        >
                          Registered Volunteers: {c.registeredDonors} / Target:{' '}
                          {c.targetUnits} units
                        </div>
                      </div>
                      <button
                        className="btn btn-sm btn-outline"
                        onClick={() => handleJoinCamp(c.id)}
                      >
                        + Join Camp
                      </button>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        )}

        {/* TAB 5: ADMIN CONTROL CENTER & NOTIFICATIONS MODULE */}
        {activeTab === 'admin' && (
          <div>
            {currentUser?.role !== 'admin' ? (
              <div className="panel-card" style={{ textAlign: 'center', padding: '2.5rem' }}>
                <AlertTriangle size={38} color="#dc2626" style={{ marginBottom: '0.75rem' }} />
                <h2 style={{ fontSize: '1.2rem', marginBottom: '0.4rem' }}>
                  Administrator Authentication Required
                </h2>
                <p style={{ color: '#64748b', fontSize: '0.9rem', marginBottom: '1.2rem' }}>
                  Use the fixed Administrator account (<code>{ADMIN_CREDENTIALS.email}</code>) to
                  approve/fulfill blood requests and manage system alerts.
                </p>
                <button
                  className="btn btn-primary"
                  onClick={() => setShowAdminModal(true)}
                >
                  <ShieldCheck size={16} /> Open Admin Sign-In
                </button>
              </div>
            ) : (
              <div className="two-col-grid">
                <div className="panel-card">
                  <div className="panel-header">
                    <h2 className="panel-title">
                      <Bell size={18} color="#dc2626" /> System Audit & Alert Feed
                    </h2>
                    <button
                      className="btn btn-sm btn-outline"
                      onClick={handleResetDemoData}
                    >
                      <RefreshCw size={14} /> Reset Seed Data
                    </button>
                  </div>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '0.65rem' }}>
                    {notifications.map((n) => (
                      <div
                        key={n.id}
                        style={{
                          padding: '0.75rem',
                          borderRadius: '8px',
                          background: '#f8fafc',
                          borderLeft: '4px solid #dc2626',
                          fontSize: '0.83rem'
                        }}
                      >
                        <div style={{ fontWeight: 700, color: '#0f172a' }}>
                          [{n.type}] {n.timestamp}
                        </div>
                        <div style={{ color: '#334155', marginTop: '0.2rem' }}>
                          {n.message}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

                <div className="panel-card">
                  <div className="panel-header">
                    <h2 className="panel-title">
                      Admin Requisition Fulfillment (Facade Pattern)
                    </h2>
                    <span className="status-pill Approved">BloodFulfillmentFacade</span>
                  </div>
                  <p style={{ fontSize: '0.82rem', color: '#64748b', marginBottom: '1rem' }}>
                    Clicking <strong>Fulfill from Stock</strong> invokes{' '}
                    <code>BloodFulfillmentFacade</code>, which atomically verifies stock,
                    deducts units from Inventory, marks the request Fulfilled, and dispatches
                    an audit alert.
                  </p>
                  <table className="data-table">
                    <thead>
                      <tr>
                        <th>Request</th>
                        <th>Group & Qty</th>
                        <th>Current Stock</th>
                        <th>Status</th>
                        <th>Admin Action</th>
                      </tr>
                    </thead>
                    <tbody>
                      {requests.map((r) => (
                        <tr key={r.id}>
                          <td>
                            <strong>{r.patientName}</strong>
                            <div style={{ fontSize: '0.75rem', color: '#64748b' }}>
                              {r.id} • {r.hospital}
                            </div>
                          </td>
                          <td>
                            <span className="blood-badge">{r.bloodGroup}</span> ×{' '}
                            {r.unitsRequired}
                          </td>
                          <td>{inventory[r.bloodGroup] ?? 0} units</td>
                          <td>
                            <span className={`status-pill ${r.status}`}>
                              {r.status}
                            </span>
                          </td>
                          <td>
                            {r.status !== 'Fulfilled' && r.status !== 'Rejected' ? (
                              <div style={{ display: 'flex', gap: '0.4rem' }}>
                                <button
                                  className="btn btn-sm btn-success"
                                  onClick={() => handleFulfillRequest(r.id)}
                                  data-testid={`fulfill-btn-${r.id}`}
                                >
                                  Fulfill from Stock
                                </button>
                                <button
                                  className="btn btn-sm btn-outline"
                                  onClick={() => handleRejectRequest(r.id)}
                                >
                                  Reject
                                </button>
                              </div>
                            ) : (
                              <span style={{ fontSize: '0.78rem', color: '#64748b' }}>
                                Completed
                              </span>
                            )}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            )}
          </div>
        )}
      </main>

      {/* Admin Fixed Credentials Modal */}
      {showAdminModal && (
        <div className="modal-backdrop">
          <div className="modal-box">
            <h3 style={{ fontSize: '1.1rem', fontWeight: 800, marginBottom: '0.35rem' }}>
              Administrator Portal Login
            </h3>
            <p style={{ fontSize: '0.82rem', color: '#64748b', marginBottom: '1rem' }}>
              Enter the fixed administrator email and password configured in{' '}
              <code>AuthModule</code>.
            </p>
            <form className="form-grid" onSubmit={handleAdminSignIn}>
              <div className="form-group">
                <label>Admin Email</label>
                <input
                  type="email"
                  className="form-input"
                  required
                  value={adminEmail}
                  onChange={(e) => setAdminEmail(e.target.value)}
                  placeholder="admin@bloodlink.com"
                  data-testid="admin-email-input"
                />
              </div>
              <div className="form-group">
                <label>Admin Password</label>
                <input
                  type="password"
                  className="form-input"
                  required
                  value={adminPassword}
                  onChange={(e) => setAdminPassword(e.target.value)}
                  placeholder="••••••••"
                  data-testid="admin-password-input"
                />
              </div>
              <div
                style={{
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center',
                  marginTop: '0.3rem'
                }}
              >
                <button
                  type="button"
                  className="btn btn-sm btn-outline"
                  onClick={() => {
                    setAdminEmail(ADMIN_CREDENTIALS.email);
                    setAdminPassword(ADMIN_CREDENTIALS.password);
                  }}
                  data-testid="autofill-admin-btn"
                >
                  Auto-Fill Fixed Admin
                </button>
                <div style={{ display: 'flex', gap: '0.5rem' }}>
                  <button
                    type="button"
                    className="btn btn-outline"
                    onClick={() => setShowAdminModal(false)}
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className="btn btn-primary"
                    data-testid="admin-submit-btn"
                  >
                    Login
                  </button>
                </div>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

