/**
 * Thendral Wind Turbine Service Report Suite - Firebase Cloud Service Layer
 * Services:
 * - Firebase Authentication (Email/Password & Session Management)
 * - Cloud Firestore Database (Multi-Report Cloud Persistence & Multi-Tenant Isolation)
 * - Firebase Cloud Storage (Optimized Photo & Signature Storage)
 * - Offline-First Hybrid Sync (Firestore + IndexedDB fallback)
 */

const FIREBASE_CONFIG = {
  apiKey: "AIzaSyDtqtuDIBvqU57PSeg62fjBZKIvJdVzjaw",
  authDomain: "tnfl2-439c583f.firebaseapp.com",
  projectId: "tnfl2-439c583f",
  storageBucket: "tnfl2-439c583f.firebasestorage.app",
  messagingSenderId: "932017204911",
  appId: "1:932017204911:web:f9f7e694dd490665b3ae5a"
};

class FirebaseService {
  constructor() {
    this.app = null;
    this.auth = null;
    this.db = null;
    this.storage = null;
    this.currentUser = null;
    this.userProfile = null;
    this.isInitialized = false;
    this.isOnline = navigator.onLine;
    this.authListeners = [];
    this.isAuthResolved = false;
    this._resolveAuth = null;
    this.authResolvedPromise = new Promise((resolve) => {
      this._resolveAuth = resolve;
    });

    this.init();
  }

  init() {
    try {
      if (typeof firebase !== 'undefined' && !this.isInitialized) {
        if (!firebase.apps.length) {
          this.app = firebase.initializeApp(FIREBASE_CONFIG);
        } else {
          this.app = firebase.app();
        }

        this.auth = firebase.auth();
        this.db = firebase.firestore();
        this.storage = firebase.storage();

        // Enforce persistent browser session (IndexedDB / LocalStorage)
        try {
          if (this.auth && firebase.auth.Auth && firebase.auth.Auth.Persistence) {
            this.auth.setPersistence(firebase.auth.Auth.Persistence.LOCAL).catch((err) => {
              console.warn('[AUTH_WARN] Could not set explicit LOCAL persistence:', err);
            });
          }
        } catch (persErr) {
          console.warn('[AUTH_WARN] Auth persistence init warning:', persErr);
        }

        // Enable offline persistence for Firestore if available
        try {
          this.db.enablePersistence({ synchronizeTabs: true }).catch((err) => {
            if (err.code === 'failed-precondition') {
              console.warn('Firestore persistence failed: Multiple tabs open');
            } else if (err.code === 'unimplemented') {
              console.warn('Firestore persistence not supported by browser');
            }
          });
        } catch (e) {
          // Persistence setup catch
        }

        this.setupAuthStateListener();
        this.setupNetworkListeners();
        this.isInitialized = true;
        console.log('✓ Firebase Service initialized successfully with project:', FIREBASE_CONFIG.projectId);
      }
    } catch (err) {
      console.warn('Firebase initialization warning:', err);
    }
  }

  setupNetworkListeners() {
    window.addEventListener('online', () => {
      this.isOnline = true;
      if (window.app && typeof window.app.updateCloudSyncBadge === 'function') {
        window.app.updateCloudSyncBadge('online');
      }
    });
    window.addEventListener('offline', () => {
      this.isOnline = false;
      if (window.app && typeof window.app.updateCloudSyncBadge === 'function') {
        window.app.updateCloudSyncBadge('offline');
      }
    });
  }

