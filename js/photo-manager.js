/**
 * Thendral Wind Turbine Service Report Suite - Production Visual Evidence Hub
 * Client-Side IndexedDB Persistent Storage (Zero Fake Mock Images)
 */

// Frontend IndexedDB Store for High-Capacity Client-Side Image Storage
class ThendralImageStore {
  constructor(dbName = 'ThendralTurbinePhotosDB', storeName = 'report_photos') {
    this.dbName = dbName;
    this.storeName = storeName;
    this.db = null;
  }

  async openDB() {
    if (this.db) return this.db;
    return new Promise((resolve, reject) => {
      const request = indexedDB.open(this.dbName, 1);
      request.onupgradeneeded = (e) => {
        const db = e.target.result;
        if (!db.objectStoreNames.contains(this.storeName)) {
          db.createObjectStore(this.storeName, { keyPath: 'id' });
        }
      };
      request.onsuccess = (e) => {
        this.db = e.target.result;
        resolve(this.db);
      };
      request.onerror = (e) => reject(e.target.error);
    });
  }

  async savePhoto(photoObj) {
    try {
      const db = await this.openDB();
      return new Promise((resolve, reject) => {
        const tx = db.transaction([this.storeName], 'readwrite');
        const store = tx.objectStore(this.storeName);
        store.put(photoObj);
        tx.oncomplete = () => resolve(true);
        tx.onerror = (e) => reject(e.target.error);
      });
    } catch (err) {
      console.warn('IndexedDB save failed, fallback to memory:', err);
    }
  }

  async getAllPhotos() {
    try {
      const db = await this.openDB();
      return new Promise((resolve, reject) => {
        const tx = db.transaction([this.storeName], 'readonly');
        const store = tx.objectStore(this.storeName);
        const req = store.getAll();
        req.onsuccess = () => resolve(req.result || []);
        req.onerror = (e) => reject(e.target.error);
      });
    } catch (err) {
      return [];
    }
  }

  async deletePhoto(photoId) {
    try {
      const db = await this.openDB();
      return new Promise((resolve, reject) => {
        const tx = db.transaction([this.storeName], 'readwrite');
        const store = tx.objectStore(this.storeName);
        store.delete(photoId);
        tx.oncomplete = () => resolve(true);
        tx.onerror = (e) => reject(e.target.error);
      });
    } catch (err) {
      console.warn('IndexedDB delete error:', err);
    }
  }

  async clearAll() {
    try {
      const db = await this.openDB();
      return new Promise((resolve, reject) => {
        const tx = db.transaction([this.storeName], 'readwrite');
        const store = tx.objectStore(this.storeName);
        store.clear();
        tx.oncomplete = () => resolve(true);
        tx.onerror = (e) => reject(e.target.error);
      });
    } catch (err) {
      console.warn('IndexedDB clear error:', err);
    }
  }
}

const PhotoDB = new ThendralImageStore();

