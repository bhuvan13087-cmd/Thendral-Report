/**
 * Thendral Wind Turbine Service Report Suite - Enterprise Workspace Controller
 * Features:
 * - Guided Service Report Workspace
 * - Local-First Multi-Report IndexedDB Storage (ThendralReportsDB)
 * - Revision Snapshot Versioning (Edition A -> Edition B)
 * - Global Service Date Synchronization
 * - Zero Empty Photo Cards & High Capacity IndexedDB Photo Persistence
 * - Standalone Self-Contained Execution
 */

// ==========================================
// INDEXEDDB MULTI-REPORT DATABASE ENGINE (30-Day Retention)
// ==========================================
class ThendralReportStore {
  constructor(dbName = 'ThendralWindDB', storeName = 'reports') {
    this.dbName = dbName;
    this.storeName = storeName;
    this.db = null;
  }

  async openDB() {
    if (this.db) return this.db;
    return new Promise((resolve, reject) => {
      const request = indexedDB.open(this.dbName, 3);
      request.onupgradeneeded = (e) => {
        const db = e.target.result;
        if (!db.objectStoreNames.contains(this.storeName)) {
          const store = db.createObjectStore(this.storeName, { keyPath: 'id' });
          store.createIndex('reportId', 'reportId', { unique: false });
          store.createIndex('documentNumber', 'documentNumber', { unique: false });
          store.createIndex('status', 'status', { unique: false });
          store.createIndex('updatedAt', 'updatedAt', { unique: false });
          store.createIndex('expiresAt', 'expiresAt', { unique: false });
        }
      };
      request.onsuccess = (e) => {
        this.db = e.target.result;
        resolve(this.db);
      };
      request.onerror = (e) => reject(e.target.error);
    });
  }

  static sanitizeReportData(data) {
    if (!data) return data;
    const d = data.reportData || data.data || data;
    if (d && d.meta) {
      const addr = d.meta.companyAddress;
      if (!addr || addr === '—' || (typeof addr === 'string' && (addr.includes('Kittampalayam') || addr.includes('Coimbatore') || addr.includes('High Tech Engineering') || addr.includes('641659') || addr.includes('Annur')))) {
        d.meta.companyAddress = 'Thendral Wind Tech LLP Dindigul';
      }
    }
    return data;
  }

  async saveReport(reportRecord) {
    try {
      ThendralReportStore.sanitizeReportData(reportRecord);
      const db = await this.openDB();
      const now = new Date().toISOString();
      const rawData = reportRecord.reportData || reportRecord.data || reportRecord;
      const meta = (rawData && rawData.meta) || {};
      const turb = (rawData && rawData.turbine) || {};
      const gen = (rawData && rawData.generalInfo) || {};

      const id = reportRecord.id || reportRecord.reportId || meta.reportId || `rep_${Date.now()}`;
      const status = reportRecord.status || meta.status || 'In Progress';
      const releasedAt = reportRecord.releasedAt || (status === 'Released' ? (meta.releasedAt || now) : null);

      // Retention calculation: expires 30 days after release or creation
      const baseTime = releasedAt ? new Date(releasedAt).getTime() : (reportRecord.createdAt ? new Date(reportRecord.createdAt).getTime() : Date.now());
      const expiresAt = reportRecord.expiresAt || new Date(baseTime + 30 * 24 * 60 * 60 * 1000).toISOString();

      const normalized = {
        id: id,
        reportId: id,
        documentNumber: reportRecord.documentNumber || meta.reportDocNo || reportRecord.docNo || 'TWT-10826',
        reportIdNumber: reportRecord.reportIdNumber || meta.reportId || id,
        edition: reportRecord.edition || meta.edition || 'A',
        reportDate: reportRecord.reportDate || meta.reportDate || '',
        turbineNumber: reportRecord.turbineNumber || turb.turbineNumber || reportRecord.turbineId || '',
        turbineType: reportRecord.turbineType || turb.turbineType || '',
        gearboxSerialNumber: reportRecord.gearboxSerialNumber || meta.customerSerialNo || '',
        customerName: reportRecord.customerName || gen.customerName || reportRecord.customer || '',
        siteName: reportRecord.siteName || gen.siteName || '',
        status: status,
        createdAt: reportRecord.createdAt || now,
        updatedAt: now,
        releasedAt: releasedAt,
        expiresAt: expiresAt,
        reportData: JSON.parse(JSON.stringify(rawData))
      };

      return new Promise((resolve, reject) => {
        const tx = db.transaction([this.storeName], 'readwrite');
        const store = tx.objectStore(this.storeName);
        store.put(normalized);
        tx.oncomplete = () => resolve(normalized.id);
        tx.onerror = (e) => reject(e.target.error);
      });
    } catch (err) {
      console.warn('Report DB save error:', err);
    }
  }

  async getAllReports() {
    try {
      const db = await this.openDB();
      return new Promise((resolve, reject) => {
        const tx = db.transaction([this.storeName], 'readonly');
        const store = tx.objectStore(this.storeName);
        const req = store.getAll();
        req.onsuccess = () => {
          const list = req.result || [];
          list.forEach(item => ThendralReportStore.sanitizeReportData(item));
          list.sort((a, b) => new Date(b.updatedAt || 0) - new Date(a.updatedAt || 0));
          resolve(list);
        };
        req.onerror = (e) => reject(e.target.error);
      });
    } catch (err) {
      return [];
    }
  }

  async getReportById(id) {
    try {
      const db = await this.openDB();
      return new Promise((resolve, reject) => {
        const tx = db.transaction([this.storeName], 'readonly');
        const store = tx.objectStore(this.storeName);
        const req = store.get(id);
        req.onsuccess = () => {
          const result = req.result || null;
          if (result) ThendralReportStore.sanitizeReportData(result);
          resolve(result);
        };
        req.onerror = (e) => reject(e.target.error);
      });
    } catch (err) {
      return null;
    }
  }

  async deleteReport(id) {
    try {
      const db = await this.openDB();
      return new Promise((resolve, reject) => {
        const tx = db.transaction([this.storeName], 'readwrite');
        const store = tx.objectStore(this.storeName);
        store.delete(id);
        tx.oncomplete = () => resolve(true);
        tx.onerror = (e) => reject(e.target.error);
      });
    } catch (err) {
      console.warn('Report DB delete error:', err);
    }
  }

  async cleanupExpiredReports() {
    try {
      const all = await this.getAllReports();
      const now = Date.now();
      let prunedCount = 0;

      for (const rep of all) {
        if (rep.expiresAt && new Date(rep.expiresAt).getTime() <= now) {
          await this.deleteReport(rep.id);
          prunedCount++;
        }
      }
      return prunedCount;
    } catch (err) {
      console.warn('Cleanup expired reports error:', err);
      return 0;
    }
  }
}

const ReportDB = new ThendralReportStore();
window.ReportDB = ReportDB;
window.ThendralDB = ReportDB;

// ==========================================
// MAIN DASHBOARD APPLICATION CONTROLLER
// ==========================================
class DashboardApp {
  constructor() {
    window.app = this;
    this.currentData = null;
    this.currentReportId = null;
    this.currentSection = 'step-report-asset';
    this.historyFilter = 'all';
    this.historySort = 'latest';
    this.pendingOpenReportId = null;

    this.sections = [
      'step-report-asset',
      'step-technical-inspection',
      'step-finalize-report',
      'step-history',
      'step-users'
    ];

    this.usersSearchQuery = '';
    this.usersRoleFilter = 'all';
    this.usersStatusFilter = 'all';
    this.allCloudUsers = [];

    this.modalCurrentPage = 1;
    this.modalTotalPages = 17;
    this.zoomLevel = 1.0;
    this.saveTimeout = null;
    this.modalPhotoBase64 = null;

    // Live PDF Preview Inline Editing state
    this.isEditPreviewMode = false;
    this.previewSaveTimeout = null;
    this.activePreviewReplacePhotoId = null;

    this.init();
  }

  async init() {
    try {
      // 1. Run 30-day automatic retention cleanup on startup
      const pruned = await ReportDB.cleanupExpiredReports();
      if (pruned > 0) {
        console.log(`Pruned ${pruned} expired report(s) older than 30 days.`);
        setTimeout(() => this.showToast(`Notice: ${pruned} expired report(s) (>30 days) were automatically removed.`), 1500);
      }

      await this.loadInitialData();
      this.renderWorkspace();
      this.renderPreview();
      this.attachGlobalListeners();
      this.updateSectionIndicators();
      this.setupFirebaseIntegration();
      this.updateReportsCountBadge();
    } catch (err) {
      console.error('Error during DashboardApp init:', err);
    }
  }

  // ==========================================
  // FIREBASE CLOUD & AUTHENTICATION INTEGRATION
  // ==========================================
  setupFirebaseIntegration() {
    if (typeof firebaseService !== 'undefined') {
      firebaseService.onAuthStateChanged((user, profile) => {
        this.onAuthStateChanged(user, profile);
      });
    }
  }

  async onAuthStateChanged(user, profile) {
    const landingScreen = document.getElementById('login-landing-screen');
    const workspaceLayout = document.getElementById('workspace-layout');
    const btnAuth = document.getElementById('btn-header-auth');
    const errBox = document.getElementById('login-error-box');
    const submitBtn = document.getElementById('btn-login-submit');

    if (user) {
      this.isAuthenticated = true;
      this.currentUser = user;

      const role = (profile?.role || window.firebaseService?.userProfile?.role || 'admin').toLowerCase();
      const status = (profile?.status || window.firebaseService?.userProfile?.status || 'active').toLowerCase();

      this.userProfile = profile || {
        uid: user.uid,
        email: user.email || '',
        displayName: user.displayName || (user.email ? user.email.split('@')[0] : 'Engineer'),
        role: role,
        status: status,
        organization: 'Thendral Wind Tech LLP Dindigul'
      };

      try {
        document.documentElement.classList.add('session-active');
        localStorage.setItem('thendral_has_session', 'true');
      } catch (e) {}

      const validRoles = ['admin', 'engineer', 'reviewer'];

      // Check for deactivated/inactive status
      if (status === 'inactive') {
        console.warn(`[AUTH_ERROR] User account ${user.email} is marked inactive.`);
        this.isAuthenticated = false;
        try {
          document.documentElement.classList.remove('session-active', 'is-admin');
          localStorage.removeItem('thendral_has_session');
        } catch (e) {}
        if (landingScreen) landingScreen.style.display = 'flex';
        if (workspaceLayout) workspaceLayout.style.display = 'none';
        if (errBox) {
          errBox.innerText = `Account Deactivated: Your account (${user.email}) has been disabled by an administrator.`;
          errBox.style.display = 'flex';
        }
        if (submitBtn) {
          submitBtn.disabled = false;
          submitBtn.innerHTML = `<span>Sign In to Workspace</span> <span class="btn-arrow">→</span>`;
        }
        if (window.firebaseService) {
          window.firebaseService.signOut();
        }
        return;
      }

      if (!validRoles.includes(role)) {
        // Deny access if user role is unauthorized
        console.warn(`[AUTH_ERROR] User role ${role} not in authorized roles list.`);
        this.isAuthenticated = false;
        try {
          document.documentElement.classList.remove('session-active', 'is-admin');
          localStorage.removeItem('thendral_has_session');
        } catch (e) {}
        if (landingScreen) landingScreen.style.display = 'flex';
        if (workspaceLayout) workspaceLayout.style.display = 'none';
        if (errBox) {
          errBox.innerText = `Access Denied: Your account (${user.email}) does not have an authorized role (admin, engineer, reviewer). Please contact your administrator.`;
          errBox.style.display = 'flex';
        }
        if (submitBtn) {
          submitBtn.disabled = false;
          submitBtn.innerHTML = `<span>Sign In to Workspace</span> <span class="btn-arrow">→</span>`;
        }
        if (window.firebaseService) {
          window.firebaseService.signOut();
        }
        return;
      }

      // Apply Role UI privilege classes
      if (role === 'engineer') {
        document.documentElement.classList.remove('is-admin', 'is-reviewer');
        document.documentElement.classList.add('is-engineer');
        try { localStorage.setItem('thendral_cached_role', 'engineer'); } catch(e) {}
      } else if (role === 'reviewer') {
        document.documentElement.classList.remove('is-admin', 'is-engineer');
        document.documentElement.classList.add('is-reviewer');
        try { localStorage.setItem('thendral_cached_role', 'reviewer'); } catch(e) {}
      } else {
        document.documentElement.classList.remove('is-engineer', 'is-reviewer');
        document.documentElement.classList.add('is-admin');
        try { localStorage.setItem('thendral_cached_role', 'admin'); } catch(e) {}
      }

      const displayName = this.userProfile?.displayName || user.displayName || (user.email ? user.email.split('@')[0] : 'Admin');
      const roleLabel = role === 'admin' ? 'Admin' : role === 'reviewer' ? 'Reviewer' : 'Engineer';

      console.log(`[AUTH_09_WORKSPACE_REDIRECT] Unlocking protected workspace for ${displayName} [${roleLabel}]`);

      // Transition from Login Landing Screen to Full Workspace
      if (landingScreen) landingScreen.style.display = 'none';
      if (workspaceLayout) workspaceLayout.style.display = 'flex';

      // Clear any landing hash from URL bar
      if (window.location.hash && window.location.hash.startsWith('#landing')) {
        try {
          history.replaceState(null, '', window.location.pathname);
        } catch (e) {}
      }

      if (submitBtn) {
        submitBtn.disabled = false;
        submitBtn.innerHTML = `<span>Sign In to Workspace</span> <span class="btn-arrow">→</span>`;
      }

      if (btnAuth) {
        btnAuth.className = 'btn btn-outline btn-header-auth-user';
        btnAuth.innerHTML = `
          <span>👤</span>
          <span>${displayName}</span>
          <span class="auth-user-badge-role">${roleLabel}</span>
        `;
      }

      // Load user-scoped persistent active draft from Cloud Firestore / Local Cache
      await this.loadUserScopedActiveDraft(user.uid);

      this.updateCloudSyncBadge('synced');

      // Restore active workspace section across refresh
      const savedSection = sessionStorage.getItem('thendral_active_section');
      const targetSection = (savedSection && savedSection !== 'step-dashboard' && (savedSection !== 'step-users' || role === 'admin')) 
        ? savedSection 
        : 'step-report-asset';
      this.switchSection(targetSection);

      console.log('[AUTH_10_LOGIN_COMPLETE] Workspace successfully initialized on section:', targetSection);
    } else {
      this.isAuthenticated = false;
      this.currentUser = null;
      this.userProfile = null;
      this.currentData = null;
      this.currentReportId = null;

      try {
        document.documentElement.classList.remove('session-active', 'is-admin', 'is-engineer', 'is-reviewer');
        document.body.classList.remove('session-active', 'is-admin', 'is-engineer', 'is-reviewer');
        localStorage.removeItem('thendral_has_session');
        localStorage.removeItem('thendral_cached_role');
        localStorage.removeItem('thendral_active_report_id');
        localStorage.removeItem('thendral_report_draft');
        sessionStorage.removeItem('thendral_active_section');
        history.replaceState(null, '', window.location.pathname);
        window.scrollTo(0, 0);
      } catch (e) {}

      // Transition to Login Landing Screen and guard Workspace
      if (landingScreen) {
        landingScreen.style.display = 'flex';
        landingScreen.scrollTop = 0;
      }
      if (workspaceLayout) workspaceLayout.style.display = 'none';

      // Clear password field and reset submit button
      const passInput = document.getElementById('login-password-input');
      if (passInput) passInput.value = '';
      if (submitBtn) {
        submitBtn.disabled = false;
        submitBtn.innerHTML = `<span>Sign In to Workspace</span> <span class="btn-arrow">→</span>`;
      }

      if (btnAuth) {
        btnAuth.className = 'btn btn-outline font-semibold';
        btnAuth.innerHTML = `<span>🔒</span> <span>Sign In</span>`;
      }
      this.updateCloudSyncBadge('offline');
    }

    this.updateReportsCountBadge();
    if (this.currentSection === 'step-history') {
      this.renderHistorySection();
    }
  }

  // ==========================================
  // CANONICAL LOGIN MODAL CONTROLLER
  // ==========================================
  openLoginModal() {
    const modal = document.getElementById('login-modal');
    if (!modal) return;
    const errBox = document.getElementById('modal-login-error-box');
    const passInput = document.getElementById('modal-login-password');
    if (errBox) errBox.style.display = 'none';
    if (passInput) passInput.value = '';

    modal.classList.add('active');
    try {
      document.body.style.overflow = 'hidden';
    } catch (e) {}

    setTimeout(() => {
      const emailInput = document.getElementById('modal-login-email');
      if (emailInput && !emailInput.value) {
        emailInput.focus();
      } else if (passInput) {
        passInput.focus();
      }
    }, 120);
  }

  closeLoginModal() {
    const modal = document.getElementById('login-modal');
    if (modal) modal.classList.remove('active');
    try {
      document.body.style.overflow = '';
    } catch (e) {}
  }

  async handleModalLoginSubmit(e) {
    if (e) e.preventDefault();
    const emailInput = document.getElementById('modal-login-email');
    const passInput = document.getElementById('modal-login-password');
    const errBox = document.getElementById('modal-login-error-box');
    const submitBtn = document.getElementById('modal-btn-login-submit');

    const email = emailInput ? emailInput.value.trim() : '';
    const password = passInput ? passInput.value : '';

    if (!email || !password) {
      if (errBox) {
        errBox.innerText = 'Please enter your email and password.';
        errBox.style.display = 'flex';
      }
      return;
    }

    if (errBox) errBox.style.display = 'none';
    if (submitBtn) {
      submitBtn.disabled = true;
      submitBtn.innerHTML = `<span class="login-spinner"></span> <span>Authenticating with Firebase...</span>`;
    }

    console.log(`[AUTH_01_MODAL_LOGIN_SUBMIT] Initiating modal login for: ${email}`);

    try {
      if (!window.firebaseService) {
        throw new Error('Firebase Service is not available in this browser session.');
      }

      // 10-second timeout guarantee
      const timeoutPromise = new Promise((_, reject) => 
        setTimeout(() => reject(new Error('Authentication request timed out after 10 seconds. Please check your internet connection.')), 10000)
      );

      const authResult = await Promise.race([
        window.firebaseService.signIn(email, password),
        timeoutPromise
      ]);

      console.log(`[AUTH_03_FIREBASE_AUTH_SUCCESS] Firebase sign-in resolved for UID: ${authResult.user?.uid}`);
      this.closeLoginModal();
      this.showToast('✓ Signed in successfully. Welcome to Thendral Workspace.');

      // Directly unlock workspace immediately
      this.onAuthStateChanged(authResult.user, authResult.profile);
    } catch (err) {
      console.error('[AUTH_ERROR] Firebase Modal Login failed:', err.code, err.message, err);
      if (errBox) {
        let msg = 'Authentication failed. Please check your credentials.';
        if (err.code === 'auth/wrong-password' || err.code === 'auth/user-not-found' || err.code === 'auth/invalid-credential') {
          msg = 'Invalid email or password. Please verify the credentials registered in Firebase Console.';
        } else if (err.code === 'auth/invalid-email') {
          msg = 'Please enter a valid email address.';
        } else if (err.code === 'auth/user-disabled') {
          msg = 'This engineer account has been disabled. Please contact your supervisor.';
        } else if (err.code === 'auth/too-many-requests') {
          msg = 'Too many unsuccessful login attempts. Please wait a moment and try again.';
        } else if (err.message) {
          msg = err.message;
        }
        errBox.innerText = msg;
        errBox.style.display = 'flex';
      }
    } finally {
      if (submitBtn) {
        submitBtn.disabled = false;
        submitBtn.innerHTML = `<span>Sign In to Workspace</span> <span class="btn-arrow">→</span>`;
      }
    }
  }

  // ==========================================
  // LOGIN LANDING PAGE CONTROLLER
  // ==========================================
  togglePasswordVisibility(inputId = 'login-password-input', btnId = 'btn-toggle-login-pass') {
    const input = document.getElementById(inputId);
    const btn = document.getElementById(btnId);
    if (!input) return;
    if (input.type === 'password') {
      input.type = 'text';
      if (btn) {
        btn.innerHTML = `
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
            <path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19m-6.72-1.07a3 3 0 1 1-4.24-4.24"></path>
            <line x1="1" y1="1" x2="23" y2="23"></line>
          </svg>
        `;
        btn.title = "Hide password";
      }
    } else {
      input.type = 'password';
      if (btn) {
        btn.innerHTML = `
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
            <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"></path>
            <circle cx="12" cy="12" r="3"></circle>
          </svg>
        `;
        btn.title = "Show password";
      }
    }
  }

  async handleLandingLoginSubmit(e) {
    if (e) e.preventDefault();
    const emailInput = document.getElementById('login-email-input');
    const passInput = document.getElementById('login-password-input');
    const errBox = document.getElementById('login-error-box');
    const submitBtn = document.getElementById('btn-login-submit');

    const email = emailInput ? emailInput.value.trim() : '';
    const password = passInput ? passInput.value : '';

    if (!email || !password) {
      if (errBox) {
        errBox.innerText = 'Please enter your email and password.';
        errBox.style.display = 'flex';
      }
      return;
    }

    if (errBox) errBox.style.display = 'none';
    if (submitBtn) {
      submitBtn.disabled = true;
      submitBtn.innerHTML = `<span class="login-spinner"></span> <span>Authenticating with Firebase...</span>`;
    }

    console.log(`[AUTH_01_LOGIN_SUBMIT] Initiating login for: ${email}`);

    try {
      if (!window.firebaseService) {
        throw new Error('Firebase Service is not available in this browser session.');
      }

      // 10-second timeout guarantee
      const timeoutPromise = new Promise((_, reject) => 
        setTimeout(() => reject(new Error('Authentication request timed out after 10 seconds. Please check your internet connection.')), 10000)
      );

      const authResult = await Promise.race([
        window.firebaseService.signIn(email, password),
        timeoutPromise
      ]);

      console.log(`[AUTH_03_FIREBASE_AUTH_SUCCESS] Firebase sign-in resolved for UID: ${authResult.user?.uid}`);
      this.showToast('✓ Signed in successfully. Welcome to Thendral Workspace.');

      // Directly unlock workspace immediately
      this.onAuthStateChanged(authResult.user, authResult.profile);
    } catch (err) {
      console.error('[AUTH_ERROR] Firebase Login failed:', err.code, err.message, err);
      if (errBox) {
        let msg = 'Authentication failed. Please check your credentials.';
        if (err.code === 'auth/wrong-password' || err.code === 'auth/user-not-found' || err.code === 'auth/invalid-credential') {
          msg = 'Invalid email or password. Please verify the credentials registered in Firebase Console.';
        } else if (err.code === 'auth/invalid-email') {
          msg = 'Please enter a valid email address.';
        } else if (err.code === 'auth/user-disabled') {
          msg = 'This engineer account has been disabled. Please contact your supervisor.';
        } else if (err.code === 'auth/too-many-requests') {
          msg = 'Too many unsuccessful login attempts. Please wait a moment and try again.';
        } else if (err.code === 'auth/network-request-failed') {
          msg = 'Network connection failure. Please check your internet connection.';
        } else if (err.code === 'auth/operation-not-allowed') {
          msg = 'Email/Password authentication provider is disabled. Please enable Email/Password under Firebase Console → Authentication → Sign-in method.';
        } else if (err.message) {
          msg = `Authentication error (${err.code || 'unknown'}): ${err.message}`;
        }
        errBox.innerText = msg;
        errBox.style.display = 'flex';
      }
    } finally {
      if (submitBtn) {
        submitBtn.disabled = false;
        submitBtn.innerHTML = `<span>Sign In to Workspace</span> <span class="btn-arrow">→</span>`;
      }
    }
  }

  updateCloudSyncBadge(status = 'synced') {
    const pill = document.getElementById('header-cloud-pill');
    const icon = document.getElementById('header-cloud-icon');
    const text = document.getElementById('header-cloud-text');
    if (!pill || !text) return;

    if (status === 'synced' && window.firebaseService?.currentUser) {
      pill.className = 'cloud-sync-pill';
      if (icon) icon.innerText = '☁️';
      text.innerText = 'Cloud Synced';
      pill.title = 'Reports are actively synchronized with Cloud Firestore';
    } else if (status === 'syncing') {
      pill.className = 'cloud-sync-pill syncing';
      if (icon) icon.innerText = '🔄';
      text.innerText = 'Syncing...';
    } else {
      pill.className = 'cloud-sync-pill offline';
      if (icon) icon.innerText = '📱';
      text.innerText = 'Local Storage';
      pill.title = 'Operating in offline local cache mode (IndexedDB)';
    }
  }