  // ==========================================
  // AUTHENTICATION & USER PROFILE
  // ==========================================
  setupAuthStateListener() {
    if (!this.auth) return;
    this.auth.onAuthStateChanged(async (user) => {
      this.currentUser = user;
      if (user) {
        console.log(`[AUTH_04_AUTH_CURRENT_USER] onAuthStateChanged user detected: ${user.uid} (${user.email})`);
        
        // Immediate synchronous profile construction to prevent UI render blocking
        const cachedProfile = this.getCachedProfile(user.uid);
        this.userProfile = cachedProfile || {
          uid: user.uid,
          email: user.email || '',
          displayName: user.displayName || (user.email ? user.email.split('@')[0] : 'Engineer'),
          role: (user.email && user.email.toLowerCase().includes('reviewer')) ? 'reviewer' : 'admin',
          organization: 'Thendral Wind Tech LLP Dindigul'
        };

        try {
          localStorage.setItem('thendral_has_session', 'true');
        } catch (e) {}

        this.isAuthResolved = true;
        if (this._resolveAuth) {
          this._resolveAuth({ user: this.currentUser, profile: this.userProfile });
        }

        // Notify listeners immediately (0ms latency!)
        this.authListeners.forEach((callback) => {
          try {
            callback(this.currentUser, this.userProfile);
          } catch (e) {
            console.error('[AUTH_ERROR] Error in auth listener callback:', e);
          }
        });

        // Background synchronization with Firestore profile
        this.fetchOrCreateUserProfile(user).then((fullProfile) => {
          if (fullProfile) {
            this.userProfile = fullProfile;
            this.cacheProfile(user.uid, fullProfile);
            this.authListeners.forEach((callback) => {
              try {
                callback(this.currentUser, this.userProfile);
              } catch (e) {}
            });
          }
        }).catch((err) => {
          console.warn('[AUTH_WARN] Background profile fetch:', err);
        });

      } else {
        this.userProfile = null;
        this.isAuthResolved = true;
        try {
          localStorage.removeItem('thendral_has_session');
        } catch (e) {}

        if (this._resolveAuth) {
          this._resolveAuth({ user: null, profile: null });
        }

        this.authListeners.forEach((callback) => {
          try {
            callback(null, null);
          } catch (e) {
            console.error('[AUTH_ERROR] Error in auth listener callback:', e);
          }
        });
      }
    });
  }

  getCachedProfile(uid) {
    try {
      const raw = localStorage.getItem(`thendral_user_profile_${uid}`);
      return raw ? JSON.parse(raw) : null;
    } catch (e) {
      return null;
    }
  }

  cacheProfile(uid, profile) {
    try {
      localStorage.setItem(`thendral_user_profile_${uid}`, JSON.stringify(profile));
    } catch (e) {}
  }

  onAuthStateChanged(callback) {
    if (typeof callback === 'function') {
      this.authListeners.push(callback);
      // ONLY invoke callback immediately if Firebase has ALREADY resolved the auth state
      if (this.isAuthResolved) {
        callback(this.currentUser, this.userProfile);
      }
    }
  }

  async waitForAuth() {
    if (this.isAuthResolved) {
      return { user: this.currentUser, profile: this.userProfile };
    }
    return this.authResolvedPromise;
  }

  async signIn(email, password) {
    if (!this.auth) throw new Error('Firebase Auth is not initialized');
    console.log(`[AUTH_02_FIREBASE_AUTH_START] Calling signInWithEmailAndPassword for: ${email}`);
    
    const cred = await this.auth.signInWithEmailAndPassword(email.trim(), password);
    console.log(`[AUTH_03_FIREBASE_AUTH_SUCCESS] Firebase Auth successfully authenticated user`);
    console.log(`[AUTH_04_AUTH_CURRENT_USER] currentUser: ${cred.user?.email}`);
    console.log(`[AUTH_05_UID_RESOLVED] UID: ${cred.user?.uid}`);

    this.currentUser = cred.user;
    this.userProfile = await this.fetchOrCreateUserProfile(cred.user);
    return { user: this.currentUser, profile: this.userProfile };
  }

  async signUp(email, password, displayName = '', role = 'engineer') {
    if (!this.auth) throw new Error('Firebase Auth is not initialized');
    const cred = await this.auth.createUserWithEmailAndPassword(email.trim(), password);
    if (displayName && cred.user.updateProfile) {
      await cred.user.updateProfile({ displayName: displayName.trim() });
    }
    this.currentUser = cred.user;
    this.userProfile = await this.fetchOrCreateUserProfile(cred.user, {
      displayName: displayName.trim() || email.split('@')[0],
      role: role || 'engineer'
    });
    return { user: this.currentUser, profile: this.userProfile };
  }

  async signOut() {
    if (!this.auth) return;
    console.log('[AUTH_SIGNOUT] Signing out of Firebase Auth...');
    await this.auth.signOut();
    this.currentUser = null;
    this.userProfile = null;
  }