const PhotoManager = {
  // Pre-configured standard OEM inspection slots
  INSPECTION_SLOTS: [
    // 1. Identification & Operating Meters
    { id: 'slot_turbine_tag', category: 'Identification', tag: '0010_0010_Turbine number', label: 'Turbine Nacelle / ID Tag', defaultCaption: 'Turbine Nacelle Identification Tag' },
    { id: 'slot_pad_number', category: 'Identification', tag: '0010_0020_Pad Number', label: 'WTG Tower Pad Marker', defaultCaption: 'WTG Tower Foundation Pad Marker' },
    { id: 'slot_production_meter', category: 'Operating Meters', tag: '0010_0050_Total production', label: 'Total Production (kWh) Meter', defaultCaption: 'Active kWh Energy Production Counter' },
    { id: 'slot_run_hours', category: 'Operating Meters', tag: '0010_0060_Run hours', label: 'Total Run Hours Counter', defaultCaption: 'Cumulative Operating Run Hours' },

    // 2. Lubrication & Oil System Checks
    { id: 'slot_oil_level', category: 'Lubrication', tag: '0030_0050_Oil Level at Inspect', label: 'Oil Sight Glass Level Check', defaultCaption: 'Oil Level at Sight Glass Check' },
    { id: 'slot_magnet_debris', category: 'Lubrication', tag: '0030_0090_Debris on magnet', label: 'Magnetic Plug Swarf Inspection', defaultCaption: 'Magnetic Plug Metal Particle Swarf' },
    { id: 'slot_filter_debris', category: 'Lubrication', tag: '0030_0110_Debris in filter', label: 'Filter Housing / Element Check', defaultCaption: 'Main Inline Oil Filter Housing' },
    { id: 'slot_gearbox_turbine', category: 'Identification', tag: '0050_0010_Gearbox Nameplate', label: 'Gearbox Nameplate', defaultCaption: 'Gearbox Nameplate' },
    { id: 'slot_gearbox_cover', category: 'Identification', tag: '0050_0005_Gearbox_Cover', label: 'Gearbox', defaultCaption: 'Gearbox' },
    { id: 'slot_gearbox_nameplate', category: 'Identification', tag: '0050_0010_Gearbox Nameplate', label: 'Gearbox Nameplate', defaultCaption: 'Gearbox Nameplate' },

    // 3. High Speed & Intermediate Bearings (Borescope)
    { id: 'slot_6006_hss_gs', category: 'Borescope Bearings', tag: '6006_HSS GS', label: 'HSS GS Bearing (Gen Side)', defaultCaption: 'High Speed Shaft GS Bearing Raceway' },
    { id: 'slot_6005_hss_rs', category: 'Borescope Bearings', tag: '6005_HSS RS RS', label: 'HSS RS Bearing (Rotor Side)', defaultCaption: 'High Speed Shaft RS Bearing Raceway' },
    { id: 'slot_6004_hsis_gs_gs', category: 'Borescope Bearings', tag: '6004_HS-IS GS GS', label: 'HS-IS GS GS Bearing', defaultCaption: 'HS-IS GS GS Bearing Rollers' },
    { id: 'slot_6004_hsis_gs_rs', category: 'Borescope Bearings', tag: '6004_HS-IS GS RS', label: 'HS-IS GS RS Bearing', defaultCaption: 'HS-IS GS RS Bearing Rollers' },
    { id: 'slot_6003_hsis_rs', category: 'Borescope Bearings', tag: '6003_HS-IS RS', label: 'HS-IS RS Bearing', defaultCaption: 'HS-IS RS Intermediate Bearing' },
    { id: 'slot_6001_lsis_gs', category: 'Borescope Bearings', tag: '6001_LS-IS GS', label: 'LS-IS GS Bearing', defaultCaption: 'LS-IS GS Low Speed Intermediate' },
    { id: 'slot_6002_lsis_rs', category: 'Borescope Bearings', tag: '6002_LS-IS RS', label: 'LS-IS RS Bearing (Rotor Side)', defaultCaption: 'LS-IS RS Bearing Roller Path' },

    // 4. Planet Carrier & Planetary Bearings (Borescope)
    { id: 'slot_6032_pc_rs', category: 'Planet Bearings', tag: '6032_PC RS', label: 'Planet Carrier RS Bearing', defaultCaption: 'Planet Carrier Rotor Side Bearing' },
    { id: 'slot_6042_pg1_gs', category: 'Planet Bearings', tag: '6042_LSS-PG 1 GS', label: 'Planet 1 GS Bearing', defaultCaption: 'Planet Gear 1 Generator Side Bearing' },
    { id: 'slot_6042_pg1_rs', category: 'Planet Bearings', tag: '6042_LSS-PG 1 RS', label: 'Planet 1 RS Bearing', defaultCaption: 'Planet Gear 1 Rotor Side Bearing' },
    { id: 'slot_6042_pg2_gs', category: 'Planet Bearings', tag: '6042_LSS-PG 2 GS', label: 'Planet 2 GS Bearing', defaultCaption: 'Planet Gear 2 Generator Side Bearing' },
    { id: 'slot_6042_pg2_rs', category: 'Planet Bearings', tag: '6042_LSS-PG 2 RS', label: 'Planet 2 RS Bearing', defaultCaption: 'Planet Gear 2 Rotor Side Bearing' },
    { id: 'slot_6042_pg3_gs', category: 'Planet Bearings', tag: '6042_LSS-PG 3 GS', label: 'Planet 3 GS Bearing', defaultCaption: 'Planet Gear 3 Generator Side Bearing' },
    { id: 'slot_6042_pg3_rs', category: 'Planet Bearings', tag: '6042_LSS-PG 3 RS', label: 'Planet 3 RS Bearing', defaultCaption: 'Planet Gear 3 Rotor Side Bearing' },

    // 5. Gear Teeth Surface Inspection
    { id: 'slot_2741_ring_gear', category: 'Gear Teeth', tag: '2741_LSS-RG', label: 'LSS Ring Gear (Annulus)', defaultCaption: 'Internal Ring Gear (Annulus) Teeth' },
    { id: 'slot_2731_planet_1', category: 'Gear Teeth', tag: '2731_LSS-PG 1', label: 'Planet Gear 1 Teeth', defaultCaption: 'Planet Gear 1 Meshing Flanks' },
    { id: 'slot_2731_planet_2', category: 'Gear Teeth', tag: '2731_LSS-PG 2', label: 'Planet Gear 2 Teeth', defaultCaption: 'Planet Gear 2 Meshing Flanks' },
    { id: 'slot_2731_planet_3', category: 'Gear Teeth', tag: '2731_LSS-PG 3', label: 'Planet Gear 3 Teeth', defaultCaption: 'Planet Gear 3 Meshing Flanks' },
    { id: 'slot_2721_sun_pinion', category: 'Gear Teeth', tag: '2721_LSS-SU', label: 'Sun Pinion Gear Teeth', defaultCaption: 'Sun Pinion Center Gear Teeth' },
    { id: 'slot_2701_ls_ig', category: 'Gear Teeth', tag: '2701_LS-IG', label: 'Low Speed Intermediate Gear', defaultCaption: 'Low Speed Intermediate Gear Teeth' },
    { id: 'slot_2702_hs_is', category: 'Gear Teeth', tag: '2702_HS-IS', label: 'High Speed Intermediate Shaft', defaultCaption: 'High Speed Intermediate Shaft Flanks' },
    { id: 'slot_2703_hs_ig', category: 'Gear Teeth', tag: '2703_HS-IG', label: 'High Speed Intermediate Gear', defaultCaption: 'High Speed Intermediate Wheel Teeth' },
    { id: 'slot_2704_hss_pinion', category: 'Gear Teeth', tag: '2704_HSS', label: 'High Speed Shaft Pinion Teeth', defaultCaption: 'High Speed Shaft Output Pinion Teeth' }
  ],

  // Client-side high efficiency image compression with strict aspect ratio preservation
  processImageFile(file, maxWidth = 1200, maxHeight = 900, quality = 0.82) {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = (e) => {
        const img = new Image();
        img.onload = () => {
          const canvas = document.createElement('canvas');
          let width = img.width;
          let height = img.height;

          // True aspect-ratio-preserving proportional scale factor
          const scale = Math.min(1, maxWidth / width, maxHeight / height);
          width = Math.max(1, Math.round(width * scale));
          height = Math.max(1, Math.round(height * scale));

          canvas.width = width;
          canvas.height = height;
          const ctx = canvas.getContext('2d');
          ctx.drawImage(img, 0, 0, width, height);

          // Return compressed base64 JPEG
          resolve(canvas.toDataURL('image/jpeg', quality));
        };
        img.onerror = () => reject(new Error('Failed to load image file.'));
        img.src = e.target.result;
      };
      reader.onerror = () => reject(new Error('Failed to read image file.'));
      reader.readAsDataURL(file);
    });
  },

  // Helper: Get unique categories
  getCategories() {
    const cats = Array.from(new Set(this.INSPECTION_SLOTS.map(s => s.category)));
    cats.push('Custom');
    return cats;
  },

  // Helper: Get slots by category
  getSlotsByCategory(category, customSlots = []) {
    if (category === 'Custom') return customSlots;
    return this.INSPECTION_SLOTS.filter(s => s.category === category);
  },

  // Helper: Get slot by ID
  getSlotById(slotId, customSlots = []) {
    const all = this.INSPECTION_SLOTS.concat(customSlots);
    return all.find(s => s.id === slotId) || null;
  },

  // 8 Standardized Technical Report Inspection Categories
  TECHNICAL_CATEGORIES: [
    { id: 'turbine', title: '1. Turbine & Equipment Identification', sortOrder: 1 },
    { id: 'operating', title: '2. Operating Information & Meters', sortOrder: 2 },
    { id: 'lubrication', title: '3. Lubrication, Filtration & Magnetic Plug', sortOrder: 3 },
    { id: 'bearings', title: '4. Condition of Bearings', sortOrder: 4 },
    { id: 'gears', title: '5. Condition of Gears', sortOrder: 5 },
    { id: 'shafts', title: '6. Shafts, Housing Bores & Structural Components', sortOrder: 6 },
    { id: 'work', title: '7. Work Performed & Interventions', sortOrder: 7 },
    { id: 'custom', title: '8. Additional Technical Evidence', sortOrder: 8 }
  ],

  // Resolves the technical category group index (1..8) for any photo record
  getPhotoCategoryGroup(photo) {
    if (!photo) return { id: 'custom', title: '8. Additional Technical Evidence', sortOrder: 8 };
    const sec = (photo.sectionId || '').toLowerCase();
    const cat = (photo.category || '').toLowerCase();
    const tag = (photo.tag || '').toLowerCase();
    const slot = (photo.slotId || '').toLowerCase();
    const itemId = (photo.inspectionItemId || '').toLowerCase();

    if (sec === 'turbine-info' || sec === 'turbine-specs' || cat.includes('turbine') || cat.includes('nameplate') || tag.includes('0010_0010') || tag.includes('0010_0020') || tag.includes('0050_0010') || tag.includes('0050_0005') || slot.includes('nameplate') || slot.includes('gearbox') || itemId.includes('turbine') || itemId.includes('gearbox')) {
      return this.TECHNICAL_CATEGORIES[0];
    }
    if (sec === 'operating-info' || cat.includes('meter') || cat.includes('operating') || tag.includes('0010_0050') || tag.includes('0010_0060') || slot.includes('production') || slot.includes('run_hours') || itemId.includes('meter')) {
      return this.TECHNICAL_CATEGORIES[1];
    }
    if (sec === 'lubrication' || cat.includes('lubricat') || tag.includes('0030_') || slot.includes('oil') || slot.includes('magnet') || slot.includes('filter') || itemId.includes('oil') || itemId.includes('magnet')) {
      return this.TECHNICAL_CATEGORIES[2];
    }
    if (sec === 'bearing-condition' || cat.includes('bearing') || itemId.startsWith('b_') || itemId.includes('bearing') || (tag.startsWith('60') && !tag.includes('bore'))) {
      return this.TECHNICAL_CATEGORIES[3];
    }
    if (sec === 'gear-condition' || cat.includes('gear') || itemId.startsWith('g_') || itemId.includes('gear') || tag.startsWith('27')) {
      return this.TECHNICAL_CATEGORIES[4];
    }
    if (sec === 'shafts-bores' || cat.includes('shaft') || cat.includes('bore') || itemId.startsWith('bore_') || itemId.startsWith('shaft_') || itemId.startsWith('other_') || tag.includes('bore') || tag.includes('shaft') || tag.includes('8202') || tag.includes('9205')) {
      return this.TECHNICAL_CATEGORIES[5];
    }
    if (sec === 'work-scope' || cat.includes('work') || itemId.startsWith('work_')) {
      return this.TECHNICAL_CATEGORIES[6];
    }
    return this.TECHNICAL_CATEGORIES[7];
  },

  // Helper: Find photo attached to an inspection item
  getPhotoByItemId(photos, itemId) {
    if (!photos || !Array.isArray(photos) || !itemId) return null;
    return photos.find(p => p && (p.inspectionItemId === itemId || p.slotId === itemId || p.id === itemId)) || null;
  },

  // Helper: Find all photos attached to an inspection item
  getPhotosByItemId(photos, itemId) {
    if (!photos || !Array.isArray(photos) || !itemId) return [];
    return photos.filter(p => p && p.url && (p.inspectionItemId === itemId || p.slotId === itemId || p.id === itemId));
  },

  // Helper: Attach or replace photo linked to an item record
  attachPhotoToItem(report, photoMeta, allowMultiple = false) {
    if (!report.photos) report.photos = [];
    const itemId = photoMeta.inspectionItemId || photoMeta.slotId;
    
    // Check if replacing existing photo by specific photoId
    let existingIndex = -1;
    if (photoMeta.photoId) {
      existingIndex = report.photos.findIndex(p => p && p.photoId === photoMeta.photoId);
    } else if (!allowMultiple) {
      existingIndex = report.photos.findIndex(p => p && (p.inspectionItemId === itemId || (itemId && p.slotId === itemId)));
    }
    
    const normalizedRecord = {
      photoId: (existingIndex >= 0 && report.photos[existingIndex].photoId) ? report.photos[existingIndex].photoId : (photoMeta.photoId || 'p_' + Date.now() + '_' + Math.random().toString(36).substring(2, 9)),
      reportId: (report.meta && (report.meta.reportId || report.meta.reportDocNo)) || 'TWS-REP',
      sectionId: photoMeta.sectionId || 'general',
      inspectionItemId: itemId || '',
      slotId: photoMeta.slotId || itemId || '',
      category: photoMeta.category || 'General',
      identification: photoMeta.identification || '',
      location: photoMeta.location || '',
      label: photoMeta.label || photoMeta.pointName || 'Inspection Point',
      pointName: photoMeta.pointName || photoMeta.label || 'Inspection Point',
      caption: photoMeta.caption || '',
      timestamp: photoMeta.timestamp || new Date().toLocaleString('en-GB').replace(/,/g, ''),
      url: photoMeta.url,
      createdAt: (existingIndex >= 0 && report.photos[existingIndex].createdAt) ? report.photos[existingIndex].createdAt : (photoMeta.createdAt || new Date().toISOString())
    };

    if (existingIndex >= 0) {
      report.photos[existingIndex] = normalizedRecord;
    } else {
      report.photos.push(normalizedRecord);
    }
    return normalizedRecord;
  },

  // Helper: Remove photo linked to an item or direct ID
  removePhotoByItemId(report, itemId) {
    if (!report || !report.photos || !itemId) return;
    report.photos = report.photos.filter(p => p && p.inspectionItemId !== itemId && p.slotId !== itemId && p.id !== itemId && p.photoId !== itemId);
  },

  // Helper: Remove photo by unique photoId/slotId/id
  removePhotoById(report, photoId) {
    if (!report || !report.photos || !photoId) return false;
    const initialLen = report.photos.length;
    report.photos = report.photos.filter(p => p && p.photoId !== photoId && p.id !== photoId && p.slotId !== photoId && p.inspectionItemId !== photoId);
    return report.photos.length < initialLen;
  },

  // Helper: Update caption of a photo by photoId/slotId/id
  updatePhotoCaption(report, photoId, newCaption) {
    if (!report || !report.photos || !photoId) return false;
    const photo = report.photos.find(p => p && (p.photoId === photoId || p.id === photoId || p.slotId === photoId || p.inspectionItemId === photoId));
    if (photo) {
      photo.caption = (newCaption || '').trim();
      return true;
    }
    return false;
  },

  // Helper: Replace image data of a photo by photoId/slotId/id
  replacePhotoById(report, photoId, newUrl, newTimestamp = null) {
    if (!report || !report.photos || !photoId) return null;
    const photo = report.photos.find(p => p && (p.photoId === photoId || p.id === photoId || p.slotId === photoId || p.inspectionItemId === photoId));
    if (photo) {
      photo.url = newUrl;
      if (newTimestamp) photo.timestamp = newTimestamp;
      photo.updatedAt = new Date().toISOString();
      return photo;
    }
    return null;
  },

  // Helper: Get clean, human-readable display name for a photo record
  getPhotoDisplayName(photo, customSlots = []) {
    if (!photo) return 'Inspection Photo';
    const slotId = (photo.slotId || photo.inspectionItemId || '').toLowerCase();
    if (slotId === 'slot_gearbox_cover' || photo.sectionId === 'report-info') {
      return 'Gearbox';
    }
    if (slotId === 'slot_gearbox_turbine' || slotId === 'slot_gearbox_nameplate' || slotId === 'slot_gearbox_evidence') {
      return 'Gearbox Nameplate';
    }
    if (photo.pointName && photo.pointName.trim().length > 0) {
      return photo.pointName.trim();
    }
    if (photo.label && photo.label.trim().length > 0) {
      return photo.label.trim();
    }
    
    if (photo.identification && photo.location) {
      return `${photo.identification} — ${photo.location}`;
    }
    if (photo.identification) return photo.identification;

    if (photo.slotId) {
      const slot = this.getSlotById(photo.slotId, customSlots);
      if (slot && slot.label) return slot.label;
    }

    if (photo.tag) {
      const allSlots = this.INSPECTION_SLOTS.concat(customSlots || []);
      const slotByTag = allSlots.find(s => s.tag === photo.tag);
      if (slotByTag && slotByTag.label) return slotByTag.label;
    }

    if (photo.caption && photo.caption.trim().length > 0) {
      return photo.caption.trim();
    }
    if (photo.tag && photo.tag.trim().length > 0) return photo.tag.trim();
    return 'Inspection Point';
  },

  // Helper: Sort photos predictably for report output:
  // 1. Grouped by 8 Standard Technical Inspection Categories (1..8)
  // 2. Standard inspection-point sequence within each group
  // 3. Custom inspection points preserved
  sortPhotosForReport(photos, customSlots = []) {
    if (!photos || !Array.isArray(photos)) return [];
    
    const standardSlotOrder = new Map();
    this.INSPECTION_SLOTS.forEach((slot, idx) => {
      standardSlotOrder.set(slot.id, idx);
      standardSlotOrder.set(slot.tag, idx);
    });

    const customSlotOrder = new Map();
    (customSlots || []).forEach((slot, idx) => {
      customSlotOrder.set(slot.id, 1000 + idx);
      customSlotOrder.set(slot.tag, 1000 + idx);
    });

    return photos.slice().sort((a, b) => {
      const groupA = this.getPhotoCategoryGroup(a);
      const groupB = this.getPhotoCategoryGroup(b);

      if (groupA.sortOrder !== groupB.sortOrder) {
        return groupA.sortOrder - groupB.sortOrder;
      }

      const getOrderIndex = (p) => {
        if (!p) return 9999;
        if (p.slotId && standardSlotOrder.has(p.slotId)) return standardSlotOrder.get(p.slotId);
        if (p.tag && standardSlotOrder.has(p.tag)) return standardSlotOrder.get(p.tag);
        if (p.slotId && customSlotOrder.has(p.slotId)) return customSlotOrder.get(p.slotId);
        if (p.tag && customSlotOrder.has(p.tag)) return customSlotOrder.get(p.tag);
        if (p.isCustom || (p.slotId && p.slotId.startsWith('custom_'))) return 1500;
        if (p.slotId && p.slotId.startsWith('cam_')) return 1600;
        return 2000;
      };

      return getOrderIndex(a) - getOrderIndex(b);
    });
  },

  // Migration normalization: ensures all photos have photoId and proper labels
  populateSamplePhotos(report) {
    if (!report.photos) report.photos = [];
    report.photos.forEach((p, idx) => {
      if (!p.photoId) p.photoId = 'p_' + (idx + 1) + '_' + Date.now();
      if (!p.inspectionItemId && p.slotId) p.inspectionItemId = p.slotId;
      if (!p.label) p.label = this.getPhotoDisplayName(p, report.customSlots || []);
      if (!p.pointName) p.pointName = p.label;
    });
  }
};