  // ==========================================
  // USER-SCOPED PERSISTENT DRAFT CONTROLLER
  // ==========================================
  async loadUserScopedActiveDraft(uid) {
    if (!uid) return;

    console.log(`[DRAFT_01_USER_QUERY] Querying persistent active draft for UID: ${uid}`);
    let loadedData = null;
    let loadedId = null;

    // 1. Query Cloud Firestore for user's latest in-progress draft
    if (window.firebaseService && window.firebaseService.isOnline && typeof window.firebaseService.getUserLatestDraftFromCloud === 'function') {
      try {
        const cloudDraft = await window.firebaseService.getUserLatestDraftFromCloud(uid);
        if (cloudDraft && (cloudDraft.reportData || cloudDraft.data)) {
          loadedId = cloudDraft.id || cloudDraft.reportId;
          loadedData = cloudDraft.reportData || cloudDraft.data;
          console.log(`[DRAFT_02_FIRESTORE_RESTORE] Restored draft ${loadedId} from Firestore for UID: ${uid}`);
        }
      } catch (cloudErr) {
        console.warn('[DRAFT_FIRESTORE_QUERY_WARN] Firestore draft query fallback:', cloudErr);
      }
    }

    // 2. Fallback to user-scoped localStorage draft cache
    if (!loadedData) {
      const userCachedId = localStorage.getItem(`thendral_active_report_id_${uid}`);
      if (userCachedId) {
        const record = await ReportDB.getReportById(userCachedId);
        if (record && (record.reportData || record.data) && (record.createdByUid === uid || !record.createdByUid)) {
          loadedId = record.id;
          loadedData = record.reportData || record.data;
          console.log(`[DRAFT_03_LOCAL_CACHE_RESTORE] Restored draft from user-scoped IndexedDB: ${loadedId}`);
        }
      }
      if (!loadedData) {
        const userDraftJson = localStorage.getItem(`thendral_report_draft_${uid}`);
        if (userDraftJson) {
          try {
            const parsed = JSON.parse(userDraftJson);
            if (parsed && (parsed.createdByUid === uid || !parsed.createdByUid)) {
              loadedData = parsed;
              loadedId = parsed.meta?.reportId || `rep_${Date.now()}`;
              console.log(`[DRAFT_04_LOCAL_JSON_RESTORE] Restored draft from user-scoped localStorage for UID: ${uid}`);
            }
          } catch (e) {}
        }
      }
    }

    // 3. If no draft exists for this user, generate a pristine clean blank report
    if (!loadedData) {
      console.log(`[DRAFT_05_CLEAN_INIT] Initializing fresh clean blank report for UID: ${uid}`);
      loadedData = JSON.parse(JSON.stringify(SAMPLE_REPORTS.clean_blank_report));
      const allReps = await ReportDB.getAllReports();
      const newDocNo = ReportIdManager.generateDocumentNumber(new Date(), allReps);
      const newReportId = ReportIdManager.generateInternalReportId();

      if (!loadedData.meta) loadedData.meta = {};
      loadedData.meta.reportDocNo = newDocNo;
      loadedData.meta.reportId = newReportId;
      loadedData.meta.edition = 'A';
      loadedData.meta.status = 'Draft';
      loadedData.meta.reportDate = this.getTodayDateFormatted();
      loadedData.createdByUid = uid;
      loadedId = newReportId;
    }

    // 4. Attach creator metadata and user name & ensure immutable Report Document Number
    if (!loadedData.meta) loadedData.meta = {};
    const docNo = (loadedData.meta.reportDocNo && loadedData.meta.reportDocNo.trim() !== '' && loadedData.meta.reportDocNo !== '—')
      ? loadedData.meta.reportDocNo
      : (loadedData.documentNumber || cloudDraft?.documentNumber || cloudDraft?.metadata?.reportDocNo || 'TWT-10826');
    loadedData.meta.reportDocNo = docNo;
    loadedData.documentNumber = docNo;

    const displayName = this.userProfile?.displayName || this.currentUser?.displayName || (this.currentUser?.email ? this.currentUser.email.split('@')[0] : 'Engineer');
    if (!loadedData.meta.preparedBy || loadedData.meta.preparedBy === '—') {
      loadedData.meta.preparedBy = displayName;
    }
    if (!loadedData.generalInfo) loadedData.generalInfo = {};
    if (!loadedData.generalInfo.serviceEngineer || loadedData.generalInfo.serviceEngineer === '—') {
      loadedData.generalInfo.serviceEngineer = displayName;
    }
    if (!loadedData.generalInfo.inspectorName || loadedData.generalInfo.inspectorName === '—') {
      loadedData.generalInfo.inspectorName = displayName;
    }
    if (!loadedData.generalInfo.inspector || loadedData.generalInfo.inspector === '—') {
      loadedData.generalInfo.inspector = displayName;
    }

    loadedData.createdByUid = uid;
    this.currentReportId = loadedId;
    this.currentData = loadedData;

    // 5. Merge any locally cached photo blobs from PhotoDB
    try {
      const localPhotos = await PhotoDB.getAllPhotos();
      if (Array.isArray(localPhotos) && localPhotos.length > 0) {
        const localMap = new Map(localPhotos.map(p => [p.id || p.photoId, p]));
        (this.currentData.photos || []).forEach(p => {
          const key = p.photoId || p.id;
          if (key && localMap.has(key)) {
            const cached = localMap.get(key);
            if (cached && cached.url && (!p.url || p.url.trim().length === 0)) {
              p.url = cached.url;
            }
          }
        });
      }
    } catch (e) {
      console.warn('Local PhotoDB merge notice:', e);
    }

    // 6. Cache user-scoped keys
    try {
      localStorage.setItem(`thendral_active_report_id_${uid}`, this.currentReportId);
      localStorage.setItem(`thendral_report_draft_${uid}`, JSON.stringify(this.currentData));
    } catch (e) {}

    ThendralReportStore.sanitizeReportData(this.currentData);
    PhotoManager.populateSamplePhotos(this.currentData);

    // 7. Render UI
    this.renderWorkspace();
    this.renderPreview();
    this.updateSectionIndicators();
  }

  async loadInitialData() {
    // Basic startup fallback before authentication resolves
    const saved = localStorage.getItem('thendral_report_draft');
    if (saved && !this.currentData) {
      try {
        this.currentData = JSON.parse(saved);
      } catch (e) {}
    }

    if (!this.currentData) {
      this.currentData = JSON.parse(JSON.stringify(SAMPLE_REPORTS.clean_blank_report));
    }

    if (!this.currentData.signatures) {
      this.currentData.signatures = { engineerSigUrl: '', reviewerSigUrl: '' };
    }

    if (!this.currentData.meta) this.currentData.meta = {};
    if (!this.currentData.meta.reportDocNo) {
      const allReps = await ReportDB.getAllReports();
      this.currentData.meta.reportDocNo = ReportIdManager.generateDocumentNumber(new Date(), allReps);
    }
    if (!this.currentData.meta.reportId) {
      this.currentData.meta.reportId = ReportIdManager.generateInternalReportId();
    }

    if (!this.currentReportId) {
      this.currentReportId = this.currentData.meta.reportId || `rep_${this.currentData.meta.reportDocNo}_${this.currentData.meta.edition || 'A'}`;
    }

    ThendralReportStore.sanitizeReportData(this.currentData);
    PhotoManager.populateSamplePhotos(this.currentData);
  }

  saveDraftToLocalStorage(data, uid = null) {
    if (!data) return;
    try {
      const json = JSON.stringify(data);
      if (uid) {
        localStorage.setItem(`thendral_active_report_id_${uid}`, this.currentReportId);
        localStorage.setItem(`thendral_report_draft_${uid}`, json);
      }
      localStorage.setItem('thendral_active_report_id', this.currentReportId);
      localStorage.setItem('thendral_report_draft', json);
    } catch (quotaErr) {
      // If full data with many heavy base64 images exceeds localStorage 5MB domain quota,
      // store a lightweight draft in localStorage (stripping heavy base64 payloads).
      // The full high-res report and unlimited photos are ALWAYS safely persisted in IndexedDB (ReportDB & PhotoDB).
      try {
        const lightweight = JSON.parse(JSON.stringify(data));
        if (Array.isArray(lightweight.photos)) {
          lightweight.photos = lightweight.photos.map(p => {
            if (p && p.url && typeof p.url === 'string' && p.url.startsWith('data:image')) {
              return { ...p, url: '' };
            }
            return p;
          });
        }
        const lightweightJson = JSON.stringify(lightweight);
        if (uid) {
          localStorage.setItem(`thendral_active_report_id_${uid}`, this.currentReportId);
          localStorage.setItem(`thendral_report_draft_${uid}`, lightweightJson);
        }
        localStorage.setItem('thendral_active_report_id', this.currentReportId);
        localStorage.setItem('thendral_report_draft', lightweightJson);
      } catch (innerErr) {
        console.warn('localStorage draft cache quota full; primary persistence active in IndexedDB.');
      }
    }
  }

  async syncActiveReportToDB(status = null) {
    if (!this.currentData) return;
    const meta = this.currentData.meta || {};
    const turb = this.currentData.turbine || {};
    const gen = this.currentData.generalInfo || {};
    const uid = this.currentUser?.uid || this.currentData.createdByUid;

    const record = {
      id: this.currentReportId,
      reportId: this.currentReportId,
      documentNumber: meta.reportDocNo || 'TWT-10826',
      reportIdNumber: meta.reportId || this.currentReportId,
      edition: meta.edition || 'A',
      turbineNumber: turb.turbineNumber || '',
      turbineType: turb.turbineType || '',
      gearboxSerialNumber: meta.customerSerialNo || turb.padNumber || '',
      customerName: gen.customerName || '',
      siteName: gen.siteName || '',
      reportDate: meta.reportDate || '',
      status: status || meta.status || 'Draft',
      createdByUid: uid,
      updatedByUid: uid,
      updatedAt: new Date().toISOString(),
      reportData: this.currentData
    };

    // 1. Always save to local IndexedDB fallback and user-scoped storage
    await ReportDB.saveReport(record);
    this.saveDraftToLocalStorage(this.currentData, uid);

    // 2. Cloud Firestore Sync (if user is authenticated)
    if (window.firebaseService && window.firebaseService.currentUser && window.firebaseService.isOnline) {
      try {
        this.updateCloudSyncBadge('syncing');
        await window.firebaseService.saveReportToCloud(record);
        this.updateCloudSyncBadge('synced');
      } catch (err) {
        console.warn('Cloud Firestore sync notice (saved to local IndexedDB):', err);
        this.updateCloudSyncBadge('offline');
      }
    }

    this.updateReportsCountBadge();
  }

  saveCurrentReport(showConfirm = false) {
    if (showConfirm) {
      this.promptSaveConfirmation();
    } else {
      this.executeConfirmedSave();
    }
  }

  promptSaveConfirmation() {
    this.syncFormToCurrentData();
    const meta = (this.currentData && this.currentData.meta) || {};
    const turb = (this.currentData && this.currentData.turbine) || {};

    const docNo = meta.reportDocNo || 'TWT-10826';
    const turbineNo = turb.turbineNumber || '—';
    const status = meta.status || 'Draft';

    const setTxt = (id, val) => {
      const el = document.getElementById(id);
      if (el) el.innerText = val;
    };

    setTxt('save-modal-doc-no', docNo);
    setTxt('save-modal-turbine', turbineNo);
    setTxt('save-modal-status', status);

    const modal = document.getElementById('save-confirm-modal');
    if (modal) modal.classList.add('active');
  }

  closeSaveModal() {
    const modal = document.getElementById('save-confirm-modal');
    if (modal) modal.classList.remove('active');
  }

  async executeConfirmedSave() {
    this.closeSaveModal();
    this.setSaveStatus('saving');
    this.syncFormToCurrentData();
    try {
      await this.syncActiveReportToDB();
      this.setSaveStatus('saved');
      this.renderPreview();
      if (this.currentSection === 'step-history') {
        this.renderHistorySection();
      }
      this.showToast('✓ Report successfully saved to Cloud Firestore & Local Storage.');
    } catch (err) {
      console.error('[REPORT_SAVE_ERROR]', err);
      this.setSaveStatus('unsaved');
      this.showToast(`⚠️ Save Notice: ${err.message || 'Saved to Local Storage'}`);
    }
  }

  async updateReportsCountBadge() {
    let count = 0;
    if (window.firebaseService && window.firebaseService.currentUser && window.firebaseService.isOnline) {
      try {
        const cloudReports = await window.firebaseService.getAllReportsFromCloud();
        count = cloudReports.length;
      } catch (e) {
        const local = await ReportDB.getAllReports();
        count = local.length;
      }
    } else {
      const local = await ReportDB.getAllReports();
      count = local.length;
    }

    const countEl = document.getElementById('header-reports-count');
    if (countEl) {
      countEl.innerText = count || 0;
    }
    const badgeHistory = document.getElementById('badge-step-history');
    if (badgeHistory) {
      badgeHistory.innerText = `${count || 0} Saved`;
    }
  }

  // ==========================================
  // SECTION SWITCHING & NAVIGATION STEPPER
  // ==========================================
  toggleSidebar() {
    const sidebar = document.getElementById('app-sidebar');
    const backdrop = document.getElementById('sidebar-backdrop');
    if (sidebar) sidebar.classList.toggle('mobile-open');
    if (backdrop) backdrop.classList.toggle('active');
  }

  closeSidebar() {
    const sidebar = document.getElementById('app-sidebar');
    const backdrop = document.getElementById('sidebar-backdrop');
    if (sidebar) sidebar.classList.remove('mobile-open');
    if (backdrop) backdrop.classList.remove('active');
  }

  switchSection(sectionId) {
    // Unauthenticated Navigation Guard
    if (!this.isAuthenticated && !window.firebaseService?.currentUser) {
      const landingScreen = document.getElementById('login-landing-screen');
      const workspaceLayout = document.getElementById('workspace-layout');
      if (landingScreen) landingScreen.style.display = 'flex';
      if (workspaceLayout) workspaceLayout.style.display = 'none';
      return;
    }

    const SECTION_MAP = {
      'step-report-asset': { target: 'step-report-asset', anchor: null },
      'step-report-details': { target: 'step-report-asset', anchor: 'card-report-details' },
      'step-job-turbine': { target: 'step-report-asset', anchor: 'card-customer-site' },
      'step-technical-inspection': { target: 'step-technical-inspection', anchor: null },
      'step-lubrication': { target: 'step-technical-inspection', anchor: 'card-lubrication' },
      'step-bearings': { target: 'step-technical-inspection', anchor: 'card-bearings' },
      'step-gears': { target: 'step-technical-inspection', anchor: 'card-gears' },
      'step-inspections': { target: 'step-technical-inspection', anchor: 'card-inspections' },
      'step-finalize-report': { target: 'step-finalize-report', anchor: null },
      'step-photos': { target: 'step-finalize-report', anchor: 'card-photos' },
      'step-findings-signoff': { target: 'step-finalize-report', anchor: 'card-findings-signoff' },
      'step-review-release': { target: 'step-finalize-report', anchor: 'card-review-release' },
      'step-appendix': { target: 'step-finalize-report', anchor: 'card-appendix' },
      'step-history': { target: 'step-history', anchor: 'step-history' },
      'step-users': { target: 'step-users', anchor: null }
    };

    const resolved = SECTION_MAP[sectionId] || { target: sectionId, anchor: null };

    // Admin Access Security Guard for User Management
    if (resolved.target === 'step-users') {
      const userRole = (this.userProfile?.role || window.firebaseService?.userProfile?.role || 'engineer').toLowerCase();
      if (userRole !== 'admin') {
        this.showToast('⚠️ Access Denied: Administrator privileges required.');
        if (this.currentSection === 'step-users') {
          this.switchSection('step-report-asset');
        }
        return;
      }
    }

    const targetSectionId = this.sections.includes(resolved.target) ? resolved.target : this.sections[0];
    this.currentSection = targetSectionId;
    try {
      sessionStorage.setItem('thendral_active_section', targetSectionId);
    } catch (e) {
      // sessionStorage catch
    }

    // Close mobile drawer if open
    this.closeSidebar();

    // Toggle Section visibility
    document.querySelectorAll('.workspace-section').forEach(sec => {
      sec.classList.remove('active');
    });
    const target = document.getElementById(targetSectionId);
    if (target) {
      target.classList.add('active');
      if (resolved.anchor) {
        const anchorEl = document.getElementById(resolved.anchor);
        if (anchorEl) {
          setTimeout(() => {
            anchorEl.scrollIntoView({ behavior: 'smooth', block: 'start' });
          }, 50);
        } else {
          window.scrollTo({ top: 0, behavior: 'smooth' });
        }
      } else {
        window.scrollTo({ top: 0, behavior: 'smooth' });
      }
    }

    // Update Navigation item active classes
    document.querySelectorAll('.nav-step-item').forEach(item => {
      item.classList.remove('active');
    });
    const exactNav = document.getElementById(`nav-${sectionId}`);
    const parentNav = document.getElementById(`nav-${targetSectionId}`);
    if (exactNav) {
      exactNav.classList.add('active');
    } else if (parentNav) {
      parentNav.classList.add('active');
    }

    // Update Bottom Navigation Stepper
    this.updateBottomStepper();
    this.updateSectionIndicators();

    // If switching to Finalize section, History, or Users, trigger corresponding renderers
    if (targetSectionId === 'step-finalize-report') {
      this.renderReviewSection();
    } else if (targetSectionId === 'step-history') {
      this.renderHistorySection();
    } else if (targetSectionId === 'step-users') {
      this.renderUsersSection();
    }
  }

  nextSection() {
    const currentIndex = this.sections.indexOf(this.currentSection);
    if (currentIndex < this.sections.length - 2) {
      this.switchSection(this.sections[currentIndex + 1]);
    } else if (this.currentSection === 'step-finalize-report') {
      this.openReleaseModal();
    } else if (this.currentSection === 'step-history') {
      this.createNewCleanReport();
    }
  }

  prevSection() {
    const currentIndex = this.sections.indexOf(this.currentSection);
    if (currentIndex > 0) {
      this.switchSection(this.sections[currentIndex - 1]);
    }
  }

  updateBottomStepper() {
    const currentIndex = this.sections.indexOf(this.currentSection);
    const indicator = document.getElementById('bottom-step-indicator');
    const prevBtn = document.getElementById('btn-step-prev');
    const nextBtn = document.getElementById('btn-step-next');

    const titles = {
      'step-report-asset': 'Stage 01 • Report & Asset Information',
      'step-technical-inspection': 'Stage 02 • Technical Inspection',
      'step-finalize-report': 'Stage 03 • Findings, Evidence & Final Report',
      'step-history': 'Archive • Saved Reports History',
      'step-users': 'Admin • User & Team Management'
    };

    if (indicator) {
      if (this.currentSection === 'step-history' || this.currentSection === 'step-users') {
        indicator.innerText = titles[this.currentSection] || '';
      } else {
        const stageNum = currentIndex + 1; // 1, 2, 3
        indicator.innerText = `Stage ${stageNum} of 3 • ${titles[this.currentSection] || ''}`;
      }
    }

    if (prevBtn) {
      prevBtn.style.visibility = currentIndex === 0 ? 'hidden' : 'visible';
    }

    if (nextBtn) {
      if (this.currentSection === 'step-finalize-report') {
        nextBtn.innerHTML = `✓ Official Release →`;
      } else if (this.currentSection === 'step-history') {
        nextBtn.innerHTML = `+ New Report →`;
      } else if (this.currentSection === 'step-users') {
        nextBtn.innerHTML = `+ Create User →`;
      } else {
        nextBtn.innerHTML = `Save & Continue →`;
      }
    }
  }

  // ==========================================
  // RENDER WORKSPACE STATE & DATA BINDINGS
  // ==========================================
  renderWorkspace() {
    const data = this.currentData || {};
    if (!data.meta) data.meta = {};
    const meta = data.meta;
    const gen = data.generalInfo || {};
    const turb = data.turbine || {};
    const lub = data.lubrication || {};
    const sum = data.summary || {};

    // Ensure Report Document Number is resolved and never blank
    const docNo = (meta.reportDocNo && meta.reportDocNo.trim() !== '' && meta.reportDocNo !== '—')
      ? meta.reportDocNo
      : (data.documentNumber || 'TWT-10826');
    meta.reportDocNo = docNo;
    data.documentNumber = docNo;

    // 1. Header Badges & Identity
    this.setElValue('hdr-report-no', docNo);
    this.setElValue('hdr-turbine-id', turb.turbineNumber || '—');

    const statusBadge = document.getElementById('hdr-status-badge');
    if (statusBadge) {
      const st = meta.status || 'Draft';
      statusBadge.innerText = st;
      statusBadge.className = `report-lifecycle-badge ${st === 'Released' ? 'badge-released' : st === 'Draft' ? 'badge-draft' : 'badge-in-progress'}`;
    }

    // 2. Global Service Date Input
    const reportDate = meta.reportDate || gen.reportDate || '';
    this.setElValue('f-report-date-calendar', this.formatDateToISO(reportDate));

    // 3. Section 1: Report Details Inputs
    const prepBy = meta.preparedBy || gen.serviceEngineer || gen.inspectorName || gen.inspector || '';
    const relBy = meta.releasedBy || gen.reviewer || gen.reportReviewer || '';

    this.setElValue('f-doc-no', docNo);
    this.setElValue('rev-doc-no', docNo);
    this.setElValue('save-modal-doc-no', docNo);
    this.setElValue('f-meta-prepared', prepBy);
    this.setElValue('f-meta-released', relBy);
    this.setElValue('f-gearbox-nameplate', meta.gearboxPartNo || '');

    // 4. Section 2: Customer, Job & Turbine Specs
    this.setElValue('f-intervention-type', gen.interventionType || '');
    this.setElValue('f-customer-name', gen.customerName || '');
    this.setElValue('f-site-name', gen.siteName || '');
    this.setElValue('f-country', gen.country || '');
    this.setElValue('f-service-engineer', prepBy);
    this.setElValue('f-report-reviewer', relBy);
    this.setElValue('f-qs-notif', gen.qsNotification || '');
    this.setElValue('f-start-date-calendar', this.formatDateToISO(gen.startDate || gen.interventionStartDate || ''));
    this.setElValue('f-end-date-calendar', this.formatDateToISO(gen.endDate || gen.interventionEndDate || ''));

    this.setElValue('f-turbine-num', turb.turbineNumber || '');
    this.setElValue('f-pad-num', turb.padNumber || '');
    this.setElValue('f-turbine-type', turb.turbineType || '');
    this.setElValue('f-gearbox-part', meta.gearboxPartNo || '');
    this.setElValue('f-cust-serial', meta.customerSerialNo || '');
    this.setElValue('f-comm-date-calendar', this.formatDateToISO(turb.commissioningDate || ''));
    this.setElValue('f-prod-kwh', turb.totalProductionKwh || '');
    this.setElValue('f-run-hours', turb.runHours || '');
    this.setElValue('f-gen-name', turb.gen1Manufacturer || '');
    this.setElValue('f-turb-location', turb.turbineLocationType || '');
    this.setElValue('f-turb-logbook', turb.turbineLogbook || '');
    this.setElValue('f-status-before', turb.runStatusBefore || '');
    this.setElValue('f-status-arrival', turb.runStatusUponArrival || '');
    this.setElValue('f-status-after', turb.runStatusAfter || '');
    this.setElValue('f-cust-reported-status', turb.customerReportedStatus || '');
    this.setElValue('f-complaint-cat', gen.complaintCategory || '');
    this.setElValue('f-complaint-sev', gen.complaintSeverity || '');
    this.setElValue('f-scada-alarm', gen.scadaAlarmCode || '');
    this.setElValue('f-complaint-date-calendar', this.formatDateToISO(gen.complaintReportedDate || ''));
    this.setElValue('f-complaint', gen.customerComplaint || '');

    this.setElValue('f-work-status', gen.workExecutionStatus || '');
    this.setElValue('f-handover-clearance', gen.handoverClearance || '');
    this.setElValue('f-work-scope-cat', gen.workScopeCategory || '');
    this.setElValue('f-work-comp-date', this.formatDateToISO(gen.workCompletionDate || ''));
    this.setElValue('f-work-performed', gen.workPerformed || '');

    // 5. Section 3: Lubrication Inputs
    this.setElValue('f-oil-type', lub.gearboxOilType || '');
    this.setElValue('f-oil-level', lub.oilLevelAtInspection || '');
    this.setElValue('f-oil-cond', lub.oilCondition || '');
    this.setElValue('f-oil-cooler', lub.oilCoolerFunction || '');
    this.setElValue('f-debris-magnet', lub.debrisOnMagnet || '');
    this.setElValue('f-debris-filter', lub.debrisInFilter || '');
    this.setElValue('f-vibrations', lub.vibrations || '');
    this.setElValue('f-noise', lub.noise || '');
    this.setElValue('f-align-remarks', lub.remarksAlignment || '');
    this.setElValue('f-other-detection-oil', lub.otherDetectionOil || '');
    this.setElValue('f-last-oil-calendar', this.formatDateToISO(lub.dateLastOilChange || ''));
    this.setElValue('f-last-filter-calendar', this.formatDateToISO(lub.dateLastFilterChange || ''));
    this.setElValue('f-last-align-calendar', this.formatDateToISO(lub.dateLastAlignment || ''));

    // 6. Section 4: Work Scope Checklist
    this.renderWorkList();

    // 7. Section 5: Bearing Health Matrix Table
    this.renderBearingsTable();

    // 8. Section 6: Gear Health Matrix Table & Aux Tables
    this.renderGearsTable();
    this.renderAuxiliaryTables();

    // 9. Section 6 (New): Custom / Subsystem Inspection Table
    this.renderCustomInspectionsTable();

    // 9. Section 7: Photo Evidence Hub & Section Photo Strips
    this.renderSectionPhotos();
    this.renderPhotoGrid();

    // 10. Section 8: Summary & Signatures
    this.setElValue('f-bearing-remarks', data.bearingRemarks || '');
    this.setElValue('f-gear-remarks', data.gearRemarks || '');
    this.setElValue('f-summary-text', sum.summaryText || '');
    this.setElValue('f-rec-gearbox', sum.gearboxRecommendation || '');
    this.setElValue('f-further-jobs', sum.furtherJobs || '');
    this.setElValue('f-rec-oil', sum.lubricantRecommendation || '');
    this.setElValue('f-remarks', sum.generalRemarks || '');

    this.setElValue('sig-engineer-name', meta.preparedBy || gen.inspector || gen.inspectorName || '');
    this.setElValue('sig-reviewer-name', meta.releasedBy || gen.reviewer || gen.reportReviewer || '');

    this.renderSignaturesUI();

    // 11. Section 9: Review Section
    this.renderReviewSection();
    this.updateSectionIndicators();
  }

  setElValue(id, val) {
    const el = document.getElementById(id);
    if (!el) return;
    const safeVal = val !== undefined && val !== null ? val : '';
    if (el.tagName === 'SELECT') {
      if (safeVal) {
        let hasOpt = Array.from(el.options).some(opt => opt.value === safeVal);
        if (!hasOpt) {
          const newOpt = document.createElement('option');
          newOpt.value = safeVal;
          newOpt.text = safeVal;
          el.appendChild(newOpt);
        }
      }
      el.value = safeVal;
    } else if (el.tagName === 'INPUT' || el.tagName === 'TEXTAREA') {
      el.value = safeVal;
    } else {
      el.innerText = safeVal;
    }
  }

  // ==========================================
  // GLOBAL SERVICE / INSPECTION DATE SYSTEM
  // ==========================================
  onGlobalDateChange(isoVal) {
    if (!isoVal) return;
    const stdDate = this.formatDateToStandard(isoVal);

    if (!this.currentData.meta) this.currentData.meta = {};
    if (!this.currentData.generalInfo) this.currentData.generalInfo = {};
    if (!this.currentData.summary) this.currentData.summary = {};

    // Synchronize to all primary date locations
    this.currentData.meta.reportDate = stdDate;
    this.currentData.generalInfo.reportDate = stdDate;
    this.currentData.generalInfo.startDate = stdDate;
    this.currentData.generalInfo.endDate = stdDate;
    this.currentData.generalInfo.interventionStartDate = stdDate;
    this.currentData.generalInfo.interventionEndDate = stdDate;
    this.currentData.summary.signDate = stdDate;

    // Update DOM inputs
    this.setElValue('f-report-date-calendar', isoVal);
    this.setElValue('f-start-date-calendar', isoVal);
    this.setElValue('f-end-date-calendar', isoVal);
    this.setElValue('rev-date', stdDate);

    this.debouncedSaveAndRender();
    this.showToast(`📅 Master Report Date synchronized to ${stdDate}`);
  }

  setTodayAsGlobalDate() {
    const todayISO = this.getTodayDateISO();
    this.onGlobalDateChange(todayISO);
  }

  onDirectDateChange(dataPath, isoValue) {
    if (!isoValue) return;
    const stdDate = this.formatDateToStandard(isoValue);
    this.setObjectPath(this.currentData, dataPath, stdDate);
    this.debouncedSaveAndRender();
  }

  formatDateToStandard(isoDate) {
    if (!isoDate) return '';
    if (isoDate.includes('.')) return isoDate; // Already DD.MM.YYYY
    const parts = isoDate.split('-');
    if (parts.length === 3) {
      return `${parts[2]}.${parts[1]}.${parts[0]}`;
    }
    return isoDate;
  }

  formatDateToISO(stdDate) {
    if (!stdDate) return '';
    if (stdDate.includes('-') && stdDate.split('-')[0].length === 4) return stdDate; // Already YYYY-MM-DD
    const parts = stdDate.split('.');
    if (parts.length === 3) {
      return `${parts[2]}-${parts[1]}-${parts[0]}`;
    }
    return stdDate;
  }

  getTodayDateFormatted() {
    const now = new Date();
    return `${String(now.getDate()).padStart(2,'0')}.${String(now.getMonth()+1).padStart(2,'0')}.${now.getFullYear()}`;
  }