  async fetchOrCreateUserProfile(user, initialData = {}) {
    if (!user) return null;
    console.log(`[AUTH_06_FIRESTORE_USER_READ_START] Reading users/${user.uid} from Firestore...`);

    const now = new Date().toISOString();
    const fallbackProfile = {
      uid: user.uid,
      email: user.email || '',
      displayName: initialData.displayName || user.displayName || (user.email ? user.email.split('@')[0] : 'Admin'),
      role: 'admin',
      organization: 'Thendral Wind Tech LLP Dindigul',
      createdAt: now,
      lastLoginAt: now
    };

    if (!this.db) {
      console.warn('[AUTH_WARN] Firestore not initialized, returning memory profile');
      return fallbackProfile;
    }

    try {
      const userRef = this.db.collection('users').doc(user.uid);
      
      // 4-second timeout protection on Firestore read
      const timeoutPromise = new Promise((_, reject) => 
        setTimeout(() => reject(new Error('Firestore read timeout after 4s')), 4000)
      );

      const snap = await Promise.race([userRef.get(), timeoutPromise]).catch(err => {
        console.warn('[AUTH_WARN] Firestore user lookup timed out or errored:', err.message);
        return null;
      });

      const serverTs = (typeof firebase !== 'undefined' && firebase.firestore?.FieldValue?.serverTimestamp)
        ? firebase.firestore.FieldValue.serverTimestamp()
        : now;

      if (snap && snap.exists) {
        const data = snap.data();
        console.log(`[AUTH_07_FIRESTORE_USER_READ_SUCCESS] Found existing profile for users/${user.uid}:`, data);
        console.log(`[AUTH_08_ROLE_RESOLVED] Role from Firestore: ${data.role || 'admin'}`);
        
        // Update lastLoginAt asynchronously without blocking
        userRef.update({ lastLoginAt: serverTs }).catch(updateErr => {
          console.warn('[AUTH_WARN] Background lastLoginAt update skipped:', updateErr.message);
        });

        return { ...data, lastLoginAt: now, status: data.status || 'active' };
      } else {
        const assignedRole = initialData.role || (user.email && user.email.toLowerCase().includes('admin') ? 'admin' : 'admin');
        const newProfile = {
          uid: user.uid,
          email: user.email || '',
          displayName: initialData.displayName || user.displayName || (user.email ? user.email.split('@')[0] : 'Admin'),
          role: assignedRole,
          status: 'active',
          organization: initialData.organization || 'Thendral Wind Tech LLP Dindigul',
          createdAt: serverTs,
          lastLoginAt: serverTs
        };

        console.log(`[AUTH_07_FIRESTORE_USER_READ_SUCCESS] Creating new profile for users/${user.uid} with role: ${assignedRole}`);
        console.log(`[AUTH_08_ROLE_RESOLVED] Role assigned: ${assignedRole}`);

        // Write new profile to Firestore (with catch so it never throws on network lag)
        userRef.set(newProfile).then(() => {
          console.log(`✓ Synchronized new profile in Firestore: users/${user.uid}`);
        }).catch(setErr => {
          console.warn('[AUTH_WARN] Could not write profile to Firestore:', setErr.message);
        });

        return {
          ...newProfile,
          createdAt: now,
          lastLoginAt: now
        };
      }
    } catch (err) {
      console.warn('[AUTH_ERROR] Error fetching user profile from Firestore:', err);
      console.log(`[AUTH_08_ROLE_RESOLVED] Using fallback authorized profile for UID: ${user.uid}`);
      return fallbackProfile;
    }
  }