/**
 * ReportIdManager - Offline-Safe Persistent Report Document Number & ID Generator
 * Standard: TWT-10826 (Auto-incrementing sequential format: TWT-10826, TWT-10827...)
 */
const ReportIdManager = {
  // Get YYYYMMDD string from date
  getDateKey(date = new Date()) {
    const d = (typeof date === 'string' && date.includes('.')) ? this.parseDateDDMMYYYY(date) : new Date(date);
    const validDate = isNaN(d.getTime()) ? new Date() : d;
    const year = validDate.getFullYear();
    const month = String(validDate.getMonth() + 1).padStart(2, '0');
    const day = String(validDate.getDate()).padStart(2, '0');
    return `${year}${month}${day}`;
  },

  // Get DD.MM.YYYY format
  formatDateDDMMYYYY(date = new Date()) {
    const d = (typeof date === 'string' && date.includes('-')) ? new Date(date) : (date instanceof Date ? date : new Date());
    const validDate = isNaN(d.getTime()) ? new Date() : d;
    const day = String(validDate.getDate()).padStart(2, '0');
    const month = String(validDate.getMonth() + 1).padStart(2, '0');
    const year = validDate.getFullYear();
    return `${day}.${month}.${year}`;
  },

  // Parse DD.MM.YYYY into Date
  parseDateDDMMYYYY(str) {
    if (!str || typeof str !== 'string') return new Date();
    const parts = str.split('.');
    if (parts.length === 3) {
      return new Date(parseInt(parts[2], 10), parseInt(parts[1], 10) - 1, parseInt(parts[0], 10));
    }
    return new Date(str);
  },

  // Get ISO YYYY-MM-DD format for date inputs
  formatDateISO(date = new Date()) {
    const d = (typeof date === 'string' && date.includes('.')) ? this.parseDateDDMMYYYY(date) : (date instanceof Date ? date : new Date(date));
    const validDate = isNaN(d.getTime()) ? new Date() : d;
    const year = validDate.getFullYear();
    const month = String(validDate.getMonth() + 1).padStart(2, '0');
    const day = String(validDate.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
  },

  // Generates next persistent immutable Document Number starting from TWT-10826 (e.g. TWT-10826, TWT-10827)
  generateDocumentNumber(dateObj = new Date(), existingReports = []) {
    const prefix = 'TWT-';
    const baseNumber = 10826;

    // 1. Scan existing reports in database for matching TWT- sequence numbers in the 10826+ range
    let maxSeq = baseNumber - 1;
    (existingReports || []).forEach(rep => {
      const docNo = (rep && rep.meta && rep.meta.reportDocNo) || (rep && rep.documentNumber) || (rep && rep.docNo) || '';
      if (docNo.startsWith(prefix)) {
        const numPart = docNo.replace(prefix, '').split('_')[0].split('-')[0];
        const num = parseInt(numPart, 10);
        if (!isNaN(num) && num >= baseNumber && num < 300000 && num > maxSeq) {
          maxSeq = num;
        }
      }
    });

    // 2. Scan persistent localStorage sequence tracker
    const storageKey = 'twt_document_seq_v2';
    let storedSeq = baseNumber - 1;
    try {
      storedSeq = parseInt(localStorage.getItem(storageKey) || String(baseNumber - 1), 10);
      if (isNaN(storedSeq) || storedSeq < baseNumber - 1 || storedSeq >= 300000) storedSeq = baseNumber - 1;
    } catch (e) {
      storedSeq = baseNumber - 1;
    }

    const nextSeq = Math.max(maxSeq, storedSeq) + 1;

    // 3. Persist new counter (never decremented upon deletion)
    try {
      localStorage.setItem(storageKey, String(nextSeq));
    } catch (e) {}

    return `${prefix}${nextSeq}`;
  },

  // Generates collision-safe internal Report ID for IndexedDB: TWS-REP-XXXXXXXX
  generateInternalReportId() {
    const timePart = Date.now().toString(36).toUpperCase();
    const randPart = Math.random().toString(36).substring(2, 6).toUpperCase();
    return `TWS-REP-${timePart}-${randPart}`;
  }
};

window.PhotoManager = PhotoManager;
window.PhotoDB = PhotoDB;
window.ReportIdManager = ReportIdManager;