  getTodayDateISO() {
    const now = new Date();
    return `${now.getFullYear()}-${String(now.getMonth()+1).padStart(2,'0')}-${String(now.getDate()).padStart(2,'0')}`;
  }

  // ==========================================
  // HISTORY & LOCAL ARCHIVE CONTROLLER (30-Day Retention)
  // ==========================================
  async renderHistorySection() {
    // 1. Run 30-day automatic retention cleanup
    const pruned = await ReportDB.cleanupExpiredReports();
    if (pruned > 0) {
      this.showToast(`Notice: ${pruned} expired report(s) (>30 days) were automatically removed.`);
    }

    const container = document.getElementById('history-cards-container');
    if (!container) return;

    let reports = [];
    let isCloudActive = false;

    // 2. Fetch from Cloud Firestore if authenticated & online (Single Source of Truth)
    if (window.firebaseService && window.firebaseService.currentUser && window.firebaseService.isOnline) {
      try {
        const cloudReports = await window.firebaseService.getAllReportsFromCloud();
        reports = Array.isArray(cloudReports) ? cloudReports : [];
        isCloudActive = true;
      } catch (err) {
        console.warn('Cloud reports query error, fallback to local storage:', err);
        reports = await ReportDB.getAllReports();
      }
    } else {
      reports = await ReportDB.getAllReports();
    }

    // Update history sidebar badge
    const badge = document.getElementById('badge-step-history');
    if (badge) {
      badge.innerText = `${reports.length} Saved`;
    }
    const badgeHeader = document.getElementById('header-reports-count');
    if (badgeHeader) {
      badgeHeader.innerText = reports.length;
    }

    // Filter by search query if any
    const searchInput = document.getElementById('history-search-input');
    const query = (searchInput ? searchInput.value : '').toLowerCase().trim();

    const activeFilter = this.historyFilter || 'all'; // 'all', 'released', 'in_progress', 'expiring_soon'
    const activeSort = this.historySort || 'latest'; // 'latest', 'date', 'turbine'

    let filtered = reports.filter(r => {
      // Search query filter
      if (query) {
        const doc = (r.documentNumber || r.docNo || '').toLowerCase();
        const turb = (r.turbineNumber || r.turbineId || '').toLowerCase();
        const cust = (r.customerName || r.customer || '').toLowerCase();
        const site = (r.siteName || '').toLowerCase();
        const gearbox = (r.gearboxSerialNumber || '').toLowerCase();
        const match = doc.includes(query) || turb.includes(query) || cust.includes(query) || site.includes(query) || gearbox.includes(query);
        if (!match) return false;
      }

      // Status filter
      if (activeFilter === 'released') return r.status === 'Released';
      if (activeFilter === 'in_progress') return r.status !== 'Released';
      if (activeFilter === 'expiring_soon') {
        const daysLeft = this.calculateDaysRemaining(r.expiresAt);
        return daysLeft <= 5;
      }
      return true;
    });

    // Sorting
    if (activeSort === 'date') {
      filtered.sort((a, b) => (b.reportDate || '').localeCompare(a.reportDate || ''));
    } else if (activeSort === 'turbine') {
      filtered.sort((a, b) => (a.turbineNumber || a.turbineId || '').localeCompare(b.turbineNumber || b.turbineId || ''));
    } else {
      filtered.sort((a, b) => new Date(b.updatedAt || 0) - new Date(a.updatedAt || 0));
    }

    // Update metrics counts
    const totalCountEl = document.getElementById('history-stat-total');
    const releasedCountEl = document.getElementById('history-stat-released');
    const inProgCountEl = document.getElementById('history-stat-inprog');
    const expiringCountEl = document.getElementById('history-stat-expiring');

    if (totalCountEl) totalCountEl.innerText = reports.length;
    if (releasedCountEl) releasedCountEl.innerText = reports.filter(r => r.status === 'Released').length;
    if (inProgCountEl) inProgCountEl.innerText = reports.filter(r => r.status !== 'Released').length;
    if (expiringCountEl) expiringCountEl.innerText = reports.filter(r => this.calculateDaysRemaining(r.expiresAt) <= 5).length;

    if (filtered.length === 0) {
      container.innerHTML = `
        <div class="history-empty-state">
          <div style="font-size: 2.5rem; margin-bottom: 8px;">🗂</div>
          <div style="font-weight: 700; font-size: 1.1rem; color: var(--text-dark); margin-bottom: 4px;">No Reports Found</div>
          <div style="color: var(--text-muted); font-size: 0.85rem; max-width: 420px; margin: 0 auto 16px;">
            ${query ? 'No saved reports match your search query.' : 'There are no active service reports in history. Create and save a report to automatically store it in your cloud and local archive.'}
          </div>
          <button type="button" class="btn btn-primary" onclick="app.createNewCleanReport()">
            <span>+</span> Create New Service Report
          </button>
        </div>
      `;
      return;
    }

    const currentId = this.currentReportId;

    container.innerHTML = filtered.map(r => {
      const isActive = r.id === currentId;
      const daysLeft = this.calculateDaysRemaining(r.expiresAt);
      const isExpiringSoon = daysLeft <= 5;
      const isReleased = r.status === 'Released';
      const formattedExpires = r.expiresAt ? this.formatDateToStandard(r.expiresAt.substring(0, 10)) : '30 days';

      return `
        <div class="history-report-card ${isActive ? 'is-active-card' : ''}">
          <div class="history-card-header">
            <div class="history-card-title-group">
              <span class="history-doc-badge">${r.documentNumber || r.docNo || 'TWT-10826'}</span>
              <span class="history-edition-badge">Edition ${r.edition || 'A'}</span>
              <span class="report-lifecycle-badge ${isReleased ? 'badge-released' : 'badge-in-progress'}">
                ${r.status || 'In Progress'}
              </span>
              ${isCloudActive ? '<span class="badge" style="background:#f0fdf4;color:#15803d;border:1px solid #bbf7d0;font-size:7.2pt;padding:2px 6px;border-radius:3px;font-weight:700;">☁️ Cloud</span>' : '<span class="badge" style="background:#f1f5f9;color:#475569;border:1px solid #cbd5e1;font-size:7.2pt;padding:2px 6px;border-radius:3px;font-weight:700;">📱 Local</span>'}
              ${isActive ? '<span class="history-active-pill">● ACTIVE IN EDITOR</span>' : ''}
            </div>
            <div class="history-expiry-badge ${isExpiringSoon ? 'expiry-alert' : ''}" title="Automatic retention policy: 30 days from release">
              <span>⏳</span> Expires: ${formattedExpires} (${daysLeft}d left)
            </div>
          </div>

          <div class="history-card-body">
            <div class="history-data-grid">
              <div class="history-data-item">
                <span class="history-data-label">Turbine Asset:</span>
                <span class="history-data-val font-bold">${r.turbineNumber || r.turbineId || 'N/A'} ${r.turbineType ? `(${r.turbineType})` : ''}</span>
              </div>
              <div class="history-data-item">
                <span class="history-data-label">Customer / Client:</span>
                <span class="history-data-val">${r.customerName || r.customer || 'Vestas Wind Technology'}</span>
              </div>
              <div class="history-data-item">
                <span class="history-data-label">Site / Location:</span>
                <span class="history-data-val">${r.siteName || 'Bhuj Wind Farm'}</span>
              </div>
              <div class="history-data-item">
                <span class="history-data-label">Service Date:</span>
                <span class="history-data-val font-mono">${r.reportDate || 'N/A'}</span>
              </div>
              <div class="history-data-item">
                <span class="history-data-label">Gearbox / Serial:</span>
                <span class="history-data-val font-mono">${r.gearboxSerialNumber || r.padNumber || 'N/A'}</span>
              </div>
              <div class="history-data-item">
                <span class="history-data-label">Last Modified:</span>
                <span class="history-data-val text-muted">${new Date(r.updatedAt || r.createdAt || Date.now()).toLocaleString()}</span>
              </div>
            </div>
          </div>

          <div class="history-card-footer">
            <div class="history-actions-left">
              ${isActive ? `
                <button type="button" class="btn btn-success btn-sm" onclick="app.switchSection('step-report-details')">
                  ✏️ Return to Editor
                </button>
              ` : `
                <button type="button" class="btn btn-primary btn-sm" onclick="app.openHistoryReport('${r.id}')" title="Edit this report">
                  ✏️ Edit
                </button>
              `}
              <button type="button" class="btn btn-outline btn-sm" onclick="app.downloadHistoryPDF('${r.id}')" title="Download Official PDF for this report">
                📄 Generate PDF
              </button>
              <button type="button" class="btn btn-outline btn-sm" onclick="app.duplicateHistoryReport('${r.id}')" title="Duplicate as new service report">
                📋 Duplicate
              </button>
            </div>

            <div class="history-actions-right">
              <button type="button" class="btn btn-outline btn-sm btn-text-danger" onclick="app.requestDeleteReport('${r.id}')" title="Delete report from history">
                🗑️ Delete
              </button>
            </div>
          </div>
        </div>
      `;
    }).join('');
  }

  calculateDaysRemaining(expiresAt) {
    if (!expiresAt) return 30;
    const diff = new Date(expiresAt).getTime() - Date.now();
    const days = Math.ceil(diff / (1000 * 60 * 60 * 24));
    return days > 0 ? days : 0;
  }

  filterHistory(query) {
    this.renderHistorySection();
  }

  setHistoryFilter(filterType) {
    this.historyFilter = filterType;
    document.querySelectorAll('.history-filter-btn').forEach(btn => {
      btn.classList.toggle('active', btn.getAttribute('data-filter') === filterType);
    });
    this.renderHistorySection();
  }

  setHistorySort(sortType) {
    this.historySort = sortType;
    this.renderHistorySection();
  }

  async getReportRecordAnywhere(reportId) {
    if (window.firebaseService && window.firebaseService.currentUser && window.firebaseService.isOnline) {
      try {
        const cloudRecord = await window.firebaseService.getReportByIdFromCloud(reportId);
        if (cloudRecord) return cloudRecord;
      } catch (e) {
        console.warn('Cloud report fetch failed, fallback to local:', e);
      }
    }
    return await ReportDB.getReportById(reportId);
  }

  async openHistoryReport(reportId) {
    const record = await this.getReportRecordAnywhere(reportId);
    if (!record) {
      this.showToast('Report not found in storage.');
      return;
    }

    // Unsaved changes check
    if (this.currentData && this.currentReportId && this.currentReportId !== reportId) {
      const activeRecord = await this.getReportRecordAnywhere(this.currentReportId);
      const isDirty = !activeRecord || JSON.stringify(activeRecord.reportData || activeRecord.data) !== JSON.stringify(this.currentData);
      if (isDirty) {
        this.pendingOpenReportId = reportId;
        const modal = document.getElementById('unsaved-changes-modal');
        if (modal) {
          modal.classList.add('active');
          return;
        }
      }
    }

    await this.loadReportRecordIntoWorkspace(record);
  }

  async confirmSaveAndOpenHistory() {
    if (this.currentData) {
      await this.syncActiveReportToDB();
    }
    const modal = document.getElementById('unsaved-changes-modal');
    if (modal) modal.classList.remove('active');

    if (this.pendingOpenReportId) {
      const record = await this.getReportRecordAnywhere(this.pendingOpenReportId);
      this.pendingOpenReportId = null;
      if (record) await this.loadReportRecordIntoWorkspace(record);
    }
  }

  async confirmDiscardAndOpenHistory() {
    const modal = document.getElementById('unsaved-changes-modal');
    if (modal) modal.classList.remove('active');

    if (this.pendingOpenReportId) {
      const record = await this.getReportRecordAnywhere(this.pendingOpenReportId);
      this.pendingOpenReportId = null;
      if (record) await this.loadReportRecordIntoWorkspace(record);
    }
  }

  closeUnsavedChangesModal() {
    const modal = document.getElementById('unsaved-changes-modal');
    if (modal) modal.classList.remove('active');
    this.pendingOpenReportId = null;
  }

  async loadReportRecordIntoWorkspace(record) {
    const reportData = record.reportData || record.data || record;
    this.currentData = JSON.parse(JSON.stringify(reportData));
    ThendralReportStore.sanitizeReportData(this.currentData);
    this.currentReportId = record.id || record.reportId;

    if (!this.currentData.meta) this.currentData.meta = {};
    const docNo = (this.currentData.meta.reportDocNo && this.currentData.meta.reportDocNo.trim() !== '' && this.currentData.meta.reportDocNo !== '—')
      ? this.currentData.meta.reportDocNo
      : (record.documentNumber || record.metadata?.reportDocNo || 'TWT-10826');
    this.currentData.meta.reportDocNo = docNo;
    this.currentData.documentNumber = docNo;

    if (!this.currentData.photos) {
      this.currentData.photos = record.photos || [];
    }

    // Restore photo mapping and ensure all photos have unique IDs
    PhotoManager.populateSamplePhotos(this.currentData);

    // Merge any locally cached photo data from PhotoDB
    try {
      const localPhotos = await PhotoDB.getAllPhotos();
      if (Array.isArray(localPhotos) && localPhotos.length > 0) {
        const localMap = new Map(localPhotos.map(p => [p.id || p.photoId, p]));
        (this.currentData.photos || []).forEach(p => {
          const key = p.photoId || p.id;
          if (key && localMap.has(key)) {
            const cached = localMap.get(key);
            if (cached && cached.url && (!p.url || p.url.trim().length === 0)) {
              p.url = cached.url;
            }
          }
        });
      }
    } catch (e) {
      console.warn('Local PhotoDB merge notice:', e);
    }

    this.saveDraftToLocalStorage(this.currentData, this.currentUser?.uid);

    this.renderWorkspace();
    this.renderPreview();
    this.updateSectionIndicators();
    this.switchSection('step-report-details');

    this.showToast(`✓ Opened Report: ${this.currentData.meta ? this.currentData.meta.reportDocNo : 'Report'}`);
  }

  async duplicateHistoryReport(reportId) {
    const record = await this.getReportRecordAnywhere(reportId);
    if (!record) return;

    const allReps = await ReportDB.getAllReports();
    const newDocNo = ReportIdManager.generateDocumentNumber(new Date(), allReps);
    const newId = ReportIdManager.generateInternalReportId();

    const copyData = JSON.parse(JSON.stringify(record.reportData || record.data || record));
    if (!copyData.meta) copyData.meta = {};
    copyData.meta.reportDocNo = newDocNo;
    copyData.meta.reportId = newId;
    copyData.meta.status = 'Draft';
    copyData.meta.edition = 'A';

    const turb = copyData.turbine || {};
    const gen = copyData.generalInfo || {};

    const newRecord = {
      id: newId,
      reportId: newId,
      documentNumber: newDocNo,
      reportIdNumber: newId,
      edition: 'A',
      turbineNumber: turb.turbineNumber || 'CN18D064',
      turbineType: turb.turbineType || 'V110',
      gearboxSerialNumber: copyData.meta.customerSerialNo || turb.padNumber || '',
      customerName: gen.customerName || 'Vestas',
      siteName: gen.siteName || 'Bhuj',
      reportDate: copyData.meta.reportDate || this.getTodayDateFormatted(),
      status: 'Draft',
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      reportData: copyData
    };

    await ReportDB.saveReport(newRecord);
    if (window.firebaseService && window.firebaseService.currentUser && window.firebaseService.isOnline) {
      await window.firebaseService.saveReportToCloud(newRecord);
    }
    await this.renderHistorySection();
    this.updateReportsCountBadge();
    this.showToast(`📋 Duplicated report as ${newDocNo}`);
  }

  // ==========================================
  // TWO-STEP DELETE CONFIRMATION SAFETY
  // ==========================================
  async requestDeleteReport(reportId) {
    const record = await this.getReportRecordAnywhere(reportId);
    if (!record) {
      this.showToast('Report not found in storage.');
      return;
    }

    this.pendingDeleteReportId = reportId;

    const docNo = record.documentNumber || record.metadata?.reportDocNo || 'TWT-10826';
    const turb = record.turbineNumber || record.turbine?.turbineNumber || '—';
    const cust = record.customerName || record.customer?.customerName || record.generalInfo?.customerName || '—';
    const site = record.siteName || record.customer?.siteName || record.generalInfo?.siteName || '—';

    const setTxt = (id, val) => {
      const el = document.getElementById(id);
      if (el) el.innerText = val;
    };

    setTxt('del-modal-doc-no', docNo);
    setTxt('del-modal-doc-no-2', docNo);
    setTxt('del-modal-turbine', turb);
    setTxt('del-modal-customer', cust);
    setTxt('del-modal-site', site);

    const s1 = document.getElementById('del-modal-step-1');
    const s2 = document.getElementById('del-modal-step-2');
    if (s1) s1.style.display = 'block';
    if (s2) s2.style.display = 'none';

    const modal = document.getElementById('delete-confirm-modal');
    if (modal) modal.classList.add('active');
  }

  proceedDeleteStep2() {
    const s1 = document.getElementById('del-modal-step-1');
    const s2 = document.getElementById('del-modal-step-2');
    if (s1) s1.style.display = 'none';
    if (s2) s2.style.display = 'block';
  }

  closeDeleteModal() {
    const modal = document.getElementById('delete-confirm-modal');
    if (modal) modal.classList.remove('active');
    this.pendingDeleteReportId = null;
  }

  async executeConfirmedDelete() {
    const reportId = this.pendingDeleteReportId;
    if (!reportId) return;

    const btn = document.getElementById('btn-del-final-confirm');
    const origTxt = btn ? btn.innerHTML : '';
    if (btn) {
      btn.disabled = true;
      btn.innerHTML = `<span class="spinner-icon"></span> Deleting from Cloud...`;
    }

    try {
      // 1. Real Cloud Firestore Permanent Deletion (Must succeed before UI removes)
      if (window.firebaseService && window.firebaseService.currentUser && window.firebaseService.isOnline) {
        await window.firebaseService.deleteReportFromCloud(reportId);
      }

      // 2. Invalidate from Local Storage & IndexedDB
      await ReportDB.deleteReport(reportId);
      const activeId = localStorage.getItem('thendral_active_report_id');
      if (activeId === reportId) {
        localStorage.removeItem('thendral_active_report_id');
        localStorage.removeItem('thendral_report_draft');
      }

      // 3. If currently active report was deleted, switch to remaining or create clean
      if (this.currentReportId === reportId) {
        const remaining = await ReportDB.getAllReports();
        const validRemaining = remaining.filter(r => !r.isDeleted && r.id !== reportId);
        if (validRemaining.length > 0) {
          await this.loadReportRecordIntoWorkspace(validRemaining[0]);
        } else {
          this.createNewCleanReport();
        }
      }

      this.closeDeleteModal();
      await this.renderHistorySection();
      this.updateReportsCountBadge();
      this.showToast('🗑️ Report permanently deleted from Cloud & Local Storage.');
    } catch (err) {
      console.error('Delete error:', err);
      this.showToast(`⚠️ Delete failed: ${err.message || 'Firestore database error'}. Report was not removed.`);
    } finally {
      if (btn) {
        btn.disabled = false;
        btn.innerHTML = origTxt;
      }
    }
  }

  // ==========================================
  // AUTHENTICATION MODAL CONTROLLER
  // ==========================================
  openAuthModal() {
    const modal = document.getElementById('auth-modal');
    if (!modal) return;
    const isAuth = !!window.firebaseService?.currentUser;
    const profileView = document.getElementById('auth-profile-view');
    const formView = document.getElementById('auth-form-view');

    if (isAuth) {
      if (profileView) profileView.style.display = 'block';
      if (formView) formView.style.display = 'none';

      const user = window.firebaseService.currentUser;
      const profile = window.firebaseService.userProfile;
      const displayName = profile?.displayName || user.displayName || user.email.split('@')[0];
      const email = user.email || '';
      const role = profile?.role || 'engineer';
      const roleLabel = role === 'admin' ? 'Administrator' : role === 'reviewer' ? 'Technical Reviewer' : 'Lead Field Engineer';

      const nameEl = document.getElementById('auth-user-name');
      const emailEl = document.getElementById('auth-user-email');
      const roleEl = document.getElementById('auth-user-role');
      const avatarEl = document.getElementById('auth-user-avatar');

      if (nameEl) nameEl.innerText = displayName;
      if (emailEl) emailEl.innerText = email;
      if (roleEl) roleEl.innerText = roleLabel;
      if (avatarEl) avatarEl.innerText = displayName.charAt(0).toUpperCase() || '👤';
    } else {
      if (profileView) profileView.style.display = 'none';
      if (formView) formView.style.display = 'block';
      this.switchAuthTab('login');
    }

    const errBox = document.getElementById('auth-error-box');
    if (errBox) errBox.style.display = 'none';

    modal.classList.add('active');
  }

  closeAuthModal() {
    const modal = document.getElementById('auth-modal');
    if (modal) modal.classList.remove('active');
  }

  switchAuthTab(tab) {
    const tabLogin = document.getElementById('tab-auth-login');
    const tabRegister = document.getElementById('tab-auth-register');
    const groupName = document.getElementById('auth-group-name');
    const submitBtn = document.getElementById('btn-auth-submit');
    const titleEl = document.getElementById('auth-modal-title');
    const errBox = document.getElementById('auth-error-box');
    if (errBox) errBox.style.display = 'none';

    if (tab === 'register') {
      if (tabLogin) {
        tabLogin.style.background = 'transparent';
        tabLogin.style.color = 'var(--text-muted)';
      }
      if (tabRegister) {
        tabRegister.style.background = '#e0f2fe';
        tabRegister.style.color = '#0284c7';
      }
      if (groupName) groupName.style.display = 'block';
      if (submitBtn) submitBtn.innerText = 'Create Account & Sign In';
      if (titleEl) titleEl.innerText = 'Create Engineer Account';
    } else {
      if (tabRegister) {
        tabRegister.style.background = 'transparent';
        tabRegister.style.color = 'var(--text-muted)';
      }
      if (tabLogin) {
        tabLogin.style.background = '#e0f2fe';
        tabLogin.style.color = '#0284c7';
      }
      if (groupName) groupName.style.display = 'none';
      if (submitBtn) submitBtn.innerText = 'Sign In';
      if (titleEl) titleEl.innerText = 'Engineer Authorization';
    }
  }

  async handleAuthFormSubmit(e) {
    if (e) e.preventDefault();
    const emailInput = document.getElementById('auth-input-email');
    const passInput = document.getElementById('auth-input-password');
    const nameInput = document.getElementById('auth-input-name');
    const errBox = document.getElementById('auth-error-box');
    const submitBtn = document.getElementById('btn-auth-submit');

    const email = emailInput ? emailInput.value.trim() : '';
    const password = passInput ? passInput.value : '';
    const name = nameInput ? nameInput.value.trim() : '';

    if (!email || !password) return;

    const isRegister = document.getElementById('tab-auth-register')?.style?.background === 'rgb(224, 242, 254)' || document.getElementById('tab-auth-register')?.style?.background?.includes('e0f2fe');

    if (errBox) errBox.style.display = 'none';
    if (submitBtn) {
      submitBtn.disabled = true;
      submitBtn.innerText = 'Authenticating...';
    }

    try {
      if (isRegister) {
        await window.firebaseService.signUp(email, password, name);
        this.showToast(`✓ Account created! Welcome, ${name || email}`);
      } else {
        await window.firebaseService.signIn(email, password);
        this.showToast(`✓ Signed in as ${email}`);
      }
      this.closeAuthModal();
      await this.syncActiveReportToDB();
      this.renderHistorySection();
    } catch (err) {
      console.warn('Authentication error:', err);
      if (errBox) {
        let msg = err.message || 'Authentication failed.';
        if (err.code === 'auth/wrong-password' || err.code === 'auth/user-not-found' || err.code === 'auth/invalid-credential') {
          msg = 'Invalid email or password.';
        } else if (err.code === 'auth/email-already-in-use') {
          msg = 'An account already exists with this email address.';
        } else if (err.code === 'auth/weak-password') {
          msg = 'Password should be at least 6 characters.';
        }
        errBox.innerText = msg;
        errBox.style.display = 'block';
      }
    } finally {
      if (submitBtn) {
        submitBtn.disabled = false;
        submitBtn.innerText = isRegister ? 'Create Account & Sign In' : 'Sign In';
      }
    }
  }

  async handleSignOut() {
    const logoutBtns = document.querySelectorAll('.btn-header-logout, #btn-header-logout');
    logoutBtns.forEach(b => {
      b.disabled = true;
      b.innerHTML = `<span>⏳</span> <span class="logout-label">Signing out...</span>`;
    });

    try {
      sessionStorage.removeItem('thendral_active_section');
      localStorage.removeItem('thendral_has_session');
      localStorage.removeItem('thendral_cached_role');
      localStorage.removeItem('thendral_active_report_id');
      localStorage.removeItem('thendral_report_draft');
      document.documentElement.classList.remove('session-active', 'is-admin', 'is-engineer', 'is-reviewer');
      document.body.classList.remove('session-active', 'is-admin', 'is-engineer', 'is-reviewer');

      // Clear in-memory active report and photo state
      this.currentData = null;
      this.currentReportId = null;
      this.selectedPhotoId = null;

      // Clear input fields across the DOM
      const inputs = document.querySelectorAll('[data-path]');
      inputs.forEach(inp => {
        if (inp.type === 'checkbox' || inp.type === 'radio') {
          inp.checked = false;
        } else {
          inp.value = '';
        }
      });
    } catch (e) {}

    this.closeAuthModal();

    try {
      if (window.firebaseService) {
        await window.firebaseService.signOut();
      }
      this.onAuthStateChanged(null, null);
      this.showToast('✓ Signed out of Firebase Session successfully.');
    } catch (err) {
      console.error('[AUTH_SIGNOUT_ERROR]', err);
      this.showToast(`⚠️ Sign out notice: ${err.message || 'Session terminated'}`);
      this.onAuthStateChanged(null, null);
    } finally {
      try {
        history.replaceState(null, '', window.location.pathname);
        window.scrollTo(0, 0);
        const ls = document.getElementById('login-landing-screen');
        if (ls) ls.scrollTop = 0;
      } catch (e) {}
      logoutBtns.forEach(b => {
        b.disabled = false;
        b.innerHTML = `
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
            <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4"></path>
            <polyline points="16 17 21 12 16 7"></polyline>
            <line x1="21" y1="12" x2="9" y2="12"></line>
          </svg>
          <span class="logout-label">Sign Out</span>
        `;
      });
    }
  }