  // ==========================================
  // ADMIN USER MANAGEMENT
  // ==========================================
  async adminCreateUser({ email, password, fullName, role = 'engineer', status = 'active' }) {
    if (!this.auth || !this.db) {
      throw new Error('Firebase services are not initialized.');
    }
    if (!this.currentUser) {
      throw new Error('You must be signed in as an Administrator to create users.');
    }
    if (this.userProfile?.role !== 'admin') {
      throw new Error('Unauthorized: Only administrators have permission to create team users.');
    }

    const cleanEmail = (email || '').trim().toLowerCase();
    const cleanPassword = (password || '').trim();
    const cleanName = (fullName || '').trim() || cleanEmail.split('@')[0];
    const cleanRole = (role || 'engineer').toLowerCase();
    const cleanStatus = (status || 'active').toLowerCase();

    if (!cleanEmail || !cleanEmail.includes('@')) {
      throw new Error('Please enter a valid email address.');
    }
    if (!cleanPassword || cleanPassword.length < 6) {
      throw new Error('Password must be at least 6 characters long.');
    }
    const validRoles = ['admin', 'engineer', 'reviewer'];
    if (!validRoles.includes(cleanRole)) {
      throw new Error('Invalid role specified. Must be admin, engineer, or reviewer.');
    }

    console.log(`[USER_CREATE_START] Admin initiating real Firebase user creation for: ${cleanEmail}`);

    // Create Firebase Auth user via secondary app instance to preserve current admin login session
    const tempAppName = 'ThendralUserCreator_' + Date.now() + '_' + Math.floor(Math.random() * 1000);
    let tempApp = null;
    let newUid = null;

    try {
      tempApp = firebase.initializeApp(FIREBASE_CONFIG, tempAppName);
      const tempAuth = tempApp.auth();

      const userCred = await tempAuth.createUserWithEmailAndPassword(cleanEmail, cleanPassword);
      newUid = userCred.user.uid;
      console.log(`[USER_AUTH_CREATED] Created Firebase Auth user with UID: ${newUid}`);

      if (cleanName && userCred.user.updateProfile) {
        await userCred.user.updateProfile({ displayName: cleanName });
      }

      await tempAuth.signOut();
      await tempApp.delete();
      tempApp = null;
    } catch (authErr) {
      if (tempApp) {
        try { await tempApp.delete(); } catch(e) {}
      }
      console.error('[USER_AUTH_ERROR] Error creating Firebase Auth user:', authErr);
      if (authErr.code === 'auth/email-already-in-use') {
        throw new Error(`The email address "${cleanEmail}" is already registered in Firebase Authentication.`);
      } else if (authErr.code === 'auth/invalid-email') {
        throw new Error('The email address format is invalid.');
      } else if (authErr.code === 'auth/weak-password') {
        throw new Error('The password is too weak. Please use at least 6 characters.');
      }
      throw new Error(authErr.message || 'Failed to create Firebase Authentication user.');
    }

    // Now write the Firestore document in users/{newUid}
    try {
      const now = new Date().toISOString();
      const serverTs = (typeof firebase !== 'undefined' && firebase.firestore?.FieldValue?.serverTimestamp)
        ? firebase.firestore.FieldValue.serverTimestamp()
        : now;

      const userDoc = {
        uid: newUid,
        email: cleanEmail,
        displayName: cleanName,
        fullName: cleanName,
        role: cleanRole,
        status: cleanStatus,
        organization: 'Thendral Wind Tech LLP Dindigul',
        createdAt: serverTs,
        updatedAt: serverTs,
        createdBy: this.currentUser.uid,
        createdByEmail: this.currentUser.email || ''
      };

      await this.db.collection('users').doc(newUid).set(userDoc);
      console.log(`[USER_FIRESTORE_SUCCESS] Created Firestore document users/${newUid}`);
      
      return {
        ...userDoc,
        createdAt: now,
        updatedAt: now
      };
    } catch (fsErr) {
      console.error('[USER_FIRESTORE_ERROR] Error creating Firestore user document:', fsErr);
      throw new Error(`User authentication account created (${newUid}), but Firestore profile creation failed: ${fsErr.message}`);
    }
  }

  async getAllUsersFromCloud() {
    if (!this.db) return [];
    if (!this.currentUser) return [];

    try {
      console.log('[USER_FETCH_START] Fetching all user profiles from Firestore collection users...');
      const snapshot = await this.db.collection('users').get();
      const users = [];
      snapshot.forEach(doc => {
        const data = doc.data();
        users.push({
          id: doc.id,
          uid: doc.id,
          ...data
        });
      });

      // Sort by createdAt desc
      users.sort((a, b) => {
        const tA = (a.createdAt?.toDate ? a.createdAt.toDate() : new Date(a.createdAt || 0)).getTime();
        const tB = (b.createdAt?.toDate ? b.createdAt.toDate() : new Date(b.createdAt || 0)).getTime();
        return tB - tA;
      });

      console.log(`[USER_FETCH_SUCCESS] Fetched ${users.length} users from Firestore.`);
      return users;
    } catch (err) {
      console.error('[USER_FETCH_ERROR] Error fetching users from Firestore:', err);
      throw err;
    }
  }