  async downloadHistoryPDF(reportId) {
    const record = await this.getReportRecordAnywhere(reportId);
    if (!record) return;

    const data = record.reportData || record.data || record;
    PhotoManager.populateSamplePhotos(data);

    // If this is currently loaded report, download directly
    if (reportId === this.currentReportId) {
      this.syncFormToCurrentData();
      const filename = `${data.meta.reportDocNo || 'TWT-10826'}_${data.meta.edition || 'A'}.pdf`;
      PDFExporter.downloadPDF('report-preview-container', filename);
      this.showToast(`📄 Generating PDF for ${data.meta.reportDocNo}...`);
      return;
    }

    // Render into temporary container for export
    let tempContainer = document.getElementById('temp-pdf-export-container');
    if (!tempContainer) {
      tempContainer = document.createElement('div');
      tempContainer.id = 'temp-pdf-export-container';
      tempContainer.style.position = 'fixed';
      tempContainer.style.left = '0';
      tempContainer.style.top = '0';
      tempContainer.style.width = '210mm';
      tempContainer.style.opacity = '0';
      tempContainer.style.pointerEvents = 'none';
      tempContainer.style.zIndex = '-9999';
      document.body.appendChild(tempContainer);
    }

    tempContainer.innerHTML = ReportTemplate.renderFullReport(data);
    this.showToast(`📄 Generating PDF for ${data.meta.reportDocNo || 'Report'}...`);

    setTimeout(() => {
      const filename = `${(data.meta && data.meta.reportDocNo) || 'TWT-10826'}_${(data.meta && data.meta.edition) || 'A'}.pdf`;
      PDFExporter.downloadPDF('temp-pdf-export-container', filename);
    }, 200);
  }

  createNewReportPrompt() {
    this.closeReportsManager();
    this.openTemplateModal();
  }

  // ==========================================
  // WORK SCOPE CHECKLIST UX
  // ==========================================
  renderWorkList() {
    const container = document.getElementById('dashboard-work-list');
    if (!container) return;
    const items = this.currentData.workPerformed || [];

    container.innerHTML = items.map((item, idx) => `
      <div class="work-item-row">
        <span class="work-num-pill">${idx + 1}</span>
        <input type="text" class="form-control" style="flex: 1; border: none; background: transparent; font-weight: 600;" value="${item}" oninput="app.updateWorkItem(${idx}, this.value)" onchange="app.updateWorkItem(${idx}, this.value)" placeholder="Enter maintenance task description...">
        <button type="button" class="btn-delete-item" onclick="app.removeWorkItem(${idx})" title="Remove task">✕</button>
      </div>
    `).join('');
  }

  addWorkItem() {
    if (!this.currentData.workPerformed) this.currentData.workPerformed = [];
    this.currentData.workPerformed.push(`${this.currentData.workPerformed.length + 1}. Inspection and maintenance activity`);
    this.renderWorkList();
    this.debouncedSaveAndRender();
  }

  removeWorkItem(index) {
    if (this.currentData.workPerformed) {
      this.currentData.workPerformed.splice(index, 1);
      this.renderWorkList();
      this.debouncedSaveAndRender();
    }
  }

  updateWorkItem(index, value) {
    if (this.currentData.workPerformed) {
      this.currentData.workPerformed[index] = value;
      this.debouncedSaveAndRender();
    }
  }

  // ======================================  // ==========================================
  static BEARING_FINDINGS_OPTIONS = [
    'No visual damage',
    'Accidental indents',
    'Axial hairline crack',
    'Axial line(s)',
    'Axial Ring Crack',
    'Black spot(s)',
    'Broken',
    'Burned',
    'Cage completely damaged',
    'Cage damage',
    'Circular wear lines',
    'Clips broken',
    'Corrosion',
    'Cracked',
    'Cracks',
    'Cracks on Roller end',
    'Creeping marks',
    'Discoloured',
    'Dismantling damage',
    'Electro-corrosion',
    'False brinelling',
    'Few indents',
    'Fluting marks',
    'Fretting corrosion',
    'Grey zone(s)',
    'Hitmark(s)',
    'Incidental indents',
    'Indent(s)',
    'Loose',
    'Macropitting',
    'Many indents',
    'Mat / Dull raceway',
    'Micropitting',
    'Mild wear',
    'Noisy',
    'Not applicable',
    'Other',
    'PAEK Cage Fracture',
    'Plastic Deformation',
    'Polishing',
    'Progressive spalling',
    'Rotating',
    'Scuffing line(s)',
    'See separate report',
    'Severe damage',
    'Shoulder Fracture',
    'Smearing',
    'Spalling',
    'Stand still marks',
    'Subsurface Fatigue',
    'Surface distress',
    'Surface Initiated Fatigue',
    'Unknown',
    'Wear'
  ];