  async updateUserStatusInCloud(uid, newStatus) {
    if (!this.db || !this.currentUser) throw new Error('Not authenticated');
    if (this.userProfile?.role !== 'admin') throw new Error('Unauthorized');

    const cleanStatus = (newStatus || 'active').toLowerCase();
    const serverTs = (typeof firebase !== 'undefined' && firebase.firestore?.FieldValue?.serverTimestamp)
      ? firebase.firestore.FieldValue.serverTimestamp()
      : new Date().toISOString();

    await this.db.collection('users').doc(uid).update({
      status: cleanStatus,
      updatedAt: serverTs
    });
    console.log(`[USER_STATUS_UPDATED] Set users/${uid} status to ${cleanStatus}`);
  }

  async updateUserRoleInCloud(uid, newRole) {
    if (!this.db || !this.currentUser) throw new Error('Not authenticated');
    if (this.userProfile?.role !== 'admin') throw new Error('Unauthorized');

    const cleanRole = (newRole || 'engineer').toLowerCase();
    const serverTs = (typeof firebase !== 'undefined' && firebase.firestore?.FieldValue?.serverTimestamp)
      ? firebase.firestore.FieldValue.serverTimestamp()
      : new Date().toISOString();

    await this.db.collection('users').doc(uid).update({
      role: cleanRole,
      updatedAt: serverTs
    });
    console.log(`[USER_ROLE_UPDATED] Set users/${uid} role to ${cleanRole}`);
  }

  async deleteUserFromCloud(uid) {
    if (!this.db || !this.currentUser) throw new Error('Not authenticated');
    if (this.userProfile?.role !== 'admin') throw new Error('Unauthorized');
    if (this.currentUser.uid === uid) throw new Error('You cannot delete your own Administrator account.');

    await this.db.collection('users').doc(uid).delete();
    console.log(`[USER_DELETED] Deleted users/${uid} from Firestore`);
  }

  // ==========================================
  // GLOBAL ATOMIC SEQUENTIAL REPORT NUMBERING
  // ==========================================
  async getNextGlobalReportNumber() {
    if (!this.db || !this.currentUser) {
      return null;
    }
    try {
      const counterRef = this.db.collection('counters').doc('twt_reports');
      const newNum = await this.db.runTransaction(async (transaction) => {
        const counterDoc = await transaction.get(counterRef);
        let currentSeq = 10825; // Base sequence start
        if (counterDoc.exists) {
          const data = counterDoc.data();
          if (typeof data.lastNumber === 'number' && data.lastNumber >= 10825) {
            currentSeq = data.lastNumber;
          }
        }
        const nextSeq = currentSeq + 1;
        transaction.set(counterRef, {
          lastNumber: nextSeq,
          lastAssignedAt: new Date().toISOString(),
          lastAssignedByUid: this.currentUser.uid,
          lastAssignedByName: this.userProfile?.displayName || this.currentUser.displayName || 'Admin'
        }, { merge: true });
        return nextSeq;
      });
      return `TWT-${newNum}`;
    } catch (err) {
      console.warn('Firestore atomic counter transaction warning (fallback to local manager):', err);
      return null;
    }
  }