  // ==========================================
  // BEARING INSPECTION MATRIX UX (INDUSTRIAL TABLE)
  // ==========================================
  renderBearingsTable() {
    const tbody = document.getElementById('bearing-inspection-tbody');
    if (!tbody) return;
    const bearings = this.currentData.bearingAssessment || [];
    const optionsList = this.constructor.BEARING_FINDINGS_OPTIONS || App.BEARING_FINDINGS_OPTIONS;

    tbody.innerHTML = bearings.map((b, i) => {
      if (!b.id) b.id = `b_${i}_${(b.location || '').replace(/\s+/g, '_').toLowerCase()}`;
      const assessment = b.assessment || '';
      const decClass = assessment ? `dec-${assessment.toLowerCase().replace(/\s+/g, '-')}` : '';
      const photos = PhotoManager.getPhotosByItemId(this.currentData.photos, b.id);
      const currentObs = b.observation || '';
      const isCustomObs = currentObs && !optionsList.includes(currentObs);

      const findingsOptionsHtml = `
        <option value="" ${!currentObs ? 'selected' : ''}>Select Finding</option>
        ${isCustomObs ? `<option value="${currentObs.replace(/"/g, '&quot;')}" selected>${currentObs} (Custom)</option>` : ''}
        ${optionsList.map(opt => `
          <option value="${opt.replace(/"/g, '&quot;')}" ${currentObs === opt ? 'selected' : ''}>${opt}</option>
        `).join('')}
      `;

      return `
        <tr id="row-${b.id}">
          <td>
            <input type="text" class="form-control font-semibold" value="${b.location || ''}" oninput="app.updateBearingField('${b.id}', 'location', this.value)" onchange="app.updateBearingField('${b.id}', 'location', this.value)" placeholder="Bearing Location">
          </td>
          <td>
            <select class="form-control font-semibold" onchange="app.updateBearingField('${b.id}', 'observation', this.value)">
              ${findingsOptionsHtml}
            </select>
          </td>
          <td>
            <select class="form-control decision-select ${decClass}" onchange="app.updateBearingField('${b.id}', 'assessment', this.value)">
              <option value="" ${!assessment ? 'selected' : ''}>Select Decision</option>
              <option value="Acceptable" ${assessment === 'Acceptable' ? 'selected' : ''}>✓ Acceptable</option>
              <option value="Caution" ${assessment === 'Caution' ? 'selected' : ''}>⚠️ Caution</option>
              <option value="Defect" ${assessment === 'Defect' ? 'selected' : ''}>❌ Defect</option>
              <option value="Reuse" ${assessment === 'Reuse' ? 'selected' : ''}>Reuse (Rework by hand)</option>
              <option value="Regrind" ${assessment === 'Regrind' ? 'selected' : ''}>Regrind (Teeth regrinding)</option>
              <option value="Rework" ${assessment === 'Rework' ? 'selected' : ''}>Rework (Surface rework)</option>
              <option value="Replace by Upgrade" ${assessment === 'Replace by Upgrade' ? 'selected' : ''}>Replace by Upgrade</option>
              <option value="Rework to Upgrade" ${assessment === 'Rework to Upgrade' ? 'selected' : ''}>Rework to Upgrade</option>
              <option value="Replace by Oversize" ${assessment === 'Replace by Oversize' ? 'selected' : ''}>Replace by Oversize</option>
              <option value="Oversize" ${assessment === 'Oversize' ? 'selected' : ''}>Oversize (Oversize bore)</option>
              <option value="Flip" ${assessment === 'Flip' ? 'selected' : ''}>Flip (Flank reversal)</option>
              <option value="Scrap" ${assessment === 'Scrap' ? 'selected' : ''}>Scrap (Replace by new part)</option>
              <option value="Scrap(Rework Gear)" ${assessment === 'Scrap(Rework Gear)' ? 'selected' : ''}>Scrap(Rework Gear)</option>
              <option value="std replacement part" ${assessment === 'std replacement part' ? 'selected' : ''}>std replacement part</option>
              <option value="Not Acceptable" ${assessment === 'Not Acceptable' || assessment === 'Not acceptable' ? 'selected' : ''}>✕ Not Acceptable</option>
              <option value="Monitor" ${assessment === 'Monitor' ? 'selected' : ''}>👁️ Monitor</option>
              <option value="Replace" ${assessment === 'Replace' ? 'selected' : ''}>🔄 Replace</option>
              <option value="Further Inspection Required" ${assessment === 'Further Inspection Required' ? 'selected' : ''}>🔍 Further Inspection</option>
            </select>
          </td>
          <td>
            ${photos.length > 0 ? `
              <div class="table-photos-cell-wrap">
                ${photos.map((p, pIdx) => `
                  <div class="table-photo-card" title="${(p.caption || p.label || 'Bearing Photo ' + (pIdx + 1)).replace(/"/g, '&quot;')}">
                    <img src="${p.url}" class="table-photo-thumb" onclick="app.openPreviewModalSingle('${p.url}')" alt="Photo ${pIdx + 1}">
                    <div class="table-photo-card-actions">
                      <button type="button" class="btn-micro" onclick="app.openEditPhotoModal('${p.photoId}', '${b.id}', '${(b.location || '').replace(/'/g, "\\'")}', '${(p.caption || '').replace(/'/g, "\\'")}')" title="Edit / Replace">✏️</button>
                      <button type="button" class="btn-micro btn-micro-danger" onclick="app.deletePhotoById('${p.photoId}')" title="Remove Photo">✕</button>
                    </div>
                  </div>
                `).join('')}
                <button type="button" class="btn-table-photo-add-more" onclick="app.openRowPhotoModal('bearing-condition', '${b.id}', '${(b.location || '').replace(/'/g, "\\'")}', '${(b.observation || '').replace(/'/g, "\\'")}', true)" title="Add another photo to this bearing">
                  +📷
                </button>
              </div>
            ` : `
              <button type="button" class="btn-table-photo-add" onclick="app.openRowPhotoModal('bearing-condition', '${b.id}', '${(b.location || '').replace(/'/g, "\\'")}', '${(b.observation || '').replace(/'/g, "\\'")}', true)">
                📷 + Photo
              </button>
            `}
          </td>
          <td style="text-align: center;">
            <button type="button" class="btn-delete-item" onclick="app.removeBearingRow('${b.id}')" title="Delete bearing row">✕</button>
          </td>
        </tr>
      `;
    }).join('');
  }

  addBearingRow() {
    if (!this.currentData.bearingAssessment) this.currentData.bearingAssessment = [];
    const newId = `b_${Date.now()}`;
    this.currentData.bearingAssessment.push({
      id: newId,
      location: '',
      observation: '',
      assessment: ''
    });
    this.renderBearingsTable();
    this.debouncedSaveAndRender();
    this.showToast('✓ Added new bearing row');
  }

  removeBearingRow(id) {
    if (this.currentData.bearingAssessment) {
      this.currentData.bearingAssessment = this.currentData.bearingAssessment.filter(b => b.id !== id);
      PhotoManager.removePhotoByItemId(this.currentData, id);
      this.renderBearingsTable();
      this.debouncedSaveAndRender();
      this.showToast('Bearing row deleted');
    }
  }

  updateBearingField(id, field, value) {
    const bearing = (this.currentData.bearingAssessment || []).find(b => b.id === id);
    if (bearing) {
      bearing[field] = value;
      if (field === 'assessment') {
        this.renderBearingsTable();
      }
      this.debouncedSaveAndRender();
      this.updateSectionIndicators();
    }
  }

  static GEAR_FINDINGS_OPTIONS = [
    'No visual damage',
    'Abrasive wear',
    'Adhesive wear',
    'Broken',
    'Broken teeth/tooth',
    'Case-Core Separation',
    'Corrosion',
    'Crack(s)',
    'Edge contact lines',
    'Fluting mark(s)',
    'Fretting corrosion',
    'Grinding temper',
    'Indent(s)',
    'Indents (result of plastic deformation / particles)',
    'Inner bore OOT',
    'Inner bore WT',
    'Loose',
    'Macropitting',
    'Material breakout',
    'Micropitting',
    'Noisy',
    'Not applicable',
    'Other',
    'Peeling of Nitrided Layer',
    'Plastic Deformation',
    'Polishing',
    'Rim Crack',
    'Root Fillet Yielding',
    'Root Fracture',
    'Scratches',
    'Scuffing',
    'Spalling/flaking',
    'Stand still marks',
    'Tooth Flank Fracture',
    'Tooth Interior Fatigue',
    'Tooth Root Fatigue',
    'Unknown',
    'Wear'
  ];

  // ==========================================
  // GEAR INSPECTION MATRIX UX (INDUSTRIAL TABLE)
  // ==========================================
  renderGearsTable() {
    const tbody = document.getElementById('gear-inspection-tbody');
    if (!tbody) return;
    const gears = this.currentData.gearAssessment || [];
    const optionsList = this.constructor.GEAR_FINDINGS_OPTIONS || App.GEAR_FINDINGS_OPTIONS;

    tbody.innerHTML = gears.map((g, i) => {
      if (!g.id) g.id = `g_${i}_${(g.location || '').replace(/\s+/g, '_').toLowerCase()}`;
      const assessment = g.assessment || '';
      const decClass = assessment ? `dec-${assessment.toLowerCase().replace(/\s+/g, '-')}` : '';
      const photos = PhotoManager.getPhotosByItemId(this.currentData.photos, g.id);
      const currentObs = g.observation || '';
      const isCustomObs = currentObs && !optionsList.includes(currentObs);

      const findingsOptionsHtml = `
        <option value="" ${!currentObs ? 'selected' : ''}>Select Finding</option>
        ${isCustomObs ? `<option value="${currentObs.replace(/"/g, '&quot;')}" selected>${currentObs} (Custom)</option>` : ''}
        ${optionsList.map(opt => `
          <option value="${opt.replace(/"/g, '&quot;')}" ${currentObs === opt ? 'selected' : ''}>${opt}</option>
        `).join('')}
      `;

      return `
        <tr id="row-${g.id}">
          <td>
            <input type="text" class="form-control font-semibold" value="${g.location || ''}" oninput="app.updateGearField('${g.id}', 'location', this.value)" onchange="app.updateGearField('${g.id}', 'location', this.value)" placeholder="Gear Mesh Stage">
          </td>
          <td>
            <select class="form-control font-semibold" onchange="app.updateGearField('${g.id}', 'observation', this.value)">
              ${findingsOptionsHtml}
            </select>
          </td>
          <td>
            <select class="form-control decision-select ${decClass}" onchange="app.updateGearField('${g.id}', 'assessment', this.value)">
              <option value="" ${!assessment ? 'selected' : ''}>Select Decision</option>
              <option value="Acceptable" ${assessment === 'Acceptable' ? 'selected' : ''}>✓ Acceptable</option>
              <option value="Caution" ${assessment === 'Caution' ? 'selected' : ''}>⚠️ Caution</option>
              <option value="Defect" ${assessment === 'Defect' ? 'selected' : ''}>❌ Defect</option>
              <option value="Reuse" ${assessment === 'Reuse' ? 'selected' : ''}>Reuse (Rework by hand)</option>
              <option value="Regrind" ${assessment === 'Regrind' ? 'selected' : ''}>Regrind (Teeth regrinding)</option>
              <option value="Rework" ${assessment === 'Rework' ? 'selected' : ''}>Rework (Surface rework)</option>
              <option value="Replace by Upgrade" ${assessment === 'Replace by Upgrade' ? 'selected' : ''}>Replace by Upgrade</option>
              <option value="Rework to Upgrade" ${assessment === 'Rework to Upgrade' ? 'selected' : ''}>Rework to Upgrade</option>
              <option value="Replace by Oversize" ${assessment === 'Replace by Oversize' ? 'selected' : ''}>Replace by Oversize</option>
              <option value="Oversize" ${assessment === 'Oversize' ? 'selected' : ''}>Oversize (Oversize bore)</option>
              <option value="Flip" ${assessment === 'Flip' ? 'selected' : ''}>Flip (Flank reversal)</option>
              <option value="Scrap" ${assessment === 'Scrap' ? 'selected' : ''}>Scrap (Replace by new part)</option>
              <option value="Scrap(Rework Gear)" ${assessment === 'Scrap(Rework Gear)' ? 'selected' : ''}>Scrap(Rework Gear)</option>
              <option value="std replacement part" ${assessment === 'std replacement part' ? 'selected' : ''}>std replacement part</option>
              <option value="Not Acceptable" ${assessment === 'Not Acceptable' || assessment === 'Not acceptable' ? 'selected' : ''}>✕ Not Acceptable</option>
              <option value="Monitor" ${assessment === 'Monitor' ? 'selected' : ''}>👁️ Monitor</option>
              <option value="Replace" ${assessment === 'Replace' ? 'selected' : ''}>🔄 Replace</option>
              <option value="Further Inspection Required" ${assessment === 'Further Inspection Required' ? 'selected' : ''}>🔍 Further Inspection</option>
            </select>
          </td>
          <td>
            ${photos.length > 0 ? `
              <div class="table-photos-cell-wrap">
                ${photos.map((p, pIdx) => `
                  <div class="table-photo-card" title="${(p.caption || p.label || 'Gear Photo ' + (pIdx + 1)).replace(/"/g, '&quot;')}">
                    <img src="${p.url}" class="table-photo-thumb" onclick="app.openPreviewModalSingle('${p.url}')" alt="Photo ${pIdx + 1}">
                    <div class="table-photo-card-actions">
                      <button type="button" class="btn-micro" onclick="app.openEditPhotoModal('${p.photoId}', '${g.id}', '${(g.location || '').replace(/'/g, "\\'")}', '${(p.caption || '').replace(/'/g, "\\'")}')" title="Edit / Replace">✏️</button>
                      <button type="button" class="btn-micro btn-micro-danger" onclick="app.deletePhotoById('${p.photoId}')" title="Remove Photo">✕</button>
                    </div>
                  </div>
                `).join('')}
                <button type="button" class="btn-table-photo-add-more" onclick="app.openRowPhotoModal('gear-condition', '${g.id}', '${(g.location || '').replace(/'/g, "\\'")}', '${(g.observation || '').replace(/'/g, "\\'")}', true)" title="Add another photo to this gear">
                  +📷
                </button>
              </div>
            ` : `
              <button type="button" class="btn-table-photo-add" onclick="app.openRowPhotoModal('gear-condition', '${g.id}', '${(g.location || '').replace(/'/g, "\\'")}', '${(g.observation || '').replace(/'/g, "\\'")}', true)">
                📷 + Photo
              </button>
            `}
          </td>
          <td style="text-align: center;">
            <button type="button" class="btn-delete-item" onclick="app.removeGearRow('${g.id}')" title="Delete gear row">✕</button>
          </td>
        </tr>
      `;
    }).join('');
  }

  addGearRow() {
    if (!this.currentData.gearAssessment) this.currentData.gearAssessment = [];
    const newId = `g_${Date.now()}`;
    this.currentData.gearAssessment.push({
      id: newId,
      location: '',
      observation: '',
      assessment: ''
    });
    this.renderGearsTable();
    this.debouncedSaveAndRender();
    this.showToast('✓ Added new gear row');
  }

  removeGearRow(id) {
    if (this.currentData.gearAssessment) {
      this.currentData.gearAssessment = this.currentData.gearAssessment.filter(g => g.id !== id);
      PhotoManager.removePhotoByItemId(this.currentData, id);
      this.renderGearsTable();
      this.debouncedSaveAndRender();
      this.showToast('Gear row deleted');
    }
  }

  updateGearField(id, field, value) {
    const gear = (this.currentData.gearAssessment || []).find(g => g.id === id);
    if (gear) {
      gear[field] = value;
      if (field === 'assessment') {
        this.renderGearsTable();
      }
      this.debouncedSaveAndRender();
      this.updateSectionIndicators();
    }
  }

  // ==========================================
  // AUXILIARY COMPONENTS & SECTION PHOTOS
  // ==========================================
  renderAuxiliaryTables() {
    // 1. Bores
    const boreTbody = document.getElementById('bore-inspection-tbody');
    if (boreTbody) {
      const bores = this.currentData.boreAssessment || [];
      boreTbody.innerHTML = bores.map((b, i) => {
        if (!b.id) b.id = `bore_${i}_${(b.location || '').replace(/\s+/g, '_').toLowerCase()}`;
        const photo = PhotoManager.getPhotoByItemId(this.currentData.photos, b.id);
        return `
          <tr>
            <td class="font-semibold">${b.location}</td>
            <td><input type="text" class="form-control" value="${b.observation || ''}" oninput="app.updateAuxField('boreAssessment', '${b.id}', 'observation', this.value)" onchange="app.updateAuxField('boreAssessment', '${b.id}', 'observation', this.value)"></td>
            <td>
              <select class="form-control decision-select ${b.assessment ? 'dec-' + b.assessment.toLowerCase().replace(/\s+/g, '-') : ''}" onchange="app.updateAuxField('boreAssessment', '${b.id}', 'assessment', this.value)">
                <option value="" ${!b.assessment ? 'selected' : ''}>Select Decision</option>
                <option value="Acceptable" ${b.assessment === 'Acceptable' ? 'selected' : ''}>✓ Acceptable</option>
                <option value="Caution" ${b.assessment === 'Caution' ? 'selected' : ''}>⚠️ Caution</option>
                <option value="Not Acceptable" ${b.assessment === 'Not Acceptable' ? 'selected' : ''}>✕ Not Acceptable</option>
              </select>
            </td>
            <td>
              ${photo && photo.url ? `
                <img src="${photo.url}" class="table-photo-thumb" onclick="app.openPreviewModalSingle('${photo.url}')">
              ` : `
                <button type="button" class="btn-table-photo-add" onclick="app.openRowPhotoModal('shafts-bores', '${b.id}', '${b.location}')">+ Photo</button>
              `}
            </td>
          </tr>
        `;
      }).join('');
    }

    // 2. Shafts
    const shaftTbody = document.getElementById('shaft-inspection-tbody');
    if (shaftTbody) {
      const shafts = this.currentData.shaftAssessment || [];
      shaftTbody.innerHTML = shafts.map((s, i) => {
        if (!s.id) s.id = `shaft_${i}_${(s.location || '').replace(/\s+/g, '_').toLowerCase()}`;
        const photo = PhotoManager.getPhotoByItemId(this.currentData.photos, s.id);
        return `
          <tr>
            <td class="font-semibold">${s.location}</td>
            <td><input type="text" class="form-control" value="${s.observation || ''}" oninput="app.updateAuxField('shaftAssessment', '${s.id}', 'observation', this.value)" onchange="app.updateAuxField('shaftAssessment', '${s.id}', 'observation', this.value)"></td>
            <td>
              <select class="form-control decision-select ${s.assessment ? 'dec-' + s.assessment.toLowerCase().replace(/\s+/g, '-') : ''}" onchange="app.updateAuxField('shaftAssessment', '${s.id}', 'assessment', this.value)">
                <option value="" ${!s.assessment ? 'selected' : ''}>Select Decision</option>
                <option value="Acceptable" ${s.assessment === 'Acceptable' ? 'selected' : ''}>✓ Acceptable</option>
                <option value="Caution" ${s.assessment === 'Caution' ? 'selected' : ''}>⚠️ Caution</option>
                <option value="Not Acceptable" ${s.assessment === 'Not Acceptable' ? 'selected' : ''}>✕ Not Acceptable</option>
              </select>
            </td>
            <td>
              ${photo && photo.url ? `
                <img src="${photo.url}" class="table-photo-thumb" onclick="app.openPreviewModalSingle('${photo.url}')">
              ` : `
                <button type="button" class="btn-table-photo-add" onclick="app.openRowPhotoModal('shafts-bores', '${s.id}', '${s.location}')">+ Photo</button>
              `}
            </td>
          </tr>
        `;
      }).join('');
    }

    // 3. Section Photo Strips
    this.renderSectionPhotos();
  }

  // ==========================================
  // CUSTOM / SUBSYSTEM INSPECTIONS DASHBOARD
  // ==========================================
  static SUBSYSTEM_TYPES = [
    'Bearings',
    'Gears & Meshes',
    'Shafts & Couplings',
    'Housing & Structural Frame',
    'Lubrication & Distribution Pump',
    'Filtration & Magnetic Separation',
    'Seals, Gaskets & Bores',
    'Brake & Yaw Mechanism',
    'Sensors & Electrical Telemetry',
    'Generator Connection',
    'Other Subsystem'
  ];

  static SEVERITY_LEVELS = [
    'Normal',
    'Low',
    'Moderate',
    'High',
    'Critical'
  ];

  static DECISION_OPTIONS = [
    { value: 'Acceptable', label: '✓ Acceptable' },
    { value: 'Reuse', label: 'Reuse (Rework by hand)' },
    { value: 'Regrind', label: 'Regrind (Teeth regrinding)' },
    { value: 'Rework', label: 'Rework (Surface rework)' },
    { value: 'Replace by Upgrade', label: 'Replace by Upgrade' },
    { value: 'Rework to Upgrade', label: 'Rework to Upgrade' },
    { value: 'Replace by Oversize', label: 'Replace by Oversize' },
    { value: 'Oversize', label: 'Oversize (Oversize bore)' },
    { value: 'Flip', label: 'Flip (Flank reversal)' },
    { value: 'Scrap', label: 'Scrap (Replace by new part)' },
    { value: 'Scrap(Rework Gear)', label: 'Scrap(Rework Gear)' },
    { value: 'std replacement part', label: 'std replacement part' },
    { value: 'Caution', label: '⚠️ Caution' },
    { value: 'Not Acceptable', label: '✕ Not Acceptable' },
    { value: 'Monitor', label: '👁️ Monitor' },
    { value: 'Replace', label: '🔄 Replace' },
    { value: 'Further Inspection Required', label: '🔍 Further Inspection' }
  ];

  renderCustomInspectionsTable() {
    const tbody = document.getElementById('custom-inspection-tbody');
    if (!tbody) return;
    const inspections = this.currentData.customInspections || [];
    const damageOptions = this.constructor.BEARING_FINDINGS_OPTIONS || App.BEARING_FINDINGS_OPTIONS;

    // Also populate quick inspection damage select if needed
    const quickDamageSelect = document.getElementById('quick-insp-damage');
    if (quickDamageSelect && quickDamageSelect.options && quickDamageSelect.options.length === 0) {
      quickDamageSelect.innerHTML = damageOptions.map(opt => `<option value="${opt}">${opt}</option>`).join('');
    }

    if (inspections.length === 0) {
      tbody.innerHTML = `
        <tr>
          <td colspan="8" style="text-align: center; color: var(--text-muted); padding: 24px;">
            No custom inspection items logged yet. Use the Quick Inspection Logger above or click <strong>+ Add Inspection</strong>.
          </td>
        </tr>
      `;
      return;
    }

    tbody.innerHTML = inspections.map((item, i) => {
      if (!item.id) item.id = `insp_${i}_${Date.now()}`;
      const decision = item.decision || '';
      const decClass = decision ? `dec-${decision.toLowerCase().replace(/[\s()]+/g, '-')}` : '';
      const severity = item.severity || '';
      const sevClass = severity ? `sev-${severity.toLowerCase()}` : '';
      const photos = PhotoManager.getPhotosByItemId(this.currentData.photos, item.id);
      const isCustomDamage = item.damage && !damageOptions.includes(item.damage);

      return `
        <tr id="row-${item.id}">
          <td>
            <select class="form-control font-semibold" onchange="app.updateCustomInspectionField('${item.id}', 'conditionOf', this.value)">
              <option value="" ${!item.conditionOf ? 'selected' : ''}>Select Subsystem</option>
              ${App.SUBSYSTEM_TYPES.map(sub => `
                <option value="${sub}" ${item.conditionOf === sub ? 'selected' : ''}>${sub}</option>
              `).join('')}
            </select>
          </td>
          <td>
            <input type="text" class="form-control font-semibold" value="${(item.location || '').replace(/"/g, '&quot;')}" oninput="app.updateCustomInspectionField('${item.id}', 'location', this.value)" onchange="app.updateCustomInspectionField('${item.id}', 'location', this.value)" placeholder="Component Location">
          </td>
          <td>
            <select class="form-control font-bold ${sevClass}" onchange="app.updateCustomInspectionField('${item.id}', 'severity', this.value)">
              <option value="" ${!item.severity ? 'selected' : ''}>Select Severity</option>
              ${App.SEVERITY_LEVELS.map(sev => `
                <option value="${sev}" ${item.severity === sev ? 'selected' : ''}>${sev}</option>
              `).join('')}
            </select>
          </td>
          <td>
            <select class="form-control font-semibold" onchange="app.updateCustomInspectionField('${item.id}', 'damage', this.value)">
              <option value="" ${!item.damage ? 'selected' : ''}>Select Finding</option>
              ${isCustomDamage ? `<option value="${(item.damage || '').replace(/"/g, '&quot;')}" selected>${item.damage} (Custom)</option>` : ''}
              ${damageOptions.map(opt => `
                <option value="${opt}" ${item.damage === opt ? 'selected' : ''}>${opt}</option>
              `).join('')}
            </select>
          </td>
          <td>
            <select class="form-control decision-select ${decClass}" onchange="app.updateCustomInspectionField('${item.id}', 'decision', this.value)">
              <option value="" ${!decision ? 'selected' : ''}>Select Decision</option>
              ${App.DECISION_OPTIONS.map(d => `
                <option value="${d.value}" ${decision === d.value ? 'selected' : ''}>${d.label}</option>
              `).join('')}
            </select>
          </td>
          <td>
            <input type="text" class="form-control" value="${(item.remark || '').replace(/"/g, '&quot;')}" oninput="app.updateCustomInspectionField('${item.id}', 'remark', this.value)" onchange="app.updateCustomInspectionField('${item.id}', 'remark', this.value)" placeholder="Engineering observations...">
          </td>
          <td>
            ${photos.length > 0 ? `
              <div class="table-photos-cell-wrap">
                ${photos.map((p, pIdx) => `
                  <div class="table-photo-card" title="${(p.caption || p.label || 'Inspection Photo ' + (pIdx + 1)).replace(/"/g, '&quot;')}">
                    <img src="${p.url}" class="table-photo-thumb" onclick="app.openPreviewModalSingle('${p.url}')" alt="Photo ${pIdx + 1}">
                    <div class="table-photo-card-actions">
                      <button type="button" class="btn-micro" onclick="app.openEditPhotoModal('${p.photoId}', '${item.id}', '${(item.conditionOf + ' - ' + item.location).replace(/'/g, "\\'")}', '${(p.caption || '').replace(/'/g, "\\'")}')" title="Edit / Replace">✏️</button>
                      <button type="button" class="btn-micro btn-micro-danger" onclick="app.deletePhotoById('${p.photoId}')" title="Remove Photo">✕</button>
                    </div>
                  </div>
                `).join('')}
                <button type="button" class="btn-table-photo-add-more" onclick="app.openRowPhotoModal('custom-inspections', '${item.id}', '${(item.conditionOf + ' - ' + item.location).replace(/'/g, "\\'")}', '${(item.remark || item.damage || '').replace(/'/g, "\\'")}', true)" title="Add another photo">
                  +📷
                </button>
              </div>
            ` : `
              <button type="button" class="btn-table-photo-add" onclick="app.openRowPhotoModal('custom-inspections', '${item.id}', '${(item.conditionOf + ' - ' + item.location).replace(/'/g, "\\'")}', '${(item.remark || item.damage || '').replace(/'/g, "\\'")}', true)">
                📷 + Photo
              </button>
            `}
          </td>
          <td style="text-align: center;">
            <button type="button" class="btn-delete-item" onclick="app.removeCustomInspectionRow('${item.id}')" title="Delete inspection item">✕</button>
          </td>
        </tr>
      `;
    }).join('');
  }

  addNewInspectionItem() {
    if (!this.currentData.customInspections) this.currentData.customInspections = [];
    const newId = `insp_${Date.now()}`;
    this.currentData.customInspections.push({
      id: newId,
      conditionOf: '',
      location: '',
      severity: '',
      damage: '',
      decision: '',
      remark: ''
    });
    this.renderCustomInspectionsTable();
    this.debouncedSaveAndRender();
    this.showToast('✓ Added new inspection item');
  }

  submitQuickInspection() {
    const condition = document.getElementById('quick-insp-condition')?.value || 'Bearings';
    const location = document.getElementById('quick-insp-location')?.value || 'General Subsystem';
    const severity = document.getElementById('quick-insp-severity')?.value || 'Normal';
    const damage = document.getElementById('quick-insp-damage')?.value || 'No visual damage';
    const decision = document.getElementById('quick-insp-decision')?.value || 'Acceptable';
    const remark = document.getElementById('quick-insp-remark')?.value || 'Inspected and verified within operating standards.';

    if (!this.currentData.customInspections) this.currentData.customInspections = [];
    const newId = `insp_${Date.now()}`;
    this.currentData.customInspections.unshift({
      id: newId,
      conditionOf: condition,
      location: location,
      severity: severity,
      damage: damage,
      decision: decision,
      remark: remark
    });

    // Reset quick logger inputs
    const locEl = document.getElementById('quick-insp-location');
    const remEl = document.getElementById('quick-insp-remark');
    if (locEl) locEl.value = '';
    if (remEl) remEl.value = '';

    this.renderCustomInspectionsTable();
    this.debouncedSaveAndRender();
    this.updateSectionIndicators();
    this.showToast('✓ Inspection record added successfully');
  }

  removeCustomInspectionRow(id) {
    if (this.currentData.customInspections) {
      this.currentData.customInspections = this.currentData.customInspections.filter(item => item.id !== id);
      PhotoManager.removePhotoByItemId(this.currentData, id);
      this.renderCustomInspectionsTable();
      this.debouncedSaveAndRender();
      this.showToast('Inspection item deleted');
    }
  }

  updateCustomInspectionField(id, field, value) {
    const item = (this.currentData.customInspections || []).find(it => it.id === id);
    if (item) {
      item[field] = value;
      if (field === 'decision' || field === 'severity') {
        this.renderCustomInspectionsTable();
      }
      this.debouncedSaveAndRender();
      this.updateSectionIndicators();
    }
  }

  updateAuxField(arrayName, id, field, value) {
    const item = (this.currentData[arrayName] || []).find(x => x.id === id);
    if (item) {
      item[field] = value;
      this.debouncedSaveAndRender();
    }
  }

  renderSectionPhotos() {
    // Section 1: Report Information - Gearbox photo (Cover Page only)
    const nameplateContainer = document.getElementById('gearbox-nameplate-photos-container');
    if (nameplateContainer) {
      const coverPhotos = (this.currentData.photos || []).filter(p => p && p.url && (
        p.slotId === 'slot_gearbox_cover' || 
        p.sectionId === 'report-info' || 
        (p.slotId === 'slot_gearbox_nameplate' && p.sectionId !== 'turbine-info' && p.sectionId !== 'turbine-specs')
      ));
      if (coverPhotos.length > 0) {
        nameplateContainer.innerHTML = coverPhotos.map((p, idx) => `
          <div class="table-photo-card" title="${(p.caption || 'Gearbox Photo ' + (idx + 1)).replace(/"/g, '&quot;')}">
            <img src="${p.url}" class="table-photo-thumb" onclick="app.openPreviewModalSingle('${p.url}')" alt="Gearbox Photo ${idx + 1}">
            <div class="table-photo-card-actions">
              <button type="button" class="btn-micro" onclick="app.openEditPhotoModal('${p.photoId}', '${p.slotId || 'slot_gearbox_cover'}', 'Gearbox', '${(p.caption || 'Gearbox').replace(/'/g, "\\'")}')" title="Edit / Replace">✏️</button>
              <button type="button" class="btn-micro btn-micro-danger" onclick="app.deletePhotoById('${p.photoId}')" title="Remove Photo">✕</button>
            </div>
          </div>
        `).join('') + `
          <button type="button" class="btn-table-photo-add-more" onclick="app.openRowPhotoModal('report-info', 'slot_gearbox_cover', 'Gearbox', 'Gearbox', true)" title="Add another gearbox photo">
            +📷
          </button>
        `;
      } else {
        nameplateContainer.innerHTML = '';
      }
    }

    // Section 2: Customer & Turbine - Gearbox Nameplate photo (Final Evidence section only)
    const gearboxTurbineContainer = document.getElementById('gearbox-turbine-photos-container');
    if (gearboxTurbineContainer) {
      const turbineGearboxPhotos = (this.currentData.photos || []).filter(p => p && p.url && (
        p.slotId === 'slot_gearbox_turbine' || 
        p.slotId === 'slot_gearbox_evidence' || 
        (p.slotId === 'slot_gearbox_nameplate' && (p.sectionId === 'turbine-info' || p.sectionId === 'turbine-specs'))
      ));
      if (turbineGearboxPhotos.length > 0) {
        gearboxTurbineContainer.innerHTML = turbineGearboxPhotos.map((p, idx) => `
          <div class="table-photo-card" title="${(p.caption || 'Gearbox Nameplate Photo ' + (idx + 1)).replace(/"/g, '&quot;')}">
            <img src="${p.url}" class="table-photo-thumb" onclick="app.openPreviewModalSingle('${p.url}')" alt="Gearbox Nameplate Photo ${idx + 1}">
            <div class="table-photo-card-actions">
              <button type="button" class="btn-micro" onclick="app.openEditPhotoModal('${p.photoId}', '${p.slotId || 'slot_gearbox_turbine'}', 'Gearbox Nameplate', '${(p.caption || 'Gearbox Nameplate').replace(/'/g, "\\'")}')" title="Edit / Replace">✏️</button>
              <button type="button" class="btn-micro btn-micro-danger" onclick="app.deletePhotoById('${p.photoId}')" title="Remove Photo">✕</button>
            </div>
          </div>
        `).join('') + `
          <button type="button" class="btn-table-photo-add-more" onclick="app.openRowPhotoModal('turbine-info', 'slot_gearbox_turbine', 'Gearbox Nameplate', 'Gearbox Nameplate', true)" title="Add another gearbox nameplate photo">
            +📷
          </button>
        `;
      } else {
        gearboxTurbineContainer.innerHTML = '';
      }
    }

    // Section 2: Customer Complaint multi-photos
    const complaintContainer = document.getElementById('complaint-photos-container');
    if (complaintContainer) {
      const complaintPhotos = PhotoManager.getPhotosByItemId(this.currentData.photos, 'slot_customer_complaint');
      if (complaintPhotos.length > 0) {
        complaintContainer.innerHTML = complaintPhotos.map((p, idx) => `
          <div class="table-photo-card" title="${(p.caption || 'Complaint Proof ' + (idx + 1)).replace(/"/g, '&quot;')}">
            <img src="${p.url}" class="table-photo-thumb" onclick="app.openPreviewModalSingle('${p.url}')" alt="Complaint Photo ${idx + 1}">
            <div class="table-photo-card-actions">
              <button type="button" class="btn-micro" onclick="app.openEditPhotoModal('${p.photoId}', 'slot_customer_complaint', 'Customer Complaint / SCADA Proof', '${(p.caption || '').replace(/'/g, "\\'")}')" title="Edit / Replace">✏️</button>
              <button type="button" class="btn-micro btn-micro-danger" onclick="app.deletePhotoById('${p.photoId}')" title="Remove Photo">✕</button>
            </div>
          </div>
        `).join('') + `
          <button type="button" class="btn-table-photo-add-more" onclick="app.openRowPhotoModal('turbine-info', 'slot_customer_complaint', 'Customer Complaint / SCADA Proof', 'Customer complaint evidence / SCADA alarm log proof', true)" title="Add another complaint/alarm photo">
            +📷
          </button>
        `;
      } else {
        complaintContainer.innerHTML = '';
      }
    }

    // Section 2: Work Performed multi-photos
    const workContainer = document.getElementById('work-performed-photos-container');
    if (workContainer) {
      const workPhotos = PhotoManager.getPhotosByItemId(this.currentData.photos, 'slot_work_performed');
      if (workPhotos.length > 0) {
        workContainer.innerHTML = workPhotos.map((p, idx) => `
          <div class="table-photo-card" title="${(p.caption || 'Work Performed Proof ' + (idx + 1)).replace(/"/g, '&quot;')}">
            <img src="${p.url}" class="table-photo-thumb" onclick="app.openPreviewModalSingle('${p.url}')" alt="Work Photo ${idx + 1}">
            <div class="table-photo-card-actions">
              <button type="button" class="btn-micro" onclick="app.openEditPhotoModal('${p.photoId}', 'slot_work_performed', 'Work Performed / Service Proof', '${(p.caption || '').replace(/'/g, "\\'")}')" title="Edit / Replace">✏️</button>
              <button type="button" class="btn-micro btn-micro-danger" onclick="app.deletePhotoById('${p.photoId}')" title="Remove Photo">✕</button>
            </div>
          </div>
        `).join('') + `
          <button type="button" class="btn-table-photo-add-more" onclick="app.openRowPhotoModal('turbine-info', 'slot_work_performed', 'Work Performed / Service Proof', 'Work execution proof / On-site service photo', true)" title="Add another work photo">
            +📷
          </button>
        `;
      } else {
        workContainer.innerHTML = '';
      }
    }

    // Section 2: Turbine photos
    const turbStrip = document.getElementById('section-photos-turbine');
    if (turbStrip) {
      const photos = (this.currentData.photos || []).filter(p => p && (
        ((p.sectionId === 'turbine-info' || p.sectionId === 'turbine-specs' || (p.category && p.category.toLowerCase().includes('turbine'))) &&
        p.slotId !== 'slot_gearbox_cover' && p.sectionId !== 'report-info') ||
        p.slotId === 'slot_gearbox_turbine'
      ));
      turbStrip.innerHTML = photos.map(p => `
        <div class="section-photo-thumb-card">
          <img src="${p.url}" alt="${p.label || 'Turbine photo'}" onclick="app.openPreviewModalSingle('${p.url}')">
          <button type="button" class="section-photo-thumb-del" onclick="app.deletePhotoById('${p.photoId}')" title="Remove">✕</button>
        </div>
      `).join('');
    }

    // Section 3: Lubrication photos
    const lubStrip = document.getElementById('section-photos-lubrication');
    if (lubStrip) {
      const photos = (this.currentData.photos || []).filter(p => p && (p.sectionId === 'lubrication' || (p.category && p.category.toLowerCase().includes('lubricat')) || p.slotId === 'slot_oil_level' || p.slotId === 'slot_magnet_debris'));
      lubStrip.innerHTML = photos.map(p => `
        <div class="section-photo-thumb-card">
          <img src="${p.url}" alt="${p.label || 'Lubrication photo'}" onclick="app.openPreviewModalSingle('${p.url}')">
          <button type="button" class="section-photo-thumb-del" onclick="app.deletePhotoById('${p.photoId}')" title="Remove">✕</button>
        </div>
      `).join('');
    }

    // Oil Level at Sight Glass multi-photos
    const oilLevelContainer = document.getElementById('oil-level-photos-container');
    if (oilLevelContainer) {
      const oilPhotos = PhotoManager.getPhotosByItemId(this.currentData.photos, 'slot_oil_level');
      if (oilPhotos.length > 0) {
        oilLevelContainer.innerHTML = oilPhotos.map((p, idx) => `
          <div class="table-photo-card" title="${(p.caption || 'Oil Level Proof ' + (idx + 1)).replace(/"/g, '&quot;')}">
            <img src="${p.url}" class="table-photo-thumb" onclick="app.openPreviewModalSingle('${p.url}')" alt="Oil Photo ${idx + 1}">
            <div class="table-photo-card-actions">
              <button type="button" class="btn-micro" onclick="app.openEditPhotoModal('${p.photoId}', 'slot_oil_level', 'Oil Level at Sight Glass', '${(p.caption || '').replace(/'/g, "\\'")}')" title="Edit / Replace">✏️</button>
              <button type="button" class="btn-micro btn-micro-danger" onclick="app.deletePhotoById('${p.photoId}')" title="Remove Photo">✕</button>
            </div>
          </div>
        `).join('') + `
          <button type="button" class="btn-table-photo-add-more" onclick="app.openRowPhotoModal('lubrication', 'slot_oil_level', 'Oil Level at Sight Glass', 'Oil level verification at sight glass', true)" title="Add another photo proof for oil level">
            +📷
          </button>
        `;
      } else {
        oilLevelContainer.innerHTML = '';
      }
    }

    // Magnetic Stick / Drain Plug multi-photos
    const magnetContainer = document.getElementById('magnet-debris-photos-container');
    if (magnetContainer) {
      const magnetPhotos = PhotoManager.getPhotosByItemId(this.currentData.photos, 'slot_magnet_debris');
      if (magnetPhotos.length > 0) {
        magnetContainer.innerHTML = magnetPhotos.map((p, idx) => `
          <div class="table-photo-card" title="${(p.caption || 'Magnet Debris Proof ' + (idx + 1)).replace(/"/g, '&quot;')}">
            <img src="${p.url}" class="table-photo-thumb" onclick="app.openPreviewModalSingle('${p.url}')" alt="Magnet Photo ${idx + 1}">
            <div class="table-photo-card-actions">
              <button type="button" class="btn-micro" onclick="app.openEditPhotoModal('${p.photoId}', 'slot_magnet_debris', 'Magnetic Stick Debris', '${(p.caption || '').replace(/'/g, "\\'")}')" title="Edit / Replace">✏️</button>
              <button type="button" class="btn-micro btn-micro-danger" onclick="app.deletePhotoById('${p.photoId}')" title="Remove Photo">✕</button>
            </div>
          </div>
        `).join('') + `
          <button type="button" class="btn-table-photo-add-more" onclick="app.openRowPhotoModal('lubrication', 'slot_magnet_debris', 'Magnetic Stick Debris', 'Debris inspection on magnetic stick / drain plug', true)" title="Add another photo proof for magnetic stick">
            +📷
          </button>
        `;
      } else {
        magnetContainer.innerHTML = '';
      }
    }

    // Filter Housing multi-photos
    const filterContainer = document.getElementById('filter-debris-photos-container');
    if (filterContainer) {
      const filterPhotos = PhotoManager.getPhotosByItemId(this.currentData.photos, 'slot_filter_debris');
      if (filterPhotos.length > 0) {
        filterContainer.innerHTML = filterPhotos.map((p, idx) => `
          <div class="table-photo-card" title="${(p.caption || 'Filter Debris Proof ' + (idx + 1)).replace(/"/g, '&quot;')}">
            <img src="${p.url}" class="table-photo-thumb" onclick="app.openPreviewModalSingle('${p.url}')" alt="Filter Photo ${idx + 1}">
            <div class="table-photo-card-actions">
              <button type="button" class="btn-micro" onclick="app.openEditPhotoModal('${p.photoId}', 'slot_filter_debris', 'Inline Filter Debris', '${(p.caption || '').replace(/'/g, "\\'")}')" title="Edit / Replace">✏️</button>
              <button type="button" class="btn-micro btn-micro-danger" onclick="app.deletePhotoById('${p.photoId}')" title="Remove Photo">✕</button>
            </div>
          </div>
        `).join('') + `
          <button type="button" class="btn-table-photo-add-more" onclick="app.openRowPhotoModal('lubrication', 'slot_filter_debris', 'Inline Filter Debris', 'Inline filter element particle inspection', true)" title="Add another photo proof for filter">
            +📷
          </button>
        `;
      } else {
        filterContainer.innerHTML = '';
      }
    }
  }

  markAllComponents(arrayName, status) {
    if (this.currentData[arrayName]) {
      this.currentData[arrayName].forEach(item => item.assessment = status);
      if (arrayName === 'bearingAssessment') this.renderBearingsTable();
      if (arrayName === 'gearAssessment') this.renderGearsTable();
      this.debouncedSaveAndRender();
      this.updateSectionIndicators();
      this.showToast(`All components marked as ${status}`);
    }
  }

  // ==========================================
  // ROW-LEVEL PHOTO MODAL HANDLER
  // ==========================================
  openRowPhotoModal(sectionId, itemId, label, defaultCaption = '', isNew = true, targetPhotoId = null) {
    this.activePhotoTarget = {
      sectionId: sectionId || 'general',
      itemId: itemId,
      label: label || 'Inspection Item',
      defaultCaption: defaultCaption,
      isNew: isNew,
      targetPhotoId: targetPhotoId
    };

    this.modalPhotoBase64 = null;
    this.modalPhotoBase64List = [];
    const modal = document.getElementById('add-photo-modal');
    const fileInput = document.getElementById('modal-photo-file-input');
    const previewWrap = document.getElementById('modal-photo-preview-wrap');
    const previewImg = document.getElementById('modal-photo-preview-img');
    const catSelect = document.getElementById('modal-photo-category-select');
    const captionInput = document.getElementById('modal-photo-caption');

    if (fileInput) fileInput.value = '';
    if (previewWrap) previewWrap.style.display = 'none';
    if (previewImg) previewImg.src = '';
    if (captionInput) captionInput.value = defaultCaption || label;

    // If editing/replacing a specific photo
    if (targetPhotoId) {
      const existingPhoto = (this.currentData.photos || []).find(p => p && p.photoId === targetPhotoId);
      if (existingPhoto && existingPhoto.url) {
        this.modalPhotoBase64 = existingPhoto.url;
        this.modalPhotoBase64List = [existingPhoto.url];
        if (previewImg) previewImg.src = existingPhoto.url;
        if (previewWrap) previewWrap.style.display = 'block';
        if (captionInput) captionInput.value = existingPhoto.caption || defaultCaption || label;
      }
    }

    if (catSelect) {
      if (sectionId === 'bearing-condition') catSelect.value = 'Borescope Bearings';
      else if (sectionId === 'gear-condition') catSelect.value = 'Gear Teeth';
      else if (sectionId === 'lubrication') catSelect.value = 'Lubrication';
      else if (sectionId === 'turbine-info' || sectionId === 'report-info' || sectionId === 'turbine-specs') catSelect.value = 'Identification';
      else catSelect.value = 'Custom';
      this.onModalPhotoCategoryChange(catSelect.value);
    }

    if (modal) modal.classList.add('active');
  }

  openEditPhotoModal(photoId, itemId, label, caption = '') {
    const photo = (this.currentData.photos || []).find(p => p && p.photoId === photoId);
    const sectionId = photo ? photo.sectionId : 'bearing-condition';
    this.openRowPhotoModal(sectionId, itemId, label, caption || (photo ? photo.caption : ''), false, photoId);
  }

  async deletePhotoById(photoId) {
    if (!photoId || !this.currentData.photos) return;
    PhotoManager.removePhotoById(this.currentData, photoId);
    await PhotoDB.deletePhoto(photoId);
    this.renderBearingsTable();
    this.renderGearsTable();
    this.renderAuxiliaryTables();
    this.renderSectionPhotos();
    this.renderPhotoGrid();
    this.debouncedSaveAndRender();
    this.updateSectionIndicators();
    this.showToast('✓ Photo evidence removed');
  }

  async clearRowPhoto(itemId) {
    if (this.currentData.photos) {
      PhotoManager.removePhotoByItemId(this.currentData, itemId);
      await PhotoDB.deletePhoto(itemId);
      this.renderBearingsTable();
      this.renderGearsTable();
      this.renderAuxiliaryTables();
      this.renderSectionPhotos();
      this.renderPhotoGrid();
      this.debouncedSaveAndRender();
      this.updateSectionIndicators();
      this.showToast('Photo evidence removed.');
    }
  }

  openPreviewModalSingle(url) {
    const modal = document.getElementById('single-photo-preview-modal');
    if (!modal) {
      window.open(url, '_blank');
      return;
    }
    const img = document.getElementById('single-photo-preview-img');
    if (img) img.src = url;
    modal.classList.add('active');
  }

  // ==========================================
  // PHOTO EVIDENCE HUB (CONSOLIDATED ZERO EMPTY CARDS)
  // ==========================================
  renderPhotoGrid() {
    const container = document.getElementById('photo-evidence-container');
    if (!container) return;

    const photos = (this.currentData.photos || []).filter(p => p && p.url);

    const countBadge = document.getElementById('photo-hub-count-badge');
    if (countBadge) {
      countBadge.innerText = `Photos Documented: ${photos.length}`;
    }

    if (photos.length === 0) {
      container.innerHTML = `
        <div class="photo-empty-state-box">
          <div class="empty-state-icon">📷</div>
          <div class="empty-state-title">No Visual Evidence Photos Attached Yet</div>
          <div class="empty-state-text">
            Attach photos directly inside technical inspection sections (Turbine, Lubrication, Bearings, Gears) or add them here. Empty slots will not clutter the interface or the PDF report.
          </div>
          <div class="empty-state-actions">
            <button type="button" class="btn btn-primary" onclick="app.openAddPhotoModal()">
              + Add First Photo
            </button>
            <button type="button" class="btn btn-outline" onclick="CameraManager.openCameraModal(null, 'Live Photo Capture')">
              📷 Capture from Camera
            </button>
          </div>
        </div>
      `;
      return;
    }

    container.innerHTML = `
      <div class="attached-photos-grid">
        ${photos.map(p => {
          const pointName = PhotoManager.getPhotoDisplayName(p, this.currentData.customSlots || []);
          const group = PhotoManager.getPhotoCategoryGroup(p);
          const itemId = p.inspectionItemId || p.slotId || p.photoId;

          return `
          <div class="attached-photo-card">
            <div class="photo-preview-box">
              <img src="${p.url}" alt="${pointName}" onclick="app.openPreviewModalSingle('${p.url}')">
              ${p.timestamp ? `<div class="photo-hud-timestamp">${p.timestamp}</div>` : ''}
              ${group && group.title ? `<div class="photo-hud-category">${group.title.replace(/^\d+\.\s*/, '')}</div>` : ''}
            </div>
            <div class="photo-card-content">
              <div class="photo-card-title-row">
                <div class="photo-card-name">${pointName}</div>
              </div>
              <input type="text" class="photo-caption-input" value="${p.caption || ''}" oninput="app.updatePhotoCaption('${itemId}', this.value)" onchange="app.updatePhotoCaption('${itemId}', this.value)" placeholder="Enter observation / caption...">
            </div>
            <div class="photo-card-actions">
              <button type="button" class="btn btn-outline btn-sm" onclick="app.openRowPhotoModal('${p.sectionId || 'custom'}', '${itemId}', '${pointName}', '${p.caption || ''}')">
                📁 Replace
              </button>
              <button type="button" class="btn btn-outline btn-sm btn-text-danger" onclick="app.clearRowPhoto('${itemId}')">
                🗑️ Remove
              </button>
            </div>
          </div>
        `;
        }).join('')}
      </div>
    `;
  }

  // Open Modal to Add / Attach Photo (General Hub)
  openAddPhotoModal(prefillSlotId = null) {
    this.activePhotoTarget = null;
    this.modalPhotoBase64 = null;
    const modal = document.getElementById('add-photo-modal');
    const fileInput = document.getElementById('modal-photo-file-input');
    const previewWrap = document.getElementById('modal-photo-preview-wrap');
    const previewImg = document.getElementById('modal-photo-preview-img');
    const catSelect = document.getElementById('modal-photo-category-select');
    const captionInput = document.getElementById('modal-photo-caption');

    if (fileInput) fileInput.value = '';
    if (previewWrap) previewWrap.style.display = 'none';
    if (previewImg) previewImg.src = '';
    if (captionInput) captionInput.value = '';

    if (prefillSlotId) {
      const slot = PhotoManager.getSlotById(prefillSlotId, this.currentData.customSlots || []);
      if (slot) {
        catSelect.value = slot.category || 'Borescope Bearings';
        this.onModalPhotoCategoryChange(catSelect.value, slot.id);
        captionInput.value = slot.defaultCaption || slot.label;
      }
    } else {
      this.onModalPhotoCategoryChange(catSelect.value);
    }

    if (modal) modal.classList.add('active');
  }

  closeAddPhotoModal() {
    const modal = document.getElementById('add-photo-modal');
    if (modal) modal.classList.remove('active');
    this.activePhotoTarget = null;
  }

  onModalPhotoCategoryChange(category, selectSlotId = null) {
    const slotSelect = document.getElementById('modal-photo-slot-select');
    const slotGroup = document.getElementById('modal-photo-slot-group');
    const customGroup = document.getElementById('modal-photo-custom-title-group');
    const captionInput = document.getElementById('modal-photo-caption');

    if (category === 'Custom') {
      if (slotGroup) slotGroup.style.display = 'none';
      if (customGroup) customGroup.style.display = 'block';
      if (captionInput && !captionInput.value) captionInput.placeholder = 'e.g. Brake Disc Wear observation';
      return;
    }

    if (slotGroup) slotGroup.style.display = 'block';
    if (customGroup) customGroup.style.display = 'none';

    const slots = PhotoManager.getSlotsByCategory(category, this.currentData.customSlots || []);
    if (slotSelect) {
      slotSelect.innerHTML = slots.map(s => `
        <option value="${s.id}" ${selectSlotId === s.id ? 'selected' : ''}>${s.label}</option>
      `).join('');

      if (slots.length > 0) {
        this.onModalPhotoSlotChange(slotSelect.value);
      }
    }
  }

  onModalPhotoSlotChange(slotId) {
    const slot = PhotoManager.getSlotById(slotId, this.currentData.customSlots || []);
    const captionInput = document.getElementById('modal-photo-caption');
    if (slot && captionInput && !captionInput.value) {
      captionInput.value = slot.defaultCaption || slot.label;
    }
  }

  async previewModalPhotoFile(fileOrFiles) {
    if (!fileOrFiles) return;
    const files = (fileOrFiles instanceof FileList || Array.isArray(fileOrFiles)) ? Array.from(fileOrFiles) : [fileOrFiles];
    if (files.length === 0) return;

    try {
      this.modalPhotoBase64List = [];
      for (const f of files) {
        const b64 = await PhotoManager.processImageFile(f);
        this.modalPhotoBase64List.push(b64);
      }
      this.modalPhotoBase64 = this.modalPhotoBase64List[0];

      const previewWrap = document.getElementById('modal-photo-preview-wrap');
      const previewImg = document.getElementById('modal-photo-preview-img');
      if (previewImg) previewImg.src = this.modalPhotoBase64;
      if (previewWrap) previewWrap.style.display = 'block';

      if (files.length > 1) {
        this.showToast(`📸 ${files.length} photos selected`);
      }
    } catch (e) {
      alert('Failed to process image file(s).');
    }
  }

  async confirmAttachModalPhoto() {
    const b64List = (this.modalPhotoBase64List && this.modalPhotoBase64List.length > 0) ? this.modalPhotoBase64List : (this.modalPhotoBase64 ? [this.modalPhotoBase64] : []);
    if (b64List.length === 0) {
      alert('Please select an image file first.');
      return;
    }

    this.uploadProgressMap = this.uploadProgressMap || new Map();
    const captionVal = (document.getElementById('modal-photo-caption')?.value || '').trim();
    const timestamp = CameraManager.getFormattedTimestamp ? CameraManager.getFormattedTimestamp() : new Date().toLocaleString('en-GB');

    if (this.activePhotoTarget) {
      // Row-Level Photo Target (Bearings, Gears, etc.)
      const isTargetEdit = !this.activePhotoTarget.isNew && this.activePhotoTarget.targetPhotoId;

      for (let i = 0; i < b64List.length; i++) {
        const photoMeta = {
          photoId: (isTargetEdit && i === 0) ? this.activePhotoTarget.targetPhotoId : undefined,
          sectionId: this.activePhotoTarget.sectionId,
          inspectionItemId: this.activePhotoTarget.itemId,
          slotId: this.activePhotoTarget.itemId,
          category: this.activePhotoTarget.sectionId === 'bearing-condition' ? 'Bearing Condition' : this.activePhotoTarget.sectionId === 'gear-condition' ? 'Gear Condition' : this.activePhotoTarget.sectionId === 'lubrication' ? 'Lubrication' : 'Turbine Identification',
          label: this.activePhotoTarget.label,
          pointName: this.activePhotoTarget.label,
          caption: (b64List.length > 1) ? `${captionVal || this.activePhotoTarget.defaultCaption || this.activePhotoTarget.label} (${i + 1}/${b64List.length})` : (captionVal || this.activePhotoTarget.defaultCaption || this.activePhotoTarget.label),
          url: b64List[i],
          timestamp: timestamp
        };

        const attached = PhotoManager.attachPhotoToItem(this.currentData, photoMeta, true);
        await PhotoDB.savePhoto({ id: attached.photoId, ...attached });

        // Asynchronous Firebase Cloud Storage upload with progress tracking
        const pId = attached.photoId;
        if (window.firebaseService && window.firebaseService.currentUser && window.firebaseService.isOnline) {
          this.uploadProgressMap.set(pId, 0);
          window.firebaseService.uploadPhotoToStorage(this.currentReportId, pId, attached.url, (pct) => {
            this.uploadProgressMap.set(pId, pct);
          }).then(async (url) => {
            this.uploadProgressMap.set(pId, 100);
            if (url && url.startsWith('http')) {
              const livePhoto = (this.currentData.photos || []).find(p => p && (p.photoId === pId || p.id === pId));
              if (livePhoto) {
                livePhoto.url = url;
                await PhotoDB.savePhoto({ id: livePhoto.photoId, ...livePhoto });
                this.debouncedSaveAndRender(false);
              }
            }
          }).catch(e => {
            this.uploadProgressMap.set(pId, 100);
            console.warn('Background photo storage upload notice:', e);
          });
        }
      }

      this.closeAddPhotoModal();
      this.renderBearingsTable();
      this.renderGearsTable();
      this.renderAuxiliaryTables();
      this.renderSectionPhotos();
      this.renderPhotoGrid();
      this.debouncedSaveAndRender();
      this.updateSectionIndicators();
      this.showToast(`✓ Attached ${b64List.length} photo(s) to ${this.activePhotoTarget.label}`);
      return;
    }

    // General Category / Custom Photo
    const cat = document.getElementById('modal-photo-category-select')?.value || 'Custom';
    let slotId, label, caption;

    if (cat === 'Custom') {
      const customTitle = (document.getElementById('modal-photo-custom-title')?.value || '').trim() || 'Custom Inspection Point';
      slotId = 'custom_' + Date.now();
      label = customTitle;
      caption = captionVal || customTitle;

      if (!this.currentData.customSlots) this.currentData.customSlots = [];
      this.currentData.customSlots.push({
        id: slotId,
        category: 'Custom',
        tag: `CUSTOM_${this.currentData.customSlots.length + 1}`,
        label: customTitle,
        defaultCaption: caption,
        isCustom: true
      });
    } else {
      slotId = document.getElementById('modal-photo-slot-select')?.value || 'slot_general';
      const slot = PhotoManager.getSlotById(slotId, this.currentData.customSlots || []);
      label = slot ? slot.label : 'Inspection Point';
      caption = captionVal || (slot ? slot.defaultCaption : 'Inspection Photo');
    }

    for (let i = 0; i < b64List.length; i++) {
      const newRecord = {
        sectionId: 'general',
        inspectionItemId: slotId,
        category: cat,
        label: label,
        pointName: label,
        caption: (b64List.length > 1) ? `${caption} (${i + 1}/${b64List.length})` : caption,
        url: b64List[i],
        timestamp: timestamp
      };

      const attached = PhotoManager.attachPhotoToItem(this.currentData, newRecord, true);
      await PhotoDB.savePhoto({ id: attached.photoId, ...attached });

      // Asynchronous Firebase Cloud Storage upload with progress tracking
      const pId = attached.photoId;
      if (window.firebaseService && window.firebaseService.currentUser && window.firebaseService.isOnline) {
        this.uploadProgressMap.set(pId, 0);
        window.firebaseService.uploadPhotoToStorage(this.currentReportId, pId, attached.url, (pct) => {
          this.uploadProgressMap.set(pId, pct);
        }).then(async (url) => {
          this.uploadProgressMap.set(pId, 100);
          if (url && url.startsWith('http')) {
            const livePhoto = (this.currentData.photos || []).find(p => p && (p.photoId === pId || p.id === pId));
            if (livePhoto) {
              livePhoto.url = url;
              await PhotoDB.savePhoto({ id: livePhoto.photoId, ...livePhoto });
              this.debouncedSaveAndRender(false);
            }
          }
        }).catch(e => {
          this.uploadProgressMap.set(pId, 100);
          console.warn('Background photo storage upload notice:', e);
        });
      }
    }

    this.closeAddPhotoModal();
    this.renderBearingsTable();
    this.renderGearsTable();
    this.renderAuxiliaryTables();
    this.renderPhotoGrid();
    this.debouncedSaveAndRender();
    this.updateSectionIndicators();
    this.showToast(`✓ Attached ${b64List.length} photo(s) to ${label}`);
  }

  // Batch Upload Multiple Inspection Photos
  async handleBatchUpload(fileList) {
    if (!fileList || fileList.length === 0) return;
    const files = Array.from(fileList);
    this.showToast(`⏳ Processing ${files.length} photo(s)...`);

    this.uploadProgressMap = this.uploadProgressMap || new Map();
    const timestamp = CameraManager.getFormattedTimestamp ? CameraManager.getFormattedTimestamp() : new Date().toLocaleString('en-GB');

    for (let i = 0; i < files.length; i++) {
      const file = files[i];
      try {
        const base64 = await PhotoManager.processImageFile(file);
        const cleanName = file.name ? file.name.replace(/\.[^/.]+$/, '').replace(/[-_]/g, ' ') : `Photo ${i + 1}`;
        const photoMeta = {
          sectionId: 'general',
          category: 'Custom',
          label: cleanName,
          pointName: cleanName,
          caption: cleanName,
          url: base64,
          timestamp: timestamp
        };

        const attached = PhotoManager.attachPhotoToItem(this.currentData, photoMeta, true);
        await PhotoDB.savePhoto({ id: attached.photoId, ...attached });

        const pId = attached.photoId;
        if (window.firebaseService && window.firebaseService.currentUser && window.firebaseService.isOnline) {
          this.uploadProgressMap.set(pId, 0);
          window.firebaseService.uploadPhotoToStorage(this.currentReportId, pId, attached.url, (pct) => {
            this.uploadProgressMap.set(pId, pct);
          }).then(async (url) => {
            this.uploadProgressMap.set(pId, 100);
            if (url && url.startsWith('http')) {
              const livePhoto = (this.currentData.photos || []).find(p => p && (p.photoId === pId || p.id === pId));
              if (livePhoto) {
                livePhoto.url = url;
                await PhotoDB.savePhoto({ id: livePhoto.photoId, ...livePhoto });
                this.debouncedSaveAndRender(false);
              }
            }
          }).catch(e => {
            this.uploadProgressMap.set(pId, 100);
            console.warn('Batch photo storage upload notice:', e);
          });
        }
      } catch (err) {
        console.error('Error processing batch image file:', file.name, err);
      }
    }

    const batchInput = document.getElementById('batch-photo-input');
    if (batchInput) batchInput.value = '';

    this.renderBearingsTable();
    this.renderGearsTable();
    this.renderAuxiliaryTables();
    this.renderSectionPhotos();
    this.renderPhotoGrid();
    this.debouncedSaveAndRender();
    this.updateSectionIndicators();
    this.showToast(`✓ Added ${files.length} photo(s) to report`);
  }

  // Real-Time Camera Snap & Attach Handler
  async onCameraCapture() {
    const snap = CameraManager.capturePhoto();
    if (!snap || !snap.url) return;

    this.uploadProgressMap = this.uploadProgressMap || new Map();
    const timestamp = snap.timestamp || (CameraManager.getFormattedTimestamp ? CameraManager.getFormattedTimestamp() : new Date().toLocaleString('en-GB'));
    const photoMeta = {
      sectionId: 'general',
      inspectionItemId: snap.slotId || ('cam_' + Date.now()),
      category: 'General',
      label: 'Camera Capture',
      pointName: 'Camera Capture',
      caption: `Live Inspection Capture (${timestamp})`,
      url: snap.url,
      timestamp: timestamp
    };

    const attached = PhotoManager.attachPhotoToItem(this.currentData, photoMeta, true);
    await PhotoDB.savePhoto({ id: attached.photoId, ...attached });

    const pId = attached.photoId;
    if (window.firebaseService && window.firebaseService.currentUser && window.firebaseService.isOnline) {
      this.uploadProgressMap.set(pId, 0);
      window.firebaseService.uploadPhotoToStorage(this.currentReportId, pId, attached.url, (pct) => {
        this.uploadProgressMap.set(pId, pct);
      }).then(async (url) => {
        this.uploadProgressMap.set(pId, 100);
        if (url && url.startsWith('http')) {
          const livePhoto = (this.currentData.photos || []).find(p => p && (p.photoId === pId || p.id === pId));
          if (livePhoto) {
            livePhoto.url = url;
            await PhotoDB.savePhoto({ id: livePhoto.photoId, ...livePhoto });
            this.debouncedSaveAndRender(false);
          }
        }
      }).catch(e => {
        this.uploadProgressMap.set(pId, 100);
        console.warn('Camera photo storage upload notice:', e);
      });
    }

    this.renderBearingsTable();
    this.renderGearsTable();
    this.renderAuxiliaryTables();
    this.renderSectionPhotos();
    this.renderPhotoGrid();
    this.debouncedSaveAndRender();
    this.updateSectionIndicators();
    this.showToast('✓ Photo captured and attached to report');
  }

  updatePhotoCaption(itemId, newCaption) {
    if (this.currentData.photos) {
      const photo = this.currentData.photos.find(p => p && (p.inspectionItemId === itemId || p.slotId === itemId || p.photoId === itemId));
      if (photo) {
        photo.caption = newCaption;
        this.debouncedSaveAndRender();
      }
    }
  }

  // ==========================================
  // REVIEW & QUALITY CHECK SCORECARD UX
  // ==========================================
  renderReviewSection() {
    const container = document.getElementById('review-scorecard-items');
    if (!container) return;

    const meta = this.currentData.meta || {};
    const turb = this.currentData.turbine || {};
    const gen = this.currentData.generalInfo || {};
    const lub = this.currentData.lubrication || {};
    const work = this.currentData.workPerformed || [];
    const bearings = this.currentData.bearingAssessment || [];
    const gears = this.currentData.gearAssessment || [];
    const customInspections = this.currentData.customInspections || [];
    const photos = (this.currentData.photos || []).filter(p => p && p.url);
    const sigs = this.currentData.signatures || {};
    const sum = this.currentData.summary || {};

    let bearingCautions = 0;
    let bearingDefects = 0;
    bearings.forEach(b => {
      const a = (b.assessment || '').toLowerCase();
      if (a.includes('caut') || a.includes('monitor')) bearingCautions++;
      if (a.includes('not') || a.includes('replace')) bearingDefects++;
    });

    let gearCautions = 0;
    let gearDefects = 0;
    gears.forEach(g => {
      const a = (g.assessment || '').toLowerCase();
      if (a.includes('caut') || a.includes('monitor')) gearCautions++;
      if (a.includes('not') || a.includes('replace')) gearDefects++;
    });

    const hasEngSig = !!(sigs.engineerSigUrl);
    const hasRevSig = !!(sigs.reviewerSigUrl);

    this.setElValue('rev-doc-no', meta.reportDocNo || 'TWT-10826');
    this.setElValue('rev-turbine-id', turb.turbineNumber ? `${turb.turbineNumber}${turb.padNumber ? ' (Pad: ' + turb.padNumber + ')' : ''}` : '—');
    this.setElValue('rev-customer', gen.customerName || '—');
    this.setElValue('rev-date', meta.reportDate || '—');
    this.setElValue('rev-prepared', meta.preparedBy || gen.inspector || gen.inspectorName || '—');
    this.setElValue('rev-released', meta.releasedBy || gen.reviewer || gen.reportReviewer || '—');

    const checkItems = [
      {
        sectionId: 'step-report-details',
        title: 'Report Setup & Identity',
        desc: `Doc #${meta.reportDocNo || 'None'} • Edition ${meta.edition || 'A'} • Date ${meta.reportDate || 'Unset'}`,
        status: meta.reportDocNo ? 'complete' : 'attention'
      },
      {
        sectionId: 'step-job-turbine',
        title: '2.1 Turbine / Absorption Information',
        desc: `Turbine ${turb.turbineNumber || 'None'} • Pad ${turb.padNumber || 'N/A'} • ${turb.turbineType || 'Type unassigned'}`,
        status: turb.turbineNumber ? 'complete' : 'attention'
      },
      {
        sectionId: 'step-lubrication',
        title: 'Lubrication & Operating Condition',
        desc: `${lub.gearboxOilType || 'Oil unassigned'} • Magnet: ${lub.debrisOnMagnet || 'Logged'}`,
        status: 'complete'
      },
      {
        sectionId: 'step-bearings',
        title: 'Condition of Bearings',
        desc: `${bearings.length} Bearings • ${bearingCautions} Caution(s), ${bearingDefects} Defect(s)`,
        status: 'complete'
      },
      {
        sectionId: 'step-gears',
        title: 'Condition of Gears & Auxiliaries',
        desc: `${gears.length} Mesh stages • ${gearCautions} Caution(s), ${gearDefects} Defect(s)`,
        status: 'complete'
      },
      {
        sectionId: 'step-inspections',
        title: 'New Inspection Hub',
        desc: `${customInspections.length} Subsystem & Component Inspection(s)`,
        status: 'complete'
      },
      {
        sectionId: 'step-photos',
        title: 'Photo Evidence Hub',
        desc: `${photos.length} Evidence photo(s) documented`,
        status: 'complete'
      },
      {
        sectionId: 'step-findings-signoff',
        title: '08. Executive Summary & Recommendations',
        desc: `Summary: ${sum.summaryText ? 'Logged' : 'Pending'} • Recommendation: ${sum.gearboxRecommendation ? 'Assigned' : 'Pending'}`,
        status: (sum.summaryText || sum.gearboxRecommendation) ? 'complete' : 'attention'
      },
      {
        sectionId: 'step-appendix',
        title: '10. Appendix - List of Definitions',
        desc: '17 Component abbreviations & 11 decision protocols defined',
        status: 'complete'
      }
    ];

    container.innerHTML = checkItems.map(item => `
      <div class="review-check-item" onclick="app.switchSection('${item.sectionId}')" title="Click to view and edit section">
        <div class="check-item-left">
          <span class="check-status-icon ${item.status === 'complete' ? 'text-success' : 'text-warning'}">
            ${item.status === 'complete' ? '✓' : '⚠️'}
          </span>
          <div>
            <div class="check-item-name">${item.title}</div>
            <div class="check-item-desc">${item.desc}</div>
          </div>
        </div>
        <span style="color: var(--primary); font-size: 0.8rem; font-weight: 700;">Edit →</span>
      </div>
    `).join('');

    const overallBadge = document.getElementById('review-overall-badge');
    if (overallBadge) {
      const isReady = !!meta.reportDocNo && !!turb.turbineNumber;
      overallBadge.innerText = isReady ? '✓ REPORT READY FOR RELEASE' : '⚠️ REPORT NEEDS ATTENTION';
      overallBadge.className = `report-lifecycle-badge ${isReady ? 'badge-ready' : 'badge-attention'}`;
    }
  }

  updateSectionIndicators() {
    let completedCount = 0;
    const workflowSections = ['step-report-asset', 'step-technical-inspection', 'step-finalize-report'];
    const total = workflowSections.length;

    // 1. Dashboard 01 Badge
    const badgeAsset = document.getElementById('badge-step-report-asset');
    if (badgeAsset) {
      const isComplete = !!(this.currentData?.meta?.reportDocNo && this.currentData?.generalInfo?.customerName);
      badgeAsset.innerText = isComplete ? '✓' : '●';
      badgeAsset.className = `step-state-badge ${isComplete ? 'state-complete' : 'state-current'}`;
      if (isComplete) completedCount++;
    }

    // 2. Dashboard 02 Badge
    const badgeTech = document.getElementById('badge-step-technical-inspection');
    if (badgeTech) {
      let cautions = (this.currentData?.bearingAssessment || []).filter(b => (b.assessment || '').includes('Caution') || (b.assessment || '').includes('Not')).length;
      if (cautions > 0) {
        badgeTech.innerText = `${cautions} ⚠️`;
        badgeTech.className = 'step-state-badge state-attention';
      } else {
        badgeTech.innerText = '✓';
        badgeTech.className = 'step-state-badge state-complete';
      }
      completedCount++;
    }

    // 3. Dashboard 03 Badge
    const badgeFinal = document.getElementById('badge-step-finalize-report');
    if (badgeFinal) {
      const photosCount = (this.currentData?.photos || []).filter(p => p && p.url).length;
      const isSigned = !!(this.currentData?.signatures?.engineer || this.currentData?.summary?.summaryText);
      badgeFinal.innerText = isSigned ? '✓' : `${photosCount} 📷`;
      badgeFinal.className = 'step-state-badge state-complete';
      completedCount++;
    }

    // 4. History Count Badge
    this.updateReportsCountBadge();

    // 5. Update Progress Bars (Sidebar + Top Global Header)
    const progressFill = document.getElementById('sidebar-progress-fill');
    const progressFraction = document.getElementById('sidebar-progress-fraction');
    const headerProgressFill = document.getElementById('header-progress-fill');
    const headerProgressFraction = document.getElementById('header-progress-fraction');
    const pct = Math.min(100, Math.round((completedCount / total) * 100));

    if (progressFill) progressFill.style.width = `${pct}%`;
    if (progressFraction) progressFraction.innerText = `${completedCount} / ${total} (${pct}%)`;
    if (headerProgressFill) headerProgressFill.style.width = `${pct}%`;
    if (headerProgressFraction) headerProgressFraction.innerText = `${completedCount}/${total} (${pct}%)`;
  }

  // ==========================================
  // AUTOSAVE, SYNC & GLOBAL EVENT LISTENERS
  // ==========================================
  attachGlobalListeners() {
    // 1. Delegated real-time event listeners on document for all [data-path] inputs
    document.addEventListener('input', (e) => {
      const target = e.target;
      if (!target || !target.getAttribute) return;
      const path = target.getAttribute('data-path');
      if (path && this.currentData) {
        this.setObjectPath(this.currentData, path, target.value);
        this.debouncedSaveAndRender();
      }
    });

    document.addEventListener('change', (e) => {
      const target = e.target;
      if (!target || !target.getAttribute) return;
      const path = target.getAttribute('data-path');
      if (path && this.currentData) {
        this.setObjectPath(this.currentData, path, target.value);
        this.debouncedSaveAndRender();
      }
    });

    // 2. Direct bindings for all [data-path] inputs
    const inputs = document.querySelectorAll('[data-path]');
    inputs.forEach(input => {
      input.addEventListener('input', (e) => {
        const path = e.target.getAttribute('data-path');
        const val = e.target.value;
        this.setObjectPath(this.currentData, path, val);
        this.debouncedSaveAndRender();
      });
    });

    // 3. Three-Dot dropdown toggle and actions
    const moreBtn = document.getElementById('btn-header-more');
    if (moreBtn && !moreBtn._bound) {
      moreBtn._bound = true;
      moreBtn.addEventListener('click', (e) => {
        e.stopPropagation();
        this.toggleOptionsDropdown();
      });
    }

    const importBtn = document.getElementById('btn-menu-import-json');
    if (importBtn && !importBtn._bound) {
      importBtn._bound = true;
      importBtn.addEventListener('click', () => this.triggerJSONImport());
    }

    const exportBtn = document.getElementById('btn-menu-export-json');
    if (exportBtn && !exportBtn._bound) {
      exportBtn._bound = true;
      exportBtn.addEventListener('click', () => this.exportCurrentReportJSON());
    }

    const templateBtn = document.getElementById('btn-menu-load-template');
    if (templateBtn && !templateBtn._bound) {
      templateBtn._bound = true;
      templateBtn.addEventListener('click', () => this.openTemplateModal());
    }

    const cleanBtn = document.getElementById('btn-menu-clean-report');
    if (cleanBtn && !cleanBtn._bound) {
      cleanBtn._bound = true;
      cleanBtn.addEventListener('click', () => this.createNewCleanReport());
    }

    const printBtn = document.getElementById('btn-menu-print-dialog');
    if (printBtn && !printBtn._bound) {
      printBtn._bound = true;
      printBtn.addEventListener('click', () => this.printReportViaBrowserDialog());
    }

    // 4. Close dropdowns on outside click
    document.addEventListener('click', (e) => {
      const dropdownWrap = document.getElementById('options-dropdown-wrap');
      if (dropdownWrap && !dropdownWrap.contains(e.target)) {
        dropdownWrap.classList.remove('active');
      }
    });

    // 4. Global Escape key to dismiss modals cleanly
    document.addEventListener('keydown', (e) => {
      if (e.key === 'Escape') {
        this.closeLoginModal();
        this.closeReportModal();
        this.closeAddPhotoModal();
        this.closeDeleteModal();
        this.closeSaveModal();
        this.closeCreateUserModal();
        this.closeAuthModal();
      }
    });
  }

  setObjectPath(obj, path, value) {
    if (!obj || !path) return;
    const parts = path.split('.');
    let curr = obj;
    for (let i = 0; i < parts.length - 1; i++) {
      if (!curr[parts[i]]) curr[parts[i]] = {};
      curr = curr[parts[i]];
    }
    curr[parts[parts.length - 1]] = value;

    if (path === 'meta.reportDocNo') {
      if (!value || value.trim() === '') {
        // Prevent accidental wiping of reportDocNo
        return;
      }
      curr[parts[parts.length - 1]] = value;
      if (obj) obj.documentNumber = value;
      this.setElValue('f-doc-no', value);
      this.setElValue('hdr-report-no', value);
      this.setElValue('rev-doc-no', value);
      this.setElValue('save-modal-doc-no', value);
    } else if (path === 'meta.preparedBy' || path === 'generalInfo.serviceEngineer' || path === 'generalInfo.inspectorName' || path === 'generalInfo.inspector') {
      if (!obj.meta) obj.meta = {};
      obj.meta.preparedBy = value;
      if (!obj.generalInfo) obj.generalInfo = {};
      obj.generalInfo.serviceEngineer = value;
      obj.generalInfo.inspectorName = value;
      obj.generalInfo.inspector = value;

      const el1 = document.getElementById('f-service-engineer');
      const el2 = document.getElementById('f-meta-prepared');
      const el3 = document.getElementById('sig-engineer-name');
      const el4 = document.getElementById('rev-prepared');
      const el5 = document.getElementById('modal-rel-prepared');

      if (el1 && el1.value !== value) el1.value = value;
      if (el2 && el2.value !== value) el2.value = value;
      if (el3 && el3.value !== value) el3.value = value;
      if (el4) el4.innerText = value || '—';
      if (el5 && el5.value !== value) el5.value = value;
    } else if (path === 'meta.releasedBy' || path === 'generalInfo.reportReviewer' || path === 'generalInfo.reviewer') {
      if (!obj.meta) obj.meta = {};
      obj.meta.releasedBy = value;
      if (!obj.generalInfo) obj.generalInfo = {};
      obj.generalInfo.reviewer = value;
      obj.generalInfo.reportReviewer = value;

      const el1 = document.getElementById('f-report-reviewer');
      const el2 = document.getElementById('f-meta-released');
      const el3 = document.getElementById('sig-reviewer-name');
      const el4 = document.getElementById('rev-released');
      const el5 = document.getElementById('modal-rel-released');

      if (el1 && el1.value !== value) el1.value = value;
      if (el2 && el2.value !== value) el2.value = value;
      if (el3 && el3.value !== value) el3.value = value;
      if (el4) el4.innerText = value || '—';
      if (el5 && el5.value !== value) el5.value = value;
    } else if (path === 'meta.gearboxPartNo') {
      const el1 = document.getElementById('f-gearbox-part');
      const el2 = document.getElementById('f-gearbox-nameplate');
      if (el1 && el1.value !== value) el1.value = value;
      if (el2 && el2.value !== value) el2.value = value;
    }
  }

  // ==========================================
  // SINGLE SOURCE OF TRUTH SYNCHRONIZER
  // ==========================================
  syncFormToCurrentData() {
    if (!this.currentData) return;

    // 1. Sync all active DOM inputs with [data-path]
    const inputs = document.querySelectorAll('[data-path]');
    inputs.forEach(input => {
      const path = input.getAttribute('data-path');
      if (path) {
        if (path === 'meta.reportDocNo' && (!input.value || input.value.trim() === '')) {
          // Never wipe reportDocNo if input is temporarily blank in DOM
          return;
        }
        const val = input.value;
        this.setObjectPath(this.currentData, path, val);
      }
    });

    // 2. Explicit scan for Prepared By & Released By inputs
    const prepInput = document.getElementById('f-meta-prepared') || document.getElementById('f-service-engineer') || document.getElementById('sig-engineer-name');
    if (prepInput) {
      this.setObjectPath(this.currentData, 'meta.preparedBy', prepInput.value);
    }
    const relInput = document.getElementById('f-meta-released') || document.getElementById('f-report-reviewer') || document.getElementById('sig-reviewer-name');
    if (relInput) {
      this.setObjectPath(this.currentData, 'meta.releasedBy', relInput.value);
    }

    // 2. Sync date inputs from picker calendars
    const reportDateCalendar = document.getElementById('f-report-date-calendar');
    if (reportDateCalendar && reportDateCalendar.value) {
      const stdDate = this.formatDateToStandard(reportDateCalendar.value);
      if (stdDate) {
        if (!this.currentData.meta) this.currentData.meta = {};
        this.currentData.meta.reportDate = stdDate;
      }
    }

    const startDateCalendar = document.getElementById('f-start-date-calendar');
    if (startDateCalendar && startDateCalendar.value) {
      const stdDate = this.formatDateToStandard(startDateCalendar.value);
      if (stdDate) {
        if (!this.currentData.generalInfo) this.currentData.generalInfo = {};
        this.currentData.generalInfo.startDate = stdDate;
      }
    }

    const endDateCalendar = document.getElementById('f-end-date-calendar');
    if (endDateCalendar && endDateCalendar.value) {
      const stdDate = this.formatDateToStandard(endDateCalendar.value);
      if (stdDate) {
        if (!this.currentData.generalInfo) this.currentData.generalInfo = {};
        this.currentData.generalInfo.endDate = stdDate;
      }
    }

    const commDateCalendar = document.getElementById('f-comm-date-calendar');
    if (commDateCalendar && commDateCalendar.value) {
      const stdDate = this.formatDateToStandard(commDateCalendar.value);
      if (stdDate) {
        if (!this.currentData.turbine) this.currentData.turbine = {};
        this.currentData.turbine.commissioningDate = stdDate;
      }
    }

    // 3. Sync signature canvases if drawn
    if (this.engSigPad && this.engSigPad.hasSignature && (!this.currentData.signatures || !this.currentData.signatures.engineerSigUrl || !this.currentData.signatures.engineerSigUrl.startsWith('data:image'))) {
      const engSig = this.engSigPad.getImageDataUrl();
      if (engSig) {
        if (!this.currentData.signatures) this.currentData.signatures = { engineerSigUrl: '', reviewerSigUrl: '' };
        this.currentData.signatures.engineerSigUrl = engSig;
      }
    }
    if (this.revSigPad && this.revSigPad.hasSignature && (!this.currentData.signatures || !this.currentData.signatures.reviewerSigUrl || !this.currentData.signatures.reviewerSigUrl.startsWith('data:image'))) {
      const revSig = this.revSigPad.getImageDataUrl();
      if (revSig) {
        if (!this.currentData.signatures) this.currentData.signatures = { engineerSigUrl: '', reviewerSigUrl: '' };
        this.currentData.signatures.reviewerSigUrl = revSig;
      }
    }

    // 4. Flush debounce timeout and write draft backup to localStorage.
    // NOTE: Do NOT call syncActiveReportToDB() here — callers are responsible for
    // cloud persistence. Calling it here causes a non-awaited concurrent Firestore
    // write alongside the caller's own awaited write (double-write race condition),
    // and produces a false 'Saved' indicator before the cloud write completes.
    clearTimeout(this.saveTimeout);
    this.saveDraftToLocalStorage(this.currentData, this.currentUser?.uid);
  }

  // ==========================================
  // DIGITAL SIGNATURES MANAGEMENT
  // ==========================================
  initSignaturePads() {
    if (typeof SignaturePad !== 'undefined') {
      const engCanvas = document.getElementById('sig-canvas-engineer');
      if (engCanvas && !this.engSigPad) {
        this.engSigPad = new SignaturePad('sig-canvas-engineer', null, (dataUrl) => {
          if (!this.currentData.signatures) this.currentData.signatures = { engineerSigUrl: '', reviewerSigUrl: '' };
          this.currentData.signatures.engineerSigUrl = dataUrl;
          this.renderSignaturesUI();
        });
      }
      const revCanvas = document.getElementById('sig-canvas-reviewer');
      if (revCanvas && !this.revSigPad) {
        this.revSigPad = new SignaturePad('sig-canvas-reviewer', null, (dataUrl) => {
          if (!this.currentData.signatures) this.currentData.signatures = { engineerSigUrl: '', reviewerSigUrl: '' };
          this.currentData.signatures.reviewerSigUrl = dataUrl;
          this.renderSignaturesUI();
        });
      }
    }
  }

  renderSignaturesUI() {
    this.initSignaturePads();

    const sigs = (this.currentData && this.currentData.signatures) || {};

    // Engineer Signature UI
    const engImg = document.getElementById('sig-preview-img-engineer');
    const engPh = document.getElementById('sig-placeholder-engineer');
    const engCanvas = document.getElementById('sig-canvas-engineer');

    if (sigs.engineerSigUrl) {
      if (engImg) {
        engImg.src = sigs.engineerSigUrl;
        engImg.style.display = 'block';
      }
      if (engPh) engPh.style.display = 'none';
      if (engCanvas) engCanvas.style.display = 'none';
    } else {
      if (engImg) {
        engImg.src = '';
        engImg.style.display = 'none';
      }
      if (engPh) engPh.style.display = 'block';
      if (engCanvas) {
        engCanvas.style.display = 'block';
        if (this.engSigPad) this.engSigPad.clear();
      }
    }

    // Reviewer Signature UI
    const revImg = document.getElementById('sig-preview-img-reviewer');
    const revPh = document.getElementById('sig-placeholder-reviewer');
    const revCanvas = document.getElementById('sig-canvas-reviewer');

    if (sigs.reviewerSigUrl) {
      if (revImg) {
        revImg.src = sigs.reviewerSigUrl;
        revImg.style.display = 'block';
      }
      if (revPh) revPh.style.display = 'none';
      if (revCanvas) revCanvas.style.display = 'none';
    } else {
      if (revImg) {
        revImg.src = '';
        revImg.style.display = 'none';
      }
      if (revPh) revPh.style.display = 'block';
      if (revCanvas) {
        revCanvas.style.display = 'block';
        if (this.revSigPad) this.revSigPad.clear();
      }
    }
  }

  async onSignatureFileUpload(type, inputEl) {
    if (inputEl && inputEl.files && inputEl.files[0]) {
      try {
        const file = inputEl.files[0];
        const dataUrl = await PhotoManager.processImageFile(file, 400, 200, 0.95);
        if (!this.currentData.signatures) this.currentData.signatures = { engineerSigUrl: '', reviewerSigUrl: '' };
        if (type === 'engineer') {
          this.currentData.signatures.engineerSigUrl = dataUrl;
        } else {
          this.currentData.signatures.reviewerSigUrl = dataUrl;
        }
        this.renderSignaturesUI();
        this.debouncedSaveAndRender();

        // Cloud Storage upload
        if (window.firebaseService && window.firebaseService.currentUser && window.firebaseService.isOnline) {
          window.firebaseService.uploadSignatureToStorage(this.currentReportId, type, dataUrl).then(url => {
            if (url && url.startsWith('http')) {
              if (type === 'engineer') this.currentData.signatures.engineerSigUrl = url;
              else this.currentData.signatures.reviewerSigUrl = url;
              this.syncActiveReportToDB();
            }
          }).catch(e => console.warn('Signature storage notice:', e));
        }

        this.showToast(`✓ Uploaded ${type === 'engineer' ? 'Lead Engineer' : 'Reviewer'} signature`);
      } catch (err) {
        console.error('Signature upload error:', err);
      }
      inputEl.value = '';
    }
  }

  clearSignature(type) {
    if (!this.currentData.signatures) this.currentData.signatures = { engineerSigUrl: '', reviewerSigUrl: '' };
    if (type === 'engineer') {
      this.currentData.signatures.engineerSigUrl = '';
    } else {
      this.currentData.signatures.reviewerSigUrl = '';
    }
    this.renderSignaturesUI();
    this.debouncedSaveAndRender();
    this.showToast(`Cleared ${type === 'engineer' ? 'Lead Engineer' : 'Reviewer'} signature`);
  }

  debouncedSaveAndRender() {
    this.setSaveStatus('saving');
    clearTimeout(this.saveTimeout);
    // Inner callback is async so setSaveStatus('saved') and renderPreview() only
    // fire AFTER syncActiveReportToDB() fully completes (including the Firestore write),
    // preventing a false 'Saved' indicator in the header autosave pill.
    this.saveTimeout = setTimeout(async () => {
      this.saveDraftToLocalStorage(this.currentData, this.currentUser?.uid);
      await this.syncActiveReportToDB();
      this.setSaveStatus('saved');
      this.renderPreview();
    }, 150);
  }

  setSaveStatus(status) {
    const indicator = document.getElementById('hdr-autosave-indicator');
    const text = document.getElementById('hdr-autosave-text');
    if (!indicator || !text) return;

    if (status === 'saving') {
      indicator.className = 'autosave-indicator saving';
      text.innerText = 'Saving...';
    } else {
      indicator.className = 'autosave-indicator saved';
      text.innerText = 'Saved';
    }
  }

  // ==========================================
  // OPTIONS DROPDOWN & PRESET TEMPLATES
  // ==========================================
  toggleOptionsDropdown() {
    const wrap = document.getElementById('options-dropdown-wrap');
    if (wrap) wrap.classList.toggle('active');
  }

  triggerJSONImport() {
    if (document.getElementById('options-dropdown-wrap')) {
      document.getElementById('options-dropdown-wrap').classList.remove('active');
    }
    const fileInput = document.getElementById('json-file-input');
    if (fileInput) {
      fileInput.value = '';
      fileInput.click();
    }
  }

  exportCurrentReportJSON() {
    if (document.getElementById('options-dropdown-wrap')) {
      document.getElementById('options-dropdown-wrap').classList.remove('active');
    }
    this.syncFormToCurrentData();
    const meta = (this.currentData && this.currentData.meta) || {};
    const filename = `${meta.reportDocNo || 'TWT-10826'}_${meta.edition || 'A'}_backup.json`;
    PDFExporter.exportJSON(this.currentData, filename);
    this.showToast('✓ Report backup exported as JSON.');
  }

  printReportViaBrowserDialog() {
    if (document.getElementById('options-dropdown-wrap')) {
      document.getElementById('options-dropdown-wrap').classList.remove('active');
    }
    this.syncFormToCurrentData();
    this.renderPreview();
    this.showToast('🖨️ Opening native browser print dialog...');
    PDFExporter.printToPDF();
  }

  openTemplateModal() {
    if (document.getElementById('options-dropdown-wrap')) {
      document.getElementById('options-dropdown-wrap').classList.remove('active');
    }
    const modal = document.getElementById('template-modal');
    if (modal) modal.classList.add('active');
  }

  closeTemplateModal() {
    const modal = document.getElementById('template-modal');
    if (modal) modal.classList.remove('active');
  }

  async confirmLoadTemplate() {
    const templateSelect = document.getElementById('modal-template-select');
    if (!templateSelect) return;
    const templateId = templateSelect.value;
    if (SAMPLE_REPORTS[templateId]) {
      let newDocNo = null;
      try {
        const allReps = (typeof ReportDB !== 'undefined' && typeof ReportDB.getAllReports === 'function') ? await ReportDB.getAllReports() : [];
        newDocNo = (typeof ReportIdManager !== 'undefined') ? ReportIdManager.generateDocumentNumber(new Date(), allReps) : `TWT-${Date.now().toString().slice(-5)}`;
      } catch (e) {
        newDocNo = `TWT-${Date.now().toString().slice(-5)}`;
      }
      const newReportId = (typeof ReportIdManager !== 'undefined') ? ReportIdManager.generateInternalReportId() : `rep_${Date.now()}`;
      const todayFormatted = (typeof ReportIdManager !== 'undefined') ? ReportIdManager.formatDateDDMMYYYY(new Date()) : new Date().toLocaleDateString('en-GB');

      this.currentData = JSON.parse(JSON.stringify(SAMPLE_REPORTS[templateId]));
      if (!this.currentData.signatures) {
        this.currentData.signatures = { engineerSigUrl: '', reviewerSigUrl: '' };
      }
      this.currentData.meta.reportDocNo = newDocNo;
      this.currentData.meta.reportId = newReportId;
      this.currentData.meta.edition = 'A';
      this.currentData.meta.reportDate = todayFormatted;
      if (!this.currentData.generalInfo) this.currentData.generalInfo = {};
      this.currentData.generalInfo.startDate = todayFormatted;
      this.currentData.generalInfo.endDate = todayFormatted;

      if (typeof PhotoManager !== 'undefined' && typeof PhotoManager.populateSamplePhotos === 'function') {
        PhotoManager.populateSamplePhotos(this.currentData);
      }

      this.currentReportId = newReportId;
      await this.syncActiveReportToDB('In Progress');

      this.saveDraftToLocalStorage(this.currentData, this.currentUser?.uid);
      this.closeTemplateModal();
      this.renderWorkspace();
      this.renderPreview();
      this.switchSection('step-report-asset');
      this.showToast(`Loaded Template: ${SAMPLE_REPORTS[templateId].meta?.templateName || templateId} (${newDocNo})`);
    }
  }

  async createNewCleanReport() {
    if (document.getElementById('options-dropdown-wrap')) {
      document.getElementById('options-dropdown-wrap').classList.remove('active');
    }
    if (confirm('Create a new clean service report? The current report will remain safely saved in your Reports History.')) {
      // 1. Fetch global sequential document number from Firestore atomic counter or fallback
      let newDocNo = null;
      try {
        if (window.firebaseService && window.firebaseService.currentUser && window.firebaseService.isOnline) {
          newDocNo = await window.firebaseService.getNextGlobalReportNumber();
        }
      } catch (e) {}
      if (!newDocNo) {
        try {
          const allReps = (typeof ReportDB !== 'undefined' && typeof ReportDB.getAllReports === 'function') ? await ReportDB.getAllReports() : [];
          newDocNo = (typeof ReportIdManager !== 'undefined') ? ReportIdManager.generateDocumentNumber(new Date(), allReps) : `TWT-${Date.now().toString().slice(-5)}`;
        } catch (e) {
          newDocNo = `TWT-${Date.now().toString().slice(-5)}`;
        }
      }
      const newReportId = (typeof ReportIdManager !== 'undefined') ? ReportIdManager.generateInternalReportId() : `rep_${Date.now()}`;
      const todayFormatted = (typeof ReportIdManager !== 'undefined') ? ReportIdManager.formatDateDDMMYYYY(new Date()) : new Date().toLocaleDateString('en-GB');

      this.currentData = JSON.parse(JSON.stringify(SAMPLE_REPORTS.clean_blank_report || SAMPLE_REPORTS.borescope_inspection_v110));
      this.currentData.photos = [];
      this.currentData.signatures = { engineerSigUrl: '', reviewerSigUrl: '' };
      this.currentData.meta.reportDocNo = newDocNo;
      this.currentData.meta.reportId = newReportId;
      this.currentData.meta.edition = 'A';
      this.currentData.meta.reportDate = todayFormatted;
      const engineerName = (window.firebaseService?.userProfile?.displayName) || (window.firebaseService?.currentUser?.displayName) || '';
      this.currentData.meta.preparedBy = engineerName;
      this.currentData.meta.releasedBy = '';
      this.currentData.meta.equipmentNo = '';
      this.currentData.meta.status = 'Draft';

      if (!this.currentData.generalInfo) this.currentData.generalInfo = {};
      this.currentData.generalInfo.startDate = todayFormatted;
      this.currentData.generalInfo.endDate = todayFormatted;
      this.currentData.generalInfo.inspector = engineerName;
      this.currentData.generalInfo.inspectorName = engineerName;
      this.currentData.generalInfo.serviceEngineer = engineerName;
      this.currentData.generalInfo.reviewer = '';
      this.currentData.generalInfo.reportReviewer = '';

      this.currentReportId = newReportId;
      await this.syncActiveReportToDB('Draft');

      this.saveDraftToLocalStorage(this.currentData, this.currentUser?.uid);
      this.renderWorkspace();
      this.renderPreview();
      this.switchSection('step-report-asset');
      this.showToast(`✓ Clean service report created: ${newDocNo}`);
    }
  }

  async handleJSONImport(files) {
    if (files && files[0]) {
      try {
        const data = await PDFExporter.importJSON(files[0]);
        if (!data || typeof data !== 'object') {
          throw new Error('Invalid or corrupted JSON file format.');
        }
        this.currentData = data;
        if (typeof PhotoManager !== 'undefined' && typeof PhotoManager.populateSamplePhotos === 'function') {
          PhotoManager.populateSamplePhotos(this.currentData);
        }
        this.currentReportId = (data.meta && data.meta.reportId) || `rep_${Date.now()}`;
        await this.syncActiveReportToDB(data.meta?.status || 'In Progress');
        this.saveDraftToLocalStorage(this.currentData, this.currentUser?.uid);
        this.renderWorkspace();
        this.renderPreview();
        this.switchSection('step-report-asset');
        this.showToast(`✓ Successfully imported report: ${data.meta?.reportDocNo || 'Custom'}`);
      } catch (err) {
        console.error('Import error:', err);
        alert(`Failed to import JSON: ${err.message}`);
      }
    }
  }

  // ==========================================
  // RELEASE WORKFLOW & PREVIEW MODALS
  // ==========================================
  openReleaseModal() {
    const meta = this.currentData.meta || {};
    const gen = this.currentData.generalInfo || {};
    const reportDate = meta.reportDate || this.getTodayDateFormatted();
    this.setElValue('modal-rel-date-calendar', this.formatDateToISO(reportDate));
    this.setElValue('modal-rel-prepared', meta.preparedBy || gen.inspector || gen.inspectorName || '');
    this.setElValue('modal-rel-released', meta.releasedBy || gen.reviewer || gen.reportReviewer || '');
    this.setElValue('modal-rel-equipment', meta.equipmentNo || '');
    this.setElValue('modal-rel-edition', meta.edition || 'A');

    const modal = document.getElementById('release-modal');
    if (modal) modal.classList.add('active');
  }

  closeReleaseModal() {
    const modal = document.getElementById('release-modal');
    if (modal) modal.classList.remove('active');
  }

  setModalTodayDate() {
    const todayISO = this.getTodayDateISO();
    this.setElValue('modal-rel-date-calendar', todayISO);
  }

  async confirmReleaseAndDownload() {
    this.syncFormToCurrentData();

    const calEl = document.getElementById('modal-rel-date-calendar');
    const dateVal = calEl ? this.formatDateToStandard(calEl.value) : this.getTodayDateFormatted();
    const prepVal = document.getElementById('modal-rel-prepared').value;
    const relVal = document.getElementById('modal-rel-released').value;
    const eqVal = document.getElementById('modal-rel-equipment').value;
    const edVal = document.getElementById('modal-rel-edition').value;

    if (!this.currentData.meta) this.currentData.meta = {};
    this.currentData.meta.reportDate = dateVal;
    this.currentData.meta.preparedBy = prepVal;
    this.currentData.meta.releasedBy = relVal;
    this.currentData.meta.equipmentNo = eqVal;
    this.currentData.meta.edition = edVal;
    this.currentData.meta.status = 'Released';

    // Sync other related sections
    if (!this.currentData.generalInfo) this.currentData.generalInfo = {};
    this.currentData.generalInfo.inspectorName = prepVal;
    this.currentData.generalInfo.serviceEngineer = prepVal;
    this.currentData.generalInfo.reportReviewer = relVal;

    await this.syncActiveReportToDB('Released');

    this.closeReleaseModal();
    this.renderWorkspace();
    this.renderPreview();
    this.showToast('✓ Metadata authorized. Generating high-resolution PDF...');

    setTimeout(() => {
      const filename = `${this.currentData.meta.reportDocNo || 'TWT-10826'}_${this.currentData.meta.edition || 'A'}.pdf`;
      PDFExporter.downloadPDF('report-preview-container', filename);
    }, 200);
  }

  // Live PDF Preview Modal
  openReportModal() {
    this.syncFormToCurrentData();
    this.modalCurrentPage = 1;
    this.isEditPreviewMode = false;
    const btn = document.getElementById('btn-toggle-edit-preview');
    if (btn) {
      btn.innerHTML = '✏️ Edit Preview';
      btn.classList.remove('btn-editing-active', 'btn-success');
      btn.classList.add('btn-outline');
    }
    this.renderPreview();
    const modal = document.getElementById('report-modal');
    if (modal) modal.classList.add('active');
  }

  closeReportModal() {
    if (this.isEditPreviewMode) {
      this.toggleEditPreviewMode();
    }
    const modal = document.getElementById('report-modal');
    if (modal) modal.classList.remove('active');
  }

  renderPreview() {
    const container = document.getElementById('report-preview-container');
    if (!container) return;
    try {
      container.innerHTML = ReportTemplate.renderFullReport(this.currentData);
      if (this.isEditPreviewMode) {
        container.classList.add('edit-preview-active');
        container._previewEditBound = false;
        this.initPreviewInlineEditing();
      } else {
        container.classList.remove('edit-preview-active');
      }
      this.applyZoom();
      this.updateModalPageSelector();
    } catch (err) {
      console.error('Preview render error:', err);
    }
  }

  // ==========================================
  // LIVE PDF PREVIEW INLINE EDITING WORKSPACE
  // ==========================================

  toggleEditPreviewMode() {
    const meta = (this.currentData && this.currentData.meta) || {};
    if (meta.status === 'Released') {
      alert('This report is officially Released and locked.\nTo make edits, please create a new Revision or duplicate the report from Reports History.');
      return;
    }

    this.isEditPreviewMode = !this.isEditPreviewMode;
    const btn = document.getElementById('btn-toggle-edit-preview');
    const container = document.getElementById('report-preview-container');

    if (this.isEditPreviewMode) {
      if (btn) {
        btn.innerHTML = '✓ Done Editing';
        btn.classList.add('btn-editing-active', 'btn-success');
        btn.classList.remove('btn-outline');
      }
      if (container) {
        container.classList.add('edit-preview-active');
      }
      this.initPreviewInlineEditing();
      this.showToast('✏️ Edit Preview Active: Click any field, caption, or decision to edit directly.');
    } else {
      if (btn) {
        btn.innerHTML = '✏️ Edit Preview';
        btn.classList.remove('btn-editing-active', 'btn-success');
        btn.classList.add('btn-outline');
      }
      if (container) {
        container.classList.remove('edit-preview-active');
      }
      this.showToast('✓ Preview locked to Read-Only mode.');
      this.renderWorkspace();
    }
  }

  initPreviewInlineEditing() {
    const container = document.getElementById('report-preview-container');
    if (!container) return;

    if (container._previewEditBound) return;
    container._previewEditBound = true;

    // Click handler for decisions and editable fields
    container.addEventListener('click', (e) => {
      if (!this.isEditPreviewMode) return;

      // 1. Decision toggle / cycle
      const decWrap = e.target.closest('[data-edit-decision]');
      if (decWrap) {
        e.preventDefault();
        e.stopPropagation();
        this.previewCycleDecision(decWrap.dataset.editDecision, decWrap);
        return;
      }

      // 2. Editable text field focus
      const editEl = e.target.closest('.preview-editable');
      if (editEl && !editEl.isContentEditable) {
        editEl.contentEditable = 'true';
        editEl.focus();
        editEl.classList.add('is-editing');
      }
    });

    // Live typing input handler
    container.addEventListener('input', (e) => {
      if (!this.isEditPreviewMode) return;
      const editEl = e.target.closest('.preview-editable');
      if (!editEl) return;

      this.setPreviewSaveStatus('saving');
      clearTimeout(this.previewSaveTimeout);
      this.previewSaveTimeout = setTimeout(() => {
        this.commitPreviewEdit(editEl, false);
      }, 400);
    });

    // Focusout / blur handler
    container.addEventListener('focusout', (e) => {
      if (!this.isEditPreviewMode) return;
      const editEl = e.target.closest('.preview-editable');
      if (editEl) {
        editEl.classList.remove('is-editing');
        editEl.contentEditable = 'false';
        this.commitPreviewEdit(editEl, true);
      }
    });

    // Keydown handler (Enter commits single line, Esc cancels)
    container.addEventListener('keydown', (e) => {
      if (!this.isEditPreviewMode) return;
      const editEl = e.target.closest('.preview-editable');
      if (!editEl) return;

      if (e.key === 'Enter' && editEl.dataset.editType !== 'textarea') {
        e.preventDefault();
        editEl.blur();
      } else if (e.key === 'Escape') {
        e.preventDefault();
        editEl.blur();
      }
    });
  }

  commitPreviewEdit(el, syncDashboard = true) {
    if (!el) return;

    if (el.dataset.editPath) {
      const path = el.dataset.editPath;
      const newVal = el.innerText.trim();
      this.setObjectPath(this.currentData, path, newVal);

      if (syncDashboard) {
        // Two-way synchronization with workspace dashboard form fields
        const matched = document.querySelectorAll(`[data-path="${path}"]`);
        matched.forEach(input => {
          if (input.value !== newVal) input.value = newVal;
        });

        // Sync header widgets if relevant
        if (path === 'meta.reportDocNo') {
          const hdrDoc = document.getElementById('hdr-report-no');
          if (hdrDoc) hdrDoc.innerText = newVal;
          const revDoc = document.getElementById('rev-doc-no');
          if (revDoc) revDoc.innerText = newVal;
        }
        if (path === 'turbine.turbineNumber') {
          const hdrTurb = document.getElementById('hdr-turbine-id');
          if (hdrTurb) hdrTurb.innerText = newVal;
        }
      }

      this.debouncedSaveAndRender(false);
      this.setPreviewSaveStatus('saved');
    } else if (el.dataset.editPhotoId) {
      const photoId = el.dataset.editPhotoId;
      const newCaption = el.innerText.trim();
      PhotoManager.updatePhotoCaption(this.currentData, photoId, newCaption);
      this.renderPhotoGrid();
      this.debouncedSaveAndRender(false);
      this.setPreviewSaveStatus('saved');
    }
  }

  previewCycleDecision(decisionPath, wrapEl) {
    const decisions = ['Acceptable', 'Caution', 'Not Acceptable', 'Monitor', 'Replace', 'Further Inspection Required'];
    const currentVal = wrapEl.dataset.currentVal || 'Acceptable';
    const curIdx = decisions.findIndex(d => d.toLowerCase() === currentVal.toLowerCase());
    const nextIdx = (curIdx + 1) % decisions.length;
    const nextVal = decisions[nextIdx];

    this.setObjectPath(this.currentData, decisionPath, nextVal);
    wrapEl.dataset.currentVal = nextVal;
    wrapEl.innerHTML = ReportTemplate.renderStatusBadge(nextVal);

    // Sync dashboard tables & indicators
    this.renderBearingsTable();
    this.renderGearsTable();
    this.renderAuxiliaryTables();
    this.updateSectionIndicators();
    this.debouncedSaveAndRender(false);
    this.setPreviewSaveStatus('saved');
    this.showToast(`Updated assessment to: ${nextVal}`);
  }

  async previewDeletePhoto(photoId) {
    if (!photoId) return;
    if (confirm('Remove this photo evidence from the report? This will automatically reflow the photo gallery.')) {
      PhotoManager.removePhotoById(this.currentData, photoId);
      await PhotoDB.deletePhoto(photoId);

      // Re-render preview (preserving edit mode)
      this.renderPreview();
      
      // Update dashboard components
      this.renderPhotoGrid();
      this.renderBearingsTable();
      this.renderGearsTable();
      this.renderAuxiliaryTables();
      this.renderSectionPhotos();
      this.updateSectionIndicators();
      this.debouncedSaveAndRender(false);
      this.setPreviewSaveStatus('saved');
      this.showToast('🗑️ Photo removed and gallery reflowed.');
    }
  }

  previewReplacePhoto(photoId) {
    this.activePreviewReplacePhotoId = photoId;
    const fileInput = document.getElementById('preview-photo-replace-input');
    if (fileInput) {
      fileInput.value = '';
      fileInput.click();
    }
  }

  async onPreviewPhotoFileSelected(inputEl) {
    if (!inputEl || !inputEl.files || !inputEl.files[0] || !this.activePreviewReplacePhotoId) return;
    const file = inputEl.files[0];
    try {
      this.setPreviewSaveStatus('saving');
      const base64Url = await PhotoManager.processImageFile(file, 1200, 900, 0.86);
      const timestamp = new Date().toLocaleString('en-GB');

      const updatedPhoto = PhotoManager.replacePhotoById(this.currentData, this.activePreviewReplacePhotoId, base64Url, timestamp);
      if (updatedPhoto) {
        await PhotoDB.savePhoto(updatedPhoto);
      }

      this.renderPreview();
      this.renderPhotoGrid();
      this.renderBearingsTable();
      this.renderGearsTable();
      this.renderAuxiliaryTables();
      this.renderSectionPhotos();
      this.debouncedSaveAndRender(false);
      this.setPreviewSaveStatus('saved');
      this.showToast('✓ Photo replaced successfully in preview.');
    } catch (err) {
      console.error('Photo replacement error:', err);
      this.showToast('Error processing replacement image.');
    }
    inputEl.value = '';
  }

  setPreviewSaveStatus(status) {
    const indicator = document.getElementById('preview-save-indicator');
    if (!indicator) return;
    if (status === 'saving') {
      indicator.className = 'autosave-indicator saving';
      indicator.innerHTML = '<span>●</span> Saving...';
    } else {
      indicator.className = 'autosave-indicator saved';
      indicator.innerHTML = '<span>●</span> Saved';
    }
  }

  updateModalPageSelector() {
    const pages = document.querySelectorAll('.report-page');
    this.modalTotalPages = pages.length || 5;
    const select = document.getElementById('modal-page-select');
    if (!select) return;

    let optionsHtml = '';
    pages.forEach((page, idx) => {
      const pageNum = idx + 1;
      const subBar = page.querySelector('.header-sub-bar');
      const title = subBar ? subBar.innerText.trim() : (pageNum === 1 ? 'Cover Page' : `Page ${pageNum}`);
      const label = `Page ${pageNum}: ${title}`;
      optionsHtml += `<option value="${pageNum}" ${this.modalCurrentPage === pageNum ? 'selected' : ''}>${label}</option>`;
    });
    select.innerHTML = optionsHtml;
  }

  scrollModalToPage(pageNum) {
    if (pageNum < 1 || pageNum > this.modalTotalPages) return;
    this.modalCurrentPage = pageNum;
    const pageEl = document.getElementById(`report-page-${pageNum}`);
    if (pageEl) {
      pageEl.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }
    const select = document.getElementById('modal-page-select');
    if (select) select.value = pageNum;
  }

  nextModalPage() {
    if (this.modalCurrentPage < this.modalTotalPages) {
      this.scrollModalToPage(this.modalCurrentPage + 1);
    }
  }

  prevModalPage() {
    if (this.modalCurrentPage > 1) {
      this.scrollModalToPage(this.modalCurrentPage - 1);
    }
  }

  zoomIn() {
    this.zoomLevel = Math.min(1.6, this.zoomLevel + 0.1);
    this.applyZoom();
  }

  zoomOut() {
    this.zoomLevel = Math.max(0.4, this.zoomLevel - 0.1);
    this.applyZoom();
  }

  zoomReset() {
    this.zoomLevel = 1.0;
    this.applyZoom();
  }

  applyZoom() {
    const container = document.getElementById('report-preview-container');
    const zoomText = document.getElementById('zoom-val-text');
    if (container) container.style.transform = `scale(${this.zoomLevel})`;
    if (zoomText) zoomText.innerText = `${Math.round(this.zoomLevel * 100)}%`;
  }

  showToast(message) {
    let toast = document.getElementById('app-toast');
    if (!toast) {
      toast = document.createElement('div');
      toast.id = 'app-toast';
      toast.className = 'toast-notification';
      document.body.appendChild(toast);
    }
    toast.innerHTML = message;
    toast.classList.add('show');
    clearTimeout(this.toastTimer);
    this.toastTimer = setTimeout(() => {
      toast.classList.remove('show');
    }, 2800);
  }

  // ==========================================
  // ADMIN USER MANAGEMENT METHODS (PRODUCTION GRADE)
  // ==========================================
  async renderUsersSection() {
    const tableBody = document.getElementById('users-table-body');
    const countDisplay = document.getElementById('users-count-display');

    // 1. Shimmer Skeleton Loading State
    const skeletonPlaceholder = '<span class="skeleton-box" style="width: 36px; height: 26px;"></span>';
    const setElHtml = (id, html) => {
      const el = document.getElementById(id);
      if (el) el.innerHTML = html;
    };

    setElHtml('users-stat-total', skeletonPlaceholder);
    setElHtml('users-stat-active', skeletonPlaceholder);
    setElHtml('users-stat-inactive', skeletonPlaceholder);
    setElHtml('users-stat-admins', skeletonPlaceholder);
    if (countDisplay) countDisplay.innerText = 'Loading users...';

    if (tableBody) {
      tableBody.innerHTML = Array(4).fill(0).map(() => `
        <tr>
          <td>
            <div class="user-cell-wrap">
              <div class="skeleton-box" style="width: 36px; height: 36px; border-radius: 50%;"></div>
              <div>
                <div class="skeleton-box" style="width: 130px; height: 14px; margin-bottom: 5px;"></div>
                <div class="skeleton-box" style="width: 80px; height: 10px;"></div>
              </div>
            </div>
          </td>
          <td><div class="skeleton-box" style="width: 170px; height: 14px;"></div></td>
          <td><div class="skeleton-box" style="width: 85px; height: 22px; border-radius: 6px;"></div></td>
          <td><div class="skeleton-box" style="width: 75px; height: 22px; border-radius: 12px;"></div></td>
          <td><div class="skeleton-box" style="width: 80px; height: 14px;"></div></td>
          <td style="text-align: right;"><div class="skeleton-box" style="width: 140px; height: 28px; border-radius: 6px;"></div></td>
        </tr>
      `).join('');
    }

    try {
      if (!window.firebaseService) {
        throw new Error('Firebase Service is not available.');
      }
      this.allCloudUsers = await window.firebaseService.getAllUsersFromCloud();

      // Compute exact counts from live data
      const total = this.allCloudUsers.length;
      const active = this.allCloudUsers.filter(u => (u.status || '').toLowerCase() === 'active').length;
      const inactive = this.allCloudUsers.filter(u => (u.status || '').toLowerCase() === 'inactive').length;
      const admins = this.allCloudUsers.filter(u => (u.role || '').toLowerCase() === 'admin').length;

      const setElTxt = (id, val) => {
        const el = document.getElementById(id);
        if (el) el.innerText = val;
      };

      setElTxt('users-stat-total', total);
      setElTxt('users-stat-active', active);
      setElTxt('users-stat-inactive', inactive);
      setElTxt('users-stat-admins', admins);
      setElTxt('users-badge-total-pill', `${total} account${total === 1 ? '' : 's'}`);

      this.renderUsersTable();
      this.populateTeamDatalists();
    } catch (err) {
      console.error('[USER_RENDER_ERROR] Error fetching users from Firestore:', err);
      const setElDash = (id) => {
        const el = document.getElementById(id);
        if (el) el.innerText = '—';
      };
      setElDash('users-stat-total');
      setElDash('users-stat-active');
      setElDash('users-stat-inactive');
      setElDash('users-stat-admins');
      setElDash('users-badge-total-pill');

      if (tableBody) {
        tableBody.innerHTML = `
          <tr>
            <td colspan="6">
              <div class="user-error-state">
                <div class="user-state-icon" style="color: #dc2626; background: #fee2e2;">
                  <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                    <circle cx="12" cy="12" r="10"></circle>
                    <line x1="12" y1="8" x2="12" y2="12"></line>
                    <line x1="12" y1="16" x2="12.01" y2="16"></line>
                  </svg>
                </div>
                <div class="user-state-title">Failed to Load User Accounts</div>
                <div class="user-state-desc">${err.message || 'Unable to connect to Cloud Firestore. Please verify your connection or permissions.'}</div>
                <button type="button" class="btn btn-outline" onclick="app.renderUsersSection()">
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                    <polyline points="23 4 23 10 17 10"></polyline>
                    <polyline points="1 20 1 14 7 14"></polyline>
                    <path d="M3.51 9a9 9 0 0 1 14.85-3.36L23 10M1 14l4.64 4.36A9 9 0 0 0 20.49 15"></path>
                  </svg>
                  <span>Retry</span>
                </button>
              </div>
            </td>
          </tr>
        `;
      }
    }
  }

  populateTeamDatalists() {
    const engDatalist = document.getElementById('team-engineers-datalist');
    const revDatalist = document.getElementById('team-reviewers-datalist');
    const users = this.allCloudUsers || [];

    if (engDatalist) {
      engDatalist.innerHTML = users
        .map(u => `<option value="${u.fullName || u.displayName || u.email}">${u.role ? `[${u.role.toUpperCase()}] ` : ''}${u.email || ''}</option>`)
        .join('');
    }

    if (revDatalist) {
      const reviewers = users.filter(u => ['reviewer', 'admin'].includes((u.role || '').toLowerCase()));
      revDatalist.innerHTML = (reviewers.length ? reviewers : users)
        .map(u => `<option value="${u.fullName || u.displayName || u.email}">${u.role ? `[${u.role.toUpperCase()}] ` : ''}${u.email || ''}</option>`)
        .join('');
    }
  }

  handleUsersSearch(query) {
    this.usersSearchQuery = (query || '').trim().toLowerCase();
    const clearBtn = document.getElementById('users-search-clear');
    if (clearBtn) {
      clearBtn.style.display = this.usersSearchQuery ? 'inline-block' : 'none';
    }
    this.renderUsersTable();
  }

  clearUsersSearch() {
    const input = document.getElementById('users-search-input');
    const clearBtn = document.getElementById('users-search-clear');
    if (input) input.value = '';
    if (clearBtn) clearBtn.style.display = 'none';
    this.usersSearchQuery = '';
    this.renderUsersTable();
  }

  setUsersRoleFilter(role) {
    this.usersRoleFilter = (role || 'all').toLowerCase();
    this.renderUsersTable();
  }

  setUsersStatusFilter(status) {
    this.usersStatusFilter = (status || 'all').toLowerCase();
    this.renderUsersTable();
  }

  resetUsersFilters() {
    const searchInput = document.getElementById('users-search-input');
    const roleSelect = document.getElementById('users-role-filter');
    const statusSelect = document.getElementById('users-status-filter');
    const clearBtn = document.getElementById('users-search-clear');

    if (searchInput) searchInput.value = '';
    if (roleSelect) roleSelect.value = 'all';
    if (statusSelect) statusSelect.value = 'all';
    if (clearBtn) clearBtn.style.display = 'none';

    this.usersSearchQuery = '';
    this.usersRoleFilter = 'all';
    this.usersStatusFilter = 'all';
    this.renderUsersTable();
  }

  renderUsersTable() {
    const tableBody = document.getElementById('users-table-body');
    const countDisplay = document.getElementById('users-count-display');
    if (!tableBody) return;

    let filtered = [...(this.allCloudUsers || [])];

    // Filter by Role
    if (this.usersRoleFilter && this.usersRoleFilter !== 'all') {
      filtered = filtered.filter(u => (u.role || '').toLowerCase() === this.usersRoleFilter);
    }

    // Filter by Status
    if (this.usersStatusFilter && this.usersStatusFilter !== 'all') {
      filtered = filtered.filter(u => (u.status || '').toLowerCase() === this.usersStatusFilter);
    }

    // Filter by Search Query (Name, Email, Role, UID)
    if (this.usersSearchQuery) {
      const q = this.usersSearchQuery;
      filtered = filtered.filter(u => {
        const name = (u.fullName || u.displayName || '').toLowerCase();
        const email = (u.email || '').toLowerCase();
        const role = (u.role || '').toLowerCase();
        const uid = (u.uid || '').toLowerCase();
        return name.includes(q) || email.includes(q) || role.includes(q) || uid.includes(q);
      });
    }

    // Update Footer Count
    if (countDisplay) {
      const totalCount = this.allCloudUsers.length;
      if (filtered.length === totalCount) {
        countDisplay.innerText = `Showing all ${totalCount} authorized account${totalCount === 1 ? '' : 's'}`;
      } else {
        countDisplay.innerText = `Showing ${filtered.length} of ${totalCount} account${totalCount === 1 ? '' : 's'}`;
      }
    }

    // Empty State Handling
    if (filtered.length === 0) {
      if (this.allCloudUsers.length === 0) {
        tableBody.innerHTML = `
          <tr>
            <td colspan="6">
              <div class="user-empty-state">
                <div class="user-state-icon">
                  <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                    <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"></path>
                    <circle cx="9" cy="7" r="4"></circle>
                  </svg>
                </div>
                <div class="user-state-title">No Users Found</div>
                <div class="user-state-desc">Create your first user to start managing team access and report workflows.</div>
                <button type="button" class="btn btn-primary btn-mgmt-create" onclick="app.openCreateUserModal()">
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><line x1="12" y1="5" x2="12" y2="19"></line><line x1="5" y1="12" x2="19" y2="12"></line></svg>
                  <span>Create First User</span>
                </button>
              </div>
            </td>
          </tr>
        `;
      } else {
        tableBody.innerHTML = `
          <tr>
            <td colspan="6">
              <div class="user-empty-state">
                <div class="user-state-icon">
                  <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                    <circle cx="11" cy="11" r="8"></circle>
                    <line x1="21" y1="21" x2="16.65" y2="16.65"></line>
                  </svg>
                </div>
                <div class="user-state-title">No Matching Users</div>
                <div class="user-state-desc">No authorized accounts matched your current search and filter criteria.</div>
                <button type="button" class="btn btn-outline" onclick="app.resetUsersFilters()">
                  <span>Reset Filters</span>
                </button>
              </div>
            </td>
          </tr>
        `;
      }
      return;
    }

    const currentUid = window.firebaseService?.currentUser?.uid;

    tableBody.innerHTML = filtered.map(user => {
      const role = (user.role || 'engineer').toLowerCase();
      const status = (user.status || 'active').toLowerCase();
      const isSelf = user.uid === currentUid;
      const initial = (user.fullName || user.displayName || user.email || 'U')[0].toUpperCase();
      
      const roleBadgeClass = role === 'admin' ? 'role-admin' : role === 'reviewer' ? 'role-reviewer' : 'role-engineer';
      const roleIconSvg = role === 'admin' 
        ? `<svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"></path></svg>`
        : role === 'reviewer'
        ? `<svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><circle cx="11" cy="11" r="8"></circle><line x1="21" y1="21" x2="16.65" y2="16.65"></line></svg>`
        : `<svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><path d="M14.7 6.3a1 1 0 0 0 0 1.4l1.6 1.6a1 1 0 0 0 1.4 0l3.77-3.77a6 6 0 0 1-7.94 7.94l-6.91 6.91a2.12 2.12 0 0 1-3-3l6.91-6.91a6 6 0 0 1 7.94-7.94l-3.76 3.76z"></path></svg>`;
      const roleLabel = role === 'admin' ? 'Administrator' : role === 'reviewer' ? 'Reviewer' : 'Engineer';
      
      const statusBadgeClass = status === 'active' ? 'status-active' : 'status-inactive';
      const statusDotClass = status === 'active' ? 'active' : 'inactive';
      const statusLabel = status === 'active' ? 'Active' : 'Inactive';

      let createdFormatted = '—';
      if (user.createdAt) {
        const dt = user.createdAt.toDate ? user.createdAt.toDate() : new Date(user.createdAt);
        if (!isNaN(dt.getTime())) {
          createdFormatted = dt.toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' });
        }
      }

      return `
        <tr>
          <td>
            <div class="user-cell-wrap">
              <div class="user-avatar-circle ${roleBadgeClass}">${initial}</div>
              <div>
                <div class="user-name-title">
                  <span>${user.fullName || user.displayName || 'Team Member'}</span>
                  ${isSelf ? '<span class="user-you-badge">You</span>' : ''}
                </div>
                <div class="user-uid-sub">${user.uid ? user.uid.substring(0, 10) + '...' : ''}</div>
              </div>
            </div>
          </td>
          <td>
            <span class="user-email-text">${user.email || '—'}</span>
          </td>
          <td>
            <span class="user-role-badge ${roleBadgeClass}">
              ${roleIconSvg}
              <span>${roleLabel}</span>
            </span>
          </td>
          <td>
            <span class="user-status-pill ${statusBadgeClass}">
              <span class="status-dot ${statusDotClass}"></span>
              <span>${statusLabel}</span>
            </span>
          </td>
          <td>
            <span style="font-size: 0.79rem; color: #64748b; font-weight: 550;">${createdFormatted}</span>
          </td>
          <td style="text-align: right;">
            <div class="user-action-btn-group">
              ${!isSelf ? `
                <button type="button" class="user-btn-action ${status === 'active' ? 'btn-toggle-deactivate' : 'btn-toggle-activate'}" onclick="app.handleToggleUserStatus('${user.uid}', '${status}', '${user.email}')" title="${status === 'active' ? 'Deactivate account access' : 'Activate account access'}">
                  ${status === 'active' ? `
                    <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><circle cx="12" cy="12" r="10"></circle><line x1="4.93" y1="4.93" x2="19.07" y2="19.07"></line></svg>
                    <span>Deactivate</span>
                  ` : `
                    <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><polyline points="20 6 9 17 4 12"></polyline></svg>
                    <span>Activate</span>
                  `}
                </button>
                <button type="button" class="user-btn-action" onclick="app.handleEditUserRole('${user.uid}', '${role}', '${user.email}')" title="Change system role">
                  <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2"><path d="M12 20h9"></path><path d="M16.5 3.5a2.121 2.121 0 0 1 3 3L7 19l-4 1 1-4L16.5 3.5z"></path></svg>
                  <span>Role</span>
                </button>
                <button type="button" class="user-btn-action btn-user-delete" onclick="app.handleDeleteUser('${user.uid}', '${user.email}')" title="Remove user from database">
                  <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2"><polyline points="3 6 5 6 21 6"></polyline><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"></path></svg>
                  <span>Delete</span>
                </button>
              ` : `
                <span class="active-session-pill">
                  <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><rect x="3" y="11" width="18" height="11" rx="2" ry="2"></rect><path d="M7 11V7a5 5 0 0 1 10 0v4"></path></svg>
                  <span>Active Admin</span>
                </span>
              `}
            </div>
          </td>
        </tr>
      `;
    }).join('');
  }

  openCreateUserModal() {
    const modal = document.getElementById('create-user-modal');
    const form = document.getElementById('create-user-form');
    const errBox = document.getElementById('create-user-error-box');
    if (form) form.reset();
    if (errBox) {
      errBox.style.display = 'none';
      errBox.innerText = '';
    }
    if (modal) modal.classList.add('active');
  }

  closeCreateUserModal() {
    const modal = document.getElementById('create-user-modal');
    if (modal) modal.classList.remove('active');
  }

  async submitCreateUser(e) {
    if (e && e.preventDefault) e.preventDefault();

    const fullNameInput = document.getElementById('new-user-fullname');
    const emailInput = document.getElementById('new-user-email');
    const passInput = document.getElementById('new-user-password');
    const roleSelect = document.getElementById('new-user-role');
    const statusSelect = document.getElementById('new-user-status');
    const errBox = document.getElementById('create-user-error-box');
    const submitBtn = document.getElementById('btn-submit-create-user');

    const fullName = fullNameInput ? fullNameInput.value.trim() : '';
    const email = emailInput ? emailInput.value.trim() : '';
    const password = passInput ? passInput.value.trim() : '';
    const role = roleSelect ? roleSelect.value : 'engineer';
    const status = statusSelect ? statusSelect.value : 'active';

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

    if (!fullName) {
      if (errBox) {
        errBox.innerText = 'Please enter the user full name.';
        errBox.style.display = 'flex';
      }
      return;
    }
    if (!email || !emailRegex.test(email)) {
      if (errBox) {
        errBox.innerText = 'Please enter a valid email address (e.g. engineer@thendral.com).';
        errBox.style.display = 'flex';
      }
      return;
    }
    if (!password || password.length < 6) {
      if (errBox) {
        errBox.innerText = 'Password must be at least 6 characters long.';
        errBox.style.display = 'flex';
      }
      return;
    }

    if (errBox) {
      errBox.style.display = 'none';
      errBox.innerText = '';
    }
    if (submitBtn) {
      submitBtn.disabled = true;
      submitBtn.innerHTML = `<span>⏳ Creating in Firebase Auth...</span>`;
    }

    try {
      await window.firebaseService.adminCreateUser({
        email,
        password,
        fullName,
        role,
        status
      });

      this.showToast(`✓ Created authenticated user: ${email} [${role.toUpperCase()}]`);
      this.closeCreateUserModal();
      await this.renderUsersSection();
    } catch (err) {
      console.error('[USER_CREATE_ERROR]', err);
      if (errBox) {
        errBox.innerText = err.message || 'Failed to create user account.';
        errBox.style.display = 'flex';
      }
    } finally {
      if (submitBtn) {
        submitBtn.disabled = false;
        submitBtn.innerHTML = `<span>+</span> <span>Create User Account</span>`;
      }
    }
  }

  async handleToggleUserStatus(uid, currentStatus, email) {
    const newStatus = currentStatus === 'active' ? 'inactive' : 'active';
    const promptMsg = currentStatus === 'active'
      ? `Deactivate account for ${email}? The user will be blocked from signing in.`
      : `Re-activate account for ${email}?`;

    if (!confirm(promptMsg)) return;

    try {
      await window.firebaseService.updateUserStatusInCloud(uid, newStatus);
      this.showToast(`✓ Account for ${email} marked ${newStatus.toUpperCase()}`);
      await this.renderUsersSection();
    } catch (err) {
      console.error('Error toggling status:', err);
      this.showToast(`⚠️ Error: ${err.message}`);
    }
  }

  async handleEditUserRole(uid, currentRole, email) {
    const choice = prompt(`Change system role for ${email}:\nEnter "engineer", "reviewer", or "admin":`, currentRole);
    if (!choice) return;

    const cleanRole = choice.trim().toLowerCase();
    if (!['engineer', 'reviewer', 'admin'].includes(cleanRole)) {
      alert('Invalid role. Must be "engineer", "reviewer", or "admin".');
      return;
    }

    try {
      await window.firebaseService.updateUserRoleInCloud(uid, cleanRole);
      this.showToast(`✓ Role for ${email} updated to ${cleanRole.toUpperCase()}`);
      await this.renderUsersSection();
    } catch (err) {
      console.error('Error updating role:', err);
      this.showToast(`⚠️ Error: ${err.message}`);
    }
  }

  async handleDeleteUser(uid, email) {
    if (!confirm(`Are you sure you want to remove user profile for ${email} from Firestore database?\n\nThis action cannot be undone.`)) {
      return;
    }

    try {
      await window.firebaseService.deleteUserFromCloud(uid);
      this.showToast(`✓ Removed user profile for ${email}`);
      await this.renderUsersSection();
    } catch (err) {
      console.error('Error deleting user:', err);
      this.showToast(`⚠️ Error: ${err.message}`);
    }
  }
}

// Global App Instance
let app;
if (typeof window !== 'undefined') {
  window.DashboardApp = DashboardApp;
  window.addEventListener('DOMContentLoaded', () => {
    app = new DashboardApp();
    window.app = app;
  });
}
if (typeof module !== 'undefined') {
  module.exports = { DashboardApp };
}