  // ==========================================
  // CLOUD FIRESTORE REPORT PERSISTENCE
  // ==========================================
  async saveReportToCloud(reportRecord) {
    if (!this.db) throw new Error('Firestore is not initialized');
    if (!this.currentUser) throw new Error('User must be authenticated to save report to Cloud');

    const reportId = reportRecord.id || reportRecord.reportId || `rep_${Date.now()}`;
    const rawData = reportRecord.reportData || reportRecord.data || reportRecord;
    const meta = (rawData && rawData.meta) || {};
    const turb = (rawData && rawData.turbine) || {};
    const gen = (rawData && rawData.generalInfo) || {};
    const now = new Date().toISOString();

    const docRef = this.db.collection('reports').doc(reportId);
    let existingDoc = null;
    try {
      const snap = await docRef.get();
      if (snap.exists) existingDoc = snap.data();
    } catch (e) {
      // Offline/read error fallback
    }

    // Preserve original creator & creation timestamp if updating existing report
    const createdByUid = existingDoc?.createdByUid || reportRecord.createdByUid || reportRecord.auditMetadata?.createdByUid || this.currentUser.uid;
    const createdByName = existingDoc?.createdByName || reportRecord.createdByName || reportRecord.auditMetadata?.createdByName || this.userProfile?.displayName || this.currentUser.displayName || this.currentUser.email || 'Admin';
    const createdAt = existingDoc?.createdAt || reportRecord.createdAt || reportRecord.auditMetadata?.createdAt || now;
    
    // Preserve immutable Document Number (e.g. TWT-10826)
    const docNumber = existingDoc?.documentNumber || existingDoc?.metadata?.reportDocNo || reportRecord.documentNumber || meta.reportDocNo || 'TWT-10826';
    if (meta) meta.reportDocNo = docNumber;

    // Clean sanitized reportData to prevent Firestore rejecting undefined values
    const sanitizedData = JSON.parse(JSON.stringify(rawData));

    const reportDoc = {
      reportId: reportId,
      documentNumber: docNumber,
      edition: reportRecord.edition || meta.edition || existingDoc?.edition || 'A',
      status: reportRecord.status || meta.status || existingDoc?.status || 'Draft',
      templateId: meta.templateId || 'borescope_inspection_v110',

      metadata: {
        reportDocNo: docNumber,
        reportId: reportId,
        edition: meta.edition || reportRecord.edition || 'A',
        reportDate: meta.reportDate || reportRecord.reportDate || '',
        preparedBy: meta.preparedBy || this.userProfile?.displayName || this.currentUser.displayName || '',
        releasedBy: meta.releasedBy || '',
        gearboxPartNo: meta.gearboxPartNo || '',
        customerSerialNo: meta.customerSerialNo || '',
        equipmentNo: meta.equipmentNo || turb.turbineNumber || '',
        companyName: meta.companyName || 'THENDRAL WIND SERVICES',
        companyAddress: meta.companyAddress || 'Thendral Wind Tech LLP Dindigul',
        companyPhone: meta.companyPhone || '+91 4254 30 6000',
        companyEmail: meta.companyEmail || 'service.wind@thendral.com',
        companyWeb: meta.companyWeb || 'www.thendralwind.com'
      },

      customer: {
        customerName: gen.customerName || '',
        siteName: gen.siteName || '',
        contactPerson: gen.contactPerson || ''
      },

      generalInfo: sanitizedData.generalInfo || {},
      turbine: sanitizedData.turbine || turb || {},
      gearbox: sanitizedData.gearbox || {},
      lubrication: sanitizedData.lubrication || {},
      technicalMatrix: {
        bearingAssessment: sanitizedData.bearingAssessment || sanitizedData.bearings || [],
        bearingRemarks: sanitizedData.bearingRemarks || '',
        gearAssessment: sanitizedData.gearAssessment || sanitizedData.gears || [],
        gearRemarks: sanitizedData.gearRemarks || '',
        auxHousingBores: sanitizedData.auxHousingBores || [],
        auxShaftsJournals: sanitizedData.auxShaftsJournals || [],
        auxPlanetCarrier: sanitizedData.auxPlanetCarrier || []
      },
      customInspections: sanitizedData.customInspections || [],
      summary: sanitizedData.summary || {},
      signatures: sanitizedData.signatures || {},
      photos: sanitizedData.photos || [],
      reportData: sanitizedData,

      // Explicit Audit Metadata object standard
      auditMetadata: {
        createdByUid: createdByUid,
        createdByName: createdByName,
        createdAt: createdAt,
        updatedByUid: this.currentUser.uid,
        updatedByName: this.userProfile?.displayName || this.currentUser.displayName || this.currentUser.email || 'Admin',
        updatedAt: now,
        releasedAt: reportRecord.releasedAt || existingDoc?.releasedAt || (reportRecord.status === 'Released' ? now : null),
        expiresAt: reportRecord.expiresAt || existingDoc?.expiresAt || new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString()
      },

      // Direct Top-Level Audit fields
      createdByUid: createdByUid,
      createdByName: createdByName,
      updatedByUid: this.currentUser.uid,
      updatedByName: this.userProfile?.displayName || this.currentUser.displayName || this.currentUser.email || 'Admin',
      createdAt: createdAt,
      updatedAt: now,
      releasedAt: reportRecord.releasedAt || existingDoc?.releasedAt || (reportRecord.status === 'Released' ? now : null),
      expiresAt: reportRecord.expiresAt || existingDoc?.expiresAt || new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString(),
      isDeleted: false,
      isShared: true,
      visibility: 'team'
    };

    await docRef.set(reportDoc, { merge: true });
    return reportId;
  }

  async getAllReportsFromCloud() {
    if (!this.db || !this.currentUser) return [];

    try {
      const reportsRef = this.db.collection('reports');
      const snap = await reportsRef.get();
      const list = [];
      snap.forEach((doc) => {
        const d = doc.data();
        if (d.isDeleted === true) return;

        const gen = d.generalInfo || {};
        const cust = d.customer || {};
        list.push({
          id: d.reportId || doc.id,
          reportId: d.reportId || doc.id,
          documentNumber: d.documentNumber || d.metadata?.reportDocNo || 'TWT-10826',
          edition: d.edition || d.metadata?.edition || 'A',
          status: d.status || 'Draft',
          turbineNumber: d.turbine?.turbineNumber || '',
          turbineType: d.turbine?.turbineType || '',
          gearboxSerialNumber: d.metadata?.customerSerialNo || d.gearbox?.serialNumber || '',
          customerName: cust.customerName || gen.customerName || '',
          siteName: cust.siteName || gen.siteName || '',
          reportDate: d.metadata?.reportDate || d.reportDate || '',
          createdAt: d.createdAt,
          updatedAt: d.updatedAt,
          expiresAt: d.expiresAt,
          createdByUid: d.createdByUid,
          createdByName: d.createdByName,
          auditMetadata: d.auditMetadata,
          reportData: d.reportData || d
        });
      });

      list.sort((a, b) => new Date(b.updatedAt || 0) - new Date(a.updatedAt || 0));
      return list;
    } catch (err) {
      console.warn('Error fetching cloud reports:', err);
      return [];
    }
  }

  listenToReports(callback) {
    if (!this.db || !this.currentUser || typeof callback !== 'function') return () => {};

    try {
      const reportsRef = this.db.collection('reports');
      return reportsRef.onSnapshot((snap) => {
        const list = [];
        snap.forEach((doc) => {
          const d = doc.data();
          if (d.isDeleted === true) return;
          const gen = d.generalInfo || {};
          const cust = d.customer || {};
          list.push({
            id: d.reportId || doc.id,
            reportId: d.reportId || doc.id,
            documentNumber: d.documentNumber || d.metadata?.reportDocNo || 'TWT-10826',
            edition: d.edition || d.metadata?.edition || 'A',
            status: d.status || 'Draft',
            turbineNumber: d.turbine?.turbineNumber || '',
            turbineType: d.turbine?.turbineType || '',
            gearboxSerialNumber: d.metadata?.customerSerialNo || d.gearbox?.serialNumber || '',
            customerName: cust.customerName || gen.customerName || '',
            siteName: cust.siteName || gen.siteName || '',
            reportDate: d.metadata?.reportDate || d.reportDate || '',
            createdAt: d.createdAt,
            updatedAt: d.updatedAt,
            expiresAt: d.expiresAt,
            createdByUid: d.createdByUid,
            createdByName: d.createdByName,
            auditMetadata: d.auditMetadata,
            reportData: d.reportData || d
          });
        });
        list.sort((a, b) => new Date(b.updatedAt || 0) - new Date(a.updatedAt || 0));
        callback(list);
      }, (err) => {
        console.warn('Real-time report listener warning:', err);
      });
    } catch (e) {
      console.warn('Error setting up report listener:', e);
      return () => {};
    }
  }

  async getReportByIdFromCloud(reportId) {
    if (!this.db || !reportId) return null;
    try {
      const docRef = this.db.collection('reports').doc(reportId);
      const snap = await docRef.get();
      if (snap.exists) {
        const d = snap.data();
        if (d.isDeleted === true) return null;
        return {
          id: d.reportId || snap.id,
          reportId: d.reportId || snap.id,
          documentNumber: d.documentNumber || d.metadata?.reportDocNo || 'TWT-10826',
          edition: d.edition || d.metadata?.edition || 'A',
          status: d.status || 'Draft',
          turbineNumber: d.turbine?.turbineNumber || '',
          turbineType: d.turbine?.turbineType || '',
          gearboxSerialNumber: d.metadata?.customerSerialNo || '',
          customerName: d.customer?.customerName || '',
          siteName: d.customer?.siteName || '',
          reportDate: d.metadata?.reportDate || '',
          createdAt: d.createdAt,
          updatedAt: d.updatedAt,
          expiresAt: d.expiresAt,
          createdByUid: d.createdByUid,
          createdByName: d.createdByName,
          reportData: d.reportData || d
        };
      }
      return null;
    } catch (err) {
      console.warn('Error getting cloud report by ID:', err);
      return null;
    }
  }

  async deleteReportFromCloud(reportId) {
    if (!this.db || !reportId) throw new Error('Firestore is not initialized or invalid reportId');
    if (!this.currentUser) throw new Error('User must be authenticated to delete report from Cloud');

    const docRef = this.db.collection('reports').doc(reportId);
    
    // Check if document exists before deleting
    const snap = await docRef.get();
    if (snap.exists) {
      await docRef.delete();
      console.log(`✓ Permanently deleted report from Cloud Firestore: reports/${reportId}`);
    } else {
      console.log(`Report reports/${reportId} was not found in Firestore (already deleted).`);
    }
    return true;
  }

  // ==========================================
  // FIREBASE CLOUD STORAGE (PHOTOS & SIGNATURES)
  // ==========================================
  async uploadPhotoToStorage(reportId, photoId, base64DataUrl) {
    if (!this.storage || !base64DataUrl || !base64DataUrl.startsWith('data:image')) {
      return base64DataUrl; // Return as-is if storage unavailable or already a URL
    }
    if (!this.currentUser) {
      return base64DataUrl; // Fallback to local data URL if unauthenticated
    }

    try {
      const cleanReportId = reportId || 'rep_draft';
      const cleanPhotoId = photoId || `p_${Date.now()}`;
      const path = `reports/${cleanReportId}/photos/${cleanPhotoId}.jpg`;
      const storageRef = this.storage.ref(path);

      // Convert Base64 data URL to Blob
      const byteString = atob(base64DataUrl.split(',')[1]);
      const mimeString = base64DataUrl.split(',')[0].split(':')[1].split(';')[0];
      const ab = new ArrayBuffer(byteString.length);
      const ia = new Uint8Array(ab);
      for (let i = 0; i < byteString.length; i++) {
        ia[i] = byteString.charCodeAt(i);
      }
      const blob = new Blob([ab], { type: mimeString });

      const uploadTask = await storageRef.put(blob, {
        contentType: mimeString,
        customMetadata: {
          reportId: cleanReportId,
          photoId: cleanPhotoId,
          uploadedBy: this.currentUser.uid,
          uploadedAt: new Date().toISOString()
        }
      });

      const downloadURL = await uploadTask.ref.getDownloadURL();
      return downloadURL;
    } catch (err) {
      console.warn('Storage upload warning, fallback to Base64 data URL:', err);
      return base64DataUrl;
    }
  }

  async uploadSignatureToStorage(reportId, sigType, base64DataUrl) {
    if (!this.storage || !base64DataUrl || !base64DataUrl.startsWith('data:image')) {
      return base64DataUrl;
    }
    if (!this.currentUser) {
      return base64DataUrl;
    }

    try {
      const cleanReportId = reportId || 'rep_draft';
      const path = `reports/${cleanReportId}/signatures/${sigType}_${Date.now()}.png`;
      const storageRef = this.storage.ref(path);

      const byteString = atob(base64DataUrl.split(',')[1]);
      const mimeString = base64DataUrl.split(',')[0].split(':')[1].split(';')[0];
      const ab = new ArrayBuffer(byteString.length);
      const ia = new Uint8Array(ab);
      for (let i = 0; i < byteString.length; i++) {
        ia[i] = byteString.charCodeAt(i);
      }
      const blob = new Blob([ab], { type: mimeString });

      const uploadTask = await storageRef.put(blob, {
        contentType: mimeString,
        customMetadata: {
          reportId: cleanReportId,
          sigType: sigType,
          uploadedBy: this.currentUser.uid,
          uploadedAt: new Date().toISOString()
        }
      });

      const downloadURL = await uploadTask.ref.getDownloadURL();
      return downloadURL;
    } catch (err) {
      console.warn('Signature storage upload warning:', err);
      return base64DataUrl;
    }
  }
}

const firebaseService = new FirebaseService();
window.firebaseService = firebaseService;
